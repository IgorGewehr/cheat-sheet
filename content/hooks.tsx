import CodeBlockFile from '@/components/CodeBlockFile'
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

          <CodeBlockFile file="hooks/useState.ts" />
        </div>

        {/* useEffect */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-accent mb-4">⚡ useEffect</h3>
          <p className="text-text-secondary mb-4">Sincronização com sistemas externos (APIs, DOM, timers).</p>

          <CodeBlockFile file="hooks/useEffect.ts" />

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

          <CodeBlockFile file="hooks/useRef.ts" />
        </div>

        {/* useMemo / useCallback */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-danger mb-4">🚫 useMemo / useCallback</h3>
          <p className="text-text-secondary mb-4">
            Memoização. <strong>Use apenas quando necessário!</strong>
          </p>

          <CodeBlockFile file="hooks/useMemo-useCallback.ts" />

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

          <CodeBlockFile file="hooks/useTransition.tsx" />
        </div>

        {/* useActionState */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-success mb-4">📝 useActionState (React 19)</h3>
          <p className="text-text-secondary mb-4">Para Server Actions com estado de formulário.</p>

          <CodeBlockFile file="hooks/useActionState.tsx" />
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

          <CodeBlockFile file="hooks/url-state-server.tsx" fileName="app/products/page.tsx" />

          <CodeBlockFile file="hooks/url-state-client.tsx" fileName="components/Filters.tsx" />
        </div>

        {/* Server State */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-success text-lg mb-2">🌐 Server State (Cache do Next.js)</h4>
          <p className="text-text-secondary mb-4">
            Dados do banco/API. NÃO use useState para isso!
          </p>

          <CodeBlockFile file="hooks/server-state.ts" />

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

          <CodeBlockFile file="hooks/zustand-cart-store.ts" fileName="stores/cart.ts" />

          <CodeBlockFile file="hooks/zustand-cart-button.tsx" fileName="components/CartButton.tsx" />
        </div>

        {/* Client Local */}
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h4 className="font-bold text-warning text-lg mb-2">📍 Client Local (useState)</h4>
          <p className="text-text-secondary mb-4">
            Inputs, accordions, dropdowns. Estado que morre com o componente.
          </p>

          <CodeBlockFile file="hooks/useState-local.tsx" />
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
