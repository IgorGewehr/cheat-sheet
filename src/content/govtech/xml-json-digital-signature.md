---
title: "Assinatura Digital de NFS-e com ICP-Brasil — XAdES e JAdES"
category: "govtech"
stack: ["NestJS", "TypeScript", "node-forge"]
tags: ["assinatura-digital", "icp-brasil", "xades", "jades", "certificado-a1", "nfse", "b2g", "criptografia", "pkcs12"]
excerpt: "Como assinar digitalmente NFS-e com certificado ICP-Brasil em Node.js: XAdES para XML ABRASF, JAdES para JSON MND, carregamento seguro de .p12 e monitoramento de validade."
---

## Visão Geral

A API nacional do Serpro exige que o payload de emissão de NFS-e seja **assinado digitalmente** com o certificado A1 da prefeitura emitido por AC credenciada pela ICP-Brasil. Sem assinatura válida, a nota é rejeitada na primeira requisição — não existe fallback.

Dois padrões de assinatura coexistem dependendo do modelo de NFS-e:

- **XAdES** (XML Advanced Electronic Signatures): usado no modelo ABRASF (XML). Assina o elemento `<infNFSe>` com `<Signature>` enveloped, algoritmo RSA-SHA256, canonicalização C14N exclusivo.
- **JAdES** (JSON Advanced Electronic Signatures): usado no modelo MND (JSON). Cria um JWS (JSON Web Signature) compacto com o payload serializado, algoritmo RS256, cadeia de certificados no header `x5c`.

## Contexto B2G

