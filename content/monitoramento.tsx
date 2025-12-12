import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function MonitoramentoLogs() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Monitoramento & Logs
      </h1>

      <NoteBox type="info" title="Pilares do Observability">
        <ul className="list-disc list-inside">
          <li><strong>Logs</strong> - O que aconteceu</li>
          <li><strong>Metrics</strong> - Quanto/Quando aconteceu</li>
          <li><strong>Traces</strong> - Caminho da requisição</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Logger Estruturado com Pino
      </h3>

      <CodeBlock
        fileName="lib/logger.ts"
        code={`import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Pretty print em dev
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  // Campos base em todos os logs
  base: {
    env: process.env.NODE_ENV,
    service: 'meu-saas',
  },
  // Redact campos sensíveis
  redact: [
    'password',
    'token',
    'authorization',
    'cookie',
    'req.headers.authorization',
    'req.headers.cookie',
  ],
})

// Child loggers por contexto
export function createLogger(context: string) {
  return logger.child({ context })
}

// Uso:
// const log = createLogger('payments')
// log.info({ userId, amount }, 'Payment processed')`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Request Logger Middleware
      </h3>

      <CodeBlock
        fileName="lib/middleware/request-logger.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { v4 as uuid } from 'uuid'

export async function requestLoggerMiddleware(request: NextRequest) {
  const requestId = uuid()
  const start = Date.now()

  // Adiciona request ID ao header
  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)

  // Log da requisição
  logger.info({
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    query: Object.fromEntries(request.nextUrl.searchParams),
    userAgent: request.headers.get('user-agent'),
    ip: request.ip || request.headers.get('x-forwarded-for'),
  }, 'Incoming request')

  return response
}

// Log de resposta (em route handlers)
export function logResponse(
  requestId: string,
  status: number,
  duration: number,
  meta?: Record<string, any>
) {
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'

  logger[level]({
    requestId,
    status,
    duration: \`\${duration}ms\`,
    ...meta,
  }, 'Request completed')
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Sentry para Error Tracking
      </h3>

      <CodeBlock
        fileName="lib/sentry.ts"
        code={`import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // Ignora erros conhecidos
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
    /ResizeObserver loop/,
  ],
  beforeSend(event) {
    // Remove dados sensíveis
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }
    return event
  },
})

// Helper para capturar erros com contexto
export function captureError(
  error: Error,
  context?: {
    userId?: string
    action?: string
    extra?: Record<string, any>
  }
) {
  Sentry.withScope(scope => {
    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }
    if (context?.action) {
      scope.setTag('action', context.action)
    }
    if (context?.extra) {
      scope.setExtras(context.extra)
    }
    Sentry.captureException(error)
  })
}

// Uso:
// captureError(error, { userId: user.id, action: 'checkout' })`}
      />

      <CodeBlock
        fileName="app/global-error.tsx"
        code={`'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
            <p className="text-gray-600 mb-4">
              Nossa equipe foi notificada e está investigando.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Métricas com Prometheus
      </h3>

      <CodeBlock
        fileName="lib/metrics.ts"
        code={`import { Registry, Counter, Histogram, Gauge } from 'prom-client'

export const registry = new Registry()

// Métricas HTTP
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
})

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
})

// Métricas de negócio
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Usuários ativos nos últimos 5 minutos',
  registers: [registry],
})

export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total de pagamentos processados',
  labelNames: ['status', 'method'],
  registers: [registry],
})

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Tamanho atual da fila de jobs',
  labelNames: ['queue'],
  registers: [registry],
})`}
      />

      <CodeBlock
        fileName="app/api/metrics/route.ts"
        code={`import { NextResponse } from 'next/server'
import { registry } from '@/lib/metrics'

