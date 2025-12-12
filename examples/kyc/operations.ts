export async function requestWithdrawal(userId: string, amount: number) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { kycStatus: true },
  })

  // Bloqueia saque se KYC não aprovado
  if (user?.kycStatus !== 'VERIFIED') {
    return {
      success: false,
      error: 'Complete a verificação de identidade para sacar',
      action: 'COMPLETE_KYC',
    }
  }

  // Continua com o saque...
}