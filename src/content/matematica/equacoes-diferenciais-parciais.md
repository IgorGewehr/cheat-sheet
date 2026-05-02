---
title: Equações Diferenciais Parciais (EDP)
category: matematica
stack: [Mat, Python]
tags: [calculo, aplicada, fisica]
excerpt: Equações do calor, onda e Laplace — como campos físicos evoluem em espaço e tempo.
related: [equacoes-diferenciais-ordinarias, calculo-multivariavel, calculo-vetorial-geometria-analitica, analise-numerica, modelagem-matematica]
updated: 2026-05
---

## O que é

Equações diferenciais parciais (EDPs) envolvem funções de múltiplas variáveis e suas derivadas parciais. Enquanto EDOs descrevem a evolução de sistemas com um grau de liberdade (tempo), EDPs descrevem a evolução de campos — funções de espaço e tempo simultaneamente.

As três EDPs prototípicas são: **equação do calor** (∂u/∂t = α∇²u), que descreve difusão de temperatura; **equação de onda** (∂²u/∂t² = c²∇²u), que descreve propagação de ondas; e **equação de Laplace** (∇²u = 0) e sua versão não-homogênea Poisson (∇²u = f), que descrevem equilíbrio estacionário de campos.

Classificação das EDPs lineares de segunda ordem em duas variáveis: parabólica (calor), hiperbólica (onda), elíptica (Laplace/Poisson). Essa classificação determina o comportamento qualitativo da solução e o método numérico adequado.

A teoria de EDPs é vasta e difícil — muito mais que a de EDOs. Muitas EDPs importantes não têm solução analítica em forma fechada. O campo moderno se apoia em análise funcional, teoria das distribuições (Schwartz), espaços de Sobolev, e métodos numéricos (elementos finitos, diferenças finitas, volumes finitos).

## Por que estuda

EDPs são a linguagem da física: equações de Maxwell (eletromagnetismo), Schrödinger (mecânica quântica), Navier-Stokes (fluidos), elasticidade, relatividade geral. Para o engenheiro, EDPs são o modelo de qualquer fenômeno distribuído no espaço.

Para ML/IA: equações de difusão estão no coração dos modelos generativos (DDPM, Score Matching). PINNs (Physics-Informed Neural Networks) treinam redes neurais para aproximar soluções de EDPs incorporando a equação na loss. Operadores neurais (FNO — Fourier Neural Operator) aprendem mapeamentos entre funções — a generalização de NN para resolver famílias de EDPs.

## Conceitos-chave

- **Classificação**: EDP linear de 2ª ordem Au_{xx} + Bu_{xy} + Cu_{yy} + … = 0. Discriminante D = B² - 4AC. D < 0: elíptica (Laplace); D = 0: parabólica (calor); D > 0: hiperbólica (onda). Cada tipo tem teoria de existência, unicidade e regularidade diferente.
- **Equação do calor**: ∂u/∂t = α∂²u/∂x² (1D). Solução por separação de variáveis: u(x,t) = X(x)T(t) → dois problemas de Sturm-Liouville. Solução fundamental (núcleo de calor): G(x,t) = (1/√(4παt))·e^{-x²/(4αt)}. Solução para dado inicial arbitrário: convolução com G.
- **Equação de onda**: ∂²u/∂t² = c²∂²u/∂x² (1D). Solução de d'Alembert: u(x,t) = f(x+ct) + g(x-ct) — superposição de ondas viajando em direções opostas. Para string com extremos fixos (condições de contorno de Dirichlet): séries de Fourier no espaço.
- **Equação de Laplace e Poisson**: ∇²u = 0 em domínio Ω. Funções harmônicas. Princípio do máximo: u não pode ter máximo ou mínimo no interior (exceto constantes). Fórmula da média: valor de u em qualquer ponto = média de u na esfera ao redor. Poisson: ∇²u = f modela potencial gravitacional, elétrico, pressão em fluido incompressível.
- **Condições de contorno e de valor inicial**: Dirichlet (u prescrito no bordo), Neumann (∂u/∂n prescrito), Robin (combinação linear). Para EDP parabólica e hiperbólica, condições iniciais (em t=0) são necessárias além das de contorno.
- **Separação de variáveis**: funciona para geometrias simples (retangular, cilíndrica, esférica) com condições de contorno regulares. Gera problema de Sturm-Liouville cujas autofunções formam base ortonormal (séries de Fourier, Bessel, Legendre).
- **Espaços de Sobolev e soluções fracas**: para EDPs com dados irregulares, soluções clássicas (diferenciáveis) podem não existir. Soluções fracas vivem em espaços de Sobolev H^k(Ω) e são a base do método de elementos finitos (FEM).
- **Transformada de Fourier e Laplace para EDPs**: transformar em x elimina derivadas espaciais; transformar em t elimina derivadas temporais. Reduz EDP para EDO (no espaço transformado), resolve, inverte a transformada.

