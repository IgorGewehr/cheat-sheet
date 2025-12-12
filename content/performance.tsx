import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function PerformanceChecklist() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Performance Checklist
      </h1>

      <div className="space-y-6">
        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-success mb-4">Imagens</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Usar <code className="bg-code-bg px-1 rounded">next/image</code> em vez de <code className="bg-code-bg px-1 rounded">&lt;img&gt;</code></span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Definir <code className="bg-code-bg px-1 rounded">width</code> e <code className="bg-code-bg px-1 rounded">height</code> (evita layout shift)</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Usar <code className="bg-code-bg px-1 rounded">sizes</code> para imagens responsivas</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Lazy loading automático (abaixo do fold)</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span><code className="bg-code-bg px-1 rounded">priority</code> para imagens LCP (above the fold)</span>
            </li>
          </ul>
        </div>

        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-success mb-4">Fontes</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Usar <code className="bg-code-bg px-1 rounded">next/font</code> (self-hosted, zero layout shift)</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Subsetting de caracteres se possível</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span><code className="bg-code-bg px-1 rounded">display: swap</code> (já é padrão no next/font)</span>
            </li>
          </ul>
        </div>

        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-success mb-4">Components</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Server Components para conteúdo estático</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Client Components apenas quando necessário</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span><code className="bg-code-bg px-1 rounded">Suspense</code> para carregamento progressivo</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span><code className="bg-code-bg px-1 rounded">loading.tsx</code> para rotas</span>
            </li>
          </ul>
        </div>

        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-success mb-4">Data Fetching</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Parallel fetching com <code className="bg-code-bg px-1 rounded">Promise.all()</code></span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Cache apropriado para cada tipo de dado</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Revalidação estratégica (não muito frequente)</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Select apenas campos necessários do DB</span>
            </li>
          </ul>
        </div>

        <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-success mb-4">Bundle</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Dynamic imports para componentes pesados</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Analisar bundle com <code className="bg-code-bg px-1 rounded">@next/bundle-analyzer</code></span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Evitar bibliotecas grandes desnecessárias</span>
            </li>
            <li className="flex items-center gap-2">
              <input type="checkbox" className="accent-success" readOnly checked />
              <span>Tree shaking (imports específicos)</span>
            </li>
          </ul>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        next/image Otimizado
      </h3>

      <CodeBlock
        code={`import Image from 'next/image'

// Imagem responsiva com sizes correto
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Acima do fold - carrega imediatamente
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Imagem de avatar (tamanho fixo)
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>

// Imagem que preenche o container
<div className="relative h-64">
  <Image
    src="/bg.jpg"
    alt="Background"
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        next/font Setup
      </h3>

      <CodeBlock
        fileName="app/layout.tsx"
        code={`import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={\`\${inter.variable} \${jetbrainsMono.variable}\`}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}`}
      />

      <CodeBlock
        fileName="tailwind.config.ts"
        code={`module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-mono)'],
      },
    },
  },
}`}
      />
    </div>
  )
}

