---
title: Topologia Algébrica
category: matematica
stack: [Mat]
tags: [topologia, algebra, fundamentos]
excerpt: "Grupo fundamental, espaços de recobrimento, homologia singular e CW-complexos — a topologia que usa álgebra para distinguir formas."
related: [topologia-geral, estruturas-algebricas, algebra-homologica, geometria-diferencial]
updated: 2026-05
---

## O que é

Topologia Algébrica associa invariantes algébricos (grupos, anéis, módulos) a espaços topológicos, de forma que homeomorfismos induzem isomorfismos algébricos. A ideia: se dois espaços têm invariantes diferentes, não podem ser homeomorfos — permitindo distinguir formas usando álgebra.

O campo nasceu com Poincaré (1895), que introduziu o grupo fundamental e os números de Betti. Brouwer, Veblen, Alexander e Lefschetz desenvolveram as bases. A formulação moderna — homologia singular, cohomologia, sequências exatas — foi estabelecida por Eilenberg-Steenrod nos anos 1940-50. Grothendieck e Atiyah desenvolveram cohomologia de sheaves e K-teoria nos anos 1960.

## Por que estuda

Para o matemático, topologia algébrica é onde análise, álgebra e geometria se fundem mais profundamente. O teorema de ponto fixo de Brouwer e o teorema da invariância de domínio não têm prova elementar — a prova standard usa homologia. A conjectura de Poincaré (provada por Perelman em 2003, com Prêmio Millennium) é um problema de topologia algébrica. A K-teoria topológica conecta topologia com teoria de operadores e física (anomalias quânticas).

Para ML/CS: TDA (Topological Data Analysis) usa homologia persistente — diretamente derivada da teoria aqui — para extrair características topológicas de dados sem modelo paramétrico. UMAP constrói um complexo simplicial aproximando a topologia dos dados. Análise da topologia do espaço de pesos de redes neurais usa grupos de homotopia de variedades.

## Conceitos-chave

- **Grupo fundamental π₁**: π₁(X, x₀) é o grupo das classes de homotopia de laços baseados em x₀ ∈ X. Composição: concatenação de laços. Dois laços são homotópicos se um se deforma no outro com x₀ fixo. Exemplos: π₁(ℝⁿ) = 0 (simplesmente conexo); π₁(S¹) = ℤ; π₁(Toro T²) = ℤ×ℤ; π₁(bouquet de n círculos) = grupo livre Fₙ. Um espaço X é simplesmente conexo se é conexo por caminhos e π₁(X) = 0.
- **Teorema de Seifert-van Kampen**: se X = A ∪ B com A, B, A∩B abertos e path-connected, e x₀ ∈ A∩B, então π₁(X) é o produto amalgamado π₁(A)*_{π₁(A∩B)}π₁(B). Permite calcular π₁ de espaços colados. Exemplo: π₁(S¹ ∨ S¹) = ℤ*ℤ (grupo livre de rank 2) — dois círculos colados num ponto dão grupo livre.
- **Espaços de recobrimento**: p: X̃ → X é recobrimento se todo x ∈ X tem vizinhança U com p⁻¹(U) = disjunção de abertos cada um homeomorfo a U via p. O recobrimento universal X̃ tem π₁(X̃) = 0. Classificação: subgrupos H ≤ π₁(X) ↔ recobrimentos conexos de X (bijeção). Exemplo: ℝ → S¹ via e^{2πit} é o recobrimento universal de S¹, correspondendo a H = {0} ≤ ℤ.
- **CW-complexos**: construídos inductivamente — começa com pontos (0-células), cola 1-células (segmentos) via mapas ∂D¹ → X⁰, cola 2-células (discos) via ∂D² → X¹, etc. Estrutura computável e boa para topologia algébrica. Sⁿ tem estrutura CW com uma 0-célula e uma n-célula. ℝPⁿ tem uma k-célula em cada dimensão 0 ≤ k ≤ n.
- **Homologia singular**: Hₙ(X) = Ker(∂ₙ)/Im(∂ₙ₊₁) onde Cₙ(X) é o grupo livre sobre os n-simplexos singulares (mapas σ: Δⁿ → X) e ∂ₙ é o operador de bordo Σ(-1)ⁱ σ∘dᵢ. Interpreção: H₀ conta componentes conexas; H₁ = π₁^{ab} (abelianização de π₁, pelo teorema de Hurewicz); H₂ conta "buracos esféricos", etc. Exemplos: Hₙ(Sⁿ) = ℤ, Hₖ(Sⁿ) = 0 para 0 < k < n; H*(Toro) = (ℤ, ℤ², ℤ, 0, …).
- **Sequência de Mayer-Vietoris**: para X = A ∪ B com A, B e A∩B espaços razoáveis, existe sequência exata longa: … → Hₙ(A∩B) → Hₙ(A) ⊕ Hₙ(B) → Hₙ(X) → Hₙ₋₁(A∩B) → … Permite calcular homologia de espaços complexos via espaços simples.
- **Cohomologia e dualidade de Poincaré**: Hⁿ(X; R) = Hom(Hₙ(X), R) (cohomologia singular). Para variedades orientadas compactas M de dimensão n: dualidade de Poincaré Hₖ(M) ≅ Hⁿ⁻ᵏ(M). Cohomologia tem estrutura adicional: produto cup Hᵢ × Hʲ → Hⁱ⁺ʲ torna H*(M) numa álgebra graduada.
- **Grupos de homotopia superiores πₙ**: πₙ(X, x₀) = classes de homotopia de mapas (Sⁿ, *) → (X, x₀). π₀ conta componentes; π₁ é o grupo fundamental; πₙ para n ≥ 2 é sempre abeliano (Eckmann-Hilton). Exemplos: πₙ(Sⁿ) = ℤ (grau); π₃(S²) = ℤ (fibração de Hopf — surpreendentemente não-trivial!); πₙ(Sᵐ) para n ≤ m são difíceis de calcular em geral.

