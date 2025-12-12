import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:suporte@meusaas.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPush(userId: string, title: string, body: string) {
  // Busca subscriptions do usuário (pode ter múltiplos devices)
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  })

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: '/' },
  })

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
    )
  )

  // Remove subscriptions inválidas
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      await db.pushSubscription.delete({
        where: { id: subscriptions[i].id },
      })
    }
  }
}
