---
title: Cálculo das Variações
category: matematica
stack: [Mat, Python]
tags: [calculo, aplicada, fisica, otimizacao]
excerpt: Funcionais, equações de Euler-Lagrange, geodésicas e o princípio da mínima ação — otimização sobre espaços de funções.
related: [calculo-multivariavel, equacoes-diferenciais-ordinarias, mecanica-lagrangiana-hamiltoniana, otimizacao-pesquisa-op]
updated: 2026-05
---

## O que é

Cálculo das Variações é o ramo do cálculo que trata de otimizar **funcionais** — funções que recebem funções como argumento e retornam um número real. A pergunta fundamental: "qual função y(x) minimiza (ou maximiza) o funcional F[y] = ∫_a^b L(x, y, y') dx?"

O problema mais antigo é a **braquistócrona** (Johann Bernoulli, 1696): dado dois pontos A e B no plano, qual é a curva y(x) tal que uma esfera deslizando sem atrito de A para B chega mais rápido? A resposta é uma cicloide — e o método de Bernoulli foi o primeiro uso de variações funcionais.

O resultado central é a **equação de Euler-Lagrange**: se y* minimiza F[y] = ∫_a^b L(x,y,y') dx com condições de fronteira y(a) = α, y(b) = β, então y* satisfaz a EDP

∂L/∂y - d/dx(∂L/∂y') = 0

Essa equação é a condição de "gradiente zero" para funcionais — análoga a f'(x) = 0 para pontos críticos de funções comuns.

## Por que estuda

Para o matemático, cálculo das variações é o ponto de encontro de análise (espaços de funções, espaços de Sobolev), EDP (a equação de Euler-Lagrange é frequentemente uma EDP), e geometria (geodésicas são variações de comprimento). Existência e regularidade de minimizadores é um campo em aberto e profundo.

Para física: o princípio de Hamilton (mínima ação) diz que a trajetória real de um sistema mecânico é aquela que minimiza a ação S = ∫L dt, onde L = T - V (energia cinética menos potencial). As equações de Euler-Lagrange são exatamente as equações de Newton, mas formuladas de modo coordinate-free. Essa formulação generaliza para relatividade, teoria de campos quânticos, strings.

Para ML/CS: regularização em aprendizado de máquina (L2, L1, variação total) é cálculo das variações aplicado. Treinamento de redes neurais pode ser visto como otimização num espaço de funções. Equações de fluxo ótimo (Benamou-Brenier) e transporte ótimo são cálculo das variações. Redes neurais physics-informed (PINNs) minimizam funcionais que penalizam violações de EDPs.

## Conceitos-chave

- **Funcional e variação**: F[y] = ∫_a^b L(x, y(x), y'(x)) dx. A variação de primeira ordem δF[y; η] = d/dε|_{ε=0} F[y + εη] para variações admissíveis η (com η(a) = η(b) = 0). Condição necessária de mínimo: δF[y*; η] = 0 para toda η admissível.
- **Derivação da equação de Euler-Lagrange**: δF = ∫_a^b (∂L/∂y · η + ∂L/∂y' · η') dx. Integrando por partes: ∫_a^b ∂L/∂y' · η' dx = [∂L/∂y' · η]_a^b - ∫_a^b d/dx(∂L/∂y') · η dx. Como η(a) = η(b) = 0 e η é arbitrária: ∂L/∂y - d/dx(∂L/∂y') = 0 (lemma fundamental do cálculo das variações).
- **Exemplos canônicos**: comprimento de curva: F[y] = ∫√(1+y'²) dx → E-L: d/dx(y'/√(1+y'²)) = 0 → y' = constante → retas são geodésicas no plano. Geodésicas em superfície: variação do comprimento ∫√(Eu'² + 2Fu'v' + Gv'²) dt (com métrica Riemanniana). Superfície mínima: variar área ∫∫√(EG-F²) → equação de curvatura média zero H = 0.
- **Integrais de primeira: conservação de energia**: se L não depende explicitamente de x (autônomo: ∂L/∂x = 0), a integral de movimento E = y'·∂L/∂y' - L é constante ao longo das soluções. Em mecânica: E = energia total. Se L não depende explicitamente de y: ∂L/∂y' = cte (momento conservado).
- **Condições de Legendre e convexidade**: F[y] tem mínimo local em y* apenas se ∂²L/∂y'² ≥ 0 (condição de Legendre) — análogo à segunda derivada positiva. Condição suficiente mais forte: L é convexa em (y, y'). Teoria de existência de minimizadores usa sequências minimizantes e compacidade em espaços de Sobolev.
- **Múltiplas funções e campo vetorial**: se y = (y₁,…,yₙ) é vetor de funções, cada componente satisfaz sua equação de Euler-Lagrange: ∂L/∂yᵢ - d/dx(∂L/∂yᵢ') = 0. Para Lagrangiana de campo L(ψ, ∂_μψ): a equação de Euler-Lagrange é ∂L/∂ψ - ∂_μ(∂L/∂(∂_μψ)) = 0. Isso reproduz as equações de campo de Klein-Gordon, Maxwell, Einstein-Hilbert.
- **Problema isoperimétrico e multiplicadores de Lagrange**: minimizar F[y] = ∫f(x,y,y')dx sujeito a G[y] = ∫g(x,y,y')dx = C (restrição funcional). Solução: encontrar y que satisfaça E-L para L* = f - λg (análogo de Lagrange para funcionais). O problema isoperimétrico clássico: maximize área com perímetro fixo — a solução é a circunferência.
- **Princípio de Hamilton e mecânica**: ação S[q] = ∫_t₁^t₂ L(q, q̇, t) dt. E-L: d/dt(∂L/∂q̇ᵢ) = ∂L/∂qᵢ — equações de Lagrange. Para L = T - V (T cinética, V potencial): estas são as equações de Newton. A passagem para Hamiltoniana (transformada de Legendre H = q̇·p - L, p = ∂L/∂q̇) é parte de um módulo separado.

## Confusões comuns

**"A equação de Euler-Lagrange é uma equação de minimização"**: E-L é condição necessária de extremo (mínimo, máximo, ou ponto de sela). Que o ponto crítico seja mínimo requer condição adicional (Legendre, Jacobi). Há funcionais com infinitos pontos críticos e nenhum minimizador global.

**"L(x,y,y') é apenas uma notação conveniente"**: A Lagrangiana L codifica toda a física do sistema: T - V em mecânica, métrica Riemanniana em geodésicas, tensão superficial em membranas. Escolher a Lagrangiana correta para um fenômeno é o insight físico; a matemática das equações de E-L é automática depois.

**"Cálculo das variações é só para funcionais de uma variável"**: A teoria generaliza para funcionais de campos: F[ψ(x₁,…,xₙ)] = ∫L(ψ, ∂ᵢψ, xᵢ) dⁿx. As equações de E-L tornam-se EDPs (não apenas EDOs). Esse é o contexto de teoria quântica de campos.

**"Minimizar ∫L dx sempre tem solução"**: Não. Funcionais podem não ter minimizadores no espaço de funções naturais. Exemplo: F[y] = ∫₀¹ x²y'² dx com y(0) = 0, y(1) = 1. O infimum é 0 mas não é atingido por funções contínuas — apenas pela função descontínua y(x) = 1 para x > 0. Isso motiva os espaços de Sobolev como domínio natural.

## Aplicação em CS/Dev/ML

**Regularização como cálculo das variações**: regularização L2 (ridge): minimizar ‖Xw - y‖² + λ‖w‖² é minimização num espaço de funções. Variação total (TV regularization): minimizar ∫|∇u| em imagens para denoising preservando bordas — equação de E-L é a equação do fluxo de curvatura média (mean curvature flow). Regularização de Tikhonov em problemas inversos.

**Transporte ótimo**: o problema de Monge-Kantorovich de transportar distribuição μ para ν com mínimo custo é cálculo das variações. A formulação dinâmica de Benamou-Brenier: minimize ∫₀¹ ∫ |v(x,t)|² ρ(x,t) dx dt sujeito a ∂_tρ + ∇·(ρv) = 0. Aplicações: Wasserstein GANs, flow matching, geração de imagens com fluxo de normalização.

**PINNs (Physics-Informed Neural Networks)**: minimizar funcional F[u] = ‖EDP[u]‖² + ‖u|_∂Ω - g‖² onde a rede neural representa u. Treinamento = cálculo das variações discretizado em parâmetros de rede. Aplicações em dinâmica de fluidos, equação do calor, ondas.

**Otimização de forma (shape optimization)**: dado um domínio Ω, minimizar algum funcional (perda de calor, arrasto aerodinâmico) variando a forma de Ω. Derivada de forma é cálculo das variações para domínios variáveis. Usado em design de asas, circuitos, estruturas.

**SciPy**: `scipy.optimize.minimize` pode minimizar funcionais discretizados. Para EDOs derivadas de E-L: `scipy.integrate.solve_ivp`. Para problemas variacionais simbólicos: `sympy.calculus.euler` ou manual.

## Como praticar

- **Livro base**: Gelfand & Fomin — *Calculus of Variations* (Dover) — clássico, conciso, matematicamente rigoroso. Lanczos — *The Variational Principles of Mechanics* — mais físico, excelente para intuição. Para nível avançado: Evans — *Partial Differential Equations* (Capítulo 8, Calculus of Variations).
- **Derivar E-L para Lagrangianas específicas**: comprimento de curva, área de superfície, braquistócrona, cadeia pendurada (catenária), corda vibrante.
- **Resolver as equações de E-L resultantes**: as EDOs/EDPs resultantes frequentemente têm soluções explícitas para Lagrangianas simples. Praticar a integração do resultado.
- **Projeto**: implemente a solução numérica do problema da braquistócrona por discretização: divida o intervalo em n segmentos, parameterize os pontos intermediários, e use gradient descent para minimizar o tempo de descida. Compare com a solução analítica (cicloide).

## Exercícios práticos

1. **[Rank E]** Derive a equação de Euler-Lagrange para F[y] = ∫₀¹ y'² dx com y(0) = 0, y(1) = 1. Resolva a EDO resultante e verifique que a solução é a reta y = x. *Dica: L = y'². ∂L/∂y = 0, ∂L/∂y' = 2y'. E-L: -d/dx(2y') = 0 → y'' = 0 → y = ax + b. Com y(0) = 0, y(1) = 1: y = x.*

2. **[Rank D]** Derive a equação de Euler-Lagrange para o comprimento de curva F[y] = ∫_a^b √(1 + y'²) dx. Mostre que as geodésicas no plano (curvas que minimizam o comprimento) são retas. *Dica: L = √(1+y'²). ∂L/∂y = 0, ∂L/∂y' = y'/√(1+y'²). E-L: d/dx(y'/√(1+y'²)) = 0 → y'/√(1+y'²) = C (constante) → y' = C/√(1-C²) = constante → y = ax + b (reta).*

3. **[Rank C]** Resolva o problema isoperimétrico: maximize a área A[y] = ∫₀^L y dx sujeito ao comprimento fixo P[y] = ∫₀^L √(1+y'²) dx = L (comprimento dado). Use multiplicadores de Lagrange para funcionais: encontre y que satisfaz E-L para L* = y - λ√(1+y'²). Identifique a solução como arco de circunferência. *Dica: ∂L*/∂y = 1, ∂L*/∂y' = -λy'/√(1+y'²). E-L: 1 + d/dx(λy'/√(1+y'²)) = 0. Integrando: λy'/√(1+y'²) = -(x - a) para constante a. Resolvendo: (x-a)² + y² = λ² — circunferência de raio λ.*

4. **[Rank B]** Para o funcional da braquistócrona F[y] = ∫_0^x₁ √((1+y'²)/(2gy)) dx (tempo de descida de (0,0) a (x₁,y₁) sob gravidade g), use a integral primeira (∂L/∂x = 0 implica y'·∂L/∂y' - L = const) para mostrar que a solução satisfaz y(1 + y'²) = 2R (constante). Parametrize a solução como x = R(θ - sin θ), y = R(1 - cos θ) (cicloide). *Dica: a integral primeira: √((1+y'²)/y) - y'·y'/√((1+y'²)y) = C → 1/(C²y(1+y'²)) = 1 → y(1+y'²) = 1/C² = 2R. Para a parametrização: use tan(θ/2) = 1/y' e integre.*

5. **[Rank A] [BOSS]** Enuncie e prove o Teorema de Noether: se o funcional F[q] = ∫L(q, q̇, t) dt é invariante sob uma família a um parâmetro de transformações q ↦ Q(q, ε) com Q(q, 0) = q, então existe uma integral de movimento conservada: J = ∂L/∂q̇ · ∂Q/∂ε|_{ε=0}. Aplique para provar (a) que invariância por translação temporal implica conservação de energia, (b) invariância por translação espacial implica conservação de momento. *Dica: Seja h(x) = ∂Q/∂ε|_{ε=0}. A invariância de F implica d/dε|_{ε=0} F[Q(q,ε)] = ∫(∂L/∂q · h + ∂L/∂q̇ · ḣ) dt = 0. Usando E-L (∂L/∂q = d/dt(∂L/∂q̇)) e integração por partes: ∫ d/dt(∂L/∂q̇ · h) dt = 0. Como isso vale para qualquer intervalo: d/dt(∂L/∂q̇ · h) = 0, portanto J = ∂L/∂q̇ · h é conservado. (a) translação temporal: h = q̇, J = ∂L/∂q̇ · q̇ - L = H (energia). (b) translação espacial: h = 1, J = ∂L/∂q̇ = p (momento).*

## Próximos passos

- [mecanica-lagrangiana-hamiltoniana](mecanica-lagrangiana-hamiltoniana) — princípio da mínima ação, Lagrangiana e Hamiltoniana
- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — a equação de E-L é uma EDO
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — dualidade, multiplicadores de Lagrange discretos
- [medida-integracao](medida-integracao) — espaços de Sobolev e análise funcional como domínio natural de funcionais
- → Pratique no /math-quest na área **Análise** (Rank C+)
