---
title: Otimização & Pesquisa Operacional
category: matematica
stack: [Mat, Python]
tags: [aplicada, algebra, prob-stat]
excerpt: Programação linear, convexa, inteira e estocástica — minimizar objetivos sob restrições.
related: [algebra-linear, calculo-multivariavel, probabilidade, analise-numerica, teoria-grafos-mat]
updated: 2026-05
---

## O que é

Otimização é a matemática de encontrar o melhor elemento de um conjunto segundo algum critério. Pesquisa Operacional (PO) é o campo aplicado que usa otimização para resolver problemas de decisão em logística, produção, finanças e engenharia.

A estrutura geral: minimizar f(x) sujeito a gᵢ(x) ≤ 0 (restrições de desigualdade), hⱼ(x) = 0 (restrições de igualdade), x ∈ X (domínio). Dependendo das propriedades de f e do domínio X:

- **Programação Linear (PL)**: f e restrições lineares. Solução em vértice do poliedro viável; método simplex (exponencial no pior caso, polinomial em prática); método de pontos interiores (polynomial).
- **Programação Inteira (PI)**: algumas variáveis restritas a inteiros. NP-hard em geral. Métodos: branch-and-bound, cutting planes, programação inteira mista (MIP).
- **Otimização Convexa**: f convexa, X convexo. Condições KKT são necessárias e suficientes. Solvers: CVXPY (Python), Gurobi, CPLEX.
- **Otimização Não-Convexa**: problema geral de ML. Sem garantia de ótimo global. Métodos de gradiente são estado-da-arte.

## Por que estuda

Para o matemático, otimização é onde cálculo multivariável, álgebra linear e análise funcional se encontram em problema prático. Teoria de dualidade (dualidade de Lagrange, programação semi-definida) é matematicamente profunda.

Para dev/ML: treinamento de qualquer modelo é otimização. Gradient descent e variantes (Adam, SGD, LBFGS) são algoritmos de otimização não-convexa. SVMs são programação quadrática convexa. Roteamento de delivery, agendamento de servidores, otimização de campanhas de ads — são problemas de PO.

## Conceitos-chave

- **Condições KKT (Karush-Kuhn-Tucker)**: para otimização diferenciável, o ponto x* é ótimo local sob qualificação de restrição se: ∇f(x*) + Σλᵢ∇gᵢ(x*) + Σμⱼ∇hⱼ(x*) = 0 (stationarity), gᵢ(x*) ≤ 0 (primal feasibility), λᵢ ≥ 0 (dual feasibility), λᵢgᵢ(x*) = 0 (complementarity). Para problemas convexos, KKT é necessário e suficiente.
- **Dualidade de Lagrange**: lagrangiano L(x,λ,μ) = f(x) + Σλᵢgᵢ(x) + Σμⱼhⱼ(x). Problema dual: max_λ,μ g(λ,μ) onde g(λ,μ) = min_x L(x,λ,μ). Dualidade fraca: d* ≤ p* (valor dual ≤ valor primal). Para problemas convexos com qualificação de Slater: dualidade forte (d* = p*) — o dual resolve o primal.
- **Método simplex**: PL tem solução em vértice do poliedro viável. Simplex percorre vértices melhorando o objetivo. Versão standard: forma canônica com variáveis de folga. Na prática converge rápido, embora seja exponencial no pior caso teórico.
- **Métodos de gradiente**: gradient descent: xₙ₊₁ = xₙ - α∇f(xₙ). SGD (estocástico): gradiente calculado em mini-batch. Adam: gradiente com momentum adaptativo de primeira e segunda ordem. Para f L-smooth e μ-strongly convex: convergência geométrica com taxa (1 - μ/L)ⁿ.
- **Método de Newton e quasi-Newton**: Newton: xₙ₊₁ = xₙ - H⁻¹∇f (H = Hessiana). Convergência quadrática perto do ótimo. Computacionalmente caro (O(n³) por iteração). BFGS/L-BFGS: aproximação rank-1 ou rank-2 da inversa da Hessiana, acumulada iterativamente. L-BFGS usa apenas os m últimos gradientes — escalável.
- **Programação inteira mista (MIP)**: variáveis contínuas e inteiras (binárias 0/1, ou inteiras gerais). Branch-and-bound: resolve relaxação contínua, ramifica em variável mais fracionária, poda ramificações dominadas. Gurobi e CPLEX são os solvers comerciais padrão; CBC e GLPK são open-source.
- **Otimização convexa e CVXPY**: conjunto convexo: para quaisquer x, y ∈ C e λ ∈ [0,1], λx+(1-λ)y ∈ C. Função convexa: f(λx+(1-λ)y) ≤ λf(x)+(1-λ)f(y). Soma de convexas é convexa; composição com linear é convexa; normas são convexas. CVXPY: `import cvxpy as cp; x = cp.Variable(); prob = cp.Problem(cp.Minimize(x**2 + 1), [x >= 2]); prob.solve()`.
- **Programação estocástica**: otimizar E[f(x,ξ)] onde ξ é variável aleatória. Duas abordagens: (1) SAA (Sample Average Approximation) — substitui E[f] por média amostral; (2) L-shaped method (problema de dois estágios). Base de otimização de portfólios (Markowitz), planejamento com demanda incerta.

