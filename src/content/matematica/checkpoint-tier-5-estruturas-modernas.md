---
title: "Checkpoint Tier 5 — Estruturas Modernas"
category: matematica
stack: [Mat]
tags: [checkpoint, topologia-algebrica, lie, representacao, categorias, tan]
excerpt: "Marcador: π₁, homologia, Lie, Peter-Weyl, Tor/Ext, adèles — antessala do mestrado."
related: [topologia-algebrica, variedades-riemannianas, grupos-de-lie, teoria-representacao, algebra-homologica, teoria-categorias, teoria-algebrica-numeros, analise-harmonica]
updated: 2026-05
---

## O que é

Checkpoint Tier 5 valida domínio operacional dos pilares de mestrado em matemática pura: topologia algébrica (grupo fundamental, homologia), variedades Riemannianas (Levi-Civita, curvatura), grupos de Lie e álgebras de Lie, teoria de representação (Peter-Weyl, caracteres), álgebra homológica (Tor/Ext, sequências exatas), categorias (functores, adjunções), análise harmônica (Fourier em LCA, representações unitárias), e TAN (corpos de números, ramificação, p-ádicos).

Aprovado: você tem todo o ferramental para começar pesquisa em qualquer área de matemática pura.

## Por que estuda

Tier 6 (Geometria Algébrica avançada, Fundamentos & Gödel, Computabilidade, Teoria da Informação, Teoria dos Jogos, Modelagem, Capstone TCC) requer maturidade ampla. Sem domínio sólido aqui, a Geometria Algébrica de Hartshorne é incomprível, programa de Langlands é palavra-de-honra, e pesquisa de fronteira parece outro idioma.

## Conceitos validados

- Grupo fundamental π₁(X), espaços de recobrimento, Galois para topologia
- Homologia singular Hₙ, sequência exata longa, Mayer-Vietoris, dualidade de Poincaré
- Variedades Riemannianas, conexão, curvatura Ricci/seccional, Hodge
- Grupos de Lie e álgebras de Lie, mapa exponencial, Baker-Campbell-Hausdorff
- Representações de grupos finitos e compactos, caracteres, Peter-Weyl
- Complexos de cadeia, Tor, Ext, derivados, espectrais
- Categorias, functores, transformações naturais, adjunções, limites
- Análise de Fourier em LCA: Pontryagin, Plancherel, representações
- TAN: corpos de números, anel de inteiros, ramificação, grupo de classe, p-ádicos

## Problemset

### Topologia Algébrica

**P1 [Rank B]** Compute o grupo fundamental π₁(X) para X = (esfera com dois pontos identificados). *Use van Kampen ou CW-decomposição.*

**P2 [Rank B]** Demonstre que S² e S² ∨ S¹ não são homotópicos equivalentes. *Compute H₁ de cada.*

**P3 [Rank A]** Determine os grupos de homologia singular H_*(ℝP², ℤ). Use sequência exata curta 0 → ℤ →² ℤ → ℤ/2 → 0 e sequência espectral ou cadeia celular.

### Variedades Riemannianas

**P4 [Rank B]** Determine a curvatura seccional do espaço hiperbólico ℍⁿ (modelo do disco de Poincaré). *Verifique K ≡ −1.*

**P5 [Rank A]** Demonstre o teorema de Gauss-Bonnet para superfícies fechadas orientadas: ∫_M K dA = 2π χ(M). Esboce demonstração via triangulação + Stokes em vizinhanças tubulares.

### Grupos de Lie

**P6 [Rank B]** Compute a álgebra de Lie 𝔰𝔬(3): construa base, calcule colchetes, verifique isomorfismo com 𝔰𝔲(2) (módulo discreto). Determine elementos via exponencial.

**P7 [Rank A]** Demonstre a fórmula de Baker-Campbell-Hausdorff até ordem 3: log(eˣ eʸ) = X + Y + ½[X,Y] + 1/12([X,[X,Y]] + [Y,[Y,X]]) + ... *Use série de potências e identidade de Jacobi.*

### Teoria de Representação

**P8 [Rank B]** Liste todas as representações irredutíveis (sobre ℂ) do grupo S₃. Determine seus caracteres. Decomponha a representação regular.

**P9 [Rank A]** Demonstre a relação de ortogonalidade dos caracteres para grupo finito G: ⟨χ_π, χ_ρ⟩ = δ_{π,ρ} para π, ρ irredutíveis. Conclua que o número de irreps = número de classes de conjugação.

### Álgebra Homológica e Categorias

**P10 [Rank B]** Calcule Tor_1^ℤ(ℤ/m, ℤ/n) para m, n inteiros positivos. *Use resolução livre 0 → ℤ →ᵐ ℤ → ℤ/m → 0.*

**P11 [Rank A]** Demonstre que se F: 𝒞 → 𝒟 é functor com adjunto à direita G: 𝒟 → 𝒞 (F ⊣ G), então F preserva colimites e G preserva limites.

### Análise Harmônica

**P12 [Rank B]** Calcule a transformada de Fourier de f(x) = e^{−x²} em ℝ. Use que f satisfaz EDO de primeira ordem (Hermite). Conclua que Gaussiana é autovetor da FT (com autovalor ±1, ±i dependendo da convenção).

### TAN

**P13 [Rank B]** Para K = ℚ(√3): (a) determine 𝒪_K; (b) fatore 2, 5, 11 em ideais primos; (c) calcule discriminante; (d) número de classe.

## Critério de aprovação

- 11/13 resolvidos com rigor: avance para Tier 6.
- 8-10/13: identifique área fraca (topologia/lie/representação/TAN); aprofunde.
- <8/13: revise cards Tier 5 específicos.

## Próximos passos

- Aprovado → [geometria-algebrica-intro](geometria-algebrica-intro), [fundamentos-godel-zfc](fundamentos-godel-zfc)
- Pesquisa de fronteira → [teoria-algebrica-numeros](teoria-algebrica-numeros) (programa de Langlands)
- Capstone → escolha tópico para TCC
