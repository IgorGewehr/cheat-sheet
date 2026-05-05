---
title: "Como escrever cards do Brain — guia de formato e vocabulário"
category: craft
stack: []
tags: [brain, meta, cards, formato, vocabulário]
excerpt: "O formato correto de um card Brain: frontmatter, seções obrigatórias, nível de profundidade certo, e como usar o vocabulário técnico que ativa a IA corretamente."
related: [quando-nao-usar-ia, como-auditar-codigo-ia]
updated: "2026-05"
---

## Estrutura obrigatória de um card

```markdown
---
title: "Título claro e específico"
category: padroes-backend          # ver categorias válidas abaixo
stack: [NestJS, TypeScript]        # tecnologias relevantes
tags: [nestjs, patterns, di]       # para busca e filtragem
excerpt: "Uma frase. O problema que resolve ou o mental model central."
related: [outro-card-slug]         # slugs de cards relacionados
updated: "2026-05"                 # ano-mês da última revisão
---

## Seção principal

...

## Como pedir pra IA

> "Prompt específico que usa o vocabulário do card..."

## Auditoria

- [ ] Checklist de verificação do padrão descrito.

## Anti-padrões

- O que **não** fazer e por quê.
```

## Categorias válidas e o que vai em cada uma

| Categoria | Conteúdo |
|---|---|
| `padroes-backend` | Padrões NestJS, DI, módulos, guards, pipes, repositórios, use cases |
| `padroes-frontend` | Next.js App Router, RSC, Server Actions, caching, performance |
| `arquiteturas` | Clean Architecture, DDD, hexagonal, CQRS, event-driven, monolith |
| `banco` | SQL, Drizzle, migrations, indexes, PostgreSQL, Firestore |
| `auth` | JWT, OAuth, RBAC, ABAC, sessão, criptografia, Zero Trust |
| `infra` | Docker, Kubernetes, Terraform, CI/CD, observabilidade, SRE |
| `testes` | TDD, Jest, integration tests, Playwright, pirâmide de testes |
| `stack-guides` | Guias de stack completa, comparação de tecnologias, monorepo |
| `agentes-ia` | AI agents, RAG, LangChain, MCP, multi-agent, LLM patterns |
| `armadilhas-ia` | O que a IA faz errado por padrão ao gerar código |
| `craft` | Habilidades de engenharia (não tecnologia): review, ADR, RFC, TDD mindset |
| `govtech` | Sistemas públicos, LGPD, Keycloak, NFS-e, PostGIS, TCE |
| `checklists` | Checklists de auditoria reutilizáveis |
| `prompts` | Templates de prompt para domínios específicos |

## Como escrever o `excerpt` (a frase mais importante)

O excerpt aparece nas listagens e define se o usuário vai abrir o card. Ele deve:

- **Dizer o mental model central**, não o título reescrito.
- **Ter no máximo 120 caracteres**.
- **Usar terminologia técnica correta** — é o que ativa busca semântica.

```
❌ "Aprenda a usar guards no NestJS"
❌ "Guards são classes que implementam CanActivate"

✅ "Guard: passa ou bloqueia antes do handler. Roles, tenant, rate-limit. Testável isolado sem subir Nest."
✅ "Valide env no startup com Zod. App falha rápido se variável faltou — não em runtime às 3h."
```

## Como escrever a seção "Como pedir pra IA"

Esta seção é o diferencial do Brain. O prompt deve:

1. **Usar vocabulário técnico do card** — o mesmo que a IA foi treinada.
2. **Referenciar o contexto do projeto** — "nosso NestJS", "seguindo nosso padrão".
3. **Ser específico sobre inputs/outputs** — tipos, nomes de arquivo, restrições.
4. **Incluir o que NÃO fazer** — "Sem `forwardRef`, sem `any`, sem `try/catch` nos controllers".

```
❌ "Crie um guard de autenticação no NestJS"

✅ "Crie `JwtAuthGuard` que estende `AuthGuard('jwt')` do Passport. Adicione 
   suporte a `@Public()` decorator para rotas abertas (verifica metadado 
   `isPublic` via Reflector). Em handleRequest, lance UnauthorizedException 
   se user for null. Coloque em `src/auth/guards/`. Inclua unit test que 
   verifica: rota pública passa sem token, rota protegida bloqueia sem token, 
   rota protegida passa com token válido."
```

## Vocabulário técnico essencial por área

### NestJS
- **Provider**: qualquer coisa que pode ser injetada (`@Injectable()`)
- **Token**: a "chave" de registro no container DI (classe, string, Symbol)
- **Escopo**: `DEFAULT` (singleton), `REQUEST` (por request), `TRANSIENT` (por injeção)
- **Dynamic Module**: módulo com `forRoot()`/`forRootAsync()` para configuração
- **Guard** (`CanActivate`): decide se o request passa ou é bloqueado
- **Interceptor** (`NestInterceptor`): transforma request/response, cross-cutting concerns
- **Pipe** (`PipeTransform`): valida e transforma input antes do handler
- **Filter** (`ExceptionFilter`): captura erros e formata a resposta
- **Middleware**: camada antes dos guards, acesso ao `req`/`res` Express
- **ExecutionContext**: abstração para acessar HTTP, WebSocket, gRPC
- **Reflector**: lê metadados de decorators (`@SetMetadata`)

