---
title: Teoria de Representação
category: matematica
stack: [Mat]
tags: [algebra, fisica, fundamentos]
excerpt: "Representações de grupos, caráteres, lema de Schur, representações de SU(2) — a álgebra das simetrias, fundamental em física quântica e ML geométrico."
related: [estruturas-algebricas, algebra-galois, geometria-diferencial, teoria-categorias]
updated: 2026-05
---

## O que é

Teoria de Representação estuda grupos (e álgebras) através de suas ações em espaços vetoriais. Uma **representação** de um grupo G num espaço vetorial V (sobre um corpo k) é um homomorfismo de grupo ρ: G → GL(V), onde GL(V) é o grupo das transformações lineares invertíveis de V. Em outros termos: uma representação atribui a cada elemento g ∈ G uma matriz invertível ρ(g), de modo que ρ(gh) = ρ(g)ρ(h).

A ideia é que espaços vetoriais são muito mais fáceis de analisar que grupos abstratos — e a representação "lineariza" o grupo, permitindo usar ferramentas de álgebra linear. Reciprocamente, a teoria classifica quais representações um grupo pode ter, revelando a estrutura do grupo.

Para grupos finitos, o resultado fundamental é o **teorema de Maschke**: sobre corpos de característica zero (ou cujo característico não divide |G|), toda representação é completamente redutível — decompõe-se como soma direta de representações irredutíveis. A teoria de caráteres (desenvolvida por Frobenius no fim do séc. XIX) classifica as representações irredutíveis via uma função invariante, o **caráter** χ(g) = Tr(ρ(g)).

Para grupos de Lie (grupos contínuos com estrutura de variedade diferenciável), como SO(3), SU(2), SU(3), a teoria é desenvolvida via álgebras de Lie — a linearização infinitesimal do grupo. Elie Cartan (1894) classificou completamente as álgebras de Lie semissimples, revelando a estrutura por trás de toda a física quântica e da simetria em matemática.

## Por que estuda

Para o matemático, representação é a ferramenta para estudar grupos concretos: quais grupos finitos existem, o que grupos de Lie fazem, que papel as simetrias jogam em análise (funções esféricas, análise harmônica em grupos). A prova do último teorema de Fermat usa representações do grupo de Galois. A prova da conjectura de Ramanujan usa representações de grupos automórficos.

Para ML/CS: redes neurais equivariantes (E(3)-equivariantes, SE(3)-equivariantes) são construídas usando representações de grupos de Lie para processar dados com simetrias (moléculas 3D, point clouds, grafos). A biblioteca e3nn implementa representações de SO(3) e O(3) eficientemente. O teorema de Peter-Weyl descreve a análise de Fourier em grupos compactos — a base teórica para convoluções em grafos e em variedades.

## Conceitos-chave

- **Representação, sub-representação e representação irredutível**: ρ: G → GL(V) é representação. Sub-representação: subconjunto W ⊆ V invariante por G (ρ(g)W ⊆ W para todo g). Representação irredutível: sem sub-representação própria não-nula. Em dimensão 1, toda representação é irredutível (1-dim). Ex: representação trivial ρ(g) = 1 para todo g; representação sinal de Sₙ: ρ(σ) = sgn(σ) ∈ {±1}.
- **Teorema de Maschke**: se G é grupo finito e char(k) ∤ |G|, toda representação é completamente redutível: V = V₁ ⊕ … ⊕ Vₘ com cada Vᵢ irredutível. A prova usa a existência de projeção equivariante: para W ⊆ V invariante, projetar P = (1/|G|)Σ_{g∈G} ρ(g)∘π∘ρ(g)⁻¹ onde π é qualquer projeção V → W. P é equivariante e P² = P, dando o complemento invariante.
- **Caráter de uma representação**: χ_ρ: G → k definido por χ_ρ(g) = Tr(ρ(g)). É invariante por conjugação (χ(hgh⁻¹) = χ(g)), portanto é função de classe. Propriedades: χ_ρ(e) = dim(V); χ_{ρ⊕σ} = χ_ρ + χ_σ; χ_{ρ⊗σ} = χ_ρ·χ_σ; χ_{ρ*}(g) = χ_ρ(g⁻¹) = \overline{χ_ρ(g)} (para representações unitárias).
- **Relações de ortogonalidade e tabela de caráteres**: para G finito com representações irredutíveis ρ₁, …, ρₖ sobre ℂ: ⟨χᵢ, χⱼ⟩ = (1/|G|)Σ_{g∈G} χᵢ(g)\overline{χⱼ(g)} = δᵢⱼ (ortonormalidade). O número de representações irredutíveis = número de classes de conjugação de G. A tabela de caráteres é uma matriz quadrada que codifica toda a teoria de representação de G sobre ℂ.
- **Lema de Schur**: se ρ: G → GL(V) e σ: G → GL(W) são irredutíveis, então qualquer mapa equivariante φ: V → W (com φ∘ρ(g) = σ(g)∘φ para todo g) é ou zero ou isomorfismo. Corolário: sobre ℂ (e algebricamente fechado), o único mapa equivariante V → V é escalar (múltiplo de id). O lema de Schur é a pedra angular de toda a teoria — implica as relações de ortogonalidade.
- **Representações de SU(2)**: SU(2) ≅ S³ (como esfera em ℂ²). As representações irredutíveis de SU(2) são indexadas por j = 0, 1/2, 1, 3/2, 2, … (spin) e têm dimensão 2j+1. A representação de spin j é o espaço de polinômios homogêneos de grau 2j em duas variáveis. O operador de Casimir J² = Jₓ² + J_y² + J_z² atua como j(j+1)·id em cada representação. Em física quântica: partículas de spin j têm 2j+1 estados de polarização.
- **Álgebras de Lie e representações infinitesimais**: para grupos de Lie G, a álgebra de Lie g = T_e G é o espaço tangente em e. Uma representação de G induz uma representação da álgebra de Lie: dρ: g → gl(V) por dρ(X) = d/dt|_{t=0} ρ(exp(tX)). Para G simplesmente conexo, representações de g e representações de G estão em bijeção. Classificação de Cartan: álgebras de Lie semissimples simples sobre ℂ são A_n = sl_{n+1}, B_n = so_{2n+1}, C_n = sp_{2n}, D_n = so_{2n}, mais E₆, E₇, E₈, F₄, G₂.
- **Teorema de Peter-Weyl**: para G grupo de Lie compacto, L²(G) se decompõe como soma direta de representações irredutíveis, cada uma com multiplicidade igual à sua dimensão. Generaliza a análise de Fourier em S¹ (onde o grupo é U(1) e as representações irredutíveis são e^{inθ}) para grupos compactos gerais.

