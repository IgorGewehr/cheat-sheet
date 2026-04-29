---
title: "Armadilha IA: Síncrono Onde Deveria Ser Fila"
category: armadilhas-ia
tags: [performance, filas, jobs, scalability, infra]
stack: [NestJS, BullMQ, Redis, PostgreSQL]
excerpt: A IA executa operações pesadas dentro do request HTTP — email, PDF, notificações, integrações externas. O usuário espera 30s e o servidor fica travado.
related: [background-jobs, outbox-pattern, observability, event-driven]
updated: "2026-04"
---

## O que a IA faz (tudo síncrono no request)

```typescript
// IA executa tudo dentro da requisição — bloqueante
@Post('orders')
async createOrder(@Body() dto: CreateOrderDto) {
  const order = await this.ordersService.create(dto);

  // 🚨 Tudo isso dentro do request HTTP
  await this.emailService.sendConfirmation(order);          // 2-5s
  await this.pdfService.generateInvoice(order);             // 3-8s
  await this.erpService.syncOrder(order);                   // 1-10s (API externa)
  await this.notificationService.notifyAll(order);          // variável
  await this.analyticsService.trackPurchase(order);         // 1-3s

  return order;  // usuário esperou 7-26 segundos
}
```

Se o serviço de email cair: o pedido não é criado, o usuário perde o carrinho.

## Quando usar fila

- Email / SMS / push notification
- Geração de PDF / relatório
- Integração com ERP / sistema externo
- Processamento de imagem / vídeo
- Qualquer coisa que pode demorar > 500ms
- Qualquer coisa que pode falhar e precisa de retry

## A versão correta com BullMQ

```typescript
// 1. Criação do pedido — apenas o que é necessário para resposta imediata
@Post('orders')
async createOrder(@Body() dto: CreateOrderDto) {
  const order = await this.ordersService.create(dto);

  // Enfileira jobs — não espera execução
  await Promise.all([
    this.orderQueue.add('send-confirmation', { orderId: order.id }),
    this.orderQueue.add('generate-invoice',  { orderId: order.id }),
    this.orderQueue.add('sync-erp',          { orderId: order.id }, { attempts: 5, backoff: 'exponential' }),
  ]);

  return order;  // responde em < 100ms
}

// 2. Workers processam em background
@Processor('orders')
export class OrderProcessor {
  @Process('send-confirmation')
  async sendConfirmation(job: Job<{ orderId: string }>) {
    const order = await this.ordersService.findById(job.data.orderId);
    await this.emailService.sendConfirmation(order);
  }

  @Process('sync-erp')
  async syncErp(job: Job<{ orderId: string }>) {
    const order = await this.ordersService.findById(job.data.orderId);
    await this.erpService.syncOrder(order);
    // BullMQ faz retry automático com backoff se falhar
  }
}
```

## Regra de ouro para design de endpoints

| Operação | Resposta HTTP | Execução |
|---|---|---|
| Salvar no banco | Síncrona | Imediata |
| Validar regra de negócio | Síncrona | Imediata |
| Enviar email/SMS | Síncrona (aceito) | Background |
| Integração API externa | Síncrona (aceito) | Background |
| Gerar PDF/relatório | 202 Accepted + jobId | Background |
| Processar pagamento | Síncrona (webhook) | Background |

## Como detectar no code review

- [ ] Endpoints de API fazem chamadas a serviços externos (email, ERP, SMS)?
- [ ] Existe `await` em operações que podem demorar > 500ms dentro do request?
- [ ] Falhas em operações secundárias (email) causam rollback da operação principal?
- [ ] Existe um sistema de filas configurado (BullMQ, SQS, etc.)?
- [ ] Jobs têm retry configurado com backoff exponencial?

## Prompt para evitar esta armadilha

```
Separe o que é ESSENCIAL para a resposta do que é CONSEQUÊNCIA da ação:
- Salvar dados no banco: síncrono
- Email, SMS, notificações push: enfileirar job
- Integrações com APIs externas: enfileirar job com retry
- Geração de documentos pesados: enfileirar, retornar 202 + jobId
Use BullMQ com Redis. Configure attempts e backoff em todos os jobs.
```
