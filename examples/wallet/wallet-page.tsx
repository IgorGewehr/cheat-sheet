import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'

export default async function WalletPage() {
  const user = await getCurrentUser()

  const wallet = await db.wallet.findUnique({
    where: { userId: user.id },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return (
    <div>
      <h1>Minha Carteira</h1>

      {/* Saldo */}
      <div className="text-3xl font-bold">
        {formatCurrency(wallet.balance / 100)}
      </div>

      {/* Histórico */}
      <h2>Últimas transações</h2>
      {wallet.transactions.map(tx => (
        <div key={tx.id}>
          <span>{tx.type}</span>
          <span className={tx.amount > 0 ? 'text-green-500' : 'text-red-500'}>
            {formatCurrency(tx.amount / 100)}
          </span>
        </div>
      ))}
    </div>
  )
}