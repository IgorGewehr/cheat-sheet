---
title: Física Teórica – Mecânica Clássica
category: matematica
stack: [Mat, Python]
tags: [fisica, calculo, aplicada]
excerpt: Mecânica newtoniana, lagrangiana e hamiltoniana — a física como geometria do espaço de configurações.
related: [calculo-vetorial-geometria-analitica, equacoes-diferenciais-ordinarias, geometria-diferencial, calculo-multivariavel]
updated: 2026-05
---

## O que é

Mecânica Clássica descreve o movimento de corpos macroscópicos e de baixa velocidade (não quânticos, não relativísticos). Existem três formulações equivalentes, cada uma com ênfase diferente:

**Mecânica Newtoniana**: F = ma. Vetorial, intuitiva, focada em forças. Base da engenharia clássica. Problemas complexos requerem decomposição cuidadosa de forças.

**Mecânica Lagrangiana**: L = T - V (cinética - potencial). Usa coordenadas generalizadas — qualquer sistema de coordenadas conveniente para o problema. As equações de Euler-Lagrange substituem F = ma. Poderosa para sistemas com restrições e para física teórica.

**Mecânica Hamiltoniana**: H = T + V (energia total). Reformula a mecânica no espaço de fase (posição + momento). Formalismo simpleticamente, base da mecânica quântica e da geometria diferencial (variedades simpléticas).

A equivalência das três formulações é profunda — são o mesmo conteúdo físico visto por lentes matemáticas diferentes. A transição Newtoniana → Lagrangiana → Hamiltoniana é uma jornada de concretude para abstração, de vetores no espaço físico para geometria no espaço de fases.

## Por que estuda

Para o matemático e físico, mecânica clássica é o playground onde EDOs, geometria diferencial, grupos de Lie e análise funcional aparecem com motivação física clara. O princípio de Hamilton (ação mínima) é uma das ideias mais elegantes da física — a trajetória real é aquela que extremiza a ação ∫L dt entre dois pontos.

Para dev/ML: física é o domínio mais rico de modelos para aprender a modelar. Simuladores físicos em jogos, robótica e design de engenharia dependem de mecânica clássica. Physics-Informed Neural Networks (PINNs) aprendem respeitando as leis da física — o que requer entendê-las. Reinforcement learning em robótica usa modelos físicos do corpo. Hamiltonians aparecem em HMC (Hamiltonian Monte Carlo), o melhor sampler de MCMC moderno.

## Conceitos-chave

