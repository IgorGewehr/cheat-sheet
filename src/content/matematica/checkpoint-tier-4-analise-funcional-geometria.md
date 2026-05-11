---
title: "Checkpoint Tier 4 — Análise Funcional & Geometria"
category: matematica
stack: [Mat]
tags: [checkpoint, medida, analise-funcional, geometria-diferencial]
excerpt: "Marcador: Lebesgue, Banach-Hilbert-Sobolev, variedades, Stokes, Fourier rigoroso, processos estocásticos, mecânica analítica."
related: [medida-integracao, analise-funcional, analise-fourier, geometria-diferencial, processos-estocasticos, mecanica-lagrangiana-hamiltoniana, sistemas-dinamicos-caos, calculo-das-variacoes, fisica-mecanica-classica]
updated: 2026-05
---

## O que é

Checkpoint Tier 4 valida medida e integração de Lebesgue, análise funcional (Banach, Hilbert, Sobolev), análise de Fourier rigorosa em L², geometria diferencial (variedades, formas, Stokes), processos estocásticos (Markov, Browniano, Itô), mecânica analítica (Lagrangiana, Hamiltoniana), sistemas dinâmicos não-lineares, cálculo das variações.

Aprovado: você tem maturidade de mestrado começando.

## Por que estuda

Tier 5 (Topologia Algébrica, Variedades Riemannianas, Análise Harmônica, Grupos de Lie, Representação, Álgebra Homológica, Categorias, TAN) exige fluência sólida em ferramentas analítico-geométricas. Sem isso, definições de fibrados/conexões e Peter-Weyl são abstrações sem chão.

## Conceitos validados

- σ-álgebras, medida exterior, conjuntos mensuráveis, medida de Lebesgue
- Integral de Lebesgue, teoremas de convergência (TCM, Fatou, TCD)
- Lᵖ, dualidade, desigualdades de Hölder/Minkowski
- Banach, Hahn-Banach, Banach-Steinhaus, gráfico fechado
- Hilbert, teorema de Riesz, base ortonormal, projeção ortogonal
- Espaços de Sobolev Hˢ, imersões, traço
- Variedades suaves, formas diferenciais, derivada exterior, teorema de Stokes geral
- Cadeias de Markov, processo de Wiener, integral de Itô, EDE
- Princípio variacional, equação de Euler-Lagrange, Hamiltoniana, parêntese de Poisson
- Sistemas dinâmicos: bifurcações, atratores, Lyapunov

## Problemset

### Medida e Integração

**P1 [Rank C]** Construa um conjunto não-mensurável Lebesgue em ℝ usando o axioma da escolha (conjunto de Vitali). Mostre que ele tem medida exterior positiva mas não mensurável.

**P2 [Rank B]** Demonstre o teorema da convergência dominada de Lebesgue: se fₙ → f q.s., |fₙ| ≤ g com g ∈ L¹, então fₙ → f em L¹ e ∫fₙ → ∫f. *Use Fatou aplicado a g − fₙ e g + fₙ.*

### Análise Funcional

**P3 [Rank C]** Calcule explicitamente o adjunto do operador integral T: L²([0,1]) → L²([0,1]) definido por (Tf)(x) = ∫_0^x f(y) dy. T é compacto? Determine seus autovalores.

**P4 [Rank B]** Demonstre o teorema do representante para RKHS: se H_K é RKHS com kernel K, então o minimizador de Σ_i L(yᵢ, f(xᵢ)) + λ‖f‖²_H pode ser escrito como f = Σᵢ αᵢ K(·, xᵢ).

### Fourier

**P5 [Rank C]** Calcule a série de Fourier de f(x) = x em (-π, π) estendida periodicamente. Use Parseval para deduzir Σ_{n≥1} 1/n² = π²/6.

**P6 [Rank B]** Demonstre a fórmula de soma de Poisson para a Gaussiana e use-a para calcular θ(τ) = Σ_{n∈ℤ} e^{−πn²τ} para τ = 1.

### Geometria Diferencial

**P7 [Rank C]** Em S² ⊂ ℝ³ com métrica induzida, calcule o tensor de curvatura de Riemann. Verifique que a curvatura escalar é constante R = 2.

**P8 [Rank B]** Demonstre o teorema de Stokes para 1-formas em ℝ²: se ω = P dx + Q dy é 1-forma suave e Ω ⊂ ℝ² é região com bordo C¹ por partes, então ∫_∂Ω ω = ∫∫_Ω (∂Q/∂x − ∂P/∂y) dx dy. *Use Fubini para retângulo; extenda por partições.*

### Processos Estocásticos

**P9 [Rank C]** Calcule E[B(t)² B(s)] e Var[∫_0^t B(s) ds] para movimento Browniano B. *Use propriedades dos momentos de Gaussianas.*

**P10 [Rank B]** Demonstre a fórmula de Itô em sua forma simples: se f ∈ C²(ℝ) e X é difusão dX = μ dt + σ dB, então df(X) = (μ f' + ½ σ² f'') dt + σ f' dB. *Use expansão de Taylor + (dB)² = dt.*

### Mecânica Analítica

**P11 [Rank C]** Derive as equações de Euler-Lagrange para o problema da braquistócrona (curva de descida mais rápida sob gravidade). Mostre que a solução é cicloide.

**P12 [Rank B]** Mostre que para Hamiltoniano H independente do tempo, o fluxo Hamiltoniano preserva a forma simplética ω = Σ dpᵢ ∧ dqᵢ. Conclua o teorema de Liouville: o volume no espaço de fase é preservado.

### Sistemas Dinâmicos

**P13 [Rank B]** Para o sistema de Lorenz σ(y − x), x(ρ − z) − y, xy − βz com σ = 10, β = 8/3: calcule pontos fixos, analise estabilidade linear, e determine ρ crítico para bifurcação de Hopf.

## Critério de aprovação

- 11/13 resolvidos: avance para Tier 5.
- 8-10/13: aprofunde os fracos (análise funcional, geometria, ou estocástico).
- <8/13: revise cards Tier 4 específicos.

## Próximos passos

- Aprovado → [topologia-algebrica](topologia-algebrica), [variedades-riemannianas](variedades-riemannianas), [grupos-de-lie](grupos-de-lie)
- Análise harmônica → [analise-harmonica](analise-harmonica)
- Álgebra estrutural moderna → [teoria-categorias](teoria-categorias), [algebra-homologica](algebra-homologica)
