---
title: "Auditoria para o Tribunal de Contas do Estado (TCE)"
category: "govtech"
stack: ["NestJS", "PostgreSQL", "TypeORM", "TypeScript", "node-forge", "PDFKit"]
tags: ["tce", "auditoria", "audit-log", "icp-brasil", "assinatura-digital", "compliance", "imutabilidade"]
excerpt: "O TCE audita qualquer sistema que movimenta dinheiro público. Este card cobre audit logs imutáveis (append-only com trigger PostgreSQL), assinatura digital ICP-Brasil e geração de relatórios de auditoria em formato TCE."
---

## Visão Geral

O Tribunal de Contas do Estado (TCE) tem poder de auditar qualquer sistema que processe recursos públicos. Uma auditoria pode solicitar: "quem autorizou o pagamento X, no dia Y, com qual justificativa legal, e qual era o valor antes e depois da alteração". Se o sistema não registrar isso de forma imutável, o gestor municipal assume responsabilidade pessoal.

O que o TCE quer verificar:
1. **Quem** fez a ação (usuário identificado, cargo, matrícula)
2. **O quê** foi alterado (entidade, ID, campo)
3. **Quando** (timestamp com fuso horário — crimes fiscais têm horário relevante)
4. **De onde** (IP, terminal)
5. **Estado antes e depois** (payload completo antes/depois)
6. **Autorização** (qual lei/decreto autorizou aquele gasto)
7. **Assinatura eletrônica** (ICP-Brasil para documentos de alto valor)

## Contexto B2G

Dados de retenção por tipo (orientação TCE/CGU):
| Tipo de dado | Retenção mínima |
|-------------|----------------|
| Dados financeiros (empenhos, pagamentos) | 10 anos |
| Contratos e licitações | 10 anos |
| Dados de RH (folha, benefícios) | 5 anos |
| Protocolos e requerimentos | 5 anos |
| Logs de acesso a dados sensíveis | 5 anos |
| Logs de autenticação | 1 ano |

**Imutabilidade**: qualquer UPDATE ou DELETE em tabelas de audit log configura crime de adulteração de documento público (CP Art. 297). O sistema deve **impossibilitar tecnicamente** essa alteração.

## Quando usar

- Qualquer tabela que armazene valores financeiros
- Alterações em contratos, licitações, empenhos
- Aprovações e autorizações de pagamento
- Alterações cadastrais em servidores (salário, cargo, lotação)
- Cancelamentos de notas fiscais
- Acesso a dados sigilosos

## Trade-offs

| Abordagem | Imutabilidade | Performance | Armazenamento |
|-----------|--------------|-------------|---------------|
| Trigger PostgreSQL bloqueando UPDATE/DELETE | Impossível alterar no banco | Mínimo overhead | Normal |
| Append-only table + partition | Impossível alterar + query rápida | Boa | Cresce ~10MB/mês por 1000 usuários |
| Blockchain privado | Impossível alterar + prova criptográfica | Alto overhead | Alto |
| Log externo (Datadog/Elastic) | Dependente de vendor | Nenhum overhead no DB | Externo |

**Recomendação**: trigger PostgreSQL para imutabilidade + particionamento por ano para performance de query + backup criptografado offline anual.

## Implementação

### Estrutura da tabela de audit log (append-only)

