import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Protege o endpoint (só Vercel pode chamar)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca todos os imóveis com calendário configurado
  const properties = await db.property.findMany({
    where: { icalUrl: { not: null } },
    select: { id: true, icalUrl: true, tenantId: true },
  })

  const results = []

  for (const property of properties) {
    try {
      // Busca e processa o iCal
      const newBookings = await syncPropertyCalendar(property)
      results.push({ propertyId: property.id, synced: newBookings.length })
    } catch (error) {
      results.push({ propertyId: property.id, error: error.message })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}