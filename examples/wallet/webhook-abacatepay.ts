import { NextResponse } from 'next/server'
import { addBalance } from '@/lib/wallet/operations'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-abacatepay-signature')

  // 1. Verifica assinatura
  const expectedSig = crypto
    .createHmac('sha256', process.env.ABACATEPAY_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const event = JSON.parse(body)

  // 2. Evita processar o mesmo evento duas vezes
  const existing = await db.transaction.findFirst({
    where: { externalId: event.id },
  })

  if (existing) {
    return NextResponse.json({ message: 'Já processado' })
  }

  // 3. Processa o pagamento
  if (event.type === 'payment.confirmed') {
    const userId = event.metadata.userId
    const amountCents = event.amount // já em centavos

    await addBalance(
      userId,
      amountCents,
      'PAYMENT',
      `Pagamento #${event.id}`,
      event.id
    )
  }

  return NextResponse.json({ received: true })
}