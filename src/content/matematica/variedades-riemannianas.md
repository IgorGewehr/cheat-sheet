---
title: Variedades Riemannianas
category: matematica
stack: [Mat]
tags: [geometria, riemann, curvatura, conexao, hodge]
excerpt: "Métrica, conexão de Levi-Civita, geodésicas, curvatura Ricci/seccional, teorema de Hodge — a geometria do espaço-tempo e do ML geométrico."
related: [geometria-diferencial, topologia-geral, calculo-vetorial-geometria-analitica, grupos-de-lie, fisica-mecanica-classica]
updated: 2026-05
---

## O que é

Uma variedade Riemanniana é uma variedade diferenciável M munida de uma métrica Riemanniana g — atribuição suave a cada ponto p ∈ M de um produto interno gₚ no espaço tangente TₚM. Essa métrica permite medir comprimentos de curvas, ângulos, volumes, e definir curvatura intrínseca.

Riemann introduziu essas ideias em 1854 em sua "Habilitationsvortrag" para generalizar a geometria de superfícies de Gauss (que dependia de imersão em ℝ³) a noções **intrínsecas**, independentes de imersão. A noção de curvatura intrínseca culminou na "equação de curvatura" e antecipou em 60 anos a relatividade geral, onde a métrica de Lorentz no espaço-tempo é dinamicamente determinada pelo conteúdo de matéria-energia via equações de Einstein.

Hoje variedades Riemannianas são a linguagem padrão de relatividade geral, teoria geométrica de medida, fluxo de Ricci (usado por Perelman para provar a conjectura de Poincaré em 2003), e ML geométrico (otimização em variedades, redes neurais em variedades, difusão em manifolds para generativos).

## Por que estuda

Para matemático: a geometria Riemanniana é o ponto onde análise, álgebra e topologia se fundem — Laplaciano em variedades é simultaneamente operador analítico (espectro), algébrico (tensorial via Bochner), e topológico (Hodge: cohomologia de De Rham). É campo de pesquisa central pós-2000 (Perelman, Brendle, Bray, prêmios Fields e Abel).

Para física teórica: relatividade geral é geometria pseudo-Riemanniana (assinatura Lorentziana). Equações de Einstein Rᵤᵥ − ½Rgᵤᵥ = 8πG Tᵤᵥ relacionam curvatura à matéria. Teoria de campos clássica e quântica em espaço-tempo curvo usa fibrados e conexões — generalização da geometria Riemanniana.

Para ML moderno: dados frequentemente vivem em variedades de baixa dimensão imersas em alta (manifold hypothesis). Otimização em SPD(n), Stiefel, Grassmann, e em hiperbólico ℍⁿ (embeddings hierárquicos) usa geometria Riemanniana. Diffusion models em manifolds (Riemannian diffusion models, 2024) extendem score matching. Geometric deep learning (Bronstein et al.) unifica CNN/GNN/transformers como operadores equivariantes em variedades.

## Conceitos-chave

