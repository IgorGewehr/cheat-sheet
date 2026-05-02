---
title: "NFS-e Padrão Nacional — Integração com Serpro/Receita Federal"
category: "govtech"
stack: ["NestJS", "PostgreSQL", "BullMQ", "TypeScript"]
tags: ["nfse", "serpro", "receita-federal", "mnd", "abrasf", "iss", "b2g", "notas-fiscais", "mtls", "jades"]
excerpt: "Guia completo de integração com o Padrão Nacional de NFS-e (MND/ABRASF): fluxo de emissão, autenticação mTLS, validações fiscais obrigatórias e persistência no PostgreSQL via BullMQ."
---

## Visão Geral

Em 2026, **todas as prefeituras brasileiras são obrigadas** a usar o Padrão Nacional de NFS-e, regulamentado pela Receita Federal e operado pelo Serpro. Existem dois modelos em coexistência:

- **ABRASF** (Associação Brasileira das Secretarias de Finanças das Capitais): padrão legado adaptado, payload em XML assinado com XAdES, ainda usado por municípios em processo de migração.
- **MND** (Modelo Nacional de Dados): o padrão novo e definitivo, payload em JSON assinado com JAdES, obrigatório para novas integrações a partir de 2024.

Sistemas legados (Delphi, PHP antigo, SOAP sem TLS mútuo) não conseguem cumprir os requisitos de segurança do ambiente nacional. Isso cria oportunidade clara de vender o módulo de integração como componente independente do ERP.

## Contexto B2G

- Decreto nº 10.540/2020 e a Resolução CGSN 169/2022 impõem adoção do Padrão Nacional.
- O Serpro opera a infraestrutura da API nacional; prefeituras que não integraram perdem arrecadação de ISS de prestadores de serviços que emitem pelo portal da RF.
- A alíquota de ISS é municipal: varia de **2% a 5%** (Lei Complementar 116/2003). O sistema deve conhecer a alíquota do município antes de emitir.
- ISS retido na fonte: quando o tomador retém o imposto, o campo `issRetido` muda o fluxo de recolhimento — erro aqui é autuação fiscal.
- Competência: a NFS-e é sempre referente a um mês/ano. Emitir com competência futura é inválido; competência retroativa tem regras específicas por prefeitura.

## Quando usar

- Prefeituras migrando do sistema legado para o Padrão Nacional.
- ERPs municipais que precisam oferecer módulo de emissão de NFS-e para prestadores de serviço.
- Portais de auto-atendimento onde o próprio contribuinte emite a nota.
- Integrações contábeis que precisam centralizar emissão de NFS-e de múltiplos municípios (ISS multi-municipal).

## Trade-offs

| Aspecto | ABRASF (XML/XAdES) | MND (JSON/JAdES) |
|---|---|---|
| Maturidade | Alta — implementado em centenas de municípios | Crescente — obrigatório para novos |
| Bibliotecas Node | Escassas, muito manual | Mais fácil (JSON + JWS padrão) |
| Complexidade de assinatura | Alta (XAdES, C14N, enveloped) | Média (RS256 + cadeia de certs) |
| Suporte a contingência | Manual (RPS em XML) | Integrado no protocolo MND |
| Futuro | Legado em deprecação | Padrão mandatório |

**Recomendação**: implemente MND como padrão. Mantenha adaptador ABRASF apenas para municípios que ainda não migraram.

## Implementação

### 1. Tabela PostgreSQL `nfse`

