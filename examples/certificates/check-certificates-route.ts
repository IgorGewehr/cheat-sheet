import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function GET() {
  // Certificados que vencem em 30 dias
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiring = await db.certificate.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: thirtyDaysFromNow },
    },
    include: { tenant: { include: { users: true } } },
  })

  for (const cert of expiring) {
    // Envia email para os admins do tenant
    const admins = cert.tenant.users.filter(u => u.role === 'OWNER')

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `Certificado ${cert.name} expira em breve`,
        body: `Seu certificado expira em ${cert.expiresAt.toLocaleDateString()}`,
      })
    }
  }

  return Response.json({ checked: expiring.length })
}