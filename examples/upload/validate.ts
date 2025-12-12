import { fileTypeFromBuffer } from 'file-type'

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
    return { valid: false, error: `Tipo ${type.mime} não permitido` }
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
}