---
title: "Spring + Docker + GraalVM Native: Imagens Enxutas"
category: infra
stack: [Spring Boot, Kotlin, Docker, GraalVM]
tags: [docker, graalvm, native-image, jib, buildpacks, multi-stage]
excerpt: "Empacote Spring Boot pra produção: multi-stage Dockerfile, Buildpacks/JIB, GraalVM native-image com AOT do Spring 3, imagens pequenas e healthchecks corretos."
related: [spring-microservices-enterprise, docker-multistage, container-security]
updated: "2026-05-11"
---

## O ponto de partida ruim

```dockerfile
# ❌ não faça isso
FROM openjdk:21
COPY target/app.jar /app.jar
CMD java -jar /app.jar
```

Problemas: imagem 1GB+, sem multi-stage, sem user não-root, sem healthcheck, sem cache de layer. Em prod, isso vira ataque + custo + slow build.

## Multi-stage Dockerfile

```dockerfile
# ─── builder ─────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# layer de cache: deps separadas do código
COPY gradle gradle
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle.properties* ./
RUN ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

# código
COPY src src
RUN ./gradlew --no-daemon build -x test \
    && mkdir -p build/extracted \
    && java -Djarmode=layertools -jar build/libs/*.jar extract --destination build/extracted

# ─── runtime ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# user não-root
RUN addgroup -S app && adduser -S -G app app

# layers separadas pra cache otimizado
COPY --from=builder --chown=app:app /workspace/build/extracted/dependencies/ ./
COPY --from=builder --chown=app:app /workspace/build/extracted/spring-boot-loader/ ./
COPY --from=builder --chown=app:app /workspace/build/extracted/snapshot-dependencies/ ./
COPY --from=builder --chown=app:app /workspace/build/extracted/application/ ./

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1

ENV JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

Pontos:

- **Alpine** ou distroless: imagem 200-300MB em vez de 1GB.
- **Layertools** (do Spring): separa dependencies, snapshot-dependencies, spring-boot-loader, application em layers. Mudou só código → só a última layer rebuilda.
- **User não-root**: vulnerabilidade que escape container não vira root no host.
- **Healthcheck embutido**: Docker/K8s consegue verificar saúde.
- **`MaxRAMPercentage`**: JVM respeita limite do container.
- **`ExitOnOutOfMemoryError`**: OOM derruba pod, K8s restarta.

## Spring Boot Buildpacks (sem Dockerfile)

```bash
./gradlew bootBuildImage \
    --imageName=ghcr.io/igor/billing-service:1.2.3 \
    --publishImage \
    -PregistryUsername=$USER \
    -PregistryPassword=$TOKEN
```

Buildpacks (Paketo) detectam que é Spring Boot e geram imagem otimizada **sem Dockerfile escrito**. Inclui:
- JRE escolhida automaticamente;
- layer caching;
- user não-root;
- healthcheck;
- libapparmor / seccomp profiles;
- CNB process types.

**Quando usar Buildpack**: você não tem customização exótica (binário externo, fonte custom). Funciona em 90% dos casos.

## JIB (Google)

```kotlin
plugins {
    id("com.google.cloud.tools.jib") version "3.4.4"
}

jib {
    from {
        image = "eclipse-temurin:21-jre-alpine"
    }
    to {
        image = "ghcr.io/igor/billing-service"
        tags = setOf("latest", "1.2.3")
    }
    container {
        ports = listOf("8080")
        user = "1000:1000"
        environment = mapOf("JAVA_TOOL_OPTIONS" to "-XX:MaxRAMPercentage=75")
        labels = mapOf("org.opencontainers.image.source" to "https://github.com/igor/billing")
    }
}
```

JIB **não usa Docker daemon**. Faz upload direto pro registry. Reprodutibilidade total, builds super rápidos (cache distribuído).

```bash
./gradlew jib                  # publica direto
./gradlew jibDockerBuild       # gera imagem local
```

## GraalVM Native Image

Compila bytecode Spring Boot para **binário nativo** (não-JVM):

```kotlin
plugins {
    id("org.springframework.boot")
    id("org.graalvm.buildtools.native") version "0.10.3"
}

