export async function requestWithdrawal(
  userId: string,
  amountCents: number,
  pixKey: string
) {
  return db.$transaction(async (tx) => {
    // 1. Busca a carteira com lock (FOR UPDATE)
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) throw new Error('Carteira não encontrada')
    if (wallet.lockedAt) throw new Error('Carteira bloqueada')
    if (wallet.balance < amountCents) throw new Error('Saldo insuficiente')

    // 2. Deduz o saldo imediatamente
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { decrement: amountCents } },
    })

    // 3. Cria transação PENDENTE
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: -amountCents, // Negativo = saída
        balanceAfter: updatedWallet.balance,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: `Saque PIX: ${pixKey}`,
      },
    })

    return { wallet: updatedWallet, transaction }
  })
}

// Depois, um job processa os saques pendentes
// e atualiza o status para COMPLETED ou FAILED