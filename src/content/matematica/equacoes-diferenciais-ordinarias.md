---
title: Equações Diferenciais Ordinárias (EDO)
category: matematica
stack: [Mat, Python]
tags: [calculo, aplicada, fisica]
excerpt: Equações que relacionam funções e suas derivadas — base de toda modelagem dinâmica.
related: [calculo-1-variavel, calculo-multivariavel, equacoes-diferenciais-parciais, modelagem-matematica, fisica-mecanica-classica]
updated: 2026-05
---

## O que é

Uma equação diferencial ordinária (EDO) é uma equação que envolve uma função desconhecida y(t) e suas derivadas y', y'', …, y⁽ⁿ⁾. "Ordinária" distingue de EDP (equações com derivadas parciais). Resolver uma EDO significa encontrar a(s) função(ões) y(t) que satisfazem a equação.

EDOs descrevem como sistemas mudam ao longo do tempo. Qualquer lei física que relacione taxas de variação (velocidade, aceleração, fluxo, crescimento) gera uma EDO. Newton formulou a mecânica clássica como EDOs. Kirchhoff formulou circuitos como EDOs. Malthus modelou crescimento populacional com EDO. A proliferação de EDOs na ciência não é coincidência — é a linguagem natural de qualquer sistema dinâmico.

A teoria de EDOs cobre: existência e unicidade de soluções (teorema de Picard-Lindelöf), classes especiais com solução analítica (variáveis separáveis, lineares de 1ª ordem, lineares de 2ª ordem com coeficientes constantes), séries de potências para casos sem solução em forma fechada, e teoria qualitativa (estabilidade, pontos de equilíbrio, diagramas de fase).

## Por que estuda

EDOs são a ponte entre matemática abstrata e ciência aplicada. Qualquer fenômeno que evolui continuamente no tempo — e isso inclui treinamento de redes neurais, dinâmica de mercados, propagação de epidemias, circuitos eletrônicos — pode ser modelado por EDO.

Para dev/ML: redes neurais ordinárias diferenciadas (Neural ODEs) tratam o residual de uma ResNet como uma EDO e o solucionam com solver numérico. Processos de difusão (modelos de difusão generativos — Stable Diffusion, DALL-E) são definidos via equações de estocásticas que são EDOs com ruído. Controle de sistemas (RL contínuo) usa equações de Pontryagin que são EDOs no espaço de estado e co-estado.

## Conceitos-chave

- **Ordem e linearidade**: ordem é a maior derivada que aparece. Linear: y aparece linearmente (sem y², sin(y), etc.). Linear de 1ª ordem: y' + p(t)y = q(t). Linear de 2ª ordem: y'' + p(t)y' + q(t)y = r(t).
- **Solução geral e particular**: EDO de ordem n tem solução geral com n constantes arbitrárias. Condições iniciais y(t₀) = y₀, y'(t₀) = v₀ determinam a solução particular (PVI — problema de valor inicial).
- **Separáveis**: dy/dx = f(x)g(y) → ∫dy/g(y) = ∫f(x)dx. Ex: y' = ky → y = Ce^{kt} (crescimento/decaimento exponencial, modelo mais fundamental).
- **Lineares de 1ª ordem**: y' + p(t)y = q(t). Solução via fator integrante μ(t) = e^{∫p dt}: d(μy)/dt = μq(t). Integrar ambos os lados.
- **Lineares de 2ª ordem com coeficientes constantes**: ay'' + by' + cy = 0. Ansatz y = e^{rt}. Equação característica: ar² + br + c = 0. Três casos: raízes reais distintas (r₁ ≠ r₂: y = C₁e^{r₁t} + C₂e^{r₂t}), raiz real dupla (r₁ = r₂: y = (C₁ + C₂t)e^{rt}), raízes complexas conjugadas (r = α ± iβ: y = e^{αt}(C₁cos βt + C₂sen βt)).
- **Método de variação dos parâmetros**: para y'' + py' + qy = r(t) não-homogênea, a solução particular é y_p = u₁(t)y₁ + u₂(t)y₂ onde y₁, y₂ são soluções da homogênea e u₁, u₂ satisfazem um sistema linear envolvendo o Wronskiano.
- **Wronskiano**: W(y₁, y₂)(t) = y₁y₂' - y₁'y₂. W ≠ 0 ↔ y₁, y₂ são linearmente independentes (formam base do espaço de soluções da homogênea).
- **Sistemas de EDOs e espaço de fase**: x' = Ax (sistema linear). Solução via autovalores/autovetores de A. Diagrama de fase: trajetórias no espaço (x, y). Pontos de equilíbrio e sua estabilidade dependem do sinal da parte real dos autovalores de A.

