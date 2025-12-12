import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Wrapper que sempre filtra por tenant
export async function getTenantDb() {
  const user = await getCurrentUser()

  if (!user?.tenantId) {
    throw new Error('Tenant não encontrado')
  }

  return {
    // Todas as queries são filtradas pelo tenant
    user: {
      findMany: (args = {}) =>
        db.user.findMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      findUnique: (args) =>
        db.user.findFirst({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      create: (args) =>
        db.user.create({
          ...args,
          data: { ...args.data, tenantId: user.tenantId },
        }),

      update: (args) =>
        db.user.updateMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      delete: (args) =>
        db.user.deleteMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),
    },
    // ... outros models
  }
}

// Uso em Server Actions/Components:
const tenantDb = await getTenantDb()
const users = await tenantDb.user.findMany() // Já filtrado!