```sql
-- migrations/001_create_audit_logs.sql

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Quem
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_cargo TEXT NOT NULL,
  user_matricula TEXT,
  
  -- De onde
  ip_address INET NOT NULL,
  user_agent TEXT,
  session_id TEXT,
  
  -- Quando (sempre com fuso horário)
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- O quê
  acao TEXT NOT NULL,           -- 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'CANCEL'
  entidade TEXT NOT NULL,       -- 'empenho' | 'contrato' | 'servidor' etc.
  entidade_id TEXT NOT NULL,
  descricao TEXT,               -- descrição legível para humanos
  
  -- Estado antes e depois
  payload_antes JSONB,          -- NULL para CREATE
  payload_depois JSONB,         -- NULL para DELETE
  
  -- Campos alterados (para UPDATE rápido de ver o que mudou)
  campos_alterados TEXT[],
  
  -- Integridade
  checksum TEXT NOT NULL,       -- SHA-256 do registro para detecção de adulteração
  assinatura_digital TEXT,      -- Assinatura ICP-Brasil (opcional para operações financeiras)
  
  -- Referência legal (obrigatório para operações financeiras)
  base_legal TEXT,              -- 'Art. 24, II, Lei 8.666/93' etc.
  valor_envolvido NUMERIC(15, 2), -- Para empenhos e pagamentos
  
  -- Ambiente
  app_version TEXT,
  municipio_id UUID NOT NULL
) PARTITION BY RANGE (timestamp);

-- Partições por ano (criar automaticamente)
CREATE TABLE audit_logs_2024 PARTITION OF audit_logs
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE audit_logs_2025 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audit_logs_2026 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Índices para queries do TCE
CREATE INDEX idx_audit_entidade ON audit_logs (entidade, entidade_id, timestamp DESC);
CREATE INDEX idx_audit_usuario ON audit_logs (user_id, timestamp DESC);
CREATE INDEX idx_audit_municipio_timestamp ON audit_logs (municipio_id, timestamp DESC);
CREATE INDEX idx_audit_acao ON audit_logs (acao, timestamp DESC);
```

### Trigger PostgreSQL — bloquear UPDATE e DELETE

```sql
-- migrations/002_audit_immutability_trigger.sql

-- Função que bloqueia qualquer modificação
CREATE OR REPLACE FUNCTION bloquear_alteracao_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'VIOLAÇÃO DE INTEGRIDADE: audit_logs é append-only. '
    'Tentativa de % bloqueada. '
    'Qualquer alteração em registros de auditoria configura crime de adulteração de documento público (CP Art. 297). '
    'Esta tentativa foi registrada.',
    TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o trigger em TODAS as partições
CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION bloquear_alteracao_audit_log();

-- Também bloquear TRUNCATE
CREATE OR REPLACE RULE audit_logs_no_truncate AS
  ON DELETE TO audit_logs
  DO INSTEAD NOTHING;

-- Verificação: garantir que nem o owner da tabela consegue alterar
-- REVOKE UPDATE, DELETE ON audit_logs FROM govtech_app;
-- Manter apenas INSERT + SELECT para a role da aplicação
REVOKE UPDATE ON audit_logs FROM govtech_app;
REVOKE DELETE ON audit_logs FROM govtech_app;
REVOKE TRUNCATE ON audit_logs FROM govtech_app;

-- Somente o DBA com role separada pode verificar integridade (sem alterar)
CREATE ROLE auditor_tce;
GRANT SELECT ON audit_logs TO auditor_tce;
```

### NestJS Service de Auditoria

