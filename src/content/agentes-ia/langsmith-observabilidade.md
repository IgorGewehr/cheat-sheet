---
title: "LangSmith — Observabilidade para Agentes"
category: agentes-ia
stack: [Python, TypeScript, LangChain, LangSmith]
tags: [langsmith, tracing, evaluation, debugging, observability]
excerpt: "Agentes são não-determinísticos — sem observabilidade você está depurando às cegas. LangSmith é o padrão para rastrear, avaliar e melhorar agentes LangChain."
related: [langchain-fundamentos, langchain-agents, agent-evaluation]
updated: 2026-04
---

## O que é

LangSmith é a plataforma de observabilidade da LangChain para aplicações LLM. Ela captura traces completos de execução (cada chamada ao LLM, cada tool use, cada retrieval), permite construir datasets de avaliação a partir de traces reais, e executar evals automatizadas para detectar regressões.

**Por que observabilidade é especialmente crítica para agentes:** em um endpoint REST tradicional, um bug tem um caminho de execução. Em um agente, o caminho é não-determinístico — o mesmo input pode tomar caminhos completamente diferentes dependendo das respostas do LLM. Sem tracing, você não tem como saber por que uma execução falhou, quais tools foram chamadas em que ordem, ou o que o modelo recebeu como input.

**Traces no LangSmith** são hierárquicos: a trace raiz representa a execução inteira, com spans filhos para cada chamada LLM, cada tool call, cada retrieval. Cada span tem: input, output, latência, tokens usados, custo estimado, e qualquer metadata que você adicionar.

**O ciclo de melhoria:** você roda em produção → identifica traces com problema (usuário deu feedback negativo, output malformado, exceção) → adiciona esses exemplos a um dataset → roda eval automatizada → mede se sua mudança de prompt/modelo melhorou → deploy com confiança.

## Quando usar

- Qualquer aplicação LangChain em produção — tracing é basicamente gratuito e a visibilidade é inestimável
- Quando você vai iterar em prompts e precisa medir o impacto das mudanças
- Quando está integrando um novo modelo e quer comparar qualidade (A/B em datasets)
- Para debugging de comportamentos bizarros que você não consegue reproduzir em dev

## Quando NÃO usar

- Para aplicações sem LangChain — LangSmith funciona melhor com o ecossistema LangChain (embora suporte OpenTelemetry)
- Como substituto de APM geral — use Datadog/New Relic para métricas de infraestrutura; LangSmith para métricas de LLM

## Como pedir pra IA

> "Adiciona LangSmith tracing a esta aplicação LangChain [CÓDIGO]. Preciso de: (1) setup básico com variáveis de ambiente e project naming por feature/ambiente, (2) tags customizadas para identificar user_id e feature name em cada trace, (3) criação de dataset a partir de traces usando a API do LangSmith Client, (4) evaluator custom que usa LLM-as-judge para avaliar relevância da resposta, (5) como rodar a eval e interpretar os resultados. Use Python."

## Como auditar o que a IA gerou

- [ ] Verificar se `LANGCHAIN_TRACING_V2=true` e `LANGCHAIN_API_KEY` estão nas variáveis de ambiente (não hardcoded)
- [ ] Confirmar que `LANGCHAIN_PROJECT` é específico por feature/ambiente (não genérico "default")
- [ ] Verificar se tags de negócio (user_id, tenant_id, feature) estão sendo passadas nos runs
- [ ] Checar se o dataset de eval tem pelo menos 20 exemplos representativos (não apenas casos fáceis)
- [ ] Confirmar que o evaluator tem critérios claros no prompt (não apenas "avalie a qualidade")
- [ ] Verificar se há link entre o trace e o objeto de negócio que gerou (ex: ID do pedido ou contrato)

## Armadilhas comuns

