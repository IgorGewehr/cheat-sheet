export const UPLOAD_LIMITS = {
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
}