## Confusões comuns

**"Uma EDO tem sempre solução única"**: Apenas com condições de Lipschitz no teorema de Picard-Lindelöf. A equação y' = y^{1/2} com y(0) = 0 tem múltiplas soluções: y ≡ 0 e y = t²/4. A unicidade depende da regularidade do lado direito.

**"A solução geral tem sempre n constantes de integração onde n é a ordem"**: Para EDOs lineares de ordem n, sim. Para EDOs não-lineares, a estrutura pode ser mais complexa (soluções singulares que não vêm da solução geral parametrizada).

**"Método de separação de variáveis funciona para qualquer EDO"**: Só para EDOs separáveis, ou seja, onde o lado direito fatoriza como f(x)g(y). A maioria das EDOs importantes não é separável.

**"Raízes complexas da equação característica indicam instabilidade"**: Raízes complexas α ± iβ geram soluções oscilatórias e^{αt}cos(βt). A estabilidade depende de α (parte real): α < 0 → estável (oscilações amortecidas); α = 0 → neutro (oscilações puras); α > 0 → instável (oscilações crescentes).

**"Solver numérico (scipy.integrate.odeint) sempre dá a solução certa"**: Solvers numéricos têm erros de discretização e podem falhar com EDOs rígidas (stiff). Para EDOs rígidas, precisa-se de solvers implícitos (Radau, BDF). Erro de truncamento e estabilidade numérica são questões distintas de existência matemática da solução.

## Aplicação em CS/Dev/ML

**Neural ODEs**: Chen et al. (2018) propõem tratar a forward pass de uma ResNet profunda como solução de dz/dt = f(z(t), t, θ). O backward pass usa o método adjunto (que é outra EDO no adjunto) para calcular gradientes sem armazenar as ativações intermediárias. Memory-efficient, teoricamente sólido.

**Modelos de difusão (Score-based / DDPM)**: o processo de difusão progressiva e o processo reverso (de denoising) são equações diferenciais estocásticas (SDEs) do tipo dx = f(x,t)dt + g(t)dW. A equação de fluxo probabilístico associada é uma EDO determinística (probabilidade flow ODE).

**Controle ótimo e Pontryagin**: em reinforcement learning contínuo, a política ótima satisfaz condições de Pontryagin — um sistema de EDOs no estado e no co-estado (adjunto). Relaciona-se com HJB (Hamilton-Jacobi-Bellman), que é uma EDP.

**Filtro de Kalman**: modelagem de sistema dinâmico como equação de estado linear: x_{k+1} = Ax_k + Bu_k + w_k. A versão contínua é a equação de Riccati — uma EDO matricial. O filtro de Kalman estendido (EKF) lineariza EDOs não-lineares ao longo da trajetória estimada.

**SciPy para EDOs**: `scipy.integrate.solve_ivp(f, [t0, tf], y0, method='RK45')`. Para EDOs rígidas: `method='Radau'` ou `method='BDF'`. `scipy.integrate.odeint` é a interface legada (Fortran LSODE).

## Como praticar

