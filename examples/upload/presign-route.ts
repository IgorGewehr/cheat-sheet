import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUploadUrl } from '@/lib/upload/s3'
import { checkUploadAllowed, UPLOAD_LIMITS } from '@/lib/upload/limits'
import { z } from 'zod'

const schema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string(),
  fileSize: z.number().positive(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { fileName, contentType, fileSize } = parsed.data

  // Verifica limites do plano
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, storageUsed: true },
  })

  const check = checkUploadAllowed(
    user!.plan,
    fileSize,
    contentType,
    user!.storageUsed
  )

  if (!check.allowed) {
    return NextResponse.json({ error: check.error }, { status: 403 })
  }

  // Gera URL assinada
  const { url, key } = await getUploadUrl(
    session.user.id,
    fileName,
    contentType
  )

  return NextResponse.json({ url, key })
}