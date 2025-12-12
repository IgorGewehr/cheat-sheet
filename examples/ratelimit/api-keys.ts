import { randomBytes, createHash } from 'crypto'
import { db } from './db'

// Gera API Key no formato: prefix_randomstring
export async function generateApiKey(userId: string, name: string, scopes: string[]) {
  const prefix = 'sk_live'
  const random = randomBytes(24).toString('base64url')
  const fullKey = `${prefix}_${random}`

  // Salva hash da key (nunca a key em si)
  const keyHash = createHash('sha256').update(fullKey).digest('hex')

  await db.apiKey.create({
    data: {
      name,
      key: keyHash,
      keyPrefix: fullKey.slice(0, 12), // Para identificação
      scopes,
      userId,
    },
  })

  // Retorna a key completa APENAS UMA VEZ
  return fullKey
}

// Valida API Key
export async function validateApiKey(key: string) {
  const keyHash = createHash('sha256').update(key).digest('hex')

  const apiKey = await db.apiKey.findUnique({
    where: { key: keyHash },
    include: { user: true },
  })

  if (!apiKey) return null

  // Verifica expiração
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  // Atualiza último uso
  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  return apiKey
}

// Verifica scope
export function hasScope(apiKey: { scopes: string[] }, requiredScope: string) {
  // Wildcard check: "write:*" permite "write:users"
  return apiKey.scopes.some(scope => {
    if (scope === '*') return true
    if (scope.endsWith(':*')) {
      const prefix = scope.slice(0, -1)
      return requiredScope.startsWith(prefix)
    }
    return scope === requiredScope
  })
}