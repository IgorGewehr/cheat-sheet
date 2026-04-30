---
title: "Agentes para ERP Financeiro — Patterns e Riscos"
category: agentes-ia
stack: [TypeScript, Python, Claude, LangGraph]
tags: [agents, financial, erp, compliance, audit]
excerpt: "Agentes financeiros têm requisitos que não existem em outros domínios — irreversibilidade, compliance e trilha de auditoria são não-negociáveis."
related: [human-in-the-loop, agent-security, agent-evaluation]
updated: 2026-04
---

## O que é

Agentes em contexto de ERP financeiro operam com dados e operações que têm consequências reais e irreversíveis: emissão de notas fiscais, lançamentos contábeis, processamento de pagamentos, comunicação com SEFAZ. Um erro não é apenas um bug — pode ser uma multa fiscal, um débito duplicado ou uma obrigação legal violada.

**A distinção fundamental: agentes de leitura vs agentes de escrita.**

Agentes de leitura (consultar saldo, gerar relatórios, calcular impostos, reconciliar movimentos) são seguros por design — não têm efeitos colaterais. Você pode iterar rapidamente nesses sem preocupações especiais além da qualidade do output.

Agentes de escrita (criar pedidos, emitir NFs, fazer lançamentos, processar pagamentos) exigem: (1) HITL para aprovação, (2) idempotência (executar a mesma operação duas vezes deve ter o mesmo resultado que uma), (3) trilha de auditoria completa, (4) rollback ou processo de estorno definido antes de implementar.

**O padrão "propose then approve":** o agente analisa a situação, calcula o que precisa ser feito, apresenta uma proposta clara com impacto (ex: "Vou criar 3 lançamentos contábeis totalizando R$ 15.430,00 referentes às NFes 001234 a 001237"), e só executa após aprovação humana explícita.

**Trilha de auditoria:** cada ação de um agente financeiro deve gerar um registro imutável com: quem autorizou (user_id), o que foi proposto (pelo agente), o que foi executado, quando, resultado. Isso é requisito de compliance (LGPD para dados pessoais, Lei 9.613 para operações financeiras) e é essencial para debugging quando algo dá errado.

**Idempotência em operações financeiras:** se o agente for executado duas vezes por um retry ou bug, a segunda execução deve ser segura. Implemente com idempotency keys: antes de criar uma operação, verifique se já existe uma com a mesma chave.

## Quando usar

- Reconciliação de transações com NFes (leitura + matching — seguro)
- Geração de relatórios fiscais e demonstrações contábeis (leitura — seguro)
- Análise de inadimplência e scoring de crédito (leitura — seguro)
- Automação de DAS/DARF/GNRE (escrita — requer HITL e auditoria completa)
- Integração com SEFAZ para consulta de status de NFe (leitura — seguro)

## Quando NÃO usar

- Para substituir o contador ou responsável técnico fiscal — o agente assiste, não substitui
- Quando o processo de rollback não está definido (não implemente escrita sem saber como desfazer)
- Para operações acima de thresholds de valor sem escalação para aprovação humana sênior
- Quando a integração com o sistema de destino não tem idempotência (risco de duplicação)

## Como pedir pra IA

> "Implementa um agente de reconciliação financeira em TypeScript usando LangGraph. O agente deve: (1) ler extrato bancário e movimentos do ERP, (2) fazer matching automático e identificar divergências, (3) para cada divergência, PROPOR o lançamento de ajuste (nunca executar diretamente), (4) gerar trilha de auditoria de cada ação proposta com timestamp, user_id e hash do conteúdo, (5) implementar idempotência via hash do par [extrato_linha, movimento_erp]. HITL obrigatório antes de qualquer escrita."

## Como auditar o que a IA gerou

- [ ] Verificar se NENHUMA operação de escrita é executada sem HITL e registro de quem aprovou
- [ ] Confirmar que idempotency key está implementada para todas as operações de escrita
- [ ] Verificar se a trilha de auditoria é append-only (não pode ser deletada ou editada)
- [ ] Checar se valores monetários usam tipo correto (Decimal/BigInt, nunca float)
- [ ] Confirmar que há validação de que a operação ainda é válida antes de executar (estado pode ter mudado desde a proposta)
- [ ] Verificar se há logging de falhas de integração com sistemas externos (SEFAZ, banco)
- [ ] Checar se o agente tem acesso mínimo necessário (read-only onde possível, write apenas onde necessário)

## Armadilhas comuns

- **Float para valores monetários** — `0.1 + 0.2 !== 0.3` em JavaScript. Use Decimal.js ou represente centavos como inteiros
- **Sem idempotência** — um retry após timeout pode criar a mesma operação duas vezes. Sempre implemente idempotency keys
- **HITL como opcional** — em operações financeiras, HITL não é "nice to have". É não-negociável
- **Agente com permissões de admin** — o agente deve ter permissões mínimas. Se o agente só lê NFes, não dê acesso de write ao banco
- **Integração SEFAZ sem tratamento de timeout** — SEFAZ tem SLA ruim. Sempre implemente retry com backoff e persista o estado

## Exemplo prático

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";
import { interrupt, Command } from "@langchain/langgraph";
import Anthropic from "@anthropic-ai/sdk";
import Decimal from "decimal.js";

const client = new Anthropic();

interface LancamentoContabil {
  conta_debito: string;
  conta_credito: string;
  valor: string;       // String com Decimal para evitar float
  historico: string;
  idempotency_key: string;  // Hash SHA256 do contexto
}

