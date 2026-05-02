---
title: Geometria Algébrica (Introdução)
category: matematica
stack: [Mat]
tags: [algebra, geometria, fundamentos]
excerpt: "Variedades afins, ideal radical, Nullstellensatz de Hilbert e esquemas — a síntese entre álgebra e geometria que define a matemática do século XX."
related: [estruturas-algebricas, algebra-galois, algebra-homologica, topologia-geral]
updated: 2026-05
---

## O que é

Geometria Algébrica estuda os conjuntos de soluções de sistemas de equações polinomiais — **variedades** — usando ferramentas da álgebra comutativa. A ideia central é que há uma dualidade profunda entre objetos geométricos (variedades) e objetos algébricos (ideais em anéis de polinômios): a geometria é codificada na álgebra e vice-versa.

A geometria algébrica clássica (séc. XIX, Riemann, Cayley, Kronecker) trabalhava com curvas e superfícies no espaço projetivo sobre ℂ. O programa de modernização do séc. XX — liderado por van der Waerden, Weil, Zariski, Serre e culminando com Alexander Grothendieck nos anos 1960 — reformulou a teoria em termos de anéis e esquemas, permitindo trabalhar sobre corpos arbitrários (inclusive corpos finitos e p-ádicos) e inteiros.

A visão de Grothendieck foi radicalmente generalizadora: em vez de estudar variedades como subconjuntos de espaço afim ou projetivo, definir "espaço geométrico" como um functor representável — um esquema. Essa perspectiva, central nos tomos de EGA e SGA, unificou aritmética e geometria ao ponto de permitir a prova do último teorema de Fermat por Wiles (1994), que é essencialmente um resultado de geometria algébrica sobre curvas elípticas.

## Por que estuda

Para o matemático, geometria algébrica é onde álgebra, análise complexa, topologia e teoria dos números convergem. As conjecturas de Weil (provadas por Deligne usando geometria algébrica), a teoria de Hodge, a correspondência de Langlands — são todos geometria algébrica em ação.

Para ML/CS: variedades algébricas aparecem em estatística (variedades de modelos estatísticos — Sumio Watanabe), em criptografia (curvas elípticas e abelianas sobre corpos finitos), em teoria de coding (códigos geométricos de Goppa), e recentemente em geometria de deep learning (estudar a variedade das funções representadas por redes neurais). O álgebra computacional (Gröbner bases, Macaulay2, SageMath) é geometria algébrica computacional aplicada.

## Conceitos-chave

- **Anel de polinômios e variedades afins**: k um corpo (tipicamente k = ℂ ou k = ℝ). O espaço afim 𝔸ⁿ = kⁿ. Para um conjunto S de polinômios em k[x₁,…,xₙ], a variedade afim V(S) = {(a₁,…,aₙ) ∈ kⁿ : f(a₁,…,aₙ) = 0 ∀f ∈ S}. As variedades afins são os fechados na topologia de Zariski: a topologia em 𝔸ⁿ onde os fechados são as variedades algébricas.
- **Ideal de uma variedade**: dado um subconjunto Z ⊆ 𝔸ⁿ, o ideal I(Z) = {f ∈ k[x₁,…,xₙ] : f(P) = 0 ∀P ∈ Z}. O radical de um ideal I é √I = {f : fⁿ ∈ I para algum n}. Um ideal é radical se I = √I.
- **Nullstellensatz de Hilbert (versão forte)**: sobre k algebricamente fechado, I(V(I)) = √I. Ou seja: um polinômio que se anula em toda a variedade V(I) pertence ao radical de I. Corolário (versão fraca): se f₁,…,fₘ ∈ ℂ[x₁,…,xₙ] não têm zero comum em ℂⁿ, então existem g₁,…,gₘ com Σ gᵢfᵢ = 1.
- **Correspondência de Galois (Zariski)**: sobre k algebricamente fechado, existe bijeção ordem-reversível entre variedades afins em 𝔸ⁿ e ideais radicais em k[x₁,…,xₙ]. Variedade irredutível ↔ ideal primo. Ponto ↔ ideal maximal (pelo Nullstellensatz, toda maximal em k[x₁,…,xₙ] é da forma (x₁-a₁,…,xₙ-aₙ) sobre k algebricamente fechado).
- **Anéis de coordenadas e morfismos**: o anel de coordenadas de V é k[V] = k[x₁,…,xₙ]/I(V). Morfismos de variedades V → W correspondem a homomorfismos de anéis k[W] → k[V] (polaridade entre geometria e álgebra). Isomorfismos de variedades ↔ isomorfismos de anéis de coordenadas.
- **Dimensão de uma variedade**: a dimensão de V é dim(V) = comprimento máximo de cadeias V₀ ⊊ V₁ ⊊ … ⊊ V_d = V de subvariedades irredutíveis, ou equivalentemente, dim de Krull do anel k[V]. Curva: dimensão 1. Superfície: dimensão 2. Ponto: dimensão 0. Dimensão de 𝔸ⁿ = n (e dim k[x₁,…,xₙ] = n).
- **Espaço projetivo e variedades projetivas**: 𝔸ⁿ\{0} / (x ~ λx) = ℙⁿ⁻¹ (espaço projetivo). Pontos de ℙⁿ são linhas em 𝔸ⁿ⁺¹. Variedades projetivas são subconjuntos de ℙⁿ definidos por polinômios homogêneos. Vantagem: compacidade, ausência de "pontos no infinito", melhor comportamento interseção (teorema de Bézout).
- **Esquemas (visão de longe)**: Grothendieck generalizou variedades para esquemas: um esquema é um espaço localmente anelado localmente isomorfo a Spec(R) (espectro de um anel comutativo R). Pontos de Spec(R) são os ideais primos de R. Funções em Spec(R) são elementos de R. Essa perspectiva permite unificar: Spec(ℤ) como "curva aritmética", curvas sobre corpos finitos como fibras, e a interpretação de primes como pontos.

