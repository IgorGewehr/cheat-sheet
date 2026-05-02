---
title: Álgebra Homológica
category: matematica
stack: [Mat]
tags: [algebra, topologia, fundamentos]
excerpt: "Complexos de cadeia, homologia, cohomologia, sequências exatas, Tor e Ext — a álgebra que mede 'buracos' em qualquer estrutura matemática."
related: [estruturas-algebricas, topologia-geral, geometria-algebrica-intro, teoria-categorias]
updated: 2026-05
---

## O que é

Álgebra Homológica é o estudo de complexos de cadeia e seus invariantes — grupos de homologia e cohomologia — que medem a "não-exatidão" de sequências de mapas. Nasceu da topologia algébrica, onde Poincaré introduziu os números de Betti (predecessores dos grupos de homologia) para distinguir superfícies. Cartan e Eilenberg em *Homological Algebra* (1956) mostraram que as mesmas ferramentas se aplicam a álgebra de módulos, teoria de grupos, álgebra de Lie e geometria algébrica.

A ideia central: uma **sequência exata** é uma sequência de homomorfismos …→ Aₙ₊₁ → Aₙ → Aₙ₋₁ → … onde a imagem de cada mapa é igual ao núcleo do próximo. "Exato" significa "sem buracos". Um **complexo de cadeia** é uma sequência onde a composição de dois mapas consecutivos é zero (Im ⊆ Ker). A **homologia** Hₙ = Ker(∂ₙ)/Im(∂ₙ₊₁) mede o quanto a sequência falha em ser exata — literalmente conta os "buracos" de dimensão n.

A álgebra homológica moderna, conforme desenvolvida por Grothendieck, Serre, Mac Lane e outros, é formulada na linguagem da teoria das categorias: functores derivados, categorias derivadas, resolução por projetivos/injetivos. Ext e Tor são os functores derivados de Hom e ⊗, respectivamente, e aparecem em toda a álgebra moderna.

## Por que estuda

Para o matemático, álgebra homológica é uma ferramenta universal: aparece em teoria de grupos (cohomologia de grupos), teoria de números (cohomologia de Galois), geometria algébrica (cohomologia de feixes), álgebra de Lie (cohomologia de Chevalley-Eilenberg), análise (cohomologia de de Rham). O princípio unificador é sempre o mesmo: construir uma resolução, aplicar um functor, calcular a homologia.

Para ML/CS: homologia persistente (TDA — Topological Data Analysis) usa diretamente grupos de homologia para extrair características topológicas de dados. Complexos simpliciais sobre dados de nuvem de pontos; código de barras de persistência como assinatura topológica. Ripser, Gudhi são implementações eficientes. Em redes neurais, a análise da topologia dos espaços de ativações usa homologia.

## Conceitos-chave

- **Complexo de cadeia**: sequência de módulos (ou grupos abelianos) e homomorfismos …→ C_{n+1} →^{∂_{n+1}} Cₙ →^{∂_n} C_{n-1} → … tal que ∂_n ∘ ∂_{n+1} = 0 para todo n. Chamado complexo de cadeia (ou complexo de cocadeia se as setas são revertidas). O mapa ∂ₙ é o **operador de bordo** (ou diferencial).
- **Homologia**: H_n(C•) = Ker(∂_n) / Im(∂_{n+1}). Os elementos de Ker(∂_n) são n-ciclos (cadeias sem bordo); os de Im(∂_{n+1}) são n-bordos (cadeias que são bordo de algo). A homologia mede a diferença — os ciclos que "não são borda de nada". Geometricamente: H₀ conta componentes conexas; H₁ conta loops; H₂ conta cavidades; etc.
- **Sequências exatas curtas e longas**: 0 → A →^f B →^g C → 0 é exata curta se f é injetivo, g é sobrejetivo, e Im(f) = Ker(g). Uma sequência exata curta de complexos de cadeia 0 → A• → B• → C• → 0 induz uma sequência exata longa em homologia: … → H_n(A) → H_n(B) → H_n(C) →^δ H_{n-1}(A) → … O mapa δ (mapa de conexão) é o ingrediente que torna a sequência longa exata.
- **Lema da Serpente e Lema dos Cinco**: o lema da serpente é um resultado técnico fundamental: dado um diagrama comutativo de sequências exatas, a existência de um mapa de conexão entre os núcleos e os conúcleos. O lema dos cinco afirma: num diagrama comutativo com sequências exatas 5 verticalmente, se quatro dos homomorfismos verticais são isomorfismos, o quinto também é. Ferramentas centrais para manipulação de sequências exatas.
- **Resolução projetiva e injetiva**: uma resolução projetiva de um módulo M é uma sequência exata … → P₁ → P₀ → M → 0 onde cada Pᵢ é projetivo (livre é suficiente para módulos sobre anéis). Toda resolução projetiva existe. Análogo para resolução injetiva: 0 → M → I₀ → I₁ → … com Iⱼ injetivos.
- **Functores Ext e Tor**: Ext^n_R(M, N) é calculado tomando resolução projetiva de M, aplicando Hom_R(-, N), e tomando a n-ésima cohomologia. Tor_n^R(M, N) é calculado tomando resolução projetiva de M (ou N), aplicando ⊗_R N, e tomando a n-ésima homologia. Propriedades: Ext⁰ = Hom, Tor₀ = ⊗; Ext mede "extensões" de módulos; Tor mede "torção" em ⊗. Ext^n_R(M, N) = 0 para todo N implica proj.dim(M) ≤ n-1.
- **Cohomologia de de Rham**: para uma variedade diferenciável M, as formas diferenciais com a diferencial exterior d formam um complexo 0 → Ω⁰ →^d Ω¹ →^d … A cohomologia H^k_{dR}(M) = Ker(d: Ωᵏ → Ωᵏ⁺¹) / Im(d: Ωᵏ⁻¹ → Ωᵏ). Formas fechadas que não são exatas. Pelo teorema de de Rham, H^k_{dR}(M) ≅ Hᵏ(M; ℝ) (cohomologia singular com coeficientes reais).
- **Categorias derivadas (visão de longe)**: Grothendieck e Verdier introduziram as categorias derivadas D(A) de uma categoria abeliana A: objetos são complexos de cadeia, morfismos são homotopias de cadeia invertidas por quasi-isomorfismos (mapas induzindo isomorfismos em homologia). Functores derivados são extensões a D(A). Essa linguagem é o estado da arte em geometria algébrica moderna.

