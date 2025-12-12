import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function RouteHandlers() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Route Handlers
      </h1>

      <NoteBox type="info" title="Quando usar Route Handlers?">
        <ul className="list-disc list-inside">
          <li>Webhooks de serviços externos</li>
          <li>APIs para consumo externo (mobile app, integrações)</li>
          <li>Upload de arquivos</li>
          <li>Streaming de respostas</li>
        </ul>
        <p className="mt-2">Para mutações internas, prefira <strong>Server Actions</strong>.</p>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura Básica
      </h3>

      <CodeBlock
        fileName="app/api/users/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const users = await db.user.findMany({
    where: { tenantId: user.tenantId },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json({ users, page, limit })
}

// POST /api/users
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  const body = await request.json()

  // Validação com Zod
  const validated = createUserSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const newUser = await db.user.create({
    data: {
      ...validated.data,
      tenantId: user.tenantId,
    },
  })

  return NextResponse.json(newUser, { status: 201 })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rotas Dinâmicas
      </h3>

      <CodeBlock
        fileName="app/api/users/[id]/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

// GET /api/users/123
export async function GET(request: NextRequest, { params }: Params) {
  const user = await db.user.findUnique({
    where: { id: params.id }
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}

// PATCH /api/users/123
export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json()

  const updated = await db.user.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(updated)
}

// DELETE /api/users/123
export async function DELETE(request: NextRequest, { params }: Params) {
  await db.user.delete({
    where: { id: params.id }
  })

  return new NextResponse(null, { status: 204 })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Middleware Pattern para APIs
      </h3>

      <CodeBlock
        fileName="lib/api/middleware.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

type Handler = (
  request: NextRequest,
  context: { user: User }
) => Promise<NextResponse>

// Wrapper de autenticação
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
// export const GET = withAuth(async (req, { user }) => { ... })`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Configurações de Rota
      </h3>

      <CodeBlock
        code={`// Forçar rota dinâmica (não cachear)
export const dynamic = 'force-dynamic'

// Forçar rota estática
export const dynamic = 'force-static'

// Runtime: Node.js ou Edge
export const runtime = 'edge' // ou 'nodejs'

// Tempo máximo de execução
export const maxDuration = 30 // segundos`}
      />
    </div>
  )
}

export function ExternalAPIs() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        External APIs Integration
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Client com Retry e Timeout
      </h3>

      <CodeBlock
        fileName="lib/api-client.ts"
        code={`type FetchOptions = RequestInit & {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export async function apiClient<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`)
      }

      return response.json()

    } catch (error) {
      lastError = error as Error

      // Não retry em erros 4xx (client error)
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error
      }

      // Aguarda antes do próximo retry
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)))
      }
    }
  }

  throw lastError
}

// Uso:
const data = await apiClient<User[]>('https://api.example.com/users', {
  headers: { 'Authorization': \`Bearer \${token}\` },
  timeout: 5000,
  retries: 2,
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Service Layer Pattern
      </h3>

      <CodeBlock
        fileName="lib/services/stripe.ts"
        code={`import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const stripeService = {
  async createCustomer(email: string, name: string) {
    return stripe.customers.create({ email, name })
  },

  async createSubscription(customerId: string, priceId: string) {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })
  },

  async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId)
  },

  async createPortalSession(customerId: string, returnUrl: string) {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
  },

  // Webhook signature verification
  constructEvent(payload: string, signature: string) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  },
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Rate Limiting com Exponential Backoff
      </h3>

      <CodeBlock
        code={`async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      // Se for rate limit (429), aguarda e tenta novamente
      if (error.status === 429) {
        const retryAfter = error.headers?.get('Retry-After') || 1
        const delay = Math.min(
          Number(retryAfter) * 1000,
          Math.pow(2, i) * 1000 // Exponential backoff
        )
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}`}
      />

      <NoteBox type="warning" title="Secrets em APIs Externas">
        <ul className="list-disc list-inside">
          <li>Nunca exponha API keys no cliente</li>
          <li>Use Route Handlers ou Server Actions como proxy</li>
          <li>Armazene secrets em variáveis de ambiente</li>
          <li>Rotacione keys regularmente</li>
        </ul>
      </NoteBox>
    </div>
  )
}

export function Webhooks() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Webhooks
      </h1>

      <NoteBox type="danger" title="Segurança em Webhooks">
        <strong>SEMPRE</strong> verifique a assinatura do webhook antes de processar.
        Sem verificação, qualquer pessoa pode enviar requests falsos.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Webhook Stripe Completo
      </h3>

      <CodeBlock
        fileName="app/api/webhooks/stripe/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  // 1. Verificar assinatura
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Processar evento
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(\`Unhandled event type: \${event.type}\`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    // Retorna 200 mesmo com erro para evitar retry infinito
    // Log o erro para investigação
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status
  const priceId = subscription.items.data[0]?.price.id

  // Mapeia price ID para plano
  const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? 'PRO' : 'FREE'

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan,
      subscriptionStatus: status,
      subscriptionId: subscription.id,
    },
  })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'canceled',
      subscriptionId: null,
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Notificar usuário sobre falha no pagamento
  // await sendEmail(...)

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: 'past_due' },
  })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Idempotência em Webhooks
      </h3>

      <CodeBlock
        code={`// Armazena eventos processados para evitar duplicação
async function processWebhook(eventId: string, handler: () => Promise<void>) {
  // Verifica se já processou
  const existing = await db.webhookEvent.findUnique({
    where: { eventId }
  })

  if (existing) {
    console.log(\`Event \${eventId} already processed\`)
    return
  }

  // Processa
  await handler()

  // Marca como processado
  await db.webhookEvent.create({
    data: {
      eventId,
      processedAt: new Date(),
    }
  })
}

// Uso:
await processWebhook(event.id, async () => {
  await handleSubscriptionChange(subscription)
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Configuração no middleware.ts
      </h3>

      <CodeBlock
        code={`// Webhooks devem ser públicos (sem auth)
const publicPatterns = [
  '/api/webhooks/stripe',
  '/api/webhooks/github',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pula autenticação para webhooks
  if (publicPatterns.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ... resto do middleware
}`}
      />

      <NoteBox type="success" title="Boas Práticas">
        <ul className="list-disc list-inside space-y-1">
          <li>Sempre retorne 200 rapidamente (processe async se necessário)</li>
          <li>Implemente idempotência (eventos podem ser enviados mais de uma vez)</li>
          <li>Log todos os eventos para debugging</li>
          <li>Configure alertas para falhas de processamento</li>
        </ul>
      </NoteBox>
    </div>
  )
}
