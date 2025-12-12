import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFile } from '@/lib/upload/s3'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const file = await db.file.findUnique({
    where: { id: params.id },
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verifica ownership
  if (file.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete (mantém 30 dias para recovery)
  await db.file.update({
    where: { id: file.id },
    data: { deletedAt: new Date() },
  })

  // Atualiza storage
  await db.user.update({
    where: { id: session.user.id },
    data: { storageUsed: { decrement: file.size } },
  })

  // Agenda deleção real do S3 (cron job)
  // await queue.add('delete-file', { key: file.key }, { delay: 30 * 24 * 60 * 60 * 1000 })

  return NextResponse.json({ success: true })
}