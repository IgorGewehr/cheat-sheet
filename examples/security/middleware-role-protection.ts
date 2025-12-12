const adminRoutes = ['/admin', '/dashboard/settings']

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
}