- **Tracing em dev com dados de produção** — cuidado com PII em traces. Use `hide_inputs=True` ou sanitize antes de enviar
- **Project name genérico** — com project "default" você vai misturar traces de features diferentes e não vai conseguir filtrar nada útil
- **Avaliar apenas o caso feliz** — datasets de eval com apenas inputs "fáceis" são inúteis. Os exemplos mais valiosos são os edge cases e os casos onde o sistema falhou
- **LLM-as-judge sem critérios claros** — "avalie a qualidade" resulta em avaliações inconsistentes. Defina critérios específicos e mensuráveis

## Exemplo prático

```python
import os
from langsmith import Client, traceable
from langsmith.evaluation import evaluate, LangChainStringEvaluator
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

# Setup — variáveis de ambiente em .env
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "ls_..."
os.environ["LANGCHAIN_PROJECT"] = "brain-rag-contratos"  # específico por feature

# Tracing automático funciona apenas com LCEL e LangChain
llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
prompt = ChatPromptTemplate.from_messages([
    ("system", "Você analisa contratos. Seja preciso e cite artigos quando relevante."),
    ("human", "{question}"),
])
chain = prompt | llm

# Para código não-LangChain: @traceable decorator
@traceable(
    name="processar_nfe",
    tags=["fiscal", "nfe"],  # tags ajudam a filtrar no LangSmith
)
def processar_nfe(nfe_xml: str, user_id: str) -> dict:
    # Adiciona metadata ao trace atual
    from langsmith import get_current_run_tree
    run = get_current_run_tree()
    if run:
        run.add_metadata({"user_id": user_id, "nfe_size": len(nfe_xml)})
    
    # ... lógica de processamento
    return {"status": "processado"}

# Criar dataset de eval a partir de traces reais
ls_client = Client()

# Método 1: criar exemplos manualmente
dataset = ls_client.create_dataset(
    "contratos-eval-v1",
    description="Exemplos de análise de contratos, incluindo edge cases"
)

ls_client.create_examples(
    inputs=[
        {"question": "Qual é o prazo de vigência deste contrato?"},
        {"question": "Quais são as penalidades por rescisão antecipada?"},
        # Adicione edge cases reais de traces que falharam
    ],
    outputs=[
        {"answer": "O contrato tem vigência de 12 meses..."},
        {"answer": "Em caso de rescisão antecipada, aplica-se multa de 20%..."},
    ],
    dataset_id=dataset.id,
)

# Evaluator customizado com LLM-as-judge
def relevancia_evaluator(run, example) -> dict:
    """Avalia se a resposta é relevante e factualmente baseada no contexto."""
    judge = ChatAnthropic(model="claude-3-5-haiku-20241022")  # Use modelo barato para judge
    
    judge_prompt = f"""Avalie se a RESPOSTA é relevante e correta para a PERGUNTA.
    
PERGUNTA: {example.inputs["question"]}
RESPOSTA ESPERADA: {example.outputs["answer"]}
RESPOSTA GERADA: {run.outputs["output"]}

Critérios:
1. A resposta trata da pergunta feita? (não responde outra coisa)
2. As informações são consistentes com a resposta esperada?
3. Não há informações fabricadas que contradizem a resposta esperada?

Responda com JSON: {{"score": 0-1, "reasoning": "explicação breve"}}"""
    
    result = judge.invoke(judge_prompt)
    import json
    parsed = json.loads(result.content)
    return {"key": "relevancia", "score": parsed["score"], "comment": parsed["reasoning"]}

# Rodar avaliação
def target_function(inputs: dict) -> dict:
    response = chain.invoke(inputs)
    return {"output": response.content}

results = evaluate(
    target_function,
    data=dataset.name,
    evaluators=[relevancia_evaluator],
    experiment_prefix="claude-sonnet-v1",
    metadata={"model": "claude-3-5-sonnet-20241022", "prompt_version": "v3"},
)

print(f"Score médio de relevância: {results.to_pandas()['feedback.relevancia'].mean():.2f}")
```

**Lendo traces efetivamente:**
1. Filtre por `status = error` primeiro — resolva todos os erros antes de otimizar qualidade
2. Ordene por `latency` decrescente — identifique os calls mais lentos
3. Use tags para filtrar por feature específica
4. Compare duas experiments lado a lado para ver impacto de mudança de prompt
