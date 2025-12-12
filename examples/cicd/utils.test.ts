import { describe, it, expect } from 'vitest'
import { formatCurrency, isValidEmail } from '../utils'

describe('formatCurrency', () => {
  it('formata valor em reais', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00')
    expect(formatCurrency(99.9)).toBe('R$ 99,90')
  })

  it('lida com zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})

describe('isValidEmail', () => {
  it('aceita emails válidos', () => {
    expect(isValidEmail('teste@email.com')).toBe(true)
  })

  it('rejeita emails inválidos', () => {
    expect(isValidEmail('teste')).toBe(false)
    expect(isValidEmail('teste@')).toBe(false)
  })
})