---
title: Teoria das Categorias
category: matematica
stack: [Mat]
tags: [algebra, fundamentos, cs]
excerpt: "Categorias, functores, transformações naturais, adjunções — a linguagem que unifica toda a matemática e fundamenta a programação funcional moderna."
related: [estruturas-algebricas, algebra-homologica, logica-matematica, topologia-geral]
updated: 2026-05
---

## O que é

Teoria das Categorias é o estudo das estruturas matemáticas e das relações (morfismos) entre elas, abstraindo completamente a natureza dos objetos. Onde a teoria dos conjuntos pergunta "o que é um objeto?", a teoria das categorias pergunta "como os objetos se relacionam?". Um matemático de Bourbaki diria: é a linguagem mínima na qual toda a matemática pode ser escrita.

Uma **categoria** C consiste de: uma coleção de objetos Ob(C); para cada par de objetos A, B, um conjunto de morfismos Hom(A,B) (também escritos f: A → B); uma operação de composição ∘: Hom(B,C) × Hom(A,B) → Hom(A,C) associativa; e morfismos identidade id_A: A → A para cada A. A composição deve ser associativa: h∘(g∘f) = (h∘g)∘f; e as identidades devem ser neutros: id_B ∘ f = f = f ∘ id_A.

Exemplos paradigmáticos: **Set** (conjuntos e funções), **Grp** (grupos e homomorfismos), **Top** (espaços topológicos e funções contínuas), **Vect_k** (k-espaços vetoriais e transformações lineares). Em cada caso, os objetos têm estrutura interna, mas a teoria das categorias estuda apenas as relações externas — os morfismos.

A teoria foi fundada por Samuel Eilenberg e Saunders Mac Lane em 1945, originalmente como linguagem para topologia algébrica. Alexander Grothendieck a elevou à fundação da geometria algébrica moderna; William Lawvere a usou para fundamentar a própria lógica (toposes). F. William Lawvere e Myles Tierney, já nos anos 1970, mostraram que um topos elementar pode servir de fundação para quase toda a matemática.

## Por que estuda

Para o matemático, teoria das categorias é a linguagem que permite ver padrões repetidos em áreas distintas. O conceito de adjunção captura, num único arcabouço, a relação entre produto livre e esquecimento em álgebra, entre produto tensorial e Hom em módulos, entre quantificadores ∃ e ∀ em lógica. Reconhecer adjunções poupa trabalho e revela estrutura profunda.

Para o desenvolvedor: Haskell é essencialmente teoria das categorias aplicada. Functor, Applicative, Monad — são todos conceitos categóricos. A semântica denotacional de linguagens de programação usa categorias. Type theory (e os provadores de teoremas baseados nela: Coq, Lean, Agda) tem fundamentos categóricos via correspondência de Curry-Howard-Lambek. Em ML, a estrutura de grafos de computação de autodiferenciação pode ser formulada categoricamente.

## Conceitos-chave

