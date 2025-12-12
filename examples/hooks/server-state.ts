// O próprio fetch já é cacheado no Next.js
async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    next: {
      revalidate: 60, // Revalida a cada 60s
      tags: ['products'] // Tag para revalidação manual
    }
  })
  return res.json()
}

// Para invalidar o cache:
import { revalidateTag } from 'next/cache'
revalidateTag('products')