// Find many com filtro e relações
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
])