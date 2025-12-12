import { getCurrentTenant } from '@/lib/db/tenant-context'
import { db } from '@/lib/db'

export async function checkLimit(resource: 'users' | 'projects') {
  const tenant = await getCurrentTenant()
  if (!tenant) throw new Error('No tenant')

  const limits = {
    users: tenant.maxUsers,
    projects: tenant.maxProjects,
  }

  const counts = {
    users: await db.user.count({ where: { tenantId: tenant.id } }),
    projects: await db.project.count({ where: { tenantId: tenant.id } }),
  }

  const current = counts[resource]
  const max = limits[resource]

  return {
    allowed: current < max,
    current,
    max,
    remaining: max - current,
  }
}

// Em Server Actions:
export async function createUser(data: CreateUserInput) {
  const limit = await checkLimit('users')

  if (!limit.allowed) {
    return {
      success: false,
      error: `Limite de ${limit.max} usuários atingido. Faça upgrade do plano.`,
    }
  }

  // ... criar usuário
}