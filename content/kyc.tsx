import CodeBlock from '@/components/CodeBlock'
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

      <CodeBlock
        fileName="prisma/schema.prisma"
        code={`model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?

  // KYC
  kyc           KYC?
  kycStatus     KYCStatus @default(PENDING)
}

model KYC {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])

  // Dados pessoais
  cpf           String?  // Criptografado
  birthDate     DateTime?
  fullName      String?

  // Endereço
  zipCode       String?
  street        String?
  number        String?
  city          String?
  state         String?

  // Documentos (referência ao storage, não o arquivo)
  documentType  DocumentType?
  documentFrontKey String?  // Chave no S3
  documentBackKey  String?
  selfieKey        String?

  // Verificação
  verifiedAt    DateTime?
  verifiedBy    String?   // ID do admin ou serviço
  rejectedAt    DateTime?
  rejectionReason String?

  // Histórico
  attempts      Int      @default(0)
  lastAttemptAt DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum KYCStatus {
  PENDING       // Não iniciou
  SUBMITTED     // Enviou documentos
  IN_REVIEW     // Em análise
  VERIFIED      // Aprovado
  REJECTED      // Rejeitado
}

enum DocumentType {
  RG
  CNH
  PASSPORT
}`}
      />

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

      <CodeBlock
        fileName="lib/kyc/upload.ts"
        code={`import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const BUCKET = process.env.KYC_BUCKET!

export async function uploadDocument(
  userId: string,
  file: File,
  type: 'front' | 'back' | 'selfie'
) {
  const buffer = Buffer.from(await file.arrayBuffer())

  // 1. Redimensiona e converte para JPEG (remove metadados)
  const processed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer()

  // 2. Gera key única
  const key = \`kyc/\${userId}/\${type}-\${Date.now()}.jpg\`

  // 3. Upload com criptografia
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: processed,
    ContentType: 'image/jpeg',
    ServerSideEncryption: 'aws:kms',
    // Bloqueia acesso público
    ACL: 'private',
  }))

  return key
}

// Gera URL temporária para visualização (só admin)
export async function getDocumentUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })

  // URL válida por 5 minutos
  return getSignedUrl(s3, command, { expiresIn: 300 })
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Formulário de KYC
      </h3>

      <CodeBlock
        fileName="app/account/kyc/page.tsx"
        code={`'use client'

import { useState } from 'react'
import { submitKYC } from './actions'

export default function KYCPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verificação de Identidade</h1>

      {step === 1 && (
        <PersonalDataStep onNext={() => setStep(2)} />
      )}

      {step === 2 && (
        <DocumentStep onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}

      {step === 3 && (
        <SelfieStep onNext={() => setStep(4)} onBack={() => setStep(2)} />
      )}

      {step === 4 && (
        <SuccessStep />
      )}
    </div>
  )
}

function DocumentStep({ onNext, onBack }) {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Tire foto do seu documento (RG ou CNH)
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Frente</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {frontFile && (
          <img
            src={URL.createObjectURL(frontFile)}
            alt="Preview"
            className="mt-2 rounded"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Verso</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setBackFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={!frontFile || !backFile}>
          Continuar
        </Button>
      </div>
    </div>
  )
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validação de CPF
      </h3>

      <CodeBlock
        fileName="lib/kyc/validators.ts"
        code={`export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\\D/g, '')

  if (cpf.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\\d)\\1+$/.test(cpf)) return false

  // Validação dos dígitos verificadores
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i)
  }
  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i)
  }
  digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== parseInt(cpf[10])) return false

  return true
}

export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/\\D/g, '')
  return cpf.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4')
}`}
      />

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

      <CodeBlock
        fileName="lib/kyc/verify.ts"
        code={`// Exemplo com serviço de verificação
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Verificar Antes de Permitir Saque
      </h3>

      <CodeBlock
        fileName="lib/wallet/operations.ts"
        code={`export async function requestWithdrawal(userId: string, amount: number) {
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
}`}
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Criptografia de Dados Sensíveis
      </h3>

      <CodeBlock
        fileName="lib/crypto.ts"
        code={`import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag().toString('hex')

  // iv:authTag:encrypted
  return \`\${iv.toString('hex')}:\${authTag}:\${encrypted}\`
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Uso:
// const encryptedCPF = encrypt('12345678900')
// const cpf = decrypt(encryptedCPF)`}
      />
    </div>
  )
}
