import { hasFeature } from '@/lib/features'

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
}