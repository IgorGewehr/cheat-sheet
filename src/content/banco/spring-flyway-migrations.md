---
title: "Spring + Flyway: Migrations, Baselining, Zero Downtime"
category: banco
stack: [Spring Boot, Kotlin, Flyway, PostgreSQL]
tags: [flyway, migrations, schema, zero-downtime, baseline]
excerpt: "Versionamento de schema com Flyway: convenções de nome, baselining em base legada, repeatable migrations, callbacks, dev seed e padrões zero-downtime para deploy contínuo."
related: [spring-data-jpa, migrations-zero-downtime, spring-testcontainers]
updated: "2026-05-11"
---

## Por que Flyway

Schema de banco é parte do código. Não dá para confiar em "alguém aplicou o `ALTER TABLE`". Flyway:

- versiona migrations (`V1__init.sql`, `V2__add_pedido.sql`, ...);
- aplica em ordem na app subir;
- rastreia em tabela `flyway_schema_history` o que foi aplicado;
- falha se um arquivo já aplicado foi modificado (checksum).

Liquibase faz o mesmo. Em projeto Spring Boot novo, **Flyway é mais simples e padrão** — vou cobrir Flyway. Liquibase ganha em ambientes multi-DB com XML/YAML.

## Setup

```kotlin
implementation("org.springframework.boot:spring-boot-starter-data-jpa")
implementation("org.flywaydb:flyway-core")
implementation("org.flywaydb:flyway-database-postgresql")
runtimeOnly("org.postgresql:postgresql")
```

`application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/billing
    username: billing
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate    # NUNCA "update" em prod
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    validate-on-migrate: true
```

⚠️ **`spring.jpa.hibernate.ddl-auto`**: use sempre `validate` em prod (verifica se schema bate com entidade) ou `none`. Nunca `update`/`create` — você não quer Hibernate decidindo `DROP COLUMN` por engano.

## Convenção de nomes

```text
src/main/resources/db/migration/
├── V1__init.sql
├── V2__add_pedido_status.sql
├── V3__create_indices_pedidos.sql
├── V4__add_outbox_table.sql
└── R__view_pedidos_resumo.sql    # repeatable
```

| Prefixo | Quando |
|---|---|
| `V<n>__nome.sql` | versionada — aplicada uma vez, jamais modificada |
| `U<n>__nome.sql` | undo (versão paga do Flyway) |
| `R__nome.sql` | repeatable — reaplica quando checksum muda (views, funcs) |
| `B<n>__nome.sql` | baseline — marca ponto de partida em base legada |

Use **versão como inteiro com gap** (`V1`, `V2`, `V3`) em times pequenos. Em times grandes ou multi-branch, prefira **timestamp** (`V20260511143200__add_pedido_status.sql`) — evita conflito de versão entre PRs paralelas.

## Conteúdo de uma migration

```sql
-- V2__add_pedido_status.sql

ALTER TABLE pedidos
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE';

CREATE INDEX idx_pedidos_status ON pedidos(status);

-- Backfill se necessário, em batches:
UPDATE pedidos SET status = 'CANCELADO' WHERE total = 0;
```

Regras:

1. **Idempotência onde possível**: `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
2. **Não modifique migration aplicada**: Flyway detecta via checksum e falha o boot. Crie nova `V<n+1>`.
3. **Backfill em batches**: `UPDATE ... WHERE id BETWEEN ? AND ?` em loop, não `UPDATE` em 50M de linhas.
4. **Sem dados de aplicação em migration**: dados de domínio vão em `INSERT` em seed dev, não em migration de schema.

## Baseline em base legada

Você herda um schema que já existe sem Flyway:

```bash
flyway baseline -baselineVersion=1
```

Cria registro `V1` na `flyway_schema_history` apontando para estado atual. Novas migrations começam em `V2`.

`spring.flyway.baseline-on-migrate=true` faz isso automaticamente no boot.

## Repeatable migrations

Para views e funções, use `R__`:

```sql
-- R__view_pedidos_resumo.sql

CREATE OR REPLACE VIEW pedidos_resumo AS
SELECT
    p.id,
    p.cliente_id,
    p.total,
    COUNT(ip.id) AS qtd_itens
