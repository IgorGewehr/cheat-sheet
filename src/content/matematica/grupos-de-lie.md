---
title: Grupos de Lie e Álgebras de Lie
category: matematica
stack: [Mat, Python]
tags: [algebra, geometria, fisica, fundamentos]
excerpt: Grupos com estrutura diferenciável — SO(3), SU(2), GL(n) — e sua álgebra tangente, o mapa exponencial e a classificação de Cartan.
related: [geometria-diferencial, estruturas-algebricas, teoria-representacao, calculo-multivariavel]
updated: 2026-05
---

## O que é

Um **grupo de Lie** é um grupo que é também uma variedade diferenciável, de modo que as operações de grupo (multiplicação e inversão) são mapas suaves. O conceito unifica álgebra e geometria: um grupo de Lie tem a estrutura algébrica de grupo e a estrutura geométrica de variedade, e as duas são compatíveis.

Os exemplos fundamentais: GL(n, ℝ) = grupo de matrizes invertíveis n×n (aberto de ℝ^{n²}); SL(n, ℝ) = det = 1 (variedade de codimensão 1); O(n) = matrizes ortogonais (AᵀA = I); SO(n) = ortogonais com det = 1; U(n) = matrizes unitárias (A†A = I); SU(n) = unitárias com det = 1. Todos são grupos de Lie com estruturas de variedade evidentes.

A **álgebra de Lie** g de um grupo de Lie G é o espaço tangente em e (identidade): g = T_e G. Com a operação de colchete de Lie [X, Y] (derivada de Lie), g é uma álgebra de Lie: bilinear, anti-simétrica ([X,Y] = -[Y,X]) e satisfazendo identidade de Jacobi ([[X,Y],Z] + [[Y,Z],X] + [[Z,X],Y] = 0). O mapa exponencial exp: g → G conecta a álgebra ao grupo: exp(tX) é a curva integral do campo de vetores invariante à esquerda correspondente a X.

## Por que estuda

Para o matemático, grupos de Lie são o objeto central da geometria diferencial e da física matemática. A classificação de Elie Cartan (1894) das álgebras de Lie semissimples sobre ℂ — via sistemas de raízes e diagramas de Dynkin — é um dos grandes monumentos da matemática. O problema de Hilbert de 5 (são grupos topológicos localmente euclidianos necessariamente grupos de Lie?) foi resolvido por Gleason, Montgomery e Zippin em 1952.

Para ML/CS: redes neurais equivariantes usam SO(3), E(3), SE(3) para processar dados moleculares, point clouds e imagens 3D. A biblioteca e3nn usa representações de SO(3) (harmonicais esféricas) como blocos básicos. Difusão em variedades (DDPM em SO(3) para rotações, no toro para ângulos diédricos de proteínas) usa a estrutura de grupo de Lie. Lie-group ODE solvers respeitam a geometria em modelagem de dinâmica com simetrias.

## Conceitos-chave