## Confusões comuns

**"Homologia e cohomologia são o mesmo objeto"**: Em muitos contextos práticos dão a mesma informação (dualidade de Poincaré: H^k(M) ≅ H_{n-k}(M) para variedade orientável compacta de dimensão n). Mas o formalismo difere: homologia usa cadeias (mapas de ∂ decrescendo grau), cohomologia usa cocadeias (mapas d aumentando grau). Cohomologia tem estrutura adicional de produto em capa (produto cup) tornando H*(M) uma álgebra graduada.

**"Sequência exata sempre tem a forma A → B → C"**: Sequências exatas podem ter qualquer comprimento. A exatidão é condição local: para cada par consecutivo …→ Aₙ₊₁ →^{fₙ₊₁} Aₙ →^{fₙ} Aₙ₋₁ → …, exige-se Im(fₙ₊₁) = Ker(fₙ). Sequência exata curta é o caso mais usável; a sequência longa em homologia conecta sequências exatas curtas de complexos.

**"Complexo de cadeia é sempre um complexo de grupos abelianos"**: Não. O conceito é definido em qualquer categoria abeliana: módulos sobre um anel, feixes de módulos sobre um esquema, representações de um grupo, etc. A generalidade é a força do método — as mesmas técnicas (resolução, homologia, sequências exatas longas) se aplicam em todo contexto abeliano.

**"Tor(M, N) mede apenas torção de M"**: Tor₁^ℤ(M, N) = 0 se M é livre (sem torção) ou se N é livre. Em geral, Tor mede a interação entre a torção de M e a de N. Ex: Tor₁^ℤ(ℤ/m, ℤ/n) = ℤ/gcd(m,n). Para anéis mais gerais, Tor pode ser não-nulo mesmo sem torção no sentido elementar.

## Aplicação em CS/Dev/ML

**Homologia persistente e TDA**: dado uma nuvem de pontos X, construir o complexo de Vietoris-Rips Rips(X, ε) para ε crescente. A homologia H_k(Rips(X, ε)) muda com ε — "nasce" e "morre" conforme ε cresce. O código de barras de persistência rastreia essas mudanças, produzindo uma assinatura topológica de X. Usado em análise de dados biomédicos, materiais, bioinformática.

**Complexos simpliciais em grafos e hipergrafos**: o complexo de cliques de um grafo G (onde k-simplices são cliques de k+1 vértices) tem homologia que captura informação topológica sobre G. H₀ conta componentes; H₁ conta ciclos independentes. Aplicado em redes neurais de grafos para análise de conectividade.

**Cohomologia em redes neurais**: Carlsson, Lum et al. usaram cohomologia para analisar a topologia dos espaços de naturais de imagens e os espaços de representações aprendidas por redes. A hipótese de variedade e sua topologia podem ser estudadas via homologia persistente.

**Resolução e álgebra computacional**: calcular Ext e Tor é o núcleo de sistemas de álgebra computacional (Macaulay2, Magma, SageMath). Usado em criptografia (estrutura de módulos em criptografia de reticulado), teoria de códigos (resoluções mínimas), e geometria algébrica computacional.

## Como praticar

