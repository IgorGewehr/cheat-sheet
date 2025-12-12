import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// Cache por request - evita múltiplas chamadas
export const getCurrentTenant = cache(async () => {
  const token = cookies().get('token')?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload?.tenantId) return null

  const tenant = await db.tenant.findUnique({
    where: { id: payload.tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      plan: true,
    },
  })

  return tenant
})

// Helper para garantir tenant em Server Actions
export async function requireTenant() {
  const tenant = await getCurrentTenant()

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  return tenant
}