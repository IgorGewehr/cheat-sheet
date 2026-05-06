---
title: "HTTP Fundamentos para APIs REST"
category: padroes-backend
stack: [HTTP, REST, NestJS, TypeScript]
tags: [http, rest, status-codes, headers, tls, curl]
excerpt: "O ciclo request/response, métodos, status codes e headers que todo dev backend precisa saber antes de escrever o primeiro endpoint."
related: [dto-validation, sdd-openapi-nestjs, nestjs-por-onde-comecar, session-cookie-vs-jwt]
updated: "2026-05"
---

## O Ciclo Request/Response

Cada chamada HTTP é: cliente envia request → servidor processa → servidor envia response.

```
Cliente (browser/app/curl)           Servidor (NestJS)
       |                                    |
       |--- GET /pedidos HTTP/1.1 -------->|
       |    Host: api.meusite.com          |
       |    Authorization: Bearer token    |
       |                                    |
       |<-- HTTP/1.1 200 OK ---------------|
       |    Content-Type: application/json |
       |                                    |
       |    [{"id": "...", "valor": 150}]   |
```

Cada request é **independente** (stateless) — o servidor não lembra do request anterior. Estado fica no cliente (cookie, token) ou no banco.

## Métodos HTTP — o que cada um faz

| Método | Semântica | Idempotente | Corpo |
|--------|-----------|-------------|-------|
| GET | Buscar recurso | ✅ Sim | Não |
| POST | Criar recurso | ❌ Não | Sim |
| PUT | Substituir recurso completo | ✅ Sim | Sim |
| PATCH | Atualizar campos específicos | ❌ Não | Sim |
| DELETE | Remover recurso | ✅ Sim | Não |

**Idempotente**: chamar N vezes = mesmo resultado que chamar 1 vez.

```bash
# GET é seguro — não muda estado no servidor
GET /pedidos/123

# POST cria — chamar duas vezes pode criar dois pedidos
POST /pedidos
{ "clienteId": "uuid", "valor": 150 }

# PATCH atualiza apenas o que você manda
PATCH /pedidos/123
{ "status": "aprovado" }

# DELETE remove
DELETE /pedidos/123
```

## Status Codes — o que cada um significa

**2xx — Sucesso**
```
200 OK          → retornou dados (GET, PATCH bem-sucedido)
201 Created     → recurso criado (POST)
204 No Content  → sucesso sem corpo (DELETE, PATCH sem retorno)
```

**4xx — Erro do cliente**
```
400 Bad Request      → dados inválidos (validação de DTO falhou)
401 Unauthorized     → não autenticado (sem token ou token inválido)
403 Forbidden        → autenticado mas sem permissão (RBAC bloqueou)
404 Not Found        → recurso não existe
409 Conflict         → conflito de estado (email já cadastrado)
422 Unprocessable    → dados válidos mas semanticamente incorretos
429 Too Many Requests → rate limit atingido
```

**5xx — Erro do servidor**
```
500 Internal Server Error → bug no servidor (não deveria vazar para prod)
502 Bad Gateway           → proxy não conseguiu alcançar o upstream
503 Service Unavailable   → servidor sobrecarregado ou em manutenção
```

```typescript
// NestJS — lançar erros HTTP corretos
throw new NotFoundException('Pedido não encontrado');
throw new ConflictException('Email já cadastrado');
throw new ForbiddenException('Sem permissão para aprovar');
throw new BadRequestException('valor deve ser positivo');
```

## Headers Essenciais

**Request headers**:
```
Content-Type: application/json    → body é JSON
Authorization: Bearer <jwt>       → token de autenticação
Accept: application/json          → cliente quer JSON de volta
X-Request-ID: uuid                → rastreamento distribuído
```

**Response headers**:
```
Content-Type: application/json    → resposta é JSON
Cache-Control: no-store           → não cachear (dados sensíveis)
X-RateLimit-Remaining: 42         → quantas chamadas restam
Location: /pedidos/novo-id        → após 201, onde está o recurso criado
```

## REST — as restrições que importam na prática

**URL representa o recurso, não a ação**:
```bash
# ❌ Errado — verbos na URL
POST /criarPedido
POST /aprovarPedido/123
GET  /buscarPedidosPorCliente?clienteId=abc

# ✅ Correto — substantivos na URL, verbo vem do método HTTP
POST   /pedidos
PATCH  /pedidos/123/status      # sub-recurso para ação de estado
GET    /clientes/abc/pedidos    # pedidos de um cliente
```

**Versionamento de API**:
```bash
GET /v1/pedidos     # URL versioning (mais explícito, recomendado)
GET /pedidos        # com header: API-Version: 1
```

## HTTPS e TLS — básico que todo dev precisa entender

HTTP puro = texto plano na rede. Qualquer roteador intermediário lê senha, token, dados do usuário.

HTTPS = HTTP sobre TLS:
1. Servidor apresenta certificado (prova que é quem diz ser)
2. Cliente e servidor negociam chave de sessão
3. Tudo encriptado — nem o ISP lê

```bash
# Verificar certificado
curl -v https://api.meusite.com 2>&1 | grep "SSL connection"

# Ignorar certificado (SOMENTE desenvolvimento local com cert auto-assinado)
curl -k https://localhost:3000
```

**Regra**: em produção, HTTPS obrigatório. Nenhuma exceção para APIs com dados de usuários.

## HTTP/2 vs HTTP/1.1

HTTP/1.1: uma request por conexão TCP (ou pipelining instável). Browsers abrem 6 conexões paralelas para contornar.

HTTP/2: multiplexação — várias requests numa conexão TCP. Server push. Headers comprimidos. Mais rápido sem mudar código.

NestJS com Fastify tem HTTP/2 nativo. Com Express, requer workaround.

## Debugar com curl

```bash
# Request básica com JSON
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -d '{"clienteId": "uuid-aqui", "valor": 150.00}'

# Ver headers da resposta
curl -I http://localhost:3000/health

# Verbose — vê tudo: headers, TLS handshake, corpo
curl -v http://localhost:3000/pedidos

# Salvar resposta em arquivo
curl http://localhost:3000/relatorio -o relatorio.json

# Com timeout
curl --max-time 5 http://api.externa.com/dados
```
