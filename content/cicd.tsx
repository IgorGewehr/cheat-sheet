import CodeBlockFile from '@/components/CodeBlockFile'
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

      <CodeBlockFile
        file="cicd/ci.yml"
        fileName=".github/workflows/ci.yml"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Scripts no package.json
      </h3>

      <CodeBlockFile
        file="cicd/package.json"
        fileName="package.json"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Testes com Vitest
      </h3>

      <CodeBlockFile
        file="cicd/vitest.config.ts"
        fileName="vitest.config.ts"
      />

      <CodeBlockFile
        file="cicd/utils.test.ts"
        fileName="lib/__tests__/utils.test.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Teste de Componente
      </h3>

      <CodeBlockFile
        file="cicd/Button.test.tsx"
        fileName="components/__tests__/Button.test.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Teste de Server Action
      </h3>

      <CodeBlockFile
        file="cicd/actions.test.ts"
        fileName="app/users/__tests__/actions.test.ts"
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

      <CodeBlockFile
        file="cicd/next.config.ts"
        fileName="next.config.ts"
      />
    </div>
  )
}