## Confusões comuns

**"Mínimo local de função convexa é mínimo global"**: Verdade. Para funções convexas em conjuntos convexos, todo mínimo local é global. Isso é a propriedade mais importante de otimização convexa. Para não-convexos (como a loss de redes neurais), isso não vale.

**"Gradient descent com learning rate pequeno sempre converge"**: Para funções L-smooth e μ-strongly convex, converge geometricamente para α ≤ 1/L. Para funções não-convexas (caso ML), pode convergir para ponto estacionário (∇f=0) mas não necessariamente para mínimo. Para α muito pequeno, converge mas lento; para α > 2/L, diverge.

**"O simplex é ineficiente por ser exponencial"**: Exponencial no pior caso (os casos patológicos são artificiais). Na prática, simplex é muito eficiente e competitivo com métodos de pontos interiores. Para problemas esparsos de produção e logística, simplex com warm starts é frequentemente mais rápido.

**"Lagrange multipliers são só para igualdades"**: A formulação clássica de Lagrange é para igualdades. Para desigualdades, os multiplicadores de KKT generalizam: λᵢ ≥ 0 para gᵢ ≤ 0 (com complementaridade λᵢgᵢ = 0 — ou a restrição está ativa ou o multiplicador é zero).

**"Otimização estocástica é só adicionar ruído ao gradient descent"**: SGD adiciona estocasticidade no cálculo do gradiente — mas isso tem efeitos regulatórios (ruído pode ajudar a escapar de mínimos locais rasos) e teóricos (convergência sob diferentes condições). Não é equivalente a gradient descent exato com ruído aditivo.

## Aplicação em CS/Dev/ML

**Treinamento de ML como otimização**: loss = f(θ; dados). Gradient descent, Adam, LBFGS são os algoritmos. Para problemas convexos (logística, SVM), ótimo global garantido. Para redes profundas, práticas como batch norm, residual connections, e inicialização cuidadosa tornam a superfície de loss mais otimizável.

**SVMs**: minimizar (1/2)||w||² sujeito a yᵢ(w·xᵢ+b) ≥ 1. É programação quadrática convexa. Formulação dual via KKT dá o kernel trick. `sklearn.svm.SVC` usa libSVM internamente.

**Roteamento e logística**: TSP (Travelling Salesman Problem) é NP-hard. Mas variantes com restrições do mundo real (janelas de tempo, capacidade de veículo — VRP) são MIP e resolvidas comercialmente com solvers como OR-Tools (Google) ou Gurobi.

**Otimização de portfólio (Markowitz)**: minimizar variância do portfólio w'Σw sujeito a w'μ ≥ r_min e Σwᵢ = 1. É QP convexa. CVaR (Conditional Value at Risk) como objetivo transforma em LP.

**OR-Tools, CVXPY, scipy.optimize**: `from ortools.linear_solver import pywraplp` para PL/MIP. `import cvxpy as cp` para QP/SDP/LP. `scipy.optimize.linprog`, `scipy.optimize.milp` para PL/MIP básicos.

## Como praticar

- **Livro base**: Hillier & Lieberman — *Introduction to Operations Research* (referência clássica de PO). Boyd & Vandenberghe — *Convex Optimization* (Stanford, gratuito online, referência definitiva de otimização convexa).
- **Resolver PL graficamente**: 3-5 problemas de PL em 2 variáveis, desenhando o poliedro viável e identificando o vértice ótimo. Consolida intuição do simplex.
- **CVXPY**: resolva: regressão LASSO (min ||Ax-b||² + λ||x||₁), SVM primal, mínimo de uma função não-diferenciável convexa (norma L1). Todos com menos de 10 linhas de código.
- **OR-Tools**: modele e resolva um pequeno problema de roteamento de veículos com janelas de tempo. A complexidade de modelagem é o aprendizado.
- **Projeto**: implemente gradient descent, SGD, e Adam do zero para minimizar a cross-entropy logística sobre MNIST. Plote curvas de convergência e compare. Depois substitua por `torch.optim.Adam` e verifique equivalência.

