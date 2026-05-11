---
title: "Spring Boot Essentials: Auto-configuration, Beans, Profiles, Actuator"
category: stack-guides
stack: [Spring Boot, Kotlin]
tags: [spring-boot, spring, auto-config, beans, profiles, actuator]
excerpt: "O modelo mental do Spring Boot que separa quem usa do quem entende: auto-configuration, lifecycle do ApplicationContext, perfis por ambiente, graceful shutdown e actuator em produção."
related: [kotlin-primeiros-passos, spring-web-controllers, spring-config-properties]
updated: "2026-05-11"
---

## O que Spring Boot resolve

Spring Framework existe desde 2003 e é a base do ecossistema Java enterprise. Spring Boot (2014) é uma camada sobre o Framework que adiciona **três coisas**:

1. **Auto-configuration**: detecta o classpath e configura beans automaticamente.
2. **Starters**: dependências curadas (`spring-boot-starter-web` traz Tomcat + Jackson + Validation + ...).
3. **Embedded server**: JAR executável (`java -jar app.jar`) com Tomcat/Netty embarcado.

Sem isso você escreveria 200 linhas de XML pra ter um endpoint HTTP. Hoje são duas anotações.

## ApplicationContext e Beans

O coração do Spring é o **ApplicationContext** — container que cria e gerencia objetos chamados **beans**. Você declara o que quer; o Spring monta o grafo de dependências e injeta.

```kotlin
@Service
class CriarPedidoUseCase(
    private val pedidoRepository: PedidoRepository,
    private val estoqueClient: EstoqueClient,
    private val eventos: EventoPublisher,
) {
    fun executar(req: PedidoRequest): Pedido { /* ... */ }
}
```

Sem `new`, sem factory manual. O Spring resolve dependências por **tipo** e injeta via constructor (recomendado).

Anotações que registram bean:
- `@Component`: genérico.
- `@Service`: semântico para use cases/serviços.
- `@Repository`: para adapters de persistência (exception translation).
- `@Controller` / `@RestController`: para HTTP.
- `@Configuration` + `@Bean`: para configuração manual de bean (libs terceiras).

Regra sênior: **construtor injection sempre**. `@Autowired` em field é gambiarra que esconde dependências e quebra testes unitários (precisa de reflection ou Spring Test). Em Kotlin, basta declarar no `val` do construtor:

```kotlin
@Service
class FaturarUseCase(private val repo: FaturaRepository)   // ← injeção
```

## Auto-configuration: a mágica controlada

Quando você adiciona `spring-boot-starter-data-jpa`, o Spring Boot detecta o `JpaRepository` no classpath e:
- configura `DataSource` lendo `spring.datasource.*`;
- configura `EntityManagerFactory`;
- ativa `@Transactional`;
- registra Hibernate;
- expõe metrics no Actuator.

Tudo sem você escrever uma linha de configuração. **Mas isso não é mágica** — é classe `JpaRepositoriesAutoConfiguration` com `@ConditionalOnClass(JpaRepository::class)`. Você pode ler.

Habilite log de diagnóstico em dev:

```yaml
# application.yml
logging:
  level:
    org.springframework.boot.autoconfigure: DEBUG
```

E rode com `--debug` na primeira vez de cada serviço. Vai aparecer a lista completa do que foi ligado e por quê.

## Profiles: ambientes diferentes

```yaml
# application.yml (default)
spring:
  application:
    name: billing-service
server:
  port: 8080
logging:
  level:
    com.igor.billing: INFO

---
spring:
  config:
    activate:
      on-profile: dev
logging:
  level:
    com.igor.billing: DEBUG
    org.hibernate.SQL: DEBUG

---
spring:
  config:
    activate:
      on-profile: prod
server:
  shutdown: graceful
  tomcat:
    threads:
      max: 200
```

Ative com `--spring.profiles.active=prod` ou `SPRING_PROFILES_ACTIVE=prod`.

**Anti-padrão**: profile chamado `production` em arquivo cheio de secrets hardcoded. Profiles são para **comportamento por ambiente** (logs, pools, timeouts). Secrets ficam em Vault, AWS Secrets Manager, K8s Secret — nunca commit.

## Lifecycle do Application

```text
SpringApplication.run(Application::class.java, args)
  ↓
1. cria Environment (lê application.yml + ENV + args)
2. cria ApplicationContext
3. registra auto-configurations
4. instancia beans
5. ApplicationReadyEvent (app pronta para receber tráfego)
  ↓
... aplicação rodando ...
  ↓
6. SIGTERM recebido
7. ContextClosedEvent
8. shutdown hooks (graceful)
9. JVM exit
```

Hooks úteis:

```kotlin
@Component
class StartupChecker(
    private val migration: FlywayMigrationCheck,
) {
    @EventListener(ApplicationReadyEvent::class)
    fun valid() {
        require(migration.checkpointOk()) {
            "schema fora do esperado — abortando"
        }
    }
}
```

Falhar rápido no boot é melhor que servir tráfego com config errada.

## Graceful Shutdown

`server.shutdown=graceful` faz o Spring Boot **parar de aceitar requests novos** e esperar os ativos terminarem por até `spring.lifecycle.timeout-per-shutdown-phase` (default 30s).

```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 45s
```

Em K8s, o `preStop` hook precisa esperar isso + lag de update do endpoint:

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 10 && kill -TERM 1"]
terminationGracePeriodSeconds: 60
```

Sem isso, você corta requests no meio durante deploy e seus SLOs viram piada.

## Actuator em produção

`spring-boot-starter-actuator` expõe endpoints operacionais. Em `application.yml`:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
  metrics:
    tags:
      application: ${spring.application.name}
```

Endpoints críticos:

- `/actuator/health` — liveness/readiness para K8s probes.
- `/actuator/health/liveness` — "processo vivo?" (não reinicia se falha externa).
- `/actuator/health/readiness` — "pronto pra tráfego?" (controla traffic shaping).
- `/actuator/prometheus` — scrape para métricas.
- `/actuator/info` — versão, commit, build time.

**Nunca exponha `/actuator/env`, `/heapdump`, `/threaddump` em produção sem autenticação**. Há CVEs ativos sobre isto.

## Critério de domínio

Você dominou este card quando consegue: explicar a diferença entre Spring Framework e Spring Boot; listar 3 motivos pra preferir constructor injection; configurar 2 profiles diferentes com YAML; explicar o que `server.shutdown: graceful` faz; e listar endpoints do Actuator que **nunca** devem ficar públicos.
