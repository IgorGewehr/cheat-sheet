import CodeBlockFile from '@/components/CodeBlockFile'
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

      <CodeBlockFile
        file="data-fetching/basic-fetch.tsx"
        fileName="app/products/page.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Parallel Fetching (Mais Rápido)
      </h3>

      <CodeBlockFile
        file="data-fetching/parallel-fetching.tsx"
        fileName="app/dashboard/page.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Sequential Fetching (Quando Necessário)
      </h3>

      <CodeBlockFile
        file="data-fetching/sequential-fetching.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Fetch com Banco de Dados (Prisma/Drizzle)
      </h3>

      <CodeBlockFile
        file="data-fetching/database-fetch.tsx"
        fileName="app/users/page.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Deduplicação Automática
      </h3>

      <CodeBlockFile
        file="data-fetching/auto-deduplication.tsx"
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

      <CodeBlockFile
        file="data-fetching/cache-options.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Invalidação Manual
      </h3>

      <CodeBlockFile
        file="data-fetching/manual-revalidation.ts"
        fileName="app/products/actions.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        unstable_cache para Funções
      </h3>

      <CodeBlockFile
        file="data-fetching/unstable-cache.ts"
        fileName="lib/data.ts"
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

      <CodeBlockFile
        file="data-fetching/error-boundary.tsx"
        fileName="app/dashboard/error.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        not-found.tsx - 404
      </h3>

      <CodeBlockFile
        file="data-fetching/not-found-page.tsx"
        fileName="app/products/[id]/not-found.tsx"
      />

      <CodeBlockFile
        file="data-fetching/not-found-usage.tsx"
        fileName="app/products/[id]/page.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        global-error.tsx - Erro no Root Layout
      </h3>

      <CodeBlockFile
        file="data-fetching/global-error.tsx"
        fileName="app/global-error.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Try/Catch em Server Actions
      </h3>

      <CodeBlockFile
        file="data-fetching/server-action-error-handling.ts"
        fileName="app/actions.ts"
      />

      <NoteBox type="warning" title="Nunca exponha detalhes internos">
        Em produção, nunca retorne <code>error.message</code> diretamente.
        Pode conter informações sensíveis (queries SQL, paths, etc).
      </NoteBox>
    </div>
  )
}