## Exercícios práticos

1. **[Rank E]** Resolva graficamente o problema de programação linear: maximizar z = 3x + 5y sujeito a x ≤ 4, y ≤ 6, 3x + 2y ≤ 18, x ≥ 0, y ≥ 0. Identifique a região viável, os vértices do poliedro e o ponto ótimo. *Dica: os vértices são (0,0), (4,0), (4,3), (2,6), (0,6). Avalie z em cada vértice: (0,0)→0, (4,0)→12, (4,3)→27, (2,6)→36, (0,6)→30. Máximo em (2,6) com z=36.*

2. **[Rank D]** Para o problema de otimização convexa min f(x) = x₁² + x₂² sujeito a x₁ + x₂ = 1, derive as condições KKT e resolva o sistema resultante. Verifique que o minimizador satisfaz as condições de segunda ordem. *Dica: Lagrangiano L = x₁²+x₂²+λ(x₁+x₂-1). ∂L/∂x₁ = 2x₁+λ = 0, ∂L/∂x₂ = 2x₂+λ = 0. Logo x₁ = x₂ = -λ/2. Da restrição: -λ = 1, x₁=x₂=1/2. A Hessiana do Lagrangiano é 2I > 0 (condição suficiente de mínimo local).*

3. **[Rank C]** Prove que qualquer mínimo local de uma função convexa diferenciável é um mínimo global. Use a definição de convexidade: f(y) ≥ f(x) + ∇f(x)ᵀ(y-x) para todo x, y. *Dica: suponha que x* é mínimo local mas não global. Então existe y com f(y) < f(x*). Pela convexidade: f(x*) ≤ f(x* + t(y-x*)) = f((1-t)x*+ty) ≤ (1-t)f(x*)+tf(y) para t ∈ [0,1] (convexidade). Para t pequeno, x*+t(y-x*) está na vizinhança local de x*, mas f(x*+t(y-x*)) < f(x*) — contradição com x* mínimo local.*

4. **[Rank B]** Implemente o método do gradiente conjugado para resolver o sistema Ax = b com A simétrica definida positiva. Prove a propriedade de terminação em no máximo n passos (onde n é a dimensão) usando a A-conjugalidade das direções de busca. *Dica: as direções p₀, p₁, …, p_{n-1} são A-conjugadas: p_iᵀAp_j = 0 para i≠j. Como elas formam uma base de ℝⁿ, a solução exata é obtida em ≤ n passos. A convergência em espaços de alta dimensão (prática) é acelerada por pré-condicionamento.*

5. **[Rank A] [BOSS]** Prove a dualidade forte de programação linear: se o problema primal min cᵀx s.t. Ax = b, x ≥ 0 tem solução ótima x*, então o problema dual max bᵀy s.t. Aᵀy ≤ c tem solução ótima y* com cᵀx* = bᵀy* (sem gap de dualidade). Use o teorema de separação de hiperplanos (ou Farkas) para provar que, se x* é solução ótima, existe y* com cᵀx* = bᵀy*. *Dica: a dualidade fraca (cᵀx ≥ bᵀy para todos viáveis) é imediata: cᵀx = yᵀAx = yᵀb = bᵀy para y dual viável (Aᵀy ≤ c) e x primal viável (x ≥ 0). Para a dualidade forte, use o lema de Farkas: exatamente uma de {Ax = b, x ≥ 0 é inviável} e {Aᵀy ≤ 0, bᵀy > 0} tem solução. A otimalidade de x* implica que o sistema de melhoria {Aᵀy ≤ c - c, bᵀy > 0} é inviável, e o lema dá y*.*

## Próximos passos

- [calculo-multivariavel](calculo-multivariavel) — gradiente, Hessiana, e condições de otimalidade
- [algebra-linear](algebra-linear) — sistemas lineares são o núcleo de simplex e métodos de Newton
- [probabilidade](probabilidade) — programação estocástica e otimização em distribuições
- [teoria-grafos-mat](teoria-grafos-mat) — problemas de fluxo em redes, matching, TSP são grafos
- → Pratique no /math-quest na área **Aplicada** (Rank C+)
