import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function SistemaNotificacoes() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Sistema de Notificações
      </h1>

      <NoteBox type="info" title="Canais de Notificação">
        <ul className="list-disc list-inside">
          <li><strong>In-App</strong> - Sino no header, lista de notificações</li>
          <li><strong>Push</strong> - Browser/Mobile push notifications</li>
          <li><strong>Email</strong> - Transacionais e digest</li>
          <li><strong>SMS</strong> - Alertas críticos (2FA, fraude)</li>
          <li><strong>Webhook</strong> - Para integrações B2B</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Schema de Notificações
      </h3>

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model Notification {
  id          String   @id @default(cuid())

  // Destinatário
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Conteúdo
  type        NotificationType
  title       String
  body        String
  data        Json?    // Dados extras (orderId, etc)

  // Link de ação
  actionUrl   String?
  actionLabel String?

  // Status
  readAt      DateTime?
  archivedAt  DateTime?

  // Canais enviados
  channels    NotificationChannel[]

  createdAt   DateTime @default(now())

  @@index([userId, readAt])
  @@index([userId, createdAt])
}

model NotificationChannel {
  id             String       @id @default(cuid())
  notificationId String
  notification   Notification @relation(fields: [notificationId], references: [id])

  channel        Channel      // EMAIL, PUSH, SMS
  status         DeliveryStatus @default(PENDING)
  sentAt         DateTime?
  failedAt       DateTime?
  failureReason  String?

  @@index([notificationId])
}

model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  // Preferências por tipo
  type        NotificationType
  email       Boolean  @default(true)
  push        Boolean  @default(true)
  sms         Boolean  @default(false)
  inApp       Boolean  @default(true)

  @@unique([userId, type])
}

enum NotificationType {
  // Transacionais
  ORDER_CREATED
  ORDER_SHIPPED
  ORDER_DELIVERED
  PAYMENT_RECEIVED
  PAYMENT_FAILED

  // Social
  NEW_FOLLOWER
  NEW_COMMENT
  MENTION

  // Sistema
  SECURITY_ALERT
  ACCOUNT_UPDATE
  FEATURE_ANNOUNCEMENT

  // Marketing
  PROMOTION
  WEEKLY_DIGEST
}

enum Channel {
  EMAIL
  PUSH
  SMS
  WEBHOOK
}

enum DeliveryStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Serviço de Notificações
      </h3>

      <CodeBlock
        fileName="lib/notifications/service.ts"
        code={`import { db } from '@/lib/db'
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
    \`user-\${notification.userId}\`,
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Canal: Email com React Email
      </h3>

      <CodeBlock
        fileName="lib/notifications/channels/email.ts"
        code={`import { Resend } from 'resend'
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
}`}
      />

      <CodeBlock
        fileName="emails/OrderShipped.tsx"
        code={`import {
  Html, Head, Body, Container, Text, Button, Preview
} from '@react-email/components'

type Props = {
  userName: string
  orderNumber: string
  trackingUrl: string
}

