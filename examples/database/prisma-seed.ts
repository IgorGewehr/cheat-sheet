import { PrismaClient } from '@prisma/client'
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
    email: `user${i + 1}@demo.com`,
    name: `User ${i + 1}`,
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
  })