import { jwtVerify } from 'jose'

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
}