- **Livro base**: Weibel — *An Introduction to Homological Algebra* (Cambridge) — o texto padrão moderno, rigoroso e completo. Para uma primeira introdução via topologia algébrica: Hatcher — *Algebraic Topology* (gratuito online, Capítulo 2) — homologia singular com motivação geométrica excelente.
- **Pré-requisito**: álgebra abstrata (módulos, sequências exatas elementares) é indispensável. Capítulo de módulos de Dummit-Foote é boa preparação.
- **Computar homologia de exemplos**: toro T² = S¹×S¹ via complexo simplicial; garrafa de Klein; espaço projetivo ℝP². Usar a definição: construir o complexo simplicial, escrever os mapas de bordo como matrizes, calcular núcleos e imagens sobre ℤ.
- **Python**: `from gudhi import SimplexTree` — calcular homologia simplicial de nuvens de pontos. `ripser` para homologia persistente. Verificar resultados teóricos (número de Betti de esferas, toros).

## Exercícios práticos

1. **[Rank E]** Construa o complexo simplicial do triângulo (1-esfera S¹) com vértices {a, b, c}, lados {ab, bc, ca} e sem 2-simplex (preenchimento). Escreva os operadores de bordo ∂₁: C₁ → C₀ e ∂₂: C₂ → C₁ como matrizes (C₂ = 0). Calcule H₀ e H₁. *Dica: ∂₁([ab]) = [b] - [a], ∂₁([bc]) = [c] - [b], ∂₁([ca]) = [a] - [c]. Como C₂ = 0: H₁ = Ker(∂₁). Como a soma das linhas da matriz ∂₁ é zero: rank(Ker ∂₁) = 1, dando H₁ = ℤ.*

2. **[Rank D]** Calcule Tor₁^ℤ(ℤ/m, ℤ/n) usando a resolução projetiva livre de ℤ/m: 0 → ℤ →^{×m} ℤ → ℤ/m → 0. Tensorizando com ℤ/n, obtenha a sequência 0 → ℤ/n →^{×m} ℤ/n e use-a para computar o núcleo. Verifique que Tor₁^ℤ(ℤ/m, ℤ/n) = ℤ/gcd(m,n). *Dica: tensorizando com ℤ/n, a resolução vira ℤ/n →^{×m} ℤ/n → 0. O mapa ×m: ℤ/n → ℤ/n tem núcleo = {k : mk ≡ 0 (mod n)} = {k : k ≡ 0 (mod n/gcd(m,n))} ≅ ℤ/gcd(m,n).*

3. **[Rank C]** Para a sequência exata curta de complexos 0 → A• → B• → C• → 0, escreva explicitamente o mapa de conexão δ: Hₙ(C) → H_{n-1}(A) e verifique que a sequência longa em homologia é exata em Hₙ(C). *Dica: dado [c] ∈ Hₙ(C) = Ker(∂^C_n)/Im, escolha b ∈ Bₙ com q(b) = c (q: B → C sobrejetora). Como q(∂^B_n(b)) = ∂^C_n(c) = 0, por exatidão existe a ∈ A_{n-1} com i(a) = ∂^B_n(b). Verifique que ∂^A_{n-1}(a) = 0 (a é ciclo) e defina δ([c]) = [a].*

4. **[Rank B]** Calcule a homologia do toro T² = S¹ × S¹ usando o complexo simplicial com 1 vértice (v), 2 lados (a, b) e 1 face (F), com identifcações: ∂F = a + b - a - b = 0 (toro). Escreva os operadores de bordo, calcule os números de Betti β₀, β₁, β₂ e verifique a característica de Euler χ(T²) = β₀ - β₁ + β₂. *Dica: a triangulação mínima do toro tem 1 vértice, 2 arestas, 1 face; ∂₂(F) = 0; ∂₁(a) = v-v = 0, ∂₁(b) = 0. Portanto H₀ = ℤ, H₁ = ℤ², H₂ = ℤ, e χ = 1 - 2 + 1 = 0.*

5. **[Rank A] [BOSS]** Prove o teorema de de Rham em dimensão 1: para S¹ = ℝ/ℤ, mostre que H¹_{dR}(S¹) ≅ ℝ. Especificamente: (a) mostre que dθ (onde θ é o ângulo em S¹) é uma 1-forma fechada; (b) mostre que dθ não é exata (não existe função f: S¹ → ℝ com df = dθ); (c) mostre que toda 1-forma fechada α em S¹ é da forma α = c·dθ + df para alguma constante c e função f. Conclua que H¹_{dR}(S¹) é gerado por [dθ] e é isomorfo a ℝ. *Dica: para (b), se dθ = df então ∮_{S¹} dθ = ∮_{S¹} df = 0 por periodicidade de f. Mas ∮_{S¹} dθ = 2π ≠ 0, contradição. Para (c), defina c = (∮_{S¹} α) / (2π) e mostre que α - c·dθ tem integral zero em S¹, portanto é exata (usando o teorema fundamental do cálculo ao longo da curva).*

## Próximos passos

- [topologia-geral](topologia-geral) — topologia algébrica, grupos fundamentais, homologia singular
- [teoria-categorias](teoria-categorias) — functores derivados, categorias abelianas
- [geometria-algebrica-intro](geometria-algebrica-intro) — cohomologia de feixes, sequências de Mayer-Vietoris
- [estruturas-algebricas](estruturas-algebricas) — módulos, sequências exatas de módulos
- → Pratique no /math-quest na área **Álgebra/Topologia** (Rank C+)
