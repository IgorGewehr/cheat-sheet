---
title: "Go: Generics Modernos (Type Parameters, Constraints, Inferência)"
category: stack-guides
stack: [Go]
tags: [golang, generics, type-parameters, constraints, type-sets]
excerpt: "Generics em Go 1.18+ sem cargo cult — type parameters, constraints, type sets, inferência, quando vale a pena e quando interface clássica é melhor."
related: [go-sintaxe-tipos-controle, go-errors-context, go-concorrencia-goroutines, entrevista-algoritmos]
updated: "2026-05-08"
---

## Por que generics existem em Go

Antes do Go 1.18 a única alternativa para reuso era `interface{}` com type assertion ou code generation. Generics resolvem dois problemas distintos:

- estruturas de dados verdadeiramente reutilizáveis (filas, pools, sync helpers) sem perder o tipo de retorno;
- funções utilitárias (`Map`, `Filter`, `Keys`, `Values`) sem boilerplate.

Generics **não** substituem interfaces. Em Go idiomático, interfaces continuam sendo o mecanismo de polimorfismo dinâmico. Generics são polimorfismo estático com checagem em build.

## Sintaxe mínima

```go
func Map[T any, U any](in []T, f func(T) U) []U {
    out := make([]U, len(in))
    for i, v := range in {
        out[i] = f(v)
    }
    return out
}

names := []string{"Alice", "Bob"}
upper := Map(names, strings.ToUpper) // []string{"ALICE", "BOB"}
```

`[T any, U any]` declara dois type parameters. `any` é alias de `interface{}` adicionado junto dos generics.

## Constraints e type sets

Constraint define o que o type parameter pode fazer. Não confunda com interface comum: ela pode incluir um conjunto de tipos.

```go
type Numeric interface {
    ~int | ~int32 | ~int64 | ~float32 | ~float64
}

func Sum[T Numeric](xs []T) T {
    var total T
    for _, x := range xs {
        total += x
    }
    return total
}
```

O `~` significa "qualquer tipo cujo underlying type seja". Permite que `type Cents int64` ainda case com `Numeric`.

A biblioteca padrão expõe constraints comuns em `golang.org/x/exp/constraints`:

```go
import "golang.org/x/exp/constraints"

func Min[T constraints.Ordered](a, b T) T {
    if a < b { return a }
    return b
}
```

Em Go 1.21+ existe `cmp.Ordered` no stdlib, e funções como `min`, `max`, `slices.Sort` já são genéricas.

## Inferência de tipos

O compilador infere o type argument na maioria dos casos:

```go
result := Sum([]int{1, 2, 3}) // T = int, inferido
result := Sum[float64]([]float64{1.5}) // explícito quando precisar
```

Quando a inferência falha, escreva o tipo. Errar para o lado da clareza.

## Estruturas de dados reaproveitáveis

```go
type Stack[T any] struct {
    data []T
}

func (s *Stack[T]) Push(v T) { s.data = append(s.data, v) }
func (s *Stack[T]) Pop() (T, bool) {
    var zero T
    if len(s.data) == 0 { return zero, false }
    v := s.data[len(s.data)-1]
    s.data = s.data[:len(s.data)-1]
    return v, true
}
```

`var zero T` é o zero value tipado — substitui o antigo retorno `interface{}, false` cheio de assertions.

## Quando NÃO usar generics

Senioridade aqui é resistir ao "tudo vira genérico". Não use quando:

- existe **uma** implementação concreta — escreva direto;
- os tipos esperados são poucos e bem conhecidos — uma interface clássica costuma ser mais legível;
- a função só passa o valor adiante sem operar nele — `any` em parâmetro de log, por exemplo;
- o ganho é estilístico mas custa em legibilidade do call site.

Repositório com `Repository[T any]` quase sempre piora o código: cada agregado precisa de queries específicas, transações específicas, índices específicos. Genérico aqui esconde domínio.

## Performance

Em Go o compilador usa **GC shape stenciling**: gera código compartilhado por classe de tipos com o mesmo "shape" de memória. Isso significa:

- generics em geral não custam mais que código manual;
- alocação extra pode acontecer com tipos pequenos virando interface internamente;
- benchmark é a única resposta honesta — `go test -bench -benchmem`.

Não otimize para performance teórica antes de medir.

## Idiomas que aparecem em projetos sênior

```go
// Optional simples
type Optional[T any] struct {
    value T
    set   bool
}

// Map de pool de recursos
type Pool[T any] struct {
    new  func() T
    pool chan T
}

// Result style — adopt with care, Go já tem (T, error)
func Try[T any](v T, err error) T {
    if err != nil { panic(err) }
    return v
}
```

`Try` é tentador em scripts mas é **anti-idiomático** em código de produção: esconde o erro e quebra o contrato `(T, error)`.

## Generics + interfaces

Você pode combinar. Constraint pode exigir métodos:

```go
type Stringer interface { String() string }

func Join[T Stringer](items []T, sep string) string {
    parts := make([]string, len(items))
    for i, item := range items {
        parts[i] = item.String()
    }
    return strings.Join(parts, sep)
}
```

Use isso quando a operação faz sentido para qualquer tipo que cumpra o contrato, e o custo de declarar uma interface não-genérica seria igual ou maior.

## Checklist de review

- O generic ganha algo real (segurança de tipo no call site, menos boilerplate)?
- Existe uma alternativa com interface clássica que seja igual ou mais clara?
- O nome do type parameter é informativo (`T`, `K`, `V` é convenção; `Aggregate`, `Event` quando ajuda)?
- A constraint reflete o que a função realmente exige? Sem `any` quando há operação aritmética/comparação envolvida.
- Existe teste cobrindo pelo menos dois tipos concretos diferentes?

## Critério de domínio

Você dominou generics quando consegue escolher entre genérico, interface clássica ou função concreta com argumento técnico — e resiste a transformar todo helper em código genérico só porque é possível.
