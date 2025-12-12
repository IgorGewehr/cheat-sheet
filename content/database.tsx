import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function PrismaDrizzle() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Prisma vs Drizzle
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Comparação
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Aspecto</th>
            <th>Prisma</th>
            <th>Drizzle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Filosofia</td>
            <td>Schema-first, abstrai SQL</td>
            <td>SQL-first, "TypeScript ORM"</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Boa (query engine separada)</td>
            <td>Excelente (queries diretas)</td>
          </tr>
          <tr>
            <td>Bundle Size</td>
            <td>~2MB+ (engine binária)</td>
            <td>~50KB</td>
          </tr>
          <tr>
            <td>Edge Runtime</td>
            <td>Precisa de adapter (Neon, etc)</td>
            <td>Funciona nativamente</td>
          </tr>
          <tr>
            <td>Curva de Aprendizado</td>
            <td>Mais fácil</td>
            <td>Precisa conhecer SQL</td>
          </tr>
          <tr>
            <td>Migrations</td>
            <td>prisma migrate</td>
            <td>drizzle-kit</td>
          </tr>
        </tbody>
      </table>

      <NoteBox type="info" title="Recomendação">
        <strong>Prisma</strong>: Projetos maiores, equipes com menos experiência SQL, muitas relações complexas.
        <br />
        <strong>Drizzle</strong>: Performance crítica, Edge Functions, bundle size importa, SQL experts.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Setup Prisma
      </h3>

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
}

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  plan      Plan     @default(FREE)
  users     User[]
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
  OWNER
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}`}
      />

      <CodeBlock
        fileName="lib/db.ts"
        code={`import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Setup Drizzle
      </h3>

      <CodeBlock
        fileName="lib/db/schema.ts"
        code={`import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
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
}))`}
      />

      <CodeBlock
        fileName="lib/db/index.ts"
        code={`import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Para queries
const client = postgres(connectionString)
export const db = drizzle(client, { schema })

// Uso:
// const users = await db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId))`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Queries Comuns - Prisma
      </h3>

      <CodeBlock
        code={`// Find many com filtro e relações
const users = await db.user.findMany({
  where: {
    tenantId,
    role: 'ADMIN',
  },
  include: {
    tenant: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
})

// Find unique
const user = await db.user.findUnique({
  where: { email },
})

// Create
const newUser = await db.user.create({
  data: {
    email,
    name,
    tenantId,
  },
})

// Update
await db.user.update({
  where: { id },
  data: { name: 'Novo Nome' },
})

// Transaction
await db.$transaction([
  db.user.create({ data: userData }),
  db.auditLog.create({ data: logData }),
])`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Queries Comuns - Drizzle
      </h3>

      <CodeBlock
        code={`import { eq, and, desc } from 'drizzle-orm'
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
})`}
      />
    </div>
  )
}

export function MigrationsSeeds() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Migrations & Seeds
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Workflow Prisma
      </h3>

      <CodeBlock
        code={`# 1. Criar migration a partir do schema
npx prisma migrate dev --name add_user_role

# 2. Aplicar migrations em produção
npx prisma migrate deploy

# 3. Resetar DB (development)
npx prisma migrate reset

# 4. Gerar client após mudanças
npx prisma generate

# 5. Visualizar DB
npx prisma studio`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Workflow Drizzle
      </h3>

      <CodeBlock
        fileName="drizzle.config.ts"
        code={`import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config`}
      />

      <CodeBlock
        code={`# 1. Gerar migration
npx drizzle-kit generate:pg

# 2. Aplicar migrations
npx drizzle-kit push:pg

# 3. Visualizar DB
npx drizzle-kit studio`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Seed Script
      </h3>

      <CodeBlock
        fileName="prisma/seed.ts"
        code={`import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Criar tenant padrão
  const tenant = await db.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      plan: 'PRO',
    },
  })

  // Criar usuário admin
  const adminPassword = await hash('admin123', 12)
  await db.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'OWNER',
      tenantId: tenant.id,
    },
  })

  // Criar usuários de teste
  const users = Array.from({ length: 10 }, (_, i) => ({
    email: \`user\${i + 1}@demo.com\`,
    name: \`User \${i + 1}\`,
    role: 'USER' as const,
    tenantId: tenant.id,
  }))

  await db.user.createMany({
    data: users,
    skipDuplicates: true,
  })

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })`}
      />

      <CodeBlock
        fileName="package.json"
        code={`{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}`}
      />

      <NoteBox type="success" title="Executar Seed">
        <code>npx prisma db seed</code> - executa o seed script
        <br />
        <code>npx prisma migrate reset</code> - reset + seed automático
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Scripts npm Recomendados
      </h3>

      <CodeBlock
        fileName="package.json"
        code={`{
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  }
}`}
      />

      <NoteBox type="warning" title="Ambiente de Produção">
        <ul className="list-disc list-inside space-y-1">
          <li>Nunca use <code>migrate dev</code> ou <code>db push</code> em produção</li>
          <li>Sempre use <code>migrate deploy</code> em CI/CD</li>
          <li>Faça backup antes de migrations destrutivas</li>
          <li>Teste migrations em staging primeiro</li>
        </ul>
      </NoteBox>
    </div>
  )
}
