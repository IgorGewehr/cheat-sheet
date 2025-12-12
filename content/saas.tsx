import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function MultiTenancy() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Multi-tenancy Patterns
      </h1>

      <NoteBox type="info" title="O que é Multi-tenancy?">
        Arquitetura onde uma única instância do app serve múltiplos clientes (tenants),
        cada um com seus dados isolados.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estratégias de Isolamento
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Estratégia</th>
            <th>Isolamento</th>
            <th>Complexidade</th>
            <th>Custo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Coluna tenant_id</td>
            <td>Baixo (mesma tabela)</td>
            <td>Simples</td>
            <td>$</td>
          </tr>
          <tr>
            <td>Schema por tenant</td>
            <td>Médio (schemas separados)</td>
            <td>Médio</td>
            <td>$$</td>
          </tr>
          <tr>
            <td>Database por tenant</td>
            <td>Alto (DBs separados)</td>
            <td>Complexo</td>
            <td>$$$</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Padrão Recomendado: Coluna tenant_id
      </h3>

      <CodeBlock
        fileName="lib/db/tenant-context.ts"
        code={`import { cookies } from 'next/headers'
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
}`}
      />

      <CodeBlock
        fileName="lib/db/scoped-queries.ts"
        code={`import { db } from '@/lib/db'
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
const users = await scopedDb.users.findMany({ where: { role: 'ADMIN' } })`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tenant via Subdomínio
      </h3>

      <CodeBlock
        fileName="middleware.ts"
        code={`export function middleware(request: NextRequest) {
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
}`}
      />

      <NoteBox type="danger" title="Armadilhas Comuns">
        <ul className="list-disc list-inside space-y-1">
          <li>Esquecer WHERE tenant_id em alguma query</li>
          <li>JOIN que vaza dados entre tenants</li>
          <li>Cache compartilhado entre tenants</li>
          <li>Confiar em dados do cliente para tenant</li>
        </ul>
        <p className="mt-2 font-bold">
          Use o padrão getScopedDb() para garantir isolamento automático.
        </p>
      </NoteBox>
    </div>
  )
}

export function SubscriptionBilling() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Subscription & Billing
      </h1>

      <NoteBox type="info" title="Stack Recomendada">
        <strong>Stripe</strong> para pagamentos + <strong>Webhooks</strong> para sincronização.
        Nunca confie apenas no cliente para verificar status de assinatura.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura de Dados
      </h3>

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model Tenant {
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Criar Checkout Session
      </h3>

      <CodeBlock
        fileName="app/billing/actions.ts"
        code={`'use server'

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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Verificação de Limites
      </h3>

      <CodeBlock
        fileName="lib/billing/limits.ts"
        code={`import { getCurrentTenant } from '@/lib/db/tenant-context'
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tabela de Preços
      </h3>

      <CodeBlock
        fileName="app/pricing/page.tsx"
        code={`const plans = [
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
}`}
      />
    </div>
  )
}

export function FeatureFlags() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Feature Flags
      </h1>

      <NoteBox type="info" title="Use Cases">
        <ul className="list-disc list-inside">
          <li>Liberar features gradualmente (canary release)</li>
          <li>Features exclusivas por plano (PRO only)</li>
          <li>A/B testing</li>
          <li>Kill switch para features problemáticas</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Implementação Simples (DB)
      </h3>

      <CodeBlock
        fileName="lib/features.ts"
        code={`import { cache } from 'react'
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Uso em Server Components
      </h3>

      <CodeBlock
        fileName="app/dashboard/page.tsx"
        code={`import { hasFeature } from '@/lib/features'

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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Componente de Feature Gate
      </h3>

      <CodeBlock
        fileName="components/FeatureGate.tsx"
        code={`import { hasFeature } from '@/lib/features'

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
</FeatureGate>`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Uso em Server Actions
      </h3>

      <CodeBlock
        fileName="app/api/actions.ts"
        code={`'use server'

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
}`}
      />

      <NoteBox type="success" title="Serviços de Feature Flags">
        Para casos mais complexos, considere:
        <ul className="list-disc list-inside mt-2">
          <li><strong>LaunchDarkly</strong> - Enterprise, muito completo</li>
          <li><strong>Flagsmith</strong> - Open source, self-hosted option</li>
          <li><strong>Vercel Edge Config</strong> - Integrado com Vercel</li>
          <li><strong>PostHog</strong> - Feature flags + analytics</li>
        </ul>
      </NoteBox>
    </div>
  )
}
