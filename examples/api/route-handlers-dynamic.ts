import { NextRequest, NextResponse } from 'next/server'

type Params = { params: { id: string } }

// GET /api/users/123
export async function GET(request: NextRequest, { params }: Params) {
  const user = await db.user.findUnique({
    where: { id: params.id }
  })

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}

// PATCH /api/users/123
export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json()

  const updated = await db.user.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(updated)
}

// DELETE /api/users/123
export async function DELETE(request: NextRequest, { params }: Params) {
  await db.user.delete({
    where: { id: params.id }
  })

  return new NextResponse(null, { status: 204 })
}
