---
title: "Integração SEFAZ Brasil — NFe/NFCe/MDFe (NT 2016.002)"
category: stack-guides
stack: [Node.js, SEFAZ]
tags: [sefaz, nfe, nfce, mdfe, fiscal, brasil, soap, xml-signing]
excerpt: "Integrar com SEFAZ é diferente de qualquer outra API: SOAP (não REST), XML assinado (SHA-1, não SHA-256), polling assíncrono em modelo 55, certificado A1, schema imenso, particularidades por estado. Erro 225 é o mais frequente."
related: [certificado-digital-a1, gateway-compliance, decimal-money]
updated: 2026-04
---

## O cenário

NFe (modelo 55), NFCe (modelo 65), MDFe (modelo 58), NFSe (municipal) são documentos fiscais que precisam ser autorizados pela SEFAZ antes de venda/transporte/serviço. Cada estado tem **seu** webservice. Há sefaz centralizado (SVRS, SVAN) pra estados que não rodam o próprio. NT (Nota Técnica) muda regras anualmente.

## Modelos e ambientes

| Modelo | Tipo | Async/Sync | Cancel |
|---|---|---|---|
| **55** | NFe (B2B) | **Assíncrono** (lote + recibo + polling) | até 24h após emissão |
| **65** | NFCe (B2C cupom) | **Síncrono** | até **30 minutos** (não 24h) |
| **58** | MDFe (transporte) | Síncrono | regra própria |
| NFSe | serviço municipal | Varia (Betha, Nacional, custom) | varia |

**Ambientes**: 1 = produção; 2 = homologação. CRT da empresa decide regime tributário (Simples, Normal). Erre o ambiente em dev e gera nota fiscal de verdade.

## Stack mínima

- **Node 20+** com TS
- **xml-crypto** ou **xmldsigjs** — assinatura XML
- **node-forge** — parsing PFX (PKCS#12), AES
- **xmlbuilder2** — construir XML estruturado
- **fast-xml-parser** — parsear resposta SEFAZ
- **axios** ou **node-fetch** com agent customizado pra mTLS

## As armadilhas que custam dias

### 1. SHA-1 (não SHA-256) na assinatura
**NT 2016.002** define SHA-1 como padrão. Vários gateways tentam SHA-256 e levam **erro 225** ("Falha no Schema XML"). Confira:
```ts
sig.signingKey = pfx.privateKey;
sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
sig.addReference(
  "//*[local-name(.)='infNFe']",
  ['http://www.w3.org/2000/09/xmldsig#enveloped-signature',
   'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'],
  'http://www.w3.org/2000/09/xmldsig#sha1'  // digest também SHA-1
);
```

### 2. Polling assíncrono modelo 55
NFe vai pra fila. Você manda, recebe `nRec` (recibo), depois faz polling:
```ts
// 1. enviar lote → nRec
const nRec = await enviarLote(xml);

// 2. polling (3s, max 10x)
for (let i = 0; i < 10; i++) {
  await sleep(3000);
  const ret = await consultaRecibo(nRec);
  if (ret.cStat === '104') return ret; // autorizada
  if (ret.cStat === '105') continue;    // ainda processando
  throw new Error(ret.xMotivo);          // outro código = erro
}
return { status: 'processando' };
```

NFCe (65) é síncrono — devolve cStat na hora.

### 3. Cancelamento — janelas DIFERENTES
- NFe (55): 24h via evento de cancelamento (CC-e ou cancelamento total).
- NFCe (65): **30 minutos**. Depois disso, só "inutilização" ou nota de devolução. Erro comum: aceitar cancel após 30min e devolver erro feio do SEFAZ.

### 4. UF e webservices
Cada UF tem URL diferente. Tabelas mudam. Use uma config central:
```ts
const SEFAZ_URLS: Record<string, { autoriz: string; consulta: string; ... }> = {
  RS: { autoriz: 'https://nfe.sefazrs.rs.gov.br/...', ... },
  SP: { ... },
  // ...
};
```

Estados que não têm webservice próprio usam SVRS (Sefaz RS) ou SVAN.

### 5. Certificado A1 e mTLS
Certificado é exigido tanto pra **assinatura** quanto pra **TLS** com SEFAZ. Configure agent HTTPS:
```ts
import https from 'https';
const agent = new https.Agent({
  pfx: certBuffer,
  passphrase: certPassword,
  rejectUnauthorized: true,
});
axios.post(url, xml, { httpsAgent: agent });
```

### 6. Validação de schema XSD
SEFAZ valida o XML contra XSD. Erros de tag fora de ordem dão `cStat 225`. Use validador antes de enviar:
```ts
import { XMLValidator } from 'fast-xml-parser';
const valid = XMLValidator.validate(xml);
```
Pra schemas oficiais, baixar de http://www.nfe.fazenda.gov.br

### 7. Códigos cStat — top 20 que você verá

| cStat | Significado |
|---|---|
| 100 | Autorizado o uso da NFe |
| 101 | Cancelamento homologado |
| 103 | Lote recebido |
| 104 | Lote processado |
| 105 | Lote em processamento |
| 108 | Serviço Paralisado momentaneamente |
| 109 | Serviço Paralisado |
| 110 | Uso denegado |
| 215 | Falha no Schema XML do lote |
| 225 | Falha no Schema da NFe |
| 233 | Município emitente diverge |
| 280/281 | Certificado revogado/inválido |
| 539 | Duplicidade |
| 656 | Consumo indevido (rate limit do SEFAZ) |

## Estrutura de gateway recomendada

Ver card [gateway-compliance](../padroes-backend/gateway-compliance.md). Aplicado a SEFAZ:

```
gateways/sefaz/
  ├── sefaz.gateway.ts        # interface única emitirNFe/cancelar/consultar
  ├── builders/
  │    ├── nfe.builder.ts      # monta XML modelo 55
  │    ├── nfce.builder.ts     # modelo 65
  │    └── mdfe.builder.ts
  ├── signer/
  │    └── xml-signer.ts       # assina SHA-1 + C14N
  ├── soap-client.ts           # axios com mTLS
  ├── codes.ts                 # cStat → erro do domínio
  └── urls.ts                  # webservices por UF + ambiente
```

## Webhook de eventos SEFAZ (opcional)

SEFAZ não envia webhook por padrão. O que você costuma ter:
- **Asaas/iugu/Stripe** = webhook quando pagamento confirma → emite NFCe.
- **Marketplace** = webhook de pedido pago → emite NFe.

Cron diário rodando `/api/admin/reconciliar-sefaz`: compara seu banco vs status real no SEFAZ (consulta protocolo). Pega divergências (autorizada local, cancelada lá; ou vice-versa).

## Checklist

- [ ] Certificado A1 criptografado AES-256-GCM no banco (ver [certificado-digital-a1](../auth/certificado-digital-a1)).
- [ ] Senha em chave **separada**.
- [ ] Assinatura SHA-1, não SHA-256.
- [ ] Validação XSD antes de enviar.
- [ ] Polling com timeout total (~30s) modelo 55.
- [ ] Cancel NFCe respeita 30min, NFe respeita 24h.
- [ ] cStat traduzido pra erro tipado do domínio.
- [ ] Cron de reconciliação SEFAZ ↔ banco local.
- [ ] Logs sem CNPJ do destinatário consumidor (LGPD).
- [ ] Ambiente 1/2 controlado por env, não por código no controller.