- A ICP-Brasil é a infraestrutura de chaves públicas do governo federal, regulada pelo ITI (Instituto Nacional de Tecnologia da Informação).
- Certificados de prefeituras são emitidos por ACs intermediárias (Serpro CA, Valid CA, Certisign CA) sob a raiz da AC Raiz ICP-Brasil.
- Certificado **A1**: arquivo digital `.p12` / `.pfx` (PKCS#12), protegido por senha, pode ser armazenado em servidor e usado de forma automatizada. Validade típica: 1 ano.
- Certificado **A3**: armazenado em token USB ou smartcard com chip criptográfico. A chave privada nunca sai do hardware. Válido por 3 anos, mas **inutilizável em ambiente servidor automatizado** — exige hardware presente e driver proprietário.
- Para integração de servidor (NestJS, workers, BullMQ), **use exclusivamente A1**. Se o cliente só tiver A3, é necessário um agente local na prefeitura que receba as requisições e faça a assinatura no hardware.

## Quando usar

- Qualquer envio de NFS-e ao Serpro (emissão, cancelamento, substituição).
- Integração com outros sistemas fiscais federais que exijam assinatura ICP-Brasil (NF-e, CT-e em alguns módulos).
- Sempre que a prefeitura precisar assinar documentos eletrônicos com validade jurídica pela MP 2.200-2/2001.

## Trade-offs

| Aspecto | XAdES (XML) | JAdES (JSON/JWS) |
|---|---|---|
| Padrão | ETSI EN 319 132 | ETSI TS 119 182 |
| Complexidade em Node | Alta — canonicalização C14N manual | Média — JWS é mais padronizado |
| Bibliotecas maduras | Escassas (xmldsig, node-forge manual) | `jose`, `jsonwebtoken` + node-forge |
| Tamanho do payload assinado | XML cresce com namespace C14N | JSON compacto (header.payload.signature) |
| Verificação offline | Fácil com xmlsec1 CLI | Fácil com qualquer JWS lib |
| Uso futuro | Legado (ABRASF em deprecação) | MND — padrão mandatório |

## Implementação

### 1. Instalação de dependências

```bash
npm install node-forge
npm install --save-dev @types/node-forge
```

### 2. CertificateService — carregamento e gerenciamento do .p12

```typescript
// certificate/certificate.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as forge from 'node-forge';
import * as fs from 'fs';

export interface CertificadoCarregado {
  cert: forge.pki.Certificate;
  key: forge.pki.PrivateKey;
  certPem: string;
  keyPem: string;
  /** Cadeia completa (cert + intermediárias) em PEM */
  chainPem: string[];
  validoAte: Date;
}

@Injectable()
export class CertificateService implements OnModuleInit {
  private readonly logger = new Logger(CertificateService.name);
  private cache = new Map<string, CertificadoCarregado>();

  onModuleInit() {
    // Verificar validade de todos os certs em cache na inicialização
    this.agendarVerificacaoValidade();
  }

  /**
   * Carrega certificado A1 (.p12) de um município.
   * O caminho e senha vêm de variáveis de ambiente ou secrets manager.
   * NUNCA hardcode de senha ou caminho no código.
   */
  async carregarCertificadoP12(municipioIbge: string): Promise<CertificadoCarregado> {
    if (this.cache.has(municipioIbge)) {
      return this.cache.get(municipioIbge)!;
    }

    // Em produção: buscar do AWS Secrets Manager / HashiCorp Vault
    // Aqui: variável de ambiente para simplicidade do exemplo
    const p12Base64 = process.env[`CERT_P12_${municipioIbge}`];
    const senha = process.env[`CERT_SENHA_${municipioIbge}`];

    if (!p12Base64 || !senha) {
      throw new Error(`Certificado não encontrado para município ${municipioIbge}`);
    }

    const p12Der = forge.util.decode64(p12Base64);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, senha);

    // Extrair certificado e chave privada
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    const cert = certBags[forge.pki.oids.certBag]![0].cert!;
    const key = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]![0].key! as forge.pki.PrivateKey;

    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(key);

    // Cadeia de certificados (cert + intermediárias — necessário para JAdES x5c)
    const chainPem = certBags[forge.pki.oids.certBag]!.map((b) =>
      forge.pki.certificateToPem(b.cert!),
    );

    const validoAte = new Date(cert.validity.notAfter);

    const carregado: CertificadoCarregado = { cert, key, certPem, keyPem, chainPem, validoAte };
    this.cache.set(municipioIbge, carregado);

    this.logger.log(
      `Certificado de ${municipioIbge} carregado. Válido até ${validoAte.toISOString()}`,
    );

    this.verificarValidade(municipioIbge, carregado);
    return carregado;
  }

  private verificarValidade(municipioIbge: string, cert: CertificadoCarregado): void {
    const agora = new Date();
    const diasRestantes = Math.floor(
      (cert.validoAte.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diasRestantes < 0) {
      this.logger.error(`CERTIFICADO EXPIRADO para ${municipioIbge}! Emissão bloqueada.`);
      // Enviar alerta crítico: PagerDuty, Slack, email
    } else if (diasRestantes <= 30) {
      this.logger.warn(
        `Certificado de ${municipioIbge} vence em ${diasRestantes} dias (${cert.validoAte.toISOString()}). RENOVAR.`,
      );
      // Enviar alerta antecipado via canal de monitoramento
    }
  }

  private agendarVerificacaoValidade(): void {
    // Verificar a cada 24h
    setInterval(() => {
      for (const [municipio, cert] of this.cache.entries()) {
        this.verificarValidade(municipio, cert);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Assina XML NFS-e (modelo ABRASF) com XAdES enveloped.
   * Assina o elemento raiz <infNFSe> com <Signature> inserida no final.
   */
  signXml(xml: string, cert: forge.pki.Certificate, key: forge.pki.PrivateKey): string {
    // 1. Fazer parse do XML
    const xmlDoc = forge.util.createBuffer(xml);

    // 2. Canonicalizar o conteúdo do elemento a ser assinado (C14N exclusivo)
    //    node-forge não implementa C14N nativo — usar lógica simplificada
    //    Para produção real, use a lib `xml-crypto` ou `xmldsig` que implementam C14N correto
    const canonicalXml = this.canonicalize(xml);

    // 3. Calcular digest SHA-256 do canonical XML
    const md = forge.md.sha256.create();
    md.update(forge.util.encodeUtf8(canonicalXml));
    const digestValue = forge.util.encode64(md.digest().bytes());

    // 4. Construir o SignedInfo (também deve ser canonicalizado antes de assinar)
    const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
  <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
  <Reference URI="">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
      <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
    <DigestValue>${digestValue}</DigestValue>
  </Reference>
</SignedInfo>`;

    // 5. Assinar o SignedInfo canonicalizado com RSA-SHA256
    const mdSignedInfo = forge.md.sha256.create();
    mdSignedInfo.update(forge.util.encodeUtf8(this.canonicalize(signedInfo)));
    const signature = (key as forge.pki.rsa.PrivateKey).sign(mdSignedInfo);
    const signatureValue = forge.util.encode64(signature);

    // 6. Serializar o certificado em Base64 para KeyInfo
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).bytes();
    const certBase64 = forge.util.encode64(certDer);

    // 7. Montar o bloco <Signature> completo
    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  ${signedInfo}
  <SignatureValue>${signatureValue}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${certBase64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`;

    // 8. Inserir <Signature> antes do fechamento da tag raiz
    const tagFechamento = xml.lastIndexOf('</');
    const posicao = xml.lastIndexOf('>', tagFechamento) + 1;
    return xml.slice(0, posicao) + signatureBlock + xml.slice(posicao);
  }

  /**
   * Assina payload JSON NFS-e (modelo MND) com JAdES (JWS RS256).
   * Retorna o JWS compacto: header.payload.signature (base64url).
   */
  signJson(payload: object, municipioIbge: string): string {
    const { cert, key, chainPem } = this.cache.get(municipioIbge)!;

    // Header JAdES: inclui tipo, algoritmo e cadeia de certificados (x5c)
    const header = {
      alg: 'RS256',
      typ: 'JOSE+JSON',
      // x5c: cadeia de certificados em Base64 DER (sem PEM headers)
      x5c: chainPem.map((pem) =>
        pem
          .replace('-----BEGIN CERTIFICATE-----', '')
          .replace('-----END CERTIFICATE-----', '')
          .replace(/\s/g, ''),
      ),
      // sigT: timestamp da assinatura em fuso de Brasília (ISO 8601)
      sigT: this.agora_brasilia(),
    };

    const headerB64 = this.base64url(JSON.stringify(header));
    const payloadB64 = this.base64url(JSON.stringify(payload));

    const mensagem = `${headerB64}.${payloadB64}`;

    // Assinar com RSA-SHA256
    const md = forge.md.sha256.create();
    md.update(forge.util.encodeUtf8(mensagem));
    const assinatura = (key as forge.pki.rsa.PrivateKey).sign(md);
    const assinaturaB64 = this.base64url(assinatura, 'binary');

    return `${mensagem}.${assinaturaB64}`;
  }

  /** Canonicalização C14N simplificada — para produção use xml-crypto */
  private canonicalize(xml: string): string {
    // Remover declaração XML, normalizar espaços em atributos, etc.
    // ATENÇÃO: esta é uma implementação simplificada.
    // Em produção, use `xml-crypto` ou `@xmldom/xmldom` + C14N correto.
    return xml
      .replace(/<\?xml[^?]*\?>/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }

  private base64url(data: string, encoding?: 'binary'): string {
    const buf = encoding === 'binary'
      ? Buffer.from(data, 'binary')
      : Buffer.from(data, 'utf8');
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private agora_brasilia(): string {
    // Brasília é UTC-3 (sem horário de verão desde 2019)
    const agora = new Date();
    const offset = -3 * 60; // minutos
    const local = new Date(agora.getTime() + offset * 60_000);
    return local.toISOString().replace('Z', '-03:00');
  }

  /**
   * Valida se um certificado é ICP-Brasil verificando a cadeia de confiança.
   * Em produção, verificar contra o bundle de ACs raiz do ITI.
   */
  validarCadeiaIcpBrasil(cert: forge.pki.Certificate): boolean {
    const emissor = cert.issuer.getField('O')?.value ?? '';
    const icpBrasilIssuers = ['ICP-Brasil', 'Serpro', 'Valid', 'Certisign', 'AC Raiz'];
    return icpBrasilIssuers.some((ac) => emissor.includes(ac));
  }
}
```

### 3. Uso no NfseService (integração)

```typescript
// Em NfseService.transmitirParaSerpro():

// Carregar cert do município (com cache)
const certCarregado = await this.certService.carregarCertificadoP12(nfse.municipioIbge);

// Verificar cadeia antes de usar
if (!this.certService.validarCadeiaIcpBrasil(certCarregado.cert)) {
  throw new Error('Certificado não é ICP-Brasil. Emissão bloqueada.');
}

// Modelo MND: assinar JSON com JAdES
const jws = this.certService.signJson(payloadMnd, nfse.municipioIbge);

// Modelo ABRASF: assinar XML com XAdES
const xmlAssinado = this.certService.signXml(
  xmlAbrasf,
  certCarregado.cert,
  certCarregado.key,
);

// mTLS: passar cert e key como Buffer para o https.Agent do Axios
import * as https from 'https';

const agent = new https.Agent({
  cert: Buffer.from(certCarregado.certPem),
  key: Buffer.from(certCarregado.keyPem),
  rejectUnauthorized: true,
});
```

### 4. Armazenamento seguro do .p12

```typescript
// certificate/certificate-loader.service.ts
// Estratégia: buscar do AWS Secrets Manager na inicialização do módulo

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class CertificateLoaderService {
  private readonly sm = new SecretsManagerClient({ region: 'sa-east-1' });

  async carregarDoSecretsManager(municipioIbge: string): Promise<{ p12Base64: string; senha: string }> {
    const secretId = `nfse/certificados/${municipioIbge}`;

    const comando = new GetSecretValueCommand({ SecretId: secretId });
    const resposta = await this.sm.send(comando);

    const secret = JSON.parse(resposta.SecretString!);
    return {
      p12Base64: secret.p12Base64,
      senha: secret.senha,
    };
  }
}

// Secret no Secrets Manager (JSON):
// {
//   "p12Base64": "<conteúdo do .p12 em Base64>",
//   "senha": "senha-do-certificado"
// }
```

### 5. Monitoramento de validade via cron NestJS

```typescript
// certificate/certificate-monitor.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CertificateService } from './certificate.service';

@Injectable()
export class CertificateMonitorCron {
  private readonly logger = new Logger(CertificateMonitorCron.name);

  constructor(private readonly certService: CertificateService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async verificarTodosOsCertificados(): Promise<void> {
    // Buscar todos os municípios com certificado cadastrado
    // e verificar validade de cada um
    this.logger.log('Iniciando verificação diária de validade de certificados...');

    // certService.cache é privado — use um método público de introspection
    // ou consulte um repositório de municípios ativos
    const municipios = await this.municipioRepo.findAtivos();

    for (const municipio of municipios) {
      try {
        const cert = await this.certService.carregarCertificadoP12(municipio.ibge);
        const diasRestantes = Math.floor(
          (cert.validoAte.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );

        if (diasRestantes <= 30) {
          // Disparar alerta: webhook Slack, email, PagerDuty
          this.logger.warn(`[ALERTA] Certificado ${municipio.ibge} vence em ${diasRestantes}d`);
        }
      } catch (e) {
        this.logger.error(`Erro ao verificar certificado de ${municipio.ibge}: ${e.message}`);
      }
    }
  }
}
```

## Armadilhas

- **NUNCA commitar .p12 no Git**: o arquivo contém a chave privada da prefeitura. Se vazar, qualquer pessoa pode emitir notas fiscais em nome do município. Use `.gitignore` e secrets manager. Adicionar `*.p12` e `*.pfx` ao `.gitignore` global.
- **A3 em servidor automatizado**: certificado A3 exige hardware presente. Não tem como usar em EC2/ECS sem hardware físico ou módulo HSM caro. Se o cliente insistir em A3, a única saída é um agente local na rede da prefeitura (proxy de assinatura) que recebe o payload, assina com o token A3 e encaminha ao Serpro.
- **Timezone no campo de assinatura**: o campo `sigT` do JAdES e `dhEmi` do payload MND devem estar no fuso de Brasília (`-03:00`). `new Date().toISOString()` retorna UTC (`Z`). O Serpro valida coerência entre o timestamp no payload e na assinatura — se divergirem em fuso, a nota pode ser rejeitada.
- **Certificado de homologação vs produção**: são certificados diferentes, emitidos por ACs diferentes. O certificado de produção não funciona em `hml-nfse` e vice-versa. Manter variáveis de ambiente separadas por ambiente.
- **Cadeia incompleta no x5c**: o header JAdES `x5c` deve conter a cadeia completa (cert folha + todas as intermediárias até a raiz ICP-Brasil). Se o .p12 não incluir as intermediárias, o Serpro pode rejeitar por cadeia incompleta. Verificar com `openssl pkcs12 -in cert.p12 -nokeys` se as intermediárias estão presentes.
- **Canonicalização C14N incorreta**: o algoritmo de canonicalização XML (C14N) é crítico para XAdES. Se a canonicalização não for feita corretamente, o digest não bate e a assinatura é inválida. Use `xml-crypto` em produção, não implemente C14N manualmente.
- **Cache de certificado com cert expirado**: o cache em memória do `CertificateService` não expira automaticamente. Se um certificado for renovado, é necessário limpar o cache ou reiniciar o processo. Implementar TTL no cache ou endpoint de `DELETE /admin/certificados/:municipio/cache`.

## Referências

- [ICP-Brasil — ITI](https://www.iti.gov.br/icp-brasil)
- [RFC 7515 — JSON Web Signature (JWS)](https://www.rfc-editor.org/rfc/rfc7515)
- [ETSI TS 119 182 — JAdES](https://www.etsi.org/deliver/etsi_ts/119100_119199/11918201/)
- [ETSI EN 319 132 — XAdES](https://www.etsi.org/deliver/etsi_en/319100_319199/31913201/)
- [node-forge — npm](https://www.npmjs.com/package/node-forge)
- [xml-crypto — npm (C14N correto)](https://www.npmjs.com/package/xml-crypto)
- [MP 2.200-2/2001 — Validade jurídica da assinatura digital no Brasil](http://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm)
