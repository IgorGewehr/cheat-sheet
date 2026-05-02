---
title: Estatística & Inferência
category: matematica
stack: [Mat, Python]
tags: [prob-stat, aplicada]
excerpt: Estimação, testes de hipóteses, regressão e inferência bayesiana — extrair conclusões de dados sob incerteza.
related: [probabilidade, analise-numerica, modelagem-matematica, otimizacao-pesquisa-op]
updated: 2026-05
---

## O que é

Estatística é a ciência de extrair conclusões de dados na presença de incerteza. Se probabilidade pergunta "dado o modelo, quais são os dados prováveis?", estatística inverte: "dados os dados, o que podemos concluir sobre o modelo?"

Existem duas escolas principais. A **frequentista** trata parâmetros como valores fixos desconhecidos e constrói procedimentos (estimadores, intervalos de confiança, testes) com propriedades garantidas em repetições longas do experimento. A **bayesiana** trata parâmetros como variáveis aleatórias com distribuição a priori, e usa o teorema de Bayes para atualizar a distribuição posterior dado os dados.

Na prática moderna, as duas escolas são complementares. A inferência frequentista domina em experimentos clínicos, A/B tests e análise causal. A bayesiana domina em ML probabilístico, modelos hierárquicos e problemas com dados escassos onde o prior importa.

## Por que estuda

Decisões baseadas em dados sem estatística rigorosa são armadilhas. P-hacking, HARKing (Hypothesizing After Results are Known), viés de seleção, confundimento — são erros que custam produtos, reputações e vidas. Estatística rigorosa é a vacina.

Para dev/ML: qualquer experimento A/B é inferência estatística. Métricas de modelo (accuracy, AUC, F1) têm incerteza — sem intervalos de confiança, comparações são ruído. Validação cruzada é estimação de erro de generalização — tem propriedades estatísticas. Monitoramento de drift e detecção de anomalia são testes de hipóteses em produção.

## Conceitos-chave

- **Estimador e propriedades**: estimador θ̂ é função da amostra. Não-viesado: E[θ̂] = θ. Consistente: θ̂ →_P θ (converge em probabilidade). Eficiente: variância mínima entre estimadores não-viesados (Cramér-Rao: Var(θ̂) ≥ 1/I(θ) onde I(θ) é informação de Fisher). MLE (Máxima Verossimilhança): θ̂_MLE = argmax_θ Σ log p(xᵢ|θ).
- **Intervalos de confiança**: IC de 95% para θ: procedimento que, em 95% das repetições do experimento, contém o valor verdadeiro de θ. Não significa "probabilidade 95% de θ estar no IC calculado" — θ é fixo (frequentismo). Para normal: X̄ ± 1.96·σ/√n.
- **Teste de hipóteses**: H₀ (hipótese nula) vs. H₁ (alternativa). Estatística de teste T = f(X₁,...,Xₙ). P-valor: P(T ≥ t_obs | H₀). Erro tipo I (α): rejeitar H₀ quando é verdadeira. Erro tipo II (β): não rejeitar H₀ quando é falsa. Poder = 1-β. Tamanho amostral para detectar efeito de tamanho δ: n ≈ (z_α + z_β)² · 2σ²/δ².
- **Testes comuns**: t-test (comparar médias: uma amostra, duas amostras independentes, pareado). ANOVA (comparar múltiplas médias). Chi-quadrado (independência em tabelas de contingência; aderência a distribuição). Kolmogorov-Smirnov (comparar distribuições empiricamente). Mann-Whitney (não-paramétrico para mediana).
- **Regressão linear**: y = Xβ + ε (ε ~ N(0,σ²I)). OLS: β̂ = (XᵀX)⁻¹Xᵀy. Propriedades: Gauss-Markov (melhor estimador linear não-viesado sob homocedasticidade e sem autocorrelação). R² = proporção de variância explicada. Diagnóstico: resíduos vs. fitted (homocedasticidade), Q-Q plot (normalidade dos resíduos).
- **Máxima Verossimilhança (MLE) e suas propriedades**: sob regularidade, θ̂_MLE é consistente, assintoticamente normal: √n(θ̂_MLE - θ) → N(0, I(θ)⁻¹). MLE é assintoticamente eficiente. Invariante: se θ̂_MLE é MLE de θ, então g(θ̂_MLE) é MLE de g(θ).
- **Inferência Bayesiana**: prior P(θ), likelihood P(dados|θ), posterior P(θ|dados) ∝ P(dados|θ)·P(θ). Estimativa pontual: MAP (máximo a posteriori) ou média posterior. Intervalo credível: P(θ ∈ [a,b] | dados) = 0.95 (ao contrário do IC frequentista, esta é interpretação correta — dados os dados e o prior).
- **Múltiplas comparações e correção**: se faz m testes ao nível α, a taxa de falsos positivos acumulada (FWER) cresce. Correção de Bonferroni: α/m por teste. Benjamini-Hochberg: controla FDR (False Discovery Rate) — mais poderoso que Bonferroni, standard em genomics e ML.

