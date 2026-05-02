---
title: Análise Numérica / Cálculo Numérico
category: matematica
stack: [Mat, Python, NumPy]
tags: [aplicada, calculo]
excerpt: Algoritmos para resolver problemas matemáticos em computador — erro, estabilidade, convergência e eficiência.
related: [calculo-1-variavel, algebra-linear, equacoes-diferenciais-ordinarias, otimizacao-pesquisa-op]
updated: 2026-05
---

## O que é

Análise Numérica estuda como resolver problemas matemáticos usando algoritmos de precisão finita. O computador não trabalha com ℝ — trabalha com um subconjunto finito de racionais (ponto flutuante IEEE 754). Toda operação introduz erro de arredondamento. Análise numérica quantifica, controla e entende esse erro.

O campo cobre: representação de números em ponto flutuante e aritmética de precisão finita; interpolação e aproximação de funções; diferenciação e integração numéricas; solução de sistemas lineares (Ax = b); solução de equações não-lineares (f(x) = 0); solução numérica de EDOs e EDPs; cálculo de autovalores.

Dois conceitos centrais: **estabilidade** (pequenos erros nos dados causam pequenos erros na solução?) e **convergência** (o método produz soluções cada vez mais próximas da exata quando refinado?). Um algoritmo pode ser matematicamente correto e numericamente desastroso se for instável.

## Por que estuda

Toda computação científica é análise numérica. NumPy, SciPy, TensorFlow, PyTorch — todas as operações numéricas têm comportamento que análise numérica descreve. Overflow em treinamento, exploding gradients, problemas de condicionamento em inversão de matrizes — são fenômenos de análise numérica.

Para ML eng: entender por que `float32` às vezes tem problemas de convergência e quando usar `float64`; por que a inversão direta de matrizes é evitada em favor de decomposição LU; por que gradiente descendente com learning rate muito alto oscila (instabilidade numérica de Euler explícito); como a regularização `eps` em operações como log softmax previne underflow — tudo é análise numérica.

## Conceitos-chave

