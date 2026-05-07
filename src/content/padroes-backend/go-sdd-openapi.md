---
title: "Go: SDD com OpenAPI"
category: padroes-backend
stack: [Go, OpenAPI, Chi]
tags: [spec-driven-development, openapi, contract-first, api-design, golang]
excerpt: "Spec-Driven Development em Go: contrato antes do código, geração controlada, validação de request/response e testes que protegem a API."
related: [sdd-openapi-nestjs, go-contract-sdd-tests, dto-validation]
updated: "2026-05-07"
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

## Fluxo recomendado

1. Escreva `api/openapi.yaml`.
2. Revise nomes, status codes e modelos antes de codar.
3. Gere tipos/servidor com uma ferramenta como `oapi-codegen` quando fizer sentido.
4. Implemente handlers que satisfazem a interface gerada.
5. Valide requests e responses em testes.
6. Publique a spec no pipeline ou no ambiente interno.

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

## Termos técnicos

- `operationId`: nome estável da operação; útil para geração de código.
- `schema`: definição estrutural de payload.
- `contract test`: teste que verifica se implementação e contrato continuam compatíveis.
- `breaking change`: mudança que quebra clientes existentes.
- `backward compatibility`: capacidade de evoluir sem quebrar consumidores.

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

## Critério de domínio

Você dominou este card quando consegue revisar uma OpenAPI como contrato de produto e detectar ambiguidades antes de elas virarem bug em dois serviços diferentes.