## Confusões comuns

**"P-valor é a probabilidade de H₀ ser verdadeira"**: Não. P-valor é P(dados ou mais extremos | H₀ verdadeira). Não diz nada sobre P(H₀ | dados). A diferença é o teorema de Bayes — para P(H₀|dados) precisaría de um prior sobre H₀.

**"Intervalo de confiança de 95% contém θ com probabilidade 95%"**: Não em frequentismo. O θ é fixo; o IC é aleatório (depende da amostra). Em 95% dos experimentos imaginados, o IC calculado conteria θ. O IC calculado de UMA amostra contém ou não contém θ — com probabilidade 0 ou 1, nós apenas não sabemos qual.

**"Correlação implica causalidade"**: O erro mais clássico. Correlação mede associação linear. Causalidade requer: plausibilidade mecanística, temporalidade (causa precede efeito), descarte de confundidores. Ferramentas para causalidade: RCT, instrumentos, DiD, RDD, DAGs (Pearl).

**"R² alto significa modelo bom"**: R² mede proporção de variância explicada, não validade do modelo. Anscombe's Quartet: quatro datasets com R²=0.67 e regressão idêntica mas com comportamentos completamente diferentes. Diagnóstico de resíduos é obrigatório.

**"Mais dados sempre ajudam"**: Para estimadores consistentes, mais dados reduzem variância de estimação. Mas dados enviesados em maior quantidade apenas amplificam o viés. "Garbage in, garbage out" — qualidade de dados domina quantidade.

## Aplicação em CS/Dev/ML

**Avaliação de modelos de ML**: accuracy, AUC, F1 são estimativas de métricas populacionais. Erro padrão e intervalos de confiança via bootstrap são necessários para comparar modelos rigorosamente. `scipy.stats.bootstrap` computa ICs bootstrapped.

**Testes A/B em produção**: cada teste A/B é um experimento com H₀ = "não há diferença entre A e B". P-valor, poder, e tamanho amostral mínimo são cálculos frequentistas. Erro de peeking (olhar o p-valor antes do tamanho amostral pré-definido) aumenta taxa de falso positivo — é necessário correção (e-values, always-valid inference).

**Detecção de data drift e anomalia**: distribuição de features em produção muda? Teste KS (Kolmogorov-Smirnov), Population Stability Index (PSI), Maximum Mean Discrepancy (MMD) — todos são testes estatísticos.

**Calibração de modelos probabilísticos**: um modelo que prediz P(Y=1|X) = 0.8 deve errar ~20% das vezes nesses casos. Calibração é verificada com reliability diagrams. `sklearn.calibration.calibration_curve`. Platt scaling e isotonic regression calibram modelos mal-calibrados.

**PyMC e Stan para bayesiana**: PyMC (Python) e Stan (multilingue) são linguagens probabilísticas para inferência bayesiana. MCMC (HMC, NUTS) amostram o posterior. `arviz` para diagnóstico e visualização de resultados MCMC.

## Como praticar

