'use server'

import { hasFeature } from '@/lib/features'

export async function exportData(format: 'csv' | 'json') {
  // Verifica se tem acesso à feature
  const canExport = await hasFeature('apiAccess')

  if (!canExport) {
    return {
      success: false,
      error: 'Faça upgrade para o plano Pro para exportar dados.',
    }
  }

  // ... lógica de exportação
}