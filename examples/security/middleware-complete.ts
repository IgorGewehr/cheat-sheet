import { NextResponse } from 'next/server'
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
}
