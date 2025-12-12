'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import SearchModal from '@/components/SearchModal'
import {
  navigation,
  ServerVsClient,
  EstruturaPastas,
  HooksCheatSheet,
  StateManagement,
  MiddlewareAuth,
  ZodServerActions,
  RBACMultitenancy,
  FetchingPatterns,
  CachingRevalidation,
  ErrorHandling,
  PrismaDrizzle,
  MigrationsSeeds,
  RouteHandlers,
  ExternalAPIs,
  Webhooks,
  PerformanceChecklist,
  StreamingSuspense,
  BundleOptimization,
  MultiTenancy,
  SubscriptionBilling,
  FeatureFlags,
} from '@/content'

// Mapeamento de IDs para componentes
const sections: Record<string, React.ComponentType> = {
  'server-vs-client': ServerVsClient,
  'estrutura-pastas': EstruturaPastas,
  'hooks-cheatsheet': HooksCheatSheet,
  'state-management': StateManagement,
  'middleware-auth': MiddlewareAuth,
  'zod-server-actions': ZodServerActions,
  'rbac-multitenancy': RBACMultitenancy,
  'fetching-patterns': FetchingPatterns,
  'caching-revalidation': CachingRevalidation,
  'error-handling': ErrorHandling,
  'prisma-drizzle': PrismaDrizzle,
  'migrations-seeds': MigrationsSeeds,
  'route-handlers': RouteHandlers,
  'external-apis': ExternalAPIs,
  'webhooks': Webhooks,
  'performance-checklist': PerformanceChecklist,
  'streaming-suspense': StreamingSuspense,
  'bundle-optimization': BundleOptimization,
  'multi-tenancy': MultiTenancy,
  'subscription-billing': SubscriptionBilling,
  'feature-flags': FeatureFlags,
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('server-vs-client')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const ActiveComponent = sections[activeSection] || ServerVsClient

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        categories={navigation}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 lg:px-10">
          <ActiveComponent />
        </div>
      </main>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        categories={navigation}
        onSelect={(id) => {
          setActiveSection(id)
          setIsSearchOpen(false)
        }}
      />
    </div>
  )
}
