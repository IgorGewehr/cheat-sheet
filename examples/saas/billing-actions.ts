'use server'

import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { requireTenant, requireUser } from '@/lib/auth'

export async function createCheckoutSession(priceId: string) {
  const tenant = await requireTenant()
  const user = await requireUser()

  // Cria customer se não existir
  let customerId = tenant.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { tenantId: tenant.id },
    })

    await db.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id },
    })

    customerId = customer.id
  }

  // Cria sessão de checkout
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/billing?canceled=true`,
    metadata: { tenantId: tenant.id },
  })

  redirect(session.url!)
}

export async function createPortalSession() {
  const tenant = await requireTenant()

  if (!tenant.stripeCustomerId) {
    throw new Error('No Stripe customer')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/billing`,
  })

  redirect(session.url)
}