export async function middleware(request: NextRequest) {
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
}
