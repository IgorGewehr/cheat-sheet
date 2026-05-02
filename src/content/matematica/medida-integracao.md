---
title: Medida e Integração / Análise Funcional (overview combinado)
category: matematica
stack: [Mat]
tags: [analise, fundamentos]
excerpt: Teoria de Lebesgue, espaços Lp, espaços de Banach e Hilbert — fundamentos de probabilidade e ML teórico.
related: [analise-real, topologia-geral, probabilidade, equacoes-diferenciais-parciais]
updated: 2026-05
---

## O que é

Teoria da Medida é a fundação rigorosa de integração e probabilidade. A integral de Riemann falha para funções "complicadas" (ex: função de Dirichlet — 1 nos irracionais, 0 nos racionais — não é Riemann-integrável). Lebesgue (1902) propôs uma abordagem diferente: ao invés de particionar o domínio (eixo x), particionar a imagem (eixo y) e medir o tamanho do conjunto {x: f(x) > t}.

Uma **medida** μ em (X, Σ) — onde Σ é σ-álgebra (coleção de conjuntos mensuráveis fechada sob complemento e uniões contáveis) — é função μ: Σ → [0,∞] satisfazendo: μ(∅) = 0 e σ-aditividade (μ(∪Aᵢ) = Σμ(Aᵢ) para Aᵢ disjuntos). A integral de Lebesgue ∫f dμ generaliza Riemann e Stieltjes.

**Análise Funcional** estuda espaços vetoriais de dimensão infinita com estrutura de norma ou produto interno, e os operadores lineares entre eles. Os espaços centrais: Lp(X,μ) — funções de p-ésima potência integrável; espaços de Banach — completos com norma; espaços de Hilbert — completos com produto interno. Estes são os espaços em que vive a análise moderna, probabilidade e mecânica quântica.

## Por que estuda

Para o matemático, teoria de medida é a base de probabilidade rigorosa e de análise funcional. Sem ela, "variável aleatória" e "esperança" são conceitos intuitivos; com ela, são objetos matemáticos precisos. Espaços de Sobolev (fundamentais para EDPs), teoria ergódica, e geometria espectralnão existem sem teoria de medida.

Para ML: redes neurais infinitamente largas convergem para processos gaussianos (GP) — resultado que usa teoria de medida. Convergência de treinamento usa leis dos grandes números (resultado de teoria de medida). Inferência variacional e fluxos normalizantes são integrais em espaços de função. RKHS (Reproducing Kernel Hilbert Spaces) — base de SVMs, GPs, e métodos de kernel — é análise funcional.

## Conceitos-chave

- **σ-álgebra e espaço mensurável**: σ-álgebra Σ em X: contém ∅; fechada sob complemento; fechada sob uniões contáveis. Par (X, Σ) é espaço mensurável. A menor σ-álgebra contendo todos os abertos de ℝⁿ é a σ-álgebra de Borel B(ℝⁿ).
- **Medida de Lebesgue**: a medida de Lebesgue λ em ℝ é a única medida satisfazendo λ([a,b]) = b-a, translação-invariante, e completa (subconjuntos de conjuntos de medida zero são mensuráveis). Em ℝⁿ, λ([a₁,b₁]×…×[aₙ,bₙ]) = Π(bᵢ-aᵢ).
- **Integral de Lebesgue**: definida em etapas — funções indicadoras (∫1_A dμ = μ(A)), depois funções simples (combinação linear de indicadoras), depois funções não-negativas (sup de simples menores), depois funções gerais (parte positiva menos negativa). Propriedades: linear, monótona, admite troca de limite e integral sob condições mais fracas que Riemann.
- **Teoremas de convergência**: Monotone Convergence Theorem (MCT): se fₙ ↑ f (crescente e convergindo), então ∫fₙdμ → ∫f dμ. Lema de Fatou: ∫(lim inf fₙ)dμ ≤ lim inf ∫fₙdμ. Dominated Convergence Theorem (DCT): se |fₙ| ≤ g (g integrável) e fₙ → f, então ∫fₙdμ → ∫f dμ. Esses três são os instrumentos centrais.
- **Espaços Lp**: Lp(X,μ) = {f mensurável: ∫|f|p dμ < ∞}. Norma: ||f||_p = (∫|f|p dμ)^{1/p}. L∞: funções essencialmente limitadas. Desigualdades de Hölder: ||fg||₁ ≤ ||f||_p · ||g||_q (1/p + 1/q = 1). Minkowski: ||f+g||_p ≤ ||f||_p + ||g||_p. L² é o único Lp que é espaço de Hilbert.
- **Espaços de Banach e Hilbert**: Banach: espaço vetorial normado completo (toda sequência de Cauchy converge). Hilbert: Banach com norma induzida por produto interno ⟨·,·⟩. Teorema de representação de Riesz: todo funcional linear contínuo em H é da forma f ↦ ⟨f, g⟩ para algum g ∈ H.
- **Operadores lineares**: T: B₁ → B₂ é operador limitado se ||T|| = sup{||Tf||: ||f||=1} < ∞. Espectro σ(T) = {λ ∈ ℂ: T-λI não é invertível} — generaliza autovalores para dimensão infinita. Para operadores compactos em Hilbert: espectro tem estrutura semelhante ao caso finito (Fredholm).
- **Medida de probabilidade**: medida μ com μ(X) = 1. Variável aleatória: função mensurável X: Ω → ℝ. Esperança: E[X] = ∫X dP. Leis dos grandes números (LGN): (1/n)Σ Xᵢ → E[X] (fraca: em probabilidade; forte: quase certamente). Teorema Central do Limite (TCL): (Σ Xᵢ - nμ)/(σ√n) → N(0,1) em distribuição.