- **Variedade de Lie e ação suave**: G age suavemente em si mesmo por translação à esquerda Lₘ: g ↦ mg e à direita Rₘ: g ↦ gm. Campos de vetores invariantes à esquerda (X com (Lₘ)₊X = X) formam a álgebra de Lie g. Há bijeção entre g e os campos invariantes à esquerda.
- **Mapa exponencial**: exp: g → G, exp(X) = γ(1) onde γ é a curva integral de X com γ(0) = e. Para matrizes: exp(A) = Σ Aⁿ/n! (série matricial). Propriedade: exp(sX)exp(tX) = exp((s+t)X) (curva a 1 parâmetro é homomorfismo). d/dt|_{t=0} exp(tX) = X. Nem sempre é sobrejetivo para grupos não-compactos.
- **Colchete de Lie**: [X,Y] = d/dt|_{t=0} (Ad_{exp(tX)} Y) onde Ad é a representação adjunta. Para matrizes: [A,B] = AB - BA. A estrutura de álgebra de Lie (g, [·,·]) determina G localmente (teorema de Lie). O colchete mede a não-comutatividade: exp(tX)exp(tY) = exp(t(X+Y) + t²/2[X,Y] + O(t³)) (fórmula de Baker-Campbell-Hausdorff).
- **SO(3) e rotações**: SO(3) é o grupo de rotações em ℝ³ (variedade de dimensão 3). A álgebra de Lie so(3) ≅ ℝ³ com colchete [x,y] = x × y (produto vetorial). Bases: Jₓ = [[0,0,0],[0,0,-1],[0,1,0]], J_y = [[0,0,1],[0,0,0],[-1,0,0]], J_z = [[0,-1,0],[1,0,0],[0,0,0]]. exp(θJₙ) = rotação de ângulo θ em torno do eixo n. SO(3) não é simplesmente conexo: π₁(SO(3)) = ℤ/2.
- **SU(2) e o recobrimento universal de SO(3)**: SU(2) ≅ S³ (esfera em ℂ²) é simplesmente conexo. O homomorfismo SU(2) → SO(3) é recobrimento duplo com kernel {I, -I}. Isso explica a existência de spinores (partículas de spin 1/2 que mudam de sinal por rotação de 2π mas voltam ao estado original por rotação de 4π).
- **Subgrupos de Cartan e decomposições**: todo grupo de Lie compacto semissimples tem subgrupos de Cartan (subgrupos abelianos maximais). Para SO(n): o subgrupo de Cartan é o conjunto das rotações em planos coordenados independentes. A decomposição de Cartan G = KAK (análoga a SVD para matrizes reais) e a decomposição de Iwasawa G = KAN generalizam a SVD e a decomposição QR para grupos de Lie.
- **Sistemas de raízes e classificação de Cartan**: para álgebra de Lie semissimples g (sobre ℂ), o sistema de raízes Φ ⊂ h* (onde h é subálgebra de Cartan) é um conjunto finito de vetores satisfazendo axiomas de reflexão e integridade. Diagramas de Dynkin codificam o sistema de raízes como grafo. Classificação completa: A_n = sl_{n+1}, B_n = so_{2n+1}, C_n = sp_{2n}, D_n = so_{2n}, mais os 5 exceptionais E₆, E₇, E₈, F₄, G₂.
- **Representações de grupos de Lie**: pelo teorema de Weyl, toda representação de grupo de Lie compacto semissimples é completamente redutível (análogo ao teorema de Maschke). Representações irredutíveis de G correspondem a representações irredutíveis de g (para G simplesmente conexo). São indexadas por pesos dominantes integrais. Para SO(3): indexadas por l = 0, 1, 2, … (momento angular orbital, dimensão 2l+1). Para SU(2): indexadas por j = 0, 1/2, 1, … (spin, dimensão 2j+1).

## Confusões comuns

**"O mapa exponencial é sempre sobrejetivo"**: Para grupos compactos (como SU(n), SO(n)), exp é sobrejetivo. Para GL(n, ℝ), exp não cobre as matrizes invertíveis com determinante negativo (exp de matriz real tem determinante e^{tr} > 0). Para SL(2, ℝ), exp não é sobrejetivo.

**"Álgebra de Lie e grupo de Lie determinam-se mutuamente"**: Grupos de Lie simplesmente conexos são determinados por sua álgebra de Lie (teorema de Lie). Mas grupos não-simplesmente conexos têm a mesma álgebra que seu recobrimento universal. SO(3) e SU(2) têm a mesma álgebra so(3) ≅ su(2) ≅ ℝ³.

**"exp(A)exp(B) = exp(A+B)"**: Apenas se [A,B] = AB - BA = 0 (A e B comutam). Caso geral: exp(A)exp(B) = exp(A+B + 1/2[A,B] + 1/12[[A,B],B] - 1/12[[A,B],A] + …) (BCH). Essa diferença é a obstrução à comutatividade do grupo.

