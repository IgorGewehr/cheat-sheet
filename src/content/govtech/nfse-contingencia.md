---
title: "NFS-e em Contingência — Resiliência quando o Serpro cai"
category: "govtech"
stack: ["NestJS", "PostgreSQL", "BullMQ", "TypeScript"]
tags: ["nfse", "contingencia", "circuit-breaker", "bullmq", "resiliencia", "serpro", "b2g", "rps", "retry"]
excerpt: "Estratégia completa de contingência para NFS-e: circuit breaker no Serpro, emissão offline com RPS local, retransmissão automática com BullMQ e monitoramento de fila."
---

## Visão Geral

O Serpro sai do ar. É um fato recorrente — manutenções programadas, sobrecarga em período de fechamento fiscal, indisponibilidades inesperadas. Se o sistema de NFS-e travar junto, a prefeitura perde arrecadação de ISS e os contribuintes não conseguem emitir notas para seus clientes.

O Padrão Nacional prevê o **modo contingência**: a nota é emitida localmente com status `CONTINGENCIA` e deve ser transmitida ao ambiente nacional quando o sistema voltar. O contribuinte recebe um **RPS** (Recibo Provisório de Serviço) com validade temporária.

**Prazo para sair da contingência**: conforme o Manual do Padrão Nacional, a transmissão deve ocorrer em até **24 horas** após a emissão em contingência. Após esse prazo, a nota pode ser considerada inválida pela SEFAZ municipal.

## Contexto B2G

- Prefeituras têm obrigação legal de manter o serviço de emissão disponível; indisponibilidade afeta arrecadação e pode gerar questionamentos do TCE.
- O contribuinte precisa de comprovante imediato para entrega ao tomador (ex: construtora que exige NFS-e para liberar pagamento). O RPS cumpre esse papel temporariamente.
- Em períodos de fechamento fiscal (último dia do mês, virada de competência), o volume de emissões aumenta 3-5x — exatamente quando o Serpro fica mais instável.
- A SEFAZ municipal pode auditar notas em contingência não transmitidas no prazo — risco de multa para o prestador.

## Quando usar

- Toda integração com o Serpro deve ter contingência — sem exceção.
- Circuit breaker é mandatório em qualquer cliente HTTP para sistema externo de missão crítica.
- Sistemas multi-município com dezenas de prefeituras integradas sofrem mais impacto: basta um município em contingência para gerar alertas.

## Trade-offs

| Aspecto | Com contingência | Sem contingência |
|---|---|---|
| Disponibilidade | Alta — emite mesmo com Serpro fora | Baixa — falha junto com o Serpro |
| Complexidade | Média — circuit breaker + fila de retransmissão | Baixa — só HTTP direto |
| Risco fiscal | Baixo — transmissão garantida | Alto — nota perdida se serviço cair |
| Experiência do usuário | Boa — recebe RPS imediatamente | Ruim — erro 500 na cara |
| Rastreabilidade | Total — log de cada tentativa | Parcial |

## Implementação

### 1. Tabela PostgreSQL `nfse_transmissao_log`

```sql
-- migrations/0002_create_nfse_transmissao_log.sql
CREATE TABLE nfse_transmissao_log (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nfse_id       UUID        NOT NULL REFERENCES nfse (id) ON DELETE CASCADE,
  tentativa     INTEGER     NOT NULL,
  iniciado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  concluido_em  TIMESTAMPTZ,
  status        VARCHAR(20) NOT NULL,  -- SUCESSO, FALHA, TIMEOUT, REJEITADA
  http_status   INTEGER,
  erro_codigo   VARCHAR(50),
  erro_mensagem TEXT,
  payload_size  INTEGER,               -- bytes enviados
  latencia_ms   INTEGER,               -- tempo de resposta do Serpro
  ambiente      VARCHAR(20) NOT NULL DEFAULT 'homologacao'
);

CREATE INDEX idx_log_nfse_id ON nfse_transmissao_log (nfse_id, iniciado_em DESC);
CREATE INDEX idx_log_status  ON nfse_transmissao_log (status, iniciado_em DESC);
```

### 2. SerproCircuitBreaker

