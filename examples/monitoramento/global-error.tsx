'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
            <p className="text-gray-600 mb-4">
              Nossa equipe foi notificada e está investigando.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}