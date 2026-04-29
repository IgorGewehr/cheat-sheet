---
title: "Armadilha IA: Erro Não Tratado nas Fronteiras"
category: armadilhas-ia
tags: [erros, segurança, api, resiliência]
stack: [NestJS, Next.js, TypeScript]
excerpt: A IA implementa o happy path e ignora o que acontece quando a API externa falha, o banco está indisponível ou o input é inesperado — o servidor crasha e o stack trace vaza pro cliente.
related: [dto-validation, observability, background-jobs]
updated: "2026-04"
---

## O que a IA gera (happy path apenas)

```typescript
// Sem try/catch — qualquer falha crasha o processo ou vaza stack trace
async getPaymentStatus(paymentId: string) {
  const payment = await this.stripeClient.paymentIntents.retrieve(paymentId);
  const order = await this.ordersRepo.findByPaymentId(paymentId);
  return { status: payment.status, order };
}

// O erro do Stripe vira um 500 com stack trace completo no response
// O erro de banco vira um 500 com connection string no log de produção
```

```typescript
// Next.js — erro da API externa exposto diretamente no frontend
export async function GET(req: Request, { params }) {
  const data = await fetch(`https://api.external.com/${params.id}`);
  return NextResponse.json(await data.json());
  // Se a API externa retornar 404, o frontend recebe um response confuso
  // Se a API externa cair, o erro vaza informação interna
}
```

## A versão correta — erros por categoria

```typescript
// Exceções de domínio (erros esperados de negócio)
export class PaymentNotFoundException extends NotFoundException {
  constructor(paymentId: string) {
    super(`Pagamento ${paymentId} não encontrado`);
  }
}

export class PaymentAlreadyRefundedException extends ConflictException {
  constructor() {
    super('Este pagamento já foi estornado');
  }
}

// Service com tratamento por tipo de falha
async getPaymentStatus(paymentId: string) {
  let stripePayment;
  try {
    stripePayment = await this.stripeClient.paymentIntents.retrieve(paymentId);
  } catch (err) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new PaymentNotFoundException(paymentId);
    }
    // Falha de infra — loga e relança como 502
    this.logger.error('Stripe unavailable', { paymentId, err: err.message });
    throw new ServiceUnavailableException('Serviço de pagamento indisponível');
  }

  const order = await this.ordersRepo.findByPaymentId(paymentId);
  if (!order) throw new PaymentNotFoundException(paymentId);

  return { status: stripePayment.status, orderId: order.id };
}
```

```typescript
// Filter global — garante que nenhum stack trace vaza
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json({
        error: exception.message,
        statusCode: exception.getStatus(),
      });
    }

    // Erro inesperado — loga completo, retorna mensagem genérica
    this.logger.error('Unhandled exception', { exception });
    response.status(500).json({
      error: 'Erro interno do servidor',
      statusCode: 500,
    });
  }
}
```

## Como detectar no code review

- [ ] Chamadas a APIs externas estão dentro de try/catch?
- [ ] O catch diferencia erro de negócio (404/409) de erro de infra (502/503)?
- [ ] Nenhum stack trace é retornado diretamente no response?
- [ ] Existe um exception filter global configurado?
- [ ] Erros de infra são logados com contexto suficiente para debug?

## Prompt para evitar esta armadilha

```
Para toda chamada a APIs externas, banco de dados e operações que podem falhar:
1. Envolva em try/catch explícito
2. Diferencie erros de negócio (retorne HTTP semântico: 404, 409, 422)
   de erros de infra (retorne 502/503 com mensagem genérica)
3. Nunca retorne stack traces ou mensagens de erro internas no response
4. Logue erros inesperados com contexto completo (requestId, userId, params)
5. Configure exception filter global como última linha de defesa
```
