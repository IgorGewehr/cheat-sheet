// Auto-generated file - do not edit manually
// Run: node scripts/generate-examples.js

export const codeExamples: Record<string, string> = {
  'api/api-client.ts': `type FetchOptions = RequestInit & {
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

      // Nao retry em erros 4xx (client error)
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error
      }

      // Aguarda antes do proximo retry
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
})
`,
  'api/fetch-backoff.ts': `async function fetchWithBackoff<T>(
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
}
`,
  'api/middleware-pattern.ts': `import { NextRequest, NextResponse } from 'next/server'
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
`,
  'api/route-config.ts': `// Forcar rota dinamica (nao cachear)
export const dynamic = 'force-dynamic'

// Forcar rota estatica
export const dynamic = 'force-static'

// Runtime: Node.js ou Edge
export const runtime = 'edge' // ou 'nodejs'

// Tempo maximo de execucao
export const maxDuration = 30 // segundos
`,
  'api/route-handlers-basic.ts': `import { NextRequest, NextResponse } from 'next/server'
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

  // Validacao com Zod
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
}
`,
  'api/route-handlers-dynamic.ts': `import { NextRequest, NextResponse } from 'next/server'

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
}
`,
  'api/stripe-service.ts': `import Stripe from 'stripe'

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
}
`,
  'api/webhook-idempotency.ts': `// Armazena eventos processados para evitar duplicacao
async function processWebhook(eventId: string, handler: () => Promise<void>) {
  // Verifica se ja processou
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
})
`,
  'api/webhook-middleware.ts': `// Webhooks devem ser publicos (sem auth)
const publicPatterns = [
  '/api/webhooks/stripe',
  '/api/webhooks/github',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pula autenticacao para webhooks
  if (publicPatterns.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ... resto do middleware
}
`,
  'api/webhook-stripe.ts': `import { NextRequest, NextResponse } from 'next/server'
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
    // Log o erro para investigacao
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

  // Notificar usuario sobre falha no pagamento
  // await sendEmail(...)

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: 'past_due' },
  })
}
`,
  'certificates/actions.ts': `'use server'

import { uploadCertificate } from '@/lib/certificates/storage'
import { validateCertificate } from '@/lib/certificates/validator'
import { db } from '@/lib/db'

export async function saveCertificate(formData: FormData) {
  const file = formData.get('certificate') as File
  const password = formData.get('password') as string

  // 1. Lê o arquivo
  const buffer = Buffer.from(await file.arrayBuffer())

  // 2. Valida se é um certificado válido e extrai dados
  const certInfo = await validateCertificate(buffer, password)

  if (!certInfo.valid) {
    return { success: false, error: certInfo.error }
  }

  // 3. Upload seguro
  const { storageKey, encryptedPassword } = await uploadCertificate(
    tenant.id,
    buffer,
    password
  )

  // 4. Salva referência no banco
  await db.certificate.create({
    data: {
      tenantId: tenant.id,
      name: certInfo.commonName,
      cnpj: certInfo.cnpj,
      expiresAt: certInfo.expiresAt,
      storageKey,
      // Senha criptografada pode ir em outra tabela ainda mais restrita
    },
  })

  return { success: true }
}`,
  'certificates/check-certificates-route.ts': `import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function GET() {
  // Certificados que vencem em 30 dias
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiring = await db.certificate.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: thirtyDaysFromNow },
    },
    include: { tenant: { include: { users: true } } },
  })

  for (const cert of expiring) {
    // Envia email para os admins do tenant
    const admins = cert.tenant.users.filter(u => u.role === 'OWNER')

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: \`Certificado \${cert.name} expira em breve\`,
        body: \`Seu certificado expira em \${cert.expiresAt.toLocaleDateString()}\`,
      })
    }
  }

  return Response.json({ checked: expiring.length })
}`,
  'certificates/schema.prisma': `model Certificate {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id])

  // Dados do certificado (NÃO armazenar o arquivo aqui!)
  name        String    // "Certificado Empresa X"
  cnpj        String    // CNPJ vinculado
  expiresAt   DateTime  // Data de expiração
  isActive    Boolean   @default(true)

  // Referência ao storage seguro
  storageKey  String    // Chave no S3/Vault

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([tenantId, cnpj])
}`,
  'certificates/storage.ts': `import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

const BUCKET = process.env.CERTIFICATES_BUCKET!

// A senha do certificado é criptografada antes de salvar
import { encrypt, decrypt } from '@/lib/crypto'

export async function uploadCertificate(
  tenantId: string,
  certificateFile: Buffer,
  password: string
) {
  const key = \`certificates/\${tenantId}/\${Date.now()}.pfx\`

  // 1. Upload do arquivo .pfx para S3 (já criptografado pelo S3)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: certificateFile,
    ServerSideEncryption: 'aws:kms', // Criptografia extra
  }))

  // 2. Criptografa a senha antes de salvar no banco
  const encryptedPassword = await encrypt(password)

  return { storageKey: key, encryptedPassword }
}

export async function getCertificate(storageKey: string) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  }))

  const buffer = await response.Body?.transformToByteArray()
  return Buffer.from(buffer!)
}`,
  'certificates/validator.ts': `import forge from 'node-forge'

type CertInfo = {
  valid: boolean
  error?: string
  commonName?: string
  cnpj?: string
  expiresAt?: Date
}

export async function validateCertificate(
  pfxBuffer: Buffer,
  password: string
): Promise<CertInfo> {
  try {
    // Converte buffer para formato que o forge entende
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'))
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

    // Extrai o certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert

    if (!cert) {
      return { valid: false, error: 'Certificado não encontrado no arquivo' }
    }

    // Verifica validade
    const now = new Date()
    const expiresAt = cert.validity.notAfter

    if (now > expiresAt) {
      return { valid: false, error: 'Certificado expirado' }
    }

    // Extrai dados
    const commonName = cert.subject.getField('CN')?.value || ''
    const cnpj = extractCNPJ(commonName)

    return {
      valid: true,
      commonName,
      cnpj,
      expiresAt,
    }
  } catch (error) {
    return { valid: false, error: 'Senha incorreta ou arquivo inválido' }
  }
}

function extractCNPJ(text: string): string {
  const match = text.match(/\\d{14}/)
  return match ? match[0] : ''
}`,
  'cicd/Button.test.tsx': `import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renderiza com o texto correto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('chama onClick quando clicado', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique</Button>)

    fireEvent.click(screen.getByText('Clique'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('fica desabilitado quando loading', () => {
    render(<Button loading>Salvando</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})`,
  'cicd/actions.test.ts': `import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUser } from '../actions'

// Mock do banco
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

// Mock de autenticação
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna erro se não autenticado', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const formData = new FormData()
    const result = await createUser(null, formData)

    expect(result?.success).toBe(false)
    expect(result?.message).toBe('Não autenticado')
  })

  it('retorna erro se não for admin', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: '1',
      role: 'user', // Não é admin
      tenantId: 't1',
    })

    const formData = new FormData()
    const result = await createUser(null, formData)

    expect(result?.success).toBe(false)
    expect(result?.message).toBe('Sem permissão')
  })
})`,
  'cicd/ci.yml': `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm test`,
  'cicd/next.config.ts': `const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Previne clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Previne MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig`,
  'cicd/package.json': `{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}`,
  'cicd/utils.test.ts': `import { describe, it, expect } from 'vitest'
import { formatCurrency, isValidEmail } from '../utils'

describe('formatCurrency', () => {
  it('formata valor em reais', () => {
    expect(formatCurrency(1000)).toBe('R\$ 1.000,00')
    expect(formatCurrency(99.9)).toBe('R\$ 99,90')
  })

  it('lida com zero', () => {
    expect(formatCurrency(0)).toBe('R\$ 0,00')
  })
})

describe('isValidEmail', () => {
  it('aceita emails válidos', () => {
    expect(isValidEmail('teste@email.com')).toBe(true)
  })

  it('rejeita emails inválidos', () => {
    expect(isValidEmail('teste')).toBe(false)
    expect(isValidEmail('teste@')).toBe(false)
  })
})`,
  'cicd/vitest.config.ts': `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})`,
  'data-fetching/auto-deduplication.tsx': `// O Next.js deduplica automaticamente requests GET idênticos
// durante uma única renderização

// Componente A
async function Header() {
  const user = await fetch('/api/user') // Request 1
  return <div>{user.name}</div>
}

// Componente B
async function Sidebar() {
  const user = await fetch('/api/user') // Reutiliza Request 1!
  return <div>{user.avatar}</div>
}

// Apenas 1 request é feito na prática`,
  'data-fetching/basic-fetch.tsx': `// Este componente é async - pode usar await diretamente!
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products')
    .then(res => res.json())

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}`,
  'data-fetching/cache-options.ts': `// 1. Sem cache (padrão no Next.js 15)
const data = await fetch('https://api.example.com/data')

// 2. Com cache (opt-in)
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// 3. Revalidação por tempo (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 } // Revalida a cada 60 segundos
})

// 4. Com tags para invalidação manual
const data = await fetch('https://api.example.com/products', {
  next: {
    tags: ['products'],
    revalidate: 3600 // 1 hora
  }
})`,
  'data-fetching/database-fetch.tsx': `import { db } from '@/lib/db'

// Direto no componente - sem API route intermediária!
export default async function UsersPage() {
  const users = await db.user.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return <UserTable users={users} />
}

// Função separada para reutilização
async function getActiveUsers(tenantId: string) {
  return db.user.findMany({
    where: {
      tenantId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })
}`,
  'data-fetching/error-boundary.tsx': `'use client' // Error components devem ser Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log para serviço de monitoramento (Sentry, etc)
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold text-red-500 mb-4">
        Algo deu errado!
      </h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'Erro inesperado'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tentar novamente
      </button>
    </div>
  )
}`,
  'data-fetching/global-error.tsx': `'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // Precisa incluir html e body pois substitui o root layout
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Erro crítico!
          </h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Recarregar aplicação
          </button>
        </div>
      </body>
    </html>
  )
}`,
  'data-fetching/manual-revalidation.ts': `'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createProduct(formData: FormData) {
  // ... criar produto no DB

  // Opção 1: Revalida uma página específica
  revalidatePath('/products')

  // Opção 2: Revalida todas as páginas que usam a tag
  revalidateTag('products')

  // Opção 3: Revalida layout (e todas as páginas filhas)
  revalidatePath('/dashboard', 'layout')
}

export async function updateProduct(id: string, formData: FormData) {
  // ... atualizar produto

  // Revalida página específica do produto
  revalidatePath(\`/products/\${id}\`)

  // E a listagem
  revalidateTag('products')
}`,
  'data-fetching/not-found-page.tsx': `import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
      <p className="text-gray-600 mb-4">
        O produto que você procura não existe ou foi removido.
      </p>
      <Link
        href="/products"
        className="text-blue-500 hover:underline"
      >
        Ver todos os produtos
      </Link>
    </div>
  )
}`,
  'data-fetching/not-found-usage.tsx': `import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({
    where: { id: params.id }
  })

  // Dispara o not-found.tsx
  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}`,
  'data-fetching/parallel-fetching.tsx': `async function getUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`)
  return res.json()
}

