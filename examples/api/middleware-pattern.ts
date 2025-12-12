import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

type Handler = (
  request: NextRequest,
  context: { user: User }
) => Promise<NextResponse>

// Wrapper de autenticacao
export function withAuth(handler: Handler) {
  return async (request: NextRequest) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const user = await verifyToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return handler(request, { user })
  }
}

// Wrapper de rate limiting
export function withRateLimit(handler: Handler, limit = 100) {
  const requests = new Map<string, number[]>()

  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minuto

    const timestamps = requests.get(ip) || []
    const recent = timestamps.filter(t => now - t < windowMs)

    if (recent.length >= limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    requests.set(ip, [...recent, now])
    return handler(request, { user: null as any })
  }
}

// Uso:
// export const GET = withAuth(async (req, { user }) => { ... })
