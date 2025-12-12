import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function FileUpload() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        File Upload
      </h1>

      <NoteBox type="danger" title="Segurança em Uploads">
        <ul className="list-disc list-inside">
          <li>Valide tipo MIME no servidor (não confie no cliente)</li>
          <li>Limite tamanho por tipo de arquivo</li>
          <li>Renomeie arquivos (nunca use nome original)</li>
          <li>Escaneie por malware em uploads públicos</li>
          <li>Use URLs assinadas para arquivos privados</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Limites por Plano
      </h3>

      <CodeBlock
        fileName="lib/upload/limits.ts"
        code={`export const UPLOAD_LIMITS = {
  free: {
    maxFileSize: 5 * 1024 * 1024,      // 5MB
    maxTotalStorage: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },
  pro: {
    maxFileSize: 50 * 1024 * 1024,      // 50MB
    maxTotalStorage: 5 * 1024 * 1024 * 1024, // 5GB
    allowedTypes: ['image/*', 'application/pdf', 'video/mp4'],
  },
  enterprise: {
    maxFileSize: 500 * 1024 * 1024,     // 500MB
    maxTotalStorage: Infinity,
    allowedTypes: ['*/*'],
  },
} as const

export function checkUploadAllowed(
  plan: keyof typeof UPLOAD_LIMITS,
  fileSize: number,
  mimeType: string,
  currentStorage: number
) {
  const limits = UPLOAD_LIMITS[plan]

  if (fileSize > limits.maxFileSize) {
    return { allowed: false, error: 'Arquivo muito grande' }
  }

  if (currentStorage + fileSize > limits.maxTotalStorage) {
    return { allowed: false, error: 'Limite de armazenamento atingido' }
  }

  const typeAllowed = limits.allowedTypes.some(pattern => {
    if (pattern === '*/*') return true
    if (pattern.endsWith('/*')) {
      return mimeType.startsWith(pattern.replace('/*', '/'))
    }
    return mimeType === pattern
  })

  if (!typeAllowed) {
    return { allowed: false, error: 'Tipo de arquivo não permitido' }
  }

  return { allowed: true }
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Upload Direto para S3 (Presigned URL)
      </h3>

      <NoteBox type="info" title="Por que Presigned URLs?">
        Upload direto do browser para S3 evita que seu servidor seja gargalo.
        O arquivo nunca passa pelo seu backend.
      </NoteBox>

      <CodeBlock
        fileName="lib/upload/s3.ts"
        code={`import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
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
  const key = \`uploads/\${userId}/\${uuid()}.\${ext}\`

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
}`}
      />

      <CodeBlock
        fileName="app/api/upload/presign/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Componente de Upload
      </h3>

      <CodeBlock
        fileName="components/FileUpload.tsx"
        code={`'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

type FileUploadProps = {
  onUploadComplete: (key: string, url: string) => void
  accept?: Record<string, string[]>
  maxSize?: number
}

export function FileUpload({
  onUploadComplete,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'] },
  maxSize = 5 * 1024 * 1024,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // 1. Pega URL assinada
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!presignRes.ok) {
        const data = await presignRes.json()
        throw new Error(data.error || 'Erro ao preparar upload')
      }

      const { url, key } = await presignRes.json()

      // 2. Upload direto para S3 com progresso
      await uploadWithProgress(url, file, setProgress)

      // 3. Confirma upload no backend
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, fileName: file.name, fileSize: file.size }),
      })

      if (!confirmRes.ok) {
        throw new Error('Erro ao confirmar upload')
      }

      const { publicUrl } = await confirmRes.json()
      onUploadComplete(key, publicUrl)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      uploadFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={\`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        \${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        \${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
      \`}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: \`\${progress}%\` }}
            />
          </div>
          <p className="text-sm text-gray-600">Enviando... {progress}%</p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600">
            {isDragActive
              ? 'Solte o arquivo aqui'
              : 'Arraste um arquivo ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Máximo {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  )
}

// Helper para upload com progresso
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Confirmar Upload e Salvar Metadata
      </h3>

      <CodeBlock
        fileName="app/api/upload/confirm/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
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
  const publicUrl = \`\${process.env.CDN_URL}/\${key}\`

  return NextResponse.json({ fileId: file.id, publicUrl })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Schema de Arquivos
      </h3>

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model File {
  id          String   @id @default(cuid())
  key         String   @unique // S3 key
  name        String   // Nome original
  size        Int      // Bytes
  mimeType    String?

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Organização
  folderId    String?
  folder      Folder?  @relation(fields: [folderId], references: [id])

  // Acesso
  isPublic    Boolean  @default(false)
  sharedWith  FileShare[]

  createdAt   DateTime @default(now())
  deletedAt   DateTime? // Soft delete

  @@index([userId])
  @@index([folderId])
}

model Folder {
  id          String   @id @default(cuid())
  name        String
  parentId    String?
  parent      Folder?  @relation("FolderTree", fields: [parentId], references: [id])
  children    Folder[] @relation("FolderTree")

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  files       File[]

  createdAt   DateTime @default(now())

  @@index([userId, parentId])
}

model FileShare {
  id          String   @id @default(cuid())
  fileId      String
  file        File     @relation(fields: [fileId], references: [id])

  // Compartilhar com usuário ou link público
  sharedWithId String?
  sharedWith  User?    @relation(fields: [sharedWithId], references: [id])

  // Link público com token
  token       String?  @unique
  expiresAt   DateTime?

  permission  Permission @default(VIEW)

  createdAt   DateTime @default(now())

  @@index([fileId])
  @@index([token])
}

enum Permission {
  VIEW
  DOWNLOAD
  EDIT
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validação de Tipo Real (Magic Bytes)
      </h3>

      <NoteBox type="danger" title="Não confie em Content-Type">
        Usuários mal-intencionados podem enviar .exe renomeado para .jpg.
        Valide os magic bytes do arquivo.
      </NoteBox>

      <CodeBlock
        fileName="lib/upload/validate.ts"
        code={`import { fileTypeFromBuffer } from 'file-type'

const ALLOWED_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/webp': true,
  'application/pdf': true,
}