- **Livro base**: Boyce & DiPrima — *Equações Diferenciais Elementares* (clássico, traduzido). Zill — *Equações Diferenciais* (mais acessível). Para teoria: Coddington & Levinson — *Theory of Ordinary Differential Equations*.
- **Resolver 30 EDOs à mão**: inclua separáveis, lineares de 1ª ordem, todas as cases de 2ª ordem com coeficientes constantes, e algumas via variação de parâmetros. Velocidade aqui é necessária para EDPs.
- **Diagramas de fase**: para sistemas 2D x' = f(x,y), y' = g(x,y), encontre equilíbrios, calcule a jacobiana em cada equilíbrio, classifique (nó, foco, sela, centro). Plote com matplotlib streamplot.
- **SymPy**: `from sympy import *; f = Function('f'); t = symbols('t'); dsolve(f(t).diff(t) - 2*f(t), f(t))`.
- **Projeto Neural ODE**: use a biblioteca `torchdiffeq` (PyTorch) para implementar um Neural ODE simples num problema de classificação. Compare com ResNet rasa equivalente. Meça memória e velocidade.

## Exercícios práticos

1. **[Rank E]** Resolva a EDO separável dy/dx = xy com condição inicial y(0) = 1. Encontre a solução explícita, verifique que satisfaz a EDO e determine o comportamento de y para x → ∞. *Dica: separe variáveis: dy/y = x dx. Integre ambos os lados: ln|y| = x²/2 + C. Condição inicial y(0) = 1: C = 0. Solução: y = e^{x²/2}.*

2. **[Rank D]** Resolva a EDO linear de segunda ordem y'' - 5y' + 6y = 0. Encontre a equação característica, suas raízes, e a solução geral. Aplique as condições iniciais y(0) = 1, y'(0) = 0. *Dica: equação característica r² - 5r + 6 = (r-2)(r-3) = 0, raízes r₁ = 2, r₂ = 3. Solução geral: y = C₁e^{2x} + C₂e^{3x}. Das condições: C₁+C₂ = 1 e 2C₁+3C₂ = 0, logo C₁ = 3, C₂ = -2.*

3. **[Rank C]** Resolva o sistema de EDOs x' = 3x - 2y, y' = 2x - 2y usando o método de autovalores e autovetores. Identifique o tipo de equilíbrio na origem e esboce o diagrama de fase. *Dica: matrix A = [[3,-2],[2,-2]]. det(A-λI) = λ²-λ-2 = (λ-2)(λ+1) = 0. Autovalores λ₁ = 2, λ₂ = -1. Calcule os autovetores correspondentes. O equilíbrio é uma sela (autovalores de sinais opostos).*

4. **[Rank B]** Resolva a EDO de segunda ordem não-homogênea y'' + 4y = sin(2x) (ressonância). Note que a frequência da força (2) coincide com a frequência natural (2). Encontre a solução particular e discuta o crescimento ilimitado da amplitude. *Dica: como sin(2x) está na solução homogênea (r = ±2i), use o método dos coeficientes indeterminados com tentativa y_p = x(A sin(2x) + B cos(2x)). Substitua e determine A e B. A presença do fator x indica crescimento linear da amplitude — ressonância.*

5. **[Rank A] [BOSS]** Prove o teorema de existência e unicidade de Picard-Lindelöf: se f(t, y) é contínua e Lipschitz em y (|f(t,y₁) - f(t,y₂)| ≤ L|y₁-y₂|) numa região aberta contendo (t₀, y₀), então o PVI y' = f(t,y), y(t₀) = y₀ tem solução única numa vizinhança de t₀. *Dica: escreva o PVI como equação integral y(t) = y₀ + ∫_{t₀}^t f(s, y(s)) ds. Defina o operador T[y](t) = y₀ + ∫_{t₀}^t f(s, y(s)) ds. Mostre que T é uma contração no espaço C([t₀-δ, t₀+δ]) com a norma sup (para δ suficientemente pequeno, Lδ < 1). Aplique o teorema de ponto fixo de Banach.*

## Próximos passos

- [equacoes-diferenciais-parciais](equacoes-diferenciais-parciais) — extensão para funções de múltiplas variáveis
- [modelagem-matematica](modelagem-matematica) — como construir modelos em EDO a partir de fenômenos reais
- [algebra-linear](algebra-linear) — sistemas de EDOs são resolvidos via autovalores e autovetores
- [analise-numerica](analise-numerica) — métodos numéricos para EDOs (Euler, Runge-Kutta, métodos implícitos)
- → Pratique no /math-quest na área **Aplicada/EDOs** (Rank C+)
