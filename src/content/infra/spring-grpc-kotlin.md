---
title: "Spring + gRPC com Kotlin: Protobuf, Streaming, Quando Usar"
category: infra
stack: [Spring Boot, Kotlin, gRPC, Protobuf]
tags: [grpc, protobuf, streaming, kotlin, microservices]
excerpt: "gRPC em Kotlin enterprise: protobuf como contrato, grpc-kotlin para suspend, streaming bidirecional, interceptors e o critério para escolher gRPC vs REST."
related: [spring-microservices-enterprise, golang-grpc, spring-openapi-springdoc]
updated: "2026-05-11"
---

## Quando usar gRPC

gRPC brilha em:
- **comunicação entre microsserviços internos** (alta volumetria, latência baixa);
- **streaming bidirecional** (chat, telemetria, sync de cliente);
- **contratos fortemente tipados** que evoluem com compatibility check;
- **políglota** (cliente em Go falando com servidor em Java/Kotlin/Python).

REST/HTTP brilha em:
- **APIs públicas** (debug com curl, browser, Postman);
- **integração com terceiros** (todos sabem JSON);
- **mobile** (HTTP/2 nem sempre vale o custo de complexidade);
- **CRUDs simples** (gRPC vira overengineering).

**Padrão sênior em arquitetura enterprise**: REST para borda (browser, mobile, parceiros), gRPC para comunicação interna entre microsserviços.

## Protobuf como contrato

`src/main/proto/pedidos.proto`:

```protobuf
syntax = "proto3";

package com.igor.billing.grpc;

option java_package = "com.igor.billing.grpc";
option java_multiple_files = true;

service PedidoService {
  rpc Criar(CriarPedidoRequest) returns (PedidoResponse);
  rpc Buscar(BuscarPedidoRequest) returns (PedidoResponse);
  rpc StreamPedidos(StreamRequest) returns (stream PedidoResponse);  // server stream
  rpc Importar(stream ItemImportacao) returns (ImportacaoResultado);   // client stream
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);           // bidirectional
}

message CriarPedidoRequest {
  string cliente_id = 1;
  repeated ItemRequest itens = 2;
  string idempotency_key = 3;
}

message ItemRequest {
  string sku = 1;
  int32 quantidade = 2;
}

message PedidoResponse {
  string id = 1;
  string cliente_id = 2;
  Status status = 3;
  string total = 4;  // BigDecimal serializado como string
  google.protobuf.Timestamp criado_em = 5;
}

enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_PENDENTE = 1;
  STATUS_CONFIRMADO = 2;
  STATUS_CANCELADO = 3;
}
```

Regras protobuf:
- **número de campo é sagrado**: nunca mude `string cliente_id = 1` para `= 2`. Backward compat quebra.
- **adicione campo no final** sempre.
- **nunca remova** — `reserved 5;` para marcar como inutilizável.
- **enum sempre tem `_UNSPECIFIED = 0`** como default (proto3 não tem null).
- **BigDecimal / Decimal**: serialize como string. Não use double (precisão).

## Gradle setup

```kotlin
plugins {
    id("com.google.protobuf") version "0.9.4"
    kotlin("jvm")
}

dependencies {
    implementation("net.devh:grpc-spring-boot-starter:3.1.0.RELEASE")
    implementation("io.grpc:grpc-kotlin-stub:1.4.1")
    implementation("io.grpc:grpc-protobuf:1.65.1")
    implementation("com.google.protobuf:protobuf-kotlin:4.27.3")
}

protobuf {
    protoc { artifact = "com.google.protobuf:protoc:4.27.3" }
    plugins {
        create("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:1.65.1" }
        create("grpckt") { artifact = "io.grpc:protoc-gen-grpc-kotlin:1.4.1:jdk8@jar" }
    }
    generateProtoTasks {
        all().forEach {
            it.plugins {
                create("grpc")
                create("grpckt")
            }
            it.builtins { create("kotlin") }
        }
    }
}
```

Build gera código Kotlin a partir de `.proto`.

## Servidor

```kotlin
@GrpcService
class PedidoGrpcService(
    private val criar: CriarPedidoUseCase,
    private val buscar: BuscarPedidoUseCase,
) : PedidoServiceGrpcKt.PedidoServiceCoroutineImplBase() {

    override suspend fun criar(request: CriarPedidoRequest): PedidoResponse {
        val cmd = CriarPedidoCommand(
            cliente = ClienteId(request.clienteId),
            itens = request.itensList.map { ItemPedido(it.sku, it.quantidade) },
        )
        val id = criar.executar(cmd)
        return PedidoResponse.newBuilder()
            .setId(id.valor.toString())
            .setClienteId(request.clienteId)
            .setStatus(Status.STATUS_PENDENTE)
            .build()
    }

    override fun streamPedidos(request: StreamRequest): Flow<PedidoResponse> = flow {
        buscar.streamPorCliente(ClienteId(request.clienteId)).collect { pedido ->
            emit(pedido.toGrpcResponse())
        }
    }
}
```

`grpc-kotlin` gera código com `suspend` e `Flow`, integrado naturalmente com corrotinas.

