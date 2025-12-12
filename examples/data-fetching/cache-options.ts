// 1. Sem cache (padrão no Next.js 15)
const data = await fetch('https://api.example.com/data')

// 2. Com cache (opt-in)
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
})

// 3. Revalidação por tempo (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 } // Revalida a cada 60 segundos
})

// 4. Com tags para invalidação manual
const data = await fetch('https://api.example.com/products', {
  next: {
    tags: ['products'],
    revalidate: 3600 // 1 hora
  }
})