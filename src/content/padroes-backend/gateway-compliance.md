---
title: "Gateway Pattern para APIs externas críticas (SEFAZ, Asaas, Stripe)"
category: padroes-backend
stack: [Node.js, TypeScript]
tags: [gateway, integracoes, sefaz, asaas, circuit-breaker, fiscal]
excerpt: "APIs externas falham. Lentidão, 5xx, timeout, mudança silenciosa de schema. Sem gateway dedicado, o erro vaza pro domínio. Gateway = adapter + retry + circuit breaker + log estruturado + tipagem do contrato deles."
related: [repository-pattern, observability, omnichannel-conversations]
updated: 2026-04
---

## A definição

Um **Gateway** é a única classe/módulo do sistema que conhece a API externa. Ninguém mais. Tudo que sai do seu domínio e bate em "fora" passa por ele:

```
Domain (UseCase)
   ↓ chama gatewayFiscal.emitirNFe(dadosDoDominio)
Gateway (Adapter)
   ↓ converte → schema da SEFAZ
   ↓ assina, envia SOAP, faz polling
   ↓ converte → resposta do domínio
   ↑ ou lança erro tipado do domínio
External API (SEFAZ, Asaas, Stripe…)
```

## Por que isolar

1. **Schema deles muda** — SEFAZ muda em NTs, Stripe muda em versions. Você quer 1 lugar pra ajustar, não 30.
2. **Erros precisam ser traduzidos** — `HTTP 500` da SEFAZ não é `Internal error` pro seu domínio. É `EmissaoTemporariamenteIndisponivel`. Tradução acontece no gateway.
3. **Lentidão deles vira sua** — sem timeout/circuit breaker, request lento prende worker. Gateway tem responsabilidade de proteger seu sistema.
4. **Compliance e logs** — toda integração fiscal/financeira precisa de log estruturado pra auditoria. Gateway centraliza isso.

## Anatomia mínima

```ts
class SefazGateway {
  constructor(
    private http: HttpClient,
    private signer: XmlSigner,
    private logger: Logger,
    private metrics: Metrics,
  ) {}

  async emitirNFe(input: EmitirNFeInput): Promise<EmitirNFeOutput> {
    const tracingId = randomUUID();
    const start = Date.now();
    try {
      const xmlAssinado = this.signer.sign(this.buildXml(input));
      const resp = await this.http.post(this.url, xmlAssinado, {
        timeout: 30_000,
        headers: { 'Content-Type': 'application/soap+xml' },
      });
      const parsed = this.parseResp(resp.data);

      if (parsed.status === 'rejeitada') {
        throw new NFeRejeitadaError(parsed.motivo, parsed.codigo);
      }
      this.metrics.histogram('sefaz.nfe.latency_ms', Date.now() - start);
      return this.toOutput(parsed);
    } catch (err) {
      this.logger.error({ tracingId, op: 'emitirNFe', cnpj: input.cnpj, err });
      if (err instanceof TimeoutError) throw new SefazIndisponivel();
      throw err; // traduzido ou propagado
    }
  }
}
```

## Os 6 elementos não-negociáveis

### 1. Timeout explícito
**Sempre**. Default do Node http é "infinito" — significa worker preso. SEFAZ p99 é ~5s; configure 30s e estoure depois.

### 2. Retry idempotente com backoff
Só retentar quando seguro: `GET`, `consulta`, `5xx`. **Nunca** retentar `POST emitir` sem chave de idempotência (você emite 2 NFes pro mesmo CNPJ). Backoff exponencial: 1s, 2s, 4s, max 3 tentativas.

### 3. Circuit breaker
Após N falhas seguidas, abre o circuito por T segundos: gateway falha rápido sem nem tentar a chamada. Evita avalanche quando provedor cai.
```ts
import CircuitBreaker from 'opossum';
this.breaker = new CircuitBreaker(this.callSefaz, {
  timeout: 30_000,
  errorThresholdPercentage: 50,
  resetTimeout: 60_000,
});
```

### 4. Erros tipados do domínio
Não vaze `AxiosError` pro UseCase. Crie hierarquia:
```ts
class IntegrationError extends Error {}
class SefazIndisponivel extends IntegrationError {}
class NFeRejeitadaError extends IntegrationError { codigo!: string; }
class CertificadoInvalido extends IntegrationError {}
```
UseCase capta os tipos certos. UI mostra mensagem útil.

### 5. Log estruturado com correlation
```ts
logger.info({
  op: 'emitirNFe', tracingId, cnpj, modelo,
  durationMs, status, errorCode
});
```
Sem `console.log`. Sem payload sensível (CNPJ ok, certificado e CPF do destinatário tirar).

### 6. Métrica de latência e taxa de erro
Pelo menos: histograma de latência + counter de erro por código. Alerta quando p95 > X ou error rate > Y%.

## Anti-patterns reais

- Chamar `axios.post('https://sefaz...')` direto no controller. Acopla domínio ao formato externo.
- Try/catch genérico engolindo erro: `catch { return null }`. Bug oculto, suporte vira inferno.
- Retry de operação não-idempotente.
- Logar XML inteiro no info — vaza CPF do consumidor (LGPD).
- Sem timeout — fila de jobs acumula.
- Mock global "se for dev, retorna sucesso" — esconde bug em homolog.

## Variantes por API

| API | Particularidade | Cuidado especial |
|---|---|---|
| **SEFAZ** | SOAP, certificado A1, NTs frequentes | SHA-1 padrão, polling assíncrono NFe modelo 55 |
| **Asaas** | REST + webhook | Validar webhook signature; idempotency-key em criação |
| **Stripe** | REST + webhook + retries oficiais | Use stripe-node SDK; sempre `Stripe-Signature` em webhook |
| **Meta (WhatsApp)** | Graph API + webhook | Token rotation; rate limit por número |
| **OpenAI/Anthropic** | REST streaming | Tokens cost; retry com backoff em 429; cache em prompts repetidos |

## Checklist de novo gateway

- [ ] Classe/módulo único — domínio não importa o cliente HTTP.
- [ ] Timeout configurado.
- [ ] Retry só onde idempotente, com backoff.
- [ ] Circuit breaker configurado.
- [ ] Erros traduzidos pra hierarquia do domínio.
- [ ] Log estruturado com tracingId.
- [ ] Métrica de latência e erro.
- [ ] Schema dos requests/responses tipado (zod ou interface).
- [ ] Mock de teste cobrindo: sucesso, 4xx, 5xx, timeout, circuito aberto.
