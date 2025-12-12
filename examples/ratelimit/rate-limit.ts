import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Rate limiters por caso de uso
export const rateLimiters = {
  // API pública: 100 req/min por IP
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:api',
  }),

  // Login: 5 tentativas/15min por IP
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:login',
  }),

  // Signup: 3/hora por IP
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'ratelimit:signup',
  }),

  // Webhook envio: 1000/min por tenant
  webhook: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    prefix: 'ratelimit:webhook',
  }),
}

export async function checkRateLimit(
  limiter: keyof typeof rateLimiters,
  identifier: string
) {
  const { success, limit, remaining, reset } = await rateLimiters[limiter].limit(identifier)

  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  }
}