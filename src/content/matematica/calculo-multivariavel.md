---
title: Cálculo de Múltiplas Variáveis
category: matematica
stack: [Mat, Python]
tags: [calculo, analise]
excerpt: Derivadas parciais, gradiente, integrais múltiplas e teoremas integrais — cálculo em ℝⁿ.
related: [calculo-1-variavel, calculo-vetorial-geometria-analitica, equacoes-diferenciais-parciais, algebra-linear]
updated: 2026-05
---

## O que é

Cálculo multivariável estende as idéias de derivação e integração de funções f: ℝ → ℝ para funções f: ℝⁿ → ℝᵐ. O domínio e o contradomínio agora são espaços de dimensão arbitrária, e isso muda profundamente a estrutura.

Para funções f: ℝⁿ → ℝ (campo escalar), a derivada generaliza para o **gradiente** ∇f = (∂f/∂x₁, …, ∂f/∂xₙ) — um vetor que aponta na direção de maior crescimento. Para funções f: ℝⁿ → ℝᵐ (campo vetorial), a derivada generaliza para a **matriz Jacobiana** J com entradas J_{ij} = ∂fᵢ/∂xⱼ. Para funções f: ℝⁿ → ℝ duas vezes diferenciáveis, a derivada de segunda ordem é a **matriz Hessiana** H com entradas H_{ij} = ∂²f/∂xᵢ∂xⱼ.

Integração generaliza para integrais duplas e triplas sobre regiões do plano e espaço, e para integrais de linha e de superfície. Os grandes teoremas integrais — Green, Stokes, Gauss (divergência) — unificam esses objetos em um único framework.

## Por que estuda

Cálculo multivariável é o idioma da física (campos elétrico e magnético, fluxo de fluidos, termodinâmica), da engenharia (análise estrutural, CFD) e, crucialmente para ML, da otimização. Treinar qualquer modelo de ML é minimizar uma função de custo sobre um espaço de parâmetros de dimensão alta — isso é otimização em ℝⁿ, que é cálculo multivariável.

O gradiente descendente, ADAM, LBFGS — todos são algoritmos de otimização em ℝⁿ. Entender como o gradiente, a Hessiana e as curvaturas do espaço de parâmetros afetam a convergência do treinamento é cálculo multivariável aplicado.

## Conceitos-chave

- **Derivada parcial**: ∂f/∂xᵢ mede a variação de f mantendo todas as outras variáveis fixas. É a derivada ordinária de f vista como função de uma variável xᵢ. Importante: existência de todas as derivadas parciais não implica diferenciabilidade (pode existir ∂f/∂x e ∂f/∂y em um ponto mas f não ser contínua ali).
- **Diferenciabilidade e jacobiana**: f: ℝⁿ → ℝᵐ é diferenciável em a se existe transformação linear L (= Df(a), a Jacobiana) tal que |f(a+h) - f(a) - L(h)| / |h| → 0 quando h → 0. Diferenciabilidade é mais forte que existência de derivadas parciais.
- **Gradiente e direção de crescimento**: ∇f(a) é o vetor das derivadas parciais. A derivada direcional de f na direção unitária û é D_û f(a) = ∇f(a) · û. O gradiente aponta na direção de maior crescimento; seu negativo aponta na direção de maior decrescimento.
- **Regra da cadeia multivariável**: se h = f∘g, a jacobiana de h em a é o produto matricial Jf(g(a)) · Jg(a). Esta é a versão matricial da regra da cadeia. Para campos escalares: ∂(f∘g)/∂xᵢ = Σⱼ (∂f/∂yⱼ)(∂yⱼ/∂xᵢ).
- **Hessiana e classificação de pontos críticos**: H_{ij} = ∂²f/∂xᵢ∂xⱼ. Em ponto crítico (∇f = 0): se H é definida positiva → mínimo local; definida negativa → máximo local; indefinida → ponto de sela. Verificar via autovalores ou critério de Sylvester (menores principais).
- **Multiplicadores de Lagrange**: para otimizar f sujeito à restrição g = 0, o ponto ótimo satisfaz ∇f = λ∇g. O escalar λ é o multiplicador de Lagrange. Generaliza para múltiplas restrições: ∇f = Σ λᵢ ∇gᵢ. Fundamento da dualidade em otimização.
- **Integrais múltiplas e Fubini**: ∫∫_D f(x,y) dx dy sobre região D. Pelo teorema de Fubini, se f é contínua, pode-se integrar em qualquer ordem. Mudança para coordenadas polares, cilíndricas ou esféricas simplifica integrais sobre regiões com simetria.
- **Teoremas integrais**: Green (curva plana fechada, integrais de campo sobre área enclosed), Stokes (superfície no espaço, relação com curva de bordo), Gauss/Divergência (relação entre integral de superfície fechada e integral de volume). Todos são casos especiais do teorema de Stokes generalizado em formas diferenciais.
- **Formas diferenciais e Stokes generalizado**: uma k-forma em ℝⁿ é seção do fibrado Λᵏ T*ℝⁿ. Em coordenadas: 0-formas = funções; 1-formas ω = Σ ωᵢ dxⁱ; 2-formas ω = Σ ωᵢⱼ dxⁱ ∧ dxʲ; k-formas com produto exterior anti-simétrico. Derivada exterior d: Ωᵏ → Ωᵏ⁺¹: dω = Σ (∂ωᵢ/∂xʲ) dxʲ ∧ dxⁱ. Propriedade: d² = 0. Integração de k-formas em k-variedades é invariante (não depende de coordenadas). **Teorema de Stokes generalizado**: ∫_M dω = ∫_{∂M} ω para variedade orientada M com bordo. Recupera Green (k=1, M ⊂ ℝ²), Stokes clássico (k=2, M ⊂ ℝ³), Gauss (k=3, M ⊂ ℝ³), TFC (k=0, M = [a,b]).
- **Integração em variedades**: para M variedade k-dimensional orientada em ℝⁿ, ∫_M ω é definido via parametrizações compatíveis e mudança de variáveis (Jacobiano = pull-back de formas). Volume k-dimensional: ω = √|g| dx¹ ∧ ... ∧ dxᵏ com g = métrica induzida. Essencial para análise em variedades, geometria riemanniana e física (formulação geométrica de eletromagnetismo).

