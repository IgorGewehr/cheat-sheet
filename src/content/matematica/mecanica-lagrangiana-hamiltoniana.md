---
title: Mecânica Lagrangiana e Hamiltoniana
category: matematica
stack: [Mat]
tags: [aplicada, fisica, geometria]
excerpt: "Princípio da mínima ação, equações de Euler-Lagrange, Hamiltoniano e parêntese de Poisson — o formalismo que abre a mecânica quântica e teoria de campos."
related: [calculo-multivariavel, equacoes-diferenciais-ordinarias, geometria-diferencial, sistemas-dinamicos-caos]
updated: 2026-05
---

## O que é

Mecânica Lagrangiana e Hamiltoniana são reformulações da mecânica newtoniana que revelam sua estrutura geométrica profunda. Onde Newton descreve forças e acelerações em coordenadas cartesianas, Lagrange e Hamilton perguntam: "qual é a geometria do espaço de estados? Quais grandezas são conservadas? Que simetrias o sistema possui?"

A **Mecânica Lagrangiana** (Lagrange, 1788) reformula a segunda lei de Newton via o **princípio da mínima ação**: de todos os caminhos possíveis entre dois estados, o sistema segue aquele que extremiza a ação S = ∫ L dt, onde L = T - V é a Lagrangiana (energia cinética menos energia potencial). A equação de Euler-Lagrange, derivada da condição de extremo, é equivalente à segunda lei de Newton mas é válida em qualquer sistema de coordenadas generalizadas — uma liberdade crucial para problemas com vínculos.

A **Mecânica Hamiltoniana** (Hamilton, 1833) faz a transformada de Legendre sobre L, obtendo o Hamiltoniano H(q, p) = p·q̇ - L (onde p = ∂L/∂q̇ é o momento conjugado). As equações do movimento tornam-se o elegante sistema dq/dt = ∂H/∂p, dp/dt = -∂H/∂q. O espaço de fases (q, p) tem estrutura simplética, e o fluxo hamiltoniano preserva o volume nesse espaço (teorema de Liouville).

Esse formalismo, desenvolvido rigorosamente por Jacobi, Poincaré e no século XX por Arnold, é indispensável para mecânica quântica (o operador H é o Hamiltoniano quantizado), mecânica estatística, teoria de campos e geometria simplética.

## Por que estuda

Para o matemático, mecânica hamiltoniana é o encontro da física com a geometria diferencial. O espaço de fases é uma variedade simplética; o Hamiltoniano é uma função nessa variedade; os parênteses de Poisson definem uma álgebra de Lie sobre funções suaves. A pergunta "por que certos Hamiltonianos são integráveis?" é um problema profundo de geometria (teorema de Liouville-Arnold).

Para ML/CS: o método de Monte Carlo hamiltoniano (HMC), usado em inferência bayesiana (Stan, PyMC3), simula dinâmica hamiltoniana para amostrar distribuições de alta dimensão eficientemente. Algoritmos de otimização simpléticos preservam energia e são mais estáveis para problemas de física. Neural ODEs com estrutura hamiltoniana têm melhor comportamento de longo prazo.

## Conceitos-chave

