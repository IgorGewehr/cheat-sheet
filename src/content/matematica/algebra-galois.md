---
title: Teoria de Galois (overview)
category: matematica
stack: [Mat]
tags: [algebra, fundamentos]
excerpt: A teoria que usa grupos de simetria para decidir quando equações polinomiais têm soluções por radicais.
related: [estruturas-algebricas, numeros-complexos, teoria-dos-numeros, analise-complexa]
updated: 2026-05
---

## O que é

Teoria de Galois responde à pergunta que motivou décadas de álgebra: "quando um polinômio tem solução por radicais?" (ou seja, quando a solução pode ser expressa com +, -, ×, ÷ e raízes n-ésimas aplicadas aos coeficientes). A resposta, dada por Évariste Galois em 1832, antes de morrer em duelo com 20 anos, é uma das histórias mais dramáticas da matemática.

A ideia central: associar a cada polinômio f(x) ∈ F[x] um grupo de permutações das suas raízes — o **grupo de Galois** Gal(f/F) = Gal(E/F), onde E é o corpo de decomposição de f sobre F. As simetrias do grupo correspondem a automorfismos do corpo que fixam F. Um resultado fundamental: f(x) é solúvel por radicais ↔ Gal(f/F) é grupo solúvel.

Por que os polinômios de grau ≤ 4 têm fórmula geral e os de grau ≥ 5 não? O grupo de Galois genérico para grau n é Sₙ. S₁, S₂, S₃, S₄ são solúveis; S₅ não é (porque A₅, único subgrupo normal não-trivial de S₅, é simples e não-abeliano). Isso é Abel-Ruffini em linguagem de Galois.

## Por que estuda

Para o matemático, teoria de Galois é o ponto de chegada de álgebra abstrata no bacharelado — onde grupos, anéis, corpos e extensões de corpos se unem numa teoria coesa. É também a porta de entrada para geometria algébrica, representações de grupos e números algébricos.

Para dev, a teoria de Galois é menos diretamente aplicada, mas o pensamento galoisiano — "quais simetrias possui esse objeto?" — é profundo em criptografia (automorfismos de curvas elípticas), teoria de códigos (corpos de Galois GF(pⁿ)), e até em física (grupos de simetria, teoria de gauge). A lógica de "invariante sob simetria → propriedade profunda" aparece em redes equivariantes, manifold learning, e topologia de dados.

## Conceitos-chave

- **Extensão de corpo**: K/F é extensão de corpos se F ⊆ K e K é corpo. Grau [K:F] = dim_F(K) como espaço vetorial sobre F. Ex: [ℂ:ℝ] = 2 (base {1, i}); [ℚ(√2):ℚ] = 2 (base {1, √2}).
- **Corpo de decomposição**: dado f(x) ∈ F[x], o corpo de decomposição E de f sobre F é a menor extensão de F onde f fatora completamente em lineares. É único a menos de isomorfismo.
- **Extensão de Galois**: E/F é extensão de Galois se é separável e normal. Separável: raízes do polinômio minimal de qualquer elemento de E são distintas. Normal: se f irredutível em F[x] tem uma raiz em E, tem todas em E.
- **Grupo de Galois**: Gal(E/F) = {φ: E→E | φ automorfismo, φ|_F = id_F}. Para extensão de Galois finita: |Gal(E/F)| = [E:F].
- **Correspondência de Galois**: existe bijeção ordem-reversível entre subgrupos H de Gal(E/F) e corpos intermediários K (F ⊆ K ⊆ E). H ↦ E^H = {e∈E: φ(e)=e ∀φ∈H}. K ↦ Gal(E/K). H normal em Gal(E/F) ↔ K/F é extensão de Galois.
- **Grupos solúveis**: G é solúvel se existe série normal G = G₀ ▷ G₁ ▷ … ▷ Gₖ = {e} com cada quociente Gᵢ/Gᵢ₊₁ abeliano. S₁, S₂, S₃, S₄ são solúveis. S₅ não é — portanto polinômio genérico de grau 5 não é solúvel por radicais.
- **Construtibilidade com régua e compasso**: um número real α é construtível com régua e compasso ↔ [ℚ(α):ℚ] = 2ⁿ. Isso explica: por que não se trisseca ângulo arbitrário (exigiria [extensão] = 3); por que não se duplica o cubo (exigiria raiz cúbica de 2, [ℚ(∛2):ℚ] = 3 ≠ 2ⁿ); por que n-ágono regular é construtível ↔ n = 2ᵃ·p₁·p₂·… (pᵢ primos de Fermat).
- **Extensões ciclotômicas**: ℚ(ζₙ) onde ζₙ = e^{2πi/n} é raiz n-ésima primitiva da unidade. Gal(ℚ(ζₙ)/ℚ) ≅ (ℤ/nℤ)* — grupo multiplicativo das unidades módulo n. Fundamental na teoria de números (distribuição de primos em progressões aritméticas).

