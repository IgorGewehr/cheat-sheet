---
title: "Go: Testes de Contrato para SDD"
category: testes
stack: [Go, OpenAPI, Chi]
tags: [contract-testing, openapi, sdd, golang, api-testing]
excerpt: "Como garantir que uma API Go continua obedecendo a OpenAPI: validação de request, response, status codes, exemplos e backward compatibility."
related: [go-sdd-openapi, sdd-openapi-nestjs, go-chi-http]
updated: "2026-05-08"
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

## Três níveis de teste de contrato

| Nível | O que prova | Exemplo |
|---|---|---|
| Schema | payload segue OpenAPI | response tem campos e tipos certos |
| Semântica HTTP | status e headers estão corretos | conflito retorna `409`, não `500` |
| Compatibilidade | mudança não quebra consumidor | campo obrigatório não foi removido/adicionado sem versão |

O primeiro nível pega formato. O segundo pega design de API. O terceiro pega evolução de produto.

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

Teste também erro, não só caminho feliz:

```go
func TestPayInvoice_AlreadyPaidContract(t *testing.T) {
	router := newTestRouterWithState(t, alreadyPaidInvoice())

	req := httptest.NewRequest(http.MethodPost, "/v1/invoices/inv_123/pay", strings.NewReader(`{
	  "paidAt": "2026-05-08T10:00:00Z"
	}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Idempotency-Key", "test-key-123456789")

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusConflict, rec.Code)
	assertJSONPath(t, rec.Body.Bytes(), "$.error.code", "invoice_already_paid")
	assertResponseMatchesOpenAPI(t, "payInvoice", rec)
}
```

Sem teste de erro, você descobre tarde que o frontend não consegue tratar falhas.

## Teste de request inválido

Contrato também precisa rejeitar entrada errada:

```go
func TestCreateInvoice_RejectsUnknownField(t *testing.T) {
	router := newTestRouter(t)

	req := httptest.NewRequest(http.MethodPost, "/v1/invoices", strings.NewReader(`{
	  "customerId": "cus_123",
	  "amountCents": 5000,
	  "currency": "BRL",
	  "debug": true
	}`))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	require.Equal(t, http.StatusBadRequest, rec.Code)
	assertResponseMatchesOpenAPI(t, "createInvoice", rec)
}
```

Essa decisão depende da sua política de API. Em APIs públicas, rejeitar campo desconhecido pode ser desejável para evitar contrato ambíguo. Em alguns cenários, tolerância pode ser melhor. O ponto é decidir conscientemente.

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

## Snapshot de spec não basta

Comparar arquivo OpenAPI em snapshot pega diffs, mas não sabe se eles são seguros. Uma mudança pequena pode ser breaking; uma grande pode ser compatível.

O que revisar em PR:

- algum campo obrigatório mudou?
- enum ficou mais restrito?
- status code mudou?
- erro mudou de `409` para `500`?
- header obrigatório foi adicionado?
- formato de data/dinheiro mudou?
- operação idempotente perdeu `Idempotency-Key`?

## Exemplos como teste

Exemplos da spec devem ser reais. Se exemplo não passa no validador, ele ensina mentira.

## Contract tests com IA

Ao usar IA para implementar endpoint, peça primeiro os testes de contrato:

```text
Implemente testes de contrato para a operação payInvoice da OpenAPI.
Cubra:
- 200 no pagamento válido;
- 409 para invoice já paga;
- 400 sem Idempotency-Key;
- 422 para paidAt inválido;
- response sempre compatível com ErrorResponse.
Use httptest e router real.
Não mocke o handler.
```

Depois peça a implementação até os testes passarem. Isso coloca a IA para trabalhar sob contrato, não sob improviso.

## Critério de domínio

Você dominou este card quando PR que muda handler ou schema falha automaticamente se quebrar o contrato público.