```typescript
// src/common/audit/audit.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";
import * as crypto from "crypto";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "CANCEL" | "ACCESS";

export interface AuditContext {
  userId: string;
  userName: string;
  cargo: string;
  matricula?: string;
  ip: string;
  userAgent?: string;
  sessionId?: string;
  municipioId: string;
  appVersion?: string;
}

export interface AuditEntry {
  acao: AuditAction;
  entidade: string;
  entidadeId: string;
  descricao?: string;
  payloadAntes?: Record<string, unknown>;
  payloadDepois?: Record<string, unknown>;
  baseLegal?: string;
  valorEnvolvido?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(context: AuditContext, entry: AuditEntry): Promise<AuditLog> {
    const camposAlterados = entry.payloadAntes && entry.payloadDepois
      ? this.diffCampos(entry.payloadAntes, entry.payloadDepois)
      : undefined;

    // Calcular checksum do registro para detecção de adulteração posterior
    const checksum = this.calcularChecksum({
      ...context,
      ...entry,
      camposAlterados,
      timestamp: new Date().toISOString(),
    });

    const auditLog = this.auditRepo.create({
      userId: context.userId,
      userName: context.userName,
      userCargo: context.cargo,
      userMatricula: context.matricula,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      municipioId: context.municipioId,
      appVersion: context.appVersion,
      acao: entry.acao,
      entidade: entry.entidade,
      entidadeId: entry.entidadeId,
      descricao: entry.descricao,
      payloadAntes: entry.payloadAntes,
      payloadDepois: entry.payloadDepois,
      camposAlterados,
      baseLegal: entry.baseLegal,
      valorEnvolvido: entry.valorEnvolvido,
      checksum,
    });

    return this.auditRepo.save(auditLog);
  }

  async verificarIntegridade(entidade: string, entidadeId: string): Promise<{
    registros: number;
    violacoes: number;
    detalhes: { id: string; esperado: string; encontrado: string }[];
  }> {
    const logs = await this.auditRepo.find({
      where: { entidade, entidadeId },
      order: { timestamp: "ASC" },
    });

    const violacoes = [];

    for (const log of logs) {
      const checksumEsperado = this.calcularChecksum({
        userId: log.userId,
        userName: log.userName,
        cargo: log.userCargo,
        ip: log.ipAddress,
        municipioId: log.municipioId,
        acao: log.acao,
        entidade: log.entidade,
        entidadeId: log.entidadeId,
        payloadAntes: log.payloadAntes,
        payloadDepois: log.payloadDepois,
        timestamp: log.timestamp.toISOString(),
      });

      if (checksumEsperado !== log.checksum) {
        violacoes.push({
          id: log.id,
          esperado: checksumEsperado,
          encontrado: log.checksum,
        });
      }
    }

    return {
      registros: logs.length,
      violacoes: violacoes.length,
      detalhes: violacoes,
    };
  }

  // Reconstruir histórico completo de uma entidade (para relatório TCE)
  async reconstruirHistorico(entidade: string, entidadeId: string) {
    return this.auditRepo
      .createQueryBuilder("al")
      .where("al.entidade = :entidade AND al.entidade_id = :entidadeId", {
        entidade,
        entidadeId,
      })
      .orderBy("al.timestamp", "ASC")
      .getMany();
  }

  private diffCampos(
    antes: Record<string, unknown>,
    depois: Record<string, unknown>
  ): string[] {
    const campos = new Set([...Object.keys(antes), ...Object.keys(depois)]);
    return Array.from(campos).filter((campo) => {
      const valorAntes = JSON.stringify(antes[campo]);
      const valorDepois = JSON.stringify(depois[campo]);
      return valorAntes !== valorDepois;
    });
  }

  private calcularChecksum(data: Record<string, unknown>): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data, Object.keys(data).sort()))
      .digest("hex");
  }
}
```

### Interceptor para auditoria automática

```typescript
// src/common/audit/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Reflector } from "@nestjs/core";
import { AuditService, AuditAction } from "./audit.service";

export const AUDIT_KEY = "audit";

export interface AuditMetadata {
  acao: AuditAction;
  entidade: string;
  descricao?: string;
  baseLegal?: string;
}

export const Auditar = (meta: AuditMetadata) =>
  (target: unknown, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_KEY, meta, descriptor.value);
    return descriptor;
  };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMetadata>(AUDIT_KEY, context.getHandler());

    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest();
    const user = req.user as {
      id: string;
      nome: string;
      cargo: string;
      matricula?: string;
      municipioId: string;
    };

    return next.handle().pipe(
      tap((responseData) => {
        const entidadeId =
          req.params.id ??
          (responseData as Record<string, unknown>)?.id ??
          "unknown";

        setImmediate(() => {
          this.auditService.log(
            {
              userId: user.id,
              userName: user.nome,
              cargo: user.cargo,
              matricula: user.matricula,
              ip: req.ip,
              userAgent: req.get("User-Agent"),
              municipioId: user.municipioId,
            },
            {
              acao: meta.acao,
              entidade: meta.entidade,
              entidadeId: String(entidadeId),
              descricao: meta.descricao,
              payloadDepois: responseData as Record<string, unknown>,
              baseLegal: meta.baseLegal,
            }
          );
        });
      })
    );
  }
}

// Uso:
// @Auditar({ acao: 'APPROVE', entidade: 'empenho', baseLegal: 'Art. 62 Lei 4.320/64' })
// @Post(':id/aprovar')
// async aprovarEmpenho(@Param('id') id: string) { ... }
```