- **Variedade diferenciável Mⁿ**: espaço topológico Hausdorff, segundo-contável, localmente homeomorfo a ℝⁿ via cartas. Mapas de transição entre cartas são C^∞ — define estrutura suave. Espaço tangente TₚM é definido como derivações no anel de germes em p (intrínseco) ou como classes de equivalência de curvas (geométrico). Fibrado tangente TM = ⊔ₚ TₚM.
- **Métrica Riemanniana g**: seção do fibrado T*M ⊗ T*M simétrica e positiva-definida em cada ponto. Em cartas: g = gᵢⱼ dxⁱ ⊗ dxʲ, com gᵢⱼ matriz simétrica positiva-definida. Comprimento de curva γ: [a,b] → M: L(γ) = ∫ √(g(γ̇, γ̇)) dt. Distância: d(p,q) = inf L(γ) sobre curvas ligando p a q.
- **Conexão de Levi-Civita ∇**: única conexão linear simétrica (sem torsão) compatível com g — i.e., ∇g = 0. Símbolos de Christoffel: Γᵏᵢⱼ = ½ gᵏˡ (∂ᵢgⱼₗ + ∂ⱼgᵢₗ − ∂ₗgᵢⱼ). Define derivação covariante de campos vetoriais e tensoriais. É o "gradient" intrínseco que respeita a métrica.
- **Geodésicas**: curvas γ com ∇_{γ̇} γ̇ = 0 — análogas a retas (aceleração covariante nula). Em coords: d²γᵏ/dt² + Γᵏᵢⱼ (dγⁱ/dt)(dγʲ/dt) = 0. Localmente minimizam comprimento. Mapa exponencial expₚ: TₚM → M, v ↦ γᵥ(1), é difeomorfismo local. Variedade completa ⟺ todas geodésicas extensíveis para ℝ ⟺ (Hopf-Rinow) M completa como espaço métrico.
- **Tensor de curvatura de Riemann**: R(X,Y)Z = ∇_X ∇_Y Z − ∇_Y ∇_X Z − ∇_{[X,Y]} Z. Componentes: Rⁱⱼₖₗ. Mede a falha do paralelismo: transporte paralelo ao longo de loop pequeno gira vetores. Em ℝⁿ com métrica padrão, R = 0.
- **Curvatura seccional, Ricci, escalar**: K(π) = ⟨R(X,Y)Y, X⟩ / (|X|²|Y|² − ⟨X,Y⟩²) para plano π = span(X,Y); generaliza curvatura de Gauss. Ricci: Rᵢⱼ = Rᵏᵢₖⱼ (traço). Escalar: R = gⁱʲ Rᵢⱼ. Em RG: Rᵤᵥ − ½Rgᵤᵥ = 8πG Tᵤᵥ.
- **Espaços de curvatura constante**: ℝⁿ (K=0), Sⁿ (K=+1, esférica), ℍⁿ (K=−1, hiperbólica) são os modelos. Teorema de Killing-Hopf: variedade Riemanniana simplesmente conexa, completa, com K constante é isométrica a um desses três (a menos de escala).
- **Operador Laplace-Beltrami**: Δ_g f = (1/√|g|) ∂ᵢ(√|g| gⁱʲ ∂ⱼ f). Em ℝⁿ: Laplaciano usual. Auto-adjunto, espectro discreto se M compacta. Espectro codifica geometria — Kac: "Can one hear the shape of a drum?" (não em geral, mas com restrições).
- **Teorema de Hodge**: em variedade fechada (compacta, sem bordo) orientada, todo k-forma se decompõe unicamente: ω = dα + δβ + h, com h harmônica (Δh = 0). Espaço de formas harmônicas é canonicamente isomorfo à cohomologia de De Rham Hᵏ_{dR}(M; ℝ). Liga análise a topologia.

## Confusões comuns

**"Curvatura é só uma medida 'positiva ou negativa'"**: em superfícies (n=2), Gauss curvature é um escalar. Em dim ≥ 3, a curvatura é o tensor de Riemann completo (n²(n²−1)/12 componentes independentes em dim n). Curvatura seccional captura informação 2D; Ricci é um traço; escalar é traço duplo. Cada uma perde informação progressivamente.

**"Geodésica = caminho mais curto"**: localmente sim, globalmente não. Em S², um arco maior de um grande círculo é geodésica mas não minimiza distância. Geodésica é solução da equação ∇_{γ̇}γ̇ = 0; minimização é variacional (calc. variações). Hopf-Rinow garante que entre dois pontos de variedade completa existe geodésica minimizante, mas pode não ser única.

**"Conexão = métrica"**: não. Conexão é uma escolha de derivação covariante (regra Leibniz + linearidade). Em geral, há infinitas conexões em M. A Levi-Civita é a **única** que é compatível com a métrica E é simétrica (sem torsão). Outras conexões úteis: Weitzenböck, conexões com torsão em teoria de gauge.

**"Mapa exponencial é exponencial"**: nome é por analogia. No grupo de Lie SO(3), o mapa expₑ: 𝔰𝔬(3) → SO(3) é literalmente A ↦ I + A + A²/2 + ... e coincide com exponencial de matrizes. Em geral: expₚ(v) = γᵥ(1), onde γᵥ é geodésica com γᵥ(0)=p, γ̇ᵥ(0)=v. Em ℝⁿ: expₚ(v) = p + v.

**"Variedade compacta ⟹ completa"**: sim, em qualquer caso. Mas variedade completa **não** implica compacta (ℝⁿ é completo, não compacto). Hopf-Rinow: completude = compacidade de bolas fechadas = extensibilidade de geodésicas.

