'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // Precisa incluir html e body pois substitui o root layout
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            Erro crítico!
          </h2>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Recarregar aplicação
          </button>
        </div>
      </body>
    </html>
  )
}