## Cliente

```kotlin
@Configuration
class GrpcClientConfig {
    @Bean
    fun pedidoClient(): PedidoServiceGrpcKt.PedidoServiceCoroutineStub {
        val channel = ManagedChannelBuilder
            .forAddress("billing-service", 9090)
            .usePlaintext()  // mTLS em prod!
            .keepAliveTime(30, TimeUnit.SECONDS)
            .build()
        return PedidoServiceGrpcKt.PedidoServiceCoroutineStub(channel)
    }
}

@Service
class IntegracaoService(private val client: PedidoServiceGrpcKt.PedidoServiceCoroutineStub) {

    suspend fun importarDoCliente(clienteId: String): List<Pedido> =
        client.streamPedidos(StreamRequest.newBuilder().setClienteId(clienteId).build())
            .map { it.toDomain() }
            .toList()
}
```

## Interceptors

Para auth, logging, tracing — não polua handlers:

```kotlin
@GrpcGlobalServerInterceptor
class AuthInterceptor : ServerInterceptor {
    override fun <ReqT, RespT> interceptCall(
        call: ServerCall<ReqT, RespT>,
        headers: Metadata,
        next: ServerCallHandler<ReqT, RespT>,
    ): ServerCall.Listener<ReqT> {
        val token = headers.get(Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER))
        if (token == null) {
            call.close(io.grpc.Status.UNAUTHENTICATED.withDescription("token ausente"), Metadata())
            return object : ServerCall.Listener<ReqT>() {}
        }
        val ctx = Context.current().withValue(USER_CTX_KEY, validar(token))
        return Contexts.interceptCall(ctx, call, headers, next)
    }
}
```

## Error handling

gRPC tem **status codes próprios** (não HTTP):

| Status | Quando |
|---|---|
| `OK` | sucesso |
| `INVALID_ARGUMENT` | payload mal formado / validação |
| `NOT_FOUND` | recurso inexistente |
| `ALREADY_EXISTS` | conflito |
| `PERMISSION_DENIED` | autorização |
| `UNAUTHENTICATED` | sem credencial |
| `RESOURCE_EXHAUSTED` | rate limit |
| `FAILED_PRECONDITION` | regra de negócio |
| `ABORTED` | conflito otimista |
| `OUT_OF_RANGE` | range inválido |
| `UNIMPLEMENTED` | método não implementado |
| `INTERNAL` | bug |
| `UNAVAILABLE` | indisponível (retry com backoff) |
| `DEADLINE_EXCEEDED` | timeout |

Em handler:

```kotlin
override suspend fun buscar(request: BuscarPedidoRequest): PedidoResponse {
    val pedido = buscar.executar(PedidoId(UUID.fromString(request.id)))
        ?: throw StatusException(
            io.grpc.Status.NOT_FOUND
                .withDescription("Pedido ${request.id} não encontrado")
        )
    return pedido.toGrpcResponse()
}
```

Cliente captura `StatusRuntimeException` e mapeia.

## Deadlines

```kotlin
val client = stub.withDeadlineAfter(5, TimeUnit.SECONDS)
client.buscar(...)
```

Diferente de timeout HTTP: deadline **se propaga** entre serviços (A → B → C; se A tem deadline 5s, C também). Crucial em cascata de chamadas.

## Streaming patterns

| Tipo | Cliente envia | Servidor envia |
|---|---|---|
| Unary | 1 | 1 |
| Server streaming | 1 | N |
| Client streaming | N | 1 |
| Bidirectional | N (independente) | N (independente) |

Use **server streaming** para listas grandes (page sem paginação manual). **Bidirectional** para chat, sync de cliente, telemetria. **Client streaming** raro — upload em chunks.

## mTLS em produção

```kotlin
val channel = NettyChannelBuilder.forAddress("billing-service", 9090)
    .sslContext(
        GrpcSslContexts.forClient()
            .trustManager(File("/secrets/ca.crt"))
            .keyManager(File("/secrets/client.crt"), File("/secrets/client.key"))
            .build()
    )
    .build()
```

Em service mesh (Istio, Linkerd), mTLS é automático — sidecar cuida.

## REST gateway com grpc-gateway

Para expor o mesmo gRPC service como REST externo, use [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) (anota `.proto` com mapping HTTP). Gera proxy REST → gRPC. Permite REST público + gRPC interno do mesmo contrato.

## Anti-padrões

1. **gRPC pra browser direto**: gRPC-Web existe mas tem limitações; REST/JSON é mais simples.
2. **Quebrar compat de protobuf** (renomear campo, mudar número): apocalipse de versões.
3. **Sem deadline**: cliente espera para sempre se servidor trava.
4. **Erro genérico `INTERNAL`**: cliente não consegue tratar; use status específico.
5. **Streaming bidirecional pra coisa simples**: complexidade não justificada.

## Critério de domínio

Você dominou este card quando consegue: escolher entre gRPC e REST com critério; escrever `.proto` com regras de evolução; implementar service em Kotlin com `grpc-kotlin` e suspend; configurar interceptor de auth; e listar 5 status codes gRPC com semântica diferente de HTTP.
