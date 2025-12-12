import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {}
  let healthy = true

  // Check Database
  try {
    const start = Date.now()
    await db.$queryRaw`SELECT 1`
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
}