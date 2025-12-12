import { db } from '@/lib/db'
import { sendEmail } from './channels/email'
import { sendPush } from './channels/push'
import { sendSMS } from './channels/sms'
import { pusher } from '@/lib/pusher'

type CreateNotification = {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
  actionUrl?: string
  actionLabel?: string
}

export async function notify(input: CreateNotification) {
  // 1. Busca preferências do usuário
  const preferences = await db.notificationPreference.findUnique({
    where: { userId_type: { userId: input.userId, type: input.type } },
  })

  // Se não tem preferência, usa defaults
  const prefs = preferences || {
    email: true,
    push: true,
    sms: false,
    inApp: true,
  }

  // 2. Cria notificação no banco
  const notification = await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
    },
  })

  // 3. Envia por cada canal habilitado
  const channels: Promise<void>[] = []

  if (prefs.inApp) {
    channels.push(sendInApp(notification))
  }

  if (prefs.email) {
    channels.push(
      sendToChannel(notification.id, 'EMAIL', () =>
        sendEmail(input.userId, input.title, input.body)
      )
    )
  }

  if (prefs.push) {
    channels.push(
      sendToChannel(notification.id, 'PUSH', () =>
        sendPush(input.userId, input.title, input.body)
      )
    )
  }

  if (prefs.sms && isCritical(input.type)) {
    channels.push(
      sendToChannel(notification.id, 'SMS', () =>
        sendSMS(input.userId, input.body)
      )
    )
  }

  // Não bloqueia - envia em background
  Promise.allSettled(channels)

  return notification
}

// Envia notificação real-time via Pusher
async function sendInApp(notification: Notification) {
  await pusher.trigger(
    `user-${notification.userId}`,
    'notification',
    {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
    }
  )
}

// Wrapper para tracking de delivery
async function sendToChannel(
  notificationId: string,
  channel: Channel,
  sendFn: () => Promise<void>
) {
  const channelRecord = await db.notificationChannel.create({
    data: { notificationId, channel, status: 'PENDING' },
  })

  try {
    await sendFn()
    await db.notificationChannel.update({
      where: { id: channelRecord.id },
      data: { status: 'SENT', sentAt: new Date() },
    })
  } catch (error) {
    await db.notificationChannel.update({
      where: { id: channelRecord.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown',
      },
    })
  }
}

function isCritical(type: NotificationType) {
  return ['SECURITY_ALERT', 'PAYMENT_FAILED'].includes(type)
}
