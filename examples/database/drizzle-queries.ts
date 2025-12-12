import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'

// Find many com filtro
const adminUsers = await db
  .select()
  .from(users)
  .where(and(
    eq(users.tenantId, tenantId),
    eq(users.role, 'ADMIN')
  ))
  .orderBy(desc(users.createdAt))
  .limit(20)

// Com relação (join)
const usersWithTenant = await db
  .select()
  .from(users)
  .leftJoin(tenants, eq(users.tenantId, tenants.id))
  .where(eq(users.tenantId, tenantId))

// Insert
const [newUser] = await db
  .insert(users)
  .values({ email, name, tenantId })
  .returning()

// Update
await db
  .update(users)
  .set({ name: 'Novo Nome' })
  .where(eq(users.id, id))

// Transaction
await db.transaction(async (tx) => {
  await tx.insert(users).values(userData)
  await tx.insert(auditLogs).values(logData)
})