export async function GET(request: Request) {
  // Protege endpoint de métricas
  const authHeader = request.headers.get('authorization')

  if (authHeader !== \`Bearer \${process.env.METRICS_TOKEN}\`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const metrics = await registry.metrics()

  return new NextResponse(metrics, {
    headers: { 'Content-Type': registry.contentType },
  })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Audit Log para Ações Críticas
      </h3>

      <CodeBlock
        fileName="lib/audit.ts"
        code={`import { db } from './db'
import { logger } from './logger'

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.settings.update'
  | 'payment.created'
  | 'payment.refunded'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'member.invited'
  | 'member.removed'
  | 'data.exported'
  | 'data.deleted'

type AuditLog = {
  action: AuditAction
  userId: string
  targetId?: string
  targetType?: string
  metadata?: Record<string, any>
  ip?: string
  userAgent?: string
}

export async function audit(log: AuditLog) {
  // 1. Salva no banco
  await db.auditLog.create({
    data: {
      action: log.action,
      userId: log.userId,
      targetId: log.targetId,
      targetType: log.targetType,
      metadata: log.metadata || {},
      ip: log.ip,
      userAgent: log.userAgent,
    },
  })

  // 2. Log estruturado
  logger.info({
    type: 'audit',
    ...log,
  }, \`Audit: \${log.action}\`)

  // 3. Alerta para ações críticas
  if (isCriticalAction(log.action)) {
    await sendSecurityAlert(log)
  }
}

function isCriticalAction(action: AuditAction) {
  return [
    'data.exported',
    'data.deleted',
    'api_key.created',
    'member.removed',
  ].includes(action)
}

// Uso:
// await audit({
//   action: 'api_key.created',
//   userId: session.user.id,
//   metadata: { keyName: 'Production Key' },
//   ip: request.ip,
// })`}
      />

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model AuditLog {
  id          String   @id @default(cuid())
  action      String
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  targetId    String?
  targetType  String?
  metadata    Json     @default("{}")

  ip          String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Health Check Endpoint
      </h3>

      <CodeBlock
        fileName="app/api/health/route.ts"
        code={`import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {}
  let healthy = true

  // Check Database
  try {
    const start = Date.now()
    await db.$queryRaw\`SELECT 1\`
    checks.database = { status: 'ok', latency: Date.now() - start }
  } catch {
    checks.database = { status: 'error' }
    healthy = false
  }

  // Check Redis
  try {
    const start = Date.now()
    await redis.ping()
    checks.redis = { status: 'ok', latency: Date.now() - start }
  } catch {
    checks.redis = { status: 'error' }
    healthy = false
  }

  // Check External Service
  try {
    const start = Date.now()
    const res = await fetch('https://api.stripe.com/v1/health', {
      signal: AbortSignal.timeout(5000),
    })
    checks.stripe = {
      status: res.ok ? 'ok' : 'degraded',
      latency: Date.now() - start,
    }
  } catch {
    checks.stripe = { status: 'unreachable' }
  }

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      checks,
    },
    { status: healthy ? 200 : 503 }
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Alertas e Notificações
      </h3>

      <CodeBlock
        fileName="lib/alerts.ts"
        code={`import { logger } from './logger'

type AlertLevel = 'info' | 'warning' | 'critical'

type Alert = {
  level: AlertLevel
  title: string
  message: string
  context?: Record<string, any>
}

export async function sendAlert(alert: Alert) {
  // Log sempre
  logger[alert.level === 'critical' ? 'error' : 'warn']({
    alert: true,
    ...alert,
  }, alert.title)

  // Slack para warnings e critical
  if (alert.level !== 'info') {
    await sendSlackAlert(alert)
  }

  // PagerDuty apenas para critical
  if (alert.level === 'critical') {
    await sendPagerDuty(alert)
  }
}

async function sendSlackAlert(alert: Alert) {
  const color = alert.level === 'critical' ? '#ff0000' : '#ffcc00'

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: Object.entries(alert.context || {}).map(([k, v]) => ({
          title: k,
          value: String(v),
          short: true,
        })),
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  })
}

// Uso:
// await sendAlert({
//   level: 'critical',
//   title: 'Taxa de erro alta',
//   message: 'Mais de 10% das requisições estão falhando',
//   context: { errorRate: '15%', endpoint: '/api/checkout' },
// })`}
      />

      <NoteBox type="info" title="Stack Recomendada">
        <ul className="list-disc list-inside">
          <li><strong>Logs</strong>: Pino + Axiom ou Datadog</li>
          <li><strong>Errors</strong>: Sentry</li>
          <li><strong>Metrics</strong>: Prometheus + Grafana</li>
          <li><strong>Uptime</strong>: Better Uptime ou Checkly</li>
          <li><strong>Alertas</strong>: Slack + PagerDuty</li>
        </ul>
      </NoteBox>
    </div>
  )
}
