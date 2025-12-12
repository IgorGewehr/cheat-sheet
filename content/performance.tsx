import CodeBlockFile from '@/components/CodeBlockFile'
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

      <CodeBlockFile file="performance/next-image-optimized.tsx" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        next/font Setup
      </h3>

      <CodeBlockFile file="performance/next-font-layout.tsx" fileName="app/layout.tsx" />

      <CodeBlockFile file="performance/tailwind-config-fonts.ts" fileName="tailwind.config.ts" />
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

      <CodeBlockFile file="performance/loading-tsx.tsx" fileName="app/dashboard/loading.tsx" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Suspense Manual (Granular)
      </h3>

      <CodeBlockFile file="performance/suspense-manual.tsx" fileName="app/dashboard/page.tsx" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Parallel Routes para Loading Independente
      </h3>

      <CodeBlockFile file="performance/parallel-routes-structure.txt" />

      <CodeBlockFile file="performance/parallel-routes-layout.tsx" fileName="app/dashboard/layout.tsx" />

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

      <CodeBlockFile file="performance/dynamic-imports.tsx" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Imports Específicos (Tree Shaking)
      </h3>

      <CodeBlockFile file="performance/tree-shaking.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Bundle Analyzer
      </h3>

      <CodeBlockFile file="performance/bundle-analyzer.sh" />

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