- **Morfismos e suas propriedades**: f: A → B é monomorfismo se g∘h = g∘k ⟹ h = k (análogo à injetividade); epimorfismo se h∘f = k∘f ⟹ h = k (análogo à sobrejetividade); isomorfismo se existe g: B → A com g∘f = id_A e f∘g = id_B. Em Set, mono = injetivo, epi = sobrejetivo; em outras categorias, a correspondência pode falhar.
- **Functor (covariante)**: F: C → D associa a cada objeto A de C um objeto F(A) de D, e a cada morfismo f: A → B um morfismo F(f): F(A) → F(B), preservando identidades (F(id_A) = id_{F(A)}) e composição (F(g∘f) = F(g)∘F(f)). Functor contravariante inverte a direção dos morfismos. Exemplos: o functor esquecimento Grp → Set; o functor dual (·)* : Vect_k → Vect_k.
- **Transformação natural**: dado F, G: C → D functores, uma transformação natural α: F ⟹ G é uma família de morfismos α_A: F(A) → G(A) indexada por objetos A de C, tal que para todo f: A → B, G(f)∘α_A = α_B∘F(f) (o diagrama de naturalidade comuta). Naturalidade captura a ideia de que uma construção não depende de escolhas arbitrárias.
- **Isomorfismo natural e equivalência de categorias**: α é isomorfismo natural se cada α_A é isomorfismo. Duas categorias são equivalentes (C ≃ D) se existem functores F: C → D e G: D → C com G∘F ≅ Id_C e F∘G ≅ Id_D (isomorfismo natural). Equivalência é a noção correta de "mesmo" entre categorias — isomorfismo é estrita demais.
- **Limites e colimites**: limites generalizam produto, equalizer, pullback, objeto terminal; colimites generalizam coproduto, coqualizer, pushout, objeto inicial. Formalmente: o limite de F: J → C é um objeto L com morfismos πⱼ: L → F(j) satisfazendo condições de universalidade. A universalidade captura a ideia de "objeto mais eficiente resolvendo o problema".
- **Adjunção**: functores F: C → D e G: D → C são adjuntos (F ⊣ G) se existe bijeção natural Hom_D(F(A), B) ≅ Hom_C(A, G(B)). F é adjunto à esquerda, G à direita. Exemplos: produto livre ⊣ functor esquecimento; produto tensorial ⊣ Hom interno; ∃ ⊣ substituição ⊣ ∀ em lógica de primeira ordem. Toda adjunção produz uma mônada (via G∘F).
- **Mônadas**: uma mônada em C é uma tripla (T, η, μ) onde T: C → C é functor, η: Id_C ⟹ T é a unidade, μ: T² ⟹ T é a multiplicação, satisfazendo leis de associatividade e unidade. Mônadas são omnipresentes em programação funcional: Maybe, List, IO em Haskell são mônadas no sentido preciso.
- **Categoria de functores e o Lema de Yoneda**: o lema de Yoneda afirma que para qualquer functor F: C → Set, há bijeção natural Nat(Hom(A,−), F) ≅ F(A). Corolário: o functor de Yoneda y: C → Set^{C^op} é plenamente fiel — toda categoria mergulha (fielmente) na categoria de presheaves. É o teorema mais profundo da teoria das categorias elementar.

## Confusões comuns

**"Categorias são apenas outra maneira de falar de conjuntos"**: A teoria das categorias pode tratar conjuntos como objetos de Set, mas ela própria é uma linguagem diferente, com noções primitivas (objeto, morfismo, composição) distintas das noções de teoria dos conjuntos (elemento, pertinência). Lawvere mostrou que o próprio conceito de conjunto pode ser reconstruído a partir de axiomas categóricos (ETCS).

**"Functor covariante e contravariante são a mesma coisa com sinal trocado"**: A distinção é substantiva. O functor Hom(A,−): C → Set é covariante (morfismos f: B → C induzem Hom(A,f): Hom(A,B) → Hom(A,C)). O functor Hom(−,B): C^op → Set é contravariante (morfismos f: A → B induzem Hom(f,B): Hom(B,B) → Hom(A,B), invertendo a direção).

**"Toda mônada em Haskell é uma mônada no sentido categórico"**: Quase. O typeclass Monad em Haskell captura a estrutura essencial, mas a linguagem opera em Hask (a categoria de tipos Haskell e funções), que não é exatamente uma categoria no sentido estrito (por questões de laziness e bottom). As leis da mônada (identidade esquerda/direita, associatividade) correspondem precisamente às leis categóricas.

**"Limite e colimite são duais portanto equivalentes"**: São duais no sentido de que um é o outro na categoria oposta, mas o comportamento prático difere enormemente. Produto é limite; coproduto é colimite. Em Set: produto = produto cartesiano; coproduto = união disjunta. A dualidade é uma simetria formal, não uma equivalência funcional.

## Aplicação em CS/Dev/ML

**Haskell e programação funcional**: Functor (map), Applicative (ap, pure), Monad (bind, return) em Haskell são implementações diretas de conceitos categóricos. A Category typeclass de Haskell captura morfismos abstratos. Arrow (de John Hughes) é uma generalização de funções que captura morfismos em categorias enriquecidas.

**Semântica denotacional**: a semântica de linguagens de programação é definida como functor de uma categoria sintática para uma categoria de domínios (domínios de Scott, jogos de Hyland-Ong). Correctness de compiladores é provada via transformações naturais entre semânticas.

**Correspondência de Curry-Howard-Lambek**: proposições correspondem a tipos, provas correspondem a programas, e categorias cartesianas fechadas correspondem ao lambda-cálculo tipado. Essa tripla correspondência é o fundamento teórico de provadores de teoremas baseados em tipos (Coq, Lean 4, Agda).

