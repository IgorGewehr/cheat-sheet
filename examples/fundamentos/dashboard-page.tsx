// Server Component (padrão)
import { getUserData } from '@/lib/db'
import InteractiveChart from './InteractiveChart' // Client

export default async function DashboardPage() {
  // Pode acessar DB diretamente - é server!
  const data = await getUserData()

  return (
    <div>
      {/* Parte estática - zero JS */}
      <h1>{data.name}</h1>
      <p>Último acesso: {data.lastLogin}</p>

      {/* Island de interatividade - só esse componente vai pro browser */}
      <InteractiveChart data={data.metrics} />
    </div>
  )
}