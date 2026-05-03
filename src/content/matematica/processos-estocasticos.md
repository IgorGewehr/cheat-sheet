---
title: Processos Estocásticos
category: matematica
stack: [Mat, Python]
tags: [probabilidade, analise, aplicada]
excerpt: "Cadeias de Markov, movimento Browniano, martingales e equações de Kolmogorov — a matemática de sistemas que evoluem aleatoriamente no tempo."
related: [probabilidade, medida-integracao, equacoes-diferenciais-ordinarias, estatistica-inferencia]
updated: 2026-05
---

## O que é

Um **processo estocástico** é uma família de variáveis aleatórias {X_t}_{t∈T} indexadas por tempo T (discreto ou contínuo), definidas num espaço de probabilidade (Ω, ℱ, P). Diferentemente da probabilidade clássica (que estuda distribuições de uma v.a. por vez), processos estocásticos estudam a *trajetória* temporal de um sistema aleatório — como a posição de uma partícula em movimento, o preço de uma ação, ou o estado de uma fila.

O campo tem duas raízes: as cadeias de Markov de Markov/Kolmogorov (1906-1931) e o movimento Browniano de Einstein/Wiener (1905-1923). Unificados na teoria de Itô (1944), são hoje fundamentais em finanças, física estatística, teoria das filas, biologia e aprendizado de máquina (processos de difusão, score matching).

## Por que estuda

Para o matemático, processos estocásticos é o encontro de probabilidade, análise funcional (espaços L²), teoria de medida (filtração, mensurabilidade) e EDPs (equação de Fokker-Planck). O teorema de convergência de martingales de Doob e a construção de Itô do cálculo estocástico são dois dos resultados mais bonitos do séc. XX.

Para ML/CS: modelos de difusão generativos (DDPM, Stable Diffusion, DALL-E) são explicitamente baseados em processos estocásticos — o forward process é a equação de calor estocástica e o reverse process é uma SDE aprendida por score matching. Cadeias de Markov estão em toda amostragem MCMC (Stan, PyMC), em modelos de linguagem (n-grams são cadeias de Markov), e em reinforcement learning (MDPs são cadeias de Markov de decisão).

## Conceitos-chave

