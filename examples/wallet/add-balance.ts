import { db } from '@/lib/db'

// Sempre use transação do banco para garantir consistência
export async function addBalance(
  userId: string,
  amountCents: number,
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND',
  description?: string,
  externalId?: string
) {
  // Transação atômica: atualiza saldo E cria registro juntos
  return db.$transaction(async (tx) => {
    // 1. Atualiza o saldo
    const wallet = await tx.wallet.update({
      where: { userId },
      data: { balance: { increment: amountCents } },
    })

    // 2. Cria o registro da transação
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amountCents,
        balanceAfter: wallet.balance, // Saldo APÓS a operação
        type,
        status: 'COMPLETED',
        description,
        externalId,
        processedAt: new Date(),
      },
    })

    return { wallet, transaction }
  })
}