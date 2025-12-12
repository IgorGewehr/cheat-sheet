import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),

  email: z.string()
    .email('Email inválido')
    .toLowerCase(), // Normaliza

  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[0-9]/, 'Deve conter número'),

  role: z.enum(['user', 'admin']).default('user'),

  tenantId: z.string().uuid('Tenant inválido'),
})

// Tipo inferido do schema
export type CreateUserInput = z.infer<typeof createUserSchema>

// Schema para update (todos campos opcionais)
export const updateUserSchema = createUserSchema.partial().omit({
  tenantId: true // Não pode mudar tenant
})
