import CodeBlockFile from '@/components/CodeBlockFile'
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

      <CodeBlockFile file="wallet/schema.prisma" fileName="prisma/schema.prisma" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Adicionar Saldo (Depósito)
      </h3>

      <CodeBlockFile file="wallet/add-balance.ts" fileName="lib/wallet/operations.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Solicitar Saque
      </h3>

      <CodeBlockFile file="wallet/request-withdrawal.ts" fileName="lib/wallet/operations.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Webhook do AbacatePay
      </h3>

      <CodeBlockFile file="wallet/webhook-abacatepay.ts" fileName="app/api/webhooks/abacatepay/route.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Exibir Saldo
      </h3>

      <CodeBlockFile file="wallet/wallet-page.tsx" fileName="app/wallet/page.tsx" />

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
