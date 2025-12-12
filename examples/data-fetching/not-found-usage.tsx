import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

export default async function ProductPage({ params }) {
  const product = await db.product.findUnique({
    where: { id: params.id }
  })

  // Dispara o not-found.tsx
  if (!product) {
    notFound()
  }

  return <ProductDetails product={product} />
}