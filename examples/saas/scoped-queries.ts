import { db } from '@/lib/db'
import { requireTenant } from './tenant-context'

// Factory que retorna queries sempre filtradas pelo tenant
export async function getScopedDb() {
  const tenant = await requireTenant()

  return {
    users: {
      findMany: async (args: any = {}) => {
        return db.user.findMany({
          ...args,
          where: { ...args.where, tenantId: tenant.id },
        })
      },

      findFirst: async (args: any) => {
        return db.user.findFirst({
          ...args,
          where: { ...args.where, tenantId: tenant.id },
        })
      },

      create: async (args: any) => {
        return db.user.create({
          ...args,
          data: { ...args.data, tenantId: tenant.id },
        })
      },

      update: async (args: any) => {
        // Garante que só atualiza do próprio tenant
        const existing = await db.user.findFirst({
          where: { id: args.where.id, tenantId: tenant.id },
        })

        if (!existing) throw new Error('Not found')

        return db.user.update(args)
      },

      delete: async (args: any) => {
        return db.user.deleteMany({
          where: { ...args.where, tenantId: tenant.id },
        })
      },
    },

    // Adicione outros models...
    products: { /* ... */ },
    orders: { /* ... */ },
  }
}

// Uso em Server Component/Action:
const scopedDb = await getScopedDb()
const users = await scopedDb.users.findMany({ where: { role: 'ADMIN' } })