```sql
-- migrations/0001_create_nfse.sql
CREATE TYPE nfse_status AS ENUM (
  'PENDENTE',
  'EM_FILA',
  'AUTORIZADA',
  'CANCELADA',
  'SUBSTITUIDA',
  'CONTINGENCIA',
  'REJEITADA'
);

CREATE TABLE nfse (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio_ibge        VARCHAR(7)    NOT NULL,
  cnpj_prestador        VARCHAR(14)   NOT NULL,
  inscricao_municipal   VARCHAR(20)   NOT NULL,
  cnpj_tomador          VARCHAR(14),
  cpf_tomador           VARCHAR(11),
  rps_numero            BIGINT        NOT NULL,
  rps_serie             VARCHAR(5)    NOT NULL DEFAULT 'RPS',
  numero_nfse           VARCHAR(20),
  competencia           DATE          NOT NULL,   -- primeiro dia do mês de referência
  codigo_tributacao     VARCHAR(20)   NOT NULL,   -- código municipal de tributação
  cnae                  VARCHAR(7)    NOT NULL,
  descricao_servico     TEXT          NOT NULL,
  valor_servico         NUMERIC(15,2) NOT NULL,
  aliquota_iss          NUMERIC(5,4)  NOT NULL,   -- ex: 0.0500 = 5%
  valor_iss             NUMERIC(15,2) NOT NULL,
  iss_retido            BOOLEAN       NOT NULL DEFAULT FALSE,
  deducoes              NUMERIC(15,2) NOT NULL DEFAULT 0,
  status                nfse_status   NOT NULL DEFAULT 'PENDENTE',
  payload_enviado       JSONB,                    -- payload MND enviado ao Serpro
  xml_enviado           TEXT,                     -- XML ABRASF (legado)
  resposta_serpro       JSONB,
  pdf_url               TEXT,                     -- URL do DANFE-NFS-e gerado
  chave_acesso          VARCHAR(60),              -- chave única da NFS-e autorizada
  data_emissao          TIMESTAMPTZ,
  data_cancelamento     TIMESTAMPTZ,
  motivo_cancelamento   TEXT,
  tentativas_envio      INTEGER       NOT NULL DEFAULT 0,
  ultimo_erro           TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (municipio_ibge, cnpj_prestador, rps_serie, rps_numero)
);

CREATE INDEX idx_nfse_prestador  ON nfse (cnpj_prestador, competencia);
CREATE INDEX idx_nfse_status     ON nfse (status) WHERE status IN ('PENDENTE', 'EM_FILA', 'CONTINGENCIA');
CREATE INDEX idx_nfse_municipio  ON nfse (municipio_ibge, status);
```

### 2. DTO de emissão

```typescript
// nfse/dto/emitir-nfse.dto.ts
import { IsString, IsNumber, IsBoolean, IsOptional, IsDateString, Min, Max, Length } from 'class-validator';

export class EmitirNfseDto {
  @IsString() @Length(7, 7)
  municipioIbge: string;          // ex: '3550308' (São Paulo)

  @IsString() @Length(14, 14)
  cnpjPrestador: string;

  @IsString()
  inscricaoMunicipal: string;

  @IsString() @IsOptional() @Length(14, 14)
  cnpjTomador?: string;

  @IsString() @IsOptional() @Length(11, 11)
  cpfTomador?: string;

  @IsString()
  razaoSocialTomador: string;

  @IsString()
  emailTomador?: string;

  @IsDateString()
  competencia: string;            // '2026-05-01' — sempre primeiro dia do mês

  @IsString()
  codigoTributacaoMunicipio: string;

  @IsString() @Length(7, 7)
  cnae: string;                   // ex: '6201501'

  @IsString()
  descricaoServico: string;

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)
  valorServico: number;

  @IsNumber({ maxDecimalPlaces: 4 }) @Min(0.02) @Max(0.05)
  aliquotaIss: number;            // 0.02 a 0.05 (2% a 5%)

  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  deducoes: number;

  @IsBoolean()
  issRetido: boolean;
}
```

### 3. NfseService — emissão completa

