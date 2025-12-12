export default function Layout({
  children,
  stats,
  orders,
  chart,
}: {
  children: React.ReactNode
  stats: React.ReactNode
  orders: React.ReactNode
  chart: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {children}
      <div className="grid grid-cols-3 gap-4">
        {stats}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {orders}
        {chart}
      </div>
    </div>
  )
}
