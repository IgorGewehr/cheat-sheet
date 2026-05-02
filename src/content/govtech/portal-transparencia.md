---
title: "Portal da Transparência: requisitos técnicos e legais (LAI)"
category: "govtech"
stack: ["Next.js", "NestJS", "PostgreSQL", "Redis", "TypeScript"]
tags: ["lai", "transparencia", "dados-abertos", "ssr", "cache", "sitemap", "csv", "siconfi"]
excerpt: "A Lei de Acesso à Informação (LAI 12.527/2011) obriga publicação proativa de dados públicos — TCE e CGU auditam. Este card cobre requisitos técnicos de SSR, formatos de exportação, cache para dias de pico e API de dados abertos."
---

## Visão Geral

O Portal da Transparência não é um feature opcional — é **obrigação constitucional** auditada pelo TCE estadual e CGU federal. Prefeituras que não publicam dados no prazo correto ou que têm portais inacessíveis são notificadas e podem ter contas reprovadas.

Dados de publicação obrigatória (LAI + LC 131/2009):
- Receitas (previsto vs realizado)
- Despesas (empenho, liquidação, pagamento)
- Contratos e aditivos
- Licitações (editais, resultados, dispensas)
- Servidores públicos (nome, cargo, salário bruto, descontos, líquido)
- Obras em andamento
- Transferências recebidas (convênios federais)

## Contexto B2G

O TCE usa **crawlers sem JavaScript** para auditoria automatizada — SSR não é diferencial de UX, é requisito técnico de compliance. Portais SPA (React puro sem SSR) falham nas auditorias automatizadas do TCE.

Calendário crítico de alta demanda:
- **Dia 5 de cada mês**: pagamento de fornecedores — pico de consultas de contratos
- **Dia 10**: pagamento de servidores — pico massivo (jornalistas, sindicatos, cidadãos)
- **31 de dezembro**: fechamento do exercício — relatórios anuais
- **Prazo de LOA/LDO**: publicação de orçamento

O portal não pode cair nesses dias. Cache + CDN é obrigatório.

## Quando usar

- Qualquer prefeitura com obrigação de transparência ativa (todas com mais de 10 mil habitantes)
- Integração com SICONFI (STN), SIOPS (saúde) quando a prefeitura recebe transferências federais
- Exportação de dados em formato aberto (CSV, JSON, XML) — exigência do Decreto 8.777/2016

## Trade-offs

| Abordagem | Indexabilidade TCE | Performance pico | Atualização de dados |
|-----------|-------------------|-----------------|---------------------|
| SSR puro (sem cache) | Excelente | Ruim — DB query por request | Tempo real |
| SSR + ISR (Incremental Static Regeneration) | Excelente | Excelente | A cada `revalidate` segundos |
| SSR + Redis cache | Excelente | Excelente | Manual (invalidar cache ao importar) |
| SPA puro (CSR) | Falha nas auditorias TCE | Bom após carregamento | Tempo real |

**Recomendação**: Next.js com ISR (revalidate por rota) + Redis para dados que mudam raramente (contratos, licitações encerradas) e sem cache para dados que precisam de atualização instantânea.

## Implementação

### Route Handler com cache de 1h e headers corretos