## Confusões comuns

**"Existência de derivadas parciais implica diferenciabilidade"**: Falso. A função f(x,y) = xy/(x²+y²) para (x,y) ≠ (0,0) e f(0,0) = 0 tem derivadas parciais em (0,0) mas não é contínua (logo não é diferenciável) nesse ponto.

**"Ponto crítico com ∇f = 0 é necessariamente extremo"**: Pontos de sela também têm ∇f = 0. A Hessiana indefinida indica ponto de sela. Em ML isso importa: superfícies de perda de redes neurais profundas têm muitos pontos de sela, não necessariamente mínimos locais.

**"A ordem de integração em integral dupla nunca importa"**: Pelo teorema de Fubini, para f contínua em região compacta, as ordens são equivalentes. Mas mudança de ordem pode simplificar radicalmente o cálculo — e para funções com descontinuidades, as ordens podem dar resultados diferentes.

**"Gradiente descendente converge para mínimo global"**: Apenas para funções convexas. Para funções não-convexas (como a loss de redes neurais profundas), gradiente descendente pode ficar em mínimos locais ou pontos de sela. Isso é uma das limitações fundamentais do treinamento de redes neurais.

**"A Hessiana de f: ℝⁿ → ℝ é sempre simétrica"**: É simétrica quando as derivadas mistas são contínuas (teorema de Clairaut/Schwarz: ∂²f/∂xᵢ∂xⱼ = ∂²f/∂xⱼ∂xᵢ). Existem funções exóticas onde a Hessiana não é simétrica, mas na prática em ML a Hessiana é sempre assumida simétrica.

## Aplicação em CS/Dev/ML

**Treinamento de redes neurais**: a loss L(θ) é função dos parâmetros θ ∈ ℝⁿ. Backprop computa ∇L via regra da cadeia multivariável. Cada passo de gradient descent: θ ← θ - α∇L(θ). Métodos de segunda ordem (Newton, LBFGS) usam a Hessiana H para pré-condicionar o passo.

**Otimização com restrições**: SVMs com regularização, feature learning com restrições de norma — multiplicadores de Lagrange e teoria KKT (Karush-Kuhn-Tucker) são a extensão para restrições de desigualdade.

**Simulação física**: equações de fluidos (Navier-Stokes), eletromagnetismo (equações de Maxwell), transferência de calor — todos envolvem campos vetoriais e os teoremas de Gauss e Stokes.

**Computer vision**: filtros convolucionais aplicam integrais discretas; Normal Estimation em meshes 3D usa gradiente da superfície implícita; Shape From Shading usa derivadas parciais de imagem de intensidade.

**NumPy / JAX para cálculo multivariável**: `jax.grad` calcula gradiente de funções escalares; `jax.jacobian` calcula a jacobiana de funções vetoriais; `jax.hessian` calcula a Hessiana. `scipy.optimize` tem LBFGS, CG, e Newton-CG que usam gradiente e Hessiana.

## Como praticar