FROM pedidos p
LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
GROUP BY p.id;
```

Flyway aplica novamente sempre que o conteúdo (checksum) muda. Sem precisar criar `V<n>__update_view.sql`.

## Migrations zero downtime

Deploy contínuo exige que **versão antiga e nova rodem juntas** durante o rollout. Isso muda como você modela ALTER TABLE.

**Adicionar coluna**:

1. `V10__add_email.sql`: `ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL;` (nullable!).
2. Deploy app que escreve em `email` mas tolera null.
3. Backfill `UPDATE users SET email = ...`.
4. `V11__make_email_required.sql`: `ALTER TABLE users ALTER COLUMN email SET NOT NULL;`.
5. Deploy app que assume não-nulo.

**Remover coluna**:

1. Deploy app que NÃO usa `email`.
2. Esperar deploy completar em todos os pods.
3. `V12__drop_email.sql`: `ALTER TABLE users DROP COLUMN email;`.

**Renomear coluna** (mais perigoso):

1. `V20__add_new_name.sql`: adiciona `name_v2`.
2. Deploy app que escreve nos dois (`name` e `name_v2`).
3. Backfill.
4. Deploy app que lê de `name_v2`, escreve nos dois.
5. Deploy app que só usa `name_v2`.
6. `V21__drop_old_name.sql`: dropa `name`.

Cinco deploys para renomear coluna. Por isso o nome bom desde o início economiza dois meses.

## ALTER que travam tabela

PostgreSQL: `ALTER TABLE` toma `AccessExclusiveLock`. Em tabelas grandes/quentes, segura tudo:

```sql
-- ❌ trava prod
ALTER TABLE pedidos ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE';

-- ✓ split em fases (PG 11+)
ALTER TABLE pedidos ADD COLUMN status VARCHAR(20);                    -- rápido em PG 11+
UPDATE pedidos SET status = 'PENDENTE' WHERE status IS NULL;          -- em batches
ALTER TABLE pedidos ALTER COLUMN status SET DEFAULT 'PENDENTE';
ALTER TABLE pedidos ALTER COLUMN status SET NOT NULL;
```

PG 11+ permite `ADD COLUMN ... DEFAULT` sem reescrever a tabela. Antes era catástrofe em tabela de 100M linhas.

Use [pg-osc](https://github.com/shayonj/pg-osc), [pgroll](https://github.com/xataio/pgroll) ou [reshape](https://github.com/fabianlindfors/reshape) para schemas grandes — fazem migration online com tabela shadow.

## Callbacks Flyway

Para hooks pre/post migration:

```kotlin
@Component
class CacheInvalidator(private val redis: StringRedisTemplate) : Callback {
    override fun supports(event: Event, ctx: Context?) = event == Event.AFTER_EACH_MIGRATE
    override fun handle(event: Event, ctx: Context?) {
        redis.delete("schema-cache")
    }
}
```

Útil para invalidar caches sensíveis a schema após migration.

## Dev seed (NÃO em migration)

```kotlin
@Component
@Profile("dev")
class DevSeed(private val repo: PedidoJpaRepository) : ApplicationListener<ApplicationReadyEvent> {
    override fun onApplicationEvent(event: ApplicationReadyEvent) {
        if (repo.count() == 0L) {
            repo.saveAll(listOf(/* dados de teste */))
        }
    }
}
```

Não bote dados de seed em `V<n>__seed.sql`. Migration é estrutura. Dados dev ficam em código, ativado por profile.

## Anti-padrões frequentes

1. **`spring.jpa.hibernate.ddl-auto: update` em prod**: Hibernate alterando schema sozinho.
2. **Modificar migration aplicada**: checksum falha; alguém vai usar `flyway repair` errado.
3. **`DROP COLUMN` sem deploy intermediário**: app antiga rodando quebra.
4. **`ALTER TABLE` enorme em hora de pico**: trava tudo.
5. **Dados de seed em migration**: poluí cleanup; ambiente dev/prod fica diferente.

## Critério de domínio

Você dominou este card quando consegue: criar uma migration V2 incremental; explicar a diferença entre `V`, `R` e `B` no Flyway; descrever os 5 passos pra renomear coluna zero downtime; configurar Flyway no Spring Boot com baseline; e listar 3 cuidados em ALTER TABLE em produção.
