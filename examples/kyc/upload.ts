import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.KYC_BUCKET!

export async function uploadDocument(
  userId: string,
  file: File,
  type: 'front' | 'back' | 'selfie'
) {
  const buffer = Buffer.from(await file.arrayBuffer())

  // 1. Redimensiona e converte para JPEG (remove metadados)
  const processed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer()

  // 2. Gera key única
  const key = `kyc/${userId}/${type}-${Date.now()}.jpg`

  // 3. Upload com criptografia
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: processed,
    ContentType: 'image/jpeg',
    ServerSideEncryption: 'aws:kms',
    // Bloqueia acesso público
    ACL: 'private',
  }))

  return key
}

// Gera URL temporária para visualização (só admin)
export async function getDocumentUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  // URL válida por 5 minutos
  return getSignedUrl(s3, command, { expiresIn: 300 })
}