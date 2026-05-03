---
title: Topologia Algébrica
category: matematica
stack: [Mat]
tags: [topologia, algebra, fundamentos]
excerpt: "Grupo fundamental, espaços de recobrimento, homologia singular e CW-complexos — a topologia que usa álgebra para distinguir formas."
related: [topologia-geral, estruturas-algebricas, algebra-homologica, geometria-diferencial]
updated: "2026-05"
---

## O que é

Topologia Algébrica associa invariantes algébricos (grupos, anéis, módulos) a espaços topológicos, de forma que homeomorfismos induzem isomorfismos algébricos. A ideia: se dois espaços têm invariantes diferentes, não podem ser homeomorfos — permitindo distinguir formas usando álgebra.

O campo nasceu com Poincaré (1895), que introduziu o grupo fundamental e os números de Betti. Brouwer, Veblen, Alexander e Lefschetz desenvolveram as bases. A formulação moderna — homologia singular, cohomologia, sequências exatas — foi estabelecida por Eilenberg-Steenrod nos anos 1940-50. Grothendieck e Atiyah desenvolveram cohomologia de sheaves e K-teoria nos anos 1960.

## Grupo Fundamental π₁

O **grupo fundamental** π₁(X, x₀) de um espaço X no ponto base x₀ é o grupo das classes de homotopia de laços em x₀:
- Um **laço** baseado em x₀ é uma curva contínua γ: [0,1] → X com γ(0) = γ(1) = x₀
- Dois laços são **homotópicos** se um pode ser deformado continuamente no outro fixando x₀
- A composição de laços define a operação de grupo

**Exemplos fundamentais:**
- π₁(ℝⁿ) = 0 (trivial — espaço simplesmente conexo)
- π₁(S¹) = ℤ — o inteiro conta o número de voltas
- π₁(Toro T²) = ℤ × ℤ — um laço em cada direção
- π₁(bouquet de n círculos) = grupo livre Fₙ

**Teorema de Seifert-van Kampen:** Se X = A ∪ B com A, B, A∩B abertos e path-connected, e x₀ ∈ A∩B, então π₁(X) é o produto amalgamado π₁(A) *_{π₁(A∩B)} π₁(B). Isso permite calcular π₁ de espaços compostos.

## Espaços de Recobrimento

Um **espaço de recobrimento** p: X̃ → X é um mapa contínuo tal que todo x ∈ X tem vizinhança U cuja pré-imagem p⁻¹(U) é união disjunta de abertos de X̃, cada um mapeado homeomorficamente em U.

**Classificação:** Há uma correspondência bijetiva entre subgrupos H ≤ π₁(X, x₀) (a menos de conjugação) e classes de espaços de recobrimento conexos de X. O **recobrimento universal** X̃ corresponde a H = {e} e tem π₁(X̃) = 0.

**Exemplo:** O recobrimento universal de S¹ é ℝ, com p: ℝ → S¹, p(t) = e^{2πit}. Os recobrimentos de S¹ são os círculos com o mapa z ↦ zⁿ (correspondendo ao subgrupo nℤ ≤ ℤ).

## CW-Complexos

Um **CW-complexo** é um espaço construído inductivamente: começa com um conjunto discreto de 0-células (pontos), e em cada passo as n-células (cópias de Dⁿ) são coladas ao (n-1)-esqueleto por mapas de colagem ∂Dⁿ → X^{n-1}.

**Vantagens:** CW-complexos são a "boa" categoria para topologia algébrica — Whitehead, Cellular Approximation, e os teoremas de Hurewicz/Whitehead valem plenamente. Todo espaço "razoável" (variedade, complexo simplicial) é homotopicamente equivalente a um CW-complexo.

**Exemplos:** Sⁿ tem estrutura CW com uma 0-célula e uma n-célula. O espaço projetivo real ℝPⁿ tem uma k-célula em cada dimensão 0 ≤ k ≤ n.

## Homologia Singular

A **homologia singular** associa a cada espaço X grupos abelianos Hₙ(X) para n ≥ 0.

**Construção:** Um **n-simplexo singular** é um mapa contínuo σ: Δⁿ → X do simplexo padrão. O grupo de cadeias Cₙ(X) = grupo abeliano livre gerado pelos n-simplexos singulares. O **operador fronteira** ∂ₙ: Cₙ(X) → Cₙ₋₁(X) é ∂ₙσ = Σ (-1)ⁱ σ∘dᵢ (soma das faces com sinais alternados). Verifica-se que ∂²= 0, formando um complexo de cadeia. O **n-ésimo grupo de homologia** é Hₙ(X) = Ker(∂ₙ)/Im(∂ₙ₊₁).

**Exemplos:**
- H₀(X) = ℤ^{componentes conexas} — conta os componentes
- H₁(X) = π₁(X)^{ab} — abelianização do grupo fundamental (Teorema de Hurewicz, n=1)
- Hₙ(Sⁿ) = ℤ, Hₖ(Sⁿ) = 0 para 0 < k < n
- H*(Toro) = (ℤ, ℤ², ℤ, 0, 0, ...) em graus 0,1,2,3,...

## Sequências Exatas e Mayer-Vietoris

A **sequência de Mayer-Vietoris** é uma ferramenta para calcular homologia de X = A ∪ B:
... → Hₙ(A∩B) → Hₙ(A) ⊕ Hₙ(B) → Hₙ(X) → Hₙ₋₁(A∩B) → ...

Esta é uma **sequência exata longa** — a imagem de cada mapa é o núcleo do próximo. Permite calcular H*(X) a partir de H*(A), H*(B), H*(A∩B).

**Exemplo (esfera):** S² = D²₊ ∪ D²₋ com interseção S¹. Usando Mayer-Vietoris com H*(D²) = H*(ponto), obtemos H₂(S²) = ℤ.

## Cohomologia e Dualidade de Poincaré

A **cohomologia singular** Hⁿ(X; R) = Hom(Hₙ(X), R) é o dual da homologia. Para variedades orientadas compactas M de dimensão n, a **dualidade de Poincaré** afirma Hₖ(M) ≅ Hⁿ⁻ᵏ(M).

## Aplicações e Conexões

- **Teorema de ponto fixo de Brouwer:** Toda função contínua f: Dⁿ → Dⁿ tem um ponto fixo. Prova via H*(Dⁿ, Sⁿ⁻¹).
- **Invariância de dimensão:** ℝᵐ ≇ ℝⁿ para m ≠ n. Prova via cohomologia.
- **Superfícies:** A classificação de superfícies compactas orientáveis (esfera, toro, toro duplo, ...) é distinguida por H₁ e χ (característica de Euler).
- **K-teoria:** Invariante cohomológico de espaços via fibrações vetoriais, conecta com física (anomalias, índice de Dirac).
