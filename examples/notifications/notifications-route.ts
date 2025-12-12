import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = 20

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  })

  const hasMore = notifications.length > limit
  if (hasMore) notifications.pop()

  return NextResponse.json({
    notifications,
    nextCursor: hasMore ? notifications[notifications.length - 1].id : null,
  })
}
