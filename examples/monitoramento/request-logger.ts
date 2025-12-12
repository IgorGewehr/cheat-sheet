import { NextRequest, NextResponse } from 'next/server'
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
    duration: `${duration}ms`,
    ...meta,
  }, 'Request completed')
}