// Exemplo com serviço de verificação
export async function verifyWithProvider(userId: string) {
  const kyc = await db.kyc.findUnique({ where: { userId } })
  if (!kyc) throw new Error('KYC não encontrado')

  // 1. Busca URLs temporárias dos documentos
  const frontUrl = await getDocumentUrl(kyc.documentFrontKey!)
  const selfieUrl = await getDocumentUrl(kyc.selfieKey!)

  // 2. Envia para o provider
  const result = await kycProvider.verify({
    documentUrl: frontUrl,
    selfieUrl: selfieUrl,
    cpf: decrypt(kyc.cpf),
  })

  // 3. Atualiza status
  if (result.approved) {
    await db.kyc.update({
      where: { userId },
      data: {
        verifiedAt: new Date(),
        verifiedBy: 'system',
      },
    })

    await db.user.update({
      where: { id: userId },
      data: { kycStatus: 'VERIFIED' },
    })
  } else {
    await db.kyc.update({
      where: { userId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: result.reason,
      },
    })

    await db.user.update({
      where: { id: userId },
      data: { kycStatus: 'REJECTED' },
    })
  }

  return result
}