import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, hasScope } from '@/lib/api-keys'
import { checkPlanRateLimit } from '@/lib/rate-limit-by-plan'

// Handler genérico para API pública versionada
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 1. Extrai e valida API Key
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return NextResponse.json(
      { error: { code: 'missing_api_key', message: 'API key required' } },
      { status: 401 }
    )
  }

  const validKey = await validateApiKey(apiKey)

  if (!validKey) {
    return NextResponse.json(
      { error: { code: 'invalid_api_key', message: 'Invalid or expired API key' } },
      { status: 401 }
    )
  }

  // 2. Verifica rate limit por plano
  const rateLimitResult = await checkPlanRateLimit(
    validKey.userId,
    validKey.user.plan
  )

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: { code: 'rate_limit_exceeded', message: 'Rate limit exceeded' } },
      { status: 429 }
    )
  }

  // 3. Roteia para handler específico
  const [resource, ...rest] = params.path

  switch (resource) {
    case 'users':
      if (!hasScope(validKey, 'read:users')) {
        return NextResponse.json(
          { error: { code: 'forbidden', message: 'Insufficient permissions' } },
          { status: 403 }
        )
      }
      return handleUsers(request, rest, validKey)

    case 'orders':
      if (!hasScope(validKey, 'read:orders')) {
        return NextResponse.json(
          { error: { code: 'forbidden', message: 'Insufficient permissions' } },
          { status: 403 }
        )
      }
      return handleOrders(request, rest, validKey)

    default:
      return NextResponse.json(
        { error: { code: 'not_found', message: 'Resource not found' } },
        { status: 404 }
      )
  }
}