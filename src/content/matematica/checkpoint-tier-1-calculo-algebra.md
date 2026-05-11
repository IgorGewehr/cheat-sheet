---
title: "Checkpoint Tier 1 — Cálculo & Álgebra"
category: matematica
stack: [Mat]
tags: [checkpoint, calculo, algebra-linear, series]
excerpt: "Marcador de domínio: prove o teorema fundamental do cálculo, resolva sistemas lineares com SVD, e classifique séries de potências."
related: [calculo-1-variavel, calculo-multivariavel, algebra-linear, series-e-sequencias, teoria-dos-numeros, analise-combinatoria, teoria-grafos-mat]
updated: 2026-05
---

## O que é

Checkpoint Tier 1 é validação de domínio antes de avançar para análise rigorosa (Tier 2). Não é avaliação formal — é um problemset que **você só resolve se realmente domina** os fundamentos de cálculo, álgebra linear, séries e estrutura discreta básica. Se travar em qualquer item, retorne ao card correspondente.

## Por que estuda

Sem ter os fundamentos sólidos, análise real (ε-δ), estruturas algébricas e EDOs ficam inacessíveis. Igualmente: tentar análise complexa sem dominar séries de potências, ou álgebra abstrata sem álgebra linear, gera frustração e não consolida.

## Conceitos validados

Após este checkpoint você deveria ter domínio operacional de:
- Derivada e integral em uma e várias variáveis, com aplicações geométricas e físicas
- Espaços vetoriais finito-dimensionais, transformações lineares, autovalores, diagonalização, SVD
- Séries numéricas e de potências: testes de convergência, raio de convergência, manipulação de séries de Taylor
- Combinatória elementar: PIE, recorrências, função geradora simples
- Aritmética modular e teoremas de Fermat/Euler
- Teoria dos grafos básica: árvores, conexidade, Euler, Hamilton

## Problemset

Resolva todos os itens. Para cada um, escreva solução com rigor (não apenas resposta numérica). Use LaTeX/Markdown. **Critério de aprovação**: todos resolvidos sem consultar a solução; pelo menos 3 com prova formal completa.

### Cálculo

**P1 [Rank C]** Demonstre o Teorema Fundamental do Cálculo (parte II): se f é contínua em [a, b] e F é primitiva de f, então ∫_a^b f(x) dx = F(b) − F(a). Use a definição de integral via somas de Riemann e o teorema do valor médio. Não usar TFC parte I.

**P2 [Rank C]** Calcule ∫∫_D xy dA, onde D é a região no primeiro quadrante limitada por y = x², y = 2x, x = 0, x = 2. Esboce a região, escolha ordem de integração, justifique.

**P3 [Rank B]** Mostre que a função f: ℝ² → ℝ, f(x,y) = (x³y)/(x⁴+y²) se (x,y) ≠ 0 e f(0,0) = 0 é (a) contínua em todo ℝ²; (b) tem derivadas direcionais em (0,0) em toda direção; (c) **não** é diferenciável em (0,0). *Esse exemplo mostra que existência de derivadas direcionais ≠ diferenciabilidade.*

### Álgebra Linear

**P4 [Rank C]** Seja A matriz 3×3 com autovalores 1, 2, 3 e autovetores v₁ = (1,0,0)ᵀ, v₂ = (1,1,0)ᵀ, v₃ = (1,1,1)ᵀ. Determine A explicitamente.

**P5 [Rank B]** Demonstre o teorema espectral para matrizes simétricas reais: se A ∈ ℝⁿˣⁿ é simétrica (Aᵀ = A), então existe matriz ortogonal Q (QᵀQ = I) tal que QᵀAQ = D diagonal. *Use indução em n; existe pelo menos um autovetor real (por que?).*

**P6 [Rank B]** Implemente SVD truncado: dada matriz A ∈ ℝᵐˣⁿ com m, n grandes e posto r ≪ min(m,n), aproxime A pela matriz A_k de posto k < r que minimiza ‖A − A_k‖_F. Em Python, gere matriz com noise e mostre erro decai com k.

### Séries

**P7 [Rank C]** Determine o raio de convergência e o intervalo de convergência da série de potências Σ_{n≥1} (n!)/(nⁿ) · xⁿ. Investigue convergência nos extremos do intervalo.

**P8 [Rank B]** Demonstre que a série Σ_{n≥1} 1/(n log² n) converge, mas Σ_{n≥1} 1/(n log n) diverge. *Use teste integral de Cauchy.*

### Discreta

**P9 [Rank C]** Quantas permutações de {1, 2, ..., n} têm exatamente k pontos fixos? Derive a fórmula via princípio da inclusão-exclusão. Verifique para n = 4, k = 1.

**P10 [Rank B]** Demonstre que em qualquer grafo simples com n vértices, se cada vértice tem grau ≥ n/2, então o grafo é Hamiltoniano (teorema de Dirac). *Indução / extensão argumentativa.*

## Critério de aprovação

- 8/10 resolvidos com rigor: **avance para Tier 2**.
- 6-7/10: identifique área fraca (cálculo, álgebra ou séries); revise card; refaça os exercícios falhados.
- <6/10: retorne ao card mais fraco e refaça os exercícios Rank C-B daquele card antes de tentar este checkpoint novamente.

## Próximos passos

- Aprovado → [analise-real](analise-real) (Tier 2 começa aqui)
- Análise multivariada → [calculo-vetorial-geometria-analitica](calculo-vetorial-geometria-analitica)
- Álgebra estruturada → [estruturas-algebricas](estruturas-algebricas)
- → Pratique no /math-quest após este checkpoint
