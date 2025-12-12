import { Resend } from 'resend'
import { render } from '@react-email/render'
import { OrderShippedEmail } from '@/emails/OrderShipped'
import { SecurityAlertEmail } from '@/emails/SecurityAlert'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_TEMPLATES: Record<NotificationType, React.ComponentType<any>> = {
  ORDER_SHIPPED: OrderShippedEmail,
  SECURITY_ALERT: SecurityAlertEmail,
  // ... outros templates
}

export async function sendEmail(
  userId: string,
  title: string,
  body: string,
  type?: NotificationType,
  data?: Record<string, any>
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })

  if (!user?.email) return

  // Usa template específico se existir
  let html: string

  if (type && EMAIL_TEMPLATES[type]) {
    const Template = EMAIL_TEMPLATES[type]
    html = render(<Template userName={user.name} {...data} />)
  } else {
    // Template genérico
    html = render(<GenericEmail title={title} body={body} />)
  }

  await resend.emails.send({
    from: 'Meu SaaS <noreply@meusaas.com>',
    to: user.email,
    subject: title,
    html,
  })
}
