const plans = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    features: ['3 usuários', '5 projetos', 'Suporte por email'],
  },
  {
    name: 'Pro',
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['10 usuários', '50 projetos', 'Suporte prioritário', 'API access'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: ['Usuários ilimitados', 'Projetos ilimitados', 'Suporte 24/7', 'SLA 99.9%'],
  },
]

export default async function PricingPage() {
  const tenant = await getCurrentTenant()

  return (
    <div className="grid grid-cols-3 gap-8">
      {plans.map((plan) => (
        <PricingCard
          key={plan.name}
          plan={plan}
          currentPlan={tenant?.plan}
        />
      ))}
    </div>
  )
}