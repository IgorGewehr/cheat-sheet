'use server'

export async function createItem(formData: FormData) {
  try {
    const data = validateInput(formData)
    await db.item.create({ data })

    revalidatePath('/items')
    return { success: true }

  } catch (error) {
    // Erro de validação
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors,
      }
    }

    // Erro de constraint do banco
    if (error.code === 'P2002') {
      return {
        success: false,
        message: 'Item já existe',
      }
    }

    // Erro genérico - log e mensagem amigável
    console.error('createItem error:', error)
    return {
      success: false,
      message: 'Erro ao criar item. Tente novamente.',
    }
  }
}