import * as Sentry from '@sentry/nextjs'

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
// captureError(error, { userId: user.id, action: 'checkout' })