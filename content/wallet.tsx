import CodeBlock from '@/components/CodeBlock'
import NoteBox from '@/components/NoteBox'

export function WalletSegura() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Carteira Digital Segura
      </h1>

      <NoteBox type="danger" title="Regra de Ouro">
        Nunca calcule saldo somando transações na hora. Use um campo <code>balance</code>
        que é atualizado de forma atômica junto com cada transação.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura do Banco
      </h3>

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model Wallet {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])

  // Saldo em centavos (evita problemas com decimal)
  balance   Int      @default(0)

  // Controle
  lockedAt  DateTime? // Se não null, carteira bloqueada
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(cuid())
  walletId    String
  wallet      Wallet   @relation(fields: [walletId], references: [id])

  // Valores em centavos
  amount      Int      // Positivo = entrada, Negativo = saída
  balanceAfter Int     // Saldo após esta transação

  type        TransactionType
  status      TransactionStatus @default(PENDING)
  description String?

  // Referência externa (ID do pagamento, saque, etc)
  externalId  String?

  createdAt   DateTime @default(now())
  processedAt DateTime?
}

enum TransactionType {
  DEPOSIT     // Dinheiro entrou
  WITHDRAWAL  // Saque solicitado
  PAYMENT     // Pagamento recebido (ex: AbacatePay)
  REFUND      // Estorno
  FEE         // Taxa cobrada
}

enum TransactionStatus {
  PENDING     // Aguardando processamento
  COMPLETED   // Concluído
  FAILED      // Falhou
  CANCELLED   // Cancelado
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Adicionar Saldo (Depósito)
      </h3>

      <CodeBlock
        fileName="lib/wallet/operations.ts"
        code={`import { db } from '@/lib/db'

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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Solicitar Saque
      </h3>

      <CodeBlock
        fileName="lib/wallet/operations.ts"
        code={`export async function requestWithdrawal(
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
        description: \`Saque PIX: \${pixKey}\`,
      },
    })

    return { wallet: updatedWallet, transaction }
  })
}

// Depois, um job processa os saques pendentes
// e atualiza o status para COMPLETED ou FAILED`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Webhook do AbacatePay
      </h3>

      <CodeBlock
        fileName="app/api/webhooks/abacatepay/route.ts"
        code={`import { NextResponse } from 'next/server'
import { addBalance } from '@/lib/wallet/operations'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-abacatepay-signature')

  // 1. Verifica assinatura
  const expectedSig = crypto
    .createHmac('sha256', process.env.ABACATEPAY_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const event = JSON.parse(body)

  // 2. Evita processar o mesmo evento duas vezes
  const existing = await db.transaction.findFirst({
    where: { externalId: event.id },
  })

  if (existing) {
    return NextResponse.json({ message: 'Já processado' })
  }

  // 3. Processa o pagamento
  if (event.type === 'payment.confirmed') {
    const userId = event.metadata.userId
    const amountCents = event.amount // já em centavos

    await addBalance(
      userId,
      amountCents,
      'PAYMENT',
      \`Pagamento #\${event.id}\`,
      event.id
    )
  }

  return NextResponse.json({ received: true })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Exibir Saldo
      </h3>

      <CodeBlock
        fileName="app/wallet/page.tsx"
        code={`import { db } from '@/lib/db'
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Checklist de Segurança
      </h3>

      <div className="bg-bg-secondary p-6 rounded-lg border border-slate-700">
        <ul className="space-y-2">
          <li>✅ Valores sempre em centavos (Int, não Float)</li>
          <li>✅ Transações atômicas (tudo ou nada)</li>
          <li>✅ Campo balanceAfter em cada transação (auditoria)</li>
          <li>✅ Verificar assinatura de webhooks</li>
          <li>✅ Idempotência (não processar mesmo evento 2x)</li>
          <li>✅ Verificar saldo antes de deduzir</li>
          <li>✅ Logs de todas as operações</li>
          <li>✅ Rate limiting em saques</li>
        </ul>
      </div>
    </div>
  )
}