async function getOrders(userId: string) {
  const res = await fetch(\`/api/orders?userId=\${userId}\`)
  return res.json()
}

async function getAnalytics(userId: string) {
  const res = await fetch(\`/api/analytics?userId=\${userId}\`)
  return res.json()
}

export default async function DashboardPage({ params }) {
  // ❌ RUIM: Sequencial (waterfall)
  // const user = await getUser(params.id)
  // const orders = await getOrders(params.id)
  // const analytics = await getAnalytics(params.id)

  // ✅ BOM: Paralelo
  const [user, orders, analytics] = await Promise.all([
    getUser(params.id),
    getOrders(params.id),
    getAnalytics(params.id),
  ])

  return (
    <div>
      <h1>{user.name}</h1>
      <OrderList orders={orders} />
      <AnalyticsChart data={analytics} />
    </div>
  )
}`,
  'data-fetching/sequential-fetching.tsx': `// Quando um fetch depende do resultado do outro
export default async function UserPostsPage({ params }) {
  // Primeiro: busca o usuário
  const user = await getUser(params.id)

  // Depois: busca posts usando dados do usuário
  const posts = await getPostsByAuthor(user.authorId)

  return <PostList posts={posts} />
}`,
  'data-fetching/server-action-error-handling.ts': `'use server'

export async function createItem(formData: FormData) {
  try {
    const data = validateInput(formData)
    await db.item.create({ data })

    revalidatePath('/items')
    return { success: true }

  } catch (error) {
    // Erro de validação
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      }
    }

    // Erro de constraint do banco
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'Item já existe',
      }
    }

    // Erro genérico - log e mensagem amigável
    console.error('createItem error:', error)
    return {
      success: false,
      message: 'Erro ao criar item. Tente novamente.',
    }
  }
}`,
  'data-fetching/unstable-cache.ts': `import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

// Cache de queries do banco
export const getProducts = unstable_cache(
  async (tenantId: string) => {
    return db.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
  },
  ['products'], // Key do cache
  {
    tags: ['products'],
    revalidate: 60, // 1 minuto
  }
)

// Com parâmetros dinâmicos na key
export const getProduct = unstable_cache(
  async (id: string) => {
    return db.product.findUnique({ where: { id } })
  },
  ['product'], // Base key
  {
    tags: ['products'],
    revalidate: 300,
  }
)

// Uso:
const products = await getProducts(tenantId)
const product = await getProduct(productId)`,
  'database/drizzle-config.ts': `import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config`,
  'database/drizzle-db.ts': `import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Para queries
const client = postgres(connectionString)
export const db = drizzle(client, { schema })

// Uso:
// const users = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId))`,
  'database/drizzle-migrations.sh': `# 1. Gerar migration
npx drizzle-kit generate:pg

# 2. Aplicar migrations
npx drizzle-kit push:pg

# 3. Visualizar DB
npx drizzle-kit studio`,
  'database/drizzle-queries.ts': `import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'

// Find many com filtro
const adminUsers = await db
  .select()
  .from(users)
  .where(and(
    eq(users.tenantId, tenantId),
    eq(users.role, 'ADMIN')
  ))
  .orderBy(desc(users.createdAt))
  .limit(20)

// Com relação (join)
const usersWithTenant = await db
  .select()
  .from(users)
  .leftJoin(tenants, eq(users.tenantId, tenants.id))
  .where(eq(users.tenantId, tenantId))

// Insert
const [newUser] = await db
  .insert(users)
  .values({ email, name, tenantId })
  .returning()

// Update
await db
  .update(users)
  .set({ name: 'Novo Nome' })
  .where(eq(users.id, id))

// Transaction
await db.transaction(async (tx) => {
  await tx.insert(users).values(userData)
  await tx.insert(auditLogs).values(logData)
})`,
  'database/drizzle-schema.ts': `import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'OWNER'])
export const planEnum = pgEnum('plan', ['FREE', 'PRO', 'ENTERPRISE'])

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey().\$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  plan: planEnum('plan').default('FREE'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const users = pgTable('users', {
  id: text('id').primaryKey().\$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  name: text('name'),
  role: roleEnum('role').default('USER'),
  tenantId: text('tenant_id').references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relações
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}))

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}))`,
  'database/prisma-db.ts': `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}`,
  'database/prisma-migrations.sh': `# 1. Criar migration a partir do schema
npx prisma migrate dev --name add_user_role

# 2. Aplicar migrations em produção
npx prisma migrate deploy

# 3. Resetar DB (development)
npx prisma migrate reset

# 4. Gerar client após mudanças
npx prisma generate

# 5. Visualizar DB
npx prisma studio`,
  'database/prisma-queries.ts': `// Find many com filtro e relações
const users = await db.user.findMany({
  where: {
    tenantId,
    role: 'ADMIN',
  },
  include: {
    tenant: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
})

// Find unique
const user = await db.user.findUnique({
  where: { email },
})

// Create
const newUser = await db.user.create({
  data: {
    email,
    name,
    tenantId,
  },
})

// Update
await db.user.update({
  where: { id },
  data: { name: 'Novo Nome' },
})

// Transaction
await db.\$transaction([
  db.user.create({ data: userData }),
  db.auditLog.create({ data: logData }),
])`,
  'database/prisma-schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
}

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      Plan     @default(FREE)
  users     User[]
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
  OWNER
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}`,
  'database/prisma-seed-package.json': `{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}`,
  'database/prisma-seed.ts': `import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Criar tenant padrão
  const tenant = await db.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      plan: 'PRO',
    },
  })

  // Criar usuário admin
  const adminPassword = await hash('admin123', 12)
  await db.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'OWNER',
      tenantId: tenant.id,
    },
  })

  // Criar usuários de teste
  const users = Array.from({ length: 10 }, (_, i) => ({
    email: \`user\${i + 1}@demo.com\`,
    name: \`User \${i + 1}\`,
    role: 'USER' as const,
    tenantId: tenant.id,
  }))

  await db.user.createMany({
    data: users,
    skipDuplicates: true,
  })

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.\$disconnect()
  })`,
  'database/scripts-package.json': `{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  }
}`,
  'frontend/Button.tsx': `import { forwardRef } from 'react'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const variants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'hover:bg-gray-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={\`
          rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          \${variants[variant]}
          \${sizes[size]}
        \`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" />
            Carregando...
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'`,
  'frontend/Dialog.tsx': `'use client'

import { useEffect, useRef } from 'react'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="
        backdrop:bg-black/50
        rounded-xl p-0 max-w-md w-full
        animate-in fade-in zoom-in-95
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>
    </dialog>
  )
}

// Uso:
// <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Confirmar">
//   <p>Tem certeza?</p>
//   <Button onClick={handleConfirm}>Sim</Button>
// </Dialog>`,
  'frontend/Onboarding.tsx': `'use client'

import { useState } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { ProfileStep } from './steps/ProfileStep'
import { CompanyStep } from './steps/CompanyStep'

const steps = [
  { id: 'welcome', title: 'Bem-vindo', component: WelcomeStep },
  { id: 'profile', title: 'Seu Perfil', component: ProfileStep },
  { id: 'company', title: 'Sua Empresa', component: CompanyStep },
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState({})

  const CurrentStepComponent = steps[currentStep].component

  function handleNext(stepData: object) {
    setData(prev => ({ ...prev, ...stepData }))

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Último step - salvar dados
      handleComplete({ ...data, ...stepData })
    }
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Indicador de progresso */}
      <div className="flex gap-2 mb-8">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={\`
              flex-1 h-2 rounded-full
              \${index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'}
            \`}
          />
        ))}
      </div>

      {/* Título do step */}
      <h1 className="text-2xl font-bold mb-6">
        {steps[currentStep].title}
      </h1>

      {/* Conteúdo do step */}
      <div className="animate-fadeIn">
        <CurrentStepComponent
          data={data}
          onNext={handleNext}
          onBack={currentStep > 0 ? handleBack : undefined}
        />
      </div>
    </div>
  )
}`,
  'frontend/ProfileStep.tsx': `type StepProps = {
  data: Record<string, any>
  onNext: (data: object) => void
  onBack?: () => void
}

export function ProfileStep({ data, onNext, onBack }: StepProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    onNext({
      name: formData.get('name'),
      phone: formData.get('phone'),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input
          name="name"
          defaultValue={data.name}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Telefone</label>
        <input
          name="phone"
          defaultValue={data.phone}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button type="button" variant="secondary" onClick={onBack}>
            Voltar
          </Button>
        )}
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  )
}`,
  'frontend/Toast.tsx': `'use client'

import { createContext, useContext, useState } from 'react'

type Toast = { id: string; message: string; type: 'success' | 'error' }

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function toast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])

    // Remove após 3 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Container de toasts */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={\`
              px-4 py-2 rounded-lg animate-slideIn
              \${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
              text-white
            \`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)!

// Uso:
// const { toast } = useToast()
// toast('Salvo com sucesso!')
// toast('Erro ao salvar', 'error')`,
  'frontend/animations.css': `/* Animação de entrada */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Classes utilitárias */
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideIn { animation: slideIn 0.3s ease-out; }
.animate-scaleIn { animation: scaleIn 0.2s ease-out; }

/* Transição suave para hover */
.transition-all {
  transition: all 0.2s ease;
}`,
  'frontend/component-structure.txt': `components/
├── ui/                    # Atoms - Componentes básicos
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── Spinner.tsx
│
├── shared/                # Molecules - Composições simples
│   ├── SearchInput.tsx    # Input + ícone + botão limpar
│   ├── FormField.tsx      # Label + Input + erro
│   └── UserAvatar.tsx     # Avatar + nome + badge online
│
└── organisms/             # Organisms - Seções completas
    ├── Header/
    │   ├── index.tsx
    │   ├── NavLinks.tsx
    │   └── UserMenu.tsx
    │
    └── Onboarding/
        ├── index.tsx
        ├── StepIndicator.tsx
        ├── steps/
        │   ├── WelcomeStep.tsx
        │   ├── ProfileStep.tsx
        │   └── CompanyStep.tsx
        └── hooks/
            └── useOnboarding.ts`,
  'fundamentos/dashboard-page.tsx': `// Server Component (padrão)
import { getUserData } from '@/lib/db'
import InteractiveChart from './InteractiveChart' // Client

export default async function DashboardPage() {
  // Pode acessar DB diretamente - é server!
  const data = await getUserData()

  return (
    <div>
      {/* Parte estática - zero JS */}
      <h1>{data.name}</h1>
      <p>Último acesso: {data.lastLogin}</p>

      {/* Island de interatividade - só esse componente vai pro browser */}
      <InteractiveChart data={data.metrics} />
    </div>
  )
}`,
  'fundamentos/estrutura-pastas.txt': `app/
├── (auth)/                   # Route Group - Rotas de Autenticação
│   ├── login/
│   │   ├── page.tsx
│   │   └── LoginForm.tsx     # Componente específico
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx            # Layout sem sidebar
│
├── (app)/                    # Route Group - App Principal
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx       # Skeleton loading
│   │   └── DashboardCards.tsx
│   │
│   ├── [tenantId]/           # Multi-tenancy via URL
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts    # Server Actions da feature
│   │   └── users/
│   │       ├── page.tsx
│   │       ├── [userId]/
│   │       │   └── page.tsx
│   │       └── components/
│   │           ├── UserTable.tsx
│   │           └── UserFilters.tsx
│   └── layout.tsx            # Layout com sidebar
│
├── api/                      # Route Handlers (quando necessário)
│   └── webhooks/
│       └── stripe/
│           └── route.ts
│
lib/                          # Código compartilhado global
├── db.ts                     # Conexão Prisma/Drizzle
├── auth.ts                   # Configuração Auth
├── utils.ts                  # Funções utilitárias
└── validations/              # Schemas Zod compartilhados
    ├── user.ts
    └── tenant.ts

components/                   # Componentes UI reutilizáveis
├── ui/                       # Primitivos (Button, Input, Modal)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
└── shared/                   # Compostos (DataTable, Charts)
    ├── DataTable.tsx
    └── Pagination.tsx

middleware.ts                 # Proteção de rotas`,
  'fundamentos/interactive-chart.tsx': `'use client' // Marca como Client Component

import { useState } from 'react'

export default function InteractiveChart({ data }) {
  const [filter, setFilter] = useState('all')

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">Todos</option>
        <option value="week">Última Semana</option>
      </select>
      {/* Chart interativo aqui */}
    </div>
  )
}`,
  'hooks/server-state.ts': `// O próprio fetch já é cacheado no Next.js
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: {
      revalidate: 60, // Revalida a cada 60s
      tags: ['products'] // Tag para revalidação manual
    }
  })
  return res.json()
}

// Para invalidar o cache:
import { revalidateTag } from 'next/cache'
revalidateTag('products')`,
  'hooks/url-state-client.tsx': `'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setFilter(filter: string) {
    const params = new URLSearchParams(searchParams)
    params.set('filter', filter)
    params.set('page', '1') // Reset page
    router.push(\`?\${params.toString()}\`)
  }

  return (
    <select
      value={searchParams.get('filter') || 'all'}
      onChange={(e) => setFilter(e.target.value)}
    >
      <option value="all">Todos</option>
      <option value="active">Ativos</option>
    </select>
  )
}`,
  'hooks/url-state-server.tsx': `// Server Component - lê direto dos params
export default function ProductsPage({
  searchParams
}: {
  searchParams: { page?: string; filter?: string }
}) {
  const page = Number(searchParams.page) || 1
  const filter = searchParams.filter || 'all'

  return <ProductList page={page} filter={filter} />
}`,
  'hooks/useActionState.tsx': `'use client'
import { useActionState } from 'react'
import { createUser } from './actions'

export function Form() {
  const [state, action, isPending] = useActionState(createUser, null)

  return (
    <form action={action}>
      <input name="email" />
      {state?.errors?.email && <p>{state.errors.email}</p>}

      <button disabled={isPending}>
        {isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}`,
  'hooks/useEffect.ts': `// Executa em toda renderização
useEffect(() => {
  console.log('rendered')
})

// Executa apenas na montagem
useEffect(() => {
  console.log('mounted')
}, [])

// Executa quando 'id' muda + cleanup
useEffect(() => {
  const controller = new AbortController()

  fetch(\`/api/user/\${id}\`, { signal: controller.signal })
    .then(res => res.json())
    .then(setUser)

  return () => controller.abort() // Cleanup!
}, [id])`,
  'hooks/useMemo-useCallback.ts': `// useMemo - memoriza VALOR
const expensiveValue = useMemo(
  () => computeExpensive(data),
  [data]
)

// useCallback - memoriza FUNÇÃO
const handleClick = useCallback(
  () => doSomething(id),
  [id]
)`,
  'hooks/useRef.ts': `// Referência ao DOM
const inputRef = useRef<HTMLInputElement>(null)
inputRef.current?.focus()

// Valor mutável que persiste
const renderCount = useRef(0)
renderCount.current++ // Não causa re-render!

// Guardar valor anterior
const prevValue = useRef(value)
useEffect(() => {
  prevValue.current = value
}, [value])`,
  'hooks/useState-local.tsx': `'use client'
import { useState } from 'react'

function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {title} {isOpen ? '▼' : '▶'}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}`,
  'hooks/useState.ts': `const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)

// Atualização baseada no valor anterior
setCount(prev => prev + 1)

// Lazy initialization (só executa uma vez)
const [data, setData] = useState(() => expensiveComputation())`,
  'hooks/useTransition.tsx': `const [isPending, startTransition] = useTransition()

function handleSearch(query: string) {
  // Update urgente - input responsivo
  setQuery(query)

  // Update não-urgente - pode "atrasar"
  startTransition(() => {
    setFilteredResults(heavyFilter(data, query))
  })
}

return (
  <>
    <input value={query} onChange={e => handleSearch(e.target.value)} />
    {isPending ? <Spinner /> : <Results data={filteredResults} />}
  </>
)`,
  'hooks/zustand-cart-button.tsx': `'use client'
import { useCart } from '@/stores/cart'

export function CartButton() {
  const itemCount = useCart(state => state.items.length)
  return <button>Carrinho ({itemCount})</button>
}`,
  'hooks/zustand-cart-store.ts': `import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  total: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      total: () => get().items.reduce((sum, i) => sum + i.price, 0)
    }),
    { name: 'cart-storage' } // Persiste no localStorage
  )
)`,
  'kyc/crypto.ts': `import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // iv:authTag:encrypted
  return \`\${iv.toString('hex')}:\${authTag}:\${encrypted}\`
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Uso:
// const encryptedCPF = encrypt('12345678900')
// const cpf = decrypt(encryptedCPF)`,
  'kyc/operations.ts': `export async function requestWithdrawal(userId: string, amount: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  })

  // Bloqueia saque se KYC não aprovado
  if (user?.kycStatus !== 'VERIFIED') {
    return {
      success: false,
      error: 'Complete a verificação de identidade para sacar',
      action: 'COMPLETE_KYC',
    }
  }

  // Continua com o saque...
}`,
  'kyc/page.tsx': `'use client'

import { useState } from 'react'
import { submitKYC } from './actions'

export default function KYCPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verificação de Identidade</h1>

      {step === 1 && (
        <PersonalDataStep onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <DocumentStep onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}

      {step === 3 && (
        <SelfieStep onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}

      {step === 4 && (
        <SuccessStep />
      )}
    </div>
  )
}

function DocumentStep({ onNext, onBack }) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Tire foto do seu documento (RG ou CNH)
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Frente</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {frontFile && (
          <img
            src={URL.createObjectURL(frontFile)}
            alt="Preview"
            className="mt-2 rounded"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Verso</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setBackFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!frontFile || !backFile}>
          Continuar
        </Button>
      </div>
    </div>
  )
}`,
  'kyc/schema.prisma': `model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?

  // KYC
  kyc           KYC?
  kycStatus     KYCStatus @default(PENDING)
}

model KYC {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])

  // Dados pessoais
  cpf           String?  // Criptografado
  birthDate     DateTime?
  fullName      String?

  // Endereço
  zipCode       String?
  street        String?
  number        String?
  city          String?
  state         String?

  // Documentos (referência ao storage, não o arquivo)
  documentType  DocumentType?
  documentFrontKey String?  // Chave no S3
  documentBackKey  String?
  selfieKey        String?

  // Verificação
  verifiedAt    DateTime?
  verifiedBy    String?   // ID do admin ou serviço
  rejectedAt    DateTime?
  rejectionReason String?

  // Histórico
  attempts      Int      @default(0)
  lastAttemptAt DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum KYCStatus {
  PENDING       // Não iniciou
  SUBMITTED     // Enviou documentos
  IN_REVIEW     // Em análise
  VERIFIED      // Aprovado
  REJECTED      // Rejeitado
}

enum DocumentType {
  RG
  CNH
  PASSPORT
}`,
  'kyc/upload.ts': `import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.KYC_BUCKET!

export async function uploadDocument(
  userId: string,
  file: File,
  type: 'front' | 'back' | 'selfie'
) {
  const buffer = Buffer.from(await file.arrayBuffer())

  // 1. Redimensiona e converte para JPEG (remove metadados)
  const processed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer()

  // 2. Gera key única
  const key = \`kyc/\${userId}/\${type}-\${Date.now()}.jpg\`

  // 3. Upload com criptografia
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: processed,
    ContentType: 'image/jpeg',
    ServerSideEncryption: 'aws:kms',
    // Bloqueia acesso público
    ACL: 'private',
  }))

  return key
}

// Gera URL temporária para visualização (só admin)
export async function getDocumentUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  // URL válida por 5 minutos
  return getSignedUrl(s3, command, { expiresIn: 300 })
}`,
  'kyc/validators.ts': `export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\\D/g, '')

  if (cpf.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\\d)\\1+\$/.test(cpf)) return false

  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cpf[10])) return false

  return true
}

export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/\\D/g, '')
  return cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '\$1.\$2.\$3-\$4')
}`,
  'kyc/verify.ts': `// Exemplo com serviço de verificação
export async function verifyWithProvider(userId: string) {
  const kyc = await db.kyc.findUnique({ where: { userId } })
  if (!kyc) throw new Error('KYC não encontrado')

  // 1. Busca URLs temporárias dos documentos
  const frontUrl = await getDocumentUrl(kyc.documentFrontKey!)
  const selfieUrl = await getDocumentUrl(kyc.selfieKey!)

  // 2. Envia para o provider
  const result = await kycProvider.verify({
    documentUrl: frontUrl,
    selfieUrl: selfieUrl,
    cpf: decrypt(kyc.cpf),
  })

  // 3. Atualiza status
  if (result.approved) {
    await db.kyc.update({
      where: { userId },
      data: {
        verifiedAt: new Date(),
        verifiedBy: 'system',
      },
    })

    await db.user.update({
      where: { id: userId },
      data: { kycStatus: 'VERIFIED' },
    })
  } else {
    await db.kyc.update({
      where: { userId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: result.reason,
      },
    })

    await db.user.update({
      where: { id: userId },
      data: { kycStatus: 'REJECTED' },
    })
  }

  return result
}`,
  'monitoramento/alerts.ts': `import { logger } from './logger'

type AlertLevel = 'info' | 'warning' | 'critical'

type Alert = {
  level: AlertLevel
  title: string
  message: string
  context?: Record<string, any>
}

export async function sendAlert(alert: Alert) {
  // Log sempre
  logger[alert.level === 'critical' ? 'error' : 'warn']({
    alert: true,
    ...alert,
  }, alert.title)

  // Slack para warnings e critical
  if (alert.level !== 'info') {
    await sendSlackAlert(alert)
  }

  // PagerDuty apenas para critical
  if (alert.level === 'critical') {
    await sendPagerDuty(alert)
  }
}

async function sendSlackAlert(alert: Alert) {
  const color = alert.level === 'critical' ? '#ff0000' : '#ffcc00'

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: Object.entries(alert.context || {}).map(([k, v]) => ({
          title: k,
          value: String(v),
          short: true,
        })),
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  })
}

// Uso:
// await sendAlert({
//   level: 'critical',
//   title: 'Taxa de erro alta',
//   message: 'Mais de 10% das requisições estão falhando',
//   context: { errorRate: '15%', endpoint: '/api/checkout' },
// })`,
  'monitoramento/audit-schema.prisma': `model AuditLog {
  id          String   @id @default(cuid())
  action      String
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  targetId    String?
  targetType  String?
  metadata    Json     @default("{}")

  ip          String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}`,
  'monitoramento/audit.ts': `import { db } from './db'
import { logger } from './logger'

type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.settings.update'
  | 'payment.created'
  | 'payment.refunded'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'member.invited'
  | 'member.removed'
  | 'data.exported'
  | 'data.deleted'

type AuditLog = {
  action: AuditAction
  userId: string
  targetId?: string
  targetType?: string
  metadata?: Record<string, any>
  ip?: string
  userAgent?: string
}

export async function audit(log: AuditLog) {
  // 1. Salva no banco
  await db.auditLog.create({
    data: {
      action: log.action,
      userId: log.userId,
      targetId: log.targetId,
      targetType: log.targetType,
      metadata: log.metadata || {},
      ip: log.ip,
      userAgent: log.userAgent,
    },
  })

  // 2. Log estruturado
  logger.info({
    type: 'audit',
    ...log,
  }, \`Audit: \${log.action}\`)

  // 3. Alerta para ações críticas
  if (isCriticalAction(log.action)) {
    await sendSecurityAlert(log)
  }
}

function isCriticalAction(action: AuditAction) {
  return [
    'data.exported',
    'data.deleted',
    'api_key.created',
    'member.removed',
  ].includes(action)
}

// Uso:
// await audit({
//   action: 'api_key.created',
//   userId: session.user.id,
//   metadata: { keyName: 'Production Key' },
//   ip: request.ip,
// })`,
  'monitoramento/global-error.tsx': `'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
            <p className="text-gray-600 mb-4">
              Nossa equipe foi notificada e está investigando.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}`,
  'monitoramento/health-route.ts': `import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {}
  let healthy = true

  // Check Database
  try {
    const start = Date.now()
    await db.\$queryRaw\`SELECT 1\`
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
}`,
  'monitoramento/logger.ts': `import pino from 'pino'

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
// log.info({ userId, amount }, 'Payment processed')`,
  'monitoramento/metrics-route.ts': `import { NextResponse } from 'next/server'
import { registry } from '@/lib/metrics'

export async function GET(request: Request) {
  // Protege endpoint de métricas
  const authHeader = request.headers.get('authorization')

  if (authHeader !== \`Bearer \${process.env.METRICS_TOKEN}\`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const metrics = await registry.metrics()

  return new NextResponse(metrics, {
    headers: { 'Content-Type': registry.contentType },
  })
}`,
  'monitoramento/metrics.ts': `import { Registry, Counter, Histogram, Gauge } from 'prom-client'

export const registry = new Registry()

// Métricas HTTP
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
})

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [registry],
})

// Métricas de negócio
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Usuários ativos nos últimos 5 minutos',
  registers: [registry],
})

export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total de pagamentos processados',
  labelNames: ['status', 'method'],
  registers: [registry],
})

export const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Tamanho atual da fila de jobs',
  labelNames: ['queue'],
  registers: [registry],
})`,
  'monitoramento/request-logger.ts': `import { NextRequest, NextResponse } from 'next/server'
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
    duration: \`\${duration}ms\`,
    ...meta,
  }, 'Request completed')
}`,
  'monitoramento/sentry.ts': `import * as Sentry from '@sentry/nextjs'

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
// captureError(error, { userId: user.id, action: 'checkout' })`,
  'notifications/NotificationBell.tsx': `'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  actionUrl?: string
  createdAt: string
  readAt?: string
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.readAt).length

  // Carrega notificações iniciais
  useEffect(() => {
    if (!session?.user) return

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data.notifications))
  }, [session])

  // Escuta novas notificações em tempo real
  useEffect(() => {
    if (!session?.user) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe(\`user-\${session.user.id}\`)

    channel.bind('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])

      // Toca som
      new Audio('/notification.mp3').play().catch(() => {})
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(\`user-\${session.user.id}\`)
    }
  }, [session])

  async function markAsRead(id: string) {
    await fetch(\`/api/notifications/\${id}/read\`, { method: 'POST' })
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
    )
  }

  async function markAllAsRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications(prev =>
      prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) markAsRead(n.id)
                    if (n.actionUrl) window.location.href = n.actionUrl
                  }}
                  className={\`
                    p-3 border-b cursor-pointer hover:bg-gray-50
                    \${!n.readAt ? 'bg-blue-50' : ''}
                  \`}
                >
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <a
            href="/notifications"
            className="block p-3 text-center text-sm text-blue-500 hover:bg-gray-50 border-t"
          >
            Ver todas
          </a>
        </div>
      )}
    </div>
  )
}
`,
  'notifications/OrderShipped.tsx': `import {
  Html, Head, Body, Container, Text, Button, Preview
} from '@react-email/components'

type Props = {
  userName: string
  orderNumber: string
  trackingUrl: string
}

export function OrderShippedEmail({ userName, orderNumber, trackingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Seu pedido foi enviado!</Preview>
      <Body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Container>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Pedido Enviado!
          </Text>

          <Text>Olá {userName},</Text>

          <Text>
            Seu pedido <strong>#{orderNumber}</strong> foi enviado e está a caminho!
          </Text>

          <Button
            href={trackingUrl}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Rastrear Pedido
          </Button>

          <Text style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
            Dúvidas? Responda este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
`,
  'notifications/email.ts': `import { Resend } from 'resend'
import { render } from '@react-email/render'
import { OrderShippedEmail } from '@/emails/OrderShipped'
import { SecurityAlertEmail } from '@/emails/SecurityAlert'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_TEMPLATES: Record<NotificationType, React.ComponentType<any>> = {
  ORDER_SHIPPED: OrderShippedEmail,
  SECURITY_ALERT: SecurityAlertEmail,
  // ... outros templates
}

export async function sendEmail(
  userId: string,
  title: string,
  body: string,
  type?: NotificationType,
  data?: Record<string, any>
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })

  if (!user?.email) return

  // Usa template específico se existir
  let html: string

  if (type && EMAIL_TEMPLATES[type]) {
    const Template = EMAIL_TEMPLATES[type]
    html = render(<Template userName={user.name} {...data} />)
  } else {
    // Template genérico
    html = render(<GenericEmail title={title} body={body} />)
  }

  await resend.emails.send({
    from: 'Meu SaaS <noreply@meusaas.com>',
    to: user.email,
    subject: title,
    html,
  })
}
`,
  'notifications/notifications-route.ts': `import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = 20

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  })

  const hasMore = notifications.length > limit
  if (hasMore) notifications.pop()

  return NextResponse.json({
    notifications,
    nextCursor: hasMore ? notifications[notifications.length - 1].id : null,
  })
}
`,
  'notifications/preferences-page.tsx': `import { auth } from '@/lib/auth'

const NOTIFICATION_TYPES = [
  { type: 'ORDER_CREATED', label: 'Novos pedidos', category: 'Pedidos' },
  { type: 'ORDER_SHIPPED', label: 'Pedido enviado', category: 'Pedidos' },
  { type: 'PAYMENT_RECEIVED', label: 'Pagamento recebido', category: 'Financeiro' },
  { type: 'PAYMENT_FAILED', label: 'Pagamento falhou', category: 'Financeiro' },
  { type: 'NEW_COMMENT', label: 'Novos comentários', category: 'Social' },
  { type: 'SECURITY_ALERT', label: 'Alertas de segurança', category: 'Segurança' },
  { type: 'WEEKLY_DIGEST', label: 'Resumo semanal', category: 'Marketing' },
]

export default async function NotificationPreferencesPage() {
  const session = await auth()

  const preferences = await db.notificationPreference.findMany({
    where: { userId: session!.user.id },
  })

  const prefMap = Object.fromEntries(
    preferences.map(p => [p.type, p])
  )

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Preferências de Notificação</h1>

      <form action={updatePreferences}>
        {Object.entries(
          NOTIFICATION_TYPES.reduce((acc, t) => {
            acc[t.category] = acc[t.category] || []
            acc[t.category].push(t)
            return acc
          }, {} as Record<string, typeof NOTIFICATION_TYPES>)
        ).map(([category, types]) => (
          <div key={category} className="mb-8">
            <h2 className="font-semibold mb-4">{category}</h2>

            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2 text-center">In-App</th>
                  <th className="pb-2 text-center">Email</th>
                  <th className="pb-2 text-center">Push</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => {
                  const pref = prefMap[t.type] || { inApp: true, email: true, push: true }
                  return (
                    <tr key={t.type} className="border-t">
                      <td className="py-3">{t.label}</td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={\`\${t.type}.inApp\`}
                          defaultChecked={pref.inApp}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={\`\${t.type}.email\`}
                          defaultChecked={pref.email}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={\`\${t.type}.push\`}
                          defaultChecked={pref.push}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Salvar Preferências
        </button>
      </form>
    </div>
  )
}
`,
  'notifications/push.ts': `import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:suporte@meusaas.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPush(userId: string, title: string, body: string) {
  // Busca subscriptions do usuário (pode ter múltiplos devices)
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  })

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: '/' },
  })

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  )

  // Remove subscriptions inválidas
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      await db.pushSubscription.delete({
        where: { id: subscriptions[i].id },
      })
    }
  }
}
`,
  'notifications/schema.prisma': `model Notification {
  id          String   @id @default(cuid())

  // Destinatário
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Conteúdo
  type        NotificationType
  title       String
  body        String
  data        Json?    // Dados extras (orderId, etc)

  // Link de ação
  actionUrl   String?
  actionLabel String?

  // Status
  readAt      DateTime?
  archivedAt  DateTime?

  // Canais enviados
  channels    NotificationChannel[]

  createdAt   DateTime @default(now())

  @@index([userId, readAt])
  @@index([userId, createdAt])
}

model NotificationChannel {
  id             String       @id @default(cuid())
  notificationId String
  notification   Notification @relation(fields: [notificationId], references: [id])

  channel        Channel      // EMAIL, PUSH, SMS
  status         DeliveryStatus @default(PENDING)
  sentAt         DateTime?
  failedAt       DateTime?
  failureReason  String?

  @@index([notificationId])
}

model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Preferências por tipo
  type        NotificationType
  email       Boolean  @default(true)
  push        Boolean  @default(true)
  sms         Boolean  @default(false)
  inApp       Boolean  @default(true)

  @@unique([userId, type])
}

enum NotificationType {
  // Transacionais
  ORDER_CREATED
  ORDER_SHIPPED
  ORDER_DELIVERED
  PAYMENT_RECEIVED
  PAYMENT_FAILED

  // Social
  NEW_FOLLOWER
  NEW_COMMENT
  MENTION

  // Sistema
  SECURITY_ALERT
  ACCOUNT_UPDATE
  FEATURE_ANNOUNCEMENT

  // Marketing
  PROMOTION
  WEEKLY_DIGEST
}

enum Channel {
  EMAIL
  PUSH
  SMS
  WEBHOOK
}

enum DeliveryStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
}
`,
  'notifications/service.ts': `import { db } from '@/lib/db'
import { sendEmail } from './channels/email'
import { sendPush } from './channels/push'
import { sendSMS } from './channels/sms'
import { pusher } from '@/lib/pusher'

type CreateNotification = {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
  actionUrl?: string
  actionLabel?: string
}

export async function notify(input: CreateNotification) {
  // 1. Busca preferências do usuário
  const preferences = await db.notificationPreference.findUnique({
    where: { userId_type: { userId: input.userId, type: input.type } },
  })

  // Se não tem preferência, usa defaults
  const prefs = preferences || {
    email: true,
    push: true,
    sms: false,
    inApp: true,
  }

  // 2. Cria notificação no banco
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
    },
  })

  // 3. Envia por cada canal habilitado
  const channels: Promise<void>[] = []

  if (prefs.inApp) {
    channels.push(sendInApp(notification))
  }

  if (prefs.email) {
    channels.push(
      sendToChannel(notification.id, 'EMAIL', () =>
        sendEmail(input.userId, input.title, input.body)
      )
    )
  }

  if (prefs.push) {
    channels.push(
      sendToChannel(notification.id, 'PUSH', () =>
        sendPush(input.userId, input.title, input.body)
      )
    )
  }

  if (prefs.sms && isCritical(input.type)) {
    channels.push(
      sendToChannel(notification.id, 'SMS', () =>
        sendSMS(input.userId, input.body)
      )
    )
  }

  // Não bloqueia - envia em background
  Promise.allSettled(channels)

  return notification
}

// Envia notificação real-time via Pusher
async function sendInApp(notification: Notification) {
  await pusher.trigger(
    \`user-\${notification.userId}\`,
    'notification',
    {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    }
  )
}

// Wrapper para tracking de delivery
async function sendToChannel(
  notificationId: string,
  channel: Channel,
  sendFn: () => Promise<void>
) {
  const channelRecord = await db.notificationChannel.create({
    data: { notificationId, channel, status: 'PENDING' },
  })

  try {
    await sendFn()
    await db.notificationChannel.update({
      where: { id: channelRecord.id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  } catch (error) {
    await db.notificationChannel.update({
      where: { id: channelRecord.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown',
      },
    })
  }
}

function isCritical(type: NotificationType) {
  return ['SECURITY_ALERT', 'PAYMENT_FAILED'].includes(type)
}
`,
  'notifications/subscribe-route.ts': `import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await request.json()

  // Salva subscription
  await db.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      },
    },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  })

  return NextResponse.json({ success: true })
}
`,
  'notifications/usePushNotifications.ts': `'use client'

import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function subscribe() {
    if (!isSupported) return { success: false, error: 'Not supported' }

    try {
      // 1. Pede permissão
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        return { success: false, error: 'Permission denied' }
      }

      // 2. Registra service worker
      const registration = await navigator.serviceWorker.register('/sw.js')

      // 3. Cria subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // 4. Envia para backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to subscribe' }
    }
  }

  return { permission, isSupported, subscribe }
}
`,
  'performance/bundle-analyzer.sh': `# Instalar
npm install @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // suas configs
})

# Executar análise
ANALYZE=true npm run build
`,
  'performance/dynamic-imports.tsx': `import dynamic from 'next/dynamic'

// Componente pesado carregado sob demanda
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Se não precisa de SSR
})

// Múltiplos componentes do mesmo módulo
const { Modal, Dialog } = dynamic(() => import('./ui'), {
  loading: () => <Spinner />,
})

// Carrega apenas quando visível (intersection observer)
const LazySection = dynamic(() => import('./LazySection'), {
  loading: () => <SectionSkeleton />,
})

export default function Page() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      {/* Chart só carrega quando a página renderiza */}
      <HeavyChart data={data} />

      {/* Modal só carrega quando abre */}
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  )
}
`,
  'performance/loading-tsx.tsx': `export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  )
}
`,
  'performance/next-font-layout.tsx': `import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={\`\${inter.variable} \${jetbrainsMono.variable}\`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
`,
  'performance/next-image-optimized.tsx': `import Image from 'next/image'

// Imagem responsiva com sizes correto
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Acima do fold - carrega imediatamente
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Imagem de avatar (tamanho fixo)
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>

// Imagem que preenche o container
<div className="relative h-64">
  <Image
    src="/bg.jpg"
    alt="Background"
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>
`,
  'performance/parallel-routes-layout.tsx': `export default function Layout({
  children,
  stats,
  orders,
  chart,
}: {
  children: React.ReactNode
  stats: React.ReactNode
  orders: React.ReactNode
  chart: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {children}
      <div className="grid grid-cols-3 gap-4">
        {stats}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {orders}
        {chart}
      </div>
    </div>
  )
}
`,
  'performance/parallel-routes-structure.txt': `// Estrutura de pastas
app/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── @stats/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── @orders/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   └── @chart/
│       ├── page.tsx
│       └── loading.tsx
`,
  'performance/suspense-manual.tsx': `import { Suspense } from 'react'

// Componentes async que fazem fetch
async function RevenueChart() {
  const data = await getRevenueData() // Lento - 2s
  return <Chart data={data} />
}

async function RecentOrders() {
  const orders = await getRecentOrders() // Médio - 500ms
  return <OrderList orders={orders} />
}

async function QuickStats() {
  const stats = await getStats() // Rápido - 100ms
  return <StatsCards stats={stats} />
}

// Page com streaming
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Stats carrega primeiro (mais rápido) */}
      <Suspense fallback={<StatsLoading />}>
        <QuickStats />
      </Suspense>

      {/* Orders carrega depois */}
      <Suspense fallback={<OrdersLoading />}>
        <RecentOrders />
      </Suspense>

      {/* Chart carrega por último (mais lento) */}
      <Suspense fallback={<ChartLoading />}>
        <RevenueChart />
      </Suspense>
    </div>
  )
}
`,
  'performance/tailwind-config-fonts.ts': `module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
}
`,
  'performance/tree-shaking.ts': `// ❌ RUIM: Importa a biblioteca inteira
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ BOM: Importa apenas a função
import debounce from 'lodash/debounce'
debounce(fn, 300)

// ❌ RUIM: Importa todos os ícones
import * as Icons from 'lucide-react'
<Icons.Search />

// ✅ BOM: Importa apenas o ícone usado
import { Search } from 'lucide-react'
<Search />

// ❌ RUIM: date-fns inteiro
import { format } from 'date-fns'

// ✅ BOM: apenas a função
import format from 'date-fns/format'
`,
  'ratelimit/api-keys-page.tsx': `import { generateApiKey } from '@/lib/api-keys'
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
}`,
  'ratelimit/api-keys.ts': `import { randomBytes, createHash } from 'crypto'
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
}`,
  'ratelimit/api-route.ts': `import { NextRequest, NextResponse } from 'next/server'
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
}`,
  'ratelimit/middleware.ts': `import { NextResponse } from 'next/server'
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
}`,
  'ratelimit/openapi-route.ts': `import { NextResponse } from 'next/server'

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
                    data: { type: 'array', items: { \$ref: '#/components/schemas/User' } },
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
}`,
  'ratelimit/rate-limit-by-plan.ts': `const PLAN_LIMITS = {
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
}`,
  'ratelimit/rate-limit.ts': `import { Ratelimit } from '@upstash/ratelimit'
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
}`,
  'ratelimit/schema.prisma': `model ApiKey {
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
}`,
  'realtime/chat-actions.ts': `'use server'

import { pusherServer } from '@/lib/pusher'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function sendMessage(chatId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  // 1. Salva no banco
  const message = await db.message.create({
    data: {
      chatId,
      content,
      senderId: user.id,
    },
  })

  // 2. Envia em tempo real para todos no canal
  await pusherServer.trigger(
    \`chat-\${chatId}\`,  // Nome do canal
    'new-message',      // Nome do evento
    {
      id: message.id,
      content: message.content,
      senderId: user.id,
      senderName: user.name,
      createdAt: message.createdAt,
    }
  )

  return message
}`,
  'realtime/chat-messages.tsx': `'use client'

import { useEffect, useState } from 'react'
import { pusherClient } from '@/lib/pusher'

type Message = {
  id: string
  content: string
  senderName: string
  createdAt: string
}

export function ChatMessages({
  chatId,
  initialMessages
}: {
  chatId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)

  useEffect(() => {
    // Conecta ao canal do chat
    const channel = pusherClient.subscribe(\`chat-\${chatId}\`)

    // Escuta novas mensagens
    channel.bind('new-message', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage])
    })

    // Cleanup quando sair da página
    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(\`chat-\${chatId}\`)
    }
  }, [chatId])

  return (
    <div className="space-y-2">
      {messages.map(msg => (
        <div key={msg.id} className="p-2 bg-gray-100 rounded">
          <strong>{msg.senderName}:</strong> {msg.content}
        </div>
      ))}
    </div>
  )
}`,
  'realtime/ical-parser.ts': `import ical from 'node-ical'

type Booking = {
  uid: string
  start: Date
  end: Date
  summary: string
  source: 'airbnb' | 'booking' | 'other'
}

export async function parseIcal(url: string): Promise<Booking[]> {
  const events = await ical.async.fromURL(url)
  const bookings: Booking[] = []

  for (const event of Object.values(events)) {
    if (event.type !== 'VEVENT') continue

    // Detecta a fonte pelo conteúdo
    const source = event.summary?.includes('Airbnb')
      ? 'airbnb'
      : event.summary?.includes('Booking')
        ? 'booking'
        : 'other'

    bookings.push({
      uid: event.uid,
      start: new Date(event.start),
      end: new Date(event.end),
      summary: event.summary || 'Reserva',
      source,
    })
  }

  return bookings
}

export async function syncPropertyCalendar(property: {
  id: string
  icalUrl: string
}) {
  const bookings = await parseIcal(property.icalUrl)
  const newBookings = []

  for (const booking of bookings) {
    // Upsert: cria ou atualiza
    const result = await db.booking.upsert({
      where: {
        propertyId_externalId: {
          propertyId: property.id,
          externalId: booking.uid,
        }
      },
      create: {
        propertyId: property.id,
        externalId: booking.uid,
        startDate: booking.start,
        endDate: booking.end,
        source: booking.source,
        title: booking.summary,
      },
      update: {
        startDate: booking.start,
        endDate: booking.end,
        title: booking.summary,
      },
    })

    newBookings.push(result)
  }

  return newBookings
}`,
  'realtime/pusher.ts': `import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Servidor (Server Actions / API Routes)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Cliente (React)
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
)`,
  'realtime/qstash-queue.ts': `import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

// Agenda job para daqui 30 minutos
await qstash.publishJSON({
  url: 'https://meuapp.com/api/jobs/sync-property',
  body: { propertyId: '123' },
  delay: 30 * 60, // 30 minutos em segundos
})

// Ou adiciona à fila para processar agora
await qstash.publishJSON({
  url: 'https://meuapp.com/api/jobs/sync-property',
  body: { propertyId: '123' },
})`,
  'realtime/sync-calendars-route.ts': `import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Protege o endpoint (só Vercel pode chamar)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca todos os imóveis com calendário configurado
  const properties = await db.property.findMany({
    where: { icalUrl: { not: null } },
    select: { id: true, icalUrl: true, tenantId: true },
  })

  const results = []

  for (const property of properties) {
    try {
      // Busca e processa o iCal
      const newBookings = await syncPropertyCalendar(property)
      results.push({ propertyId: property.id, synced: newBookings.length })
    } catch (error) {
      results.push({ propertyId: property.id, error: error.message })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}`,
  'realtime/tenant-isolation.ts': `// Canal privado por tenant + chat
const channelName = \`private-tenant-\${tenantId}-chat-\${chatId}\`

// No servidor, valide que o usuário pertence ao tenant
// antes de permitir envio de mensagens`,
  'realtime/typing-indicator.ts': `// Cliente: avisa que está digitando
function handleTyping() {
  pusherClient.channel(\`chat-\${chatId}\`).trigger(
    'client-typing',
    { userName: user.name }
  )
}

// Cliente: escuta quem está digitando
channel.bind('client-typing', ({ userName }) => {
  setTypingUser(userName)
  setTimeout(() => setTypingUser(null), 2000)
})`,
  'realtime/vercel-cron.json': `{
  "crons": [
    {
      "path": "/api/cron/sync-calendars",
      "schedule": "*/30 * * * *"
    }
  ]
}`,
  'saas/FeatureGate.tsx': `import { hasFeature } from '@/lib/features'

type FeatureKey = Parameters<typeof hasFeature>[0]

type Props = {
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function FeatureGate({ feature, children, fallback }: Props) {
  const enabled = await hasFeature(feature)

  if (!enabled) {
    return fallback ?? null
  }

  return <>{children}</>
}

// Uso:
<FeatureGate
  feature="advancedAnalytics"
  fallback={<UpgradePrompt />}
>
  <AdvancedAnalytics />
</FeatureGate>`,
  'saas/api-actions.ts': `'use server'

import { hasFeature } from '@/lib/features'

export async function exportData(format: 'csv' | 'json') {
  // Verifica se tem acesso à feature
  const canExport = await hasFeature('apiAccess')

  if (!canExport) {
    return {
      success: false,
      error: 'Faça upgrade para o plano Pro para exportar dados.',
    }
  }

  // ... lógica de exportação
}`,
  'saas/billing-actions.ts': `'use server'

import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { requireTenant, requireUser } from '@/lib/auth'

export async function createCheckoutSession(priceId: string) {
  const tenant = await requireTenant()
  const user = await requireUser()

  // Cria customer se não existir
  let customerId = tenant.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { tenantId: tenant.id },
    })

    await db.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id },
    })

    customerId = customer.id
  }

  // Cria sessão de checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: \`\${process.env.NEXT_PUBLIC_URL}/billing?success=true\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_URL}/billing?canceled=true\`,
    metadata: { tenantId: tenant.id },
  })

  redirect(session.url!)
}

export async function createPortalSession() {
  const tenant = await requireTenant()

  if (!tenant.stripeCustomerId) {
    throw new Error('No Stripe customer')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: \`\${process.env.NEXT_PUBLIC_URL}/billing\`,
  })

  redirect(session.url)
}`,
  'saas/billing-limits.ts': `import { getCurrentTenant } from '@/lib/db/tenant-context'
import { db } from '@/lib/db'

export async function checkLimit(resource: 'users' | 'projects') {
  const tenant = await getCurrentTenant()
  if (!tenant) throw new Error('No tenant')

  const limits = {
    users: tenant.maxUsers,
    projects: tenant.maxProjects,
  }

  const counts = {
    users: await db.user.count({ where: { tenantId: tenant.id } }),
    projects: await db.project.count({ where: { tenantId: tenant.id } }),
  }

  const current = counts[resource]
  const max = limits[resource]

  return {
    allowed: current < max,
    current,
    max,
    remaining: max - current,
  }
}

// Em Server Actions:
export async function createUser(data: CreateUserInput) {
  const limit = await checkLimit('users')

  if (!limit.allowed) {
    return {
      success: false,
      error: \`Limite de \${limit.max} usuários atingido. Faça upgrade do plano.\`,
    }
  }

  // ... criar usuário
}`,
  'saas/dashboard-page.tsx': `import { hasFeature } from '@/lib/features'

export default async function DashboardPage() {
  const showAdvancedAnalytics = await hasFeature('advancedAnalytics')
  const showNewDashboard = await hasFeature('newDashboard')

  if (showNewDashboard) {
    return <NewDashboard />
  }

  return (
    <div>
      <BasicStats />

      {showAdvancedAnalytics ? (
        <AdvancedAnalytics />
      ) : (
        <UpgradePrompt feature="Advanced Analytics" />
      )}
    </div>
  )
}`,
  'saas/features.ts': `import { cache } from 'react'
import { getCurrentTenant } from '@/lib/db/tenant-context'

// Definição de features e seus requisitos
const FEATURE_CONFIG = {
  // Features por plano
  advancedAnalytics: { plans: ['PRO', 'ENTERPRISE'] },
  apiAccess: { plans: ['PRO', 'ENTERPRISE'] },
  customBranding: { plans: ['ENTERPRISE'] },
  ssoLogin: { plans: ['ENTERPRISE'] },

  // Features em beta (por tenant ID)
  newDashboard: { beta: true, tenants: ['tenant_123', 'tenant_456'] },

  // Features com rollout percentual
  newEditor: { rollout: 0.2 }, // 20% dos usuários
} as const

type FeatureKey = keyof typeof FEATURE_CONFIG

// Cache por request
export const getFeatureFlags = cache(async () => {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    return {} as Record<FeatureKey, boolean>
  }

  const flags: Record<string, boolean> = {}

  for (const [key, config] of Object.entries(FEATURE_CONFIG)) {
    // Verifica por plano
    if ('plans' in config) {
      flags[key] = config.plans.includes(tenant.plan)
      continue
    }

    // Verifica beta por tenant
    if ('beta' in config && config.beta) {
      flags[key] = config.tenants?.includes(tenant.id) ?? false
      continue
    }

    // Verifica rollout percentual
    if ('rollout' in config) {
      // Hash consistente baseado no tenant ID
      const hash = simpleHash(tenant.id + key)
      flags[key] = (hash % 100) / 100 < config.rollout
      continue
    }

    flags[key] = false
  }

  return flags as Record<FeatureKey, boolean>
})

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Helper para verificar uma feature específica
export async function hasFeature(feature: FeatureKey): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[feature] ?? false
}`,
  'saas/middleware-subdomain.ts': `export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // Ignora domínios principais
  if (['www', 'app', 'api'].includes(subdomain)) {
    return NextResponse.next()
  }

  // Subdomínio = slug do tenant
  // acme.seuapp.com → tenant: acme
  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', subdomain)

  return response
}

// No Server Component:
import { headers } from 'next/headers'

async function getTenantFromSubdomain() {
  const tenantSlug = headers().get('x-tenant-slug')

  if (!tenantSlug) return null

  return db.tenant.findUnique({
    where: { slug: tenantSlug },
  })
}`,
  'saas/pricing-page.tsx': `const plans = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['3 usuários', '5 projetos', 'Suporte por email'],
  },
  {
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['10 usuários', '50 projetos', 'Suporte prioritário', 'API access'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: ['Usuários ilimitados', 'Projetos ilimitados', 'Suporte 24/7', 'SLA 99.9%'],
  },
]

export default async function PricingPage() {
  const tenant = await getCurrentTenant()

  return (
    <div className="grid grid-cols-3 gap-8">
      {plans.map((plan) => (
        <PricingCard
          key={plan.name}
          plan={plan}
          currentPlan={tenant?.plan}
        />
      ))}
    </div>
  )
}`,
  'saas/schema-prisma.ts': `model Tenant {
  id                   String   @id @default(cuid())
  name                 String
  slug                 String   @unique

  // Stripe
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?
  stripePriceId        String?

  // Plano
  plan                 Plan     @default(FREE)
  subscriptionStatus   String?  // active, past_due, canceled
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?

  // Limites do plano
  maxUsers             Int      @default(3)
  maxProjects          Int      @default(5)

  users                User[]
  createdAt            DateTime @default(now())
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}`,
  'saas/scoped-queries.ts': `import { db } from '@/lib/db'
import { requireTenant } from './tenant-context'

// Factory que retorna queries sempre filtradas pelo tenant
export async function getScopedDb() {
  const tenant = await requireTenant()

  return {
    users: {
      findMany: async (args: any = {}) => {
        return db.user.findMany({
          ...args,
          where: { ...args.where, tenantId: tenant.id },
        })
      },

      findFirst: async (args: any) => {
        return db.user.findFirst({
          ...args,
          where: { ...args.where, tenantId: tenant.id },
        })
      },

      create: async (args: any) => {
        return db.user.create({
          ...args,
          data: { ...args.data, tenantId: tenant.id },
        })
      },

      update: async (args: any) => {
        // Garante que só atualiza do próprio tenant
        const existing = await db.user.findFirst({
          where: { id: args.where.id, tenantId: tenant.id },
        })

        if (!existing) throw new Error('Not found')

        return db.user.update(args)
      },

      delete: async (args: any) => {
        return db.user.deleteMany({
          where: { ...args.where, tenantId: tenant.id },
        })
      },
    },

    // Adicione outros models...
    products: { /* ... */ },
    orders: { /* ... */ },
  }
}

// Uso em Server Component/Action:
const scopedDb = await getScopedDb()
const users = await scopedDb.users.findMany({ where: { role: 'ADMIN' } })`,
  'saas/tenant-context.ts': `import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// Cache por request - evita múltiplas chamadas
export const getCurrentTenant = cache(async () => {
  const token = cookies().get('token')?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload?.tenantId) return null

  const tenant = await db.tenant.findUnique({
    where: { id: payload.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      plan: true,
    },
  })

  return tenant
})

// Helper para garantir tenant em Server Actions
export async function requireTenant() {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  return tenant
}`,
  'security/create-user-action.ts': `'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createUserSchema } from '@/lib/validations/user'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Tipo do retorno padronizado
export type ActionState = {
  success: boolean
  errors?: Record<string, string[]>
  message?: string
} | null

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Autenticação
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, message: 'Não autenticado' }
  }

  // 2. Autorização
  if (currentUser.role !== 'admin') {
    return { success: false, message: 'Sem permissão' }
  }

  // 3. Validação
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    tenantId: currentUser.tenantId,
  }

  const validated = createUserSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // 4. Persistência
  try {
    await db.user.create({
      data: {
        ...validated.data,
        password: await hashPassword(validated.data.password),
      },
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        success: false,
        errors: { email: ['Email já cadastrado'] },
      }
    }
    return { success: false, message: 'Erro ao criar usuário' }
  }

  // 5. Revalidação e Redirect
  revalidatePath('/users')
  redirect('/users')
}
`,
  'security/middleware-complete.ts': `import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Rotas que NÃO precisam de login
const publicRoutes = ['/login', '/register', '/']
const publicPatterns = ['/api/webhooks'] // Prefixos públicos

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  return publicPatterns.some(pattern => pathname.startsWith(pattern))
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  const { pathname } = request.nextUrl

  // Ignora arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // CASO 1: Tenta acessar rota privada sem token
  if (!token && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // CASO 2: Tenta acessar login já estando logado
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // CASO 3: Adiciona headers úteis
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  return response
}

// Onde o middleware vai rodar
export const config = {
  matcher: [
    // Todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
`,
  'security/middleware-jwt-validation.ts': `import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)

  if (!payload) {
    // Token inválido/expirado - limpa cookie e redireciona
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }

  // Passa dados do usuário para as páginas via header
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.sub as string)
  response.headers.set('x-user-role', payload.role as string)

  return response
}
`,
  'security/middleware-role-protection.ts': `const adminRoutes = ['/admin', '/dashboard/settings']

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  const payload = await verifyToken(token)

  // Verifica se a rota requer admin
  const requiresAdmin = adminRoutes.some(r => pathname.startsWith(r))

  if (requiresAdmin && payload?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}
`,
  'security/middleware-with-tenant.ts': `export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Extrai tenant da URL: /app/[tenantSlug]/...
  const tenantSlug = request.nextUrl.pathname.split('/')[2]

  if (tenantSlug) {
    // Verifica se usuário tem acesso ao tenant
    const hasAccess = payload.tenants?.includes(tenantSlug)

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/select-tenant', request.url))
    }

    // Passa tenant atual para as pages
    const response = NextResponse.next()
    response.headers.set('x-tenant-slug', tenantSlug)
    return response
  }

  return NextResponse.next()
}
`,
  'security/new-user-form.tsx': `'use client'

import { useActionState } from 'react'
import { createUser } from '../actions'

export default function NewUserPage() {
  const [state, action, isPending] = useActionState(createUser, null)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          name="name"
          required
          className={state?.errors?.name ? 'border-red-500' : ''}
        />
        {state?.errors?.name && (
          <p className="text-red-500 text-sm">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-sm">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          required
        />
        {state?.errors?.password && (
          <p className="text-red-500 text-sm">{state.errors.password[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select id="role" name="role">
          <option value="user">Usuário</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {state?.message && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? 'Criando...' : 'Criar Usuário'}
      </button>
    </form>
  )
}
`,
  'security/permissions.ts': `// Definição de permissões
export const PERMISSIONS = {
  users: {
    create: 'users:create',
    read: 'users:read',
    update: 'users:update',
    delete: 'users:delete',
  },
  billing: {
    read: 'billing:read',
    manage: 'billing:manage',
  },
  settings: {
    read: 'settings:read',
    manage: 'settings:manage',
  },
} as const

// Roles e suas permissões
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    ...Object.values(PERMISSIONS.users),
    ...Object.values(PERMISSIONS.billing),
    ...Object.values(PERMISSIONS.settings),
  ],
  admin: [
    ...Object.values(PERMISSIONS.users),
    PERMISSIONS.billing.read,
    ...Object.values(PERMISSIONS.settings),
  ],
  member: [
    PERMISSIONS.users.read,
    PERMISSIONS.settings.read,
  ],
  viewer: [
    PERMISSIONS.users.read,
  ],
}

// Função de checagem
export function hasPermission(
  userRole: string,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}
`,
  'security/tenant-db-wrapper.ts': `import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Wrapper que sempre filtra por tenant
export async function getTenantDb() {
  const user = await getCurrentUser()

  if (!user?.tenantId) {
    throw new Error('Tenant não encontrado')
  }

  return {
    // Todas as queries são filtradas pelo tenant
    user: {
      findMany: (args = {}) =>
        db.user.findMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      findUnique: (args) =>
        db.user.findFirst({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      create: (args) =>
        db.user.create({
          ...args,
          data: { ...args.data, tenantId: user.tenantId },
        }),

      update: (args) =>
        db.user.updateMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      delete: (args) =>
        db.user.deleteMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),
    },
    // ... outros models
  }
}

// Uso em Server Actions/Components:
const tenantDb = await getTenantDb()
const users = await tenantDb.user.findMany() // Já filtrado!
`,
  'security/user-validation-schema.ts': `import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase(), // Normaliza

  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),

  role: z.enum(['user', 'admin']).default('user'),

  tenantId: z.string().uuid('Tenant inválido'),
})

// Tipo inferido do schema
export type CreateUserInput = z.infer<typeof createUserSchema>

// Schema para update (todos campos opcionais)
export const updateUserSchema = createUserSchema.partial().omit({
  tenantId: true // Não pode mudar tenant
})
`,
  'security/with-permission-hoc.tsx': `import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) {
  return async function ProtectedComponent(props: P) {
    const user = await getCurrentUser()

    if (!user) {
      redirect('/login')
    }

    if (!hasPermission(user.role, requiredPermission)) {
      redirect('/unauthorized')
    }

    return <WrappedComponent {...props} />
  }
}

// Uso:
// export default withPermission(UserSettings, PERMISSIONS.settings.manage)
`,
  'upload/FileUpload.tsx': `'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

type FileUploadProps = {
  onUploadComplete: (key: string, url: string) => void
  accept?: Record<string, string[]>
  maxSize?: number
}

export function FileUpload({
  onUploadComplete,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'] },
  maxSize = 5 * 1024 * 1024,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // 1. Pega URL assinada
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!presignRes.ok) {
        const data = await presignRes.json()
        throw new Error(data.error || 'Erro ao preparar upload')
      }

      const { url, key } = await presignRes.json()

      // 2. Upload direto para S3 com progresso
      await uploadWithProgress(url, file, setProgress)

      // 3. Confirma upload no backend
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, fileName: file.name, fileSize: file.size }),
      })

      if (!confirmRes.ok) {
        throw new Error('Erro ao confirmar upload')
      }

      const { publicUrl } = await confirmRes.json()
      onUploadComplete(key, publicUrl)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      uploadFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={\`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        \${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        \${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
      \`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: \`\${progress}%\` }}
            />
          </div>
          <p className="text-sm text-gray-600">Enviando... {progress}%</p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600">
            {isDragActive
              ? 'Solte o arquivo aqui'
              : 'Arraste um arquivo ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Máximo {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  )
}

// Helper para upload com progresso
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}`,
  'upload/confirm-route.ts': `import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  key: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { key, fileName, fileSize } = schema.parse(body)

  // Salva referência no banco
  const file = await db.file.create({
    data: {
      key,
      name: fileName,
      size: fileSize,
      userId: session.user.id,
    },
  })

  // Atualiza storage usado
  await db.user.update({
    where: { id: session.user.id },
    data: { storageUsed: { increment: fileSize } },
  })

  // URL pública (se for bucket público) ou CDN
  const publicUrl = \`\${process.env.CDN_URL}/\${key}\`

  return NextResponse.json({ fileId: file.id, publicUrl })
}`,
  'upload/delete-route.ts': `import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFile } from '@/lib/upload/s3'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const file = await db.file.findUnique({
    where: { id: params.id },
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verifica ownership
  if (file.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete (mantém 30 dias para recovery)
  await db.file.update({
    where: { id: file.id },
    data: { deletedAt: new Date() },
  })

  // Atualiza storage
  await db.user.update({
    where: { id: session.user.id },
    data: { storageUsed: { decrement: file.size } },
  })

  // Agenda deleção real do S3 (cron job)
  // await queue.add('delete-file', { key: file.key }, { delay: 30 * 24 * 60 * 60 * 1000 })

  return NextResponse.json({ success: true })
}`,
  'upload/limits.ts': `export const UPLOAD_LIMITS = {
  free: {
    maxFileSize: 5 * 1024 * 1024,      // 5MB
    maxTotalStorage: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  pro: {
    maxFileSize: 50 * 1024 * 1024,      // 50MB
    maxTotalStorage: 5 * 1024 * 1024 * 1024, // 5GB
    allowedTypes: ['image/*', 'application/pdf', 'video/mp4'],
  },
  enterprise: {
    maxFileSize: 500 * 1024 * 1024,     // 500MB
    maxTotalStorage: Infinity,
    allowedTypes: ['*/*'],
  },
} as const

export function checkUploadAllowed(
  plan: keyof typeof UPLOAD_LIMITS,
  fileSize: number,
  mimeType: string,
  currentStorage: number
) {
  const limits = UPLOAD_LIMITS[plan]

  if (fileSize > limits.maxFileSize) {
    return { allowed: false, error: 'Arquivo muito grande' }
  }

  if (currentStorage + fileSize > limits.maxTotalStorage) {
    return { allowed: false, error: 'Limite de armazenamento atingido' }
  }

  const typeAllowed = limits.allowedTypes.some(pattern => {
    if (pattern === '*/*') return true
    if (pattern.endsWith('/*')) {
      return mimeType.startsWith(pattern.replace('/*', '/'))
    }
    return mimeType === pattern
  })

  if (!typeAllowed) {
    return { allowed: false, error: 'Tipo de arquivo não permitido' }
  }

  return { allowed: true }
}`,
  'upload/presign-route.ts': `import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUploadUrl } from '@/lib/upload/s3'
import { checkUploadAllowed, UPLOAD_LIMITS } from '@/lib/upload/limits'
import { z } from 'zod'

const schema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string(),
  fileSize: z.number().positive(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { fileName, contentType, fileSize } = parsed.data

  // Verifica limites do plano
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, storageUsed: true },
  })

  const check = checkUploadAllowed(
    user!.plan,
    fileSize,
    contentType,
    user!.storageUsed
  )

  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: 403 })
  }

  // Gera URL assinada
  const { url, key } = await getUploadUrl(
    session.user.id,
    fileName,
    contentType
  )

  return NextResponse.json({ url, key })
}`,
  'upload/process-image.ts': `import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

type ImageVariant = {
  suffix: string
  width: number
  height?: number
  quality: number
}

const VARIANTS: ImageVariant[] = [
  { suffix: 'thumb', width: 150, height: 150, quality: 80 },
  { suffix: 'small', width: 400, quality: 85 },
  { suffix: 'medium', width: 800, quality: 85 },
  { suffix: 'large', width: 1200, quality: 90 },
]

export async function processAndUploadImage(
  originalKey: string,
  buffer: Buffer
) {
  const variants: Record<string, string> = {}

  for (const variant of VARIANTS) {
    const processed = await sharp(buffer)
      .resize(variant.width, variant.height, {
        fit: variant.height ? 'cover' : 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: variant.quality })
      .toBuffer()

    const variantKey = originalKey.replace(
      /\\.([^.]+)\$/,
      \`-\${variant.suffix}.webp\`
    )

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: variantKey,
      Body: processed,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
    }))

    variants[variant.suffix] = variantKey
  }

  return variants
}

// Uso com queue para processamento assíncrono
// await queue.add('process-image', { key, buffer: buffer.toString('base64') })`,
  'upload/s3.ts': `import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid } from 'uuid'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.S3_BUCKET!

// Gera URL para upload direto
export async function getUploadUrl(
  userId: string,
  fileName: string,
  contentType: string
) {
  // Gera key única
  const ext = fileName.split('.').pop()
  const key = \`uploads/\${userId}/\${uuid()}.\${ext}\`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // Metadados
    Metadata: {
      'original-name': fileName,
      'uploaded-by': userId,
    },
  })

  // URL válida por 5 minutos
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })

  return { url, key }
}

// Gera URL para download
export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 hora
}

// Deleta arquivo
export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }))
}`,
  'upload/schema.prisma': `model File {
  id          String   @id @default(cuid())
  key         String   @unique // S3 key
  name        String   // Nome original
  size        Int      // Bytes
  mimeType    String?

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Organização
  folderId    String?
  folder      Folder?  @relation(fields: [folderId], references: [id])

  // Acesso
  isPublic    Boolean  @default(false)
  sharedWith  FileShare[]

  createdAt   DateTime @default(now())
  deletedAt   DateTime? // Soft delete

  @@index([userId])
  @@index([folderId])
}

model Folder {
  id          String   @id @default(cuid())
  name        String
  parentId    String?
  parent      Folder?  @relation("FolderTree", fields: [parentId], references: [id])
  children    Folder[] @relation("FolderTree")

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  files       File[]

  createdAt   DateTime @default(now())

  @@index([userId, parentId])
}

model FileShare {
  id          String   @id @default(cuid())
  fileId      String
  file        File     @relation(fields: [fileId], references: [id])

  // Compartilhar com usuário ou link público
  sharedWithId String?
  sharedWith  User?    @relation(fields: [sharedWithId], references: [id])

  // Link público com token
  token       String?  @unique
  expiresAt   DateTime?

  permission  Permission @default(VIEW)

  createdAt   DateTime @default(now())

  @@index([fileId])
  @@index([token])
}

enum Permission {
  VIEW
  DOWNLOAD
  EDIT
}`,
  'upload/validate.ts': `import { fileTypeFromBuffer } from 'file-type'

const ALLOWED_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  'application/pdf': true,
}

export async function validateFileType(buffer: Buffer): Promise<{
  valid: boolean
  mimeType?: string
  error?: string
}> {
  const type = await fileTypeFromBuffer(buffer)

  if (!type) {
    return { valid: false, error: 'Tipo de arquivo não reconhecido' }
  }

  if (!ALLOWED_TYPES[type.mime as keyof typeof ALLOWED_TYPES]) {
    return { valid: false, error: \`Tipo \${type.mime} não permitido\` }
  }

  return { valid: true, mimeType: type.mime }
}

// Validação de imagem (dimensões, etc)
import sharp from 'sharp'

export async function validateImage(buffer: Buffer): Promise<{
  valid: boolean
  width?: number
  height?: number
  error?: string
}> {
  try {
    const metadata = await sharp(buffer).metadata()

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Imagem inválida' }
    }

    // Limite de dimensões
    if (metadata.width > 4096 || metadata.height > 4096) {
      return { valid: false, error: 'Imagem muito grande (max 4096px)' }
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
    }
  } catch {
    return { valid: false, error: 'Erro ao processar imagem' }
  }
}`,
  'wallet/add-balance.ts': `import { db } from '@/lib/db'

// Sempre use transação do banco para garantir consistência
export async function addBalance(
  userId: string,
  amountCents: number,
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND',
  description?: string,
  externalId?: string
) {
  // Transação atômica: atualiza saldo E cria registro juntos
  return db.\$transaction(async (tx) => {
    // 1. Atualiza o saldo
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amountCents } },
    })

    // 2. Cria o registro da transação
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amountCents,
        balanceAfter: wallet.balance, // Saldo APÓS a operação
        type,
        status: 'COMPLETED',
        description,
        externalId,
        processedAt: new Date(),
      },
    })

    return { wallet, transaction }
  })
}`,
  'wallet/request-withdrawal.ts': `export async function requestWithdrawal(
  userId: string,
  amountCents: number,
  pixKey: string
) {
  return db.\$transaction(async (tx) => {
    // 1. Busca a carteira com lock (FOR UPDATE)
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) throw new Error('Carteira não encontrada')
    if (wallet.lockedAt) throw new Error('Carteira bloqueada')
    if (wallet.balance < amountCents) throw new Error('Saldo insuficiente')

    // 2. Deduz o saldo imediatamente
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amountCents } },
    })

    // 3. Cria transação PENDENTE
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: -amountCents, // Negativo = saída
        balanceAfter: updatedWallet.balance,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: \`Saque PIX: \${pixKey}\`,
      },
    })

    return { wallet: updatedWallet, transaction }
  })
}

// Depois, um job processa os saques pendentes
// e atualiza o status para COMPLETED ou FAILED`,
  'wallet/schema.prisma': `model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])

  // Saldo em centavos (evita problemas com decimal)
  balance   Int      @default(0)

  // Controle
  lockedAt  DateTime? // Se não null, carteira bloqueada
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(cuid())
  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])

  // Valores em centavos
  amount      Int      // Positivo = entrada, Negativo = saída
  balanceAfter Int     // Saldo após esta transação

  type        TransactionType
  status      TransactionStatus @default(PENDING)
  description String?

  // Referência externa (ID do pagamento, saque, etc)
  externalId  String?

  createdAt   DateTime @default(now())
  processedAt DateTime?
}

enum TransactionType {
  DEPOSIT     // Dinheiro entrou
  WITHDRAWAL  // Saque solicitado
  PAYMENT     // Pagamento recebido (ex: AbacatePay)
  REFUND      // Estorno
  FEE         // Taxa cobrada
}

enum TransactionStatus {
  PENDING     // Aguardando processamento
  COMPLETED   // Concluído
  FAILED      // Falhou
  CANCELLED   // Cancelado
}`,
  'wallet/wallet-page.tsx': `import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'

export default async function WalletPage() {
  const user = await getCurrentUser()

  const wallet = await db.wallet.findUnique({
    where: { userId: user.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return (
    <div>
      <h1>Minha Carteira</h1>

      {/* Saldo */}
      <div className="text-3xl font-bold">
        {formatCurrency(wallet.balance / 100)}
      </div>

      {/* Histórico */}
      <h2>Últimas transações</h2>
      {wallet.transactions.map(tx => (
        <div key={tx.id}>
          <span>{tx.type}</span>
          <span className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
            {formatCurrency(tx.amount / 100)}
          </span>
        </div>
      ))}
    </div>
  )
}`,
  'wallet/webhook-abacatepay.ts': `import { NextResponse } from 'next/server'
import { addBalance } from '@/lib/wallet/operations'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-abacatepay-signature')

  // 1. Verifica assinatura
  const expectedSig = crypto
    .createHmac('sha256', process.env.ABACATEPAY_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const event = JSON.parse(body)

  // 2. Evita processar o mesmo evento duas vezes
  const existing = await db.transaction.findFirst({
    where: { externalId: event.id },
  })

  if (existing) {
    return NextResponse.json({ message: 'Já processado' })
  }

  // 3. Processa o pagamento
  if (event.type === 'payment.confirmed') {
    const userId = event.metadata.userId
    const amountCents = event.amount // já em centavos

    await addBalance(
      userId,
      amountCents,
      'PAYMENT',
      \`Pagamento #\${event.id}\`,
      event.id
    )
  }

  return NextResponse.json({ received: true })
}`
}
