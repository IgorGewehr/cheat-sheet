import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function HooksCheatSheet() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        React Hooks Cheat Sheet
      </h1>

      <NoteBox type="info" title="Regras dos Hooks">
        1. Só chame hooks no top level (nunca dentro de if/loops).
        2. Só chame hooks em componentes React ou custom hooks.
      </NoteBox>

      <div className="space-y-8">
        {/* useState */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-accent mb-4">📦 useState</h3>
          <p className="text-text-secondary mb-4">Estado local do componente.</p>

          <CodeBlock
            code={`const [count, setCount] = useState(0)
const [user, setUser] = useState<User | null>(null)

// Atualização baseada no valor anterior
setCount(prev => prev + 1)

// Lazy initialization (só executa uma vez)
const [data, setData] = useState(() => expensiveComputation())`}
          />
        </div>

        {/* useEffect */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-accent mb-4">⚡ useEffect</h3>
          <p className="text-text-secondary mb-4">Sincronização com sistemas externos (APIs, DOM, timers).</p>

          <CodeBlock
            code={`// Executa em toda renderização
useEffect(() => {
  console.log('rendered')
})

// Executa apenas na montagem
useEffect(() => {
  console.log('mounted')
}, [])

// Executa quando 'id' muda + cleanup
useEffect(() => {
  const controller = new AbortController()

  fetch(\`/api/user/\${id}\`, { signal: controller.signal })
    .then(res => res.json())
    .then(setUser)

  return () => controller.abort() // Cleanup!
}, [id])`}
          />

          <NoteBox type="warning" title="Quando NÃO usar useEffect">
            <ul className="list-disc list-inside space-y-1">
              <li>Para transformar dados → use variáveis derivadas ou useMemo</li>
              <li>Para responder a eventos → use event handlers</li>
              <li>Para buscar dados → prefira Server Components ou React Query</li>
            </ul>
          </NoteBox>
        </div>

        {/* useRef */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-accent mb-4">📌 useRef</h3>
          <p className="text-text-secondary mb-4">Referência mutável que persiste entre renders (não causa re-render).</p>

          <CodeBlock
            code={`// Referência ao DOM
const inputRef = useRef<HTMLInputElement>(null)
inputRef.current?.focus()

// Valor mutável que persiste
const renderCount = useRef(0)
renderCount.current++ // Não causa re-render!

// Guardar valor anterior
const prevValue = useRef(value)
useEffect(() => {
  prevValue.current = value
}, [value])`}
          />
        </div>

        {/* useMemo / useCallback */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-danger mb-4">🚫 useMemo / useCallback</h3>
          <p className="text-text-secondary mb-4">
            Memoização. <strong>Use apenas quando necessário!</strong>
          </p>

          <CodeBlock
            code={`// useMemo - memoriza VALOR
const expensiveValue = useMemo(
  () => computeExpensive(data),
  [data]
)

// useCallback - memoriza FUNÇÃO
const handleClick = useCallback(
  () => doSomething(id),
  [id]
)`}
          />

          <NoteBox type="danger" title="Quando usar?">
            <ul className="list-disc list-inside space-y-1">
              <li>Cálculos genuinamente pesados (filtrar 10k+ itens)</li>
              <li>Passar callbacks para componentes memoizados (React.memo)</li>
              <li>Dependências de outros hooks</li>
            </ul>
            <p className="mt-2 font-bold">NÃO use "por precaução" - adiciona overhead!</p>
          </NoteBox>
        </div>

        {/* useTransition */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-purple mb-4">🔄 useTransition (React 18+)</h3>
          <p className="text-text-secondary mb-4">Marca updates como não-urgentes, mantendo UI responsiva.</p>

          <CodeBlock
            code={`const [isPending, startTransition] = useTransition()

function handleSearch(query: string) {
  // Update urgente - input responsivo
  setQuery(query)

  // Update não-urgente - pode "atrasar"
  startTransition(() => {
    setFilteredResults(heavyFilter(data, query))
  })
}

return (
  <>
    <input value={query} onChange={e => handleSearch(e.target.value)} />
    {isPending ? <Spinner /> : <Results data={filteredResults} />}
  </>
)`}
          />
        </div>

        {/* useActionState */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-success mb-4">📝 useActionState (React 19)</h3>
          <p className="text-text-secondary mb-4">Para Server Actions com estado de formulário.</p>

          <CodeBlock
            code={`'use client'
import { useActionState } from 'react'
import { createUser } from './actions'

export function Form() {
  const [state, action, isPending] = useActionState(createUser, null)

  return (
    <form action={action}>
      <input name="email" />
      {state?.errors?.email && <p>{state.errors.email}</p>}

      <button disabled={isPending}>
        {isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  )
}`}
          />
        </div>
      </div>
    </div>
  )
}

export function StateManagement() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Gerenciamento de Estado
      </h1>

      <NoteBox type="info" title="Princípio">
        Escolha o tipo de estado baseado em ONDE ele precisa existir e QUEM precisa acessar.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tipos de Estado
      </h3>

      <div className="space-y-6">
        {/* URL State */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-accent text-lg mb-2">🔗 URL State (searchParams)</h4>
          <p className="text-text-secondary mb-4">
            Filtros, paginação, modais, tabs. Compartilhável via URL.
          </p>

          <CodeBlock
            fileName="app/products/page.tsx"
            code={`// Server Component - lê direto dos params
export default function ProductsPage({
  searchParams
}: {
  searchParams: { page?: string; filter?: string }
}) {
  const page = Number(searchParams.page) || 1
  const filter = searchParams.filter || 'all'

  return <ProductList page={page} filter={filter} />
}`}
          />

          <CodeBlock
            fileName="components/Filters.tsx"
            code={`'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function Filters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setFilter(filter: string) {
    const params = new URLSearchParams(searchParams)
    params.set('filter', filter)
    params.set('page', '1') // Reset page
    router.push(\`?\${params.toString()}\`)
  }

  return (
    <select
      value={searchParams.get('filter') || 'all'}
      onChange={(e) => setFilter(e.target.value)}
    >
      <option value="all">Todos</option>
      <option value="active">Ativos</option>
    </select>
  )
}`}
          />
        </div>

        {/* Server State */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-success text-lg mb-2">🌐 Server State (Cache do Next.js)</h4>
          <p className="text-text-secondary mb-4">
            Dados do banco/API. NÃO use useState para isso!
          </p>

          <CodeBlock
            code={`// O próprio fetch já é cacheado no Next.js
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: {
      revalidate: 60, // Revalida a cada 60s
      tags: ['products'] // Tag para revalidação manual
    }
  })
  return res.json()
}

// Para invalidar o cache:
import { revalidateTag } from 'next/cache'
revalidateTag('products')`}
          />

          <NoteBox type="success">
            Para casos complexos de server state no client (mutations, optimistic updates),
            use <strong>TanStack Query</strong> ou <strong>SWR</strong>.
          </NoteBox>
        </div>

        {/* Client Global */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-purple text-lg mb-2">🌍 Client Global (Zustand)</h4>
          <p className="text-text-secondary mb-4">
            Carrinho, player, notificações. Estado que persiste entre páginas.
          </p>

          <CodeBlock
            fileName="stores/cart.ts"
            code={`import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  total: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      total: () => get().items.reduce((sum, i) => sum + i.price, 0)
    }),
    { name: 'cart-storage' } // Persiste no localStorage
  )
)`}
          />

          <CodeBlock
            fileName="components/CartButton.tsx"
            code={`'use client'
import { useCart } from '@/stores/cart'

export function CartButton() {
  const itemCount = useCart(state => state.items.length)
  return <button>Carrinho ({itemCount})</button>
}`}
          />
        </div>

        {/* Client Local */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-warning text-lg mb-2">📍 Client Local (useState)</h4>
          <p className="text-text-secondary mb-4">
            Inputs, accordions, dropdowns. Estado que morre com o componente.
          </p>

          <CodeBlock
            code={`'use client'
import { useState } from 'react'

function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {title} {isOpen ? '▼' : '▶'}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}`}
          />
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Árvore de Decisão
      </h3>

      <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700 font-mono text-sm">
        <pre className="text-text-secondary">
{`O estado precisa ser compartilhável via URL?
├── SIM → URL State (searchParams)
└── NÃO
    ├── Vem de API/DB?
    │   ├── SIM → Server State (fetch cache / TanStack Query)
    │   └── NÃO
    │       ├── Precisa persistir entre páginas?
    │       │   ├── SIM → Zustand com persist
    │       │   └── NÃO
    │       │       ├── Vários componentes precisam?
    │       │       │   ├── SIM → Zustand (sem persist)
    │       │       │   └── NÃO → useState local`}
        </pre>
      </div>
    </div>
  )
}