### Query de reconstrução de histórico por entidade

```sql
-- Query para o TCE: histórico completo de um empenho
-- Parâmetros: :entidade = 'empenho', :entidade_id = 'uuid-do-empenho'

WITH historico AS (
  SELECT
    al.id,
    al.timestamp AT TIME ZONE 'America/Sao_Paulo' AS timestamp_local,
    al.acao,
    al.descricao,
    al.user_name AS "usuario",
    al.user_cargo AS "cargo",
    al.user_matricula AS "matricula",
    al.ip_address AS "ip",
    al.base_legal,
    al.valor_envolvido,
    al.campos_alterados,
    al.payload_antes,
    al.payload_depois,
    al.checksum,
    -- Verificar integridade inline
    CASE 
      WHEN al.checksum IS NULL THEN 'sem-checksum'
      ELSE 'verificar-externamente'
    END AS integridade
  FROM audit_logs al
  WHERE al.entidade = :entidade
    AND al.entidade_id = :entidade_id
  ORDER BY al.timestamp ASC
)
SELECT
  historico.*,
  -- Diff de campos para cada UPDATE
  CASE 
    WHEN acao = 'UPDATE' AND payload_antes IS NOT NULL AND payload_depois IS NOT NULL
    THEN (
      SELECT jsonb_object_agg(
        chave,
        jsonb_build_object(
          'antes', payload_antes -> chave,
          'depois', payload_depois -> chave
        )
      )
      FROM jsonb_object_keys(payload_antes || payload_depois) AS chave
      WHERE payload_antes -> chave IS DISTINCT FROM payload_depois -> chave
    )
    ELSE NULL
  END AS diff_campos
FROM historico;
```

### NestJS Service de assinatura digital ICP-Brasil

