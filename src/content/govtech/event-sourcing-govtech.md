---
title: "Event Sourcing para Auditoria Imutável em Sistemas Públicos"
category: "govtech"
stack: ["NestJS", "PostgreSQL", "TypeORM"]
tags: ["event-sourcing", "auditoria", "tce", "imutabilidade", "b2g", "empenho"]
excerpt: "Event Sourcing como trilha de auditoria imutável para sistemas financeiros municipais: exigência TCE, modelagem de eventos de empenho e replay de estado."
---

## Visão Geral

Event Sourcing armazena a **sequência de eventos** que levou ao estado atual, em vez do estado final. Para sistemas financeiros públicos, isso não é uma escolha arquitetural — é uma exigência dos Tribunais de Contas Estaduais (TCE) e do TCU: toda operação financeira deve ter trilha de auditoria imutável que permita reconstruir o estado do sistema em qualquer momento passado.

Em CRUD tradicional, `UPDATE empenho SET status = 'anulado'` apaga o histórico. Em Event Sourcing, você registra `EmpenhoAnuladoEvent` e o estado anterior permanece acessível para auditoria e para eventual contestação judicial.

## Contexto B2G

- TCE-SP, TCE-MG e TCU exigem rastreabilidade completa de empenhos, liquidações e pagamentos
- Toda anulação de empenho deve registrar motivo, responsável e timestamp imutável
- Auditorias de CGU/TCU frequentemente pedem "reconstrua o estado das contas em 15/03/2024" — com Event Sourcing isso é trivial
- LRF (Lei de Responsabilidade Fiscal) exige demonstrativos que requerem histórico íntegro de execução orçamentária
- Portaria SOF 8.165/2021 regulamenta o SIAFI municipal com exigências de rastreabilidade

## Quando usar

- Módulo financeiro do ERP municipal (empenhos, liquidações, pagamentos, estornos)
- Qualquer operação que gera obrigação fiscal ou legal
- Dados sujeitos a contestação judicial (tributos, multas, contratos)
- Quando o auditor precisa reconstruir o estado de um processo em data específica

## Trade-offs

| Aspecto | Event Sourcing | CRUD com audit log |
|---|---|---|
| Trilha de auditoria | Perfeita — o estado IS os eventos | Boa — mas pode dessincronizar |
| Consulta de estado atual | Requer projeção (read model) | Direta |
| Complexidade | Alta — curva steep, dois modelos (write/read) | Baixa |
| Replay e debugging | Trivial — reprocese os eventos | Impossível sem snapshot |
| Conformidade TCE | Excelente — nenhum dado é perdido | Aceitável, com cuidado |

**Use Event Sourcing apenas onde a imutabilidade é requisito legal**. Para cadastros e configurações, CRUD com soft-delete é suficiente.

## Implementação

### 1. Event Store no PostgreSQL

```sql
-- migrations/0042_create_event_store.sql
CREATE TABLE financial_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aggregate_type  VARCHAR(100)  NOT NULL,
  aggregate_id    UUID          NOT NULL,
  event_type      VARCHAR(150)  NOT NULL,
  event_version   INTEGER       NOT NULL DEFAULT 1,
  sequence        BIGINT        NOT NULL,
  payload         JSONB         NOT NULL,
  metadata        JSONB         NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  recorded_by     UUID          NOT NULL,  -- FK para usuários
  session_id      VARCHAR(200),            -- ID da sessão Keycloak
  ip_address      INET,
  UNIQUE (aggregate_id, sequence)
);

-- Índices críticos para auditoria
CREATE INDEX idx_events_aggregate ON financial_events (aggregate_type, aggregate_id);
CREATE INDEX idx_events_type ON financial_events (event_type);
CREATE INDEX idx_events_occurred ON financial_events (occurred_at);
CREATE INDEX idx_events_recorded_by ON financial_events (recorded_by);

-- Tabela IMUTÁVEL — sem UPDATE, sem DELETE
-- Aplicar via política RLS se necessário
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY no_update ON financial_events FOR UPDATE USING (false);
CREATE POLICY no_delete ON financial_events FOR DELETE USING (false);
```

### 2. Tipos de Eventos Financeiros

