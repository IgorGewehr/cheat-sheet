model Tenant {
  id                   String   @id @default(cuid())
  name                 String
  slug                 String   @unique

  // Stripe
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?
  stripePriceId        String?

  // Plano
  plan                 Plan     @default(FREE)
  subscriptionStatus   String?  // active, past_due, canceled
  trialEndsAt          DateTime?
  currentPeriodEnd     DateTime?

  // Limites do plano
  maxUsers             Int      @default(3)
  maxProjects          Int      @default(5)

  users                User[]
  createdAt            DateTime @default(now())
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}