## Confusões comuns

**"EDP de segunda ordem tem sempre 2 condições iniciais"**: Depende do tipo. Equações hiperbólicas (onda) precisam de u e ∂u/∂t em t=0. Parabólicas (calor) precisam apenas de u em t=0. Elípticas (Laplace) precisam de condições de contorno no bordo do domínio, não condições iniciais.

**"Separação de variáveis resolve qualquer EDP"**: Funciona para geometrias simples e coeficientes constantes. Para domínios irregulares ou coeficientes variáveis, não se aplica diretamente — precisa-se de métodos numéricos (FEM, FDM, FVM) ou transformadas.

**"A equação do calor e a equação de Schrödinger são diferentes"**: A equação de Schrödinger iℏ ∂ψ/∂t = Hψ é formalmente idêntica à equação do calor com parâmetro imaginário. Os métodos de solução são similares; a interpretação física é completamente diferente (amplitude de probabilidade quântica vs. temperatura).

**"Problema de Cauchy para Laplace está bem posto"**: Ao contrário. O problema de Cauchy para equações elípticas é mal posto (teorema de Hadamard) — pequenas perturbações nas condições iniciais causam perturbações arbitrariamente grandes na solução. Equações elípticas precisam de condições de contorno, não de Cauchy.

**"Método de elementos finitos e diferenças finitas são equivalentes"**: São diferentes: diferenças finitas discretiza as derivadas diretamente em uma malha estruturada; elementos finitos reformula a EDP em forma variacional (fraca) e aproxima em espaço de funções de dimensão finita. FEM lida melhor com geometrias complexas e condições de contorno mistas.

## Aplicação em CS/Dev/ML

**Modelos de difusão (DDPM, Score Matching)**: a adição progressiva de ruído gaussiano é a equação do calor discreta; o processo de denoising reverso é a equação de difusão reversa de Kolmogorov (ou a SDE reversa de Anderson). Song et al. (2021) formulam a conexão com EDPs de forma explícita.

**PINNs (Physics-Informed Neural Networks)**: treina rede u_θ(x,t) minimizando: ||EDP aplicada a u_θ||² + ||condições de contorno||² + ||dados observacionais||². Pode resolver EDPs sem malha, para domínios arbitrários, incorporando física conhecida.

**Fourier Neural Operator (FNO)**: aprende o operador solução G† : a(x) → u(x) de uma família de EDPs no espaço de Fourier. Treinado uma vez, resolve qualquer instância de parâmetros a(x) em milissegundos. Estado-da-arte para EDPs em turbulência, clima.

**Simulação de fluidos em jogos**: motores de jogo usam solvers de Navier-Stokes simplificados ou aproximações (SPH — Smoothed Particle Hydrodynamics) para simular água, fumaça, fogo em tempo real.

**Processamento de imagem**: difusão anisotrópica de Perona-Malik (∂I/∂t = ∇·(c(|∇I|)∇I)) é uma EDP para denoising de imagem que preserva bordas. Inpainting de imagem usa equação de Laplace/Poisson para preencher regiões faltantes de forma suave.

## Como praticar

- **Livro base**: Zill — *Equações Diferenciais com Aplicações em Modelagem* (cap. de EDP). Para nível universitário rigoroso: Evans — *Partial Differential Equations* (referência do campo). Strauss — *Partial Differential Equations: An Introduction* (mais acessível).
- **Resolver os 3 protótipos analiticamente**: equação do calor em [0,L] com condições de Dirichlet; equação de onda com d'Alembert; equação de Laplace em retângulo. Sem computador, à mão, com séries de Fourier.
- **Diferenças finitas em Python**: implemente a equação do calor 1D com esquema explícito (Euler em tempo, diferença central em espaço). Verifique a condição de estabilidade CFL: Δt ≤ Δx²/(2α).
- **FEniCS ou FEniCSx**: biblioteca Python para FEM. Resolve qualquer EDP formulada em forma fraca em domínios arbitrários. Dois tutoriais básicos dão fluência suficiente para modelagem.
- **Projeto PINN**: use PyTorch para implementar um PINN simples para a equação do calor 1D. Minimize a loss de equação (avaliada em pontos de colocação) + loss de condição de contorno. Compare com solução analítica.

