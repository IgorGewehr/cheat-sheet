---
title: "Arquitetura de Sistemas com Agentes"
category: agentes-ia
stack: [TypeScript, Python, LangGraph, PostgreSQL]
tags: [architecture, agents, design, tradeoffs, when-to-use]
excerpt: "A pergunta mais importante antes de construir um agente: ele realmente resolve o problema melhor do que código determinístico? Um framework honesto para decidir."
related: [langgraph-fundamentos, agent-deployment, multi-agent-orchestration]
updated: 2026-04
---

## O que é

Agentes de IA são a ferramenta certa para uma classe específica de problemas e a ferramenta errada para muitas outras. O erro mais comum não é implementar um agente incorretamente — é implementar um agente onde código determinístico resolveria melhor, mais rápido e mais barato.

**Quando agentes são a ferramenta certa:**
- A tarefa requer raciocínio sobre situações imprevistas que você não pode enumerar
- O espaço de inputs é muito vasto para regras explícitas
- A qualidade do output vale o custo e a latência adicionais
- O usuário precisa de uma interface em linguagem natural para um sistema complexo

**Quando agentes são a ferramenta errada:**
- Você tem um conjunto definido de condições e ações (use if/else ou state machine)
- A tarefa tem critérios objetivos de sucesso que podem ser verificados programaticamente sem LLM
- A latência é crítica (< 200ms) ou o volume é extremamente alto (> 1M calls/dia com custo controlado)
- O output precisa ser 100% determinístico e auditável

**O "complexity tax":** cada camada de abstração de agente adiciona: latência (200ms+ por LLM call), custo (tokens × preço), não-determinismo (o mesmo input pode produzir outputs diferentes), e complexidade de debugging. Esse imposto existe e você precisa ter uma justificativa clara para pagá-lo.

**"Thin agent, thick tools":** os agentes mais robustos têm lógica mínima no agente (apenas o raciocínio e a seleção de ações) e lógica máxima nas ferramentas (que são funções determinísticas e testáveis). Isso maximiza a parte testável e minimiza a parte não-determinística.

**Integração em sistemas existentes:** o pattern "agentic endpoint" é adicionar um endpoint ao seu sistema existente que usa um agente para processar requests complexos, enquanto o resto do sistema continua sendo código tradicional. Você não precisa "reescrever tudo com agentes" — adicione agentes onde fazem sentido.

## Quando usar

- Quando você tem dados não-estruturados (texto livre, documentos) como input
- Quando a tarefa exige múltiplos passos adaptativos (o próximo passo depende do resultado do anterior)
- Quando você precisa de uma interface de linguagem natural para um sistema backend complexo
- Quando a variabilidade do input é alta demais para regras explícitas
- Quando os benefícios de qualidade/UX justificam o custo de latência e tokens

## Quando NÃO usar

- Quando um regex, query SQL ou função determinística resolve o problema
- Quando o output deve ser 100% auditável e reproduzível
- Para hot paths com requisitos de latência < 200ms
- Para substituir validações de negócio (essas devem ser explícitas e testáveis)
- Quando você está tentando evitar escrever código difícil (agentes não simplificam lógica complexa — eles a escondem)

## Como pedir pra IA

> "Analisa esta feature request e me diz: (1) precisa de um agente ou código determinístico resolve? justifique, (2) se agente, qual pattern usar: simples (single LLM call), cadeia (LCEL), agente com tools, ou multi-agente?, (3) estimativa de custo por request e por mês assumindo [VOLUME], (4) checklist de produção (o que precisa estar pronto antes de ir a produção), (5) como testar de forma que eu detecte regressões. Feature: [DESCREVA A FEATURE]."

## Como auditar o que a IA gerou

- [ ] Verificar se a decisão de "usar agente" tem justificativa clara (não "porque LLMs são legais")
- [ ] Confirmar que lógica de negócio está nas tools (determinística), não no prompt do agente
- [ ] Verificar se há testes para as tools individualmente (não apenas end-to-end)
- [ ] Checar se o agente tem uma "saída segura" quando incerto (pede esclarecimento, não inventa)
- [ ] Confirmar que o design permite rollback ou versioning (como você atualiza sem downtime?)
- [ ] Verificar se o custo estimado está dentro do orçamento e se há alertas quando excede
- [ ] Checar se o checklist de produção foi preenchido antes do deploy

## Armadilhas comuns

- **Colocar lógica de negócio no prompt** — "se o valor for maior que R$5000, solicite aprovação gerencial" pertence ao código, não ao prompt. O prompt pode mudar, o código tem testes
- **Agente sem "saída" definida** — o que acontece quando o agente não sabe o que fazer? Deve ter uma resposta padrão segura, não ficar em loop
- **Versioning de agentes como versioning de código** — mudar o modelo ou o prompt sem eval é como fazer deploy sem testes
- **Multi-agente antes de entender o problema** — comece com o agente mais simples possível. Adicione complexidade apenas quando necessário

## Exemplo prático

**Framework de decisão: "devo usar agente?"**