## Confusões comuns

**"Homeomorfo e homotopicamente equivalente são a mesma coisa"**: Homeomorfismo preserva toda a estrutura topológica (bijeção contínua com inversa contínua). Equivalência homotópica é mais fraca: f: X → Y com g: Y → X tal que g∘f ≃ id_X e f∘g ≃ id_Y (homotópicos, não necessariamente iguais). ℝⁿ é homotopicamente equivalente a um ponto (contrátil) mas não é homeomorfo a um ponto para n ≥ 1.

**"H₁(X) = π₁(X)"**: H₁ é a abelianização de π₁ (pelo teorema de Hurewicz), não π₁ em si. Para espaços simplesmente conexos (π₁ = 0), H₁ = 0 também. Para o toro: π₁(T²) = ℤ×ℤ (já abeliano), então H₁(T²) = ℤ×ℤ. Mas para o bouquet de dois círculos: π₁ = ℤ*ℤ (grupo livre não-abeliano) e H₁ = ℤ×ℤ (sua abelianização).

**"Invariantes topológicos (π₁, Hₙ) são fáceis de calcular"**: Para CW-complexos, existem algoritmos computáveis. Mas grupos de homotopia superiores πₙ são em geral muito difíceis — calcular π₃(S²) requer a fibração de Hopf; os grupos πₙ(Sᵐ) para n > m são o objeto de pesquisa ativa em matemática. Homologia singular é mais computável por sequências exatas.

**"Cohomologia é apenas o dual da homologia — logo são equivalentes"**: A cohomologia Hⁿ(X;R) carrega informação adicional: o **produto cup** Hⁱ × Hʲ → Hⁱ⁺ʲ que faz H*(X;R) uma álgebra graduada. Este produto distingue espaços com a mesma homologia mas álgebra de cohomologia diferente. Por exemplo, CP² e S² ∨ S⁴ têm os mesmos grupos de homologia mas álgebras de cohomologia diferentes.

**"Espaços com todos os grupos de homologia iguais são homeomorfos"**: Não. Espaços com todos Hₙ iguais podem não ser homeomorfos. O teorema de Whitehead diz que mapas entre CW-complexos que induzem isomorfismos em todos os grupos de homotopia πₙ são equivalências homotópicas — mas grupos de homologia iguais não implicam equivalência homotópica sem essa hipótese de mapa.