- **Cadeias de Markov (tempo discreto)**: processo {Xₙ}_{n≥0} com espaço S satisfazendo P(Xₙ₊₁=j|Xₙ=i, Xₙ₋₁,…) = pᵢⱼ (propriedade de Markov). Matriz de transição P = (pᵢⱼ): estocástica (linhas somam 1). Distribuição estacionária π: πP = π. Para cadeias irredutíveis (todo estado alcança todo estado) e aperiódicas, P^n → matriz com todas linhas = π (convergência ergódica). Estados: recorrentes (retorno garantido) vs transientes (P(retorno) < 1).
- **Cadeias de Markov (tempo contínuo — CTMC)**: {X_t}_{t≥0} com matriz geradora Q = (qᵢⱼ): qᵢⱼ ≥ 0 para i≠j (taxa de transição i→j), qᵢᵢ = -Σⱼ≠ᵢ qᵢⱼ. Equação de Kolmogorov progressiva: dP(t)/dt = P(t)Q, solução P(t) = e^{Qt}. Tempo de permanência no estado i: Exp(|qᵢᵢ|). Aplicações: processo de Poisson, filas M/M/1, SIR epidemiológico.
- **Movimento Browniano (Processo de Wiener)**: B = {B_t}_{t≥0} com: B₀ = 0 q.c.; incrementos independentes e estacionários (B_t-B_s ~ N(0,t-s) para s<t); trajetórias contínuas q.c. Trajetórias são contínuas mas **em nenhum lugar diferenciáveis** q.c. — variação total infinita. Variação quadrática [B,B]_t = t (o que possibilita a integral de Itô). Dimensão de Hausdorff das trajetórias = 3/2 q.c.
- **Filtração e adaptabilidade**: filtração (ℱ_t)_{t≥0} é sequência crescente de σ-álgebras (informação acumulada). Processo X_t é adaptado se X_t é ℱ_t-mensurável (o presente não usa informação do futuro). Processo previsível/progressivo — condições para a integral de Itô.
- **Martingales**: {M_t, ℱ_t} é martingale se E[M_t|ℱ_s] = M_s para s ≤ t. Modelo de "jogo justo" — sem tendência sistemática. Teorema de convergência de Doob: martingale limitado em L² converge q.c. e em L². Parada opcional (OST): E[M_τ] = E[M₀] para tempo de parada τ com condições de integralidade. Desigualdade maximal: P(max_{s≤t} M_s ≥ λ) ≤ E[M_t⁺]/λ. Exemplos: B_t, B_t²-t, exp(σB_t - σ²t/2) são martingales.
- **Integral de Itô e fórmula de Itô**: ∫₀ᵀ H_s dB_s definida para H adaptado via limite de somas com avaliação no extremo esquerdo (distingue Itô de Stratonovich). Fórmula de Itô: df(X_t) = f'(X_t)dX_t + ½f''(X_t)d[X,X]_t. Para X_t = B_t: d(B_t²) = 2B_t dB_t + dt (o "dt" extra é a correção de Itô — ausente no cálculo clássico). Regra da cadeia estocástica.
- **Equações Diferenciais Estocásticas (EDEs)**: dX_t = μ(X_t,t)dt + σ(X_t,t)dB_t. Sob Lipschitz em μ e σ, existe solução forte única. Exemplos: Black-Scholes (dS = μS dt + σS dB), Ornstein-Uhlenbeck (dX = -θX dt + σ dB), CIR (para taxas de juros). Equação de Fokker-Planck (dual da EDE): ∂p/∂t = -∂_x[μp] + ½∂²_x[σ²p] descreve a evolução da densidade.
- **Processo de Poisson e renovação**: N_t ~ Poisson(λt), incrementos independentes e estacionários, tempo entre eventos Exp(λ). Único processo de contagem com esses incrementos. Processos de renovação generalizam: tempos entre eventos i.i.d. Teorema de renovação de Blackwell: taxa de renovações converge para 1/μ onde μ é o tempo médio entre eventos.

## Confusões comuns

**"Martingale é um processo sem tendência — logo converge para constante"**: Não. Martingale sem tendência local não implica convergência. O passeio aleatório simétrico é martingale mas diverge (oscila com amplitude √n). Para garantir convergência, precisa-se de limitação em L¹ (Doob: L² limitado converge q.c.) — e o fato de ser martingale é necessário mas não suficiente.

**"Integral de Itô e integral de Riemann-Stieltjes são a mesma coisa"**: Diferem fundamentalmente. Na integral de Riemann-Stieltjes, o integrando é avaliado em qualquer ponto do subintervalo — para B_t, a variação total infinita torna isso problemático. Itô avalia no extremo esquerdo, produzindo integrais que são martingales. Stratonovich avalia no ponto médio, preservando a regra da cadeia clássica mas perdendo a propriedade de martingale.

**"Fórmula de Itô é apenas a regra da cadeia estocástica"**: A fórmula de Itô df(B_t) = f'(B_t)dB_t + ½f''(B_t)dt difere da regra da cadeia clássica pelo segundo termo "½f''dt". Esse termo extra vem da variação quadrática [B,B]_t = t, que não existe no cálculo determinístico (onde [x,x]_t = 0 para funções BV). É a essência do cálculo estocástico.

**"Cadeias de Markov em tempo contínuo têm estado constante entre transições"**: Não exatamente — o processo é contínuo à direita (càdlàg). Mas a essência é correta: o processo permanece no estado i por um tempo Exp(|qᵢᵢ|), então salta para j com probabilidade |qᵢⱼ|/|qᵢᵢ|. O salto é instantâneo; o estado entre saltos é constante.

