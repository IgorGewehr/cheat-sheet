---
title: "Checkpoint Tier 2 — Análise Real & EDOs"
category: matematica
stack: [Mat]
tags: [checkpoint, analise-real, edo, probabilidade]
excerpt: "Marcador de domínio: ε-δ rigoroso, sequências/séries em ℝⁿ, EDO existência-unicidade, primeiras probabilidades."
related: [analise-real, calculo-vetorial-geometria-analitica, estruturas-algebricas, equacoes-diferenciais-ordinarias, probabilidade, analise-numerica]
updated: 2026-05
---

## O que é

Checkpoint Tier 2 valida análise real básica (ε-δ, completude de ℝ, continuidade uniforme), EDOs lineares, primeiras estruturas algébricas (grupos, anéis) e fundamentos de probabilidade. Se passar, está pronto para análise complexa, topologia geral e álgebra abstrata.

## Por que estuda

Tier 3 (Análise Complexa, Topologia, Galois) e Tier 4 (Medida, Geometria Diferencial) **dependem criticamente** de domínio rigoroso destes tópicos. Tentar Cauchy ou Frobenius sem dominar ε-δ é perda de tempo.

## Conceitos validados

- Definição ε-δ de limite, continuidade, continuidade uniforme
- Sequências de Cauchy, completude, Bolzano-Weierstrass em ℝⁿ
- Heine-Borel: compacto em ℝⁿ = fechado e limitado
- TVI, TVM, teorema de Rolle, teorema do valor médio integral
- EDOs: existência e unicidade (Picard-Lindelöf), EDOs lineares de coeficientes constantes
- Espaços de probabilidade, variáveis aleatórias, distribuições básicas, esperança e variância
- Grupos, anéis, corpos: definições, exemplos, homomorfismos, quocientes

## Problemset

### Análise Real

**P1 [Rank C]** Prove, usando definição ε-δ, que f(x) = x²+ x é contínua em todo ℝ. Para cada a ∈ ℝ, exiba δ explicitamente em função de ε.

**P2 [Rank C]** Demonstre o teorema do valor intermediário: se f é contínua em [a,b] e f(a) < y < f(b), então existe c ∈ (a,b) com f(c) = y. Use completude de ℝ via supremo.

**P3 [Rank B]** Demonstre que toda sequência de Cauchy em ℝⁿ converge. Não cite Bolzano-Weierstrass diretamente — prove tudo a partir de completude de ℝ.

**P4 [Rank B]** Construa explicitamente uma sequência de funções contínuas fₙ: [0,1] → ℝ que converge pontualmente para f: [0,1] → ℝ descontínua. Mostre que a convergência não é uniforme.

### EDOs

**P5 [Rank C]** Resolva o problema de Cauchy: y' = y² − 1, y(0) = 0. Determine o intervalo máximo de existência.

**P6 [Rank C]** Resolva o sistema linear de EDOs:
```
x' = 3x − y
y' = x + y
```
Com x(0) = 1, y(0) = 0. Use autovalores e autovetores.

**P7 [Rank B]** Demonstre o teorema de Picard-Lindelöf: se f: [a,b] × ℝⁿ → ℝⁿ é contínua em t e Lipschitz em x, então y' = f(t,y), y(t₀) = y₀ tem solução única em [t₀ − h, t₀ + h] para h pequeno. Use iteração de Picard + contração de Banach.

### Estruturas Algébricas

**P8 [Rank C]** Mostre que ℤ/6ℤ não é corpo, mas ℤ/7ℤ é corpo. Determine os elementos invertíveis (𝒰(ℤ/12ℤ)) e mostre que esse conjunto é grupo isomorfo a ℤ/2ℤ × ℤ/2ℤ.

**P9 [Rank B]** Sejam G grupo finito e H subgrupo. Demonstre o teorema de Lagrange: |H| divide |G|. *Use cosets esquerdos como partição de G.*

### Probabilidade

**P10 [Rank C]** Sejam X, Y variáveis aleatórias independentes Bernoulli(p) e Bernoulli(q). Determine: (a) distribuição de X+Y; (b) ℙ(X = Y); (c) Cov(X, X+Y).

**P11 [Rank B]** Demonstre a desigualdade de Chebyshev: para X com média μ e variância σ² finitas, ℙ(|X − μ| ≥ k σ) ≤ 1/k². Em seguida deduza a Lei Fraca dos Grandes Números para X₁, X₂, ... iid com variância finita.

## Critério de aprovação

- 9/11 resolvidos com rigor: avance para Tier 3.
- 7-8/11: identifique área fraca; revise card; refaça.
- <7/11: retorne aos cards de análise real / EDOs / probabilidade.

## Próximos passos

- Aprovado → [analise-complexa](analise-complexa), [topologia-geral](topologia-geral), [algebra-galois](algebra-galois)
- → Pratique no /math-quest na área correspondente