```typescript
// nfse/circuit-breaker/serpro-circuit-breaker.service.ts
import { Injectable, Logger } from '@nestjs/common';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Número de falhas consecutivas para abrir o circuito */
  failureThreshold: number;
  /** Segundos em OPEN antes de tentar HALF_OPEN */
  recoveryTimeoutSeconds: number;
  /** Número de sucessos em HALF_OPEN para fechar o circuito */
  successThreshold: number;
}

@Injectable()
export class SerproCircuitBreaker {
  private readonly logger = new Logger(SerproCircuitBreaker.name);

  private state: CircuitState = 'CLOSED';
  private falhasConsecutivas = 0;
  private sucessosConsecutivos = 0;
  private abertoDesde: Date | null = null;

  private readonly config: CircuitBreakerConfig = {
    failureThreshold: 5,         // abre após 5 falhas seguidas
    recoveryTimeoutSeconds: 120, // tenta HALF_OPEN após 2 minutos
    successThreshold: 2,         // fecha após 2 sucessos em HALF_OPEN
  };

  get estado(): CircuitState {
    return this.state;
  }

  get estaAberto(): boolean {
    if (this.state === 'OPEN') {
      // Verificar se é hora de tentar HALF_OPEN
      const segundosAberto =
        (Date.now() - this.abertoDesde!.getTime()) / 1000;
      if (segundosAberto >= this.config.recoveryTimeoutSeconds) {
        this.transicionarPara('HALF_OPEN');
        return false;
      }
      return true;
    }
    return false;
  }

  registrarSucesso(): void {
    this.falhasConsecutivas = 0;

    if (this.state === 'HALF_OPEN') {
      this.sucessosConsecutivos++;
      if (this.sucessosConsecutivos >= this.config.successThreshold) {
        this.transicionarPara('CLOSED');
      }
    }
  }

  registrarFalha(erro: Error): void {
    this.sucessosConsecutivos = 0;
    this.falhasConsecutivas++;

    this.logger.warn(
      `Serpro falhou (${this.falhasConsecutivas}/${this.config.failureThreshold}): ${erro.message}`,
    );

    if (
      this.state === 'HALF_OPEN' ||
      this.falhasConsecutivas >= this.config.failureThreshold
    ) {
      this.transicionarPara('OPEN');
    }
  }

  private transicionarPara(novoEstado: CircuitState): void {
    const estadoAnterior = this.state;
    this.state = novoEstado;

    if (novoEstado === 'OPEN') {
      this.abertoDesde = new Date();
      this.logger.error(
        `Circuit Breaker ABERTO — Serpro indisponível. Modo contingência ativado.`,
      );
      // Disparar alerta: Slack, PagerDuty
    } else if (novoEstado === 'CLOSED') {
      this.falhasConsecutivas = 0;
      this.sucessosConsecutivos = 0;
      this.abertoDesde = null;
      this.logger.log(`Circuit Breaker FECHADO — Serpro recuperado.`);
    } else if (novoEstado === 'HALF_OPEN') {
      this.logger.log(`Circuit Breaker HALF_OPEN — testando recuperação do Serpro.`);
    }

    this.logger.log(`Transição: ${estadoAnterior} → ${novoEstado}`);
  }

  /** Expor métricas para Prometheus / health check */
  getMetrics() {
    return {
      estado: this.state,
      falhasConsecutivas: this.falhasConsecutivas,
      abertoDesde: this.abertoDesde?.toISOString() ?? null,
      segundosAberto: this.abertoDesde
        ? Math.floor((Date.now() - this.abertoDesde.getTime()) / 1000)
        : 0,
    };
  }
}
```

### 3. NfseTransmissaoWorker — BullMQ com retry exponencial

