---
title: "Spring AI 1.x: ChatClient, RAG, Function Calling, MCP"
category: agentes-ia
stack: [Spring Boot, Kotlin, Spring AI, OpenAI, Anthropic, pgvector]
tags: [spring-ai, llm, rag, function-calling, mcp, pgvector]
excerpt: "Spring AI em Kotlin: ChatClient unificado para OpenAI/Anthropic, structured output tipado, function calling, RAG com pgvector e MCP server — integração LLM enterprise sem cargo cult."
related: [mcp-protocol, tool-use-function-calling, spring-redis-cache-idempotencia]
updated: "2026-05-11"
---

## O ecossistema Spring AI

Spring AI 1.x (lançado oficial em 2024-2025) unifica acesso a LLMs no Spring Boot:

- **ChatClient**: interface fluente para chamar qualquer provider (OpenAI, Anthropic, Bedrock, Vertex, Mistral, Ollama).
- **Embedding**: API unificada para gerar embeddings.
- **VectorStore**: abstração sobre Pinecone, Weaviate, pgvector, Redis, Qdrant.
- **Advisors**: middleware para chat (caching, logging, retry, RAG).
- **MCP**: cliente e servidor do Model Context Protocol.

```kotlin
dependencies {
    implementation("org.springframework.ai:spring-ai-starter-model-anthropic")
    implementation("org.springframework.ai:spring-ai-starter-vector-store-pgvector")
    implementation("org.springframework.ai:spring-ai-starter-model-openai")  // se usa OpenAI
}
```

## ChatClient básico

```kotlin
@Service
class AssistenteService(builder: ChatClient.Builder) {

    private val chat = builder
        .defaultSystem("Você é assistente de suporte ao cliente. Responda em PT-BR.")
        .build()

    fun perguntar(pergunta: String): String =
        chat.prompt()
            .user(pergunta)
            .call()
            .content()
}
```

`application.yml`:

```yaml
spring:
  ai:
    anthropic:
      api-key: ${ANTHROPIC_API_KEY}
      chat:
        options:
          model: claude-opus-4-7
          temperature: 0.3
          max-tokens: 4000
```

## Structured Output tipado

```kotlin
data class TriagemTicket(
    val categoria: String,
    val prioridade: Prioridade,
    val resumo: String,
    val proximaAcao: String,
) {
    enum class Prioridade { BAIXA, MEDIA, ALTA, URGENTE }
}

fun triar(ticket: String): TriagemTicket =
    chat.prompt()
        .user("Analise este ticket e devolva JSON: $ticket")
        .call()
        .entity(TriagemTicket::class.java)
```

Spring AI gera schema JSON automaticamente da classe, instrui o modelo, valida o retorno. Você não escreve parsing.

## Streaming SSE

```kotlin
@RestController
class ChatController(private val chat: ChatClient) {

    @GetMapping("/chat", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun stream(@RequestParam pergunta: String): Flux<String> =
        chat.prompt().user(pergunta).stream().content()
}
```

Cliente browser recebe tokens em tempo real (UX de "digitando").

## Function Calling (Tool Use)

```kotlin
@Service
class PedidoTools(private val repo: PedidoRepository) {

    @Tool(description = "Busca pedido por ID")
    fun buscarPedido(
        @ToolParam(description = "UUID do pedido") id: String,
    ): PedidoResponse? {
        return repo.findById(UUID.fromString(id))
            ?.let { PedidoResponse(it.id, it.status, it.total) }
    }

    @Tool(description = "Cancela pedido com motivo")
    fun cancelarPedido(
        @ToolParam(description = "UUID do pedido") id: String,
        @ToolParam(description = "Motivo do cancelamento") motivo: String,
    ): String {
        repo.cancelar(UUID.fromString(id), motivo)
        return "Cancelado com sucesso"
    }
}

@Service
class AssistenteSuporte(builder: ChatClient.Builder, private val tools: PedidoTools) {

    private val chat = builder
        .defaultSystem("Assistente do balcão. Use as tools quando precisar de dados.")
        .defaultTools(tools)
        .build()

    fun atender(mensagem: String): String =
        chat.prompt().user(mensagem).call().content()
}
```

LLM decide quando chamar `buscarPedido` baseado no contexto. Spring AI gerencia o ciclo (LLM → tool → resultado → LLM).

**Cuidados**:
- valide input do tool (LLM pode passar UUID inválido);
- tool com side effect (cancelar, deletar) exige confirmação humana;
- timeout no tool — LLM pode insistir;
- log tudo (request, tool calls, response).

## RAG com pgvector

Vector store local em Postgres:

```yaml
spring:
  ai:
    vectorstore:
      pgvector:
        index-type: HNSW
        distance-type: COSINE_DISTANCE
        dimensions: 1536  # depende do embedding model
        initialize-schema: true
        schema-name: public
        table-name: vector_store
```

Indexação:

```kotlin
@Service
class IndexadorDocumentos(
    private val vectorStore: VectorStore,
    private val embedding: EmbeddingModel,
) {
    fun indexar(documentos: List<DocumentoNegocio>) {
        val docs = documentos.map { d ->
            Document(d.id, d.conteudo, mapOf(
                "tenant" to d.tenant,
                "categoria" to d.categoria,
                "atualizadoEm" to d.atualizadoEm.toString(),
            ))
        }
        vectorStore.add(docs)
    }
}
```