**Grafos de computação e autodiferenciação**: grafos de computação em PyTorch/JAX são composição de morfismos numa categoria. A regra da cadeia (backpropagation) é composição de derivadas — o functor tangente de geometria diferencial. Trabalhos recentes (Elliot, Cruttwell) formalizam autodiferenciação em termos categóricos.

**Optics e lenses em Haskell/Scala**: lenses, prisms, traversals são morfismos em categorias de profunctors. A biblioteca `optics` de Haskell é implementação direta da teoria categórica de optics de Riley, Gavranovic, Hedges.

## Como praticar

- **Livro base**: Mac Lane — *Categories for the Working Mathematician* (2a ed.) — o texto canônico, denso e preciso. Para iniciantes: Riehl — *Category Theory in Context* (gratuito online, excelente pedagogia). Em pt-BR: não há bom texto — use Riehl em inglês.
- **Aplicação em Haskell**: estudar o typeclass Monad, Functor, Foldable, Traversable como instâncias de conceitos categóricos. Implementar instâncias manualmente e verificar as leis.
- **Lema de Yoneda na prática**: em Haskell, `newtype Yoneda f a = Yoneda { runYoneda :: forall b. (a -> b) -> f b }` é a representação de Yoneda. Provar a bijeção Yoneda ≅ f a.
- **nLab**: referência enciclopédica de teoria das categorias, geometria de alta temperatura e física matemática. Densa mas precisa.
- **Projeto**: formalize 3-5 teoremas básicos em Lean 4 usando Mathlib (que tem extensa biblioteca categórica): Lema de Yoneda, adjunções produzem mônadas, composição de adjunções é adjunção.

## Exercícios práticos

1. **[Rank E]** Verifique que Set (conjuntos e funções) é uma categoria: liste explicitamente os morfismos identidade, defina a composição, e verifique as leis de associatividade e unidade. *Dica: a identidade em Set é a função identidade id_A(x) = x; a composição é composição de funções. Verifique cada axioma formal.*

2. **[Rank D]** Mostre que o functor esquecimento U: Grp → Set (que envia um grupo ao seu conjunto subjacente e um homomorfismo à função subjacente) é de fato um functor. Verifique que U preserva identidades e composição. *Dica: o homomorfismo identidade id_G: G → G corresponde à função identidade U(id_G) = id_{U(G)}; use a definição de homomorfismo para composição.*

3. **[Rank C]** Prove o Lema de Yoneda para o caso especial F = Hom(B,−): mostre que Nat(Hom(A,−), Hom(B,−)) ≅ Hom(B,A). Interprete: as transformações naturais entre functores representáveis correspondem a morfismos (com a direção invertida). *Dica: construa a bijeção explicitamente — dada α: Hom(A,−) ⟹ Hom(B,−), avalie em A aplicando α_A a id_A.*

4. **[Rank B]** Mostre que o produto cartesiano em Set é um produto categórico: exiba os morfismos de projeção π₁: A×B → A e π₂: A×B → B e prove a propriedade universal — para qualquer objeto C com morfismos f: C → A e g: C → B, existe único h: C → A×B com π₁∘h = f e π₂∘h = g. *Dica: defina h(c) = (f(c), g(c)) e prove unicidade.*

5. **[Rank A] [BOSS]** Prove que toda adjunção F ⊣ G (com F: C → D e G: D → C) produz uma mônada T = G∘F em C. Exiba explicitamente a unidade η: Id_C ⟹ T (a partir da unidade da adjunção), a multiplicação μ: T² ⟹ T (a partir da counidade), e verifique as leis monadicas de associatividade (μ∘Tμ = μ∘μT) e unidade (μ∘ηT = id_T = μ∘Tη). *Dica: use a counidade ε: F∘G ⟹ Id_D da adjunção para construir μ_A = G(ε_{F(A)}): G(F(G(F(A)))) → G(F(A)); as leis seguem das identidades triangulares da adjunção.*

## Próximos passos

- [algebra-homologica](algebra-homologica) — functores derivados, sequências exatas, Tor e Ext
- [estruturas-algebricas](estruturas-algebricas) — grupos, anéis e corpos como objetos de categorias
- [logica-matematica](logica-matematica) — correspondência de Curry-Howard e lógica categórica
- [topologia-geral](topologia-geral) — categorias de espaços topológicos e functores homológicos
- → Pratique no /math-quest na área **Álgebra** (Rank C+)