```typescript
// nfse/workers/nfse-transmissao.worker.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosError } from 'axios';
import { SerproCircuitBreaker } from '../circuit-breaker/serpro-circuit-breaker.service';
import { Nfse } from '../entities/nfse.entity';
import { NfseTransmissaoLog } from '../entities/nfse-transmissao-log.entity';
import { CertificateService } from '../../certificate/certificate.service';

@Processor('nfse-transmissao', {
  concurrency: 3, // máximo 3 transmissões simultâneas por worker
})
export class NfseTransmissaoWorker extends WorkerHost {
  private readonly logger = new Logger(NfseTransmissaoWorker.name);

  constructor(
    @InjectRepository(Nfse)
    private readonly nfseRepo: Repository<Nfse>,
    @InjectRepository(NfseTransmissaoLog)
    private readonly logRepo: Repository<NfseTransmissaoLog>,
    private readonly circuitBreaker: SerproCircuitBreaker,
    private readonly certService: CertificateService,
  ) {
    super();
  }

  async process(job: Job<{ nfseId: string }>): Promise<void> {
    const { nfseId } = job.data;
    const tentativa = (job.attemptsMade ?? 0) + 1;
    const inicio = Date.now();

    this.logger.log(`Transmitindo NFS-e ${nfseId} — tentativa ${tentativa}`);

    // Verificar circuit breaker ANTES de tentar o request
    if (this.circuitBreaker.estaAberto) {
      this.logger.warn(`Circuit breaker OPEN — colocando ${nfseId} em contingência`);
      await this.marcarContingencia(nfseId, 'Circuit breaker aberto — Serpro indisponível');
      // Não lançar erro: o job não deve ser re-tentado agora
      // O job de varredura vai re-enfileirar quando o CB fechar
      return;
    }

    const nfse = await this.nfseRepo.findOneOrFail({ where: { id: nfseId } });

    if (nfse.status === 'AUTORIZADA') {
      this.logger.log(`NFS-e ${nfseId} já autorizada — ignorando`);
      return;
    }

    const log = this.logRepo.create({
      nfseId,
      tentativa,
      status: 'EM_ANDAMENTO',
      ambiente: process.env.NFSE_AMBIENTE ?? 'homologacao',
    });
    await this.logRepo.save(log);

    try {
      const certCarregado = await this.certService.carregarCertificadoP12(nfse.municipioIbge);
      const payload = this.montarPayload(nfse);
      const jws = this.certService.signJson(payload, nfse.municipioIbge);

      const httpClient = await this.certService.criarClienteMtls(
        certCarregado,
        process.env.NFSE_AMBIENTE === 'producao' ? 'producao' : 'homologacao',
      );

      const inicioHttp = Date.now();
      const resposta = await httpClient.post('/contribuinte/nfse', jws, {
        headers: { 'Content-Type': 'application/jose+json' },
        timeout: 30_000,
      });
      const latencia = Date.now() - inicioHttp;

      // Sucesso — atualizar circuit breaker e banco
      this.circuitBreaker.registrarSucesso();

      const statusNfse = resposta.data?.infNFSe?.cStat ?? 'AUTORIZADA';
      await this.nfseRepo.update(nfseId, {
        status: statusNfse,
        numeroNfse: resposta.data?.infNFSe?.nNFSe,
        chaveAcesso: resposta.data?.infNFSe?.chNFSe,
        respostaSerpro: resposta.data,
        dataEmissao: statusNfse === 'AUTORIZADA' ? new Date() : undefined,
        payloadEnviado: payload,
      });

      await this.logRepo.update(log.id, {
        status: 'SUCESSO',
        httpStatus: resposta.status,
        latenciaMs: latencia,
        concluido_em: new Date(),
      });

      this.logger.log(`NFS-e ${nfseId} AUTORIZADA (latência: ${latencia}ms)`);
    } catch (erro) {
      const latencia = Date.now() - inicio;
      await this.tratarErro(erro, nfseId, log.id, tentativa, latencia, job);
    }
  }

  private async tratarErro(
    erro: AxiosError | Error,
    nfseId: string,
    logId: string,
    tentativa: number,
    latencia: number,
    job: Job,
  ): Promise<void> {
    const httpStatus = (erro as AxiosError).response?.status;
    const erroCodigo = (erro as AxiosError).response?.data?.['cStat'] ?? 'TIMEOUT';
    const erroMensagem = erro.message;

    await this.logRepo.update(logId, {
      status: httpStatus ? 'FALHA' : 'TIMEOUT',
      httpStatus,
      erroCodigo: String(erroCodigo),
      erroMensagem,
      latenciaMs: latencia,
      concluido_em: new Date(),
    });

    // Erros que NÃO devem ser retentados (rejeição permanente da nota)
    const errosDefinitivos = ['E1', 'E2', 'E3']; // códigos do Serpro para erro no dados
    if (httpStatus === 422 || errosDefinitivos.includes(String(erroCodigo))) {
      this.logger.error(`NFS-e ${nfseId} REJEITADA definitivamente: ${erroMensagem}`);
      await this.nfseRepo.update(nfseId, {
        status: 'REJEITADA',
        ultimoErro: erroMensagem,
      });
      throw new UnrecoverableError(`Nota rejeitada pelo Serpro: ${erroMensagem}`);
    }

    // Erros de infraestrutura — registrar no circuit breaker
    if (!httpStatus || httpStatus >= 500) {
      this.circuitBreaker.registrarFalha(erro);
    }

    // Backoff exponencial: 30s, 1min, 2min, 4min, 8min
    const delays = [30_000, 60_000, 120_000, 240_000, 480_000];
    const proximoDelay = delays[Math.min(tentativa - 1, delays.length - 1)];

    this.logger.warn(
      `NFS-e ${nfseId} falhou (tentativa ${tentativa}). Próxima tentativa em ${proximoDelay / 1000}s`,
    );

    await this.nfseRepo.update(nfseId, {
      status: 'CONTINGENCIA',
      ultimoErro: erroMensagem,
      tentativasEnvio: tentativa,
    });

    throw erro; // BullMQ re-enfileira com o delay configurado no job
  }

  private async marcarContingencia(nfseId: string, motivo: string): Promise<void> {
    await this.nfseRepo.update(nfseId, {
      status: 'CONTINGENCIA',
      ultimoErro: motivo,
    });
  }

  private montarPayload(nfse: Nfse): object {
    // Mesma lógica do NfseService.montarPayloadMnd()
    // Em produção, extrair para um NfsePayloadBuilder compartilhado
    return { infNFSe: { /* ... */ } };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      this.logger.error(
        `NFS-e ${job.data.nfseId} entrou em dead letter após ${job.attemptsMade} tentativas: ${error.message}`,
      );
      // Alertar equipe de suporte
    }
  }
}
```

