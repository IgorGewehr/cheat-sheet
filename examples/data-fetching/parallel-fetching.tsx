async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`)
  return res.json()
}

async function getOrders(userId: string) {
  const res = await fetch(`/api/orders?userId=${userId}`)
  return res.json()
}

async function getAnalytics(userId: string) {
  const res = await fetch(`/api/analytics?userId=${userId}`)
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
}