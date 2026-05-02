---
title: Probabilidade
category: matematica
stack: [Mat, Python]
tags: [prob-stat, aplicada, fundamentos]
excerpt: Espaços de probabilidade, variáveis aleatórias, distribuições e teoremas de convergência — base de ML e estatística.
related: [analise-combinatoria, estatistica-inferencia, medida-integracao, algebra-linear]
updated: 2026-05
---

## O que é

Probabilidade é a teoria matemática do acaso. A axiomatização moderna foi dada por Kolmogorov em 1933: um **espaço de probabilidade** é uma tripla (Ω, Σ, P) onde Ω é o espaço amostral (todos os resultados possíveis), Σ é uma σ-álgebra de eventos (subconjuntos mensuráveis de Ω), e P: Σ → [0,1] é uma medida de probabilidade (P(Ω) = 1, σ-aditiva).

Uma **variável aleatória** X é uma função mensurável X: Ω → ℝ. A distribuição de X é a medida P_X = P ∘ X⁻¹ em ℝ. A esperança E[X] = ∫ X dP — uma integral de Lebesgue. Esta formulação rigorosa unifica probabilidade discreta e contínua numa estrutura única.

As distribuições mais importantes: Normal N(μ, σ²) — onipresente pelo TCL; Binomial Bin(n,p) — contagem de sucessos; Poisson Poi(λ) — eventos raros em tempo contínuo; Exponencial Exp(λ) — tempo até evento; Beta, Gamma, Dirichlet — distribuições de distribuições (priors bayesianos). Multivariado: Normal multivariada N(μ, Σ) — base de modelos gaussianos.

## Por que estuda

Probabilidade é a linguagem de ML. Todo modelo de ML é um modelo probabilístico (explícita ou implicitamente): parâmetros têm distribuições a priori, dados têm likelihoods, predições são distribuições sobre rótulos. Sem probabilidade rigorosa, não é possível entender por que modelos funcionam, quando generalizam, e como quantificar incerteza.

Para dev: sistemas distribuídos usam probabilidade para análise de falhas e estimativa de carga; criptografia usa aleatoriedade probabilística; testes A/B são experimentos probabilísticos; monitoramento de sistemas usa teoria de processos estocásticos.

## Conceitos-chave

- **Probabilidade condicional e independência**: P(A|B) = P(A∩B)/P(B) (P(B) > 0). Regra de Bayes: P(A|B) = P(B|A)P(A)/P(B). A e B independentes: P(A∩B) = P(A)P(B). Independência implica que informação sobre B não muda a probabilidade de A.
- **Variável aleatória discreta e contínua**: discreta: X toma valores num conjunto contável, P(X=k) = p_k com Σp_k = 1. Contínua: X tem função de densidade f_X(x) com P(a≤X≤b) = ∫_a^b f_X(x)dx e ∫_{-∞}^{∞} f_X(x)dx = 1. Função de distribuição acumulada (FDA) F_X(x) = P(X ≤ x) — sempre definida, crescente, right-continuous.
- **Esperança, variância e momentos**: E[X] = ∫x f_X(x)dx (ou Σ x p_x). Linearidade: E[aX+b] = aE[X]+b; E[X+Y] = E[X]+E[Y] (sempre). Var(X) = E[(X-μ)²] = E[X²] - (E[X])². Var(aX+b) = a²Var(X). Covariância: Cov(X,Y) = E[(X-E[X])(Y-E[Y])].
- **Distribuições importantes**: N(μ,σ²): fdp = (1/σ√(2π)) e^{-(x-μ)²/(2σ²)}. Standard Normal Z = (X-μ)/σ. Soma de normais independentes é normal. Chi-squared χ²(k) = soma de k N(0,1)² — base de testes qui-quadrado. t de Student para estimação com variância desconhecida. F para razão de variâncias.
- **Lei dos grandes números (LGN)**: LGN fraca: (1/n)Σ Xᵢ →_P μ (convergência em probabilidade). LGN forte: (1/n)Σ Xᵢ → μ quase certamente. Fundamento: estimativas de Monte Carlo, médias amostrais, aproximação de integrais.
- **Teorema Central do Limite (TCL)**: se X₁,...,Xₙ são i.i.d. com E[X]=μ e Var(X)=σ²<∞, então √n(X̄_n - μ)/σ → N(0,1) em distribuição. Justifica o uso da normal em quase tudo: somas de muitas variáveis aleatórias independentes são aproximadamente normais.
- **Processo de Markov e cadeias de Markov**: processo estocástico {Xₙ} satisfaz a propriedade de Markov se P(Xₙ₊₁=xₙ₊₁|X₁,...,Xₙ) = P(Xₙ₊₁=xₙ₊₁|Xₙ) (o futuro depende só do presente, não do passado). Em estado estacionário π: πP = π (autovetor esquerdo da matriz de transição). Base de MCMC, modelos de linguagem n-gram, PageRank.
- **Funções geradoras de momentos e transformadas**: MGF M_X(t) = E[e^{tX}]. Deriva momentos: E[Xⁿ] = M_X^{(n)}(0). Transforma independência em produto: se X,Y independentes, M_{X+Y}(t) = M_X(t)·M_Y(t). Função característica φ_X(t) = E[e^{itX}] — sempre existe e é a transformada de Fourier da fdp.