```typescript
// src/common/digital-signature/digital-signature.service.ts
import { Injectable, Logger } from "@nestjs/common";
import * as forge from "node-forge";
import * as fs from "fs";

export interface SignatureResult {
  assinatura: string;        // Base64 da assinatura
  certificadoCN: string;     // Nome do titular do certificado
  certificadoCPF: string;    // CPF do titular
  validadeInicio: Date;
  validadeFim: Date;
  algoritmoPKCS: string;
}

@Injectable()
export class DigitalSignatureService {
  private readonly logger = new Logger(DigitalSignatureService.name);

  /**
   * Assinar um documento com certificado A1 (arquivo PFX/P12)
   * Para certificado A3 (token/smartcard), usar biblioteca nativa do SO
   */
  async assinarComCertificadoA1(
    conteudo: string | Buffer,
    pfxPath: string,
    pfxSenha: string,
  ): Promise<SignatureResult> {
    const pfxBuffer = fs.readFileSync(pfxPath);
    const pfxDer = forge.util.createBuffer(pfxBuffer.toString("binary"));
    const pfx = forge.pkcs12.pkcs12FromAsn1(
      forge.asn1.fromDer(pfxDer),
      pfxSenha,
    );

    // Extrair chave privada e certificado
    const keyBag = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const certBag = pfx.getBags({ bagType: forge.pki.oids.certBag });

    const privateKey = keyBag[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
    const certificate = certBag[forge.pki.oids.certBag]?.[0]?.cert;

    if (!privateKey || !certificate) {
      throw new Error("Certificado A1 inválido ou senha incorreta");
    }

    // Verificar validade do certificado
    const agora = new Date();
    if (agora > certificate.validity.notAfter) {
      throw new Error(
        `Certificado vencido em ${certificate.validity.notAfter.toLocaleDateString("pt-BR")}`
      );
    }

    // Criar estrutura PKCS#7 (CMS)
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(
      typeof conteudo === "string" ? conteudo : conteudo.toString("utf8")
    );
    p7.addCertificate(certificate);
    p7.addSigner({
      key: privateKey,
      certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date() },
      ],
    });

    p7.sign();

    const assinaturaDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const assinaturaBase64 = forge.util.encode64(assinaturaDer);

    // Extrair informações do certificado para o audit log
    const subject = certificate.subject;
    const cn = subject.getField("CN")?.value ?? "Não identificado";
    // CPF em certificado ICP-Brasil fica no campo OID 2.16.76.1.3.1
    const cpf = this.extrairCpfDoCertificado(certificate);

    return {
      assinatura: assinaturaBase64,
      certificadoCN: cn,
      certificadoCPF: cpf,
      validadeInicio: certificate.validity.notBefore,
      validadeFim: certificate.validity.notAfter,
      algoritmoPKCS: "SHA256withRSA",
    };
  }

  /**
   * Validar assinatura digital recebida externamente
   */
  async validarAssinatura(
    conteudoOriginal: string,
    assinaturaBase64: string,
  ): Promise<{ valida: boolean; titular: string; validadeExpira: Date }> {
    try {
      const assinaturaDer = forge.util.decode64(assinaturaBase64);
      const p7 = forge.pkcs7.messageFromAsn1(
        forge.asn1.fromDer(assinaturaDer)
      );

      // Verificar a assinatura criptograficamente
      p7.verify();

      const cert = p7.certificates[0];
      const titular = cert?.subject.getField("CN")?.value ?? "Desconhecido";
      const validadeExpira = cert?.validity.notAfter ?? new Date(0);

      return { valida: true, titular, validadeExpira };
    } catch (err) {
      this.logger.warn(`Assinatura inválida: ${(err as Error).message}`);
      return {
        valida: false,
        titular: "",
        validadeExpira: new Date(0),
      };
    }
  }

  private extrairCpfDoCertificado(cert: forge.pki.Certificate): string {
    // ICP-Brasil: CPF em extensão proprietária OID 2.16.76.1.3.1
    try {
      const extensions = cert.extensions;
      for (const ext of extensions) {
        if (ext.id === "2.16.76.1.3.1") {
          // O valor contém data de nascimento (8 chars) + CPF (11 chars) + ...
          const raw = ext.value as string;
          return raw.substring(8, 19); // Extrair CPF
        }
      }
    } catch {
      // Certificado sem extensão ICP-Brasil (ex: cert de teste)
    }
    return "Não identificado";
  }
}
```

### Geração de relatório de auditoria em PDF

