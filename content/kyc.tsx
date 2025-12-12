import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function KYCVerificacao() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        KYC - Verificação de Identidade
      </h1>

      <NoteBox type="info" title="O que é KYC?">
        <strong>Know Your Customer</strong> - Processo de verificar que o usuário é quem
        diz ser. Obrigatório para liberar saques e funcionalidades financeiras.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Níveis de Verificação
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Nível</th>
            <th>Dados</th>
            <th>Liberado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Básico</td>
            <td>Email verificado</td>
            <td>Usar a plataforma</td>
          </tr>
          <tr>
            <td>Intermediário</td>
            <td>CPF + Data nascimento</td>
            <td>Receber pagamentos</td>
          </tr>
          <tr>
            <td>Completo</td>
            <td>Documento + Selfie</td>
            <td>Sacar dinheiro</td>
          </tr>
        </tbody>
      </table>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura do Banco
      </h3>

      <CodeBlockFile file="kyc/schema.prisma" fileName="prisma/schema.prisma" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Upload Seguro de Documentos
      </h3>

      <NoteBox type="danger" title="Cuidado com documentos!">
        <ul className="list-disc list-inside">
          <li>Nunca salve em pasta pública</li>
          <li>Criptografe em repouso (S3 SSE-KMS)</li>
          <li>Gere URLs temporárias para visualização</li>
          <li>Delete após período de retenção</li>
        </ul>
      </NoteBox>

      <CodeBlockFile file="kyc/upload.ts" fileName="lib/kyc/upload.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Formulário de KYC
      </h3>

      <CodeBlockFile file="kyc/page.tsx" fileName="app/account/kyc/page.tsx" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validação de CPF
      </h3>

      <CodeBlockFile file="kyc/validators.ts" fileName="lib/kyc/validators.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Verificação com Serviço Externo
      </h3>

      <NoteBox type="info" title="Serviços de KYC">
        Para verificação automática, use serviços como:
        <ul className="list-disc list-inside mt-2">
          <li><strong>idwall</strong> - BR, verificação de documentos + face match</li>
          <li><strong>Metamap</strong> - Latam, biometria + background check</li>
          <li><strong>Onfido</strong> - Global, AI para verificação de docs</li>
        </ul>
      </NoteBox>

      <CodeBlockFile file="kyc/verify.ts" fileName="lib/kyc/verify.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Verificar Antes de Permitir Saque
      </h3>

      <CodeBlockFile file="kyc/operations.ts" fileName="lib/wallet/operations.ts" />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Criptografia de Dados Sensíveis
      </h3>

      <CodeBlockFile file="kyc/crypto.ts" fileName="lib/crypto.ts" />
    </div>
  )
}
