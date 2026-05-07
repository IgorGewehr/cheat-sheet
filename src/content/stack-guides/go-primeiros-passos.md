---
title: "Go: Primeiros Passos e Toolchain"
category: stack-guides
stack: [Go]
tags: [golang, toolchain, go-mod, setup, cli]
excerpt: "Comece em Go do jeito profissional: instalação, go.mod, comandos essenciais, estrutura mínima e o vocabulário técnico que aparece em projetos reais."
related: [go-sintaxe-tipos-controle, go-modulos-layout-projetos, golang-microservices]
updated: "2026-05-07"
---

## O que Go é

Go é uma linguagem compilada, tipada estaticamente e projetada para serviços de rede, CLIs, ferramentas internas e sistemas concorrentes. "Compilada" significa que seu código vira um binário executável antes de rodar. "Tipada estaticamente" significa que o compilador verifica os tipos antes da execução.

Go não tenta ser uma linguagem cheia de recursos. A força dela está em previsibilidade: sintaxe pequena, biblioteca padrão excelente, concorrência nativa com goroutines, build rápido e deploy simples.

Em backend empresarial, Go costuma brilhar quando você precisa de:

- serviços HTTP com baixa latência;
- workers e consumers de fila;
- binários pequenos em Docker;
- integração forte com PostgreSQL, Redis e mensageria;
- código simples de revisar, sem framework escondendo fluxo.

## Onde baixar

Baixe pelo site oficial: [go.dev/dl](https://go.dev/dl/). Em 7 de maio de 2026, a versão estável mais recente listada no histórico oficial é Go 1.26.3. Confirme sempre no site antes de criar projetos novos.

Depois de instalar:

```bash
go version
go env GOPATH GOMODCACHE GOPROXY
```

Termos importantes:

- `GOROOT`: onde a toolchain do Go foi instalada.
- `GOPATH`: área histórica de workspace e cache. Hoje você quase sempre trabalha com modules.
- `GOMODCACHE`: cache de dependências baixadas.
- `GOPROXY`: proxy de módulos usado pelo `go` para baixar pacotes.

## Criando um projeto

```bash
mkdir billing-service
cd billing-service
go mod init github.com/igor/brain/billing-service
mkdir -p cmd/api internal
```

O arquivo `go.mod` declara o módulo. Um módulo é a unidade versionável de código Go. O nome geralmente é o caminho do repositório, porque imports usam esse caminho.

Crie `cmd/api/main.go`:

```go
package main

import "fmt"

func main() {
	fmt.Println("billing-service ready")
}
```

Rode:

```bash
go run ./cmd/api
go build ./cmd/api
go test ./...
go fmt ./...
go vet ./...
```

## Comandos que você precisa internalizar

| Comando | Uso profissional |
|---|---|
| `go run ./cmd/api` | compila e executa sem deixar binário no projeto |
| `go build ./...` | verifica se todos os packages compilam |
| `go test ./...` | roda toda a suíte de testes |
| `go test -race ./...` | detecta data races em código concorrente |
| `go mod tidy` | remove dependências não usadas e adiciona indiretas necessárias |
| `go fmt ./...` | formatação oficial, sem debate estético |
| `go vet ./...` | análise estática básica da toolchain |

## Modelo mental inicial

Um projeto Go é feito de packages. Cada pasta é um package. Arquivos na mesma pasta devem declarar o mesmo `package`. Você importa packages, não arquivos.

O package `main` é especial: ele gera um executável. Packages que não são `main` geram bibliotecas reutilizáveis dentro do módulo.

Um serviço profissional costuma ter múltiplos entrypoints:

```text
cmd/api/main.go       # HTTP API
cmd/worker/main.go    # consumer de fila
cmd/migrate/main.go   # comando operacional
internal/...          # código privado do serviço
```

## Critério de domínio

Você dominou este card quando consegue criar um serviço Go do zero, explicar `go.mod`, rodar build/test/fmt/vet e dizer por que `cmd/` e `internal/` existem sem repetir receita decorada.
