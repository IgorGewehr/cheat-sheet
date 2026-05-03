---
title: Processos Estocásticos
category: matematica
stack: [Mat]
tags: [probabilidade, analise, aplicada]
excerpt: "Cadeias de Markov, movimento Browniano, martingales e equações de Kolmogorov — a matemática de sistemas que evoluem aleatoriamente no tempo."
related: [probabilidade, medida-integracao, equacoes-diferenciais-ordinarias, estatistica-inferencia]
updated: "2026-05"
---

## O que é

Um **processo estocástico** é uma família de variáveis aleatórias {X_t}_{t∈T} indexadas por tempo T (discreto ou contínuo), definidas num espaço de probabilidade (Ω, ℱ, P). Diferentemente da probabilidade clássica (que estuda distribuições de uma v.a. por vez), processos estocásticos estudam a *trajetória* temporal de um sistema aleatório — como a posição de uma partícula em movimento, o preço de uma ação, ou o estado de uma fila.

O campo tem duas raízes: as cadeias de Markov de Markov/Kolmogorov (1906-1931) e o movimento Browniano de Einstein/Wiener (1905-1923). Unificados na teoria de Itô (1944), são hoje fundamentais em finanças, física estatística, teoria das filas, biologia e aprendizado de máquina (processos de difusão, score matching).

## Cadeias de Markov (Tempo Discreto)

Uma **cadeia de Markov** é um processo {Xₙ}_{n≥0} com espaço de estados S (finito ou contável) satisfazendo a **propriedade de Markov**: P(Xₙ₊₁ = j | Xₙ = i, Xₙ₋₁, ..., X₀) = P(Xₙ₊₁ = j | Xₙ = i) = pᵢⱼ

A matriz P = (pᵢⱼ) é a **matriz de transição** (estocástica: linhas somam 1, entradas ≥ 0). O comportamento de longo prazo é governado por P^n quando n → ∞.

**Distribuição estacionária:** π é estacionária se πP = π. Para cadeias irredutíveis (todo estado alcança todo estado) e aperiódicas, P^n → matriz com todas as linhas iguais a π (convergência ergódica).

**Classificação de estados:** estados recorrentes (retorno garantido) vs transientes (probabilidade de retorno < 1). Cadeias irredutíveis finitas são sempre recorrentes positivas e têm π única.

**Exemplos:** passeio aleatório em ℤ (p=1/2: recorrente, p≠1/2: transiente), cadeia de nascimento-morte, modelo de Ehrenfest.

## Cadeias de Markov (Tempo Contínuo)

Uma **CTMC** (Continuous-Time Markov Chain) {X_t}_{t≥0} tem a propriedade de Markov contínua e transições descritas pela **matriz geradora** Q = (qᵢⱼ) onde qᵢⱼ ≥ 0 para i≠j é a taxa de transição i→j, e qᵢᵢ = -Σⱼ≠ᵢ qᵢⱼ.

A **equação de Kolmogorov progressiva:** dP(t)/dt = P(t)Q. Solução: P(t) = e^{Qt}.

O tempo de permanência no estado i é exponencial com parâmetro |qᵢᵢ|. Esta propriedade "sem memória" da exponencial é o análogo contínuo da propriedade de Markov.

**Aplicações:** Processo de Poisson (qᵢ,ᵢ₊₁ = λ, qᵢ,ᵢ₋₁ = 0), filas M/M/1, modelos epidemiológicos SIR.

## Movimento Browniano (Processo de Wiener)

O **Movimento Browniano padrão** B = {B_t}_{t≥0} é o processo estocástico com:
1. B₀ = 0 q.c.
2. Incrementos independentes: para 0 ≤ s < t, B_t - B_s é independente de ℱ_s = σ(B_r : r ≤ s)
3. Incrementos estacionários: B_t - B_s ~ N(0, t-s)
4. Trajetórias contínuas q.c.

**Propriedades notáveis:**
- Trajetórias contínuas mas **em nenhum lugar diferenciáveis** q.c.
- Variação quadrática: Σ|B_{tₖ} - B_{tₖ₋₁}|² → t (variação total é ∞ — não é BV)
- Dimensão de Hausdorff das trajetórias = 3/2 (a.s.)
- Propriedade de Markov forte, reflexão, simetria

**Construção:** via séries de Fourier aleatórias (construção de Lévy), processo de Wiener como espaço de trajetórias com medida gaussiana, ou limite de escala de passeios aleatórios (TCL funcional).

## Martingales

Uma sequência {Mₙ, ℱₙ} é uma **martingale** se Mₙ é ℱₙ-mensurável, E[|Mₙ|] < ∞, e E[Mₙ₊₁ | ℱₙ] = Mₙ (o valor esperado no futuro condicionado ao presente é o valor atual — um modelo de "jogo justo").

**Teoremas fundamentais:**
- **Convergência (Doob):** Martingales L²-limitadas convergem q.c. e em L².
- **Parada opcional (OST):** Se τ é tempo de parada e condições de integralidade valem, E[Mτ] = E[M₀].
- **Desigualdade maximal de Doob:** P(max_{k≤n} Mₖ ≥ λ) ≤ E[Mₙ]/λ.

**Exemplos:** B_t é martingale, B_t² - t é martingale, exp(σB_t - σ²t/2) é martingale (exponencial de Doléans-Dade).

## Cálculo de Itô e EDEs

A **integral de Itô** ∫₀ᵀ H_s dB_s é definida para processos H adaptados à filtração do Browniano, via limite de somas de Riemann-Stieltjes com avaliação no **extremo esquerdo** (não no ponto médio — isto distingue Itô de Stratonovich).

**Fórmula de Itô:** Para f ∈ C² e X_t solução de uma EDE:
df(X_t) = f'(X_t)dX_t + ½f''(X_t)d[X,X]_t

onde [X,X]_t é a variação quadrática. Para X_t = B_t: d(B_t²) = 2B_t dB_t + dt (o termo extra "dt" é a correção de Itô).

**EDEs (Equações Diferenciais Estocásticas):**
dX_t = μ(X_t, t)dt + σ(X_t, t)dB_t

com condição inicial X₀. Sob condições de Lipschitz em μ e σ, existe solução forte única.

**Equação de Fokker-Planck:** A densidade de probabilidade p(x,t) de X_t satisfaz ∂p/∂t = -∂/∂x[μp] + ½∂²/∂x²[σ²p] — a EDP dual da EDE.

## Processos de Poisson e Renovação

O **processo de Poisson** N = {N_t}_{t≥0} com taxa λ conta eventos: N_t ~ Poisson(λt), incrementos independentes e estacionários. É o único processo de contagem com incrementos i.i.d. e trajetórias càdlàg (contínuas à direita com limite à esquerda).

**Processos de renovação** generalizam: tempos entre eventos são i.i.d. (não necessariamente exponenciais). O **teorema de renovação de Blackwell** estabelece que o número esperado de renovações em [t, t+h] converge para h/μ onde μ é o tempo médio entre eventos.

## Aplicações

- **Finanças (Black-Scholes):** dS = μS dt + σS dB (movimento Browniano geométrico); fórmula de Black-Scholes via fórmula de Itô
- **Física:** equação de Langevin para partícula browniana; modelos de spin (Ising, Glauber)
- **ML (Diffusion Models):** score matching usa o processo de Ornstein-Uhlenbeck dX = -X dt + √2 dB para gerar dados via inversão de tempo
- **Controle estocástico:** equação de Hamilton-Jacobi-Bellman para otimização sob incerteza
