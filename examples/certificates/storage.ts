import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

const BUCKET = process.env.CERTIFICATES_BUCKET!

// A senha do certificado é criptografada antes de salvar
import { encrypt, decrypt } from '@/lib/crypto'

export async function uploadCertificate(
  tenantId: string,
  certificateFile: Buffer,
  password: string
) {
  const key = `certificates/${tenantId}/${Date.now()}.pfx`

  // 1. Upload do arquivo .pfx para S3 (já criptografado pelo S3)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: certificateFile,
    ServerSideEncryption: 'aws:kms', // Criptografia extra
  }))

  // 2. Criptografa a senha antes de salvar no banco
  const encryptedPassword = await encrypt(password)

  return { storageKey: key, encryptedPassword }
}

export async function getCertificate(storageKey: string) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  }))

  const buffer = await response.Body?.transformToByteArray()
  return Buffer.from(buffer!)
}