## Confusões comuns

**"Topologia de Zariski é a topologia usual em ℝⁿ"**: A topologia de Zariski é muito mais grosseira que a topologia euclidiana. Em 𝔸¹(ℂ) = ℂ, os fechados de Zariski são os subconjuntos finitos (zeros de polinômios univariados) e ℂ inteiro. Portanto todo aberto de Zariski é codenso — dois abertos distintos não-vazios se intersectam. Isso viola Hausdorff e é muito diferente de ℝⁿ.

**"V(I) e I(V) são inversas uma da outra"**: Sem o Nullstellensatz, I(V(I)) pode ser maior que I: I(V(I)) = √I. Só sobre corpos algebricamente fechados e para ideais radicais a correspondência é exata. Sobre ℝ, por exemplo, V(x² + 1) = ∅, mas I(∅) = k[x] ≠ (x² + 1).

**"Esquemas são apenas variedades com mais nomenclatura"**: Esquemas generalizam variedades de modo essencial: permitem trabalhar com corpos não-algebricamente-fechados, com inteiros (Spec(ℤ)), com anéis nilpotentes (esquemas com "fuzz" nilpotente que capturam derivadas), e sobre bases gerais. A prova do teorema de Fermat usa curvas elípticas como esquemas sobre ℚ.

**"Variedade irredutível = variedade conexa"**: Irredutível implica conexo (na topologia de Zariski), mas o recíproco não vale em geral. V(x·y) = V(x) ∪ V(y) é redutível (dois eixos) mas V(x·y) em ℂ² é o espaço conexo.

## Aplicação em CS/Dev/ML

**Curvas elípticas em criptografia**: uma curva elíptica E sobre 𝔽_p é uma variedade projetiva de grau 3. O grupo de pontos E(𝔽_p) tem estrutura de grupo abeliano finito, usada em ECDH e ECDSA. As propriedades de segurança dependem do logaritmo discreto no grupo E(𝔽_p) — um problema de geometria algébrica sobre corpos finitos.

**Bases de Gröbner e álgebra computacional**: o algoritmo de Buchberger (1965) calcula bases de Gröbner de ideais polinomiais, generalizando o algoritmo de Gauss para sistemas polinomiais. Usado para resolver sistemas de equações polinomiais, determinar pertinência a ideais, calcular dimensão de variedades. Implementado em Macaulay2, SageMath, Singular.

**Estatística algébrica**: a variedade de um modelo estatístico paramétrico (conjunto de distribuições que ele pode representar) é uma variedade algébrica. Sumio Watanabe mostrou que a teoria de aprendizado Bayesiano depende da estrutura geométrica (singular learning theory) dessa variedade. Usado para análise de redes neurais e modelos de mistura.

**Códigos geométricos de Goppa**: códigos de correção de erro baseados em curvas sobre corpos finitos. Um código de Goppa é definido por uma curva C/𝔽_q, um divisor D, e um espaço de Riemann-Roch L(D). O teorema de Riemann-Roch (da geometria algébrica) dá as dimensões exatas do código.

## Como praticar