Query RAG:

```kotlin
@Service
class AssistenteRAG(
    builder: ChatClient.Builder,
    private val vectorStore: VectorStore,
) {
    private val chat = builder
        .defaultAdvisors(QuestionAnswerAdvisor(vectorStore))
        .build()

    fun responder(pergunta: String, tenant: String): String =
        chat.prompt()
            .user(pergunta)
            .advisors { advisor ->
                advisor.param("filter_expression", "tenant == '$tenant'")
                advisor.param("topK", 5)
            }
            .call()
            .content()
}
```

`QuestionAnswerAdvisor` automatiza: gera embedding da pergunta, busca similar no vector store, injeta no prompt como contexto, chama LLM.

## Chunking strategy

```kotlin
val splitter = TokenTextSplitter(
    chunkSize = 800,             // tokens por chunk
    minChunkSizeChars = 200,
    minChunkLengthToEmbed = 5,
    maxNumChunks = 10_000,
    keepSeparator = true,
)

val tikaReader = TikaDocumentReader(resource)
val docs = splitter.apply(tikaReader.get())
```

Tradeoffs:
- **Chunks pequenos** (200-500 tokens): retrieval mais preciso, mas perde contexto.
- **Chunks grandes** (1000-2000): mais contexto, mas dilui relevância.
- **Overlap** (50-100 tokens): evita cortar frase no meio.

Faça **eval com golden dataset**: pergunte X questões, veja se o doc certo aparece em top-K.

## Advisors customizados

Cache de resposta:

```kotlin
@Component
class CacheAdvisor(private val redis: StringRedisTemplate) : RequestResponseAdvisor {

    override fun adviseRequest(request: AdvisedRequest, context: Map<String, Any>): AdvisedRequest {
        val key = "ai:cache:${hash(request.userText())}"
        redis.opsForValue().get(key)?.let { cached ->
            throw EarlyReturn(cached)
        }
        return request
    }

    override fun adviseResponse(response: AdvisedResponse, context: Map<String, Any>): AdvisedResponse {
        val key = "ai:cache:${hash(/* ... */)}"
        redis.opsForValue().set(key, response.response().result.output.content, Duration.ofHours(24))
        return response
    }
}
```

Logging, retry, rate limit — mesma ideia.

## MCP (Model Context Protocol) Server

Expor seu domínio como tools MCP para qualquer cliente compatível (Claude Desktop, Cursor, Claude Code):

```kotlin
@Configuration
class McpConfig {
    @Bean
    fun pedidoTools(repo: PedidoRepository) = ToolCallbacks.from(PedidoTools(repo))

    @Bean
    fun mcpServer(tools: List<ToolCallback>): McpServer {
        return McpServer.async()
            .tools(tools)
            .resources(/* ... */)
            .build()
    }
}
```

Expor via stdio (CLI tools) ou HTTP/SSE (web). MCP é o protocolo que Anthropic publicou em 2024 e virou padrão de fato pra agentes em 2025-2026.

## Controle de custo

Custo de LLM acumula rápido. Boas práticas:

- **Cache de resposta** para perguntas frequentes;
- **Modelo menor** (Haiku/GPT-4o-mini) onde possível;
- **Prompt cache** (Anthropic): caching de sys prompt longo;
- **Limite por usuário** (rate limit + quota);
- **Métricas de tokens**: `tokens_used_total{model, type}`;
- **Sentinela em PROMPT**: nem todo pergunta merece LLM (regex/regra direta primeiro).

```kotlin
@Service
class TokenMetrics(meterRegistry: MeterRegistry) {
    private val counter = Counter.builder("llm.tokens.total")
        .tag("type", "completion")
        .register(meterRegistry)

    fun registrar(usage: Usage) {
        counter.increment(usage.outputTokens.toDouble())
    }
}
```

## Hallucination: como mitigar

LLM inventa fatos. Mitigações:

1. **Grounding**: RAG com fonte autoritativa (não internet, não memória do modelo).
2. **Citações obrigatórias**: peça "cite o documento fonte".
3. **Schema rígido** (structured output): "campo X DEVE ser um dos: A, B, C".
4. **Cross-check**: gera resposta, valida com outra chamada / regra.
5. **Confidence score**: peça nível de certeza; baixo → diga "não sei".
6. **Eval suite**: 100 perguntas, ground truth, verifique precisão.

## Anti-padrões

1. **LLM como fonte da verdade**: ele inventa. Use como **interface**, não banco de dados.
2. **Sem timeout**: LLM trava → seu request trava 60s.
3. **Sem cache**: repetir pergunta = pagar de novo.
4. **Tools sem validação**: LLM passa lixo, sua app crasha.
5. **Prompt em produção sem versionamento**: mudou prompt, deploy quebrou.
6. **Sem audit log**: incidente de hallucination sem trail.

## Critério de domínio

Você dominou este card quando consegue: configurar `ChatClient` para Anthropic em Kotlin; usar structured output com data class; criar tool com `@Tool` e validar input; indexar documento em pgvector e fazer query RAG com filtro; e listar 4 estratégias de mitigação de hallucination.