### 4. Job de varredura — re-enfileira contingências pendentes

```typescript
// nfse/cron/nfse-varredura.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Nfse } from '../entities/nfse.entity';
import { SerproCircuitBreaker } from '../circuit-breaker/serpro-circuit-breaker.service';

@Injectable()
export class NfseVarreduraCron {
  private readonly logger = new Logger(NfseVarreduraCron.name);

  constructor(
    @InjectRepository(Nfse)
    private readonly nfseRepo: Repository<Nfse>,
    @InjectQueue('nfse-transmissao')
    private readonly nfseQueue: Queue,
    private readonly circuitBreaker: SerproCircuitBreaker,
  ) {}

  /**
   * A cada 5 minutos: re-enfileira notas em contingência por mais de 30 minutos.
   * Só age se o circuit breaker estiver fechado (Serpro disponível).
   */
  @Cron('*/5 * * * *')
  async reEnfileirarContingencias(): Promise<void> {
    if (this.circuitBreaker.estaAberto) {
      this.logger.debug('Circuit breaker aberto — pulando varredura de contingências');
      return;
    }

    const limite = new Date(Date.now() - 30 * 60_000); // 30 minutos atrás

    const contingencias = await this.nfseRepo.find({
      where: {
        status: 'CONTINGENCIA',
        updatedAt: LessThan(limite),
      },
      take: 100, // processar em lotes para não sobrecarregar a fila
      order: { updatedAt: 'ASC' }, // mais antigas primeiro
    });

    if (contingencias.length === 0) return;

    this.logger.log(`Varredura: ${contingencias.length} notas em contingência para re-enfileirar`);

    // Alerta se fila muito grande
    if (contingencias.length > 50) {
      this.logger.error(
        `ALERTA: ${contingencias.length} notas em contingência > 30min — verificar Serpro`,
      );
      // Disparar alerta Grafana/Prometheus/Slack
    }

    for (const nfse of contingencias) {
      const jobExistente = await this.nfseQueue.getJob(`transmitir:${nfse.id}`);
      if (jobExistente) continue; // já está na fila

      await this.nfseQueue.add(
        'transmitir',
        { nfseId: nfse.id },
        {
          jobId: `transmitir:${nfse.id}`, // idempotente
          attempts: 5,
          backoff: { type: 'exponential', delay: 30_000 },
        },
      );
    }
  }

  /**
   * A cada hora: mover para dead letter notas em contingência > 48h.
   * Após 48h sem transmissão, a nota pode ser inválida fiscalmente.
   */
  @Cron('0 * * * *')
  async expirarContingenciasAntigas(): Promise<void> {
    const limite48h = new Date(Date.now() - 48 * 60 * 60_000);

    const expiradas = await this.nfseRepo.find({
      where: { status: 'CONTINGENCIA', updatedAt: LessThan(limite48h) },
    });

    if (expiradas.length === 0) return;

    this.logger.error(
      `${expiradas.length} notas em contingência > 48h — INTERVENÇÃO MANUAL NECESSÁRIA`,
    );

    // Mover para status especial de expiradas
    await this.nfseRepo.update(
      expiradas.map((n) => n.id),
      { status: 'REJEITADA', ultimoErro: 'Prazo de contingência (48h) expirado sem transmissão.' },
    );

    // Alertar com alta prioridade — pode impactar contribuintes fiscalmente
  }
}
```

