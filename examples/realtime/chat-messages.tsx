'use client'

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
    const channel = pusherClient.subscribe(`chat-${chatId}`)

    // Escuta novas mensagens
    channel.bind('new-message', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage])
    })

    // Cleanup quando sair da página
    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`chat-${chatId}`)
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
}