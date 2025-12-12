async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      // Se for rate limit (429), aguarda e tenta novamente
      if (error.status === 429) {
        const retryAfter = error.headers?.get('Retry-After') || 1
        const delay = Math.min(
          Number(retryAfter) * 1000,
          Math.pow(2, i) * 1000 // Exponential backoff
        )
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