```typescript
// src/financeiro/events/empenho.events.ts

export type EmpenhoEventType =
  | 'EmpenhoRegistrado'
  | 'EmpenhoAlterado'
  | 'EmpenhoAnulado'
  | 'EmpenhoLiquidado'
  | 'PagamentoAutorizado'
  | 'PagamentoEstornado';

export interface EmpenhoRegistradoPayload {
  numero: string;
  valor: number;          // em centavos — nunca float para dinheiro
  dotacaoOrcamentaria: string;
  fornecedorCnpj: string;
  descricao: string;
  exercicio: number;
}

export interface EmpenhoAnuladoPayload {
  motivoCodigo: string;   // código padronizado TCE
  motivoDescricao: string;
  valorAnulado: number;   // pode ser parcial
}

export interface PagamentoAutorizadoPayload {
  liquidacaoId: string;
  valor: number;
  contaBancaria: string;
  dataPrevistaPagamento: string;
  ordemBancaria: string;
}

export interface FinancialEvent<T = unknown> {
  aggregateId: string;
  aggregateType: string;
  eventType: EmpenhoEventType;
  payload: T;
  occurredAt: Date;
}
```

### 3. Aggregate Base e Empenho Aggregate

```typescript
// src/financeiro/aggregates/base.aggregate.ts

export abstract class AggregateRoot {
  protected readonly _id: string;
  private _version: number = 0;
  private _uncommittedEvents: FinancialEvent[] = [];

  constructor(id: string) {
    this._id = id;
  }

  get id() { return this._id; }
  get version() { return this._version; }
  get uncommittedEvents() { return [...this._uncommittedEvents]; }

  protected apply(event: FinancialEvent): void {
    this.handle(event);
    this._uncommittedEvents.push(event);
    this._version++;
  }

  // Reconstituir a partir de eventos históricos (sem gerar novos)
  rehydrate(events: FinancialEvent[]): void {
    for (const event of events) {
      this.handle(event);
      this._version++;
    }
  }

  clearUncommittedEvents(): void {
    this._uncommittedEvents = [];
  }

  protected abstract handle(event: FinancialEvent): void;
}
```

```typescript
// src/financeiro/aggregates/empenho.aggregate.ts
import { AggregateRoot } from './base.aggregate';
import { BadRequestException } from '@nestjs/common';

export type EmpenhoStatus =
  | 'registrado'
  | 'alterado'
  | 'liquidado'
  | 'pago'
  | 'anulado';

export class EmpenhoAggregate extends AggregateRoot {
  private _status: EmpenhoStatus = 'registrado';
  private _valor: number = 0;
  private _numero: string = '';
  private _valorPago: number = 0;

  get status() { return this._status; }
  get valor() { return this._valor; }
  get numero() { return this._numero; }

  // ── Comandos ──────────────────────────────────────────────────

  registrar(payload: EmpenhoRegistradoPayload): void {
    if (this._version > 0) throw new BadRequestException('Empenho já registrado');
    this.apply({
      aggregateId: this._id,
      aggregateType: 'Empenho',
      eventType: 'EmpenhoRegistrado',
      payload,
      occurredAt: new Date(),
    });
  }

  anular(payload: EmpenhoAnuladoPayload): void {
    if (this._status === 'anulado') throw new BadRequestException('Empenho já anulado');
    if (this._status === 'pago') throw new BadRequestException('Empenho pago não pode ser anulado diretamente');
    this.apply({
      aggregateId: this._id,
      aggregateType: 'Empenho',
      eventType: 'EmpenhoAnulado',
      payload,
      occurredAt: new Date(),
    });
  }

  autorizarPagamento(payload: PagamentoAutorizadoPayload): void {
    if (this._status !== 'liquidado') {
      throw new BadRequestException('Empenho precisa estar liquidado antes do pagamento');
    }
    this.apply({
      aggregateId: this._id,
      aggregateType: 'Empenho',
      eventType: 'PagamentoAutorizado',
      payload,
      occurredAt: new Date(),
    });
  }

  // ── Event Handlers (reconstituição de estado) ─────────────────

  protected handle(event: FinancialEvent): void {
    switch (event.eventType) {
      case 'EmpenhoRegistrado': {
        const p = event.payload as EmpenhoRegistradoPayload;
        this._status = 'registrado';
        this._valor = p.valor;
        this._numero = p.numero;
        break;
      }
      case 'EmpenhoAnulado': {
        const p = event.payload as EmpenhoAnuladoPayload;
        this._valor -= p.valorAnulado;
        if (this._valor <= 0) this._status = 'anulado';
        break;
      }
      case 'EmpenhoLiquidado': {
        this._status = 'liquidado';
        break;
      }
      case 'PagamentoAutorizado': {
        const p = event.payload as PagamentoAutorizadoPayload;
        this._valorPago += p.valor;
        if (this._valorPago >= this._valor) this._status = 'pago';
        break;
      }
    }
  }
}
```

