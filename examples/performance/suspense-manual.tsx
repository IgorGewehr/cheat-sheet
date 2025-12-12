import { Suspense } from 'react'

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
