---
title: "NestJS Audit Interceptor para Sistemas Públicos"
category: "govtech"
stack: ["NestJS", "PostgreSQL", "BullMQ", "TypeScript"]
tags: ["auditoria", "interceptor", "guard", "nestjs", "b2g", "compliance", "lgpd"]
excerpt: "Interceptor NestJS que captura automaticamente quem fez o quê, quando e com qual payload — sem bloquear o request e com persistência assíncrona via BullMQ."
---

## Visão Geral

Em sistemas B2G, toda ação crítica precisa ser auditada: quem aprovou o empenho, quem alterou o salário de um servidor, quem acessou dados pessoais de um contribuinte. O NestJS Interceptor é o lugar certo para capturar isso — transparente para o controller, sem duplicação de código e sem impactar a latência do request.

A chave é não bloquear: o interceptor captura os dados e joga em uma fila (BullMQ), o worker persiste de forma assíncrona. O request responde normalmente.

## Contexto B2G

- CGU e TCE auditam logs de acesso a dados pessoais (LGPD + LRF)
- "Quem aprovou esse pagamento?" é a pergunta mais comum em auditorias fiscais
- Logs de alteração de cadastro de fornecedor são exigidos para detectar esquemas de fraude
- LGPD Art. 37 exige registro de operações de tratamento de dados pessoais
- Sistemas municipais ficam sujeitos a LAI (Lei de Acesso à Informação): logs podem ser solicitados por qualquer cidadão

## Quando usar

- Qualquer endpoint que modifique dados financeiros (empenhos, pagamentos, contratos)
- Acesso a dados pessoais de contribuintes ou servidores
- Operações de CRUD em cadastros críticos (fornecedores, licitações, dotações)
- Endpoints administrativos (criação de usuários, alteração de roles)

## Trade-offs

| Abordagem | Vantagem | Desvantagem |
|---|---|---|
| Interceptor global | Zero código nos controllers | Captura tudo — filtre bem o que auditar |
| Decorator `@Audited()` | Auditoria explícita e controlada | Pode esquecer de anotar endpoint crítico |
| Trigger PostgreSQL | Cobre até queries diretas ao banco | Sem contexto HTTP (quem, IP, session) |
| **Combinação ideal** | Interceptor + Trigger | Complexidade operacional maior |

A combinação ideal para B2G é: Interceptor NestJS para contexto HTTP + Trigger PG para garantia no banco.

## Implementação

### 1. Schema da Tabela de Auditoria com Particionamento

```sql
-- migrations/0040_create_audit_logs.sql

-- Tabela particionada por mês (5 anos de retenção = 60 partições)
CREATE TABLE audit_logs (
  id              UUID DEFAULT gen_random_uuid() NOT NULL,
  entity_type     VARCHAR(100)  NOT NULL,
  entity_id       VARCHAR(200),
  action          VARCHAR(50)   NOT NULL,  -- CREATE, UPDATE, DELETE, READ
  endpoint        VARCHAR(500)  NOT NULL,
  http_method     VARCHAR(10)   NOT NULL,
  user_id         UUID          NOT NULL,
  username        VARCHAR(200)  NOT NULL,
  user_roles      TEXT[]        NOT NULL DEFAULT '{}',
  ip_address      INET,
  session_id      VARCHAR(200),
  payload_before  JSONB,        -- estado antes (para UPDATE/DELETE)
  payload_after   JSONB,        -- estado depois (para CREATE/UPDATE)
  status_code     INTEGER,
  duration_ms     INTEGER,
  occurred_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (occurred_at);

-- Criar partições para os próximos 12 meses
DO $$
DECLARE
  start_date DATE := DATE_TRUNC('month', NOW());
  partition_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    partition_date := start_date + (i || ' months')::INTERVAL;
    partition_name := 'audit_logs_' || TO_CHAR(partition_date, 'YYYY_MM');

    EXECUTE FORMAT(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
       FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      partition_date,
      partition_date + INTERVAL '1 month'
    );
  END LOOP;
END $$;

-- Índices por partição (criados automaticamente nas partições filhas)
CREATE INDEX idx_audit_user ON audit_logs (user_id, occurred_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_occurred ON audit_logs (occurred_at DESC);
```