### 4. Event Store Repository

```typescript
// src/financeiro/repositories/event-store.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class EventStoreRepository {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async append(
    events: FinancialEvent[],
    metadata: { userId: string; sessionId: string; ip: string },
  ): Promise<void> {
    if (events.length === 0) return;

    await this.ds.transaction(async (em) => {
      for (const event of events) {
        // Pegar próximo sequence para o aggregate
        const { seq } = await em
          .createQueryBuilder()
          .select('COALESCE(MAX(sequence), 0) + 1', 'seq')
          .from('financial_events', 'e')
          .where('e.aggregate_id = :id', { id: event.aggregateId })
          .getRawOne<{ seq: number }>();

        await em.query(
          `INSERT INTO financial_events
             (aggregate_type, aggregate_id, event_type, sequence,
              payload, occurred_at, recorded_by, session_id, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            event.aggregateType,
            event.aggregateId,
            event.eventType,
            seq,
            JSON.stringify(event.payload),
            event.occurredAt,
            metadata.userId,
            metadata.sessionId,
            metadata.ip,
          ],
        );
      }
    });
  }

  async loadEvents(aggregateId: string): Promise<FinancialEvent[]> {
    const rows = await this.ds.query(
      `SELECT * FROM financial_events
       WHERE aggregate_id = $1
       ORDER BY sequence ASC`,
      [aggregateId],
    );

    return rows.map((r: any) => ({
      aggregateId: r.aggregate_id,
      aggregateType: r.aggregate_type,
      eventType: r.event_type,
      payload: r.payload,
      occurredAt: r.occurred_at,
    }));
  }

  // Reconstruir estado do aggregate em uma data específica (para auditoria TCE)
  async loadEventsUntil(aggregateId: string, until: Date): Promise<FinancialEvent[]> {
    const rows = await this.ds.query(
      `SELECT * FROM financial_events
       WHERE aggregate_id = $1 AND occurred_at <= $2
       ORDER BY sequence ASC`,
      [aggregateId, until],
    );

    return rows.map((r: any) => ({
      aggregateId: r.aggregate_id,
      aggregateType: r.aggregate_type,
      eventType: r.event_type,
      payload: r.payload,
      occurredAt: r.occurred_at,
    }));
  }
}
```

### 5. Projeção (Read Model) para Consultas Rápidas

```typescript
// src/financeiro/projections/empenho-projection.entity.ts
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('empenhos_view')
export class EmpenhoProjection {
  @PrimaryColumn('uuid')
  id: string;

  @Column() numero: string;
  @Column() status: string;
  @Column('bigint') valor: number;  // em centavos

  @Index()
  @Column() dotacaoOrcamentaria: string;

  @Column() fornecedorCnpj: string;
  @Column('int') exercicio: number;
  @Column('timestamptz') criadoEm: Date;
  @Column('timestamptz', { nullable: true }) anulacaoEm: Date | null;
  @Column({ nullable: true }) anulacaoMotivo: string | null;
}
```

## Armadilhas

- **Event Sourcing para tudo**: Use apenas onde auditoria imutável é requisito legal. Módulo de cadastros não precisa.
- **Payload sem versionamento**: Quando o schema do `EmpenhoRegistradoPayload` muda, eventos antigos ficam inválidos. Adicione `event_version` e mantenha migrations de payload.
- **Sem projeção (read model)**: Reconstruir aggregate a cada leitura para relatórios mata performance. Crie projeções atualizadas via eventos.
- **Sequence gaps**: Conflito de sequence em alta concorrência gera deadlock. Use `SELECT FOR UPDATE` ou geração sequencial em lock.
- **Não restaurar aggregate antes de comandar**: Sempre `loadEvents` → `rehydrate` → `comando` → `append`. Nunca comandar sem estado reconstituído.

## Referências

- [EventStorming — Alberto Brandolini](https://www.eventstorming.com/)
- [Implementing Domain-Driven Design — Vaughn Vernon](https://vaughnvernon.co/)
- [TCE-SP Manual de Auditoria de TI](https://www.tce.sp.gov.br)
- [Portaria SOF 8.165/2021 — SIAFI Municipal](https://www.gov.br/tesouronacional)
