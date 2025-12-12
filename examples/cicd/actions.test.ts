import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUser } from '../actions'

// Mock do banco
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

// Mock de autenticação
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna erro se não autenticado', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const formData = new FormData()
    const result = await createUser(null, formData)

    expect(result?.success).toBe(false)
    expect(result?.message).toBe('Não autenticado')
  })

  it('retorna erro se não for admin', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: '1',
      role: 'user', // Não é admin
      tenantId: 't1',
    })

    const formData = new FormData()
    const result = await createUser(null, formData)

    expect(result?.success).toBe(false)
    expect(result?.message).toBe('Sem permissão')
  })
})