## Confusões comuns

**"Integral de Lebesgue e de Riemann sempre coincidem"**: Se f é Riemann-integrável, ela também é Lebesgue-integrável e as integrais coincidem. Mas Lebesgue integra funções que Riemann não integra (ex: função de Dirichlet tem integral de Lebesgue 0, pois os irracionais têm medida de Lebesgue 1 e os racionais têm medida 0).

**"Conjunto de medida zero é conjunto vazio"**: Não. Os racionais em [0,1] têm medida de Lebesgue zero mas são um conjunto infinito (denso). A frase "quase certamente" (q.c.) em probabilidade significa "exceto num conjunto de probabilidade zero" — e esses conjuntos podem ser não-triviais.

**"L² e ℓ² são a mesma coisa"**: L²([0,1]) contém funções de variável contínua quadrado-integráveis. ℓ² contém sequências de quadrado-somável. São isomorfos como espaços de Hilbert (pelo teorema de Fischer-Riesz, ambos são separáveis de dimensão infinita), mas os objetos concretos são diferentes.

**"Todo operador linear em Hilbert é limitado"**: Não. Em dimensão infinita, existem operadores lineares não-limitados (e portanto não-contínuos). Em mecânica quântica, os operadores de posição e momento são não-limitados no espaço de Hilbert L². O teorema de Hellinger-Toeplitz: um operador auto-adjunto definido em todo H é necessariamente limitado.

**"σ-álgebra de Borel e σ-álgebra de Lebesgue são iguais"**: A σ-álgebra de Lebesgue é a completação de Borel (adiciona subconjuntos de conjuntos de medida zero). Existem conjuntos de Lebesgue que não são Borel (mas são difíceis de construir explicitamente).

## Aplicação em CS/Dev/ML

**RKHS e kernel methods**: SVMs e Gaussian Processes operam em RKHS — espaços de Hilbert de funções onde o kernel k(x,y) é o produto interno. O teorema de representação de Mercer garante que todo kernel positivo definido define um RKHS. A dualidade entre minimização de funcional em RKHS e kernel trick é análise funcional.

**Redes neurais infinitas e processos gaussianos**: no limite de largura infinita, NNs com pesos aleatórios convergem para GP com um kernel específico (NTK — Neural Tangent Kernel). Resultado rigoroso usa teoria de medida e análise funcional (convergência em distribuição no espaço de funções).

**Inferência variacional e fluxos**: ELBO (Evidence Lower BOund) = E_q[log p(x,z)] - E_q[log q(z)] é esperança em L¹(q). Normalizing flows transformam medidas de probabilidade via mudança de variáveis — a fórmula de mudança de variáveis usa a derivada de Radon-Nikodym (dμ/dν em teoria de medida).

**Convergência de algoritmos**: leis dos grandes números garantem que estimativas de Monte Carlo convergem. O TCL justifica intervalos de confiança. Para métodos de MCMC (Markov Chain Monte Carlo), convergência usa teoria ergódica — que é teoria de medida aplicada a sistemas dinâmicos.

**SciPy / NumPy**: integração numérica via `scipy.integrate.quad` (Riemann adaptativo), `scipy.integrate.dblquad` (dupla), `numpy.trapz` (regra do trapézio). Para probabilidade: `scipy.stats` com todas as distribuições padrão e seus momentos.

## Como praticar