**"Todo processo estocástico é uma cadeia de Markov"**: Não. Processos com dependência de toda a história (como modelos ARMA com memória longa, processos com dependência de caminhos completos) não são Markovianos. A propriedade de Markov é a restrição de que o futuro depende apenas do estado presente, não da história.

## Aplicação em CS/Dev/ML

**Modelos de difusão generativos**: DDPM e variantes definem um forward process X_t = √(1-t)x₀ + √t ε (ou EDE equivalente dX_t = -X_t/2 dt + dB_t) que lentamente injeta ruído. O reverse process é outra EDE aprendida via score matching: dX_t = [score(X_t,t) + ½X_t] dt + dB_t. Toda a teoria de SDEs — existência, reversão temporal de Anderson, equação de Fokker-Planck — fundamenta esta arquitetura.

**MCMC (Markov Chain Monte Carlo)**: Metropolis-Hastings, HMC, NUTS, Gibbs — todos geram cadeias de Markov cuja distribuição estacionária é o posterior P(θ|dados). A análise de convergência (mixing time, tempo de burn-in) é teoria de cadeias de Markov. Stan e PyMC3 usam HMC com NUTS por padrão.

**Modelos de linguagem n-gram**: modelo bigram P(w_t|w_{t-1}) é cadeia de Markov de primeira ordem. Embora LLMs modernos não sejam Markovianos (atenção acessa todo o contexto), a perspectiva de cadeias de Markov é o ponto de partida histórico e pedagógico.

**Finanças quantitativas**: movimento Browniano geométrico dS = μS dt + σS dB é o modelo de Black-Scholes para preços de ações. A fórmula de precificação de opções de Black-Scholes é derivada via fórmula de Itô + argumento de não-arbitragem. Processos de Ornstein-Uhlenbeck modelam taxas de juros (Vasicek).

**Python**: `numpy.random.normal` para simular passeios aleatórios. `scipy.stats` para distribuições. PyTorch tem suporte nativo a processos de difusão. `pomegranate` para cadeias de Markov (HMM, GMM). Para processos de Poisson: `numpy.random.poisson`.

## Como praticar

- **Livro base**: Ross — *Introduction to Probability Models* (cadeias de Markov e Poisson, acessível). Para movimento Browniano e Itô: Øksendal — *Stochastic Differential Equations* (6a ed., standard internacional). Para nível rigoroso: Revuz & Yor — *Continuous Martingales and Brownian Motion*.
- **Simular cadeias de Markov**: implemente a simulação de uma cadeia de Markov irredutível de 4 estados. Observe a convergência da distribuição empírica para a estacionária π. Varie o número de passos e observe a taxa de mistura.
- **Movimento Browniano por discretização**: simule uma trajetória de B_t em [0,1] com 10000 pontos usando incrementos N(0, Δt). Verifique a variação quadrática numericamente e confirme que cresce linearmente com t.
- **EDE Ornstein-Uhlenbeck**: simule dX_t = -θX_t dt + σ dB_t com o esquema de Euler-Maruyama. Visualize a trajetória e compare com a solução analítica X_t = X₀ e^{-θt} + σ∫₀ᵗ e^{-θ(t-s)} dB_s.
- **Projeto DDPM**: implemente um modelo de difusão simples (DDPM 1D) para aprender a distribuição de uma mistura gaussiana. Implemente forward process, treinamento de score network, e reverse sampling. Use PyTorch.

## Exercícios práticos

1. **[Rank E]** Para a cadeia de Markov de 2 estados {0,1} com P = [[0.7, 0.3], [0.4, 0.6]], calcule: (a) P² e P³; (b) a distribuição estacionária π = (π₀, π₁) resolvendo πP = π e π₀+π₁ = 1; (c) a probabilidade de estar no estado 1 após 100 passos partindo do estado 0. *Dica: πP = π dá π₀·0.7 + π₁·0.4 = π₀ e π₀·0.3 + π₁·0.6 = π₁. Com π₀+π₁=1: π₀ = 4/7, π₁ = 3/7. Para 100 passos, P^{100} ≈ [[4/7, 3/7],[4/7, 3/7]] pela convergência ergódica.*

