import CodeBlock from '@/components/CodeBlock'
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

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model Certificate {
  id          String    @id @default(cuid())
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id])

  // Dados do certificado (NÃO armazenar o arquivo aqui!)
  name        String    // "Certificado Empresa X"
  cnpj        String    // CNPJ vinculado
  expiresAt   DateTime  // Data de expiração
  isActive    Boolean   @default(true)

  // Referência ao storage seguro
  storageKey  String    // Chave no S3/Vault

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([tenantId, cnpj])
}`}
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

      <CodeBlock
        fileName="lib/certificates/storage.ts"
        code={`import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

const BUCKET = process.env.CERTIFICATES_BUCKET!

// A senha do certificado é criptografada antes de salvar
import { encrypt, decrypt } from '@/lib/crypto'

export async function uploadCertificate(
  tenantId: string,
  certificateFile: Buffer,
  password: string
) {
  const key = \`certificates/\${tenantId}/\${Date.now()}.pfx\`

  // 1. Upload do arquivo .pfx para S3 (já criptografado pelo S3)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: certificateFile,
    ServerSideEncryption: 'aws:kms', // Criptografia extra
  }))

  // 2. Criptografa a senha antes de salvar no banco
  const encryptedPassword = await encrypt(password)

  return { storageKey: key, encryptedPassword }
}

export async function getCertificate(storageKey: string) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
  }))

  const buffer = await response.Body?.transformToByteArray()
  return Buffer.from(buffer!)
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Upload do Certificado
      </h3>

      <CodeBlock
        fileName="app/settings/certificates/actions.ts"
        code={`'use server'

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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validar Certificado
      </h3>

      <CodeBlock
        fileName="lib/certificates/validator.ts"
        code={`import forge from 'node-forge'

type CertInfo = {
  valid: boolean
  error?: string
  commonName?: string
  cnpj?: string
  expiresAt?: Date
}

export async function validateCertificate(
  pfxBuffer: Buffer,
  password: string
): Promise<CertInfo> {
  try {
    // Converte buffer para formato que o forge entende
    const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'))
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

    // Extrai o certificado
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert

    if (!cert) {
      return { valid: false, error: 'Certificado não encontrado no arquivo' }
    }

    // Verifica validade
    const now = new Date()
    const expiresAt = cert.validity.notAfter

    if (now > expiresAt) {
      return { valid: false, error: 'Certificado expirado' }
    }

    // Extrai dados
    const commonName = cert.subject.getField('CN')?.value || ''
    const cnpj = extractCNPJ(commonName)

    return {
      valid: true,
      commonName,
      cnpj,
      expiresAt,
    }
  } catch (error) {
    return { valid: false, error: 'Senha incorreta ou arquivo inválido' }
  }
}

function extractCNPJ(text: string): string {
  const match = text.match(/\\d{14}/)
  return match ? match[0] : ''
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Alerta de Expiração
      </h3>

      <CodeBlock
        fileName="app/api/cron/check-certificates/route.ts"
        code={`import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function GET() {
  // Certificados que vencem em 30 dias
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiring = await db.certificate.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: thirtyDaysFromNow },
    },
    include: { tenant: { include: { users: true } } },
  })

  for (const cert of expiring) {
    // Envia email para os admins do tenant
    const admins = cert.tenant.users.filter(u => u.role === 'OWNER')

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: \`Certificado \${cert.name} expira em breve\`,
        body: \`Seu certificado expira em \${cert.expiresAt.toLocaleDateString()}\`,
      })
    }
  }

  return Response.json({ checked: expiring.length })
}`}
      />
    </div>
  )
}
