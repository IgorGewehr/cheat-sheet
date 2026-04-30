---
title: "Observabilidade de Agentes em Produção"
category: agentes-ia
stack: [Python, TypeScript, LangSmith, OpenTelemetry]
tags: [observability, tracing, monitoring, alerting, agents]
excerpt: "APM tradicional não captura o que importa em agentes — tokens, custo, trajetória de raciocínio e qualidade de output precisam de instrumentação específica."
related: [langsmith-observabilidade, agent-evaluation, agent-deployment]
updated: 2026-04
---

## O que é

Observabilidade para agentes vai além do APM tradicional (latência, erros, throughput). Você precisa responder perguntas que ferramentas convencionais não suportam: "Por que o agente chamou essa tool três vezes?", "Qual request está custando mais tokens?", "O agente está alucinando mais nos últimos 7 dias?", "Qual usuário está causando 30% do custo?"

**O que instrumentar em agentes:**
- **Tokens:** input, output, cached, por request e por usuário/tenant/feature
- **Custo:** calculado por call, acumulado por sessão, por dia, por tenant
- **Latência por etapa:** LLM call, tool execution, retrieval — saber onde está o bottleneck
- **Trajetória:** sequência de tools chamadas, número de iterações, se atingiu max_iterations
- **Qualidade:** taxa de erro por tool, taxa de respostas truncadas (finish_reason=length), feedback de usuário

**OpenTelemetry para LLMs:** existe uma especificação de semântica para spans de LLM (GenAI Semantic Conventions) que padroniza atributos como `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`. Isso permite usar qualquer backend de observabilidade compatível (Jaeger, Grafana Tempo, Datadog) com os mesmos dados.

**"Eval in prod":** amostrar requisições reais de produção, rodar evaluators automáticos nelas, e usar isso como feedback loop. Você detecta degradação de qualidade antes que os usuários reclamem.

**Alertas que importam para agentes:**
- Custo diário por tenant acima de threshold
- Taxa de max_iterations atingido acima de X%
- Latência P95 acima de threshold
- Taxa de erros de tool acima de X%
- Score de qualidade (LLM-as-judge em amostra) caindo abaixo de threshold

## Quando usar

- Qualquer agente em produção com usuários reais — sem isso você está operando às cegas
- Especialmente crítico quando o agente tem custos variáveis (pode ter spikes)
- Quando você precisa de compliance/auditoria (cada ação do agente precisa ser rastreável)

## Quando NÃO usar

- Em ambiente de desenvolvimento onde LangSmith local já é suficiente
- Para prototipação onde o overhead de instrumentação não justifica

## Como pedir pra IA

> "Instrumenta meu agente LangGraph com observabilidade de produção. Preciso de: (1) OpenTelemetry traces com spans para cada LLM call, tool call e retrieval, incluindo atributos GenAI semânticos, (2) métricas de custo calculadas por chamada e acumuladas por tenant_id, (3) logging estruturado (JSON) com: request_id, user_id, action, tokens, cost, duration, (4) alertas configurados para: custo diário > threshold, max_iterations atingido > 5%, P95 latency > 10s. Stack: [Python/TypeScript] com [OpenTelemetry + Grafana / LangSmith / Datadog]."

## Como auditar o que a IA gerou

- [ ] Verificar se cada LLM call tem span com tokens input, output e custo calculado
- [ ] Confirmar que trace propagation funciona entre agentes (IDs corretos em sistemas multi-agente)
- [ ] Verificar se PII não está sendo enviado para ferramentas de observabilidade externas
- [ ] Checar se o custo está sendo acumulado por tenant/user, não apenas por request
- [ ] Confirmar que alertas têm thresholds baseados em dados reais (não chutes)
- [ ] Verificar se sampling rate do "eval in prod" está configurado (100% é caro, 0% é inútil)
- [ ] Checar se há dashboard de "agentic KPIs" separado do dashboard de infra

## Armadilhas comuns

- **Logar dados sensíveis em traces** — o trace captura o input completo do usuário, que pode conter PII. Defina política de sanitização antes de enviar para plataforma de observabilidade
- **Custo de observabilidade > custo do agente** — se você está logando 100% dos traces com payload completo para um backend caro, o custo de observabilidade pode superar o custo do LLM
- **Alertas sem runbooks** — um alerta de "custo alto" sem um runbook (o que fazer quando isso dispara) é ruído
- **Métricas de infra sem métricas de negócio** — latência baixa com qualidade de output ruim não é sucesso

## Exemplo prático

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from functools import wraps
from typing import Any, Callable
import time
import logging
import json

# Setup OpenTelemetry
resource = Resource.create({"service.name": "brain-agents", "service.version": "1.0.0"})
provider = TracerProvider(resource=resource)
exporter = OTLPSpanExporter(endpoint="http://localhost:4317")  # Jaeger, Grafana Tempo, etc.
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("brain.agents")