## Confusões comuns

**"Representação de G e ação de G num conjunto são a mesma coisa"**: Ação em conjunto e representação (ação linear em espaço vetorial) são conceitos distintos. A representação de permutação associada a uma ação em {1,…,n} é um homomorfismo G → Sₙ → GL(ℝⁿ) (via matrizes de permutação) — essa é uma representação, mas nem toda representação vem de uma ação de permutação.

**"SU(2) e SO(3) têm as mesmas representações"**: Não. SU(2) e SO(3) têm o mesmo grupo de Lie, mas SU(2) → SO(3) é um recobrimento duplo (π₁(SO(3)) = ℤ/2). As representações de spin inteiro de SU(2) descem para representações de SO(3); as de spin semi-inteiro (1/2, 3/2, …) não descam — são representações spinoriais que mudam de sinal por rotação de 2π. Isso explica porque o elétron (spin 1/2) requer rotação de 4π para voltar ao estado original.

**"A tabela de caráteres determina o grupo"**: A tabela de caráteres é um invariante muito forte — determina as dimensões de todas as representações, a álgebra de grupo ℂG como álgebra semissimples. Mas dois grupos não-isomorfos podem ter a mesma tabela de caráteres (por exemplo, o grupo quaterniônico Q₈ e o grupo dihedral D₄ têm a mesma tabela de caráteres).

**"Representações irredutíveis devem ter dimensão 1"**: Não. Para grupos abelianos, toda representação irredutível (sobre ℂ) tem dimensão 1 (consequência do lema de Schur). Para grupos não-abelianos, representações irredutíveis podem ter qualquer dimensão. A representação natural de Sₙ em ℝⁿ é n-dimensional e é redutível (= trivial ⊕ irredutível de dim n-1).

## Aplicação em CS/Dev/ML

**Redes neurais equivariantes**: a equivariância a um grupo G (saída transforma-se de modo previsível quando a entrada é transformada) é implementada usando representações. Se ρᵢₙ e ρₒᵤₜ são representações de G, uma camada equivariante linear deve satisfazer W·ρᵢₙ(g) = ρₒᵤₜ(g)·W para todo g — isso restringe W a um subespaço de dimensão reduzida. A biblioteca e3nn implementa camadas equivariantes a SO(3) usando harmonicais esféricas (representações irredutíveis de SO(3)).

**Análise harmônica em grafos**: convolução em grafos (Graph Neural Networks) é definida via autovetores do Laplaciano de grafos — as "funções de Fourier" do grafo, que são análogos das funções das representações no caso Abeliano. A teoria espectral de grafos é análise harmônica em grupos de simetria de grafos.

**Harmonicais esféricas em rendering e ML**: harmonicais esféricas Y_l^m são as representações irredutíveis de SO(3) em dimensão 2l+1. Usadas em renderização para codificar iluminação, em química quântica para orbitais atômicos, e em ML de moléculas (SchNet, DimeNet, NequIP) para representar campos escalares e vetoriais com equivariância a rotações.

**Criptografia pós-quântica e representações**: criptossistemas como CRYSTALS-Kyber operam em módulos sobre ℤ_q[x]/(xⁿ+1), que é um anel de grupos cíclicos. A análise de segurança usa estrutura de representação de grupos cíclicos sobre corpos finitos.

## Como praticar

