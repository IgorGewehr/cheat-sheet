'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createProduct(formData: FormData) {
  // ... criar produto no DB

  // Opção 1: Revalida uma página específica
  revalidatePath('/products')

  // Opção 2: Revalida todas as páginas que usam a tag
  revalidateTag('products')

  // Opção 3: Revalida layout (e todas as páginas filhas)
  revalidatePath('/dashboard', 'layout')
}

export async function updateProduct(id: string, formData: FormData) {
  // ... atualizar produto

  // Revalida página específica do produto
  revalidatePath(`/products/${id}`)

  // E a listagem
  revalidateTag('products')
}