export async function validateFileType(buffer: Buffer): Promise<{
  valid: boolean
  mimeType?: string
  error?: string
}> {
  const type = await fileTypeFromBuffer(buffer)

  if (!type) {
    return { valid: false, error: 'Tipo de arquivo não reconhecido' }
  }

  if (!ALLOWED_TYPES[type.mime as keyof typeof ALLOWED_TYPES]) {
    return { valid: false, error: \`Tipo \${type.mime} não permitido\` }
  }

  return { valid: true, mimeType: type.mime }
}

// Validação de imagem (dimensões, etc)
import sharp from 'sharp'

export async function validateImage(buffer: Buffer): Promise<{
  valid: boolean
  width?: number
  height?: number
  error?: string
}> {
  try {
    const metadata = await sharp(buffer).metadata()

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Imagem inválida' }
    }

    // Limite de dimensões
    if (metadata.width > 4096 || metadata.height > 4096) {
      return { valid: false, error: 'Imagem muito grande (max 4096px)' }
    }

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
    }
  } catch {
    return { valid: false, error: 'Erro ao processar imagem' }
  }
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Processamento de Imagens
      </h3>

      <CodeBlock
        fileName="lib/upload/process-image.ts"
        code={`import sharp from 'sharp'
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
      /\\.([^.]+)$/,
      \`-\${variant.suffix}.webp\`
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
// await queue.add('process-image', { key, buffer: buffer.toString('base64') })`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Deletar Arquivos
      </h3>

      <CodeBlock
        fileName="app/api/files/[id]/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
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
}`}
      />
    </div>
  )
}