## Confusões comuns

**"Correlação zero implica independência"**: Para variáveis normais conjuntas, sim. Em geral, não. Cov(X,Y) = 0 implica X, Y não correlacionados, mas não necessariamente independentes. Ex clássico: X ~ N(0,1), Y = X·sgn(Z) onde Z ~N(0,1) independente de X. Cov(X,Y) = 0 mas X, Y são dependentes.

**"P(A|B) = P(B|A)"**: Confundir probabilidade condicional com sua transposta é o erro mais clássico (falácia da transposição ou "prosecutor's fallacy"). P(doença|teste positivo) ≠ P(teste positivo|doença). A relação correta é a regra de Bayes.

**"Variáveis independentes têm variâncias que adicionam"**: Var(X+Y) = Var(X) + Var(Y) + 2Cov(X,Y). Para variáveis independentes, Cov = 0 e a soma simplifica. Mas para dependentes, o termo cruzado não some. Errar isso em análise de incerteza é grave.

**"A média amostral com n grande é exatamente a média verdadeira"**: LGN diz que a média amostral converge para a verdadeira com probabilidade 1, mas nunca é exata para n finito (exceto coincidência). TCL quantifica a flutuação residual: ela é da ordem 1/√n.

**"Distribuição normal é sempre apropriada para dados reais"**: Por causa do TCL, somas e médias tendem à normal. Mas distribuições com caudas pesadas (pareto, log-normal — como distribuição de renda, tamanho de arquivos, popularidade de páginas web) não são bem aproximadas pela normal mesmo para n grande.

## Aplicação em CS/Dev/ML

**Inferência Bayesiana**: posterior P(θ|dados) ∝ P(dados|θ)·P(θ). Computar o posterior é o problema central da ML bayesiana. MCMC (Metropolis-Hastings, HMC) e variational inference (ELBO, VI) são os dois métodos de aproximação padrão.

**Modelos generativos**: VAE, GAN, Flow, Diffusion — todos são modelos de distribuições de probabilidade. VAE modela p(x) = ∫ p(x|z)p(z)dz com inferência variacional. Diffusion modela o processo estocástico de adição e remoção de ruído.

**Testes A/B e experimentos**: p-valor é P(dados ou mais extremos | H₀ verdadeira). Tamanho de efeito, poder do teste, erro tipo I e II são todos probabilidade. Erroneamente misturar p-valor e probabilidade da hipótese é epidêmico na indústria.

**Sistemas de recomendação e bandit problems**: Multi-armed bandit usa distribuições de recompensa. UCB (Upper Confidence Bound) e Thompson Sampling são algoritmos de otimização estocástica que balanceiam exploração e explotação usando estimativas probabilísticas.

**SciPy e NumPy para probabilidade**: `scipy.stats` tem 100+ distribuições com `pdf`, `cdf`, `rvs`, `fit`. `numpy.random` para geração. `scipy.stats.norm.ppf(0.975)` = 1.96. `scipy.stats.ttest_ind` para t-test. `statsmodels` para modelos estatísticos.

## Como praticar

- **Livro base**: DeGroot & Schervish — *Probability and Statistics* (4a ed., rigoroso e completo). Ross — *Introduction to Probability Models* (mais aplicado). Para rigor matemático: Durrett — *Probability: Theory and Examples*.
- **Derivar distribuições**: prove que soma de k variáveis N(0,1)² é Chi-squared(k). Derive a distribuição de X̄ para amostras normais. Calcule a variância da binomial a partir da definição.
- **Simulação de Monte Carlo**: estime π, integre funções complexas, simule cadeias de Markov. Ver a LGN e TCL em ação consolida a intuição mais que qualquer prova.
- **PyMC ou Stan**: escreva um modelo bayesiano simples (regressão logística bayesiana) e amostre com MCMC. Entender convergência do sampler requer entender cadeias de Markov.
- **Projeto**: implemente Thompson Sampling para um multi-armed bandit com distribuições beta-Bernoulli. Compare com epsilon-greedy e UCB. Entender o algoritmo requer probabilidade conjugada (prior beta, likelihood Bernoulli, posterior beta).