```typescript
// src/common/audit/audit-report.service.ts
import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { AuditService } from "./audit.service";
import { DigitalSignatureService } from "../digital-signature/digital-signature.service";

@Injectable()
export class AuditReportService {
  constructor(
    private readonly auditService: AuditService,
    private readonly signatureService: DigitalSignatureService,
  ) {}

  async gerarRelatorioPDF(params: {
    entidade: string;
    entidadeId: string;
    municipio: string;
    assinarComCertificado?: boolean;
  }): Promise<Buffer> {
    const historico = await this.auditService.reconstruirHistorico(
      params.entidade,
      params.entidadeId,
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Cabeçalho
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("RELATÓRIO DE AUDITORIA", { align: "center" });

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(`Prefeitura: ${params.municipio}`, { align: "center" })
        .text(
          `Entidade: ${params.entidade} — ID: ${params.entidadeId}`,
          { align: "center" }
        )
        .text(
          `Gerado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
          { align: "center" }
        );

      doc.moveDown(2);

      // Aviso legal
      doc
        .fontSize(9)
        .fillColor("#cc0000")
        .text(
          "DOCUMENTO DE AUDITORIA — USO RESTRITO. Os registros abaixo são protegidos contra alteração " +
            "por trigger de banco de dados. Qualquer adulteração configura crime previsto no Art. 297 do Código Penal.",
          { align: "center" }
        )
        .fillColor("#000000");

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Registros de auditoria
      for (const log of historico) {
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(
            `${log.timestamp.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} — ${log.acao}`,
          );

        doc
          .fontSize(9)
          .font("Helvetica")
          .text(`Usuário: ${log.userName} | Cargo: ${log.userCargo}`)
          .text(`Matrícula: ${log.userMatricula ?? "N/A"} | IP: ${log.ipAddress}`)
          .text(`Descrição: ${log.descricao ?? "—"}`);

        if (log.baseLegal) {
          doc.text(`Base Legal: ${log.baseLegal}`);
        }

        if (log.valorEnvolvido) {
          doc.text(
            `Valor: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(log.valorEnvolvido)}`
          );
        }

        if (log.camposAlterados?.length) {
          doc.text(`Campos alterados: ${log.camposAlterados.join(", ")}`);
        }

        doc
          .fontSize(7)
          .fillColor("#666666")
          .text(`Checksum SHA-256: ${log.checksum}`)
          .fillColor("#000000");

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).dash(3, { space: 3 }).stroke();
        doc.undash();
        doc.moveDown(0.5);
      }

      // Rodapé
      doc
        .fontSize(9)
        .text(
          `Total de registros: ${historico.length}`,
          50,
          doc.page.height - 80
        )
        .text(
          "Relatório gerado automaticamente pelo sistema de gestão municipal.",
          50,
          doc.page.height - 65
        );

      doc.end();
    });
  }
}
```

## Armadilhas

**1. Usar `updated_at` como timestamp de auditoria**
`updated_at` pode ser alterado. O audit log precisa de um `timestamp` gerenciado pelo banco com `DEFAULT NOW()` — nunca pelo código da aplicação.

**2. Logar apenas o ID da entidade sem estado antes/depois**
"O usuário X alterou o contrato Y" é inútil para o TCE. O TCE quer: "O usuário X alterou o valor do contrato Y de R$ 100.000 para R$ 150.000 às 14h37 do dia 15/03/2025".

**3. Audit log na mesma transação da operação**
Se a transação principal fizer rollback, o audit log também some. O log de auditoria deve estar em uma transação separada (ou usar `AFTER` trigger no banco).

**4. Não particionar a tabela de audit logs**
Sem particionamento, em 3 anos com 1000 usuários ativos a tabela terá 30+ milhões de registros e as queries do TCE vão travar. Particionar por ano desde o início.

**5. Guardar apenas logs no Datadog/ELK sem backup criptografado offline**
Logs em sistemas externos podem ser deletados por acidente, por expiração de contrato ou por ataque. Manter backup offline criptografado anual dos audit logs.

**6. Não registrar o `payload_antes` em updates**
Sem o estado anterior, é impossível reconstruir o histórico ou auditar "para onde foi o dinheiro". Sempre buscar o estado atual antes de qualquer UPDATE/DELETE.

## Referências

- [Lei 8.429/1992 — Improbidade Administrativa](https://www.planalto.gov.br/ccivil_03/leis/l8429.htm)
- [Decreto 10.543/2020 — Assinatura eletrônica no governo](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/decreto/d10543.htm)
- [ICP-Brasil — ITI](https://www.iti.gov.br/)
- [node-forge](https://github.com/digitalbazaar/forge)
- [PDFKit](https://pdfkit.org/)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
