import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function RealtimeChat() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Chat em Tempo Real
      </h1>

      <NoteBox type="info" title="Quando usar?">
        Chat entre usuários, notificações ao vivo, dashboards que atualizam sozinhos.
        Para isso, usamos <strong>WebSockets</strong> ou serviços como <strong>Pusher/Ably</strong>.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Opções de Arquitetura
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Solução</th>
            <th>Prós</th>
            <th>Contras</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pusher / Ably</td>
            <td>Fácil, escala sozinho, sem servidor</td>
            <td>Custo por mensagem</td>
          </tr>
          <tr>
            <td>Supabase Realtime</td>
            <td>Já vem com o Supabase, grátis até certo ponto</td>
            <td>Só funciona com Supabase</td>
          </tr>
          <tr>
            <td>Socket.io próprio</td>
            <td>Controle total, sem custos de terceiros</td>
            <td>Precisa de servidor separado</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Exemplo com Pusher (Recomendado)
      </h3>

      <p className="text-text-secondary mb-4">
        Pusher cuida de toda a infraestrutura. Você só envia e recebe mensagens.
      </p>

      <CodeBlock
        fileName="lib/pusher.ts"
        code={`import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Servidor (Server Actions / API Routes)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Cliente (React)
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
)`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Enviando Mensagem (Server Action)
      </h3>

      <CodeBlock
        fileName="app/chat/actions.ts"
        code={`'use server'

import { pusherServer } from '@/lib/pusher'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function sendMessage(chatId: string, content: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Não autenticado')

  // 1. Salva no banco
  const message = await db.message.create({
    data: {
      chatId,
      content,
      senderId: user.id,
    },
  })

  // 2. Envia em tempo real para todos no canal
  await pusherServer.trigger(
    \`chat-\${chatId}\`,  // Nome do canal
    'new-message',      // Nome do evento
    {
      id: message.id,
      content: message.content,
      senderId: user.id,
      senderName: user.name,
      createdAt: message.createdAt,
    }
  )

  return message
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Recebendo Mensagens (Client)
      </h3>

      <CodeBlock
        fileName="app/chat/[chatId]/ChatMessages.tsx"
        code={`'use client'

import { useEffect, useState } from 'react'
import { pusherClient } from '@/lib/pusher'

type Message = {
  id: string
  content: string
  senderName: string
  createdAt: string
}

export function ChatMessages({
  chatId,
  initialMessages
}: {
  chatId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)

  useEffect(() => {
    // Conecta ao canal do chat
    const channel = pusherClient.subscribe(\`chat-\${chatId}\`)

    // Escuta novas mensagens
    channel.bind('new-message', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage])
    })

    // Cleanup quando sair da página
    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(\`chat-\${chatId}\`)
    }
  }, [chatId])

  return (
    <div className="space-y-2">
      {messages.map(msg => (
        <div key={msg.id} className="p-2 bg-gray-100 rounded">
          <strong>{msg.senderName}:</strong> {msg.content}
        </div>
      ))}
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Isolamento por Tenant
      </h3>

      <NoteBox type="warning" title="Importante">
        Em SaaS multi-tenant, cada tenant deve ter seu próprio canal.
        Nunca misture mensagens de tenants diferentes!
      </NoteBox>

      <CodeBlock
        code={`// Canal privado por tenant + chat
const channelName = \`private-tenant-\${tenantId}-chat-\${chatId}\`

// No servidor, valide que o usuário pertence ao tenant
// antes de permitir envio de mensagens`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Indicador "Digitando..."
      </h3>

      <CodeBlock
        code={`// Cliente: avisa que está digitando
function handleTyping() {
  pusherClient.channel(\`chat-\${chatId}\`).trigger(
    'client-typing',
    { userName: user.name }
  )
}

// Cliente: escuta quem está digitando
channel.bind('client-typing', ({ userName }) => {
  setTypingUser(userName)
  setTimeout(() => setTypingUser(null), 2000)
})`}
      />
    </div>
  )
}

export function CronJobs() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Jobs Agendados (Cron)
      </h1>

      <NoteBox type="info" title="Casos de Uso">
        Sincronizar calendários (iCal), enviar emails em lote, limpar dados antigos,
        gerar relatórios diários, verificar status de integrações.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Opções de Arquitetura
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Solução</th>
            <th>Melhor para</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel Cron</td>
            <td>Jobs simples, já hospedado na Vercel</td>
          </tr>
          <tr>
            <td>QStash (Upstash)</td>
            <td>Jobs que precisam de retry, filas</td>
          </tr>
          <tr>
            <td>Trigger.dev</td>
            <td>Jobs complexos, workflows</td>
          </tr>
          <tr>
            <td>BullMQ + Redis</td>
            <td>Controle total, alto volume</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Exemplo: Sync iCal (Airbnb/Booking)
      </h3>

      <p className="text-text-secondary mb-4">
        A cada 30 minutos, busca reservas do Airbnb e Booking via iCal.
      </p>

      <CodeBlock
        fileName="vercel.json"
        code={`{
  "crons": [
    {
      "path": "/api/cron/sync-calendars",
      "schedule": "*/30 * * * *"
    }
  ]
}`}
      />

      <CodeBlock
        fileName="app/api/cron/sync-calendars/route.ts"
        code={`import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Protege o endpoint (só Vercel pode chamar)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca todos os imóveis com calendário configurado
  const properties = await db.property.findMany({
    where: { icalUrl: { not: null } },
    select: { id: true, icalUrl: true, tenantId: true },
  })

  const results = []

  for (const property of properties) {
    try {
      // Busca e processa o iCal
      const newBookings = await syncPropertyCalendar(property)
      results.push({ propertyId: property.id, synced: newBookings.length })
    } catch (error) {
      results.push({ propertyId: property.id, error: error.message })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Parser de iCal
      </h3>

      <CodeBlock
        fileName="lib/ical.ts"
        code={`import ical from 'node-ical'

type Booking = {
  uid: string
  start: Date
  end: Date
  summary: string
  source: 'airbnb' | 'booking' | 'other'
}

export async function parseIcal(url: string): Promise<Booking[]> {
  const events = await ical.async.fromURL(url)
  const bookings: Booking[] = []

  for (const event of Object.values(events)) {
    if (event.type !== 'VEVENT') continue

    // Detecta a fonte pelo conteúdo
    const source = event.summary?.includes('Airbnb')
      ? 'airbnb'
      : event.summary?.includes('Booking')
        ? 'booking'
        : 'other'

    bookings.push({
      uid: event.uid,
      start: new Date(event.start),
      end: new Date(event.end),
      summary: event.summary || 'Reserva',
      source,
    })
  }

  return bookings
}

export async function syncPropertyCalendar(property: {
  id: string
  icalUrl: string
}) {
  const bookings = await parseIcal(property.icalUrl)
  const newBookings = []

  for (const booking of bookings) {
    // Upsert: cria ou atualiza
    const result = await db.booking.upsert({
      where: {
        propertyId_externalId: {
          propertyId: property.id,
          externalId: booking.uid,
        }
      },
      create: {
        propertyId: property.id,
        externalId: booking.uid,
        startDate: booking.start,
        endDate: booking.end,
        source: booking.source,
        title: booking.summary,
      },
      update: {
        startDate: booking.start,
        endDate: booking.end,
        title: booking.summary,
      },
    })

    newBookings.push(result)
  }

  return newBookings
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Com Fila (QStash)
      </h3>

      <NoteBox type="success" title="Quando usar fila?">
        Quando você tem muitos itens para processar e não pode fazer tudo em 1 request.
        A fila processa um por um, com retry automático se falhar.
      </NoteBox>

      <CodeBlock
        code={`import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

// Agenda job para daqui 30 minutos
await qstash.publishJSON({
  url: 'https://meuapp.com/api/jobs/sync-property',
  body: { propertyId: '123' },
  delay: 30 * 60, // 30 minutos em segundos
})

// Ou adiciona à fila para processar agora
await qstash.publishJSON({
  url: 'https://meuapp.com/api/jobs/sync-property',
  body: { propertyId: '123' },
})`}
      />
    </div>
  )
}
