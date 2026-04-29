---
title: "Go: Chi vs Gin vs Fiber — Escolha de Framework HTTP"
category: stack-guides
tags: [golang, microservices, http, framework]
stack: [Go, Chi, Gin, Fiber]
excerpt: Três frameworks dominam o ecossistema Go para APIs. Chi é minimalista e idiomático, Gin é o mais popular com DX excelente, Fiber é ultra-performance inspirado em Express.
related: [golang-microservices, golang-grpc, microservices-quando-usar, modular-monolith]
updated: "2026-04"
---

## Comparativo rápido

| Critério | Chi | Gin | Fiber |
|---|---|---|---|
| Performance | Alta | Alta | Muito Alta |
| Idioma Go | ✅ Nativo | Quase | ❌ (fasthttp) |
| Middleware ecosystem | Médio | Grande | Grande |
| Learning curve | Baixa | Baixa | Baixa |
| net/http compat | ✅ Total | ✅ Total | ❌ (fasthttp) |
| Ideal para | APIs internas, libs | APIs REST gerais | Alta performance, edge |

## Chi — Minimalista e idiomático

**Use quando**: você quer manter compatibilidade total com a stdlib Go, ou está criando uma biblioteca que outros projetos vão importar.

```go
package main

import (
    "net/http"
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()

    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)

    r.Route("/api/v1", func(r chi.Router) {
        r.Use(AuthMiddleware)
        r.Get("/users/{id}", getUser)
        r.Post("/users", createUser)
    })

    http.ListenAndServe(":8080", r)
}

// Handler é http.HandlerFunc nativo — zero abstração
func getUser(w http.ResponseWriter, r *http.Request) {
    id := chi.URLParam(r, "id")
    // ...
}
```

**Vantagens Chi**:
- Usa `net/http` padrão — qualquer middleware Go funciona
- Roteamento com parâmetros, wildcards e subrouters
- Zero magic — você lê o código e sabe exatamente o que acontece

## Gin — DX excelente, ecossistema maduro

**Use quando**: você quer produtividade máxima, boa DX para o time e um ecossistema grande de middlewares prontos.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.New()
    r.Use(gin.Logger(), gin.Recovery())

    v1 := r.Group("/api/v1")
    v1.Use(AuthMiddleware())
    {
        v1.GET("/users/:id", getUser)
        v1.POST("/users", createUser)
    }

    r.Run(":8080")
}

func getUser(c *gin.Context) {
    id := c.Param("id")
    var query UserQuery
    if err := c.ShouldBindQuery(&query); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // c.JSON para resposta
    c.JSON(http.StatusOK, gin.H{"id": id})
}
```

**Vantagens Gin**:
- `ShouldBind`/`ShouldBindJSON` — validação e parsing automáticos
- Context rico com helpers para JSON, XML, HTML
- Ecossistema de middleware: rate limiting, CORS, JWT prontos
- O mais adotado em Go — fácil de contratar devs que conhecem

## Fiber — Performance extrema (mas atenção ao tradeoff)

**Use quando**: alta concorrência, edge functions, APIs com custo de infra sensível, ou você vem do Node.js e quer o padrão Express.

```go
package main

import (
    "github.com/gofiber/fiber/v3"
    "github.com/gofiber/fiber/v3/middleware/logger"
    "github.com/gofiber/fiber/v3/middleware/recover"
)

func main() {
    app := fiber.New(fiber.Config{
        // Não usa encoding/json padrão — muito mais rápido
        JSONEncoder: json.Marshal,
    })

    app.Use(logger.New(), recover.New())

    api := app.Group("/api/v1", AuthMiddleware)
    api.Get("/users/:id", getUser)
    api.Post("/users", createUser)

    app.Listen(":8080")
}

func getUser(c fiber.Ctx) error {
    id := c.Params("id")
    return c.JSON(fiber.Map{"id": id})
}
```

**⚠️ Atenção crítica com Fiber**: usa `fasthttp` internamente, não `net/http`. Isso significa:
- Middlewares escritos para `net/http` não são compatíveis
- `context.Context` do Go não é passado pelo request context padrão
- Zero-copy strings podem causar bugs sutis se você guardar strings do context

## Recomendação para microsserviços

```
Greenfield API interna → Chi (simples, idiomático, sem surpresas)
API pública com time grande → Gin (ecossistema + DX)
Edge / alta concorrência → Fiber (com atenção ao fasthttp)
```

## Estrutura de projeto recomendada (todos os frameworks)

```
/cmd/api/main.go       — entry point
/internal/
  /handler/            — handlers HTTP (thin layer)
  /service/            — lógica de negócio
  /repository/         — acesso a dados
  /middleware/         — auth, logging, rate limit
  /dto/                — request/response types
/pkg/                  — código reutilizável entre projetos
```

## Como pedir pra IA

```
Crie uma API REST em Go usando {{framework}} com:
- Estrutura de projeto: /cmd, /internal/handler, /internal/service, /internal/repository
- Middleware de autenticação JWT
- Validação de request com {{validador: go-playground/validator}}
- Tratamento de erros centralizado com tipos de erro customizados
- Logger estruturado (slog ou zap)
- Health check endpoint
Stack: Go {{versão}}, {{framework}}, PostgreSQL, pgx
```