# Logger estruturado
logger = logging.getLogger("brain.agents")

# Constantes de custo (atualizar conforme pricing da Anthropic)
CUSTO_POR_MTOK = {
    "claude-3-5-sonnet-20241022": {"input": 3.0, "output": 15.0, "cache_read": 0.30},
    "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25, "cache_read": 0.03},
}

def calcular_custo(model: str, input_tokens: int, output_tokens: int, cached_tokens: int = 0) -> float:
    precos = CUSTO_POR_MTOK.get(model, CUSTO_POR_MTOK["claude-3-5-sonnet-20241022"])
    fresh_input = input_tokens - cached_tokens
    return (
        fresh_input * precos["input"] / 1_000_000 +
        cached_tokens * precos["cache_read"] / 1_000_000 +
        output_tokens * precos["output"] / 1_000_000
    )

# Decorator de instrumentação para LLM calls
def instrumentar_llm_call(model: str, tenant_id: str = "default"):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            inicio = time.time()
            
            with tracer.start_as_current_span(f"llm.{model}") as span:
                # Atributos GenAI semânticos
                span.set_attribute("gen_ai.system", "anthropic")
                span.set_attribute("gen_ai.request.model", model)
                span.set_attribute("tenant_id", tenant_id)
                
                try:
                    resultado = await func(*args, **kwargs)
                    
                    # Captura métricas de uso
                    if hasattr(resultado, "usage"):
                        usage = resultado.usage
                        input_tokens = usage.input_tokens
                        output_tokens = usage.output_tokens
                        cached_tokens = getattr(usage, "cache_read_input_tokens", 0)
                        custo = calcular_custo(model, input_tokens, output_tokens, cached_tokens)
                        
                        span.set_attribute("gen_ai.usage.input_tokens", input_tokens)
                        span.set_attribute("gen_ai.usage.output_tokens", output_tokens)
                        span.set_attribute("gen_ai.usage.cached_tokens", cached_tokens)
                        span.set_attribute("llm.cost_usd", custo)
                        
                        # Log estruturado para análise posterior
                        logger.info(json.dumps({
                            "event": "llm_call",
                            "model": model,
                            "tenant_id": tenant_id,
                            "input_tokens": input_tokens,
                            "output_tokens": output_tokens,
                            "cached_tokens": cached_tokens,
                            "cost_usd": custo,
                            "duration_ms": int((time.time() - inicio) * 1000),
                            "finish_reason": getattr(resultado, "stop_reason", "unknown"),
                        }))
                        
                        # Alerta se custo por call é anormalmente alto
                        if custo > 0.10:  # $0.10 por call é muito alto para a maioria dos casos
                            logger.warning(json.dumps({
                                "event": "high_cost_alert",
                                "cost_usd": custo,
                                "tenant_id": tenant_id,
                                "model": model,
                            }))
                    
                    return resultado
                    
                except Exception as e:
                    span.set_attribute("error", True)
                    span.set_attribute("error.message", str(e))
                    logger.error(json.dumps({
                        "event": "llm_error",
                        "error": str(e),
                        "model": model,
                        "tenant_id": tenant_id,
                    }))
                    raise
        return wrapper
    return decorator

# Agregação de custo por tenant (Redis em produção)
from collections import defaultdict
custo_acumulado: dict[str, float] = defaultdict(float)

def registrar_custo_tenant(tenant_id: str, custo: float):
    custo_acumulado[tenant_id] += custo
    
    # Alerta se tenant excedeu threshold diário
    limite_diario = 10.0  # $10/dia por tenant
    if custo_acumulado[tenant_id] > limite_diario:
        logger.warning(json.dumps({
            "event": "tenant_cost_limit_exceeded",
            "tenant_id": tenant_id,
            "custo_acumulado": custo_acumulado[tenant_id],
            "limite": limite_diario,
        }))

# "Eval in prod" — amostrar e avaliar requests reais
import random
from langchain_anthropic import ChatAnthropic

judge = ChatAnthropic(model="claude-3-haiku-20240307")

async def eval_em_producao(request: str, resposta: str, sample_rate: float = 0.05):
    """Avalia amostras de produção automaticamente."""
    if random.random() > sample_rate:
        return  # Só avalia X% dos requests
    
    with tracer.start_as_current_span("eval_in_prod"):
        score_response = await judge.ainvoke(
            f"Numa escala 0-1, a resposta é útil e correta para a pergunta? "
            f"Responda apenas com um número.\nPergunta: {request[:200]}\nResposta: {resposta[:200]}"
        )
        
        try:
            score = float(score_response.content.strip())
            logger.info(json.dumps({
                "event": "eval_in_prod",
                "score": score,
                "sampled": True,
            }))
        except ValueError:
            pass
```
