import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function SegurancaCICD() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Segurança & CI/CD
      </h1>

      <NoteBox type="info" title="O que é CI/CD?">
        <strong>CI</strong> (Continuous Integration): Testa seu código automaticamente a cada push.
        <br />
        <strong>CD</strong> (Continuous Deployment): Faz deploy automático se os testes passarem.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        GitHub Actions Básico
      </h3>

      <CodeBlock
        fileName=".github/workflows/ci.yml"
        code={`name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm test`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Scripts no package.json
      </h3>

      <CodeBlock
        fileName="package.json"
        code={`{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Testes com Vitest
      </h3>

      <CodeBlock
        fileName="vitest.config.ts"
        code={`import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})`}
      />

      <CodeBlock
        fileName="lib/__tests__/utils.test.ts"
        code={`import { describe, it, expect } from 'vitest'
import { formatCurrency, isValidEmail } from '../utils'

describe('formatCurrency', () => {
  it('formata valor em reais', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00')
    expect(formatCurrency(99.9)).toBe('R$ 99,90')
  })

  it('lida com zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})

describe('isValidEmail', () => {
  it('aceita emails válidos', () => {
    expect(isValidEmail('teste@email.com')).toBe(true)
  })

  it('rejeita emails inválidos', () => {
    expect(isValidEmail('teste')).toBe(false)
    expect(isValidEmail('teste@')).toBe(false)
  })
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Teste de Componente
      </h3>

      <CodeBlock
        fileName="components/__tests__/Button.test.tsx"
        code={`import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renderiza com o texto correto', () => {
    render(<Button>Clique aqui</Button>)
    expect(screen.getByText('Clique aqui')).toBeInTheDocument()
  })

  it('chama onClick quando clicado', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clique</Button>)

    fireEvent.click(screen.getByText('Clique'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('fica desabilitado quando loading', () => {
    render(<Button loading>Salvando</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Teste de Server Action
      </h3>

      <CodeBlock
        fileName="app/users/__tests__/actions.test.ts"
        code={`import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Checklist de Segurança
      </h3>

      <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
        <ul className="space-y-2">
          <li>✅ Variáveis de ambiente em <code>.env.local</code> (nunca comitar)</li>
          <li>✅ Secrets no GitHub/Vercel (não no código)</li>
          <li>✅ Validar TODA entrada do usuário (Zod)</li>
          <li>✅ Sanitizar dados antes de renderizar (evita XSS)</li>
          <li>✅ CSRF token em formulários sensíveis</li>
          <li>✅ Rate limiting em APIs públicas</li>
          <li>✅ Headers de segurança (CSP, HSTS)</li>
          <li>✅ Dependabot para atualizar pacotes</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Headers de Segurança
      </h3>

      <CodeBlock
        fileName="next.config.ts"
        code={`const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Previne clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Previne MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig`}
      />
    </div>
  )
}
