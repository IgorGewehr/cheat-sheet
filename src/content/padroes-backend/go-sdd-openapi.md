---
title: "Go: SDD com OpenAPI"
category: padroes-backend
stack: [Go, OpenAPI, Chi]
tags: [spec-driven-development, openapi, contract-first, api-design, golang]
excerpt: "Spec-Driven Development em Go: contrato antes do código, geração controlada, validação de request/response e testes que protegem a API."
related: [sdd-openapi-nestjs, go-contract-sdd-tests, dto-validation]
updated: "2026-05-08"
---

## O que é SDD

SDD, Spec-Driven Development, é desenvolver a API a partir de uma especificação executável. No backend HTTP, essa especificação normalmente é OpenAPI.

Em vez de implementar endpoints e documentar depois, você define primeiro:

- recursos;
- métodos;
- payloads;
- status codes;
- erros;
- autenticação;
- paginação;
- idempotência;
- exemplos.

O contrato vira artefato de engenharia, não enfeite.

## A função intelectual do SDD

SDD força você a pensar antes da implementação:

- Qual operação existe no negócio?
- Qual recurso HTTP representa essa operação?
- Quais erros são parte normal do domínio?
- O endpoint é idempotente?
- O cliente pode repetir a requisição?
- A resposta contém dado suficiente sem expor detalhe interno?
- O contrato continua compatível com clientes antigos?

Quando a IA escreve a sintaxe, o contrato vira seu instrumento de direção. Você não pede "crie endpoint"; você entrega uma spec e exige implementação que obedece a ela.

## Fluxo recomendado

1. Escreva `api/openapi.yaml`.
2. Revise nomes, status codes e modelos antes de codar.
3. Gere tipos/servidor com uma ferramenta como `oapi-codegen` quando fizer sentido.
4. Implemente handlers que satisfazem a interface gerada.
5. Valide requests e responses em testes.
6. Publique a spec no pipeline ou no ambiente interno.

## Workflow completo

```text
1. Domain sketch
   Entenda entidades, comandos, eventos e invariantes.

2. API sketch
   Desenhe endpoints, status codes e payloads.

3. OpenAPI
   Escreva contrato revisável por humanos e ferramentas.

4. Generation
   Gere tipos de borda e interfaces, não domínio.

5. Implementation
   Handler traduz HTTP -> command -> use case -> response.

6. Contract tests
   httptest valida se implementação respeita a spec.

7. Client generation
   Clientes internos usam spec versionada quando fizer sentido.
```

Esse fluxo evita o clássico "o backend implementou uma coisa, o frontend entendeu outra".

## Exemplo de contrato

```yaml
paths:
  /v1/invoices:
    post:
      operationId: createInvoice
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateInvoiceRequest"
      responses:
        "201":
          description: Invoice created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Invoice"
        "409":
          description: Business conflict
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
```

Uma versão mais útil inclui idempotência, validação e erros explícitos:

```yaml
paths:
  /v1/invoices/{invoiceId}/pay:
    post:
      operationId: payInvoice
      parameters:
        - name: invoiceId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string
            minLength: 16
            maxLength: 128
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PayInvoiceRequest"
      responses:
        "200":
          description: Invoice paid or previous equivalent response returned
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Invoice"
        "409":
          description: Invoice cannot transition to paid
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
        "422":
          description: Request is syntactically valid but semantically invalid
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
```

Repare na diferença: o contrato diz que `POST` crítico exige `Idempotency-Key`. Isso muda arquitetura, banco e testes.

## O que gerar e o que não gerar

Geração é ótima para:

- tipos de request/response;
- interfaces de handlers;
- validação de schema;
- cliente HTTP interno;
- documentação.

Geração é perigosa para:

- domínio;
- casos de uso;
- repositórios;
- transações;
- política de retry;
- regra de negócio.

Regra: gere bordas, escreva o centro.

## Handler como tradutor

Com SDD, o handler não deve inventar regra. Ele faz tradução:

```go
func (h Handler) PayInvoice(w http.ResponseWriter, r *http.Request, invoiceID uuid.UUID) {
	idempotencyKey := r.Header.Get("Idempotency-Key")
	if idempotencyKey == "" {
		writeError(w, http.StatusBadRequest, "missing_idempotency_key")
		return
	}

	var body PayInvoiceRequest
	if err := decodeAndValidate(w, r, &body); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "validation_failed")
		return
	}

	cmd := invoice.PayCommand{
		InvoiceID:      invoice.ID(invoiceID.String()),
		IdempotencyKey: idempotencyKey,
		PaidAt:         body.PaidAt,
	}

	out, err := h.payInvoice.Execute(r.Context(), cmd)
	if err != nil {
		h.writeDomainError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, mapInvoiceResponse(out))
}
```

O handler conhece DTO e HTTP. O use case conhece command e domínio. O domínio conhece invariantes.

## Termos técnicos

- `operationId`: nome estável da operação; útil para geração de código.
- `schema`: definição estrutural de payload.
- `contract test`: teste que verifica se implementação e contrato continuam compatíveis.
- `breaking change`: mudança que quebra clientes existentes.
- `backward compatibility`: capacidade de evoluir sem quebrar consumidores.
- `semantic validation`: validação de significado, não só formato. Exemplo: moeda suportada.
- `idempotent operation`: operação que pode ser repetida sem duplicar efeito.
- `error taxonomy`: catálogo estável de erros que clientes conseguem tratar.
- `consumer-driven contract`: contrato validado a partir das expectativas de consumidores.

## Critérios de uma boa spec

Uma spec sênior deixa claro:

- quais campos são obrigatórios;
- qual formato de datas e dinheiro;
- quais erros de domínio existem;
- se `POST` é idempotente ou não;
- como paginação funciona;
- qual header carrega idempotency key;
- quais endpoints exigem auth;
- exemplos reais de request e response.

## Erros como produto

Erros não devem ser improvisados. Defina um envelope:

```json
{
  "error": {
    "code": "invoice_already_paid",
    "message": "Invoice is already paid",
    "details": {
      "invoiceId": "..."
    }
  }
}
```

`message` pode mudar. `code` não deveria mudar sem versão. Clientes e suporte operam em cima de `code`.

## Checklist de revisão SDD

Antes de implementar, revise:

- O nome do recurso expressa domínio ou detalhe técnico?
- Há diferença clara entre `400`, `401`, `403`, `404`, `409` e `422`?
- Campos monetários evitam float?
- Datas têm timezone/formato definido?
- POST crítico é idempotente?
- Existe paginação em listagens?
- A spec expõe campos internos desnecessários?
- O contrato permite evolução compatível?
- Exemplos batem com schemas?

## Critério de domínio

Você dominou este card quando consegue revisar uma OpenAPI como contrato de produto e detectar ambiguidades antes de elas virarem bug em dois serviços diferentes.
