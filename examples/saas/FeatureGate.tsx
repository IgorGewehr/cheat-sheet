import { hasFeature } from '@/lib/features'

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
</FeatureGate>