## Confusões comuns

**"Galois provou que equações de grau ≥ 5 não têm solução"**: Não. Equações de grau ≥ 5 têm soluções em ℂ (Teorema Fundamental da Álgebra). O que Galois provou é que não existe fórmula geral expressando as soluções de um polinômio genérico de grau ≥ 5 usando apenas +, -, ×, ÷ e radicais dos coeficientes. Equações específicas de grau 5 podem ter solução por radicais (ex: x⁵ - 2 = 0 tem raiz ∜2).

**"O grupo de Galois age nas raízes de qualquer jeito"**: O grupo de Galois age como permutações das raízes, mas não pode permutá-las arbitrariamente — deve preservar as relações algébricas entre elas. Por isso Gal(f/F) ≤ Sₙ mas geralmente Gal(f/F) ≠ Sₙ.

**"Corpo de decomposição e corpo de divisão são a mesma coisa"**: No contexto de inglês: splitting field (corpo de decomposição), division ring (anel com divisão, não necessariamente comutativo — quaternions). São conceitos não-relacionados.

**"Se f(x) é irredutível de grau n, então Gal(f/F) = Sₙ"**: Não necessariamente. Irredutibilidade implica que o grupo age transitivamente nas raízes (uma órbita), então Gal(f/F) é transitivo em Sₙ. Mas pode ser menor que Sₙ — ex: x⁴ - 4x² + 1 é irredutível sobre ℚ com grupo de Galois ℤ/4ℤ ≠ S₄.

## Aplicação em CS/Dev/ML

**Corpos de Galois em criptografia**: GF(2⁸) (usado no AES) e GF(p) (curvas elípticas) são extensões de corpos finitos. A teoria de Galois fornece o framework para construir e analisar essas extensões: grau de extensão, subgrupos, automorfismos.

**Reed-Solomon e correção de erros**: códigos Reed-Solomon são construídos em GF(pⁿ). A estrutura algébrica (polinômios sobre corpo finito) permite decodificação eficiente. A teoria de extensões garante que GF(pⁿ) existe e tem a estrutura desejada.

**Grupos de simetria em ML**: a correspondência de Galois inspira o princípio de que "identificar simetrias de um problema permite reduzi-lo". Em redes neurais equivariantes (E(3)-equivariant, SO(3)-equivariant), as arquiteturas são construídas para respeitar simetrias de grupo — análogo à correspondência de Galois mas para redes.

**Teoria dos grafos algébrica**: ações de grupo em conjuntos (análogo da ação de Gal em raízes) aparecem em análise espectral de grafos de Cayley — grafos definidos por grupos.

**SageMath para teoria de Galois**: `K.<a> = NumberField(x^3 - 2); K.galois_group()`. SageMath tem suporte rico para extensões de números, grupos de Galois de polinômios e corpos de número.

## Como praticar

- **Livro base**: Stewart — *Galois Theory* (4a ed., acessível e com muitos exemplos). Para nível mais rigoroso: Lang — *Algebra* (cap. de teoria de Galois). Em português: Hefez — *Álgebra* tem capítulo de Galois.
- **Pré-requisito**: dominar estruturas algébricas (grupos, anéis, corpos) e extensões de corpos é obrigatório. Galois sem essas bases é incompreensível.
- **Calcular grupos de Galois pequenos**: encontre Gal(ℚ(√2, √3)/ℚ), Gal(ℚ(∜2)/ℚ), Gal(ℚ(ζ₅)/ℚ). Identifique os subgrupos e as correspondências via teorema de Galois.
- **SageMath**: `R.<x> = QQ[]; f = x^4 - 2; f.splitting_field('a')`, depois calcule o grupo de Galois. Compare com o esperado pela teoria.
- **Projeto histórico**: refaça o argumento de Abel-Ruffini: construa um polinômio de grau 5 cujo grupo de Galois é S₅ e argumente por que ele não é solúvel por radicais.

