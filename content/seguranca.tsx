import CodeBlock from '@/components/CodeBlock'
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

      <CodeBlock
        fileName="middleware.ts"
        code={`import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 1. Rotas que NÃO precisam de login
const publicRoutes = ['/login', '/register', '/']
const publicPatterns = ['/api/webhooks'] // Prefixos públicos

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  return publicPatterns.some(pattern => pathname.startsWith(pattern))
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value
  const { pathname } = request.nextUrl

  // Ignora arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/_') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // CASO 1: Tenta acessar rota privada sem token
  if (!token && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // CASO 2: Tenta acessar login já estando logado
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // CASO 3: Adiciona headers úteis
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  return response
}

// Onde o middleware vai rodar
export const config = {
  matcher: [
    // Todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validação de JWT no Middleware
      </h3>

      <CodeBlock
        fileName="middleware.ts"
        code={`import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)

  if (!payload) {
    // Token inválido/expirado - limpa cookie e redireciona
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('token')
    return response
  }

  // Passa dados do usuário para as páginas via header
  const response = NextResponse.next()
  response.headers.set('x-user-id', payload.sub as string)
  response.headers.set('x-user-role', payload.role as string)

  return response
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Proteção por Role (Admin, User)
      </h3>

      <CodeBlock
        code={`const adminRoutes = ['/admin', '/dashboard/settings']

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  const payload = await verifyToken(token)

  // Verifica se a rota requer admin
  const requiresAdmin = adminRoutes.some(r => pathname.startsWith(r))

  if (requiresAdmin && payload?.role !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}`}
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

      <CodeBlock
        fileName="lib/validations/user.ts"
        code={`import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase(), // Normaliza

  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),

  role: z.enum(['user', 'admin']).default('user'),

  tenantId: z.string().uuid('Tenant inválido'),
})

// Tipo inferido do schema
export type CreateUserInput = z.infer<typeof createUserSchema>

// Schema para update (todos campos opcionais)
export const updateUserSchema = createUserSchema.partial().omit({
  tenantId: true // Não pode mudar tenant
})`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        2. Server Action
      </h3>

      <CodeBlock
        fileName="app/users/actions.ts"
        code={`'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createUserSchema } from '@/lib/validations/user'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Tipo do retorno padronizado
export type ActionState = {
  success: boolean
  errors?: Record<string, string[]>
  message?: string
} | null

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Autenticação
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, message: 'Não autenticado' }
  }

  // 2. Autorização
  if (currentUser.role !== 'admin') {
    return { success: false, message: 'Sem permissão' }
  }

  // 3. Validação
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    tenantId: currentUser.tenantId,
  }

  const validated = createUserSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // 4. Persistência
  try {
    await db.user.create({
      data: {
        ...validated.data,
        password: await hashPassword(validated.data.password),
      },
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        success: false,
        errors: { email: ['Email já cadastrado'] },
      }
    }
    return { success: false, message: 'Erro ao criar usuário' }
  }

  // 5. Revalidação e Redirect
  revalidatePath('/users')
  redirect('/users')
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        3. Formulário (Client)
      </h3>

      <CodeBlock
        fileName="app/users/new/page.tsx"
        code={`'use client'

import { useActionState } from 'react'
import { createUser } from '../actions'

export default function NewUserPage() {
  const [state, action, isPending] = useActionState(createUser, null)

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name">Nome</label>
        <input
          id="name"
          name="name"
          required
          className={state?.errors?.name ? 'border-red-500' : ''}
        />
        {state?.errors?.name && (
          <p className="text-red-500 text-sm">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
        />
        {state?.errors?.email && (
          <p className="text-red-500 text-sm">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          required
        />
        {state?.errors?.password && (
          <p className="text-red-500 text-sm">{state.errors.password[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select id="role" name="role">
          <option value="user">Usuário</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {state?.message && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? 'Criando...' : 'Criar Usuário'}
      </button>
    </form>
  )
}`}
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

      <CodeBlock
        fileName="lib/permissions.ts"
        code={`// Definição de permissões
export const PERMISSIONS = {
  users: {
    create: 'users:create',
    read: 'users:read',
    update: 'users:update',
    delete: 'users:delete',
  },
  billing: {
    read: 'billing:read',
    manage: 'billing:manage',
  },
  settings: {
    read: 'settings:read',
    manage: 'settings:manage',
  },
} as const

// Roles e suas permissões
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    ...Object.values(PERMISSIONS.users),
    ...Object.values(PERMISSIONS.billing),
    ...Object.values(PERMISSIONS.settings),
  ],
  admin: [
    ...Object.values(PERMISSIONS.users),
    PERMISSIONS.billing.read,
    ...Object.values(PERMISSIONS.settings),
  ],
  member: [
    PERMISSIONS.users.read,
    PERMISSIONS.settings.read,
  ],
  viewer: [
    PERMISSIONS.users.read,
  ],
}

// Função de checagem
export function hasPermission(
  userRole: string,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        HOC de Proteção
      </h3>

      <CodeBlock
        fileName="lib/auth/withPermission.tsx"
        code={`import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) {
  return async function ProtectedComponent(props: P) {
    const user = await getCurrentUser()

    if (!user) {
      redirect('/login')
    }

    if (!hasPermission(user.role, requiredPermission)) {
      redirect('/unauthorized')
    }

    return <WrappedComponent {...props} />
  }
}

// Uso:
// export default withPermission(UserSettings, PERMISSIONS.settings.manage)`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Multi-tenancy: Isolamento de Dados
      </h3>

      <CodeBlock
        fileName="lib/db/tenant.ts"
        code={`import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Wrapper que sempre filtra por tenant
export async function getTenantDb() {
  const user = await getCurrentUser()

  if (!user?.tenantId) {
    throw new Error('Tenant não encontrado')
  }

  return {
    // Todas as queries são filtradas pelo tenant
    user: {
      findMany: (args = {}) =>
        db.user.findMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      findUnique: (args) =>
        db.user.findFirst({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      create: (args) =>
        db.user.create({
          ...args,
          data: { ...args.data, tenantId: user.tenantId },
        }),

      update: (args) =>
        db.user.updateMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),

      delete: (args) =>
        db.user.deleteMany({
          ...args,
          where: { ...args.where, tenantId: user.tenantId },
        }),
    },
    // ... outros models
  }
}

// Uso em Server Actions/Components:
const tenantDb = await getTenantDb()
const users = await tenantDb.user.findMany() // Já filtrado!`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Middleware com Tenant
      </h3>

      <CodeBlock
        fileName="middleware.ts"
        code={`export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Extrai tenant da URL: /app/[tenantSlug]/...
  const tenantSlug = request.nextUrl.pathname.split('/')[2]

  if (tenantSlug) {
    // Verifica se usuário tem acesso ao tenant
    const hasAccess = payload.tenants?.includes(tenantSlug)

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/select-tenant', request.url))
    }

    // Passa tenant atual para as pages
    const response = NextResponse.next()
    response.headers.set('x-tenant-slug', tenantSlug)
    return response
  }

  return NextResponse.next()
}`}
      />

      <NoteBox type="danger" title="Regra de Ouro">
        NUNCA confie em dados do cliente para determinar o tenant.
        Sempre derive o tenant do token/sessão do usuário autenticado.
      </NoteBox>
    </div>
  )
}