**"Tensor de Ricci em RG é apenas 'soma de curvaturas'"**: Rᵢⱼ = Rᵏᵢₖⱼ traça o tensor de Riemann. Geometricamente: Ricᵢⱼ vᵢ vʲ mede como pequenos volumes ao redor da geodésica γᵥ se distorcem. Em RG: Ricci = matéria + presão (via equações de Einstein). Espaços Einstein: Rᵢⱼ = λgᵢⱼ (vácuo com constante cosmológica).

## Aplicação em CS/Dev/ML

**Otimização em variedades**: minimizar f: SPD(n) → ℝ (matrizes simétricas positivas-definidas) com método de gradiente Riemanniano: x_{k+1} = exp_{xₖ}(−η · grad_g f). Pymanopt, Geoopt implementam. Aplicações: covariance estimation, low-rank Riemannian SGD, otimização rotacional em SO(3)/SO(n).

**Hyperbolic embeddings (Nickel & Kiela 2017)**: embeddings de hierarquias (taxonomias, árvores) em ℍⁿ (hiperbólico) preservam estrutura combinatorial melhor que ℝⁿ. Volume cresce exponencialmente, então ℍⁿ "tem mais espaço" para ramificações. Usado em Poincaré embeddings, gráfos hiperbólicos.

**Diffusion models em variedades**: Riemannian diffusion models (De Bortoli et al. 2022, Chen et al. 2024) generalizam DDPM substituindo passeio aleatório em ℝⁿ por movimento Browniano em M. Reverse process resolve EDE estocástica retrógrada na variedade. Para gerar rotações (SO(3)), proteínas, moléculas.

**Geometric Deep Learning (Bronstein, Bruna, Cohen, Veličković 2021)**: framework unificando CNN (translação em grids), GNN (permutação em grafos), e transformers (atenção em conjuntos) sob operações equivariantes em variedades/espaços homogêneos. Pré-requisito: geometria diferencial e teoria de grupos.

**Relatividade numérica**: simulações de fusão de buracos negros (LIGO/Virgo deteção 2015) resolvem equações de Einstein em variedade Lorentziana 4D. Decomposição ADM (3+1), gauge harmonic, geração de ondas gravitacionais — análise em variedades + EDPs.

**Diffusion maps / spectral embedding**: dado um dataset, construa grafo de vizinhança e Laplaciano. Autovetores do Laplaciano dão coordenadas em variedade aproximada — Laplacian Eigenmaps. Conexão com Laplace-Beltrami: no limite contínuo, grafo Laplaciano converge ao operador da variedade subjacente.

## Como praticar

