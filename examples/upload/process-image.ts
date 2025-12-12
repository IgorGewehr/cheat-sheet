import sharp from 'sharp'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

type ImageVariant = {
  suffix: string
  width: number
  height?: number
  quality: number
}

const VARIANTS: ImageVariant[] = [
  { suffix: 'thumb', width: 150, height: 150, quality: 80 },
  { suffix: 'small', width: 400, quality: 85 },
  { suffix: 'medium', width: 800, quality: 85 },
  { suffix: 'large', width: 1200, quality: 90 },
]

export async function processAndUploadImage(
  originalKey: string,
  buffer: Buffer
) {
  const variants: Record<string, string> = {}

  for (const variant of VARIANTS) {
    const processed = await sharp(buffer)
      .resize(variant.width, variant.height, {
        fit: variant.height ? 'cover' : 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: variant.quality })
      .toBuffer()

    const variantKey = originalKey.replace(
      /\.([^.]+)$/,
      `-${variant.suffix}.webp`
    )

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: variantKey,
      Body: processed,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
    }))

    variants[variant.suffix] = variantKey
  }

  return variants
}

// Uso com queue para processamento assíncrono
// await queue.add('process-image', { key, buffer: buffer.toString('base64') })