```
ENTRADA: uma feature request ou caso de uso

PASSO 1 — Quais são os inputs?
├── Texto livre / linguagem natural → CONSIDERAR AGENTE
└── Dados estruturados / IDs / números → CONSIDERAR CÓDIGO

PASSO 2 — Existe uma lógica determinística?
├── Sim, posso escrever as regras → USE CÓDIGO
└── Não, requer julgamento sobre situações novas → CONSIDERAR AGENTE

PASSO 3 — Quais são os requisitos?
├── Latência < 500ms e volume alto → CÓDIGO OU HAIKU COM CACHE
├── Determinismo 100% necessário → CÓDIGO
└── Qualidade > velocidade, volume baixo-médio → AGENTE

PASSO 4 — Custo por request aceitável?
├── < R$0.10 por request no volume esperado → VIÁVEL
└── > R$0.10 por request → RECALCULAR COM HAIKU OU CACHE

RESULTADO: USE AGENTE apenas se passou em todos os critérios anteriores
```

**Checklist de produção readiness para agentes:**

```typescript
const PRODUCAO_CHECKLIST = {
  eval: {
    golden_dataset: false,        // Dataset com 20+ exemplos curados?
    eval_automatizada: false,     // Eval rodando em CI?
    threshold_definido: false,    // Qual score mínimo para deploy?
  },
  
  observabilidade: {
    tracing_configurado: false,   // Cada call rastreado?
    custo_por_tenant: false,      // Custo rastreado por usuário/feature?
    alertas_configurados: false,  // Alerta de custo e erro rate?
  },
  
  resiliencia: {
    max_iterations: false,        // Limite de iterações definido?
    timeout: false,               // Timeout máximo por execução?
    retry_com_backoff: false,     // Retry para rate limits e overloaded?
    fallback_definido: false,     // O que acontece quando o agente falha?
  },
  
  seguranca: {
    validacao_input: false,       // Input sanitizado?
    permissoes_minimas: false,    // Agente tem apenas o acesso necessário?
    auditoria_escrita: false,     // Todo write tem log de quem autorizou?
  },
  
  hitl: {
    acoes_irreversiveis_bloqueadas: false, // HITL em ações destrutivas?
    processo_aprovacao_definido: false,    // UI/UX para aprovação existe?
    timeout_de_interrupt: false,           // Interrupts expiram?
  },
  
  deployment: {
    checkpointer_postgres: false,  // Não está usando MemorySaver em prod?
    graceful_shutdown: false,      // Servidor desliga sem perder estado?
    health_check: false,           // Endpoint de health configurado?
  },
};

function avaliarReadiness(checklist: typeof PRODUCAO_CHECKLIST): {
  pronto: boolean;
  blockers: string[];
  avisos: string[];
} {
  const blockers: string[] = [];
  const avisos: string[] = [];
  
  // Bloqueadores absolutos
  if (!checklist.eval.golden_dataset) blockers.push("Criar golden dataset antes do deploy");
  if (!checklist.resiliencia.max_iterations) blockers.push("max_iterations não definido — risco de loop infinito");
  if (!checklist.seguranca.auditoria_escrita) blockers.push("Writes sem auditoria — risco de compliance");
  if (!checklist.deployment.checkpointer_postgres) blockers.push("MemorySaver em produção — estado não persiste");
  
  // Avisos importantes
  if (!checklist.observabilidade.custo_por_tenant) avisos.push("Custo por tenant não rastreado — pode ter surpresas na fatura");
  if (!checklist.hitl.timeout_de_interrupt) avisos.push("Interrupts sem timeout — podem ficar pendentes para sempre");
  if (!checklist.eval.eval_automatizada) avisos.push("Sem eval em CI — regressões não serão detectadas");
  
  return {
    pronto: blockers.length === 0,
    blockers,
    avisos,
  };
}

// Princípio "thin agent, thick tools"
// RUIM: lógica de negócio no agente
const systemPromptRuim = `
Se o valor do pedido for maior que R$5000, mande email para gerente@empresa.com.
Se o cliente está inadimplente há mais de 90 dias, bloqueie o crédito.
Se for o primeiro pedido do cliente, aplique desconto de 10%.
`;

// BOM: lógica de negócio nas tools — testáveis e determinísticas
const tools = [
  {
    name: "verificar_limite_credito",
    description: "Verifica se o cliente pode fazer uma compra no valor solicitado, considerando inadimplência, limite de crédito e histórico.",
    // Implementação: regras de negócio explícitas, testadas com unit tests
  },
  {
    name: "calcular_desconto_cliente",
    description: "Calcula desconto aplicável para o cliente com base no histórico de compras e política comercial vigente.",
    // Implementação: regras determinísticas, auditáveis
  },
  {
    name: "solicitar_aprovacao_gerencial",
    description: "Dispara processo de aprovação gerencial para pedidos acima do limite configurado. Use quando verificar_limite_credito indicar necessidade de aprovação.",
    // Implementação: HITL real, com registro em banco
  },
];
// O agente só precisa decidir QUAL tool chamar e QUANDO
// As regras de negócio ficam no código das tools
```
