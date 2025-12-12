import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function RateLimitingAPI() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Rate Limiting & API Pública
      </h1>

      <NoteBox type="danger" title="Por que Rate Limiting?">
        Sem rate limiting, sua API pode ser:
        <ul className="list-disc list-inside mt-2">
          <li>Sobrecarregada por bots ou scrapers</li>
          <li>Usada para ataques DDoS</li>
          <li>Explorada para enumerar dados</li>
          <li>Custosa demais por uso abusivo</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rate Limiter com Upstash Redis
      </h3>

      <CodeBlock
        fileName="lib/rate-limit.ts"
        code={`import { Ratelimit } from '@upstash/ratelimit'
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Middleware de Rate Limit
      </h3>

      <CodeBlock
        fileName="middleware.ts"
        code={`import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function middleware(request: NextRequest) {
  // Só aplica em rotas de API
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Identifica por IP ou API Key
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
  const apiKey = request.headers.get('x-api-key')
  const identifier = apiKey || ip

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return response
}

export const config = {
  matcher: '/api/:path*',
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Sistema de API Keys
      </h3>

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model ApiKey {
  id          String   @id @default(cuid())
  name        String   // "Production", "Development"
  key         String   @unique // Prefixo + hash
  keyPrefix   String   // Primeiros 8 chars para identificação

  // Permissões
  scopes      String[] // ["read:users", "write:orders"]

  // Limites
  rateLimit   Int      @default(1000) // req/min

  // Dono
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Metadata
  lastUsedAt  DateTime?
  expiresAt   DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([keyPrefix])
}`}
      />

      <CodeBlock
        fileName="lib/api-keys.ts"
        code={`import { randomBytes, createHash } from 'crypto'
import { db } from './db'

// Gera API Key no formato: prefix_randomstring
export async function generateApiKey(userId: string, name: string, scopes: string[]) {
  const prefix = 'sk_live'
  const random = randomBytes(24).toString('base64url')
  const fullKey = \`\${prefix}_\${random}\`

  // Salva hash da key (nunca a key em si)
  const keyHash = createHash('sha256').update(fullKey).digest('hex')

  await db.apiKey.create({
    data: {
      name,
      key: keyHash,
      keyPrefix: fullKey.slice(0, 12), // Para identificação
      scopes,
      userId,
    },
  })

  // Retorna a key completa APENAS UMA VEZ
  return fullKey
}

// Valida API Key
export async function validateApiKey(key: string) {
  const keyHash = createHash('sha256').update(key).digest('hex')

  const apiKey = await db.apiKey.findUnique({
    where: { key: keyHash },
    include: { user: true },
  })

  if (!apiKey) return null

  // Verifica expiração
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  // Atualiza último uso
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  return apiKey
}

// Verifica scope
export function hasScope(apiKey: { scopes: string[] }, requiredScope: string) {
  // Wildcard check: "write:*" permite "write:users"
  return apiKey.scopes.some(scope => {
    if (scope === '*') return true
    if (scope.endsWith(':*')) {
      const prefix = scope.slice(0, -1)
      return requiredScope.startsWith(prefix)
    }
    return scope === requiredScope
  })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rate Limit por Plano
      </h3>

      <CodeBlock
        fileName="lib/rate-limit-by-plan.ts"
        code={`const PLAN_LIMITS = {
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
  const minuteKey = \`ratelimit:\${userId}:minute\`
  const minuteCount = await redis.incr(minuteKey)

  if (minuteCount === 1) {
    await redis.expire(minuteKey, 60)
  }

  if (minuteCount > limits.requestsPerMinute) {
    return { allowed: false, reason: 'minute_limit' }
  }

  // Check por dia
  const dayKey = \`ratelimit:\${userId}:day:\${new Date().toISOString().split('T')[0]}\`
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        API Pública - Route Handler
      </h3>

      <CodeBlock
        fileName="app/api/v1/[...path]/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Documentação da API (OpenAPI)
      </h3>

      <CodeBlock
        fileName="app/api/docs/openapi.json/route.ts"
        code={`import { NextResponse } from 'next/server'

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Minha API',
    version: '1.0.0',
    description: 'API pública para integração',
  },
  servers: [
    { url: 'https://api.meusite.com/v1', description: 'Produção' },
    { url: 'http://localhost:3000/api/v1', description: 'Desenvolvimento' },
  ],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/users': {
      get: {
        summary: 'Lista usuários',
        tags: ['Users'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(openApiSpec)
}`}
      />

      <NoteBox type="info" title="Swagger UI">
        Use <strong>swagger-ui-react</strong> ou hospede em <strong>/api-docs</strong> para documentação visual.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Dashboard de API Keys
      </h3>

      <CodeBlock
        fileName="app/settings/api-keys/page.tsx"
        code={`import { generateApiKey } from '@/lib/api-keys'
import { auth } from '@/lib/auth'

export default async function ApiKeysPage() {
  const session = await auth()
  const keys = await db.apiKey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">API Keys</h1>

      <CreateKeyForm userId={session.user.id} />

      <div className="mt-8 space-y-4">
        {keys.map(key => (
          <div key={key.id} className="p-4 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{key.name}</h3>
                <code className="text-sm text-gray-500">{key.keyPrefix}...</code>
              </div>
              <DeleteKeyButton keyId={key.id} />
            </div>

            <div className="mt-2 flex gap-2">
              {key.scopes.map(scope => (
                <span key={scope} className="px-2 py-1 bg-gray-100 rounded text-xs">
                  {scope}
                </span>
              ))}
            </div>

            {key.lastUsedAt && (
              <p className="mt-2 text-sm text-gray-500">
                Último uso: {key.lastUsedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}`}
      />
    </div>
  )
}