- **Livro base**: Serre — *Linear Representations of Finite Groups* (Springer GTM) — clássico, conciso e rigoroso, 96 páginas, cobre toda a teoria de grupos finitos. Para grupos de Lie: Hall — *Lie Groups, Lie Algebras, and Representations* (Springer GTM) — acessível e matematicamente preciso.
- **Calcular tabelas de caráteres manualmente**: S₃, D₄, Q₈. Para S₃: 3 classes de conjugação, portanto 3 representações irredutíveis. Dimensões satisfazem 1² + 1² + 2² = 6 = |S₃|. Calcular os caráteres explicitamente.
- **SageMath**: `G = SymmetricGroup(4); G.character_table()` para calcular tabelas de caráteres. Verificar as relações de ortogonalidade numericamente.
- **Projeto e3nn**: implementar uma camada linear equivariante a SO(3) usando harmonicais esféricas reais de grau l = 0, 1, 2. Verificar equivariância numericamente aplicando uma rotação aleatória.

## Exercícios práticos

1. **[Rank E]** Escreva todas as representações de dimensão 1 do grupo S₃ (grupo de permutações de 3 elementos). Há exatamente duas: a representação trivial e a representação sinal. Verifique que ambas são homomorfismos G → GL₁(ℂ) = ℂ* e que satisfazem ρ(σ∘τ) = ρ(σ)·ρ(τ). *Dica: representações 1-dim correspondem a homomorfismos G → ℂ*. Como S₃ é gerado por σ = (12) e τ = (123) com σ² = e, τ³ = e, (στ)² = e, os valores ρ(σ) e ρ(τ) devem satisfazer as mesmas relações em ℂ*.*

2. **[Rank D]** Prove o lema de Schur: se φ: V → W é um mapa equivariante entre representações irredutíveis ρ (em V) e σ (em W) de um grupo G, então φ = 0 ou φ é isomorfismo. *Dica: Ker(φ) é sub-representação de V (pois φ equivariante implica Ker equivariante). Como V irredutível, Ker(φ) = 0 ou Ker(φ) = V. Analogamente, Im(φ) é sub-representação de W.*

3. **[Rank C]** Para o grupo cíclico ℤ/n, classifique todas as representações irredutíveis complexas de dimensão 1. Mostre que há exatamente n delas, indexadas por k = 0, 1, …, n-1, dadas por ρₖ([1]) = e^{2πik/n}. Use as relações de ortogonalidade para verificar ⟨χⱼ, χₖ⟩ = δⱼₖ. *Dica: ℤ/n é abeliano, portanto toda representação irredutível é 1-dim (lema de Schur). Um homomorfismo ρ: ℤ/n → ℂ* é determinado por ρ(1) = ζ com ζⁿ = 1 (pois nρ(1) = ρ(n·1) = ρ(0) = 1).*

4. **[Rank B]** Compute a tabela de caráteres de S₃ completa: encontre as três representações irredutíveis (trivial, sinal, representação padrão 2-dim), calcule os caráteres em cada uma das três classes de conjugação {e}, {(12),(13),(23)}, {(123),(132)}, e verifique as relações de ortogonalidade ⟨χᵢ, χⱼ⟩ = δᵢⱼ e Σᵢ (dim ρᵢ)² = |S₃| = 6. *Dica: a representação padrão é V = {(x,y,z) ∈ ℂ³ : x+y+z=0}, com S₃ atuando por permutação das coordenadas. Calcule o traço de cada permutação nessa representação.*

5. **[Rank A] [BOSS]** Classifique todas as representações irredutíveis de SU(2): mostre que cada representação irredutível de dimensão finita é (a menos de isomorfismo) unicamente determinada por seu peso máximo j ∈ {0, 1/2, 1, 3/2, …}, tem dimensão 2j+1, e é a representação V_j no espaço de polinômios homogêneos de grau 2j em duas variáveis (z₁, z₂). Para isso: (a) use a álgebra de Lie su(2) = span{J₊, J₋, J_z} com relações [J_z, J₊] = J₊, [J_z, J₋] = -J₋, [J₊, J₋] = 2J_z; (b) mostre que num módulo irredutível de dimensão finita existe um vetor de peso máximo v (J₊·v = 0, J_z·v = j·v); (c) prove que a cadeia v, J₋v, J₋²v, …, J₋^{2j}v forma uma base de V_j; (d) verifique que J₋^{2j+1}v = 0. *Dica: numa representação irredutível, J_z é diagonalizável com autovalores (pesos) que formam uma progressão aritmética de passo 1. O peso máximo j deve ser inteiro ou semi-inteiro para garantir que a cadeia termine em J₋^{2j}v com peso -j. O operador de Casimir J² = J_zJ_z + (1/2)(J₊J₋ + J₋J₊) = j(j+1)·id verifica a classificação.*

## Próximos passos

- [estruturas-algebricas](estruturas-algebricas) — grupos, anéis e módulos como base
- [geometria-diferencial](geometria-diferencial) — grupos de Lie como variedades com estrutura de grupo
- [algebra-homologica](algebra-homologica) — cohomologia de grupos via resoluções
- [teoria-categorias](teoria-categorias) — representação como functor G → Vect
- → Pratique no /math-quest na área **Álgebra** (Rank B+)
