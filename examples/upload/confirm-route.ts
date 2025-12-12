import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  key: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { key, fileName, fileSize } = schema.parse(body)

  // Salva referência no banco
  const file = await db.file.create({
    data: {
      key,
      name: fileName,
      size: fileSize,
      userId: session.user.id,
    },
  })

  // Atualiza storage usado
  await db.user.update({
    where: { id: session.user.id },
    data: { storageUsed: { increment: fileSize } },
  })

  // URL pública (se for bucket público) ou CDN
  const publicUrl = `${process.env.CDN_URL}/${key}`

  return NextResponse.json({ fileId: file.id, publicUrl })
}