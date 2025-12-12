import CodeBlockFile from '@/components/CodeBlockFile'
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

      <CodeBlockFile
        file="saas/tenant-context.ts"
        fileName="lib/db/tenant-context.ts"
      />

      <CodeBlockFile
        file="saas/scoped-queries.ts"
        fileName="lib/db/scoped-queries.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tenant via Subdomínio
      </h3>

      <CodeBlockFile
        file="saas/middleware-subdomain.ts"
        fileName="middleware.ts"
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

      <CodeBlockFile
        file="saas/schema-prisma.ts"
        fileName="prisma/schema.prisma"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Criar Checkout Session
      </h3>

      <CodeBlockFile
        file="saas/billing-actions.ts"
        fileName="app/billing/actions.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Verificação de Limites
      </h3>

      <CodeBlockFile
        file="saas/billing-limits.ts"
        fileName="lib/billing/limits.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tabela de Preços
      </h3>

      <CodeBlockFile
        file="saas/pricing-page.tsx"
        fileName="app/pricing/page.tsx"
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

      <CodeBlockFile
        file="saas/features.ts"
        fileName="lib/features.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Uso em Server Components
      </h3>

      <CodeBlockFile
        file="saas/dashboard-page.tsx"
        fileName="app/dashboard/page.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Componente de Feature Gate
      </h3>

      <CodeBlockFile
        file="saas/FeatureGate.tsx"
        fileName="components/FeatureGate.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Uso em Server Actions
      </h3>

      <CodeBlockFile
        file="saas/api-actions.ts"
        fileName="app/api/actions.ts"
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
