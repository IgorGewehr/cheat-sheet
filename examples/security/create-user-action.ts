'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createUserSchema } from '@/lib/validations/user'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Tipo do retorno padronizado
export type ActionState = {
  success: boolean
  errors?: Record<string, string[]>
  message?: string
} | null

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Autenticação
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, message: 'Não autenticado' }
  }

  // 2. Autorização
  if (currentUser.role !== 'admin') {
    return { success: false, message: 'Sem permissão' }
  }

  // 3. Validação
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
    tenantId: currentUser.tenantId,
  }

  const validated = createUserSchema.safeParse(rawData)

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // 4. Persistência
  try {
    await db.user.create({
      data: {
        ...validated.data,
        password: await hashPassword(validated.data.password),
      },
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return {
        success: false,
        errors: { email: ['Email já cadastrado'] },
      }
    }
    return { success: false, message: 'Erro ao criar usuário' }
  }

  // 5. Revalidação e Redirect
  revalidatePath('/users')
  redirect('/users')
}