### 5. Endpoint de status para polling do frontend

```typescript
// nfse/nfse.controller.ts
import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nfse } from './entities/nfse.entity';
import { NfseTransmissaoLog } from './entities/nfse-transmissao-log.entity';
import { SerproCircuitBreaker } from './circuit-breaker/serpro-circuit-breaker.service';

@Controller('nfse')
export class NfseController {
  constructor(
    @InjectRepository(Nfse)
    private readonly nfseRepo: Repository<Nfse>,
    @InjectRepository(NfseTransmissaoLog)
    private readonly logRepo: Repository<NfseTransmissaoLog>,
    private readonly circuitBreaker: SerproCircuitBreaker,
  ) {}

  /**
   * Polling do frontend para saber o status de uma NFS-e pelo número de RPS.
   * GET /nfse/:rpsNumero/status
   */
  @Get(':rpsNumero/status')
  async getStatus(@Param('rpsNumero') rpsNumero: string) {
    const nfse = await this.nfseRepo.findOne({
      where: { rpsNumero: parseInt(rpsNumero) },
      select: ['id', 'status', 'numeroNfse', 'chaveAcesso', 'dataEmissao', 'ultimoErro', 'tentativasEnvio'],
    });

    if (!nfse) throw new NotFoundException(`RPS ${rpsNumero} não encontrado`);

    const ultimasTentativas = await this.logRepo.find({
      where: { nfseId: nfse.id },
      order: { iniciadoEm: 'DESC' },
      take: 5,
      select: ['tentativa', 'status', 'iniciadoEm', 'latenciaMs', 'erroMensagem'],
    });

    return {
      rpsNumero: parseInt(rpsNumero),
      status: nfse.status,
      numeroNfse: nfse.numeroNfse ?? null,
      chaveAcesso: nfse.chaveAcesso ?? null,
      dataEmissao: nfse.dataEmissao ?? null,
      emContingencia: nfse.status === 'CONTINGENCIA',
      tentativasEnvio: nfse.tentativasEnvio,
      ultimoErro: nfse.ultimoErro ?? null,
      serpro: {
        disponivel: !this.circuitBreaker.estaAberto,
        circuitState: this.circuitBreaker.estado,
      },
      historico: ultimasTentativas,
      // Frontend usa esse campo para decidir se deve continuar polling
      finalizado: ['AUTORIZADA', 'CANCELADA', 'REJEITADA'].includes(nfse.status),
    };
  }

  /** Health check do circuit breaker para monitoramento */
  @Get('health/serpro')
  getSerproHealth() {
    return {
      ...this.circuitBreaker.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 6. Polling no frontend Next.js

```typescript
// app/(dashboard)/nfse/[rps]/status/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface NfseStatus {
  rpsNumero: number;
  status: string;
  numeroNfse: string | null;
  emContingencia: boolean;
  tentativasEnvio: number;
  finalizado: boolean;
  serpro: { disponivel: boolean; circuitState: string };
}

export default function NfseStatusPage({ params }: { params: { rps: string } }) {
  const [status, setStatus] = useState<NfseStatus | null>(null);
  const [intervalo, setIntervalo] = useState(5_000); // 5s inicial

  useEffect(() => {
    if (status?.finalizado) return; // parar polling quando finalizado

    const poll = async () => {
      const res = await fetch(`/api/nfse/${params.rps}/status`);
      const data: NfseStatus = await res.json();
      setStatus(data);

      // Backoff progressivo: se em contingência, aumentar intervalo para não sobrecarregar
      if (data.emContingencia) {
        setIntervalo((prev) => Math.min(prev * 1.5, 60_000)); // máximo 1 min
      } else {
        setIntervalo(5_000); // voltar para 5s se saiu da contingência
      }
    };

    poll();
    const timer = setInterval(poll, intervalo);
    return () => clearInterval(timer);
  }, [params.rps, status?.finalizado, intervalo]);

  if (!status) return <p>Carregando...</p>;

  return (
    <div>
      <h1>NFS-e — RPS {status.rpsNumero}</h1>
      <p>Status: <strong>{status.status}</strong></p>

      {status.emContingencia && (
        <div className="alert-warning">
          Nota em contingência — aguardando Serpro ({status.tentativasEnvio} tentativas).
          {!status.serpro.disponivel && ' Serpro indisponível no momento.'}
        </div>
      )}

      {status.numeroNfse && (
        <p>Número NFS-e: <strong>{status.numeroNfse}</strong></p>
      )}

      {status.finalizado && status.status !== 'AUTORIZADA' && (
        <div className="alert-error">
          Nota {status.status}. Entre em contato com o suporte.
        </div>
      )}
    </div>
  );
}
```

### 7. Métricas Prometheus para Grafana

```typescript
// nfse/metrics/nfse.metrics.ts
import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, register } from 'prom-client';

