---
title: "Go + Redis: Cache, Idempotência e Rate Limit"
category: infra
stack: [Go, Redis]
tags: [redis, cache, idempotency, rate-limit, golang]
excerpt: "Redis em serviços Go sem folclore: cache-aside, TTL, idempotency keys, locks com cautela e rate limiting distribuído."
related: [caching-layers, rate-limit-distribuido, go-outbox-idempotency]
updated: "2026-05-07"
---

## Redis é rápido, não é verdade absoluta

Redis é ótimo para dados temporários e acesso rápido. Ele não substitui PostgreSQL como fonte de verdade para dados críticos.

Use Redis para:

- cache;
- idempotency keys;
- rate limit;
- sessões temporárias;
- deduplicação curta;
- coordenação simples.

Evite usar Redis como banco principal de dados financeiros, fiscais ou auditáveis.

## Cache-aside

Fluxo:

1. tenta ler do Redis;
2. se miss, lê do Postgres;
3. grava no Redis com TTL;
4. retorna.

```go
func (s Service) GetInvoice(ctx context.Context, id string) (InvoiceDTO, error) {
	key := "invoice:" + id
	if cached, ok := s.cache.Get(ctx, key); ok {
		return cached, nil
	}

	inv, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return InvoiceDTO{}, err
	}

	dto := mapDTO(inv)
	_ = s.cache.Set(ctx, key, dto, 5*time.Minute)
	return dto, nil
}
```

Cache falhar não deveria derrubar leitura crítica se o banco está saudável.

## Idempotency key

Idempotência garante que repetir a mesma operação não duplica efeito.

Para `POST /payments`, aceite header:

```text
Idempotency-Key: 7b2c...
```

Armazene:

- chave;
- hash do request;
- status;
- response;
- TTL;
- usuário/tenant.

Se a mesma chave vier com payload diferente, retorne conflito.

## Locks distribuídos

Use locks com cautela. Muitos problemas são melhor resolvidos com unique constraint, transação e `SELECT FOR UPDATE`.

Se usar Redis lock:

- tenha TTL;
- use token único;
- lib bem testada;
- entenda falhas de rede;
- não proteja invariantes financeiras só com lock em cache.

## Critério de domínio

Você dominou este card quando sabe dizer quais dados podem ser eventualmente inconsistentes, qual TTL é aceitável e onde Postgres ainda precisa ser a autoridade final.
