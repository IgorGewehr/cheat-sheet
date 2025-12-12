// Fundamentos
export { ServerVsClient, EstruturaPastas } from './fundamentos'

// Hooks
export { HooksCheatSheet, StateManagement } from './hooks'

// Segurança
export { MiddlewareAuth, ZodServerActions, RBACMultitenancy } from './seguranca'

// Data Fetching
export { FetchingPatterns, CachingRevalidation, ErrorHandling } from './data-fetching'

// Database
export { PrismaDrizzle, MigrationsSeeds } from './database'

// API
export { RouteHandlers, ExternalAPIs, Webhooks } from './api'

// Performance
export { PerformanceChecklist, StreamingSuspense, BundleOptimization } from './performance'

// SaaS
export { MultiTenancy, SubscriptionBilling, FeatureFlags } from './saas'

// Navigation structure
export const navigation = [
  {
    title: 'Fundamentos',
    items: [
      { id: 'server-vs-client', label: 'Server vs Client', icon: '⚖️' },
      { id: 'estrutura-pastas', label: 'Estrutura de Pastas', icon: '📂' },
    ],
  },
  {
    title: 'React & Hooks',
    items: [
      { id: 'hooks-cheatsheet', label: 'Hooks Cheat Sheet', icon: '🪝' },
      { id: 'state-management', label: 'State Management', icon: '🧠' },
    ],
  },
  {
    title: 'Segurança',
    items: [
      { id: 'middleware-auth', label: 'Middleware & Auth', icon: '🛡️' },
      { id: 'zod-server-actions', label: 'Zod & Server Actions', icon: '✅' },
      { id: 'rbac-multitenancy', label: 'RBAC & Multi-tenancy', icon: '👥' },
    ],
  },
  {
    title: 'Data Fetching',
    items: [
      { id: 'fetching-patterns', label: 'Fetching Patterns', icon: '🔄' },
      { id: 'caching-revalidation', label: 'Caching & Revalidation', icon: '💾' },
      { id: 'error-handling', label: 'Error Handling', icon: '🚨' },
    ],
  },
  {
    title: 'Database',
    items: [
      { id: 'prisma-drizzle', label: 'Prisma vs Drizzle', icon: '🗃️' },
      { id: 'migrations-seeds', label: 'Migrations & Seeds', icon: '🌱' },
    ],
  },
  {
    title: 'API Integration',
    items: [
      { id: 'route-handlers', label: 'Route Handlers', icon: '🔌' },
      { id: 'external-apis', label: 'External APIs', icon: '🌐' },
      { id: 'webhooks', label: 'Webhooks', icon: '📡' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { id: 'performance-checklist', label: 'Performance Checklist', icon: '🚀' },
      { id: 'streaming-suspense', label: 'Streaming & Suspense', icon: '⏳' },
      { id: 'bundle-optimization', label: 'Bundle Optimization', icon: '📦' },
    ],
  },
  {
    title: 'SaaS Patterns',
    items: [
      { id: 'multi-tenancy', label: 'Multi-tenancy', icon: '🏢' },
      { id: 'subscription-billing', label: 'Subscription & Billing', icon: '💳' },
      { id: 'feature-flags', label: 'Feature Flags', icon: '🚩' },
    ],
  },
]
