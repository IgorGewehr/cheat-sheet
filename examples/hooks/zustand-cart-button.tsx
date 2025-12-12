'use client'
import { useCart } from '@/stores/cart'

export function CartButton() {
  const itemCount = useCart(state => state.items.length)
  return <button>Carrinho ({itemCount})</button>
}