### 2. Decorator `@Audited()`

```typescript
// src/audit/audited.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_config';

export interface AuditConfig {
  entityType: string;        // ex: 'Empenho', 'Servidor', 'Fornecedor'
  action?: string;           // sobrescreve inferência pelo método HTTP
  capturePayload?: boolean;  // padrão: true para mutações
  captureResponse?: boolean; // padrão: false (performance)
  sensitive?: boolean;       // marca como dado sensível — payload mascarado
}

export const Audited = (config: AuditConfig) =>
  SetMetadata(AUDIT_KEY, config);
```

### 3. Audit Interceptor

```typescript
// src/audit/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AUDIT_KEY, AuditConfig } from './audited.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    @InjectQueue('audit') private auditQueue: Queue,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const config = this.reflector.get<AuditConfig | undefined>(
      AUDIT_KEY,
      context.getHandler(),
    );

    // Pula endpoints não marcados com @Audited
    if (!config) return next.handle();

    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Captura payload ANTES do handler (para UPDATE/DELETE)
    const payloadBefore = this.extractPayloadBefore(req, config);

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const duration = Date.now() - startTime;
          const res = context.switchToHttp().getResponse();

          // Enfileirar de forma assíncrona — não bloquear o request
          this.enqueueAudit({
            config,
            req,
            payloadBefore,
            payloadAfter: config.captureResponse ? responseBody : undefined,
            statusCode: res.statusCode,
            durationMs: duration,
          }).catch((err) =>
            this.logger.error('Falha ao enfileirar audit log', err),
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.enqueueAudit({
            config,
            req,
            payloadBefore,
            payloadAfter: undefined,
            statusCode: err.status ?? 500,
            durationMs: duration,
          }).catch(() => {
            // Falha de audit nunca deve mascarar o erro original
          });
        },
      }),
    );
  }

  private extractPayloadBefore(req: Request & { user?: any }, config: AuditConfig) {
    if (!config.capturePayload) return undefined;
    if (['GET', 'HEAD'].includes((req as any).method)) return undefined;

    const body = (req as any).body;
    if (!body || !config.sensitive) return body;

    // Mascarar campos sensíveis
    return this.maskSensitiveFields(body);
  }

  private maskSensitiveFields(obj: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['senha', 'password', 'token', 'secret', 'cpf', 'rg'];
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        sensitiveKeys.some((sk) => k.toLowerCase().includes(sk)) ? '***' : v,
      ]),
    );
  }

  private async enqueueAudit(data: {
    config: AuditConfig;
    req: any;
    payloadBefore?: unknown;
    payloadAfter?: unknown;
    statusCode: number;
    durationMs: number;
  }): Promise<void> {
    const { config, req, payloadBefore, payloadAfter, statusCode, durationMs } = data;

    const methodActionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
      GET: 'READ',
    };

    await this.auditQueue.add(
      'persist-audit',
      {
        entityType: config.entityType,
        entityId: req.params?.id ?? null,
        action: config.action ?? methodActionMap[req.method] ?? req.method,
        endpoint: req.url,
        httpMethod: req.method,
        userId: req.user?.sub,
        username: req.user?.preferred_username ?? 'unknown',
        userRoles: req.user?.roles ?? [],
        ipAddress: req.ip ?? req.headers['x-forwarded-for'],
        sessionId: req.user?.sessionId,
        payloadBefore,
        payloadAfter,
        statusCode,
        durationMs,
        occurredAt: new Date().toISOString(),
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );
  }
}
```

### 4. Worker BullMQ para Persistência

