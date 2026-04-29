---
title: "Saga — orquestração vs coreografia"
category: padroes-backend
stack: [NestJS, Go]
tags: [saga, microservices, integração]
excerpt: "Quando uma operação de negócio cruza múltiplos serviços, troque transação distribuída por sequência de passos compensáveis."
related: [outbox-pattern, event-driven, microservices-quando-usar]
updated: 2026-04
---

## O cenário

`AprovarVenda` precisa: reservar estoque (svc estoque), gerar fatura (svc financeiro), emitir NF (svc fiscal). 3 serviços. Não dá pra fazer em 1 transação SQL.

## Saga

Sequência de **passos**. Cada passo tem uma **compensação** (desfazer). Se algo falha no meio, roda compensações dos passos já executados.

## Coreografia (event-driven)

Cada serviço reage a evento e emite o próximo:

```
Vendas → PedidoConfirmado
Estoque consome → ItensReservados | ItensIndisponiveis
Financeiro consome ItensReservados → FaturaGerada
Fiscal consome FaturaGerada → NFEmitida
```

Sem orquestrador central. Simples até ter ramificação ou compensação. Aí vira espaguete de eventos.

## Orquestração (state machine)

Um **orquestrador** dirige. Conhece a sequência, dispara comandos, ouve respostas, decide o próximo passo.

```ts
class AprovarVendaSaga {
  async run(pedidoId: string) {
    try {
      const reserva = await this.estoque.reservar(pedidoId);
      try {
        const fatura = await this.financeiro.gerarFatura(pedidoId);
        try {
          await this.fiscal.emitirNF(fatura.id);
        } catch (e) {
          await this.financeiro.cancelarFatura(fatura.id);
          await this.estoque.devolverReserva(reserva.id);
          throw e;
        }
      } catch (e) {
        await this.estoque.devolverReserva(reserva.id);
        throw e;
      }
    } catch (e) {
      await this.notificar(pedidoId, 'falhou', e);
    }
  }
}
```

Em produção, use lib (Temporal, Conductor, Camunda) que persiste estado entre passos. Implementação manual quebra em retries, restart, timeout.

## Quando usar qual

- **Coreografia**: ≤ 3 serviços, fluxo linear, pouca compensação. Acoplamento mínimo.
- **Orquestração**: fluxos complexos, compensação real necessária, observabilidade central importante.

## Compensação ≠ rollback

Compensação é uma **operação de negócio nova** que reverte (estorno, cancelamento). Não é rollback de transação. Pode falhar, ter logs próprios, exigir intervenção humana.

## Ferramentas em 2026

- **Temporal** (TypeScript SDK maduro). Padrão pra orquestração séria.
- **Restate** (alternativa nova, mais leve).
- Built-in se você tem ≤ 2 sagas e topa código manual.

## Como pedir pra IA

> "Implemente saga `AprovarVenda` com Temporal + Nest. 3 atividades: `reservarEstoque`, `gerarFatura`, `emitirNF`. Cada uma tem compensação (`devolverReserva`, `cancelarFatura`, `cancelarNF`). Retry com backoff exponencial em falha temporária. Em falha final, dispara workflow `NotificarFalhaVenda`. Persistência de estado pelo próprio Temporal."

## Auditoria

- [ ] Cada passo tem compensação documentada e implementada.
- [ ] Retries têm idempotência garantida no destino.
- [ ] Estado da saga é persistido (não morre se a app reiniciar).
- [ ] Há alerta se saga roda compensação (sinal de problema).
- [ ] Logs/tracing mostram saga inteira como uma unidade.
- [ ] Compensações não falham em silêncio (têm retry + alerta humano se persistir).