### Next.js App Router
- **RSC** (React Server Component): roda no servidor, zero JS no bundle do cliente
- **Client Component** (`"use client"`): roda no browser, pode usar state/effects
- **Server Action** (`"use server"`): função assíncrona que roda no servidor, mutação
- **Route Handler**: arquivo `route.ts` — API endpoint
- **Segment**: cada pasta em `app/` é um segmento de rota
- **Layout**: UI compartilhada entre rotas filhas, não re-renderiza em navegação
- **Loading UI** (`loading.tsx`): skeleton/spinner ativado pelo Suspense automático
- **Parallel Routes** (`@slot`): múltiplos segmentos na mesma URL
- **Request Memoization**: `cache()` do React — dedup de chamadas idênticas no mesmo request
- **Data Cache**: cache persistente do `fetch()` no servidor — sobrevive entre requests
- **Full Route Cache**: HTML+RSC payload cacheado por rota — servido pelo CDN
- **Router Cache**: cache client-side de RSC payloads — navegação instantânea
- **PPR** (Partial Prerendering): partes estáticas + dinâmicas na mesma rota

### PostgreSQL e Drizzle
- **B-Tree**: índice padrão, eficiente para `=`, `<`, `>`, `BETWEEN`, `LIKE 'abc%'`
- **Composite index**: índice em múltiplas colunas — ordem importa (igualdade antes de range)
- **Covering index** (`INCLUDE`): índice que contém todas as colunas necessárias — `Index Only Scan`
- **Partial index** (`WHERE`): indexa só as rows que atendem condição
- **Seq Scan**: leu a tabela inteira — ruim em tabelas grandes, indica falta de índice
- **Index Scan**: usou índice, foi à tabela só nas rows retornadas — bom
- **Index Only Scan**: resposta veio só do índice, sem tocar a tabela — ótimo
- **EXPLAIN ANALYZE**: executa a query e mostra o plano real com tempos
- **Cardinality**: número de valores distintos de uma coluna (alta = índice efetivo)
- **`$inferSelect` / `$inferInsert`**: tipos TypeScript inferidos do schema Drizzle
- **Transaction isolation level**: `READ COMMITTED` (padrão), `REPEATABLE READ`, `SERIALIZABLE`
- **MVCC**: Multi-Version Concurrency Control — como Postgres lida com reads/writes simultâneos

### Arquitetura
- **Bounded Context** (DDD): fronteira onde um modelo tem significado coerente
- **Aggregate**: cluster de entidades com uma raiz que garante consistência
- **Domain Event**: algo que aconteceu no domínio — imutável, no passado
- **Port** (hexagonal): interface que o domínio define; adapter implementa
- **Adapter**: implementação concreta de um port (DrizzleRepo, EmailSMTP)
- **Use Case** / **Application Service**: orquestra entidades e ports para realizar uma intenção
- **CQRS**: Command (escreve, não retorna dados) / Query (lê, não muda estado)
- **Outbox Pattern**: garante "exatamente uma vez" em eventos após transação

## Como pedir pra IA criar um card

> "Crie um card Brain no formato correto para o tópico `[título]`. Categoria `[categoria]`. Stack `[tecnologias]`. O card deve cobrir: [lista de conceitos]. Inclua: seção principal com código TypeScript real e comentado, seção 'Como pedir pra IA' com prompt específico usando nossa stack, checklist 'Auditoria', seção 'Anti-padrões' com pelo menos 4 itens. Excerpt com mental model central em 1 frase. Nível: sênior que já conhece os basics — pula o 'o que é', vai direto ao que importa em produção."

## Qualidade de um bom card

| Critério | Bom | Ruim |
|---|---|---|
| Nível | Direto ao ponto, assume básico conhecido | Explica o que é REST, o que é TypeScript |
| Código | Real, copiável, com tipos corretos | Pseudocódigo, `// ...`, `any` |
| Profundidade | Explica o por quê, não só o como | Só mostra API do framework |
| Foco | 1 conceito central por card | 5 assuntos misturados |
| Prompt | Específico ao nosso stack e contexto | Genérico ("crie um CRUD") |
| Auditoria | Checkpoints verificáveis | "código funciona corretamente" |

## Anti-padrões

- Card que repete a documentação oficial em prosa — o card deve ir além.
- Excerpt igual ao título — a frase deve dizer o **mental model**, não repetir o nome.
- "Como pedir pra IA" com prompt genérico sem contexto de projeto.
- Código com `// TODO`, `// implementar aqui`, `any` explícito.
- Auditoria com checkpoints não verificáveis ("está bem organizado").
