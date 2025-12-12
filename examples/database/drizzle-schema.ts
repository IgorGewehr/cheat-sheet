import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'OWNER'])
export const planEnum = pgEnum('plan', ['FREE', 'PRO', 'ENTERPRISE'])

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  plan: planEnum('plan').default('FREE'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  name: text('name'),
  role: roleEnum('role').default('USER'),
  tenantId: text('tenant_id').references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Relações
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}))

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}))