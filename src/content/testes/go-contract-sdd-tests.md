---
title: "Go: Testes de Contrato para SDD"
category: testes
stack: [Go, OpenAPI, Chi]
tags: [contract-testing, openapi, sdd, golang, api-testing]
excerpt: "Como garantir que uma API Go continua obedecendo a OpenAPI: validação de request, response, status codes, exemplos e backward compatibility."
related: [go-sdd-openapi, sdd-openapi-nestjs, go-chi-http]
updated: "2026-05-07"
---

## Contrato precisa executar

OpenAPI parada no repositório pode mentir. Teste de contrato transforma a spec em verificação automatizada.

Você quer provar:

- endpoint existe;
- método e path batem;
- request inválido falha como descrito;
- response válido segue schema;
- status codes são os previstos;
- erro tem formato estável;
- mudança não quebra cliente.

## Teste handler contra spec

Estratégia:

1. carrega `api/openapi.yaml`;
2. cria router real;
3. executa requests com `httptest`;
4. valida request/response contra OpenAPI.

```go
func TestCreateInvoiceContract(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(http.MethodPost, "/v1/invoices", strings.NewReader(`{
	  "customerId": "cus_123",
	  "amountCents": 5000,
	  "currency": "BRL"
	}`))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusCreated, rec.Code)
	assertResponseMatchesOpenAPI(t, "createInvoice", rec)
}
```

## Backward compatibility

Mudanças geralmente seguras:

- adicionar campo opcional em response;
- adicionar endpoint novo;
- ampliar enum com cuidado quando clientes toleram.

Mudanças perigosas:

- remover campo;
- tornar campo obrigatório;
- mudar tipo;
- mudar status code;
- renomear propriedade;
- alterar semântica de idempotência.

## Exemplos como teste

Exemplos da spec devem ser reais. Se exemplo não passa no validador, ele ensina mentira.

## Critério de domínio

Você dominou este card quando PR que muda handler ou schema falha automaticamente se quebrar o contrato público.