## Aplicação em CS/Dev/ML

**Homologia persistente e TDA (Topological Data Analysis)**: dado conjunto de pontos X no espaço, construir o complexo de Vietoris-Rips Rips(X, ε) para ε crescente. Rastrear quando características topológicas H₀ (componentes), H₁ (loops), H₂ (cavidades) nascem e morrem como ε varia. O **código de barras de persistência** ou **diagrama de persistência** é a assinatura topológica de X. Aplicações: análise de dados biomédicos, materiais amorfos, redes neurais (topologia de espaço de ativações), bioinformática.

**UMAP e redução de dimensionalidade**: UMAP constrói um grafo simplicial (aproximação do nervo de uma cobertura dos dados) para capturar a topologia dos dados de alta dimensão, depois otimiza a representação em 2D/3D para preservar essa topologia. A teoria matemática formal de UMAP usa categorias de coberturas fuzzy — que são análogos topológicos dos simplexos.

**K-teoria topológica em física**: a K-teoria (Atiyah-Hirzebruch) classifica fibrações vetoriais sobre espaços topológicos. Em física de matéria condensada, K-teoria classifica isolantes topológicos e supercondutores — a topologia do espaço de Brillouin determina propriedades de condução robustas a perturbações. Grupos K⁰(X) e K¹(X) são os invariantes relevantes.

**Recobrimentos e teoria de tipos**: a correspondência entre subgrupos de π₁(X) e recobrimentos de X é análoga (via correspondência de Galois) à correspondência entre subgrupos de Gal(k̄/k) e extensões de corpos. Em teoria de tipos dependentes e teoria homotópica de tipos (HoTT), recobrimentos são fibrados com fibra discreta — a noção de identificação entre tipos usa estrutura de fibração.

## Como praticar

- **Livro base**: Hatcher — *Algebraic Topology* (Cambridge, disponível gratuito no site do autor) — o texto padrão internacional, excelente pedagogia com muitas figuras. Munkres — *Elements of Algebraic Topology* — mais sequencial e acessível para iniciantes. Para K-teoria: Atiyah — *K-Theory*.
- **Pré-requisitos**: topologia geral (espaços compactos, conexos, Hausdorff) é indispensável. Álgebra abstrata (grupos, anéis) é necessária para entender π₁ e Hₙ.
- **Calcular grupos fundamentais**: encontrar π₁ do toro, da esfera perfurada, do bouquet de n círculos, de ℝP² usando van Kampen. Para o toro: decompor como união de dois anéis com interseção = dois anéis — aplicar van Kampen.
- **Computar homologia via Mayer-Vietoris**: calcular H*(S²) decompondo como dois hemisférios. Calcular H*(T²) decompondo como dois toros abertos com interseção ≅ S¹ × ℝ.
- **Python (gudhi, ripser)**: `from gudhi import SimplexTree; st = SimplexTree(); st.insert([0,1,2]); print(st.betti_numbers())`. Computar homologia de complexos simpliciais e homologia persistente de nuvens de pontos.
- **Projeto TDA**: dado um conjunto de pontos amostrados de uma figura em forma de círculo + ruído, compute a homologia persistente usando Ripser. Identifique o 1-loop persistente e visualize o código de barras.

## Exercícios práticos

1. **[Rank E]** Calcule π₁ do bouquet de dois círculos (S¹ ∨ S¹) usando o teorema de van Kampen: decompore S¹ ∨ S¹ como A ∪ B onde A ≃ S¹, B ≃ S¹ e A ∩ B ≃ {ponto}. Identifique π₁(A), π₁(B), π₁(A∩B) e aplique a fórmula do produto amalgamado. *Dica: π₁(S¹) = ℤ (grupo com gerador a), π₁(S¹) = ℤ (grupo com gerador b), π₁(ponto) = {0}. Produto amalgamado de ℤ e ℤ sobre 0 = ℤ * ℤ (produto livre, grupo livre de rank 2, gerado por a e b sem relações além das de cada grupo).*

