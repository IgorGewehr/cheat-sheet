import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  // 1. Verificar assinatura
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Processar evento
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    // Retorna 200 mesmo com erro para evitar retry infinito
    // Log o erro para investigacao
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = subscription.status
  const priceId = subscription.items.data[0]?.price.id

  // Mapeia price ID para plano
  const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? 'PRO' : 'FREE'

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan,
      subscriptionStatus: status,
      subscriptionId: subscription.id,
    },
  })
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: {
      plan: 'FREE',
      subscriptionStatus: 'canceled',
      subscriptionId: null,
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Notificar usuario sobre falha no pagamento
  // await sendEmail(...)

  await db.tenant.update({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: 'past_due' },
  })
}
