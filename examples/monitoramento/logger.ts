import pino from 'pino'

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
// log.info({ userId, amount }, 'Payment processed')