## Exercícios práticos

1. **[Rank E]** Classifique as seguintes EDPs de segunda ordem como elíptica, parabólica ou hiperbólica usando o discriminante B² - 4AC: (a) ∂²u/∂x² + ∂²u/∂y² = 0 (Laplace); (b) ∂u/∂t = ∂²u/∂x² (calor); (c) ∂²u/∂t² = c²∂²u/∂x² (onda). *Dica: na forma Au_{xx} + Bu_{xy} + Cu_{yy} = f, o discriminante é Δ = B²-4AC. Laplace: A=C=1, B=0, Δ=-4 (elíptica). Calor: u_t = u_{xx} trocando papel (parabólica Δ=0). Onda: hiperbólica Δ>0.*

2. **[Rank D]** Resolva a equação do calor em [0,π] com u(0,t) = u(π,t) = 0 e u(x,0) = sin(x) + (1/2)sin(3x). Encontre a solução via séries de Fourier sem usar numerics. *Dica: a solução geral é u(x,t) = Σ bₙ sin(nx) e^{-n²t}. Com a condição inicial: b₁ = 1, b₃ = 1/2, bₙ = 0 para outros n. Solução: u(x,t) = sin(x)e^{-t} + (1/2)sin(3x)e^{-9t}.*

3. **[Rank C]** Resolva a equação de Laplace ∇²u = 0 no quadrado [0,1]×[0,1] com condições de contorno u(x,0) = sin(πx), u(x,1) = u(0,y) = u(1,y) = 0 via separação de variáveis. Exiba a solução explícita. *Dica: tente u = X(x)Y(y). X''/X = -Y''/Y = -λ. Com condições de Dirichlet em x: X = sin(nπx), λₙ = n²π². Y = Aₙe^{nπy} + Bₙe^{-nπy}. Condições em y = 0 e y = 1 para n = 1 dão u(x,y) = sin(πx)·(e^{π(1-y)} - e^{-π(1-y)})/(e^π - e^{-π}).*

4. **[Rank B]** Derive a solução de d'Alembert para a equação de onda u_{tt} = c²u_{xx} com u(x,0) = f(x), u_t(x,0) = g(x). Mostre que a solução é u(x,t) = [f(x+ct)+f(x-ct)]/2 + (1/2c)∫_{x-ct}^{x+ct} g(s) ds. *Dica: faça a mudança de variáveis ξ = x+ct, η = x-ct. A EDP vira ∂²u/∂ξ∂η = 0, cujas soluções são u = F(ξ)+G(η) = F(x+ct)+G(x-ct). Das condições iniciais, determine F e G.*

5. **[Rank A] [BOSS]** Formule e prove a identidade de energia para a equação de onda: para u que satisfaz u_{tt} = c²u_{xx} em ℝ×[0,T] com dados iniciais compactos, a energia E(t) = (1/2)∫_{-∞}^{∞} (u_t² + c²u_x²) dx é conservada (dE/dt = 0). Use a solução de d'Alembert para verificar explicitamente, e então prove de modo geral integrando por partes. *Dica: dE/dt = ∫(u_t·u_{tt} + c²u_x·u_{xt}) dx = ∫u_t(u_{tt} - c²u_{xx}) dx + c²∫(u_x·u_{xt} + u_t·u_{xx}) dx. O primeiro integral é zero pela EDP. O segundo é c²∫∂_x(u_t·u_x) dx = c²[u_t·u_x]_{-∞}^{∞} = 0 pelos dados compactos.*

## Próximos passos

- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — EDOs são o caso 1D das EDPs
- [analise-numerica](analise-numerica) — métodos numéricos para EDPs (FDM, FEM, FVM)
- [medida-integracao](medida-integracao) — teoria de espaços de Sobolev e soluções fracas
- [fisica-mecanica-classica](fisica-mecanica-classica) — EDPs na física: ondas, calor, potencial
- → Pratique no /math-quest na área **Aplicada/EDPs** (Rank C+)
