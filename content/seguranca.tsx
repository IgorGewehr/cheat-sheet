import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function MiddlewareAuth() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Middleware & Proteção de Rotas
      </h1>

      <NoteBox type="warning" title="Atenção">
        O Middleware roda na <strong>Edge</strong>. Ele não tem acesso a Node.js completo
        (ex: não dá para conectar direto no Postgres). Use-o apenas para validar
        Tokens (JWT/Session) e redirecionar.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Template Completo
      </h3>

      <CodeBlockFile
        file="security/middleware-complete.ts"
        fileName="middleware.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validação de JWT no Middleware
      </h3>

      <CodeBlockFile
        file="security/middleware-jwt-validation.ts"
        fileName="middleware.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Proteção por Role (Admin, User)
      </h3>

      <CodeBlockFile
        file="security/middleware-role-protection.ts"
      />

      <NoteBox type="danger" title="Nunca confie apenas no Middleware!">
        O Middleware é a primeira linha de defesa, mas SEMPRE valide permissões
        novamente nos Server Components e Server Actions. O middleware pode ser
        bypassado em alguns casos.
      </NoteBox>
    </div>
  )
}

export function ZodServerActions() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Validação (Zod) & Server Actions
      </h1>

      <NoteBox type="success" title="Fluxo Seguro">
        Client Form → Server Action → Validação Zod → DB → RevalidatePath
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        1. Schema de Validação (Zod)
      </h3>

      <CodeBlockFile
        file="security/user-validation-schema.ts"
        fileName="lib/validations/user.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        2. Server Action
      </h3>

      <CodeBlockFile
        file="security/create-user-action.ts"
        fileName="app/users/actions.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        3. Formulário (Client)
      </h3>

      <CodeBlockFile
        file="security/new-user-form.tsx"
        fileName="app/users/new/page.tsx"
      />

      <NoteBox type="info" title="useActionState vs useFormState">
        <code>useActionState</code> é o novo nome no React 19.
        <code>useFormState</code> do 'react-dom' ainda funciona mas está deprecated.
      </NoteBox>
    </div>
  )
}

export function RBACMultitenancy() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        RBAC & Multi-tenancy
      </h1>

      <NoteBox type="info" title="Conceitos">
        <strong>RBAC</strong> (Role-Based Access Control): Permissões baseadas em papéis (admin, user, viewer).
        <br />
        <strong>Multi-tenancy</strong>: Isolamento de dados entre organizações/empresas.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura de Permissões
      </h3>

      <CodeBlockFile
        file="security/permissions.ts"
        fileName="lib/permissions.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        HOC de Proteção
      </h3>

      <CodeBlockFile
        file="security/with-permission-hoc.tsx"
        fileName="lib/auth/withPermission.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Multi-tenancy: Isolamento de Dados
      </h3>

      <CodeBlockFile
        file="security/tenant-db-wrapper.ts"
        fileName="lib/db/tenant.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Middleware com Tenant
      </h3>

      <CodeBlockFile
        file="security/middleware-with-tenant.ts"
        fileName="middleware.ts"
      />

      <NoteBox type="danger" title="Regra de Ouro">
        NUNCA confie em dados do cliente para determinar o tenant.
        Sempre derive o tenant do token/sessão do usuário autenticado.
      </NoteBox>
    </div>
  )
}
