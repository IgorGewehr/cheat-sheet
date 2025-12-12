import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  total: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => set((state) => ({
        items: [...state.items, item]
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      total: () => get().items.reduce((sum, i) => sum + i.price, 0)
    }),
    { name: 'cart-storage' } // Persiste no localStorage
  )
)