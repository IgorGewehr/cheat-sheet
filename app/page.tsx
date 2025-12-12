'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import SearchModal from '@/components/SearchModal'
import {
  navigation,
  // Fundamentos
  ServerVsClient,
  EstruturaPastas,
  // React & Frontend
  HooksCheatSheet,
  StateManagement,
  FrontendReact,
  // Segurança
  MiddlewareAuth,
  ZodServerActions,
  RBACMultitenancy,
  SegurancaCICD,
  // Data Fetching
  FetchingPatterns,
  CachingRevalidation,
  ErrorHandling,
  // Database
  PrismaDrizzle,
  MigrationsSeeds,
  // API
  RouteHandlers,
  ExternalAPIs,
  Webhooks,
  RateLimitingAPI,
  // Real-time
  RealtimeChat,
  CronJobs,
  SistemaNotificacoes,
  // Performance
  PerformanceChecklist,
  StreamingSuspense,
  BundleOptimization,
  MonitoramentoLogs,
  // SaaS
  MultiTenancy,
  SubscriptionBilling,
  FeatureFlags,
  // Financeiro
  WalletSegura,
  KYCVerificacao,
  CertificadosDigitais,
  // Infraestrutura
  FileUpload,
} from '@/content'

// Mapeamento de IDs para componentes
const sections: Record<string, React.ComponentType> = {
  // Fundamentos
  'server-vs-client': ServerVsClient,
  'estrutura-pastas': EstruturaPastas,
  // React & Frontend
  'hooks-cheatsheet': HooksCheatSheet,
  'state-management': StateManagement,
  'frontend-react': FrontendReact,
  // Segurança
  'middleware-auth': MiddlewareAuth,
  'zod-server-actions': ZodServerActions,
  'rbac-multitenancy': RBACMultitenancy,
  'seguranca-cicd': SegurancaCICD,
  // Data Fetching
  'fetching-patterns': FetchingPatterns,
  'caching-revalidation': CachingRevalidation,
  'error-handling': ErrorHandling,
  // Database
  'prisma-drizzle': PrismaDrizzle,
  'migrations-seeds': MigrationsSeeds,
  // API
  'route-handlers': RouteHandlers,
  'external-apis': ExternalAPIs,
  'webhooks': Webhooks,
  'rate-limiting': RateLimitingAPI,
  // Real-time
  'realtime-chat': RealtimeChat,
  'cron-jobs': CronJobs,
  'notificacoes': SistemaNotificacoes,
  // Performance
  'performance-checklist': PerformanceChecklist,
  'streaming-suspense': StreamingSuspense,
  'bundle-optimization': BundleOptimization,
  'monitoramento': MonitoramentoLogs,
  // SaaS
  'multi-tenancy': MultiTenancy,
  'subscription-billing': SubscriptionBilling,
  'feature-flags': FeatureFlags,
  // Financeiro
  'wallet-segura': WalletSegura,
  'kyc-verificacao': KYCVerificacao,
  'certificados-digitais': CertificadosDigitais,
  // Infraestrutura
  'file-upload': FileUpload,
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