export function OrderShippedEmail({ userName, orderNumber, trackingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Seu pedido foi enviado!</Preview>
      <Body style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <Container>
          <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Pedido Enviado!
          </Text>

          <Text>Olá {userName},</Text>

          <Text>
            Seu pedido <strong>#{orderNumber}</strong> foi enviado e está a caminho!
          </Text>

          <Button
            href={trackingUrl}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Rastrear Pedido
          </Button>

          <Text style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
            Dúvidas? Responda este email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Canal: Push Notifications
      </h3>

      <CodeBlock
        fileName="lib/notifications/channels/push.ts"
        code={`import webpush from 'web-push'

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
}`}
      />

      <CodeBlock
        fileName="app/api/push/subscribe/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await request.json()

  // Salva subscription
  await db.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
      },
    },
    create: {
      userId: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  })

  return NextResponse.json({ success: true })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Hook para Registrar Push
      </h3>

      <CodeBlock
        fileName="hooks/usePushNotifications.ts"
        code={`'use client'

import { useState, useEffect } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  async function subscribe() {
    if (!isSupported) return { success: false, error: 'Not supported' }

    try {
      // 1. Pede permissão
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        return { success: false, error: 'Permission denied' }
      }

      // 2. Registra service worker
      const registration = await navigator.serviceWorker.register('/sw.js')

      // 3. Cria subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // 4. Envia para backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to subscribe' }
    }
  }

  return { permission, isSupported, subscribe }
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Componente de Notificações In-App
      </h3>

      <CodeBlock
        fileName="components/NotificationBell.tsx"
        code={`'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'

type Notification = {
  id: string
  type: string
  title: string
  body: string
  actionUrl?: string
  createdAt: string
  readAt?: string
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.readAt).length

  // Carrega notificações iniciais
  useEffect(() => {
    if (!session?.user) return

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data.notifications))
  }, [session])

  // Escuta novas notificações em tempo real
  useEffect(() => {
    if (!session?.user) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe(\`user-\${session.user.id}\`)

    channel.bind('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])

      // Toca som
      new Audio('/notification.mp3').play().catch(() => {})
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(\`user-\${session.user.id}\`)
    }
  }, [session])

  async function markAsRead(id: string) {
    await fetch(\`/api/notifications/\${id}/read\`, { method: 'POST' })
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
    )
  }

  async function markAllAsRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' })
    setNotifications(prev =>
      prev.map(n => ({ ...n, readAt: new Date().toISOString() }))
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-gray-500">
                Nenhuma notificação
              </p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.readAt) markAsRead(n.id)
                    if (n.actionUrl) window.location.href = n.actionUrl
                  }}
                  className={\`
                    p-3 border-b cursor-pointer hover:bg-gray-50
                    \${!n.readAt ? 'bg-blue-50' : ''}
                  \`}
                >
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-sm text-gray-600">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelative(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <a
            href="/notifications"
            className="block p-3 text-center text-sm text-blue-500 hover:bg-gray-50 border-t"
          >
            Ver todas
          </a>
        </div>
      )}
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        API de Notificações
      </h3>

      <CodeBlock
        fileName="app/api/notifications/route.ts"
        code={`import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = 20

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
      archivedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  })

  const hasMore = notifications.length > limit
  if (hasMore) notifications.pop()

  return NextResponse.json({
    notifications,
    nextCursor: hasMore ? notifications[notifications.length - 1].id : null,
  })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Preferências de Notificação
      </h3>

      <CodeBlock
        fileName="app/settings/notifications/page.tsx"
        code={`import { auth } from '@/lib/auth'

const NOTIFICATION_TYPES = [
  { type: 'ORDER_CREATED', label: 'Novos pedidos', category: 'Pedidos' },
  { type: 'ORDER_SHIPPED', label: 'Pedido enviado', category: 'Pedidos' },
  { type: 'PAYMENT_RECEIVED', label: 'Pagamento recebido', category: 'Financeiro' },
  { type: 'PAYMENT_FAILED', label: 'Pagamento falhou', category: 'Financeiro' },
  { type: 'NEW_COMMENT', label: 'Novos comentários', category: 'Social' },
  { type: 'SECURITY_ALERT', label: 'Alertas de segurança', category: 'Segurança' },
  { type: 'WEEKLY_DIGEST', label: 'Resumo semanal', category: 'Marketing' },
]

export default async function NotificationPreferencesPage() {
  const session = await auth()

  const preferences = await db.notificationPreference.findMany({
    where: { userId: session!.user.id },
  })

  const prefMap = Object.fromEntries(
    preferences.map(p => [p.type, p])
  )

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Preferências de Notificação</h1>

      <form action={updatePreferences}>
        {Object.entries(
          NOTIFICATION_TYPES.reduce((acc, t) => {
            acc[t.category] = acc[t.category] || []
            acc[t.category].push(t)
            return acc
          }, {} as Record<string, typeof NOTIFICATION_TYPES>)
        ).map(([category, types]) => (
          <div key={category} className="mb-8">
            <h2 className="font-semibold mb-4">{category}</h2>

            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2 text-center">In-App</th>
                  <th className="pb-2 text-center">Email</th>
                  <th className="pb-2 text-center">Push</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => {
                  const pref = prefMap[t.type] || { inApp: true, email: true, push: true }
                  return (
                    <tr key={t.type} className="border-t">
                      <td className="py-3">{t.label}</td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={\`\${t.type}.inApp\`}
                          defaultChecked={pref.inApp}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={\`\${t.type}.email\`}
                          defaultChecked={pref.email}
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          name={\`\${t.type}.push\`}
                          defaultChecked={pref.push}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Salvar Preferências
        </button>
      </form>
    </div>
  )
}`}
      />

      <NoteBox type="info" title="Boas Práticas">
        <ul className="list-disc list-inside">
          <li>Sempre permita opt-out de emails de marketing</li>
          <li>Agrupe notificações similares (digest)</li>
          <li>Respeite fuso horário do usuário</li>
          <li>Limite frequência (no máximo X por hora)</li>
          <li>Mantenha histórico para auditoria</li>
        </ul>
      </NoteBox>
    </div>
  )
}
