---
title: "Kotlin: Gradle Multi-Module & Layout Profissional"
category: stack-guides
stack: [Kotlin, Gradle]
tags: [gradle, kotlin-dsl, multi-module, version-catalog, build]
excerpt: "Estruture projetos Kotlin enterprise como sênior: Gradle Kotlin DSL, multi-module por camada arquitetural, version catalog e convention plugins — sem cargo cult."
related: [kotlin-primeiros-passos, spring-hexagonal-kotlin, spring-microservices-enterprise]
updated: "2026-05-11"
---

## Por que multi-module

Um projeto Kotlin de produção sério **NÃO é uma pasta única `src/main/kotlin`**. Você quer separar em módulos Gradle por motivo concreto:

- **Tempo de build**: módulo `domain` puro compila em 2s. Recompilar só ele em desenvolvimento é regressão zero.
- **Fronteira arquitetural**: o compilador impede `infra` importar de `app` errado. Acoplamento ilícito vira erro de build.
- **Test isolation**: testes de `domain` rodam em ms, sem Spring. Você roda 500 testes de domínio antes do café.
- **Dependências por camada**: `domain` não precisa de Spring no classpath. Reduz superfície de ataque e tamanho do JAR.

## Layout enterprise

```text
billing-service/
├── settings.gradle.kts
├── build.gradle.kts                  # config root (vazia ou convention)
├── gradle/
│   └── libs.versions.toml            # version catalog
├── buildSrc/                         # convention plugins (opcional)
│   └── src/main/kotlin/
│       └── billing.kotlin-conventions.gradle.kts
├── app/                              # entrypoint Spring Boot
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/igor/billing/Application.kt
├── domain/                           # regras puras (zero framework)
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/igor/billing/domain/
├── application/                      # use cases
│   ├── build.gradle.kts
│   └── src/main/kotlin/com/igor/billing/application/
└── infra/                            # adapters (DB, Kafka, HTTP)
    ├── build.gradle.kts
    └── src/main/kotlin/com/igor/billing/infra/
```

`settings.gradle.kts`:

```kotlin
rootProject.name = "billing-service"

include("app")
include("domain")
include("application")
include("infra")

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}
```

## Version Catalog: única fonte da verdade

`gradle/libs.versions.toml`:

```toml
[versions]
kotlin = "2.0.20"
spring-boot = "3.3.4"
spring-cloud = "2023.0.3"
testcontainers = "1.20.2"

[libraries]
spring-boot-web = { module = "org.springframework.boot:spring-boot-starter-web" }
spring-boot-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa" }
spring-boot-validation = { module = "org.springframework.boot:spring-boot-starter-validation" }
spring-boot-actuator = { module = "org.springframework.boot:spring-boot-starter-actuator" }
kotlin-coroutines = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version = "1.9.0" }
kotest-runner = { module = "io.kotest:kotest-runner-junit5", version = "5.9.1" }
kotest-assertions = { module = "io.kotest:kotest-assertions-core", version = "5.9.1" }
mockk = { module = "io.mockk:mockk", version = "1.13.13" }
testcontainers-postgres = { module = "org.testcontainers:postgresql", version.ref = "testcontainers" }

[bundles]
testing = ["kotest-runner", "kotest-assertions", "mockk"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spring-dependency-management = { id = "io.spring.dependency-management", version = "1.1.6" }
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }
kotlin-jpa = { id = "org.jetbrains.kotlin.plugin.jpa", version.ref = "kotlin" }
```

Agora em qualquer módulo:

```kotlin
dependencies {
    implementation(libs.spring.boot.web)
    implementation(libs.kotlin.coroutines)
    testImplementation(libs.bundles.testing)
}
```

Atualizar versão? Um lugar. Renomear biblioteca? Um lugar. CVE? Um lugar.

## Convention Plugin (buildSrc)

`buildSrc/build.gradle.kts`:

```kotlin
plugins { `kotlin-dsl` }
repositories { mavenCentral() }
```

`buildSrc/src/main/kotlin/billing.kotlin-conventions.gradle.kts`:

```kotlin
plugins {
    id("org.jetbrains.kotlin.jvm")
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xcontext-receivers")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    testLogging { events("passed", "skipped", "failed") }
}
```

Em cada módulo:

```kotlin
plugins {
    id("billing.kotlin-conventions")
}
```

Trinta linhas de `build.gradle.kts` viram três.

## Dependências entre módulos

```kotlin
// domain/build.gradle.kts — SEM Spring!
plugins { id("billing.kotlin-conventions") }
dependencies {
    testImplementation(libs.bundles.testing)
}

// application/build.gradle.kts
dependencies {
    implementation(project(":domain"))
    testImplementation(libs.bundles.testing)
}

// infra/build.gradle.kts
dependencies {
    implementation(project(":application"))
    implementation(libs.spring.boot.data.jpa)
}

// app/build.gradle.kts
plugins {
    id("billing.kotlin-conventions")
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.kotlin.spring)
}
dependencies {
    implementation(project(":infra"))
    implementation(libs.spring.boot.web)
}
```

A direção das setas é **uma só**: `app → infra → application → domain`. Quebrou? Tem violação arquitetural. O compilador é o linter de arquitetura.

## Tasks importantes

```bash
./gradlew :domain:test          # só testes do domínio (rápido)
./gradlew :app:bootRun          # roda Spring Boot
./gradlew :infra:dependencies   # árvore só do infra
./gradlew build -x test          # build sem testes (use raro)
./gradlew dependencyUpdates      # com plugin Versions
```

## Performance de build

`gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true
kotlin.code.style=official
```

Build cache + configuration cache + parallel + K2 compiler costuma dar **2-4× speedup** num projeto enterprise.

## Critério de domínio

Você dominou este card quando consegue: estruturar um projeto Kotlin em 4 módulos com fronteiras claras; usar version catalog para centralizar versões; criar um convention plugin em buildSrc; explicar por que `domain` não deve depender de Spring; e listar 3 motivos pra usar `./gradlew :domain:test` em vez de `./gradlew test`.
