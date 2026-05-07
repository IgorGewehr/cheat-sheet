---
title: "Go: Benchmarks, pprof e Performance"
category: testes
stack: [Go, pprof]
tags: [golang, benchmarks, pprof, performance, profiling]
excerpt: "Performance Go com método: benchmarks, allocs, pprof, race detector, load tests e como otimizar sem superstição."
related: [go-observabilidade-zap-otel, nodejs-profiling, go-concorrencia-goroutines]
updated: "2026-05-07"
---

## Não otimize no escuro

Senioridade em performance começa com medição. Antes de trocar estrutura de dados ou criar pool, responda:

- qual SLO está falhando?
- CPU, memória, I/O ou lock?
- qual endpoint ou consumer?
- qual percentil de latência?
- a carga é realista?

## Benchmarks

```go
func BenchmarkCalculateInvoiceTotal(b *testing.B) {
	items := invoiceItemsFixture(100)
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		_ = CalculateInvoiceTotal(items)
	}
}
```

Rode:

```bash
go test -bench=. -benchmem ./...
```

Compare antes/depois com ferramenta apropriada, não com sensação.

## pprof

`pprof` mostra onde o programa gasta CPU, memória, goroutines e blocking.

Em serviço interno, exponha `net/http/pprof` só em porta administrativa protegida.

Perfis úteis:

- CPU profile;
- heap profile;
- goroutine profile;
- mutex profile;
- block profile.

## Alocações

Go tem garbage collector eficiente, mas alocação excessiva aumenta pressão no GC. Olhe `allocs/op` e `B/op` em benchmark.

Não faça micro-otimização prematura. Primeiro remova N+1, query ruim, JSON gigante, cache ausente ou concorrência sem limite.

## Race detector

Performance sem correção não vale. Rode:

```bash
go test -race ./...
```

Principalmente em código com goroutines, caches locais, maps compartilhados e consumers.

## Critério de domínio

Você dominou este card quando consegue produzir evidência antes/depois e explicar por que a otimização melhora o gargalo certo sem sacrificar clareza desnecessariamente.