graalvmNative {
    binaries {
        named("main") {
            buildArgs.add("-march=compatibility")
            buildArgs.add("--no-fallback")
            buildArgs.add("-H:+ReportExceptionStackTraces")
        }
    }
}
```

```bash
./gradlew nativeCompile          # gera binário
./gradlew nativeRun              # roda binário
./gradlew bootBuildImage         # imagem nativa via buildpack
```

Resultados típicos:

| | JVM tradicional | GraalVM native |
|---|---|---|
| Startup | 3-5s | **80-150ms** |
| Memória RSS | 400-800MB | **80-200MB** |
| Throughput estável | maior | menor (sem JIT) |
| Build time | 30s | 3-10min |

**Quando usar**:
- AWS Lambda / GCP Cloud Run (cold start);
- K8s com autoscaler que sobe pods sob demanda;
- serviço de baixa carga onde memória custa.

**Quando NÃO usar**:
- monolito 24h up: JIT estabiliza melhor;
- libs que usam reflection nativa (algumas legacy);
- batch que processa 1h: warmup do JIT > startup time.

## Reflection em GraalVM

Native image precisa saber **em compile time** que classes são acessadas via reflection. Spring 3 + `kotlin-reflect` + `kotlin-spring` plugin geram **hints AOT** automaticamente.

```yaml
# application.yml
spring:
  aot:
    enabled: true
```

Em build:

```bash
./gradlew processAot
./gradlew nativeCompile
```

Para libs que não geram hint, você usa:

```kotlin
@RegisterReflectionForBinding(MyExternalDto::class)
class MyConfig
```

ou arquivo `META-INF/native-image/reachability-metadata.json`.

## Imagem distroless

Para reduzir superfície de ataque:

```dockerfile
FROM gcr.io/distroless/java21-debian12:nonroot
COPY --from=builder /workspace/build/libs/app.jar /app.jar
CMD ["app.jar"]
```

Distroless = imagem sem shell, sem package manager, sem nada além da JDK runtime. Não tem `wget`/`curl` (healthcheck precisa de outra estratégia — `livenessProbe` HTTP do K8s).

## Container security

1. **Não rodar como root**: `USER 1000:1000` no Dockerfile.
2. **Read-only filesystem**: K8s `securityContext.readOnlyRootFilesystem: true`.
3. **NoNewPrivileges**: bloquei setuid.
4. **DropAllCapabilities**: remove capabilities Linux.
5. **Scan vulnerabilidades**: Trivy, Grype.

```yaml
# k8s
spec:
  containers:
    - name: app
      image: ghcr.io/igor/billing-service:1.2.3
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        readOnlyRootFilesystem: true
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
      resources:
        limits: { memory: "768Mi", cpu: "1000m" }
        requests: { memory: "256Mi", cpu: "100m" }
      livenessProbe:
        httpGet: { path: /actuator/health/liveness, port: 8080 }
        periodSeconds: 10
      readinessProbe:
        httpGet: { path: /actuator/health/readiness, port: 8080 }
        periodSeconds: 5
```

## Tamanho de imagem

Compare:

| Base | Tamanho |
|---|---|
| `openjdk:21` | 800MB+ |
| `eclipse-temurin:21-jre` | 350MB |
| `eclipse-temurin:21-jre-alpine` | 230MB |
| `gcr.io/distroless/java21:nonroot` | 200MB |
| GraalVM native binary | 80-120MB |

Smaller = pull mais rápido em deploy, menos vetor de ataque, menos custo de registry.

## CI multi-arch

Pra rodar em ARM (Apple Silicon dev + AWS Graviton prod) E AMD64:

```yaml
# .github/workflows/build.yml
- uses: docker/setup-qemu-action@v3
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v6
  with:
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ghcr.io/igor/billing-service:${{ github.sha }}
```

## Anti-padrões

1. **`COPY . .`** sem .dockerignore: build pesado, vaza arquivos sensíveis.
2. **`latest` em produção**: imutabilidade quebrada.
3. **Root + read-write FS**: ataque que escapa container = atacante root.
4. **Sem healthcheck**: orquestrador não sabe quando app está pronta.
5. **GraalVM "porque é moderno"**: 30 min de build pra cold start de 5s/dia.

## Critério de domínio

Você dominou este card quando consegue: escrever Dockerfile multi-stage com layers Spring Boot; explicar `MaxRAMPercentage`; configurar GraalVM native + processAot; descrever 3 cuidados em container security; e listar 4 tamanhos típicos de imagem (openjdk → distroless → native).
