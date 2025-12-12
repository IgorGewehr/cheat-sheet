import { Registry, Counter, Histogram, Gauge } from 'prom-client'

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
})