export function StreamingSuspense() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Streaming & Suspense
      </h1>

      <NoteBox type="info" title="Conceito">
        Streaming permite enviar partes da UI progressivamente. O usuário vê o
        conteúdo mais rápido enquanto partes lentas ainda carregam.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        loading.tsx (Automático)
      </h3>

      <CodeBlock
        fileName="app/dashboard/loading.tsx"
        code={`export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Suspense Manual (Granular)
      </h3>

      <CodeBlock
        fileName="app/dashboard/page.tsx"
        code={`import { Suspense } from 'react'

// Componentes async que fazem fetch
async function RevenueChart() {
  const data = await getRevenueData() // Lento - 2s
  return <Chart data={data} />
}

async function RecentOrders() {
  const orders = await getRecentOrders() // Médio - 500ms
  return <OrderList orders={orders} />
}

async function QuickStats() {
  const stats = await getStats() // Rápido - 100ms
  return <StatsCards stats={stats} />
}

// Page com streaming
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Stats carrega primeiro (mais rápido) */}
      <Suspense fallback={<StatsLoading />}>
        <QuickStats />
      </Suspense>

      {/* Orders carrega depois */}
      <Suspense fallback={<OrdersLoading />}>
        <RecentOrders />
      </Suspense>

      {/* Chart carrega por último (mais lento) */}
      <Suspense fallback={<ChartLoading />}>
        <RevenueChart />
      </Suspense>
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Parallel Routes para Loading Independente
      </h3>

      <CodeBlock
        code={`// Estrutura de pastas
app/
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── @stats/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── @orders/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   └── @chart/
│       ├── page.tsx
│       └── loading.tsx`}
      />

      <CodeBlock
        fileName="app/dashboard/layout.tsx"
        code={`export default function Layout({
  children,
  stats,
  orders,
  chart,
}: {
  children: React.ReactNode
  stats: React.ReactNode
  orders: React.ReactNode
  chart: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {children}
      <div className="grid grid-cols-3 gap-4">
        {stats}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {orders}
        {chart}
      </div>
    </div>
  )
}`}
      />

      <NoteBox type="success" title="Benefícios do Streaming">
        <ul className="list-disc list-inside space-y-1">
          <li>Time to First Byte (TTFB) muito menor</li>
          <li>Largest Contentful Paint (LCP) melhorado</li>
          <li>Usuário percebe a página como mais rápida</li>
          <li>Partes lentas não bloqueiam partes rápidas</li>
        </ul>
      </NoteBox>
    </div>
  )
}

export function BundleOptimization() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Bundle Optimization
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Dynamic Imports
      </h3>

      <CodeBlock
        code={`import dynamic from 'next/dynamic'

// Componente pesado carregado sob demanda
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Se não precisa de SSR
})

// Múltiplos componentes do mesmo módulo
const { Modal, Dialog } = dynamic(() => import('./ui'), {
  loading: () => <Spinner />,
})

// Carrega apenas quando visível (intersection observer)
const LazySection = dynamic(() => import('./LazySection'), {
  loading: () => <SectionSkeleton />,
})

export default function Page() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      {/* Chart só carrega quando a página renderiza */}
      <HeavyChart data={data} />

      {/* Modal só carrega quando abre */}
      {showModal && <Modal onClose={() => setShowModal(false)} />}
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Imports Específicos (Tree Shaking)
      </h3>

      <CodeBlock
        code={`// ❌ RUIM: Importa a biblioteca inteira
import _ from 'lodash'
_.debounce(fn, 300)

// ✅ BOM: Importa apenas a função
import debounce from 'lodash/debounce'
debounce(fn, 300)

// ❌ RUIM: Importa todos os ícones
import * as Icons from 'lucide-react'
<Icons.Search />

// ✅ BOM: Importa apenas o ícone usado
import { Search } from 'lucide-react'
<Search />

// ❌ RUIM: date-fns inteiro
import { format } from 'date-fns'

// ✅ BOM: apenas a função
import format from 'date-fns/format'`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Bundle Analyzer
      </h3>

      <CodeBlock
        code={`# Instalar
npm install @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // suas configs
})

# Executar análise
ANALYZE=true npm run build`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Alternativas Leves
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Pesada</th>
            <th>Alternativa Leve</th>
            <th>Economia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>moment.js (300KB)</td>
            <td>date-fns (tree-shakeable)</td>
            <td>~280KB</td>
          </tr>
          <tr>
            <td>lodash (70KB)</td>
            <td>lodash-es ou funções nativas</td>
            <td>~60KB</td>
          </tr>
          <tr>
            <td>axios (13KB)</td>
            <td>fetch nativo</td>
            <td>13KB</td>
          </tr>
          <tr>
            <td>uuid (4KB)</td>
            <td>crypto.randomUUID()</td>
            <td>4KB</td>
          </tr>
          <tr>
            <td>classnames (1KB)</td>
            <td>clsx (500B)</td>
            <td>500B</td>
          </tr>
        </tbody>
      </table>

      <NoteBox type="warning" title="Regra de Ouro">
        Antes de instalar uma dependência, pergunte:
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Posso fazer isso com código nativo?</li>
          <li>Existe uma alternativa mais leve?</li>
          <li>Vou usar mais de 20% das features?</li>
        </ol>
      </NoteBox>
    </div>
  )
}
