'use client'

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

    const channel = pusher.subscribe(`user-${session.user.id}`)

    channel.bind('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])

      // Toca som
      new Audio('/notification.mp3').play().catch(() => {})
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe(`user-${session.user.id}`)
    }
  }, [session])

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
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
                  className={`
                    p-3 border-b cursor-pointer hover:bg-gray-50
                    ${!n.readAt ? 'bg-blue-50' : ''}
                  `}
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
}