```typescript
// nfse/nfse.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as https from 'https';
import { EmitirNfseDto } from './dto/emitir-nfse.dto';
import { Nfse } from './entities/nfse.entity';
import { CertificateService } from '../certificate/certificate.service';
import { cnpjValido, competenciaNaoFutura, aliquotaDentroDoRange } from './validators/nfse.validators';

export interface NfseResultado {
  id: string;
  rpsNumero: number;
  status: string;
  numeroNfse?: string;
  chaveAcesso?: string;
  mensagem: string;
}

@Injectable()
export class NfseService {
  private readonly logger = new Logger(NfseService.name);

  // Ambientes Serpro
  private readonly ENDPOINTS = {
    producao: 'https://nfse.receita.fazenda.gov.br/api',
    homologacao: 'https://hml-nfse.receita.fazenda.gov.br/api',
  };

  constructor(
    @InjectRepository(Nfse)
    private readonly nfseRepo: Repository<Nfse>,
    @InjectQueue('nfse-transmissao')
    private readonly nfseQueue: Queue,
    private readonly certService: CertificateService,
  ) {}

  async emitirNfse(dto: EmitirNfseDto): Promise<NfseResultado> {
    // 1. Validações de negócio ANTES de persistir
    await this.validarRegrasFiscais(dto);

    // 2. Gerar número RPS local (sequencial por município + prestador)
    const rpsNumero = await this.gerarRps(dto.municipioIbge, dto.cnpjPrestador);

    // 3. Calcular valores derivados
    const baseCalculo = dto.valorServico - dto.deducoes;
    const valorIss = parseFloat((baseCalculo * dto.aliquotaIss).toFixed(2));

    // 4. Persistir com status PENDENTE
    const nfse = this.nfseRepo.create({
      municipioIbge: dto.municipioIbge,
      cnpjPrestador: dto.cnpjPrestador,
      inscricaoMunicipal: dto.inscricaoMunicipal,
      cnpjTomador: dto.cnpjTomador,
      cpfTomador: dto.cpfTomador,
      rpsNumero,
      competencia: new Date(dto.competencia),
      codigoTributacao: dto.codigoTributacaoMunicipio,
      cnae: dto.cnae,
      descricaoServico: dto.descricaoServico,
      valorServico: dto.valorServico,
      aliquotaIss: dto.aliquotaIss,
      valorIss,
      issRetido: dto.issRetido,
      deducoes: dto.deducoes,
      status: 'PENDENTE',
    });

    const salvo = await this.nfseRepo.save(nfse);

    // 5. Enfileirar transmissão assíncrona (não bloqueia o request do contribuinte)
    await this.nfseQueue.add(
      'transmitir',
      { nfseId: salvo.id },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 }, // 30s, 1min, 2min, 4min, 8min
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(`NFS-e ${salvo.id} enfileirada (RPS ${rpsNumero})`);

    return {
      id: salvo.id,
      rpsNumero,
      status: 'EM_FILA',
      mensagem: 'NFS-e recebida e em processo de transmissão ao Serpro.',
    };
  }

  async transmitirParaSerpro(nfseId: string): Promise<void> {
    const nfse = await this.nfseRepo.findOneOrFail({ where: { id: nfseId } });

    if (nfse.status === 'AUTORIZADA') return; // idempotente

    await this.nfseRepo.update(nfseId, { status: 'EM_FILA', tentativasEnvio: () => 'tentativas_envio + 1' });

    // Montar payload MND (JSON)
    const payload = this.montarPayloadMnd(nfse);
    nfse.payloadEnviado = payload;

    // Assinar com JAdES usando o certificado A1 da prefeitura
    const jwsAssinado = await this.certService.signJson(payload, nfse.municipioIbge);

    // Fazer a request com mTLS
    const ambiente = process.env.NFSE_AMBIENTE === 'producao' ? 'producao' : 'homologacao';
    const httpClient = await this.criarClienteMtls(nfse.municipioIbge, ambiente);

    try {
      const resposta = await httpClient.post('/contribuinte/nfse', jwsAssinado, {
        headers: { 'Content-Type': 'application/jose+json' },
        timeout: 30_000,
      });

      await this.processarRespostaSerpro(nfseId, resposta.data);
    } catch (erro) {
      await this.nfseRepo.update(nfseId, {
        status: 'CONTINGENCIA',
        ultimoErro: erro.message,
        respostaSerpro: erro.response?.data,
      });
      throw erro; // BullMQ vai re-enfileirar
    }
  }

  private montarPayloadMnd(nfse: Nfse): object {
    // Schema MND — campos obrigatórios conforme manual do Padrão Nacional
    return {
      infNFSe: {
        xLocEmi: 'BR',  // local de emissão
        xLocPrestServ: 'BR',
        nNFSe: null,    // será preenchido pelo Serpro
        cLocIncid: nfse.municipioIbge,
        xLocIncid: null, // nome do município (buscar via tabela IBGE)
        xTribNac: '01', // 01 = ISS
        xTribMun: nfse.codigoTributacao,
        xNBS: null,     // NBS (opcional para serviços internacionais)
        verAplic: '1.00',
        ambIden: process.env.NFSE_AMBIENTE === 'producao' ? '1' : '2',
        tpEmis: '1',    // 1 = Normal, 7 = Contingência
        dhEmi: new Date().toISOString(),  // ATENÇÃO: deve ser no fuso de Brasília
        competencia: nfse.competencia.toISOString().slice(0, 7), // 'YYYY-MM'
        dCompet: nfse.competencia.toISOString().slice(0, 10),

        emit: {
          CNPJ: nfse.cnpjPrestador,
          IM: nfse.inscricaoMunicipal,
          xNome: null, // razão social do prestador (buscar do cadastro)
          end: null,   // endereço completo (obrigatório)
          fone: null,
          email: null,
        },

        toma: nfse.cnpjTomador
          ? { CNPJ: nfse.cnpjTomador }
          : { CPF: nfse.cpfTomador },

        serv: {
          cServ: {
            cTribNac: nfse.codigoTributacao,
            cTribMun: nfse.codigoTributacao,
            CNAE: nfse.cnae,
            xDescServ: nfse.descricaoServico,
          },
          xDescServ: nfse.descricaoServico,
        },

        valores: {
          vServPrest: {
            vReceb: nfse.valorServico.toFixed(2),
            vServ: nfse.valorServico.toFixed(2),
          },
          vDesc: nfse.deducoes.toFixed(2),
          vDedRed: nfse.deducoes.toFixed(2),
          tribMun: {
            tribISSQN: {
              cLocIncid: nfse.municipioIbge,
              cPaisResult: '1058', // Brasil
              BM: nfse.issRetido ? '2' : '1', // 1=Normal, 2=Retido
              exigISSQN: '1',
              tpImunidade: '0',
              pAliq: (nfse.aliquotaIss * 100).toFixed(2), // em percentual: '5.00'
              vBC: (nfse.valorServico - nfse.deducoes).toFixed(2),
              vISSQN: nfse.valorIss.toFixed(2),
            },
          },
          vTotTrib: {
            vTotTribFed: '0.00',
            vTotTribEst: '0.00',
            vTotTribMun: nfse.valorIss.toFixed(2),
          },
        },

        // RPS que originou a NFS-e
        RPS: {
          nRPS: nfse.rpsNumero.toString(),
          serie: nfse.rpsSerie,
          dhEmi: nfse.createdAt.toISOString(),
        },
      },
    };
  }

  private async criarClienteMtls(municipioIbge: string, ambiente: 'producao' | 'homologacao'): Promise<AxiosInstance> {
    // Certificado A1 da prefeitura carregado do secrets manager
    const { cert, key } = await this.certService.carregarCertificadoP12(municipioIbge);

    const agent = new https.Agent({
      cert,
      key,
      rejectUnauthorized: true, // NUNCA false em produção
    });

    return axios.create({
      baseURL: this.ENDPOINTS[ambiente],
      httpsAgent: agent,
    });
  }

  private async processarRespostaSerpro(nfseId: string, dados: any): Promise<void> {
    const statusMap: Record<string, string> = {
      AUTORIZADA: 'AUTORIZADA',
      CANCELADA: 'CANCELADA',
      SUBSTITUIDA: 'SUBSTITUIDA',
      CONTINGENCIA: 'CONTINGENCIA',
    };

    const status = statusMap[dados?.infNFSe?.cStat] ?? 'REJEITADA';

    await this.nfseRepo.update(nfseId, {
      status,
      numeroNfse: dados?.infNFSe?.nNFSe,
      chaveAcesso: dados?.infNFSe?.chNFSe,
      respostaSerpro: dados,
      dataEmissao: status === 'AUTORIZADA' ? new Date() : undefined,
      ultimoErro: status === 'REJEITADA' ? JSON.stringify(dados?.infNFSe?.xMotivo) : null,
    });
  }

  private async validarRegrasFiscais(dto: EmitirNfseDto): Promise<void> {
    if (!cnpjValido(dto.cnpjPrestador)) {
      throw new BadRequestException('CNPJ do prestador inválido.');
    }
    if (dto.cnpjTomador && !cnpjValido(dto.cnpjTomador)) {
      throw new BadRequestException('CNPJ do tomador inválido.');
    }
    if (!competenciaNaoFutura(dto.competencia)) {
      throw new BadRequestException('Competência não pode ser futura.');
    }
    if (!aliquotaDentroDoRange(dto.aliquotaIss)) {
      throw new BadRequestException('Alíquota de ISS fora do range legal (2%-5%).');
    }
    // Validar CNAE autorizado para o prestador (buscar do cadastro municipal)
    // await this.cadastroService.validarCnaeAutorizado(dto.cnpjPrestador, dto.cnae);
  }

  private async gerarRps(municipioIbge: string, cnpjPrestador: string): Promise<number> {
    // Usar sequence do PostgreSQL por (municipio, prestador) — sem race condition
    const result = await this.nfseRepo.query(
      `SELECT nextval('nfse_rps_seq_' || $1 || '_' || $2) AS rps`,
      [municipioIbge, cnpjPrestador.replace(/\D/g, '')],
    );
    return result[0].rps;
  }

  async cancelarNfse(nfseId: string, motivo: string): Promise<void> {
    const nfse = await this.nfseRepo.findOneOrFail({ where: { id: nfseId } });

    if (nfse.status !== 'AUTORIZADA') {
      throw new BadRequestException('Somente NFS-e AUTORIZADA pode ser cancelada.');
    }

    // Verificar prazo máximo de cancelamento (geralmente 90 dias corridos)
    const diasDesdeEmissao = Math.floor(
      (Date.now() - nfse.dataEmissao.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diasDesdeEmissao > 90) {
      throw new BadRequestException(
        `Prazo de cancelamento expirado (${diasDesdeEmissao} dias > 90 dias máximos).`,
      );
    }

    // Enfileirar cancelamento no Serpro
    await this.nfseQueue.add(
      'cancelar',
      { nfseId, motivo },
      { attempts: 3, backoff: { type: 'exponential', delay: 15_000 } },
    );

    await this.nfseRepo.update(nfseId, {
      motivoCancelamento: motivo,
    });
  }
}
```