- **Livro base**: Guidorizzi — *Um Curso de Cálculo Vol. 2 e 3*. Stewart — *Cálculo Vol. 2*. Para mais rigor: Spivak — *Calculus on Manifolds* (conciso e elegante).
- **Computar gradientes à mão**: dados f(x,y,z) = x²y + yz³, calcule ∇f, ∂²f/∂x∂y, e a Hessiana em (1,1,1). Faça isso para 10 funções diferentes.
- **Multiplicadores de Lagrange**: minimize f(x,y) = x² + y² sujeito a x + y = 1. Depois minimize x² + y² + z² sujeito a x + y + z = 1. Generalize. Use SciPy para verificar.
- **JAX**: `import jax; import jax.numpy as jnp; grad_f = jax.grad(lambda x: jnp.sum(x**2)); grad_f(jnp.array([1.0, 2.0, 3.0]))`. Explore `jax.jacobian`, `jax.hessian`.
- **Projeto**: implemente gradient descent com line search (backtracking Armijo) para minimizar uma função não-convexa em ℝ². Visualize o caminho com curvas de nível.

## Exercícios práticos

1. **[Rank E]** Para f(x, y) = x²y + 3y² - 2x, calcule todas as derivadas parciais de primeira e segunda ordem: ∂f/∂x, ∂f/∂y, ∂²f/∂x², ∂²f/∂y², ∂²f/∂x∂y. Verifique a igualdade de Clairaut ∂²f/∂x∂y = ∂²f/∂y∂x. *Dica: ∂f/∂x = 2xy-2, ∂f/∂y = x²+6y. Segunda ordem: ∂²f/∂x² = 2y, ∂²f/∂y² = 6, ∂²f/∂x∂y = 2x.*

2. **[Rank D]** Use o método dos multiplicadores de Lagrange para encontrar os pontos extremos de f(x,y) = x² + y² sujeito a g(x,y) = x + 2y - 5 = 0. Interprete geometricamente: você está encontrando o ponto da reta mais próximo da origem. *Dica: ∇f = λ∇g implica 2x = λ e 2y = 2λ, logo y = 2x. Com x + 2y = 5: x + 4x = 5, x = 1, y = 2. Valor mínimo: f(1,2) = 5.*

3. **[Rank C]** Calcule a integral dupla ∬_D x·y dA sobre a região D limitada por y = x² e y = x (para 0 ≤ x ≤ 1). Esboce a região, determine a ordem de integração mais conveniente e execute o cálculo. *Dica: para 0 ≤ x ≤ 1, a região é x² ≤ y ≤ x. ∫₀¹ ∫_{x²}^{x} xy dy dx = ∫₀¹ x[y²/2]_{x²}^{x} dx = ∫₀¹ x(x²/2 - x⁴/2)dx = ∫₀¹ (x³/2 - x⁵/2)dx = 1/8 - 1/12 = 1/24.*

4. **[Rank B]** Para a função f(x,y) = x³ - 3xy², encontre todos os pontos críticos e classifique cada um (máximo local, mínimo local ou ponto de sela) usando a Hessiana. *Dica: ∇f = 0 dá 3x²-3y² = 0 e -6xy = 0. De -6xy = 0: x = 0 ou y = 0. Se x = 0: -3y² = 0, logo y = 0. Se y = 0: 3x² = 0, logo x = 0. Único ponto crítico: (0,0). A Hessiana em (0,0) tem determinante H = (∂²f/∂x²)(∂²f/∂y²) - (∂²f/∂x∂y)² = 0·0 - 0² = 0; o teste é inconclusivo — analise diretamente (ponto de sela).*

5. **[Rank A] [BOSS]** Prove o teorema da mudança de variáveis em integrais múltiplas: se Φ: U → V é difeomorfismo (bijeção C¹ com inversa C¹) entre abertos de ℝⁿ, então ∫_V f(y)dy = ∫_U f(Φ(x))|det JΦ(x)| dx. Aplique ao caso polar (x = r cos θ, y = r sin θ) calculando o Jacobiano e verificando que ∫∫_{x²+y²≤1} (x²+y²) dA = π/2. *Dica: para o teorema, use que a integral é aproximada por somas de Riemann sobre partições; Φ leva pequenos cubos de volume |det JΦ|·ΔV em paralelépipedos de volume |det JΦ|·ΔV (linearização). Para polar: J = [[cosθ, -rsinθ],[sinθ, rcosθ]], det J = r. A integral em polares: ∫₀^{2π}∫₀¹ r²·r dr dθ = 2π·r⁴/4|₀¹ = π/2.*

## Próximos passos

- [calculo-vetorial-geometria-analitica](calculo-vetorial-geometria-analitica) — divergente, rotacional, operadores diferenciais
- [equacoes-diferenciais-parciais](equacoes-diferenciais-parciais) — equações com derivadas parciais
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — otimização convexa e suas condições de otimalidade
- [analise-real](analise-real) — fundamentos rigorosos para funções de várias variáveis
- → Pratique no /math-quest na área **Análise** (Rank C+)
