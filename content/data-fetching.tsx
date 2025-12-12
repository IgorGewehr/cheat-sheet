import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function FetchingPatterns() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Data Fetching Patterns
      </h1>

      <NoteBox type="info" title="Princípio">
        No App Router, busque dados onde você precisa deles. O Next.js deduplica
        automaticamente requests idênticos.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Fetch Básico em Server Component
      </h3>

      <CodeBlock
        fileName="app/products/page.tsx"
        code={`// Este componente é async - pode usar await diretamente!
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products')
    .then(res => res.json())

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Parallel Fetching (Mais Rápido)
      </h3>

      <CodeBlock
        fileName="app/dashboard/page.tsx"
        code={`async function getUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`)
  return res.json()
}

async function getOrders(userId: string) {
  const res = await fetch(\`/api/orders?userId=\${userId}\`)
  return res.json()
}

async function getAnalytics(userId: string) {
  const res = await fetch(\`/api/analytics?userId=\${userId}\`)
  return res.json()
}

export default async function DashboardPage({ params }) {
  // ❌ RUIM: Sequencial (waterfall)
  // const user = await getUser(params.id)
  // const orders = await getOrders(params.id)
  // const analytics = await getAnalytics(params.id)

  // ✅ BOM: Paralelo
  const [user, orders, analytics] = await Promise.all([
    getUser(params.id),
    getOrders(params.id),
    getAnalytics(params.id),
  ])

  return (
    <div>
      <h1>{user.name}</h1>
      <OrderList orders={orders} />
      <AnalyticsChart data={analytics} />
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Sequential Fetching (Quando Necessário)
      </h3>

      <CodeBlock
        code={`// Quando um fetch depende do resultado do outro
export default async function UserPostsPage({ params }) {
  // Primeiro: busca o usuário
  const user = await getUser(params.id)

  // Depois: busca posts usando dados do usuário
  const posts = await getPostsByAuthor(user.authorId)

  return <PostList posts={posts} />
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Fetch com Banco de Dados (Prisma/Drizzle)
      </h3>

      <CodeBlock
        fileName="app/users/page.tsx"
        code={`import { db } from '@/lib/db'

// Direto no componente - sem API route intermediária!
export default async function UsersPage() {
  const users = await db.user.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return <UserTable users={users} />
}

// Função separada para reutilização
async function getActiveUsers(tenantId: string) {
  return db.user.findMany({
    where: {
      tenantId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Deduplicação Automática
      </h3>

      <CodeBlock
        code={`// O Next.js deduplica automaticamente requests GET idênticos
// durante uma única renderização

// Componente A
async function Header() {
  const user = await fetch('/api/user') // Request 1
  return <div>{user.name}</div>
}

// Componente B
async function Sidebar() {
  const user = await fetch('/api/user') // Reutiliza Request 1!
  return <div>{user.avatar}</div>
}

// Apenas 1 request é feito na prática`}
      />

      <NoteBox type="warning" title="Deduplicação só funciona com">
        <ul className="list-disc list-inside">
          <li>Método GET</li>
          <li>Mesma URL exata</li>
          <li>Mesmo request durante a mesma renderização</li>
        </ul>
      </NoteBox>
    </div>
  )
}

export function CachingRevalidation() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Caching & Revalidation
      </h1>

      <NoteBox type="info" title="Next.js 15">
        No Next.js 15, fetch NÃO é cacheado por padrão. Você precisa
        optar explicitamente pelo cache.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Opções de Cache
      </h3>

      <CodeBlock
        code={`// 1. Sem cache (padrão no Next.js 15)
const data = await fetch('https://api.example.com/data')

// 2. Com cache (opt-in)
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// 3. Revalidação por tempo (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 } // Revalida a cada 60 segundos
})

// 4. Com tags para invalidação manual
const data = await fetch('https://api.example.com/products', {
  next: {
    tags: ['products'],
    revalidate: 3600 // 1 hora
  }
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Invalidação Manual
      </h3>

      <CodeBlock
        fileName="app/products/actions.ts"
        code={`'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createProduct(formData: FormData) {
  // ... criar produto no DB

  // Opção 1: Revalida uma página específica
  revalidatePath('/products')

  // Opção 2: Revalida todas as páginas que usam a tag
  revalidateTag('products')

  // Opção 3: Revalida layout (e todas as páginas filhas)
  revalidatePath('/dashboard', 'layout')
}

export async function updateProduct(id: string, formData: FormData) {
  // ... atualizar produto

  // Revalida página específica do produto
  revalidatePath(\`/products/\${id}\`)

  // E a listagem
  revalidateTag('products')
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        unstable_cache para Funções
      </h3>

      <CodeBlock
        fileName="lib/data.ts"
        code={`import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

// Cache de queries do banco
export const getProducts = unstable_cache(
  async (tenantId: string) => {
    return db.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
  },
  ['products'], // Key do cache
  {
    tags: ['products'],
    revalidate: 60, // 1 minuto
  }
)

// Com parâmetros dinâmicos na key
export const getProduct = unstable_cache(
  async (id: string) => {
    return db.product.findUnique({ where: { id } })
  },
  ['product'], // Base key
  {
    tags: ['products'],
    revalidate: 300,
  }
)

// Uso:
const products = await getProducts(tenantId)
const product = await getProduct(productId)`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estratégias de Cache
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Tipo de Dado</th>
            <th>Estratégia</th>
            <th>Configuração</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dados públicos (blog posts)</td>
            <td>Cache longo + tags</td>
            <td><code>revalidate: 3600, tags: ['posts']</code></td>
          </tr>
          <tr>
            <td>Dashboard do usuário</td>
            <td>Cache curto ou sem cache</td>
            <td><code>revalidate: 60</code> ou <code>no-store</code></td>
          </tr>
          <tr>
            <td>Dados em tempo real</td>
            <td>Sem cache</td>
            <td><code>cache: 'no-store'</code></td>
          </tr>
          <tr>
            <td>Listagens com filtros</td>
            <td>Cache por parâmetro</td>
            <td>Tags dinâmicas: <code>['products', filter]</code></td>
          </tr>
        </tbody>
      </table>

      <NoteBox type="success" title="Dica">
        Use <code>revalidateTag</code> em vez de <code>revalidatePath</code> quando possível.
        Tags são mais granulares e eficientes.
      </NoteBox>
    </div>
  )
}

export function ErrorHandling() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Error Handling
      </h1>

      <NoteBox type="info" title="Arquivos Especiais">
        O Next.js usa arquivos especiais para tratar diferentes tipos de erros
        automaticamente.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        error.tsx - Error Boundary
      </h3>

      <CodeBlock
        fileName="app/dashboard/error.tsx"
        code={`'use client' // Error components devem ser Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log para serviço de monitoramento (Sentry, etc)
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold text-red-500 mb-4">
        Algo deu errado!
      </h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'Erro inesperado'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tentar novamente
      </button>
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        not-found.tsx - 404
      </h3>

      <CodeBlock
        fileName="app/products/[id]/not-found.tsx"
        code={`import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
      <p className="text-gray-600 mb-4">
        O produto que você procura não existe ou foi removido.
      </p>
      <Link
        href="/products"
        className="text-blue-500 hover:underline"
      >
        Ver todos os produtos
      </Link>
    </div>
  )
}`}
      />

      <CodeBlock
        fileName="app/products/[id]/page.tsx"
        code={`import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({
    where: { id: params.id }
  })

  // Dispara o not-found.tsx
  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        global-error.tsx - Erro no Root Layout
      </h3>

      <CodeBlock
        fileName="app/global-error.tsx"
        code={`'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // Precisa incluir html e body pois substitui o root layout
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Erro crítico!
          </h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Recarregar aplicação
          </button>
        </div>
      </body>
    </html>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Try/Catch em Server Actions
      </h3>

      <CodeBlock
        fileName="app/actions.ts"
        code={`'use server'

export async function createItem(formData: FormData) {
  try {
    const data = validateInput(formData)
    await db.item.create({ data })

    revalidatePath('/items')
    return { success: true }

  } catch (error) {
    // Erro de validação
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      }
    }

    // Erro de constraint do banco
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'Item já existe',
      }
    }

    // Erro genérico - log e mensagem amigável
    console.error('createItem error:', error)
    return {
      success: false,
      message: 'Erro ao criar item. Tente novamente.',
    }
  }
}`}
      />

      <NoteBox type="warning" title="Nunca exponha detalhes internos">
        Em produção, nunca retorne <code>error.message</code> diretamente.
        Pode conter informações sensíveis (queries SQL, paths, etc).
      </NoteBox>
    </div>
  )
}
