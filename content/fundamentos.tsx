import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function ServerVsClient() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Server vs Client Components
      </h1>

      <NoteBox type="info" title="Mentalidade de Arquiteto">
        O padrão do Next.js é Server Component. Só mude para Client quando for inevitável.
        Isso reduz drasticamente o JavaScript enviado ao navegador.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tabela de Decisão
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Objetivo</th>
            <th>Componente</th>
            <th>Motivo Arquitetural</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Buscar dados (DB, API Privada)</td>
            <td><span className="tag tag-server">Server</span></td>
            <td>Segurança (secrets não vazam) e Performance (back-to-back connection).</td>
          </tr>
          <tr>
            <td>Interatividade (Click, Hover, Form)</td>
            <td><span className="tag tag-client">Client</span></td>
            <td>Event listeners precisam do DOM do navegador.</td>
          </tr>
          <tr>
            <td>Usar Hooks (useState, useEffect)</td>
            <td><span className="tag tag-client">Client</span></td>
            <td>Hooks dependem do ciclo de vida do React no browser.</td>
          </tr>
          <tr>
            <td>SEO (Metadata Dinâmico)</td>
            <td><span className="tag tag-server">Server</span></td>
            <td>Gerado antes do crawler do Google ler a página.</td>
          </tr>
          <tr>
            <td>Acessar Cookies/Headers</td>
            <td><span className="tag tag-server">Server</span></td>
            <td>Use <code className="bg-code-bg px-1 rounded">cookies()</code> e <code className="bg-code-bg px-1 rounded">headers()</code> do next/headers.</td>
          </tr>
          <tr>
            <td>Context Providers</td>
            <td><span className="tag tag-client">Client</span></td>
            <td>Providers precisam de state reativo no cliente.</td>
          </tr>
          <tr>
            <td>Renderizar HTML estático</td>
            <td><span className="tag tag-server">Server</span></td>
            <td>Zero JS para o browser, máxima performance.</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Padrão: Server Component com Island de Interatividade
      </h3>

      <CodeBlock
        fileName="app/dashboard/page.tsx"
        code={`// Server Component (padrão)
import { getUserData } from '@/lib/db'
import InteractiveChart from './InteractiveChart' // Client

export default async function DashboardPage() {
  // Pode acessar DB diretamente - é server!
  const data = await getUserData()

  return (
    <div>
      {/* Parte estática - zero JS */}
      <h1>{data.name}</h1>
      <p>Último acesso: {data.lastLogin}</p>

      {/* Island de interatividade - só esse componente vai pro browser */}
      <InteractiveChart data={data.metrics} />
    </div>
  )
}`}
      />

      <CodeBlock
        fileName="app/dashboard/InteractiveChart.tsx"
        code={`'use client' // Marca como Client Component

import { useState } from 'react'

export default function InteractiveChart({ data }) {
  const [filter, setFilter] = useState('all')

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">Todos</option>
        <option value="week">Última Semana</option>
      </select>
      {/* Chart interativo aqui */}
    </div>
  )
}`}
      />

      <NoteBox type="warning" title="Erro Comum">
        Não coloque 'use client' no layout ou página principal. Isso força todos os
        componentes filhos a serem Client Components também, perdendo os benefícios do SSR.
      </NoteBox>
    </div>
  )
}

export function EstruturaPastas() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Estrutura de Pastas (Domain Driven)
      </h1>

      <NoteBox type="info" title="Princípio">
        Mantenha coisas relacionadas próximas. Evite pastas gigantes de "components".
        Coloque componentes, actions e hooks junto da feature que os usa.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura Recomendada para SaaS
      </h3>

      <CodeBlock
        code={`app/
├── (auth)/                   # Route Group - Rotas de Autenticação
│   ├── login/
│   │   ├── page.tsx
│   │   └── LoginForm.tsx     # Componente específico
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx            # Layout sem sidebar
│
├── (app)/                    # Route Group - App Principal
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx       # Skeleton loading
│   │   └── DashboardCards.tsx
│   │
│   ├── [tenantId]/           # Multi-tenancy via URL
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts    # Server Actions da feature
│   │   └── users/
│   │       ├── page.tsx
│   │       ├── [userId]/
│   │       │   └── page.tsx
│   │       └── components/
│   │           ├── UserTable.tsx
│   │           └── UserFilters.tsx
│   └── layout.tsx            # Layout com sidebar
│
├── api/                      # Route Handlers (quando necessário)
│   └── webhooks/
│       └── stripe/
│           └── route.ts
│
lib/                          # Código compartilhado global
├── db.ts                     # Conexão Prisma/Drizzle
├── auth.ts                   # Configuração Auth
├── utils.ts                  # Funções utilitárias
└── validations/              # Schemas Zod compartilhados
    ├── user.ts
    └── tenant.ts

components/                   # Componentes UI reutilizáveis
├── ui/                       # Primitivos (Button, Input, Modal)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
└── shared/                   # Compostos (DataTable, Charts)
    ├── DataTable.tsx
    └── Pagination.tsx

middleware.ts                 # Proteção de rotas`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Route Groups: ( ) vs [ ]
      </h3>

      <div className="card-grid">
        <div className="bg-bg-secondary p-5 rounded-lg border border-slate-700">
          <h4 className="font-bold text-accent mb-2">(parenteses) - Route Group</h4>
          <p className="text-sm text-text-secondary mb-3">
            Organiza arquivos SEM afetar a URL.
          </p>
          <code className="text-xs bg-code-bg p-2 rounded block">
            (auth)/login/page.tsx → /login
          </code>
        </div>

        <div className="bg-bg-secondary p-5 rounded-lg border border-slate-700">
          <h4 className="font-bold text-accent mb-2">[colchetes] - Rota Dinâmica</h4>
          <p className="text-sm text-text-secondary mb-3">
            Captura parâmetros da URL.
          </p>
          <code className="text-xs bg-code-bg p-2 rounded block">
            [tenantId]/users → /acme/users
          </code>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Arquivos Especiais do Next.js
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Arquivo</th>
            <th>Propósito</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>page.tsx</code></td>
            <td>UI única para uma rota</td>
          </tr>
          <tr>
            <td><code>layout.tsx</code></td>
            <td>UI compartilhada entre rotas filhas (não re-renderiza)</td>
          </tr>
          <tr>
            <td><code>loading.tsx</code></td>
            <td>Loading state automático (Suspense boundary)</td>
          </tr>
          <tr>
            <td><code>error.tsx</code></td>
            <td>Error boundary para a rota</td>
          </tr>
          <tr>
            <td><code>not-found.tsx</code></td>
            <td>UI para quando notFound() é chamado</td>
          </tr>
          <tr>
            <td><code>route.ts</code></td>
            <td>API endpoint (GET, POST, etc)</td>
          </tr>
        </tbody>
      </table>

      <NoteBox type="success" title="Dica Pro">
        Use <code>@/</code> para imports absolutos. Configure no tsconfig.json:
        <code className="block mt-2 bg-code-bg p-2 rounded text-sm">
          "paths": {`{ "@/*": ["./*"] }`}
        </code>
      </NoteBox>
    </div>
  )
}