```typescript
// src/audit/audit.worker.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

@Processor('audit')
export class AuditWorker extends WorkerHost {
  private readonly logger = new Logger(AuditWorker.name);

  constructor(@InjectDataSource() private ds: DataSource) {
    super();
  }

  async process(job: Job<AuditJobData>): Promise<void> {
    const data = job.data;

    try {
      await this.ds.query(
        `INSERT INTO audit_logs
           (entity_type, entity_id, action, endpoint, http_method,
            user_id, username, user_roles, ip_address, session_id,
            payload_before, payload_after, status_code, duration_ms, occurred_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          data.entityType,
          data.entityId,
          data.action,
          data.endpoint,
          data.httpMethod,
          data.userId,
          data.username,
          data.userRoles,
          data.ipAddress,
          data.sessionId,
          data.payloadBefore ? JSON.stringify(data.payloadBefore) : null,
          data.payloadAfter ? JSON.stringify(data.payloadAfter) : null,
          data.statusCode,
          data.durationMs,
          data.occurredAt,
        ],
      );
    } catch (err) {
      this.logger.error(`Falha ao persistir audit log: ${err.message}`, { jobId: job.id });
      throw err; // Deixa BullMQ fazer retry
    }
  }
}

interface AuditJobData {
  entityType: string;
  entityId: string | null;
  action: string;
  endpoint: string;
  httpMethod: string;
  userId: string;
  username: string;
  userRoles: string[];
  ipAddress: string;
  sessionId: string;
  payloadBefore: unknown;
  payloadAfter: unknown;
  statusCode: number;
  durationMs: number;
  occurredAt: string;
}
```

### 5. Uso nos Controllers

```typescript
// src/financeiro/empenho.controller.ts
import { Controller, Post, Patch, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Audited } from '../audit/audited.decorator';

@Controller('empenhos')
@UseGuards(AuthGuard('keycloak'), RolesGuard)
@UseInterceptors(AuditInterceptor)
export class EmpenhoController {
  @Post()
  @Roles('contador', 'secretario')
  @Audited({ entityType: 'Empenho', capturePayload: true })
  async registrar(@Body() dto: RegistrarEmpenhoDto) {
    // ...
  }

  @Patch(':id/anular')
  @Roles('contador', 'secretario', 'prefeito')
  @Audited({ entityType: 'Empenho', action: 'ANULAR', capturePayload: true })
  async anular(@Param('id') id: string, @Body() dto: AnularEmpenhoDto) {
    // ...
  }
}
```

### 6. Registrar no Módulo

```typescript
// src/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditInterceptor } from './audit.interceptor';
import { AuditWorker } from './audit.worker';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audit' }),
  ],
  providers: [AuditInterceptor, AuditWorker],
  exports: [AuditInterceptor],
})
export class AuditModule {}
```

## Armadilhas

- **Bloquear o request**: Nunca `await` a persistência dentro do interceptor. Use fila — audit log pode falhar sem impactar o usuário.
- **Capturar payload de GET em massa**: `@Audited` em listagens gera volume absurdo. Reserve para mutações e READ de dados sensíveis individuais.
- **Sem particionamento na tabela**: Em 5 anos de operação de prefeitura, audit_logs terá centenas de milhões de linhas. Particionamento mensal é obrigatório.
- **Dados pessoais no payload_after**: Endpoint de atualização de servidor retorna CPF? Mascare antes de auditar ou configure `sensitive: true`.
- **Fila sem DLT**: Se o worker falha 5 vezes, onde vai o log? Configure Dead Letter Topic ou tabela de fallback.
- **Sem índice em `entity_id`**: "Me mostre todas as alterações no empenho X" é a query mais frequente de auditoria. Índice composto `(entity_type, entity_id, occurred_at)` é obrigatório.

## Referências

- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [LGPD Art. 37 — Registro de Operações](https://www.gov.br/secretaria-geral/pt-br/noticias/2021/agosto/lgpd)
- [PostgreSQL Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
