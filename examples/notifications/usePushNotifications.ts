'use client'

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
}