- **Livro base**: Cox, Little, O'Shea — *Ideals, Varieties, and Algorithms* (4a ed., Springer) — o texto mais acessível, focado em algoritmos e aplicações, sem teoria de esquemas. Para o próximo nível: Hartshorne — *Algebraic Geometry* (Springer GTM) — o livro padrão, difícil mas completo; requer álgebra comutativa sólida.
- **Pré-requisito**: álgebra comutativa (anéis noetherianos, localização, módulos, completude) é indispensável para Hartshorne. Reid — *Undergraduate Commutative Algebra* é boa preparação.
- **Macaulay2 / SageMath**: calcular bases de Gröbner, dimensão de variedades, grupos de Galois de polinômios. `R = QQ[x,y,z]; I = ideal(x^2+y^2+z^2-1, x+y-1); dim(I)`.
- **Projeto**: use SageMath para calcular o grupo de pontos de uma curva elíptica sobre 𝔽_p e verificar as propriedades de grupo.

## Exercícios práticos

1. **[Rank E]** Calcule V(x² + y² - 1) ⊂ ℝ² e V(x² + y² - 1) ⊂ ℂ². Qual é a diferença geométrica? Agora calcule V(x² + y² + 1) em ambos os corpos e discuta por que o Nullstellensatz exige que o corpo seja algebricamente fechado. *Dica: em ℝ, a variedade é o círculo unitário; em ℂ, é uma superfície de Riemann. Para x² + y² + 1: sem zeros reais, mas com zeros complexos.*

2. **[Rank D]** Calcule I(V(x²-y)) ⊂ ℝ[x,y] e verifique que √(x²-y) = (x²-y). Em seguida calcule I(V(x²)) e mostre que I(V(x²)) = √(x²) = (x), verificando que o Nullstellensatz vale (sobre ℂ) e por que I(V(x²)) ≠ (x²). *Dica: V(x²) = {(0, y): y ∈ k} = V(x). Portanto I(V(x²)) = I(V(x)) = (x). Mas (x²) ⊊ (x), mostrando que I∘V não é inversa de V∘I — apenas √I o é.*

3. **[Rank C]** Prove a versão fraca do Nullstellensatz: se f₁,…,fₘ ∈ ℂ[x₁,…,xₙ] são tais que V(f₁,…,fₘ) = ∅ (sem zeros comuns em ℂⁿ), então 1 ∈ (f₁,…,fₘ), isto é, existem gᵢ ∈ ℂ[x₁,…,xₙ] com Σ gᵢfᵢ = 1. *Dica: argumente por contradição — se 1 ∉ I = (f₁,…,fₘ), então I é contido num ideal maximal m. Pelo Nullstellensatz algébrico (Noether normalization + lema de Zariski), m = (x₁-a₁,…,xₙ-aₙ), então (a₁,…,aₙ) ∈ V(I) — contradição.*

4. **[Rank B]** Para a curva plana C = V(y² - x³ + x) ⊂ ℂ², verifique que C é irreduível (o polinômio y² - x³ + x é irredutível em ℂ[x,y]), calcule o anel de coordenadas ℂ[C] = ℂ[x,y]/(y²-x³+x), e determine a dimensão de Krull de ℂ[C]. Interprete: C é uma curva elíptica. *Dica: irredutibilidade — o polinômio tem grau ímpar em y com coeficiente líder 1; use o critério de Eisenstein ou verifique por fatoração direta. dim Krull = 1 porque ℂ[C] é domínio de dimensão 1.*

5. **[Rank A] [BOSS]** Enuncie e prove o teorema de Bézout na versão projetiva: duas curvas projetivas C₁ = V(f) e C₂ = V(g) em ℙ²_ℂ, sem componente comum, se intersectam em exatamente deg(f)·deg(g) pontos contados com multiplicidade. Aplique ao caso concreto de uma cônica (grau 2) e uma cúbica (grau 3) para obter 6 pontos de interseção. *Dica: a prova completa usa teoria da intersecção e multiplicidades definidas via localização. Para a versão afim, use o resultante de f e g como polinômios em y (eliminando uma variável) — o grau do resultante em x conta as interseções. O caso projetivo requer tratar pontos no infinito; a cônica e a cúbica genéricas se intersectam em exatamente 6 pontos distintos em ℙ²(ℂ).*

## Próximos passos

- [algebra-homologica](algebra-homologica) — cohomologia de feixes, sequências exatas, ferramentas para geometria algébrica
- [estruturas-algebricas](estruturas-algebricas) — álgebra comutativa como fundamento
- [algebra-galois](algebra-galois) — extensões de corpos, pontos racionais de variedades
- [topologia-geral](topologia-geral) — topologia de Zariski e topologia étale
- → Pratique no /math-quest na área **Álgebra** (Rank B+)