- **Livro base**: DeGroot & Schervish — *Probability and Statistics* — rigoroso e unificado. Wasserman — *All of Statistics* — mais conciso, orientado a ML. Gelman et al. — *Bayesian Data Analysis* (BDA3) — referência para bayesiana.
- **Simular antes de analisar**: para cada distribuição e estimador, simule 1000 amostras de tamanho n, compute o estimador, plote a distribuição. Isso torna os teoremas assintóticos concretos.
- **Implementar MLE do zero**: dado modelo paramétrico (ex: Poisson), maximize o log-likelihood numericamente (scipy.optimize.minimize com negativo do log-lik). Compare com estimativa analítica.
- **statsmodels**: `import statsmodels.api as sm; model = sm.OLS(y, X).fit(); model.summary()`. Explore regressão, GLM (logística, poisson), testes de hipóteses.
- **Projeto**: analise um dataset real (ex: dados de A/B test ou dados médicos do UCI) com pipeline completo: exploração, modelagem, teste de hipóteses com correção de múltiplas comparações, regressão com diagnóstico, interpretação.

## Exercícios práticos

1. **[Rank E]** Para uma amostra de tamanho n de uma distribuição Normal com média μ desconhecida e variância σ² conhecida, derive o estimador de máxima verossimilhança (MLE) de μ. Mostre que o MLE é a média amostral x̄ = (1/n)Σxᵢ. *Dica: log-likelihood é l(μ) = -n/2·ln(2πσ²) - Σ(xᵢ-μ)²/(2σ²). Derive em relação a μ, iguale a zero: Σ(xᵢ-μ) = 0, logo μ̂ = x̄.*

2. **[Rank D]** Um dado de 6 faces é jogado 100 vezes. Obtêm-se as frequências: 1→14, 2→18, 3→16, 4→17, 5→19, 6→16. Realize um teste qui-quadrado (χ²) de bondade de ajuste ao nível α = 5% para testar se o dado é justo. *Dica: sob H₀, o esperado é 100/6 ≈ 16.67 para cada face. χ² = Σ(Oᵢ-Eᵢ)²/Eᵢ. O valor crítico χ²₀.₀₅ com 5 graus de liberdade é 11.07. Compare o χ² calculado com o crítico.*

3. **[Rank C]** Construa um intervalo de confiança de 95% para a proporção p de moedas cara em uma sequência de n = 200 lançamentos com 112 caras. Use o IC de Wald: p̂ ± z_{α/2}·√(p̂(1-p̂)/n). Compare com o IC de Wilson (mais robusto para p próximo de 0 ou 1). *Dica: p̂ = 112/200 = 0.56. z₀.₀₂₅ = 1.96. IC Wald: 0.56 ± 1.96·√(0.56·0.44/200) ≈ (0.491, 0.629). IC Wilson usa fórmula diferente que evita sair do intervalo [0,1].*

4. **[Rank B]** Derive o estimador de Bayes para μ numa observação x ~ Normal(μ, 1) com prior μ ~ Normal(μ₀, τ²). Calcule o posterior p(μ|x) e mostre que é Normal, exibindo a média e a variância posterior. Interprete: o estimador Bayesiano é uma média ponderada entre x e μ₀. *Dica: p(μ|x) ∝ p(x|μ)·p(μ) = exp(-½(x-μ)²)·exp(-(μ-μ₀)²/(2τ²)). Complete o quadrado no expoente em μ. A média posterior é μ_n = (x·τ²+μ₀·1)/(τ²+1) e a variância posterior é σ²_n = τ²/(τ²+1).*

5. **[Rank A] [BOSS]** Prove a desigualdade de Cramér-Rao: para qualquer estimador não-viciado T(X) de θ, a variância satisfaz Var(T) ≥ 1/I(θ), onde I(θ) = E[(∂ log f(X;θ)/∂θ)²] é a informação de Fisher. Utilize a desigualdade de Cauchy-Schwarz aplicada à covariância entre T(X) e a função de score ∂ log f(X;θ)/∂θ. *Dica: como T é não-viciado, E[T] = θ. Derive em θ: 1 = ∂/∂θ∫T·f dX = ∫T·∂f/∂θ dX = ∫T·(score)·f dX = Cov(T, score) (pois E[score] = 0). Pela desigualdade de Cauchy-Schwarz: 1 = Cov(T,score)² ≤ Var(T)·Var(score) = Var(T)·I(θ).*

## Próximos passos

- [probabilidade](probabilidade) — fundamento teórico de toda inferência
- [modelagem-matematica](modelagem-matematica) — estatística como componente de modelos maiores
- [analise-numerica](analise-numerica) — métodos numéricos em otimização de verossimilhança
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — MLE é problema de otimização
- → Pratique no /math-quest na área **Probabilidade/Estatística** (Rank C+)