**"Grupos de Lie são sempre grupos de matrizes"**: Todo grupo de Lie compacto é um grupo de matrizes (teorema de Peter-Weyl + representação fiel). Mas existem grupos de Lie não-matriciais — o exemplo clássico é a cobertura universal do grupo simplético Sp(2n, ℝ), denotado Mp(n, ℝ) (grupo metaplético), que não tem representação matricial fiel de dimensão finita.

## Aplicação em CS/Dev/ML

**Redes neurais equivariantes (e3nn)**: convoluções equivariantes a SO(3) são construídas usando harmonicais esféricas — as funções base das representações irredutíveis de SO(3). A biblioteca e3nn representa features como somas diretas de representações de SO(3) e implementa convoluções que preservam equivariância. Aplicações: AlphaFold2 usa equivariância para estrutura de proteínas; NequIP, MACE para potenciais interatômicos.

**Difusão em variedades de grupo de Lie**: gerar amostras de SO(3) (rotações 3D) ou SE(3) (poses rígidas) requer adaptar difusão para o manifold não-euclidiano. O processo de difusão usa o mapa exponencial para "caminhar" no grupo: x_{t+1} = exp_{x_t}(ε·score(x_t, t)). Aplicações: geração de estruturas moleculares (DiffSBDD, RFDiffusion).

**Lie group integrators para ODEs**: solucionadores numéricos de EDOs em grupos de Lie (Munthe-Kaas, Magnus) preservam a estrutura de grupo, ao contrário de solucionadores Runge-Kutta padrão. Importantes em mecânica computacional, simulação de corpo rígido e redes neurais de tempo contínuo (neural ODEs em grupos).

**Robotics e SE(3)**: a pose de um robô é um elemento de SE(3) = SO(3) ⋉ ℝ³ (transformações rígidas). Interpolação de poses, planejamento de trajetória, e controle usam a estrutura de grupo. A biblioteca Sophus (C++) e PyLie (Python) implementam operações em SO(3), SO(2), SE(3), SE(2).

## Como praticar

- **Livro base**: Hall — *Lie Groups, Lie Algebras, and Representations* (Springer GTM, 2a ed.) — melhor introdução acessível, começando por grupos de matrizes. Para nível avançado: Bröcker & tom Dieck — *Representations of Compact Lie Groups* (Springer), ou Humphreys — *Introduction to Lie Algebras* (para o caso algébrico).
- **Pré-requisito**: dominar álgebra linear, geometria diferencial de variedades e estruturas algébricas é essencial. Grupos de Lie sem esses fundamentos são incompreensíveis.
- **Computar exp e log para SO(3)**: a fórmula de Rodrigues exp(θ·n̂×) = I + sin(θ)(n̂×) + (1-cos(θ))(n̂×)² onde n̂× é a matriz antissimétrica de n̂. Implementar em Python/NumPy e verificar que exp(θJₙ) é rotação de θ em torno de n.
- **SageMath e SymPy**: `from sympy.matrices import Matrix; A = Matrix([[0,-1,0],[1,0,0],[0,0,0]]); A.exp()` — calcular o exponencial matricial. Verificar que exp(θA) é rotação.
- **Projeto**: implemente interpolação de rotações em SO(3) via geodésica SLERP (spherical linear interpolation): R(t) = R₀ · exp(t · log(R₀⁻¹R₁)). Compare com interpolação ingênua de quaternions. Visualize a trajetória da interpolação.

## Exercícios práticos

1. **[Rank E]** Verifique que SO(2) (rotações em ℝ²) é grupo de Lie: exiba a estrutura de variedade (é S¹, parameterizado por θ ∈ [0,2π)), calcule o produto de dois elementos e verifique suavidade. Determine sua álgebra de Lie so(2) como espaço tangente em I. *Dica: R(θ) = [[cos θ, -sin θ],[sin θ, cos θ]]. Produto: R(θ)R(φ) = R(θ+φ). A álgebra so(2) = {[[0,-t],[t,0]] : t ∈ ℝ} ≅ ℝ. exp([[0,-t],[t,0]]) = R(t).*

