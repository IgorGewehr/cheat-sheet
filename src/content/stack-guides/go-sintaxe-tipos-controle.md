---
title: "Go: Sintaxe, Tipos e Controle de Fluxo"
category: stack-guides
stack: [Go]
tags: [golang, syntax, types, structs, interfaces, pointers]
excerpt: "A linguagem Go sem misticismo: tipos, zero value, structs, interfaces, ponteiros, slices e composição idiomática."
related: [go-primeiros-passos, go-errors-context, go-concorrencia-goroutines]
updated: "2026-05-07"
---

## A filosofia da sintaxe

Go troca expressividade infinita por legibilidade repetível. Em um time sênior, isso importa: código precisa ser óbvio para quem vai manter o serviço durante incidente, migração e auditoria.

Conceitos-base:

- `var` declara variável com tipo explícito ou inferido.
- `:=` declara variável local com inferência.
- todo tipo tem `zero value`.
- não existe exceção; funções retornam `error`.
- não existe herança; existe composição.
- interfaces são satisfeitas implicitamente.

## Zero value

Zero value é o valor padrão de um tipo quando ele é declarado sem inicialização explícita.

| Tipo | Zero value |
|---|---|
| `int`, `float64` | `0` |
| `bool` | `false` |
| `string` | `""` |
| pointer, slice, map, channel, function, interface | `nil` |

Isso permite construir tipos úteis sem construtores obrigatórios:

```go
var count int
var name string
var paid bool
```

Mas cuidado: `nil` em slice e map não se comporta igual. Você pode dar `append` em slice nil, mas escrever em map nil causa panic.

```go
var items []string
items = append(items, "invoice")

var totals map[string]int
// totals["paid"] = 1 // panic
totals = make(map[string]int)
totals["paid"] = 1
```

## Structs e composição

Struct agrupa dados. Em domínio empresarial, structs representam comandos, entidades, value objects, DTOs e registros vindos do banco.

```go
type Money struct {
	Cents    int64
	Currency string
}

type Invoice struct {
	ID     string
	Total  Money
	Status string
}
```

Go não tem classes. Métodos são funções com receiver:

```go
func (m Money) IsZero() bool {
	return m.Cents == 0
}
```

Use receiver por valor quando o tipo é pequeno e imutável na operação. Use pointer receiver quando precisa alterar estado ou evitar cópia de structs maiores.

## Interfaces

Interface em Go descreve comportamento:

```go
type InvoiceRepository interface {
	FindByID(ctx context.Context, id string) (Invoice, error)
	Save(ctx context.Context, inv Invoice) error
}
```

Uma implementação não declara `implements`. Se ela tem os métodos, ela satisfaz a interface.

Regra sênior: aceite interfaces, retorne structs. Quem define a interface normalmente é o consumidor, não o pacote de infraestrutura.

## Slices

Slice é uma janela sobre um array. Ele tem ponteiro para array interno, tamanho e capacidade. Isso explica bugs de aliasing.

```go
ids := []string{"a", "b", "c"}
firstTwo := ids[:2]
firstTwo[0] = "x"
// ids agora começa com "x"
```

Quando você precisa isolar memória, use `copy`.

## Controle de fluxo

Go tem `if`, `switch`, `for` e `select`. Não existe `while`; `for` cobre esse papel.

```go
for rows.Next() {
	// scan
}

switch status {
case "paid":
	return nil
case "cancelled":
	return ErrInvoiceCancelled
default:
	return ErrInvalidStatus
}
```

## Vocabulário técnico

- `receiver`: parâmetro especial que vincula um método a um tipo.
- `pointer receiver`: método que recebe `*T` e pode alterar o valor apontado.
- `value object`: objeto de domínio identificado por seus valores, não por identidade.
- `aliasing`: duas referências apontam para a mesma memória.
- `nil`: ausência de valor para tipos referência.
- `panic`: falha abrupta; não deve ser usado como fluxo normal de erro.

## Critério de domínio

Você dominou este card quando consegue ler código Go idiomático sem procurar equivalentes de classe/herança, explicar interfaces implícitas e antecipar bugs comuns com `nil`, maps e slices.
