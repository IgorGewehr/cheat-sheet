'use client'

import { createContext, useContext, useState } from 'react'

type Toast = { id: string; message: string; type: 'success' | 'error' }

const ToastContext = createContext<{
  toast: (message: string, type?: 'success' | 'error') => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function toast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])

    // Remove após 3 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Container de toasts */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              px-4 py-2 rounded-lg animate-slideIn
              ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
              text-white
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)!

// Uso:
// const { toast } = useToast()
// toast('Salvo com sucesso!')
// toast('Erro ao salvar', 'error')