```typescript
// src/app/api/transparencia/despesas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDespesas } from "@/lib/transparencia/queries";
import { redis } from "@/lib/redis";
import { toCSV, toXML } from "@/lib/transparencia/formatters";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ano = searchParams.get("ano") ?? new Date().getFullYear().toString();
  const mes = searchParams.get("mes") ?? null;
  const formato = searchParams.get("formato") ?? "json"; // json | csv | xml
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") ?? "100"), 500);

  const cacheKey = `transparencia:despesas:${ano}:${mes ?? "all"}:${formato}:${page}:${perPage}`;

  // Cache de 1h para dados consolidados — nunca cachear mês corrente
  const isMesCorrente =
    mes === (new Date().getMonth() + 1).toString() &&
    ano === new Date().getFullYear().toString();
  const cacheTTL = isMesCorrente ? 300 : 3600; // 5min para mês corrente, 1h para histórico

  const cached = await redis.get(cacheKey);
  if (cached) {
    return buildResponse(formato, JSON.parse(cached), {
      "X-Cache": "HIT",
      "Cache-Control": `public, max-age=${cacheTTL}, stale-while-revalidate=${cacheTTL * 2}`,
    });
  }

  const despesas = await getDespesas({ ano, mes, page, perPage });

  await redis.setex(cacheKey, cacheTTL, JSON.stringify(despesas));

  return buildResponse(formato, despesas, {
    "X-Cache": "MISS",
    "Cache-Control": `public, max-age=${cacheTTL}, stale-while-revalidate=${cacheTTL * 2}`,
    "Access-Control-Allow-Origin": "*", // API pública de dados abertos
    "X-Robots-Tag": "index, follow",
  });
}

function buildResponse(
  formato: string,
  data: { items: Despesa[]; total: number; page: number; perPage: number },
  headers: Record<string, string>
) {
  if (formato === "csv") {
    const csv = toCSV(data.items);
    return new NextResponse(csv, {
      headers: {
        ...headers,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="despesas.csv"`,
      },
    });
  }

  if (formato === "xml") {
    const xml = toXML(data.items, "despesas");
    return new NextResponse(xml, {
      headers: {
        ...headers,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  }

  // JSON com metadados DCAT (padrão dados abertos gov.br)
  return NextResponse.json(
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Despesas Públicas",
      publisher: { name: "Prefeitura Municipal", url: "https://prefeitura.gov.br" },
      data: data.items,
      pagination: {
        total: data.total,
        page: data.page,
        perPage: data.perPage,
        totalPages: Math.ceil(data.total / data.perPage),
      },
    },
    { headers }
  );
}

interface Despesa {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  fornecedor: string;
  cnpjFornecedor: string;
  elemento: string;
  funcao: string;
  subfuncao: string;
  programa: string;
  acao: string;
}
```

### Geração de CSV, JSON e XML estruturado

```typescript
// src/lib/transparencia/formatters.ts

export function toCSV<T extends Record<string, unknown>>(items: T[]): string {
  if (items.length === 0) return "";

  // BOM UTF-8 para abrir corretamente no Excel
  const BOM = "﻿";

  const headers = Object.keys(items[0]);
  const rows = items.map((item) =>
    headers
      .map((h) => {
        const val = item[h];
        // Escapar aspas duplas e envolver em aspas se contiver vírgula/nova linha
        const str = val === null || val === undefined ? "" : String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );

  return BOM + [headers.join(","), ...rows].join("\r\n");
}

export function toXML<T extends Record<string, unknown>>(
  items: T[],
  rootTag: string
): string {
  const escapeXML = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const itemToXML = (item: T, tag: string): string => {
    const children = Object.entries(item)
      .map(([key, val]) => {
        const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
        const safeVal = val === null || val === undefined ? "" : escapeXML(String(val));
        return `    <${safeKey}>${safeVal}</${safeKey}>`;
      })
      .join("\n");
    return `  <${tag}>\n${children}\n  </${tag}>`;
  };

  const itemTag = rootTag.endsWith("s")
    ? rootTag.slice(0, -1) // despesas -> despesa
    : "item";

  return `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${items.map((item) => itemToXML(item, itemTag)).join("\n")}
</${rootTag}>`;
}
```

### Query de despesas com SSR e ISR

```tsx
// src/app/transparencia/despesas/page.tsx
import { Suspense } from "react";
import { getDespesas } from "@/lib/transparencia/queries";

// ISR: revalidar a cada 1 hora (dados do mês corrente)
export const revalidate = 3600;

// Metadados para indexação pelo TCE/CGU
export const metadata = {
  title: "Despesas Públicas | Portal da Transparência",
  description: "Consulta de despesas públicas municipais conforme Lei 12.527/2011",
  robots: "index, follow",
};

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string; page?: string }>;
}) {
  const params = await searchParams;
  const ano = params.ano ?? new Date().getFullYear().toString();
  const mes = params.mes ?? null;
  const page = parseInt(params.page ?? "1");

  const despesas = await getDespesas({ ano, mes, page, perPage: 50 });

  return (
    <main id="main-content">
      {/* Breadcrumb para SEO + acessibilidade */}
      <nav aria-label="Localização">
        <ol>
          <li><a href="/">Início</a></li>
          <li><a href="/transparencia">Transparência</a></li>
          <li aria-current="page">Despesas</li>
        </ol>
      </nav>

      <h1>Despesas Públicas</h1>

      {/* Links de exportação (SSR — indexáveis) */}
      <div role="group" aria-label="Exportar dados">
        <a href={`/api/transparencia/despesas?ano=${ano}&formato=csv`} download>
          Exportar CSV
        </a>
        <a href={`/api/transparencia/despesas?ano=${ano}&formato=json`}>
          Exportar JSON
        </a>
        <a href={`/api/transparencia/despesas?ano=${ano}&formato=xml`}>
          Exportar XML
        </a>
      </div>

      {/* Tabela acessível e indexável */}
      <table aria-label="Despesas Públicas">
        <caption className="sr-only">
          Listagem de despesas públicas do exercício {ano}
          {mes ? ` mês ${mes}` : ""} — {despesas.total} registros
        </caption>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Descrição</th>
            <th scope="col">Fornecedor</th>
            <th scope="col">CNPJ</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {despesas.items.map((d) => (
            <tr key={d.id}>
              <td>{new Date(d.data).toLocaleDateString("pt-BR")}</td>
              <td>{d.descricao}</td>
              <td>{d.fornecedor}</td>
              <td>{d.cnpjFornecedor}</td>
              <td>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(d.valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

### Sitemap dinâmico (obrigatório para TCE crawlers)

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  // Páginas estáticas obrigatórias da LAI
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/transparencia`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/transparencia/receitas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/transparencia/despesas`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/transparencia/contratos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/transparencia/licitacoes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/transparencia/servidores`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/transparencia/obras`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/ouvidoria`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/sic`, changeFrequency: "monthly", priority: 0.6 }, // Serviço de Informação ao Cidadão
  ];

  // Páginas dinâmicas de contratos (indexação individual para TCE)
  const contratos = await db.query<{ id: string; updated_at: Date }[]>(
    `SELECT id, updated_at FROM contratos ORDER BY updated_at DESC LIMIT 1000`
  );

  const contratoPages: MetadataRoute.Sitemap = contratos.map((c) => ({
    url: `${baseUrl}/transparencia/contratos/${c.id}`,
    lastModified: c.updated_at,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...contratoPages];
}
```

### Integração com SICONFI (STN) — importação de dados federais

```typescript
// src/jobs/siconfi-sync.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class SiconfiSyncJob {
  private readonly logger = new Logger(SiconfiSyncJob.name);
  // API pública do SICONFI — não requer autenticação para consulta
  private readonly SICONFI_BASE = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt";

  constructor(private readonly http: HttpService) {}

  @Cron("0 6 * * *") // Todo dia às 06h
  async syncTransferencias() {
    this.logger.log("Sincronizando transferências federais via SICONFI");

    const codigoIBGE = process.env.MUNICIPIO_CODIGO_IBGE!;
    const anoAtual = new Date().getFullYear();

    try {
      // Buscar transferências de convênios federais
      const response = await firstValueFrom(
        this.http.get(`${this.SICONFI_BASE}/rreo`, {
          params: {
            an_exercicio: anoAtual,
            in_periodicidade: "Q", // Quadrimestral
            nr_periodo: Math.ceil((new Date().getMonth() + 1) / 4),
            co_tipo_matriz: "RReo",
            id_ente: codigoIBGE,
          },
          timeout: 30000,
        })
      );

      const items = response.data?.items ?? [];
      this.logger.log(`SICONFI: ${items.length} registros recebidos`);

      // Processar e armazenar (idempotente)
      for (const item of items) {
        await this.upsertTransferencia(item);
      }
    } catch (err) {
      this.logger.error("Falha ao sincronizar SICONFI", err);
      // Não lançar — dados do SICONFI são complementares, não críticos
    }
  }

  private async upsertTransferencia(item: Record<string, unknown>) {
    // Implementação de upsert no banco de dados local
  }
}
```

## Armadilhas

**1. SPA sem SSR em portal de transparência**
TCE e CGU usam bots sem JavaScript para auditar portais. Páginas que renderizam no cliente são invisíveis para esses bots — o órgão pode ser notificado por "não publicar" dados que existem no sistema.

**2. Cache sem invalidação ao importar dados**
Ao receber o arquivo de folha de pagamento do mês, os dados antigos ficam em cache. Implementar invalidação de cache (`redis.del("transparencia:servidores:*")`) no job de importação.

**3. Dados de servidores sem anonimização de dados sensíveis**
A LAI exige publicação de nome, cargo e salário. Mas CPF, endereço e dados de saúde NÃO devem ser publicados. Verificar o que é exposto na API pública de servidores.

**4. Timeout no dia de pico**
Sem cache, uma query de 500ms * 1000 requests simultâneos = banco de joelhos. Usar `stale-while-revalidate` no CDN e Redis como buffer.

**5. Exportação CSV sem BOM UTF-8**
Excel no Windows abre CSV sem BOM como ANSI — acentos viram lixo. Sempre incluir o BOM `﻿` no início do CSV.

**6. Sitemap sem atualização automática**
Sitemap.xml estático que não reflete novos contratos/licitações prejudica o ranqueamento e auditoria do TCE. Usar `src/app/sitemap.ts` dinâmico do Next.js.

## Referências

- [LAI — Lei 12.527/2011](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm)
- [LC 131/2009 — Transparência fiscal](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp131.htm)
- [API SICONFI — Tesouro Nacional](https://apidatalake.tesouro.gov.br/ords/siconfi/)
- [Portal Dados Abertos — gov.br](https://dados.gov.br/)
- [Next.js — Sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/sitemap)