- **Livro base**: do Carmo — *Riemannian Geometry* (clássico, sólido, ~300pg). Lee — *Riemannian Manifolds: An Introduction to Curvature* (didático, complementa Lee's *Smooth Manifolds*). Petersen — *Riemannian Geometry* (panorama moderno). Para físicos: Wald — *General Relativity*.
- **Calcule no espaço-modelo**: compute Christoffel, curvatura seccional, geodésicas em S², ℍ² (modelo do disco de Poincaré, modelo do semi-plano), em ℝ²/ℤ² (toro plano). Cada exemplo ilumina aspectos diferentes.
- **Visualize**: plote geodésicas em S² (grandes círculos) e ℍ² (arcos de círculo ortogonais à fronteira). Use Manim ou Python + matplotlib. Implemente uma simulação simples de transporte paralelo.
- **Projeto computacional**: implemente otimização Riemanniana em Pymanopt — Procrustes em SO(3), PCA em Grassmann, low-rank matrix completion em variedade de matrizes posto-r. Compare com otimização em ℝⁿ projetada.
- **Lean 4 / Mathlib**: já tem `Manifold`, `Geodesic`, `RiemannianMetric`. Formalize: em S² toda geodésica é parte de grande círculo.
- **Aplicação à física**: derive a métrica de Schwarzschild (campo gravitacional de massa pontual estática) e compute órbitas geodésicas — recupera mecânica de Kepler + correção que prediz precessão de Mercúrio.

## Exercícios práticos

1. **[Rank E]** Em S² ⊂ ℝ³ com coordenadas esféricas (θ, φ), a métrica induzida é g = dθ² + sin²θ dφ². Calcule (a) o elemento de área dA = √|g| dθ dφ; (b) o área total da esfera unitária. *Dica: |g| = sin²θ. dA = sin θ dθ dφ. Área = ∫₀^π ∫₀^{2π} sin θ dφ dθ = 4π.*

2. **[Rank D]** Compute os símbolos de Christoffel da métrica hiperbólica no semi-plano superior ℍ² = {(x,y) : y > 0} com g = (dx² + dy²)/y². *Dica: gₓₓ = g_{yy} = 1/y², gₓᵧ = 0. Inversa: gˣˣ = g^{yy} = y², gˣʸ = 0. Não-nulos: Γˣₓᵧ = Γˣᵧₓ = −1/y, Γʸₓₓ = 1/y, Γʸᵧᵧ = −1/y. As demais zero por simetria.*

3. **[Rank C]** Mostre que em ℍ² (semi-plano superior, exercício 2), as retas verticais (x = const) e os semi-círculos centrados no eixo x são geodésicas. *Dica: para x(t) = a, y(t): equação geodésica dá ÿ = (1/y) ẏ², resolvido por y = e^t (até reparametrização afim). Para semi-círculo (x − c)² + y² = r², parametrize por ângulo e verifique que satisfaz ∇_{γ̇}γ̇ = 0. Alternativamente, use o fato de que isometrias de ℍ² (PSL(2,ℝ) agindo por Möbius) preservam geodésicas e enviam verticais em semi-círculos.*

4. **[Rank B]** Demonstre o teorema de Bonnet-Myers: se (M, g) é variedade Riemanniana completa de dim ≥ 2 com curvatura de Ricci satisfazendo Ric ≥ (n−1)k g para algum k > 0, então M é compacta e diam(M) ≤ π/√k. *Dica: use a equação de Jacobi ao longo de geodésica unitária γ. Some sobre base ortonormal de campos de Jacobi normais a γ; a soma satisfaz F̈ + Ric(γ̇, γ̇)/n−1 · F ≤ 0 com F > 0. Pelo argumento de Sturm-Liouville comparado com solução de y'' + ky = 0, F atinge zero antes de t = π/√k. Logo γ não é minimizante além disso. Então diâmetro é ≤ π/√k; completude + diâmetro finito + Hopf-Rinow ⟹ compacta.*

5. **[Rank A] [BOSS]** Demonstre o teorema da decomposição de Hodge para variedade Riemanniana fechada orientada: o espaço das k-formas Ωᵏ(M) se decompõe ortogonalmente como Ωᵏ = im(d) ⊕ im(δ) ⊕ ker(Δ), onde Δ = dδ + δd e δ é o adjunto de d. Em particular, toda classe de cohomologia de De Rham [ω] ∈ Hᵏ(M; ℝ) tem um único representante harmônico. *Dica: passo 1 — defina produto interno em Ωᵏ via ⟨α,β⟩ = ∫_M α ∧ ⋆β e mostre δ = ±⋆d⋆ (com sinal dependente de dim e k). Passo 2 — mostre que d, δ, Δ são lineares, com d² = δ² = 0; Δ é auto-adjunto. Passo 3 — Δω = 0 ⟺ dω = 0 e δω = 0 (use ⟨Δω, ω⟩ = ‖dω‖² + ‖δω‖²). Passo 4 — Δ é elíptico, então sua imagem é fechada em Ωᵏ e ker(Δ) tem dim. finita (teoria elíptica em variedades compactas). Passo 5 — Ωᵏ = ker(Δ) ⊕ im(Δ); mas im(Δ) = im(d) + im(δ); ortogonalidade segue. Passo 6 — fechadas = ker(d) = im(d) ⊕ ker(Δ); cohomologia = ker(d)/im(d) ≅ ker(Δ).*

## Próximos passos

- [geometria-diferencial](geometria-diferencial) — pré-requisito: formas diferenciais, variedades, fibrados
- [analise-funcional](analise-funcional) — teoria espectral de Laplace-Beltrami
- [grupos-de-lie](grupos-de-lie) — variedades homogêneas G/H têm métricas naturais
- [analise-harmonica](analise-harmonica) — análise harmônica em variedades homogêneas
- [topologia-algebrica](topologia-algebrica) — cohomologia de De Rham via formas harmônicas
- → Pratique no /math-quest na área **Geometria** (Rank A+)
