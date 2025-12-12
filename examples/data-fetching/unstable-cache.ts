import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

// Cache de queries do banco
export const getProducts = unstable_cache(
  async (tenantId: string) => {
    return db.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })
  },
  ['products'], // Key do cache
  {
    tags: ['products'],
    revalidate: 60, // 1 minuto
  }
)

// Com parâmetros dinâmicos na key
export const getProduct = unstable_cache(
  async (id: string) => {
    return db.product.findUnique({ where: { id } })
  },
  ['product'], // Base key
  {
    tags: ['products'],
    revalidate: 300,
  }
)

// Uso:
const products = await getProducts(tenantId)
const product = await getProduct(productId)