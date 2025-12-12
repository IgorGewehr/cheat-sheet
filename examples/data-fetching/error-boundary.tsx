'use client' // Error components devem ser Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log para serviço de monitoramento (Sentry, etc)
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold text-red-500 mb-4">
        Algo deu errado!
      </h2>
      <p className="text-gray-600 mb-4">
        {error.message || 'Erro inesperado'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Tentar novamente
      </button>
    </div>
  )
}