- **Leis de Newton**: (1) inércia: corpo em repouso/MRU permanece assim sem força resultante; (2) F = ma (lei fundamental da dinâmica: força resultante = massa × aceleração); (3) ação-reação: para toda força exercida por A em B, B exerce força igual e oposta em A. A segunda lei é uma EDO de segunda ordem: m·x'' = F(x, x', t).
- **Trabalho, energia e potencial**: trabalho W = ∫F·dr. Energia cinética T = mv²/2. Para forças conservativas (F = -∇V), o trabalho depende só dos extremos: W = V(A) - V(B). Conservação de energia: T + V = constante quando só forças conservativas atuam. Exemplos de potencial: gravitacional V = mgh, elástico V = kx²/2.
- **Coordenadas generalizadas e graus de liberdade**: qualquer sistema de coordenadas qᵢ que descreva completamente o sistema. Pêndulo: θ é a coordenada generalizada (não x e y separadamente). Graus de liberdade = número de coordenadas independentes após restrições.
- **Equações de Euler-Lagrange**: ∂L/∂qᵢ - d/dt(∂L/∂q̇ᵢ) = 0 para cada coordenada generalizada qᵢ. Estas são as equações de movimento. L = T - V. Para pêndulo: L = (m/2)l²θ̇² + mgl·cosθ. Euler-Lagrange dá θ'' = -(g/l)sinθ.
- **Princípio de Hamilton**: a trajetória real qᵢ(t) entre qᵢ(t₁) e qᵢ(t₂) é aquela que extremiza a ação S = ∫_{t₁}^{t₂} L(q, q̇, t) dt. As equações de Euler-Lagrange são as condições de extremo. Conecta mecânica com cálculo de variações.
- **Coordenadas canônicas e formalismo hamiltoniano**: momento conjugado: pᵢ = ∂L/∂q̇ᵢ. Hamiltoniano: H(q, p, t) = Σ pᵢq̇ᵢ - L (transformada de Legendre). Equações de Hamilton: q̇ᵢ = ∂H/∂pᵢ, ṗᵢ = -∂H/∂qᵢ. Espaço de fase (q, p): evolução é fluxo hamiltoniano preservando volume (teorema de Liouville).
- **Simetrias e leis de conservação (teorema de Noether)**: cada simetria contínua do Lagrangiano corresponde a uma quantidade conservada. Translação temporal → conservação de energia. Translação espacial → conservação de momento. Rotação → conservação de momento angular. Generalização **simetrias de gauge** (Yang-Mills, eletromagnetismo de Maxwell, modelo padrão): simetrias internas locais (não apenas globais) — invariância sob transformações ϕ → e^{iα(x)}ϕ com α dependente de x — exigem introdução de campo de gauge (potencial vetor A_μ) e dão conservação de corrente associada (carga elétrica, isospin). Conexão e curvatura em fibrados principais formalizam isso em geometria diferencial. Este é o resultado mais profundo da física teórica do séc. XX — Noether (1918) precedeu mas antecipou.
- **Oscilador harmônico**: x'' + ω²x = 0 (solução: x = A·cos(ωt + φ)). Forçado: x'' + ω²x = F₀cos(Ωt). Ressonância: Ω → ω. Amortecido: x'' + 2γx' + ω²x = 0 — três casos conforme γ<ω, γ=ω, γ>ω (subamortecido, criticamente amortecido, superamortecido).

## Confusões comuns

**"F = ma é sempre válido"**: Na mecânica newtoniana clássica, sim, para referenciais inerciais e a velocidades muito menores que c. Referenciais não-inerciais introduzem forças fictícias (centrífuga, Coriolis). Para velocidades relativísticas, F = dp/dt (onde p = γmv é o momento relativístico) substitui F = ma.

**"Energia potencial é uma propriedade do corpo"**: Energia potencial é propriedade do sistema ou do campo — não do corpo individualmente. V = mgh é a energia potencial gravitacional do sistema Terra+objeto, não do objeto isolado. A divisão é convencional.

**"Lagrangiana e Hamiltoniana são só reformulações, não acrescentam nada"**: Matematicamente equivalentes mas computacionalmente e conceitualmente diferentes. Lagrangiana é melhor para impor restrições e usar coordenadas convenientes. Hamiltoniana é melhor para análise de simetrias (Noether), mecânica quântica (operadores q̂, p̂), e geometria simpléctica.

**"Ponto de equilíbrio estável é onde a força é zero"**: Ponto de equilíbrio é onde a força é zero (∇V = 0). Estabilidade depende da segunda derivada: se V tem mínimo local (∇²V > 0), é equilíbrio estável; se V tem máximo local, é instável. V''(x*) > 0 → estável; V''(x*) < 0 → instável.

**"Momento angular L e momento linear p são análogos"**: Análogos mas distintos. L = r × p é produto vetorial. Conservação de L é rotação espacial por Noether; conservação de p é translação. L é axial (pseudo-vetor), p é polar (vetor). Em 2D (ou problemas planares), L é escalar.

## Aplicação em CS/Dev/ML

**Hamiltonian Monte Carlo (HMC)**: HMC amostra de distribuições de probabilidade P(θ) ∝ exp(-U(θ)) introduzindo momento auxiliar p e definindo hamiltoniano H(θ,p) = U(θ) + K(p). Simula dinâmica hamiltoniana com leapfrog (integrador simplético) para propor estados distantes. Muito mais eficiente que Metropolis-Hastings em alta dimensão. Stan usa HMC/NUTS.

**Simulação física em jogos e robótica**: motores como Bullet, PhysX, MuJoCo implementam mecânica clássica (rígido, articulado, deformável). MuJoCo é padrão em RL de robótica (OpenAI Gym, DeepMind Control Suite). Entender mecânica permite interpretar e debugar simulações.

**Neural ODEs com estrutura física**: redes neurais que preservam energia (E-GNN, Hamiltonian Neural Networks) aprendem hamiltoniano H(q,p) da trajetória e resolvem equações de Hamilton numericamente. Generalizam melhor que redes sem estrutura física.

**Physics-Informed Neural Networks para mecânica**: PINNs treinadas com as equações de movimento de Newton ou Hamilton como restrições da loss. Úteis quando dados são escassos mas a física é conhecida.

**Gradiente simpético em otimização**: otimizadores que preservam estrutura simpética (como variantes de HMC para otimização) têm melhor comportamento em problemas de machine learning com estrutura geométrica.

## Como praticar

- **Livro base**: Halliday, Resnick & Krane — *Física* Vol. 1 (nível de engenharia, com exercícios). Para nível avançado: Goldstein, Poole & Safko — *Classical Mechanics* (referência canônica de mecânica avançada). Landau & Lifshitz — *Mechanics* (conciso e elegante, perspectiva teórica).
- **Resolver problemas com as três formulações**: o mesmo problema (pêndulo simples, massa em mola, partícula em campo gravitacional) resolvido por Newton, Lagrange e Hamilton. Confirme que dão o mesmo resultado e note quando cada formulação é mais limpa.
- **Simulação numérica**: implemente integração de Verlet (padrão em dinâmica molecular) para pêndulo simples e duplo. O pêndulo duplo é caótico — pequenas diferenças iniciais levam a trajetórias completamente diferentes.
- **SymPy para mecânica**: `from sympy.physics.mechanics import LagrangesMethod, ReferenceFrame`. SymPy tem suporte a mecânica simbólica. Derive as equações de Euler-Lagrange automaticamente para sistemas de múltiplos corpos.
- **Projeto HMC**: implemente HMC do zero em NumPy para amostrar de uma distribuição gaussiana 2D. Compare com Metropolis-Hastings na taxa de aceitação e independência das amostras. Entender por que HMC é melhor requer entender a dinâmica hamiltoniana.

## Exercícios práticos

1. **[Rank E]** Um bloco de massa m = 2 kg em uma superfície horizontal sem atrito é ligado a uma mola de constante k = 8 N/m. Em t=0, o bloco está em x₀ = 0.3 m com velocidade v₀ = 0. Encontre a posição x(t), o período T, e a energia mecânica total do sistema. *Dica: ẍ = -k/m·x = -4x. A solução é x(t) = A cos(ωt+φ) com ω = √(k/m) = 2 rad/s. Das condições iniciais: A = 0.3 m, φ = 0. T = 2π/ω = π s. E = kA²/2 = 0.36 J.*

2. **[Rank D]** Derive as equações de Euler-Lagrange para o pêndulo simples de comprimento l e massa m. Compare com as equações de Newton aplicadas diretamente (forças radial e tangencial). Use a aproximação de pequenas oscilações (sin θ ≈ θ) para obter a solução explícita. *Dica: L = (1/2)ml²θ̇² - mgl(1-cos θ). E-L: ml²θ̈ + mgl sin θ = 0. Para θ pequeno: θ̈ + (g/l)θ = 0, solução θ(t) = A cos(√(g/l)t + φ).*

3. **[Rank C]** Use o teorema trabalho-energia para calcular a velocidade final de uma partícula de massa 1 kg que parte do repouso e desce uma rampa de 5 m de altura, com atrito (coeficiente μₖ = 0.3) ao longo de uma rampa de 45°. Verifique usando a equação de Newton ao longo da rampa. *Dica: a força de atrito é μₖ N = μₖ mg cos(45°). O comprimento da rampa é 5/sin(45°). O trabalho líquido Wₗíq = mgh - μₖmg cos(45°)·(5/sin(45°)) = m[gh - μₖg·5]. Por trabalho-energia: v² = 2Wₗíq/m.*

4. **[Rank B]** Para uma partícula de massa m sob força central F = -k/r² (gravitação ou Coulomb), derive as equações de movimento em coordenadas polares e use a conservação do momento angular L = mr²θ̇ para reduzir o problema a uma EDO em r(t). Mostre que o problema se reduz ao de um "potencial efetivo" V_{ef}(r) = V(r) + L²/(2mr²). *Dica: as equações de Newton em polares: m(r̈ - rθ̇²) = F_r, m(rθ̈ + 2ṙθ̇) = 0. Da segunda: d(r²θ̇)/dt = 0, logo L = mr²θ̇ = const. Substitua θ̇ = L/(mr²) na primeira equação para obter uma EDO em r.*

5. **[Rank A] [BOSS]** Prove o teorema de Noether para mecânica lagrangiana: se o Lagrangiano L(q, q̇, t) é invariante sob a transformação a um parâmetro qᵢ ↦ qᵢ + ε·δqᵢ (no sentido de que L não muda até primeira ordem em ε), então a quantidade J = Σᵢ (∂L/∂q̇ᵢ)·δqᵢ é uma integral do movimento (dJ/dt = 0 ao longo das trajetórias). Aplique para a invariância por translação espacial (q ↦ q + ε·n̂) para deduzir a conservação do momento linear na direção n̂. *Dica: a variação de L é δL = Σᵢ[(∂L/∂qᵢ)·εδqᵢ + (∂L/∂q̇ᵢ)·εδq̇ᵢ] = 0. Usando as equações de Euler-Lagrange para substituir ∂L/∂qᵢ = d/dt(∂L/∂q̇ᵢ): δL = Σᵢ d/dt[(∂L/∂q̇ᵢ)·δqᵢ]·ε = 0. Portanto dJ/dt = 0.*

## Próximos passos

- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — as EDOs que descrevem o movimento
- [calculo-vetorial-geometria-analitica](calculo-vetorial-geometria-analitica) — vetores, forças, trabalho como integrais de linha
- [geometria-diferencial](geometria-diferencial) — espaço de configurações como variedade, formalismo de Cartan
- [probabilidade](probabilidade) — mecânica estatística e HMC
- → Pratique no /math-quest na área **Aplicada/Física** (Rank C+)