### 4. NfseQueue — Worker BullMQ

```typescript
// nfse/nfse.queue.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NfseService } from './nfse.service';

@Processor('nfse-transmissao')
export class NfseTransmissaoWorker extends WorkerHost {
  private readonly logger = new Logger(NfseTransmissaoWorker.name);

  constructor(private readonly nfseService: NfseService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processando job ${job.id} — tipo: ${job.name}`);

    if (job.name === 'transmitir') {
      await this.nfseService.transmitirParaSerpro(job.data.nfseId);
    }

    if (job.name === 'cancelar') {
      // await this.nfseService.executarCancelamentoNoSerpro(job.data.nfseId, job.data.motivo);
    }

    this.logger.log(`Job ${job.id} concluído com sucesso`);
  }
}
```

### 5. Validadores fiscais

```typescript
// nfse/validators/nfse.validators.ts

export function cnpjValido(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14 || /^(\d)\1+$/.test(nums)) return false;
  const calc = (mod: number) =>
    nums
      .slice(0, mod)
      .split('')
      .reduce((acc, d, i) => acc + parseInt(d) * (mod + 1 - i + Math.floor(i / (mod - 11))), 0);
  // Dígitos verificadores
  const d1 = (11 - (calc(12) % 11)) % 11;
  const d2 = (11 - (calc(13) % 11)) % 11;
  return parseInt(nums[12]) === (d1 > 9 ? 0 : d1) && parseInt(nums[13]) === (d2 > 9 ? 0 : d2);
}

