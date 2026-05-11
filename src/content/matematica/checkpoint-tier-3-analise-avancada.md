---
title: "Checkpoint Tier 3 — Análise Avançada & Álgebra Abstrata"
category: matematica
stack: [Mat]
tags: [checkpoint, analise-complexa, topologia, galois, edp]
excerpt: "Marcador: Cauchy, espaços topológicos, Galois, EDPs clássicas, álgebra comutativa básica."
related: [analise-complexa, topologia-geral, algebra-galois, equacoes-diferenciais-parciais, algebra-comutativa, estatistica-inferencia, otimizacao-pesquisa-op]
updated: 2026-05
---

## O que é

Checkpoint Tier 3 valida análise complexa (Cauchy, resíduos), topologia geral (compacidade, conexidade), Galois (extensões de corpos), EDPs clássicas (calor, onda, Laplace), álgebra comutativa básica (ideais, Nullstellensatz). Aprovado, está pronto para medida-integração, análise funcional e geometria diferencial.

## Por que estuda

Tier 4 (Medida, Análise Funcional, Geometria Diferencial, Mecânica Lagrangiana, Sistemas Dinâmicos, Cálculo das Variações) depende de domínio em três fronteiras: análise rigorosa em ℂ, topologia abstrata, e álgebra estrutural. Sem isso, geometria de variedades é abstração vazia.

## Conceitos validados

- Funções holomorfas, Cauchy-Riemann, integral de Cauchy, teorema dos resíduos
- Singularidades, séries de Laurent, princípio do argumento, Rouché
- Espaços topológicos, base, separação, compacidade, conexidade
- Extensões de corpos, separabilidade, normalidade, grupo de Galois, teorema fundamental
- EDP do calor (separação de variáveis, núcleo Gaussiano), onda (d'Alembert), Laplace (princípio do máximo)
- Anéis Noetherianos, ideais primos/maximais, Nullstellensatz de Hilbert
- Estatística: estimação pontual, ML, intervalos de confiança, testes de hipótese
- Otimização: convexidade, KKT, dualidade fraca/forte

## Problemset

### Análise Complexa

**P1 [Rank C]** Demonstre que f(z) = z̄ não é holomorfa em ponto algum. Use as equações de Cauchy-Riemann.

**P2 [Rank C]** Calcule ∫_C 1/(z²+1) dz onde C é o círculo |z| = 2 percorrido no sentido positivo. Use teorema dos resíduos.

**P3 [Rank B]** Calcule ∫_0^{2π} dθ/(a + b cos θ), a > b > 0, via integração de contorno em |z|=1. Justifique convergência e escolha de contorno.

**P4 [Rank B]** Demonstre o teorema de Liouville: toda função holomorfa em ℂ inteiro e limitada é constante. Derive como corolário o teorema fundamental da álgebra.

### Topologia

**P5 [Rank C]** Demonstre que o produto cartesiano de dois espaços conexos é conexo.

**P6 [Rank C]** Mostre que a esfera Sⁿ é compacta e simplesmente conexa para n ≥ 2.

**P7 [Rank B]** Demonstre o teorema de Tychonoff (caso finito): produto finito de espaços compactos é compacto. *Por simplicidade, restrinja ao caso métrico via convergência sequencial.*

### Galois

**P8 [Rank C]** Determine o grupo de Galois da extensão ℚ(√2, √3) / ℚ. Mostre que é isomorfo a (ℤ/2ℤ)². Liste os subcorpos intermediários via correspondência de Galois.

**P9 [Rank B]** Demonstre que x⁵ − 6x + 3 ∈ ℚ[x] não é solúvel por radicais. *Mostre que o grupo de Galois é S₅, que não é solúvel.*

### EDPs

**P10 [Rank C]** Resolva a EDP do calor ∂_t u = ∂_xx u em ℝ com u(0, x) = e^{−x²} via transformada de Fourier. Identifique o núcleo Gaussiano.

**P11 [Rank B]** Demonstre o princípio do máximo para EDP de Laplace: se u ∈ C²(Ω) ∩ C(Ω̄) é harmônica (Δu = 0) em Ω domínio limitado, então max_Ω u = max_{∂Ω} u.

### Estatística e Otimização

**P12 [Rank C]** Para X₁, ..., Xₙ iid ~ N(μ, σ²) com σ² conhecido, derive o teste UMP para H₀: μ = μ₀ vs H₁: μ > μ₀ ao nível α. Encontre região de rejeição.

**P13 [Rank B]** Resolva por KKT: minimize x² + y² sujeito a x + y ≥ 1, x ≥ 0, y ≥ 0. Verifique condições de regularidade (Slater).

## Critério de aprovação

- 11/13 resolvidos com rigor: avance para Tier 4.
- 9-10/13: identifique 1-2 áreas fracas; refaça.
- <9/13: revise cards específicos.

## Próximos passos

- Aprovado → [medida-integracao](medida-integracao), [analise-funcional](analise-funcional), [geometria-diferencial](geometria-diferencial)
- Estatística aplicada → [processos-estocasticos](processos-estocasticos)
