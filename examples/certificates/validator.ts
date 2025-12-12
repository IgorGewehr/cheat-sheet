import forge from 'node-forge'

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
  const match = text.match(/\d{14}/)
  return match ? match[0] : ''
}