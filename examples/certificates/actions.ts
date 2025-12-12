'use server'

import { uploadCertificate } from '@/lib/certificates/storage'
import { validateCertificate } from '@/lib/certificates/validator'
import { db } from '@/lib/db'

export async function saveCertificate(formData: FormData) {
  const file = formData.get('certificate') as File
  const password = formData.get('password') as string

  // 1. Lê o arquivo
  const buffer = Buffer.from(await file.arrayBuffer())

  // 2. Valida se é um certificado válido e extrai dados
  const certInfo = await validateCertificate(buffer, password)

  if (!certInfo.valid) {
    return { success: false, error: certInfo.error }
  }

  // 3. Upload seguro
  const { storageKey, encryptedPassword } = await uploadCertificate(
    tenant.id,
    buffer,
    password
  )

  // 4. Salva referência no banco
  await db.certificate.create({
    data: {
      tenantId: tenant.id,
      name: certInfo.commonName,
      cnpj: certInfo.cnpj,
      expiresAt: certInfo.expiresAt,
      storageKey,
      // Senha criptografada pode ir em outra tabela ainda mais restrita
    },
  })

  return { success: true }
}