'use server'

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
    `chat-${chatId}`,  // Nome do canal
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
}