type FetchOptions = RequestInit & {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export async function apiClient<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response.json()

    } catch (error) {
      lastError = error as Error

      // Nao retry em erros 4xx (client error)
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error
      }

      // Aguarda antes do proximo retry
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)))
      }
    }
  }

  throw lastError
}

// Uso:
const data = await apiClient<User[]>('https://api.example.com/users', {
  headers: { 'Authorization': `Bearer ${token}` },
  timeout: 5000,
  retries: 2,
})
