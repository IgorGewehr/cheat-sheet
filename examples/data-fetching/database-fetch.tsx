import { db } from '@/lib/db'

// Direto no componente - sem API route intermediária!
export default async function UsersPage() {
  const users = await db.user.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return <UserTable users={users} />
}

// Função separada para reutilização
async function getActiveUsers(tenantId: string) {
  return db.user.findMany({
    where: {
      tenantId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })
}