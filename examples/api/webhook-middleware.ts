// Webhooks devem ser publicos (sem auth)
const publicPatterns = [
  '/api/webhooks/stripe',
  '/api/webhooks/github',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pula autenticacao para webhooks
  if (publicPatterns.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ... resto do middleware
}