2. **[Rank D]** Prove que B_t² - t é martingale em relação à filtração natural de B_t. Use a definição: mostre que E[B_t² - t | ℱ_s] = B_s² - s para s ≤ t. *Dica: B_t = B_s + (B_t - B_s). Expanda: B_t² = B_s² + 2B_s(B_t-B_s) + (B_t-B_s)². Tome esperança condicional: E[B_t²|ℱ_s] = B_s² + 2B_s·0 + (t-s) = B_s² + (t-s). Portanto E[B_t²-t|ℱ_s] = B_s²+(t-s)-t = B_s²-s.*

3. **[Rank C]** Aplique a fórmula de Itô para calcular d(B_t³). Expresse o resultado em termos de dB_t e dt. Em seguida, use a fórmula para calcular E[B_t³] e verificar que é zero (simetria do Browniano). *Dica: tome f(x) = x³: f'(x) = 3x², f''(x) = 6x. Fórmula de Itô: d(B_t³) = 3B_t²dB_t + ½·6B_t·dt = 3B_t²dB_t + 3B_t dt. Integrando: B_t³ = 3∫₀ᵗB_s²dB_s + 3∫₀ᵗB_s ds. Tomando E[·]: E[B_t³] = 0 + 3E[∫₀ᵗB_s ds] = 3∫₀ᵗE[B_s]ds = 0.*

4. **[Rank B]** Resolva a EDE linear dX_t = aX_t dt + σ dB_t (X₀ = x₀) usando a fórmula de variação dos parâmetros: tente X_t = e^{at}Z_t e derive a EDE para Z_t. Mostre que a solução é X_t = x₀e^{at} + σ∫₀ᵗ e^{a(t-s)} dB_s e calcule E[X_t] e Var(X_t). *Dica: d(e^{-at}X_t) = e^{-at}dX_t - ae^{-at}X_t dt = σe^{-at}dB_t (usando fórmula de Itô). Integrando: e^{-at}X_t = x₀ + σ∫₀ᵗe^{-as}dB_s. E[X_t] = x₀e^{at}; Var(X_t) = σ²∫₀ᵗe^{2a(t-s)}ds = σ²(e^{2at}-1)/(2a).*

5. **[Rank A] [BOSS]** Prove o teorema de convergência de martingales de Doob: toda martingale {Mₙ} limitada em L² (sup_n E[Mₙ²] < ∞) converge q.c. e em L² para uma variável aleatória M∞ com E[Mₙ] = E[M∞]. Use o argumento de upcrossings: defina U_n(a,b) como o número de upcrossings de [a,b] por M₁,…,Mₙ e prove a desigualdade de upcrossings de Doob: (b-a)E[U_n(a,b)] ≤ E[(Mₙ-a)⁺]. Conclua que U_∞(a,b) < ∞ q.c. para todo par racional (a,b), o que implica convergência q.c. *Dica: por E[Mₙ²] ≤ C, a sequência é limitada em L², portanto {Mₙ} é equiintegrable. U_n(a,b) ≤ (Mₙ-a)⁺/(b-a) com desigualdade de upcrossings — tome n → ∞. Convergência q.c. segue de: o limite existe sse U_∞(a,b) < ∞ para todo (a,b) racional, que tem probabilidade 1 pois E[U_∞] < ∞.*

## Próximos passos

- [probabilidade](probabilidade) — variáveis aleatórias, distribuições, lei dos grandes números
- [medida-integracao](medida-integracao) — σ-álgebras, filtração, integral de Lebesgue
- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — EDOs como casos determinísticos das EDEs
- [estatistica-inferencia](estatistica-inferencia) — MCMC usa cadeias de Markov para amostrar posteriors
- → Pratique no /math-quest na área **Probabilidade/Estatística** (Rank B+)
