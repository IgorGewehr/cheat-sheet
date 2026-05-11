---
title: "Kotlin: Primeiros Passos e Toolchain"
category: stack-guides
stack: [Kotlin, Gradle, JDK]
tags: [kotlin, gradle, jdk, setup, intellij]
excerpt: "Comece em Kotlin do jeito profissional: JDK 21+, Gradle Kotlin DSL, IntelliJ, build/test/run e o vocabulário técnico de projetos enterprise reais."
related: [kotlin-linguagem-essencial, kotlin-gradle-multi-module, spring-boot-essentials]
updated: "2026-05-11"
---

## O que Kotlin é

Kotlin é uma linguagem moderna, tipada estaticamente, que roda na JVM (também compila para JS, Native e iOS). Foi criada pela JetBrains em 2011, virou oficial para Android em 2017 e hoje é a stack padrão recomendada pela Spring desde Spring 5. "Tipada estaticamente" significa que o compilador verifica todos os tipos antes da execução — chega de `NullPointerException` aleatório.

Kotlin não tenta substituir Java; ela substitui boilerplate. Em ambientes enterprise, Kotlin brilha quando você precisa de:

- serviços HTTP backend (Spring Boot, Ktor, Micronaut, Quarkus);
- código de domínio expressivo (data classes, sealed classes, when exaustivo);
- corrotinas para concorrência estruturada sem callback hell;
- integração 100% transparente com bibliotecas Java existentes;
- compatibilidade binária com qualquer JAR.

## Onde baixar

Você precisa de duas coisas: **JDK** (Java Development Kit) e **uma forma de gerenciar projetos** (Gradle). O Kotlin é distribuído como dependência Gradle/Maven — você não instala o `kotlinc` global em produção.

Versões alvo profissionais em maio/2026:

- **JDK 21 LTS** (preferida) ou **JDK 17 LTS** (mínimo para Spring Boot 3).
- **Kotlin 2.0+** (compilador K2, mais rápido) — fixado via Gradle plugin.
- **Gradle 8.x** com **Kotlin DSL** (`build.gradle.kts`).
- **IntelliJ IDEA Community** ou **Ultimate** (recomendado).

Instale a JDK via [SDKMAN!](https://sdkman.io/) (Linux/macOS) ou [scoop](https://scoop.sh/) (Windows):

```bash
sdk install java 21.0.4-tem
sdk install gradle 8.10
```

Verifique:

```bash
java -version
gradle -version
```

Termos importantes:

- `JAVA_HOME`: onde a JDK foi instalada — Spring Boot e Gradle leem isto.
- `JDK` vs `JRE`: JDK inclui o compilador (`javac`, `kotlinc`); JRE só roda. Use JDK.
- `LTS`: Long Term Support — suporte estendido. Use sempre LTS em produção.
- `bytecode`: a saída do compilador Kotlin é bytecode JVM (`.class`), igual ao Java.

## Criando um projeto

Use o [Spring Initializr](https://start.spring.io/) para projetos Spring Boot. Para um Kotlin puro, basta:

```bash
mkdir billing-service
cd billing-service
gradle init --type kotlin-application --dsl kotlin --test-framework junit-jupiter
```

Estrutura mínima profissional:

```text
billing-service/
├── build.gradle.kts          # config Gradle (Kotlin DSL)
├── settings.gradle.kts       # nome do projeto + sub-módulos
├── gradle/libs.versions.toml # version catalog (centraliza versões)
├── gradle.properties         # JVM args, parallel, caching
├── src/
│   ├── main/kotlin/com/igor/billing/Application.kt
│   └── test/kotlin/com/igor/billing/ApplicationTest.kt
```

Conteúdo mínimo de `build.gradle.kts`:

```kotlin
plugins {
    kotlin("jvm") version "2.0.20"
    application
}

dependencies {
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.3")
}

kotlin {
    jvmToolchain(21)
}

application {
    mainClass.set("com.igor.billing.ApplicationKt")
}

tasks.test { useJUnitPlatform() }
```

E `Application.kt`:

```kotlin
package com.igor.billing

fun main() {
    println("billing-service ready")
}
```

Rode:

```bash
./gradlew run
./gradlew build
./gradlew test
./gradlew check         # roda test + lint
```

## Comandos que você precisa internalizar

| Comando | Uso profissional |
|---|---|
| `./gradlew run` | compila e executa a app |
| `./gradlew build` | compila + testa + empacota tudo |
| `./gradlew test` | só os testes |
| `./gradlew assemble` | empacota sem rodar testes |
| `./gradlew clean` | apaga `build/` (use com parcimônia, quebra cache) |
| `./gradlew dependencies` | árvore completa de dependências |
| `./gradlew --scan` | upload de build scan público (debug profundo) |
| `./gradlew tasks --all` | lista todas as tasks disponíveis |

O `./gradlew` (wrapper) é obrigatório — garante que todo dev e CI use a **mesma versão de Gradle**, sem depender da instalação global.

## Modelo mental inicial

Um projeto Kotlin é organizado em **packages** (igual Java). Cada pasta abaixo de `src/main/kotlin/` é um package, com ponto separador (`com.igor.billing`). Você pode misturar `.kt` e `.java` livremente — a interop é total.

Arquivos Kotlin top-level podem ter funções soltas (sem classe). O `fun main()` é o entrypoint da aplicação. Se você tem um arquivo `Application.kt`, o `mainClass` no Gradle vira `com.igor.billing.ApplicationKt` (Kotlin gera uma classe sintética com sufixo `Kt`).

Um serviço enterprise costuma ter múltiplos módulos Gradle:

```text
billing-service/
├── app/          # entrypoint + Spring Boot
├── domain/       # regras de negócio puras (zero Spring)
├── application/  # use cases (depende de domain)
└── infra/        # adapters (DB, Kafka, HTTP)
```

Esse layout permite testar `domain/` em milissegundos, sem ApplicationContext do Spring.

## Critério de domínio

Você dominou este card quando consegue: criar um projeto Kotlin do zero, explicar a diferença entre JDK e JRE, listar 3 vantagens do Gradle wrapper, rodar build/test/run e dizer por que `jvmToolchain(21)` é melhor que setar `sourceCompatibility = "21"` — sem repetir receita decorada.