export function competenciaNaoFutura(competencia: string): boolean {
  const hoje = new Date();
  const comp = new Date(competencia);
  return comp <= new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

export function aliquotaDentroDoRange(aliquota: number): boolean {
  return aliquota >= 0.02 && aliquota <= 0.05;
}
```

## Armadilhas

- **Ambiente errado em produção**: `hml-nfse` aceita qualquer certificado de homologação; em produção só funciona com certificado A1 da prefeitura emitido por AC credenciada ICP-Brasil. Usar variável de ambiente explícita e não confiar em defaults.
- **Fuso horário no `dhEmi`**: o campo de data/hora de emissão deve estar no fuso de Brasília (`America/Sao_Paulo`, UTC-3/-2 no horário de verão). `new Date().toISOString()` retorna UTC — ajustar antes de assinar o payload, pois a assinatura inclui o timestamp.
- **CNPJ tomador vs CPF tomador**: nunca enviar os dois simultaneamente. A API rejeita.
- **Alíquota 0%**: municípios com isenção enviavam `pAliq: '0.00'` — o Serpro rejeita em alguns casos. Verificar se o município tem convênio de isenção antes de emitir.
- **RPS duplicado**: o par `(municipioIbge, cnpjPrestador, rpsSerie, rpsNumero)` deve ser único. Usar `nextval` de sequence no PostgreSQL, nunca `MAX(rps_numero) + 1` (race condition em alta concorrência).
- **Retransmissão sem idempotência**: antes de retransmitir ao Serpro, sempre consultar se o RPS já foi autorizado (`GET /contribuinte/nfse/:rps`) para evitar emissão em duplicidade.
- **PDF DANFE-NFS-e**: a RF não fornece PDF; é responsabilidade do sistema emitente gerá-lo conforme layout definido no manual do Padrão Nacional. Use uma biblioteca de PDF server-side (PDFKit, Puppeteer) e armazene no S3/GCS.

## Referências

- [Manual do Padrão Nacional de NFS-e — Receita Federal](https://www.nfse.gov.br/PortalNFSe/contribuinte/orientacoes)
- [Schema JSON MND — GitHub Serpro](https://github.com/serpro69/nfse-nacional)
- [Lei Complementar 116/2003 — ISS](http://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm)
- [Resolução CGSN 169/2022 — Padrão Nacional NFS-e](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=122183)
- [Ambiente de homologação Serpro](https://hml-nfse.receita.fazenda.gov.br)