- **Espaço de configurações e coordenadas generalizadas**: o espaço de configurações Q é uma variedade diferenciável de dimensão n, com coordenadas q = (q₁, …, qₙ). Velocidades generalizadas q̇ = (q̇₁, …, q̇ₙ). Um sistema com k vínculos holonômicos em ℝ³ com N partículas tem n = 3N - k graus de liberdade. Ex: pêndulo duplo em ℝ² tem n = 2 (dois ângulos).
- **Lagrangiana e princípio da mínima ação**: L(q, q̇, t) = T(q, q̇) - V(q, t). A ação S[q] = ∫_{t₁}^{t₂} L(q(t), q̇(t), t) dt é um funcional sobre caminhos. O princípio de Hamilton: o caminho físico é aquele para o qual δS = 0 (variação nula com extremos fixos).
- **Equações de Euler-Lagrange**: condição de extremo δS = 0 implica, para cada coordenada qᵢ: d/dt(∂L/∂q̇ᵢ) - ∂L/∂qᵢ = 0. Para L = T - V com T = (1/2)mq̇² e V = V(q): mq̈ = -∂V/∂q — recupera-se a segunda lei de Newton. Mas as equações valem em qualquer sistema de coordenadas.
- **Teorema de Noether**: se L é invariante sob uma transformação a um parâmetro de coordenadas (simetria contínua), a grandeza correspondente é conservada. Invariância por translação temporal ⟹ conservação de energia. Invariância por translação espacial ⟹ conservação de momento linear. Invariância por rotação ⟹ conservação de momento angular. Noether (1915) formulou esse resultado com total generalidade.
- **Transformada de Legendre e Hamiltoniano**: momento conjugado pᵢ = ∂L/∂q̇ᵢ. Hamiltoniano H(q, p, t) = Σᵢ pᵢq̇ᵢ - L. Equações de Hamilton: q̇ᵢ = ∂H/∂pᵢ, ṗᵢ = -∂H/∂qᵢ. Para sistemas conservativos, H = T + V = energia total. As equações de Hamilton são um sistema de 2n EDOs de primeira ordem (em vez das n EDOs de segunda ordem de Lagrange).
- **Espaço de fases e estrutura simplética**: o espaço de fases é T*Q (fibrado cotangente de Q), com coordenadas (q, p). A forma simplética ω = Σᵢ dpᵢ ∧ dqᵢ é uma 2-forma fechada e não-degenerada. O fluxo hamiltoniano φ_t preserva ω (e portanto o volume — teorema de Liouville): d(φ_t*ω)/dt = 0.
- **Parênteses de Poisson**: para f, g: T*Q → ℝ, {f, g} = Σᵢ (∂f/∂qᵢ ∂g/∂pᵢ - ∂f/∂pᵢ ∂g/∂qᵢ). Os parênteses de Poisson satisfazem: antissimetria {f,g} = -{g,f}; identidade de Jacobi; regra de Leibniz. O fluxo de uma observável f é dado por ḟ = {f, H} + ∂f/∂t. Conservada ↔ {f, H} = 0 (e sem dependência explícita em t).
- **Integrabilidade e teorema de Liouville-Arnold**: um sistema hamiltoniano de n graus de liberdade é completamente integrável se tem n integrais de movimento independentes e em involução ({fᵢ, fⱼ} = 0). Nesses casos, pelo teorema de Liouville-Arnold, as superfícies de nível compactas são toros de dimensão n, e o movimento é quase-periódico (variáveis de ação-ângulo).

## Confusões comuns

**"Lagrangiana e Hamiltoniana são apenas reformulações sem vantagem real"**: São formulações equivalentes para mecânica clássica, mas cada uma é superior em contextos distintos. Lagrangiana é mais natural para sistemas com vínculos e para formulação de teoria de campos (densidade Lagrangiana). Hamiltoniana é mais natural para mecânica estatística, mecânica quântica e estudo de simetrias via parênteses de Poisson.

**"O princípio da mínima ação diz que a natureza é preguiçosa"**: Primeiro, é princípio do extremo (pode ser mínimo, máximo ou ponto de sela da ação). Segundo, não é uma lei teleológica (fins causando meios) — é matematicamente equivalente às equações locais de movimento. A interpretação "a natureza minimiza algo" é metáfora pedagógica, não física.

**"Momento conjugado é sempre momento linear"**: pᵢ = ∂L/∂q̇ᵢ é o momento conjugado à coordenada qᵢ. Se qᵢ é um ângulo, pᵢ é momento angular. Se qᵢ é uma coordenada de campo (em teoria de campos), pᵢ é o momento canônico do campo — que pode diferir do momento cinético em presença de campo magnético (p_canônico = mv + eA).

**"Parênteses de Poisson são produto comutativo"**: {f, g} = -{g, f}, portanto {f, g} = 0 não é sempre verdade. A álgebra de observáveis com parênteses de Poisson é uma álgebra de Lie — antissimétrica. A quantização canônica substitui {f, g} ↦ (1/iℏ)[f̂, ĝ], e o comutador [q̂, p̂] = iℏ é o análogo quântico de {q, p} = 1.

## Aplicação em CS/Dev/ML

**Hamiltonian Monte Carlo (HMC)**: algoritmo de amostragem MCMC que simula dinâmica hamiltoniana para explorar distribuições de alta dimensão. Introduz "momentos" auxiliares p, e simula o sistema hamiltoniano H(q, p) = -log π(q) + (1/2)p²M⁻¹p. A integração simplética (leapfrog) preserva a estrutura hamiltoniana e produz amostras eficientes. Usado em Stan, PyMC3, NumPyro.

**Neural ODEs com estrutura hamiltoniana**: Hamiltonian Neural Networks (Greydanus et al., 2019) aprendem o Hamiltoniano de um sistema físico diretamente dos dados, garantindo conservação de energia por construção. Symplectic Neural Networks preservam a estrutura simplética durante integração.

**Integração simplética**: integradores como Verlet, leapfrog (Störmer-Verlet) preservam exatamente a estrutura simplética do fluxo hamiltoniano, garantindo estabilidade de longo prazo (sem drift de energia). Usados em simulações moleculares, astrofísica, gráficos de computação (animação de fluidos).

