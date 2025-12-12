import { cache } from 'react'
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
}