---
title: "Go: Microsserviços Empresariais de Alto Valor"
category: arquiteturas
stack: [Go, Chi, PostgreSQL, RabbitMQ, Redis, Docker]
tags: [golang, microservices, enterprise, architecture, bounded-context]
excerpt: "Arquitetura para dois microsserviços Go de alto valor: boundaries, dados por serviço, APIs, eventos, idempotência, operação e governança técnica."
related: [microservices-quando-usar, modular-monolith, go-outbox-idempotency]
updated: "2026-05-08"
---

## O que muda quando o serviço custa caro

Em projeto de centenas de milhares de dólares, o problema não é só "fazer endpoint". O sistema precisa sobreviver a:

- mudança de requisito;
- auditoria;
- falha parcial;
- deploy gradual;
- concorrência;
- incidentes;
- entrada de novos devs;
- integração com outros sistemas.

Go ajuda, mas não substitui arquitetura.

## A tese central

Microsserviço não é "um projeto pequeno". Microsserviço é uma unidade sociotécnica: ele junta uma capacidade de negócio, um modelo de dados, um contrato público, um ciclo de deploy e uma responsabilidade operacional.

Quando você desenha microsserviços, você está decidindo onde o sistema pode mudar sem pedir permissão para todo mundo. Essa é a pergunta intelectual importante:

> "Qual parte do negócio precisa evoluir, escalar, falhar e ser operada de forma independente?"

Se a resposta não existe, talvez você ainda precise de um monólito modular.

## Monólito modular antes de microsserviço

Um monólito modular bem feito tem módulos internos fortes, mas deploy único. Microsserviços adicionam rede, observabilidade distribuída, consistência eventual e operação mais difícil.

| Critério | Monólito modular | Microsserviços |
|---|---|---|
| Deploy | único | independente |
| Transação | simples, local | distribuída por design |
| Debug | processo único | logs/traces correlacionados |
| Dados | mesmo banco ou schemas internos | banco por serviço |
| Time pequeno | geralmente melhor | pode ser custo extra |
| Domínio com fronteiras claras | bom | ótimo |
| Escala operacional | limitada pelo todo | por capacidade |

Regra prática: se você não consegue desenhar bons módulos internos, microsserviços só vão distribuir a bagunça pela rede.

## Boundary de serviço

Microsserviço deve representar uma capacidade de negócio com dados próprios. Não divida por tabela nem por controller.

Bons candidatos:

- billing;
- identity;
- notifications;
- ledger;
- document processing;
- risk analysis.

Mau sinal:

- `user-crud-service`;
- `reports-service` lendo banco de todo mundo;
- serviço que só existe porque "microservices é moderno".

## Exemplo de projeto capstone

Para sua stack Go, um bom projeto de estudo é começar com dois serviços, não dez:

```text
billing-service
  Responsabilidade: criar faturas, registrar pagamento, publicar eventos financeiros.
  Dono dos dados: invoices, payments, outbox_events, idempotency_keys.
  API: POST /v1/invoices, POST /v1/invoices/{id}/pay, GET /v1/invoices/{id}.
  Eventos publicados: InvoiceCreated, InvoicePaid, PaymentFailed.

ledger-service
  Responsabilidade: criar lançamentos contábeis a partir de eventos financeiros.
  Dono dos dados: ledger_entries, processed_messages.
  API: GET /v1/ledger/accounts/{id}/entries.
  Eventos consumidos: InvoicePaid.
```

Esse desenho força os problemas certos:

- Billing não escreve no banco do Ledger.
- Ledger não chama Billing para cada evento se o payload já contém o necessário.
- Billing usa outbox para não perder evento.
- Ledger usa deduplicação para tolerar mensagem repetida.
- Ambos têm OpenAPI, migrations, logs, testes e healthchecks próprios.

## Banco por serviço

Cada serviço deve possuir seu schema/dados. Outro serviço não deve ler tabelas internas diretamente.