2. **[Rank D]** Use a sequência de Mayer-Vietoris para calcular H*(S²). Decomponha S² = D²₊ ∪ D²₋ com D²₊ ∩ D²₋ ≃ S¹ e D²± ≃ ponto (disco é contrátil). Compute H*(ponto) = (ℤ, 0, 0, …) e H*(S¹) = (ℤ, ℤ, 0, …) para montar a sequência exata longa. *Dica: a sequência de Mayer-Vietoris para n=2: … → H₂(S¹) → H₂(D²₊)⊕H₂(D²₋) → H₂(S²) → H₁(S¹) → H₁(D²₊)⊕H₁(D²₋) → … Como H₂(S¹)=0, H₂(D²±)=0: 0 → H₂(S²) → H₁(S¹)=ℤ → H₁(D²±)=0 → … A injetividade dá H₂(S²) = ℤ.*

3. **[Rank C]** Prove que a esfera S² não é homeomorfa ao toro T². Use homologia: calcule H₁(S²) e H₁(T²) e mostre que são diferentes. Conclua que qualquer homeomorfismo induziria um isomorfismo em H₁, o que é impossível. *Dica: H₁(S²) = 0 (a esfera é simplesmente conexa: π₁(S²) = 0 → H₁ = π₁^{ab} = 0). H₁(T²) = ℤ² (o toro tem π₁ = ℤ×ℤ, já abeliano). Como ℤ² ≇ 0, S² e T² não podem ser homeomorfos — qualquer homeomorfismo induziria isomorfismo em H₁.*

4. **[Rank B]** Prove o teorema de ponto fixo de Brouwer em dimensão 2: toda função contínua f: D² → D² tem um ponto fixo. Use homologia: suponha que f não tem ponto fixo, construa uma retração r: D² → S¹ (bordo de D²) como r(x) = interseção do raio de f(x) a x com S¹, e mostre que r induz homomorfismo H₁(D²) → H₁(S¹) contradizendo a sequência longa do par (D², S¹). *Dica: a sequência exata longa do par (D², S¹): … → H₁(D²) → H₁(D², S¹) → H₀(S¹) → H₀(D²) → … Como D² é contrátil, H₁(D²) = 0. Se existisse retração r: D² → S¹, então r∘i = id_{S¹} (i inclusão S¹ ↪ D²), logo r∗∘i∗ = id em H₁ — mas i∗: H₁(S¹)=ℤ → H₁(D²)=0 é o mapa zero, logo r∗∘i∗ = 0 ≠ id. Contradição.*

5. **[Rank A] [BOSS]** Calcule π₃(S²) = ℤ via a fibração de Hopf: a fibração η: S³ → S² com fibra S¹ dá a sequência exata longa de homotopia … → π₃(S¹) → π₃(S³) → π₃(S²) → π₂(S¹) → … Use: π₃(S¹) = 0 (π_n(S¹) = 0 para n ≥ 2, pois S¹ ≃ K(ℤ,1)); π₃(S³) = ℤ (pelo teorema de Hurewicz: π₃(S³) = H₃(S³) = ℤ pois S³ é 2-conexo); π₂(S¹) = 0. Conclua que π₃(S²) = ℤ, gerado pela fibração de Hopf η. *Dica: a sequência exata longa da fibração S¹ → S³ → S² dá: … → π₃(S¹) → π₃(S³) → π₃(S²) → π₂(S¹) → π₂(S³) → π₂(S²) → … Substituindo os valores conhecidos: 0 → ℤ → π₃(S²) → 0. A exatidão implica π₃(S²) ≅ ℤ, e o mapa η∗: π₃(S³) → π₃(S²) é isomorfismo — o gerador é a própria fibração de Hopf.*

## Próximos passos

- [topologia-geral](topologia-geral) — espaços topológicos, compacidade, conexidade, homeomorfismo
- [algebra-homologica](algebra-homologica) — functores derivados, Tor e Ext, categorias derivadas
- [geometria-diferencial](geometria-diferencial) — variedades como espaços topológicos com estrutura diferencial
- [estruturas-algebricas](estruturas-algebricas) — grupos, anéis e módulos como alvos dos invariantes
- → Pratique no /math-quest na área **Álgebra/Topologia** (Rank B+)