@Injectable()
export class NfseMetrics {
  readonly emissoesPorStatus = new Counter({
    name: 'nfse_emissoes_total',
    help: 'Total de NFS-e por status final',
    labelNames: ['status', 'municipio'],
  });

  readonly notasEmContingencia = new Gauge({
    name: 'nfse_contingencia_atual',
    help: 'Número de NFS-e atualmente em contingência',
    labelNames: ['municipio'],
  });

  readonly latenciaSerproMs = new Histogram({
    name: 'serpro_latencia_ms',
    help: 'Latência das requisições ao Serpro em ms',
    buckets: [500, 1000, 3000, 5000, 10000, 30000],
  });

  readonly circuitBreakerAberto = new Gauge({
    name: 'serpro_circuit_breaker_aberto',
    help: '1 se o circuit breaker do Serpro está aberto, 0 se fechado',
  });
}

// Usar no NfseTransmissaoWorker:
// this.metrics.emissoesPorStatus.inc({ status: 'AUTORIZADA', municipio: nfse.municipioIbge });
// this.metrics.latenciaSerproMs.observe(latencia);
```

## Armadilhas

- **Idempotência na retransmissão**: antes de retransmitir uma nota em contingência, consultar o Serpro (`GET /contribuinte/nfse?rps=X`) para verificar se a nota já foi autorizada por alguma tentativa anterior. Sem isso, corre o risco de emitir a mesma nota duas vezes para o contribuinte — infração fiscal grave.
- **RPS duplicado em contingência**: o número de RPS deve ser gerado localmente e ser único por prefeitura + prestador. Nunca reutilizar um número de RPS de nota rejeitada — o Serpro pode rejeitar por "RPS já processado".
- **Dead letter queue sem alerta**: notas que esgotam as tentativas de retransmissão ficam na DLQ silenciosamente. Configurar alertas de DLQ no Redis/BullMQ com webhook para Slack ou PagerDuty — e designar responsável para triagem manual.
- **Circuit breaker sem persistência**: o estado do circuit breaker em memória se perde ao reiniciar o processo. Se o Serpro estava fora e o worker reiniciou, o CB volta fechado e pode tentar transmissões que vão falhar repetidamente. Persistir estado do CB no Redis para compartilhar entre instâncias do worker.
- **Fila crescendo silenciosamente**: a varredura a cada 5min é necessária, mas não suficiente se o volume for muito alto. Monitorar `nfse_contingencia_atual` no Grafana com alerta em > 50 notas ou tempo médio em contingência > 1h.
- **Certificado expirado em contingência**: se a nota ficou em contingência por horas e o certificado expirou nesse período, a retransmissão vai falhar por erro de assinatura — que parece erro de dados mas é erro de infra. Verificar validade do certificado antes de cada tentativa de retransmissão.
- **Múltiplos workers em paralelo**: com `concurrency > 1` no BullMQ, dois workers podem pegar o mesmo job. Usar `jobId` único e idempotência no banco (verificar `status === 'AUTORIZADA'` no início do `process()`) para evitar dupla transmissão.

## Referências

- [Manual do Padrão Nacional de NFS-e — Contingência](https://www.nfse.gov.br/PortalNFSe/contribuinte/orientacoes)
- [BullMQ — Retries e Backoff](https://docs.bullmq.io/guide/retrying-failing-jobs)
- [BullMQ — Dead Letter Queue](https://docs.bullmq.io/patterns/dead-letter-queue)
- [Circuit Breaker Pattern — Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Prometheus Client Node.js](https://github.com/siimon/prom-client)
- [NestJS Schedule — Cron Jobs](https://docs.nestjs.com/techniques/task-scheduling)
