import { NextResponse } from 'next/server'
import { registry } from '@/lib/metrics'

export async function GET(request: Request) {
  // Protege endpoint de métricas
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const metrics = await registry.metrics()

  return new NextResponse(metrics, {
    headers: { 'Content-Type': registry.contentType },
  })
}