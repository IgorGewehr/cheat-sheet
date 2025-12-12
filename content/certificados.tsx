import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function CertificadosDigitais() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Certificados Digitais
      </h1>

      <NoteBox type="warning" title="Cuidado!">
        Certificados digitais são extremamente sensíveis. Vazamento = acesso a emissão
        de notas fiscais em nome do cliente. Trate como se fosse dinheiro.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Tipos de Certificado
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Formato</th>
            <th>Uso</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A1</td>
            <td>.pfx ou .p12</td>
            <td>Arquivo digital, válido por 1 ano</td>
          </tr>
          <tr>
            <td>A3</td>
            <td>Token/Smartcard</td>
            <td>Hardware físico, válido por 3 anos</td>
          </tr>
        </tbody>
      </table>

      <p className="text-text-secondary mt-4">
        Para ERPs em nuvem, geralmente usamos <strong>A1</strong> (arquivo).
      </p>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Estrutura do Banco
      </h3>

      <CodeBlockFile
        file="certificates/schema.prisma"
        fileName="prisma/schema.prisma"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Armazenamento Seguro
      </h3>

      <NoteBox type="danger" title="Nunca faça isso!">
        <ul className="list-disc list-inside">
          <li>Salvar certificado no banco de dados</li>
          <li>Guardar senha em texto plano</li>
          <li>Expor via API pública</li>
          <li>Permitir download do arquivo</li>
        </ul>
      </NoteBox>

      <p className="text-text-secondary mt-4 mb-4">
        Use um serviço de secrets como <strong>AWS Secrets Manager</strong>,
        <strong> HashiCorp Vault</strong> ou <strong>S3 com criptografia</strong>.
      </p>

      <CodeBlockFile
        file="certificates/storage.ts"
        fileName="lib/certificates/storage.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Upload do Certificado
      </h3>

      <CodeBlockFile
        file="certificates/actions.ts"
        fileName="app/settings/certificates/actions.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validar Certificado
      </h3>

      <CodeBlockFile
        file="certificates/validator.ts"
        fileName="lib/certificates/validator.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Alerta de Expiração
      </h3>

      <CodeBlockFile
        file="certificates/check-certificates-route.ts"
        fileName="app/api/cron/check-certificates/route.ts"
      />
    </div>
  )
}
