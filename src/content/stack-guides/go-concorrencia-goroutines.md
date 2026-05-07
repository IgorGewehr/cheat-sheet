---
title: "Go: Concorrência com Goroutines, Channels e Worker Pools"
category: stack-guides
stack: [Go]
tags: [golang, goroutines, channels, concurrency, race-detector]
excerpt: "Concorrência idiomática em Go: goroutines, channels, mutexes, worker pools, backpressure e como evitar data races em produção."
related: [go-errors-context, go-rabbitmq-event-driven, go-benchmarks-profiling]
updated: "2026-05-07"
---

## Concorrência não é paralelismo

Concorrência é estruturar o programa para lidar com várias tarefas em progresso. Paralelismo é executar tarefas ao mesmo tempo em múltiplos cores. Go facilita concorrência com goroutines e o runtime decide como escalonar.

Uma goroutine é uma unidade leve de execução:

```go
go func() {
	_ = process()
}()
```

Mas "leve" não significa "grátis". Goroutine sem controle vira vazamento.

## Regra sênior: saiba como a goroutine termina

Toda goroutine precisa de uma condição clara de encerramento:

- channel fechado;
- context cancelado;
- erro fatal propagado;
- worker pool finalizado.

```go
func consume(ctx context.Context, jobs <-chan Job) {
	for {
		select {
		case <-ctx.Done():
			return
		case job, ok := <-jobs:
			if !ok {
				return
			}
			handle(job)
		}
	}
}
```

## Channels comunicam posse

Channel não é fila mágica para tudo. Use channel quando ele expressa transferência de trabalho ou coordenação. Use `sync.Mutex` quando você só precisa proteger estado compartilhado.

Worker pool simples:

```go
func RunWorkers(ctx context.Context, n int, jobs <-chan Job, handle func(context.Context, Job) error) {
	var wg sync.WaitGroup
	wg.Add(n)

	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
			for {
				select {
				case <-ctx.Done():
					return
				case job, ok := <-jobs:
					if !ok {
						return
					}
					_ = handle(ctx, job)
				}
			}
		}()
	}

	wg.Wait()
}
```

## Backpressure

Backpressure é a capacidade do sistema de resistir a excesso de entrada sem colapsar. Em Go, isso aparece em:

- tamanho de buffers;
- número de workers;
- prefetch em RabbitMQ;
- pool de conexões do PostgreSQL;
- timeouts e rate limits.

Se você cria 10 mil goroutines chamando o banco, o gargalo vira o banco e o pool entra em fila. O design correto limita concorrência perto do recurso escasso.

## Race detector

Data race acontece quando duas goroutines acessam a mesma memória ao mesmo tempo e pelo menos uma escreve.

Rode:

```bash
go test -race ./...
```

O race detector não prova ausência de bugs, mas pega uma classe crítica cedo.

## Critério de domínio

Você dominou este card quando consegue apontar onde cada goroutine termina, limitar concorrência por recurso e decidir entre channel, mutex e fila externa sem superstição.
