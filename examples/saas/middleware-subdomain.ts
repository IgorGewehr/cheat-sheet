export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]

  // Ignora domínios principais
  if (['www', 'app', 'api'].includes(subdomain)) {
    return NextResponse.next()
  }

  // Subdomínio = slug do tenant
  // acme.seuapp.com → tenant: acme
  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', subdomain)

  return response
}

// No Server Component:
import { headers } from 'next/headers'

async function getTenantFromSubdomain() {
  const tenantSlug = headers().get('x-tenant-slug')

  if (!tenantSlug) return null

  return db.tenant.findUnique({
    where: { slug: tenantSlug },
  })
}