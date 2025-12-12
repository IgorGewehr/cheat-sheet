const PLAN_LIMITS = {
  free: {
    requestsPerMinute: 60,
    requestsPerDay: 1000,
  },
  pro: {
    requestsPerMinute: 300,
    requestsPerDay: 10000,
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerDay: 100000,
  },
} as const

export async function checkPlanRateLimit(
  userId: string,
  plan: keyof typeof PLAN_LIMITS
) {
  const limits = PLAN_LIMITS[plan]
  const redis = Redis.fromEnv()

  // Check por minuto
  const minuteKey = `ratelimit:${userId}:minute`
  const minuteCount = await redis.incr(minuteKey)

  if (minuteCount === 1) {
    await redis.expire(minuteKey, 60)
  }

  if (minuteCount > limits.requestsPerMinute) {
    return { allowed: false, reason: 'minute_limit' }
  }

  // Check por dia
  const dayKey = `ratelimit:${userId}:day:${new Date().toISOString().split('T')[0]}`
  const dayCount = await redis.incr(dayKey)

  if (dayCount === 1) {
    await redis.expire(dayKey, 86400)
  }

  if (dayCount > limits.requestsPerDay) {
    return { allowed: false, reason: 'daily_limit' }
  }

  return {
    allowed: true,
    remaining: {
      minute: limits.requestsPerMinute - minuteCount,
      day: limits.requestsPerDay - dayCount,
    },
  }
}