- **Livro base**: Royden — *Real Analysis* (4a ed.) — padrão para teoria de medida em nível de graduação avançado. Lima — *Curso de Análise* Vol. 2 tem capítulo de medida. Para análise funcional: Kreyszig — *Introductory Functional Analysis with Applications* (mais acessível, orientado a aplicações).
- **Provar os três teoremas de convergência**: MCT, Fatou e DCT do zero. Cada passo do MCT usa σ-aditividade; DCT usa MCT para a dominante; entender a cadeia é o núcleo do campo.
- **Construir medidas**: defina a medida de contagem em ℕ, verifique σ-aditividade. Compare com medida de Lebesgue. Compute ∫f d(contagem) = Σ f(n) — a integral de Lebesgue unifica soma e integral!
- **Projeto de GP**: implemente Gaussian Process Regression do zero em NumPy — prior, likelihood, posterior, predição. Entender que GP é distribuição sobre funções (medida em espaço de função) é análise funcional na prática.
- **GPyTorch**: biblioteca PyTorch para GPs escaláveis. Explorar como kernels são especificados, como o ELBO é calculado, como a predição usa o teorema de representação de Riesz discretizado.

## Exercícios práticos

1. **[Rank E]** Verifique que a coleção B de intervalos abertos em ℝ gera uma σ-álgebra (a σ-álgebra de Borel): mostre que a σ-álgebra gerada por B é fechada por uniões e interseções contáveis e por complemento. Por que a coleção de todos os abertos de ℝ não é σ-álgebra diretamente? *Dica: a coleção de abertos é fechada por uniões arbitrárias e interseções finitas, mas não por complemento nem por interseções contáveis. A σ-álgebra gerada é o menor fecho contendo todos os abertos com as operações contáveis e complemento.*

2. **[Rank D]** Mostre que a função de Dirichlet f: [0,1] → ℝ definida por f(x) = 1 se x ∈ ℚ e f(x) = 0 se x ∉ ℚ não é Riemann integrável, mas é Lebesgue integrável com ∫f dμ = 0. *Dica: para Riemann: toda soma superior é 1 (em qualquer subintervalo há racionais) e toda soma inferior é 0 (em qualquer subintervalo há irracionais), portanto limite superior ≠ limite inferior. Para Lebesgue: ℚ ∩ [0,1] é contável, portanto tem medida de Lebesgue zero. A integral de Lebesgue de 1_A onde μ(A) = 0 é zero.*

3. **[Rank C]** Enuncie e aplique o Teorema da Convergência Dominada (TCD): se fₙ → f pontualmente e |fₙ| ≤ g com ∫g < ∞, então lim ∫fₙ = ∫f. Aplique para calcular lim_{n→∞} ∫₀¹ n·x^n(1-x) dx. *Dica: fₙ(x) = nx^n(1-x) → 0 pontualmente em [0,1] para x ∈ [0,1). Como nx^n(1-x) ≤ nx^n e ∫₀¹ nx^n dx = n/(n+1) → 1 (não dominado), verifique a dominação mais cuidadosamente: max de nx^n(1-x) em [0,1] é n·n^n/(n+1)^{n+1} ≈ 1/e. Use g = 1/e. Pelo TCD: lim∫fₙ = 0.*

4. **[Rank B]** Prove a desigualdade de Hölder: para f ∈ Lᵖ e g ∈ Lᵍ com 1/p + 1/q = 1, vale ∫|fg| ≤ ||f||_p · ||g||_q. Use a desigualdade de Young: ab ≤ aᵖ/p + bᵍ/q. *Dica: se ||f||_p = 0 ou ||g||_q = 0, a desigualdade é trivial. Caso contrário, normalize: f̃ = f/||f||_p, g̃ = g/||g||_q. Aplique Young com a = |f̃(x)|, b = |g̃(x)|: |f̃||g̃| ≤ |f̃|ᵖ/p + |g̃|ᵍ/q. Integre ambos os lados: ∫|f̃g̃| ≤ 1/p + 1/q = 1.*

5. **[Rank A] [BOSS]** Prove o teorema de Radon-Nikodym: se μ e ν são medidas σ-finitas num espaço mensurável (X, F) com ν absolutamente contínua em relação a μ (ν(A) = 0 sempre que μ(A) = 0), então existe função mensurável f ≥ 0 (a derivada de Radon-Nikodym dν/dμ) tal que ν(A) = ∫_A f dμ para todo A ∈ F. *Dica: considere o espaço de Hilbert L²(μ+ν) e o funcional linear φ(h) = ∫h dν sobre esse espaço. φ é contínuo (|φ(h)| ≤ ||h||_{L²}·√ν(X) pela Cauchy-Schwarz). Pelo teorema de Riesz de representação em espaços de Hilbert, existe g ∈ L²(μ+ν) com φ(h) = ∫hg d(μ+ν). Manipule para separar a contribuição de ν versus μ e extraia a derivada f = g/(1-g).*

## Próximos passos

- [probabilidade](probabilidade) — teoria de probabilidade rigorosa usa medida
- [analise-real](analise-real) — base para entender por que Lebesgue foi necessário
- [equacoes-diferenciais-parciais](equacoes-diferenciais-parciais) — espaços de Sobolev e soluções fracas usam Lp
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — dualidade e teoremas de minimax em espaços de Banach
- → Pratique no /math-quest na área **Análise** (Rank B+)