## Exercícios práticos

1. **[Rank E]** Calcule [ℚ(√2, √3) : ℚ] por torres de extensão: primeiro calcule [ℚ(√2) : ℚ] = 2 (base {1, √2}); depois mostre que √3 ∉ ℚ(√2) e conclua [ℚ(√2, √3) : ℚ(√2)] = 2; use a fórmula da torre [E:F] = [E:K][K:F]. *Dica: se √3 = a + b√2 com a, b ∈ ℚ, elevando ao quadrado: 3 = a² + 2b² + 2ab√2. Como √2 é irracional, ab = 0. Se a = 0: 3 = 2b² → b² = 3/2 ∉ ℚ. Se b = 0: a² = 3 → a = √3 ∉ ℚ. Contradição.*

2. **[Rank D]** Determine o grupo de Galois Gal(ℚ(√2, √3)/ℚ). Liste todos os automorfismos de E = ℚ(√2, √3) que fixam ℚ, identifique a estrutura do grupo e exiba a correspondência de Galois entre subgrupos e corpos intermediários. *Dica: qualquer automorfismo σ é determinado por σ(√2) ∈ {±√2} e σ(√3) ∈ {±√3}, dando 4 automorfismos. O grupo é ℤ/2 × ℤ/2 (Klein four-group). Os 3 subgrupos de índice 2 correspondem aos corpos intermediários ℚ(√2), ℚ(√3), ℚ(√6).*

3. **[Rank C]** Prove que x⁵ - 2 é irredutível em ℚ[x] (usando critério de Eisenstein com p = 2) e calcule o grau da extensão de decomposição [E:ℚ] onde E é o corpo de decomposição de x⁵ - 2. *Dica: Eisenstein com p=2: 2|0, 2|0, 2|0, 2|0, 2|(-2), mas 4∤(-2). Para o corpo de decomposição: as raízes são ∛2·ζ⁵ᵏ para k=0,1,2,3,4 onde ζ₅ = e^{2πi/5}. Então E = ℚ(∛2, ζ₅) com [ℚ(∛2):ℚ]=5 e [ℚ(∛2,ζ₅):ℚ(∛2)]=4, portanto [E:ℚ]=20.*

4. **[Rank B]** Prove que é impossível trissectar o ângulo de 60° com régua e compasso, usando teoria de Galois. O argumento: cos(20°) é raiz de 8x³ - 6x - 1, um cúbico irredutível sobre ℚ, portanto [ℚ(cos 20°):ℚ] = 3. Mas construções por régua e compasso produzem apenas extensões de grau 2ⁿ. *Dica: 3 não é potência de 2, portanto [ℚ(cos 20°):ℚ] = 3 implica que cos(20°) não é construtível. Verifique a irredutibilidade de 8x³-6x-1 sobre ℚ (ausência de raízes racionais + cúbico).*

5. **[Rank A] [BOSS]** Prove o teorema de Abel-Ruffini: o polinômio genérico de grau 5 não é solúvel por radicais. Estruture a prova em dois passos: (a) mostre que o grupo de Galois do polinômio genérico de grau n sobre ℚ é Sₙ; (b) prove que S₅ não é solúvel — que a série de composição S₅ ▷ A₅ ▷ {e} tem quociente A₅ simples e não-abeliano. *Dica: para S₅ não-solúvel: qualquer série normal de S₅ deve passar por A₅ (único subgrupo normal não-trivial de S₅). A₅ é simples (sem subgrupos normais próprios não-triviais) — prove isso verificando que toda classe de conjugação não-trivial de A₅ gera A₅. Como A₅ não é abeliano, S₅ não é solúvel, e portanto o polinômio genérico de grau 5 não é solúvel por radicais.*

## Próximos passos

- [estruturas-algebricas](estruturas-algebricas) — grupos, anéis e corpos são o pré-requisito
- [numeros-complexos](numeros-complexos) — Teorema Fundamental da Álgebra e raízes
- [analise-complexa](analise-complexa) — funções de variável complexa, conexão via funções elípticas
- [topologia-geral](topologia-geral) — grupos fundamentais são análogos topológicos dos grupos de Galois
- → Pratique no /math-quest na área **Álgebra** (Rank B+)