- **Aritmética de ponto flutuante**: IEEE 754 single precision: 1 bit sinal, 8 bits expoente, 23 bits mantissa (≈7 dígitos decimais, range ±3.4×10³⁸). Double precision: 52 bits mantissa (≈15 dígitos, range ±1.8×10³⁰⁸). Epsilon de máquina ε_mach: menor ε tal que 1 + ε ≠ 1 em aritmética de máquina. Para float32: ε_mach ≈ 1.2×10⁻⁷.
- **Erros de truncamento e arredondamento**: erro de truncamento = erro por usar aproximação finita de processo infinito (ex: série de Taylor truncada). Erro de arredondamento = erro por precisão finita da representação. Em métodos numéricos, reduzir h reduz erro de truncamento mas aumenta erro de arredondamento (trade-off — existe um h ótimo).
- **Condicionamento de problema**: número de condição κ(A) = ||A||·||A⁻¹||. Mede amplificação de erro nos dados para erro na solução. Para sistema Ax=b: se κ(A) = 10^k, pode-se perder k dígitos significativos. Matrizes com κ >> 1 são mal-condicionadas.
- **Interpolação e aproximação polinomial**: dado n+1 pontos (xᵢ, yᵢ), existe único polinômio de grau ≤ n interpolador (Newton, Lagrange). Problema de Runge: polinômios de alto grau em pontos igualmente espaçados oscilam — usar nós de Chebyshev minimiza o erro de interpolação.
- **Integração numérica**: regra do trapézio: O(h²); regra de Simpson: O(h⁴); quadratura de Gauss-Legendre com n pontos: exata para polinômios de grau ≤ 2n-1. Erro de truncamento depende das derivadas de f; erro acumulado em [a,b] escala como h^p para método de ordem p.
- **Solução de sistemas lineares**: eliminação gaussiana com pivotamento parcial: O(n³), numericamente estável. Fatoração LU: A = LU, resolve Ly=b e Ux=y. Para matrizes simétricas positivas definidas: Cholesky A=LLᵀ (mais rápido, mais estável). Métodos iterativos (CG, GMRES) para sistemas esparsos grandes.
- **Raízes de equações não-lineares**: bissecção: convergência garantida para f contínua, lenta (O(1/2ⁿ)); método de Newton: convergência quadrática (se f'(r) ≠ 0 e início próximo), mas pode divergir; método da secante: entre linear e quadrática, não requer derivada analítica. Newton-Raphson em ℝⁿ: resolve sistemas não-lineares F(x) = 0 com Jacobiana.
- **EDOs numéricas**: Euler explícito: yₙ₊₁ = yₙ + h·f(tₙ,yₙ). Ordem 1, condicionalmente estável. Runge-Kutta RK4: quatro avaliações de f por passo, ordem 4, mais preciso. Métodos implícitos (Crank-Nicolson, BDF) para EDOs rígidas (stiff) — condição de estabilidade de Euler explícito exige h muito pequeno.

## Confusões comuns

**"Mais precisão numérica é sempre melhor"**: Não. Float64 é mais lento que float32 e usa o dobro de memória — em deep learning moderno, float16 e bfloat16 são comuns porque a redução de memória e velocidade compensa a perda de precisão para treinamento. O custo-benefício depende do problema.

**"h menor sempre dá integração mais precisa"**: Até certo ponto. Abaixo do h ótimo, o erro de arredondamento domina o erro de truncamento. Para diferenciação numérica de f'(x) ≈ [f(x+h)-f(x)]/h, o erro total é ~(ε_mach/h + h·|f''|). O mínimo é em h* ≈ √(ε_mach/|f''(x)/f(x)|).

**"Inversão de matriz A⁻¹ é o método correto para resolver Ax=b"**: Não. Calcular A⁻¹ e depois multiplicar por b é mais lento (O(n³) × 2) e menos estável numericamente do que fatoração LU com back-substitution. `np.linalg.solve(A, b)` usa LU internamente — nunca use `np.linalg.inv(A) @ b` em código real.

**"Método de Newton sempre converge se começar perto da raiz"**: Newton converge quadraticamente perto de raízes simples, mas pode divergir se começar longe ou próximo a um extremo local de f (onde f'≈0). Para raízes múltiplas, converge linearmente (não quadraticamente). Não há garantia global de convergência.

**"Número de condição alto significa que a solução é errada"**: Número de condição alto significa que o problema é sensível a perturbações nos dados. A solução computada pode ainda ser exata para os dados perturbados — mas se os dados têm erro (como sempre em medições), a solução pode ser muito imprecisa para o problema original.

## Aplicação em CS/Dev/ML

**Deep learning e precisão reduzida**: treinamento em float16/bfloat16 com "mixed precision" (NVIDIA Apex, PyTorch AMP) usa float16 para forward/backward e float32 para atualização de parâmetros. Análise numérica justifica isso: gradientes têm menos precisão mas acumular em float32 previne underflow.

**Decomposição matricial em ML**: PCA usa SVD (`np.linalg.svd`); regressão linear usa QR (`np.linalg.lstsq`); sistemas de equações normais usam Cholesky (`scipy.linalg.cho_factor`). Nunca inverta diretamente.

**Otimização numérica**: BFGS e L-BFGS aproximam a inversa da Hessiana incrementalmente (análise numérica de derivadas de segunda ordem). Linha de busca com condições de Wolfe é análise numérica de passo de otimização. `scipy.optimize.minimize` implementa isso.

**Solução de EDPs em simulação**: FDM (diferenças finitas), FEM (elementos finitos), FVM (volumes finitos) são todos análise numérica aplicada a EDPs. FEniCSx (Python) resolve EDPs em forma variacional.

**Estabilidade de treinamento de redes**: log-sum-exp trick para computar log softmax numericamente estável: log(Σ exp(xᵢ)) = max(x) + log(Σ exp(xᵢ - max(x))). `torch.nn.functional.log_softmax` usa isso internamente. Sem o trick, exp(logits grandes) causa overflow.

## Como praticar

- **Livro base**: Burden & Faires — *Numerical Analysis* (10a ed.) — referência clássica, com pseudocódigo e teoria. Trefethen & Bau — *Numerical Linear Algebra* — excelente para a parte de álgebra linear. Em português: Ruggiero & Lopes — *Cálculo Numérico* (Makron Books).
- **Implementar do zero**: bissecção, Newton-Raphson, regra de Simpson, eliminação gaussiana com pivotamento. Depois compare com SciPy e entenda a diferença de velocidade.
- **Explorar float32 vs float64**: compute 0.1 + 0.2 em Python. Compute Σ 1/k para k=1..10^6 com `float32` e compare com `float64`. Visualize o epsilon de máquina.
- **SciPy**: `scipy.integrate.quad`, `scipy.optimize.fsolve`, `scipy.linalg.lu`, `scipy.linalg.solve_triangular`, `scipy.sparse.linalg.spsolve`. Explore a documentação com exemplos reais.
- **Projeto**: implemente um solver de EDO (Euler explícito, implícito, e RK4) para y' = λy (com λ < 0) e visualize a região de estabilidade de cada método no plano complexo (h·λ ∈ ℂ). Veja onde Euler explícito oscila e os métodos implícitos não.

## Exercícios práticos

1. **[Rank E]** Aplique o método da bissecção para encontrar a raiz de f(x) = x³ - x - 2 no intervalo [1, 2]. Realize 5 iterações manualmente, construindo uma tabela com os valores de a, b, c = (a+b)/2 e f(c) em cada passo. Estime o erro após essas iterações. *Dica: f(1) = -2 < 0 e f(2) = 4 > 0. A cada iteração, o intervalo é dividido pela metade. Após 5 iterações, o erro é ≤ (2-1)/2⁵ = 1/32 ≈ 0.03.*

2. **[Rank D]** Implemente uma iteração do método de Newton-Raphson para encontrar √2, partindo de x₀ = 1. A função é f(x) = x² - 2 e f'(x) = 2x. Realize 4 iterações e compare a convergência (número de dígitos corretos por iteração) com o método de bissecção. *Dica: xₙ₊₁ = xₙ - f(xₙ)/f'(xₙ) = xₙ - (xₙ²-2)/(2xₙ) = (xₙ + 2/xₙ)/2. Convergência quadrática: o número de dígitos corretos dobra a cada iteração. Após 4 passos, ~12 dígitos corretos.*

3. **[Rank C]** Calcule ∫₀¹ e^{-x²} dx usando: (a) a regra de Simpson com n = 4 subintervalos; (b) estimativa do erro superior via a fórmula de erro de Simpson |E| ≤ (b-a)⁵/(180n⁴)·max|f''''(x)|. Compare com o valor exato (√π/2)·erf(1) ≈ 0.7468. *Dica: Simpson com n=4: h = 1/4, pontos x₀=0, x₁=1/4, x₂=1/2, x₃=3/4, x₄=1. S = (h/3)[f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + f(x₄)].*

4. **[Rank B]** Analise a estabilidade do método de Euler explícito (yₙ₊₁ = yₙ + h·f(yₙ)) para o problema y' = λy com λ < 0. Mostre que a solução numérica é estável (|yₙ| → 0) se e somente se |1 + hλ| < 1, o que corresponde a h < 2/|λ|. Compare com o método de Euler implícito (yₙ₊₁ = yₙ + h·f(yₙ₊₁)) e mostre que este é incondicionalmente estável. *Dica: para Euler explícito: yₙ = (1+hλ)ⁿ y₀. Para Euler implícito: yₙ₊₁ = yₙ/(1-hλ), portanto yₙ = (1/(1-hλ))ⁿ y₀. Como hλ < 0, temos |1/(1-hλ)| < 1 para todo h > 0.*

5. **[Rank A] [BOSS]** Prove que o método de Gauss-Legendre de ordem 2 (quadratura com 2 pontos em [-1,1]: ∫₋₁¹ f(x)dx ≈ f(-1/√3) + f(1/√3)) integra exatamente todos os polinômios de grau ≤ 3. Em seguida, esboce a construção geral das regras de Gauss-Legendre de n pontos como aquelas que integram exatamente polinômios de grau ≤ 2n-1, e explique por que os nós são as raízes do polinômio de Legendre Pₙ(x). *Dica: para verificar exatidão em grau ≤ 3: basta verificar para f(x) = 1, x, x², x³ (base de P₃). A regra tem 2n parâmetros livres (n nós e n pesos), suficientes para integrar exatamente polinômios de grau ≤ 2n-1. A ortogonalidade dos polinômios de Legendre à qual os nós são raízes garante a precisão.*

## Próximos passos

- [algebra-linear](algebra-linear) — sistemas lineares, autovalores, decomposições
- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — os sistemas que métodos numéricos resolvem
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — otimização numérica de funções contínuas
- [modelagem-matematica](modelagem-matematica) — análise numérica como componente de modelos aplicados
- → Pratique no /math-quest na área **Aplicada** (Rank C+)
