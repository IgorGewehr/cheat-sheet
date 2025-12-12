import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuid } from 'uuid'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.S3_BUCKET!

// Gera URL para upload direto
export async function getUploadUrl(
  userId: string,
  fileName: string,
  contentType: string
) {
  // Gera key única
  const ext = fileName.split('.').pop()
  const key = `uploads/${userId}/${uuid()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // Metadados
    Metadata: {
      'original-name': fileName,
      'uploaded-by': userId,
    },
  })

  // URL válida por 5 minutos
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })

  return { url, key }
}

// Gera URL para download
export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  return getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 hora
}

// Deleta arquivo
export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }))
}