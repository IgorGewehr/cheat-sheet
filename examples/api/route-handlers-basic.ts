import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/users
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const users = await db.user.findMany({
    where: { tenantId: user.tenantId },
    skip: (page - 1) * limit,
    take: limit,
  })

  return NextResponse.json({ users, page, limit })
}

// POST /api/users
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  const body = await request.json()

  // Validacao com Zod
  const validated = createUserSchema.safeParse(body)
  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const newUser = await db.user.create({
    data: {
      ...validated.data,
      tenantId: user.tenantId,
    },
  })

  return NextResponse.json(newUser, { status: 201 })
}