Integração acontece por:

- API HTTP;
- eventos;
- views/projeções específicas;
- contratos versionados.

## Anti-corruption layer

Anti-corruption layer é uma camada que protege seu domínio de modelos externos. Se um gateway de pagamento chama `amount` de `grossValue` e usa status `SETTLED`, seu domínio não precisa engolir esses nomes.

```go
type PaymentGatewayClient interface {
	Authorize(ctx context.Context, req AuthorizePaymentRequest) (AuthorizePaymentResult, error)
}

func mapGatewayStatus(status string) (payment.Status, error) {
	switch status {
	case "SETTLED":
		return payment.StatusAuthorized, nil
	case "DENIED":
		return payment.StatusDenied, nil
	default:
		return "", payment.ErrUnknownGatewayStatus
	}
}
```

Isso parece detalhe, mas é uma das defesas mais importantes contra acoplamento. Sistemas caros morrem quando modelos externos contaminam o centro.

## Comunicação

Use HTTP quando precisa de resposta imediata e consistência de interação.

Use eventos quando algo aconteceu e outros contextos podem reagir.

Exemplo:

- Billing expõe `POST /v1/invoices`.
- Billing publica `InvoiceCreated`.
- Notification consome e envia e-mail.
- Ledger consome e cria lançamento contábil.

## Matriz de decisão: HTTP ou evento?

| Pergunta | Use HTTP | Use evento |
|---|---|---|
| O usuário está esperando resposta agora? | sim | não necessariamente |
| O chamador precisa saber sucesso/falha imediata? | sim | não |
| Vários serviços podem reagir ao mesmo fato? | não ideal | sim |
| A ordem importa por aggregate? | possível, mas acoplado | possível com chave/partição/roteamento |
| Você aceita consistência eventual? | geralmente não | sim |

Exemplo: `POST /pay` deve responder ao cliente via HTTP. Depois que o pagamento foi registrado, `InvoicePaid` pode disparar ledger, e-mail, antifraude e analytics por evento.

## Falha parcial é o normal

Em microsserviços, falha parcial não é exceção; é o ambiente. Você precisa desenhar respostas para cenários como:

- Billing salvou no banco, mas RabbitMQ caiu.
- Ledger recebeu evento duplicado.
- Redis ficou indisponível.
- Um deploy novo publica evento com campo opcional novo.
- Um consumer está 30 minutos atrasado.
- Um serviço externo está lento e prende goroutines.

Para cada cenário, escreva a defesa:

| Falha | Defesa |
|---|---|
| evento não publicado | outbox |
| evento duplicado | idempotência no consumer |
| serviço lento | timeout + circuit breaker quando necessário |
| fila crescendo | métrica de lag + autoscaling/alerta |
| contrato mudou | versionamento + contract tests |
| banco saturado | pool limitado + backpressure |

## Governança mínima

Cada serviço deve ter:

- OpenAPI;
- README operacional;
- migrations;
- Dockerfile;
- Compose local;
- health/readiness;
- logs estruturados;
- testes unitários e integração;
- checklist de produção;
- ADRs para decisões relevantes.

## Roteiro mental para desenhar um serviço

Antes de escrever handler, responda:

1. Qual capacidade de negócio este serviço possui?
2. Quais aggregates existem?
3. Quais invariantes precisam ser protegidas por transação?
4. Quais dados pertencem a este serviço?
5. Quais dados vêm de fora e precisam de anti-corruption layer?
6. Quais comandos entram por HTTP?
7. Quais fatos saem como eventos?
8. O que acontece se cada dependência cair?
9. Como eu provo isso com teste?
10. Como eu observo isso em produção?

Esse é o trabalho que a IA não pode fazer sozinha por você: decidir o modelo certo do problema.

## Critério de domínio

Você dominou este card quando consegue defender por que dois serviços devem ser separados, qual dado cada um possui e como eles continuam corretos quando RabbitMQ, Redis ou outro serviço falha.