**Otimização com momentum**: o método de momento (gradient descent com momentum) tem estrutura hamiltoniana aproximada. BFGS e L-BFGS podem ser vistos como integradores de sistemas pseudo-hamiltonianos. Entender a estrutura ajuda a analisar convergência.

## Como praticar

- **Livro base**: Goldstein, Poole, Safko — *Classical Mechanics* (3a ed.) — referência clássica, densa e completa. Para perspectiva matemática moderna: Arnold — *Mathematical Methods of Classical Mechanics* (Springer) — geometria diferencial aplicada à mecânica, indispensável.
- **Derivar as equações de movimento para sistemas clássicos**: pêndulo simples, pêndulo duplo, partícula em campo magnético, rotor rígido. Fazer o caminho completo: escolher coordenadas generalizadas → escrever T e V → escrever L → aplicar Euler-Lagrange → interpretar.
- **Verificar o teorema de Noether**: para cada simetria de um sistema concreto, identificar a carga conservada usando a fórmula J = ∂L/∂q̇ · δq - H·δt.
- **Python / Julia**: implementar integração de Verlet para o pêndulo duplo. Verificar que energia total H = T + V se conserva (ou deriva lentamente, mostrando a importância de integradores simpléticos vs. Euler).

## Exercícios práticos

1. **[Rank E]** Para um pêndulo simples de massa m e comprimento l em campo gravitacional g, escreva a Lagrangiana em coordenadas polares L(θ, θ̇) = T - V. Derive as equações de Euler-Lagrange e verifique que recupera mgl sin θ = ml²θ̈ (segunda lei de Newton em rotação). *Dica: T = (1/2)ml²θ̇², V = -mgl cos θ; aplique d/dt(∂L/∂θ̇) - ∂L/∂θ = 0.*

2. **[Rank D]** Para uma partícula de massa m em potencial central V(r) (depende apenas da distância à origem), calcule o momento angular L = r × p e use o teorema de Noether para mostrar que L é conservado pela simetria de rotação do Lagrangiano. *Dica: invariância por rotação em torno do eixo z implica δθ = δε, com coordenada φ; identifique a carga de Noether J = ∂L/∂φ̇.*

3. **[Rank C]** Faça a transformada de Legendre do Lagrangiano L = (1/2)m(q̇₁² + q̇₂²) - V(q₁, q₂): calcule os momentos conjugados p₁ = ∂L/∂q̇₁, p₂ = ∂L/∂q̇₂; construa H(q₁, q₂, p₁, p₂); escreva as equações de Hamilton. Verifique que são equivalentes às equações de Euler-Lagrange. *Dica: H = p₁q̇₁ + p₂q̇₂ - L; expresse q̇ᵢ em termos de pᵢ usando pᵢ = mq̇ᵢ.*

4. **[Rank B]** Calcule o parêntese de Poisson {L_z, H} para uma partícula num potencial central V(r), onde L_z = xp_y - yp_x e H = (p_x² + p_y² + p_z²)/(2m) + V(r). Mostre que {L_z, H} = 0, confirmando a conservação do momento angular por via hamiltoniana. *Dica: use {qᵢ, pⱼ} = δᵢⱼ, {qᵢ, qⱼ} = 0, {pᵢ, pⱼ} = 0 e a regra de Leibniz do parêntese de Poisson.*

5. **[Rank A] [BOSS]** Enuncie e prove o teorema de Liouville: o volume no espaço de fases é preservado pelo fluxo hamiltoniano. Formalmente: se Ω(t) = ∫_{Γ(t)} d^nq d^np é o volume de uma região Γ que evolui segundo as equações de Hamilton, então dΩ/dt = 0. *Dica: use o teorema da divergência e compute a divergência do campo vetorial hamiltoniano X_H = (∂H/∂p, -∂H/∂q): div(X_H) = Σᵢ[∂²H/∂qᵢ∂pᵢ - ∂²H/∂pᵢ∂qᵢ] = 0 por simetria das derivadas mistas. Formule também em linguagem de formas diferenciais: L_{X_H}ω^n = 0.*

## Próximos passos

- [sistemas-dinamicos-caos](sistemas-dinamicos-caos) — fluxos, pontos fixos, bifurcações e caos determinístico
- [geometria-diferencial](geometria-diferencial) — variedades simpléticas, fibrado cotangente
- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — sistemas de EDOs e análise de estabilidade
- [calculo-multivariavel](calculo-multivariavel) — cálculo variacional e derivadas funcionais
- → Pratique no /math-quest na área **Aplicada/Física** (Rank C+)