## Exercícios práticos

1. **[Rank E]** Uma urna contém 4 bolas vermelhas e 6 bolas azuis. Você retira 3 bolas sem reposição. Calcule a probabilidade de obter exatamente 2 vermelhas e 1 azul. Use a distribuição hipergeométrica. *Dica: P(X=2) = C(4,2)·C(6,1)/C(10,3) = 6·6/120 = 36/120 = 3/10.*

2. **[Rank D]** Para X e Y variáveis aleatórias com função de densidade conjunta f(x,y) = 2 em {0 ≤ y ≤ x ≤ 1} e 0 caso contrário, calcule: (a) as densidades marginais f_X(x) e f_Y(y); (b) E[X], E[Y]; (c) Cov(X,Y); (d) determine se X e Y são independentes. *Dica: f_X(x) = ∫₀^x 2 dy = 2x para x ∈ [0,1]. f_Y(y) = ∫_y^1 2 dx = 2(1-y). E[X] = ∫₀¹ 2x² dx = 2/3. X e Y não são independentes pois f(x,y) ≠ f_X(x)·f_Y(y).*

3. **[Rank C]** Prove o teorema do limite central (para v.a. iid com média μ e variância σ²) usando funções características: mostre que a função característica de Sₙ = (X₁+…+Xₙ-nμ)/(σ√n) converge para e^{-t²/2} (função característica da N(0,1)). *Dica: φ_{Sₙ}(t) = [φ_X(t/(σ√n))]ⁿ onde φ_X é a f.c. de (X-μ). Expanda em Taylor: φ_X(s) ≈ 1 + isE[X-μ] - s²E[(X-μ)²]/2 + … = 1 - s²σ²/2 + o(s²). Substitua s = t/(σ√n): φ_{Sₙ}(t) ≈ (1 - t²/(2n))ⁿ → e^{-t²/2}.*

4. **[Rank B]** Prove a desigualdade de Markov (P(X ≥ a) ≤ E[X]/a para X ≥ 0, a > 0) e use-a para provar a desigualdade de Chebyshev (P(|X-μ| ≥ k) ≤ σ²/k²). Depois prove a Lei Fraca dos Grandes Números usando Chebyshev. *Dica: Markov: E[X] = ∫₀^∞ x f(x) dx ≥ ∫_a^∞ x f(x) dx ≥ a·P(X≥a). Chebyshev: aplique Markov com Y = (X-μ)² e a = k². LFGN: P(|X̄ₙ-μ|≥ε) ≤ σ²/(nε²) → 0.*

5. **[Rank A] [BOSS]** Prove que toda cadeia de Markov irredutível e aperiódica em espaço de estados finito converge para uma distribuição estacionária única π, independentemente da distribuição inicial. Esboce a prova usando acoplamento (coupling): construa dois processos, um começando em i e outro começando em π, que se encontram ("acoplam") em tempo finito T_c, e mostre que para t > T_c ambos seguem a mesma distribuição π. *Dica: construa a cadeia conjunta (Xₜ, Yₜ) que evolui independentemente até o acoplamento e depois permanece junta. O tempo de acoplamento T_c é finito q.c. pela irredutibilidade e aperiodicidade. Para t ≥ T_c: P(Xₜ = j) = P(Yₜ = j) = π_j (pois Yₜ começou em π e π é estacionária). A variação total ||P(Xₜ=·) - π||_TV ≤ P(T_c > t) → 0.*

## Próximos passos

- [estatistica-inferencia](estatistica-inferencia) — inferência frequentista e bayesiana, testes de hipóteses
- [analise-combinatoria](analise-combinatoria) — probabilidade discreta é contagem
- [medida-integracao](medida-integracao) — fundamentos rigorosos: espaço de probabilidade como medida
- [modelagem-matematica](modelagem-matematica) — probabilidade aplicada a sistemas reais
- → Pratique no /math-quest na área **Probabilidade/Estatística** (Rank C+)