2. **[Rank D]** Para a álgebra de Lie sl(2, ℂ) com bases e = [[0,1],[0,0]], f = [[0,0],[1,0]], h = [[1,0],[0,-1]]: calcule todos os colchetes [e,f], [h,e], [h,f] e verifique a identidade de Jacobi. Identifique a relação com a álgebra de oscilador harmônico de mecânica quântica. *Dica: [h,e] = 2e, [h,f] = -2f, [e,f] = h. Essas são as relações de sl(2). Em mecânica quântica: h ↔ H (Hamiltoniano), e ↔ a† (criação), f ↔ a (aniquilação), com [H,a†] = ℏω a†, [H,a] = -ℏω a, [a,a†] = 1.*

3. **[Rank C]** Prove a fórmula de Rodrigues para exponencial de matrizes antissimétricas de SO(3): para A = θ(n̂×) onde n̂ é vetor unitário e n̂× é a matriz antissimétrica de n̂, mostre que exp(A) = I + sin(θ)(n̂×) + (1-cos(θ))(n̂×)². *Dica: mostre que (n̂×)³ = -(n̂×) (propriedade de n̂× para n̂ unitário). Logo o polinômio mínimo de n̂× divide x³+x. Expanda exp(θ·n̂×) = Σ (θ·n̂×)ⁿ/n! agrupando potências pares e ímpares: pares dão (1-cos θ)(n̂×)² + I · cos θ... some com o termo de I.*

4. **[Rank B]** Mostre que SU(2) ≅ S³ como variedade diferenciável e que o homomorfismo de Lie φ: SU(2) → SO(3) definido por φ(U)·v = UvU† (onde v ∈ su(2) ≅ ℝ³ é identificado com matriz antihermitiana traceless) é recobrimento duplo com Ker(φ) = {I, -I}. *Dica: U ∈ SU(2) tem a forma [[a,-b̄],[b,ā]] com |a|²+|b|² = 1 — exatamente S³ ⊂ ℂ² ≅ ℝ⁴. A bijetividade local de φ vem do fato de dφ ser isomorfismo de álgebras de Lie (su(2) ≅ so(3)). O kernel é {U : Uvu† = v para todo v} = {U : [U,v]=0 para todo v} = centro de SU(2) = {±I}.*

5. **[Rank A] [BOSS]** Enuncie e esboce a prova do Teorema de Weyl sobre completa redutibilidade de representações de grupos de Lie compactos semissimples: toda representação de G (compacto semissimples) em espaço vetorial complexo de dimensão finita é soma direta de representações irredutíveis. Use a existência de produto interno G-invariante (via medida de Haar) para construir complementos ortogonais de sub-representações. *Dica: a medida de Haar μ é a única medida boreliana invariante à esquerda em G com μ(G) = 1 (existe para grupos compactos). Dado produto interno ⟨·,·⟩ qualquer, defina ⟨u,v⟩_G = ∫_G ⟨ρ(g)u, ρ(g)v⟩ dμ(g). Então ⟨·,·⟩_G é G-invariante. Para qualquer sub-representação W ⊆ V, seu complemento ortogonal W^⊥ (em ⟨·,·⟩_G) é também G-invariante, pois: se w ∈ W^⊥ e g ∈ G, ⟨ρ(g)w, u⟩_G = ⟨w, ρ(g⁻¹)u⟩_G = 0 para todo u ∈ W (pois ρ(g⁻¹)u ∈ W). Logo V = W ⊕ W^⊥ e ambos são sub-representações. Por indução na dimensão: toda representação é completamente redutível.*

## Próximos passos

- [geometria-diferencial](geometria-diferencial) — variedades, campos de vetores e fluxos
- [estruturas-algebricas](estruturas-algebricas) — grupos e homomorfismos
- [teoria-representacao](teoria-representacao) — representações de grupos de Lie e classificação
- [calculo-multivariavel](calculo-multivariavel) — o mapa exponencial usa integração de EDOs no grupo
- → Pratique no /math-quest na área **Álgebra** (Rank B+)