interface EstadoReconciliacao {
  extrato_banco: Array<{ id: string; valor: string; data: string; descricao: string }>;
  movimentos_erp: Array<{ id: string; valor: string; data: string; conta: string }>;
  divergencias: Array<{ tipo: string; descricao: string; valor_diferenca: string }>;
  lancamentos_propostos: LancamentoContabil[];
  aprovado_por: string | null;
  executado: boolean;
  auditoria: Array<{ timestamp: string; acao: string; user?: string; hash?: string }>;
}

function calcularIdempotencyKey(dados: Record<string, string>): string {
  // Em produção, usar crypto.createHash('sha256')
  return Buffer.from(JSON.stringify(dados)).toString("base64").slice(0, 32);
}

// Nó de análise (leitura — seguro)
async function analisarDivergencias(state: EstadoReconciliacao): Promise<Partial<EstadoReconciliacao>> {
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `Analise as divergências entre extrato bancário e movimentos do ERP.
      
EXTRATO BANCO: ${JSON.stringify(state.extrato_banco)}
MOVIMENTOS ERP: ${JSON.stringify(state.movimentos_erp)}

Identifique divergências e retorne JSON com a lista de divergências encontradas.
Para cada divergência, calcule o lançamento contábil necessário para ajuste.
NUNCA invente dados — apenas identifique discrepâncias reais.

Retorne JSON: { "divergencias": [...], "lancamentos_propostos": [...] }`,
    }],
    temperature: 0,
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Resposta inesperada");
  
  const parsed = JSON.parse(content.text);
  
  // Adiciona idempotency key em cada lançamento
  const lancamentosComKey = parsed.lancamentos_propostos.map((l: LancamentoContabil) => ({
    ...l,
    valor: new Decimal(l.valor).toFixed(2), // Garante precisão decimal
    idempotency_key: calcularIdempotencyKey({
      conta_debito: l.conta_debito,
      conta_credito: l.conta_credito,
      valor: l.valor,
      historico: l.historico,
    }),
  }));

  return {
    divergencias: parsed.divergencias,
    lancamentos_propostos: lancamentosComKey,
    auditoria: [
      ...(state.auditoria || []),
      {
        timestamp: new Date().toISOString(),
        acao: `Análise concluída: ${parsed.divergencias.length} divergências, ${lancamentosComKey.length} lançamentos propostos`,
      },
    ],
  };
}

// Nó de aprovação — HITL obrigatório
function solicitarAprovacao(state: EstadoReconciliacao) {
  const valorTotal = state.lancamentos_propostos.reduce(
    (sum, l) => sum.add(new Decimal(l.valor)),
    new Decimal(0)
  );

  // PAUSA AQUI — não executa nada sem aprovação
  const decisao = interrupt({
    tipo: "aprovacao_lancamentos_contabeis",
    resumo: `Encontradas ${state.divergencias.length} divergências. Serão criados ${state.lancamentos_propostos.length} lançamentos contábeis totalizando R$ ${valorTotal.toFixed(2)}.`,
    detalhes: state.divergencias,
    lancamentos: state.lancamentos_propostos,
    alerta: valorTotal.gt(10000) ? "VALOR ACIMA DE R$10.000 — REQUER APROVAÇÃO GERENCIAL" : null,
  });

  return {
    aprovado_por: decisao.aprovado ? decisao.user_id : null,
    auditoria: [
      ...(state.auditoria || []),
      {
        timestamp: new Date().toISOString(),
        acao: decisao.aprovado ? "APROVADO por humano" : "REJEITADO por humano",
        user: decisao.user_id,
      },
    ],
  };
}

// Nó de execução — só chega aqui se aprovado
async function executarLancamentos(state: EstadoReconciliacao): Promise<Partial<EstadoReconciliacao>> {
  if (!state.aprovado_por) {
    throw new Error("Tentativa de execução sem aprovação — bug crítico");
  }

  const lancamentosExecutados: string[] = [];

  for (const lancamento of state.lancamentos_propostos) {
    // Verificar idempotência ANTES de criar
    const jaExiste = await verificarIdempotencyKey(lancamento.idempotency_key);
    if (jaExiste) {
      console.log(`Lançamento ${lancamento.idempotency_key} já existe — pulando (idempotente)`);
      continue;
    }

    // Criar no ERP (implementação real aqui)
    await criarLancamentoContabil(lancamento);
    lancamentosExecutados.push(lancamento.idempotency_key);
  }

  return {
    executado: true,
    auditoria: [
      ...(state.auditoria || []),
      {
        timestamp: new Date().toISOString(),
        acao: `${lancamentosExecutados.length} lançamentos criados`,
        user: state.aprovado_por,
        hash: calcularIdempotencyKey({ keys: lancamentosExecutados.join(",") }),
      },
    ],
  };
}

// Stubs das funções de integração
async function verificarIdempotencyKey(_key: string): Promise<boolean> {
  // Consultar banco: SELECT id FROM lancamentos WHERE idempotency_key = $1
  return false;
}

async function criarLancamentoContabil(_l: LancamentoContabil): Promise<void> {
  // Inserir no ERP com a idempotency_key
}

// Grafo
const grafo = new StateGraph<EstadoReconciliacao>({ channels: {} as any });
grafo.addNode("analisar", analisarDivergencias as any);
grafo.addNode("solicitar_aprovacao", solicitarAprovacao as any);
grafo.addNode("executar", executarLancamentos as any);
grafo.addEdge(START, "analisar" as any);
grafo.addEdge("analisar" as any, "solicitar_aprovacao" as any);
grafo.addConditionalEdges("solicitar_aprovacao" as any, 
  (state: EstadoReconciliacao) => state.aprovado_por ? "executar" : END,
);
grafo.addEdge("executar" as any, END);
```
