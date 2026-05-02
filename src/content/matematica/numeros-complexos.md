---
title: Números Complexos & Equações Algébricas
category: matematica
stack: [Mat]
tags: [fundamentos, algebra, analise]
excerpt: O corpo ℂ, a fórmula de Euler, o Teorema Fundamental da Álgebra e raízes de polinômios.
related: [trigonometria-essencial, algebra-linear, analise-complexa, estruturas-algebricas]
updated: 2026-05
---

## O que é

Números complexos são extensão dos reais: ℂ = {a + bi | a, b ∈ ℝ}, onde i é definido pela propriedade i² = -1. A construção formal mais rigorosa define ℂ como ℝ² com a multiplicação (a,b)·(c,d) = (ac-bd, ad+bc) — sem apelar para "raiz de número negativo".

A necessidade surgiu no séc. XVI quando Cardano e Bombelli, ao resolver equações cúbicas pela fórmula, encontravam raízes quadradas de negativos como passo intermediário, mesmo quando a solução final era um número real. Gauss, no séc. XIX, demonstrou o Teorema Fundamental da Álgebra e representou complexos como pontos no plano — o **plano de Argand-Gauss** — dando geometria à álgebra.

O grande insight é que ℂ é **algebricamente fechado**: todo polinômio de grau n com coeficientes complexos tem exatamente n raízes em ℂ (contadas com multiplicidade). Isso não é verdade em ℝ — por isso complexos são o lar natural das equações algébricas.

## Por que estuda

Para o matemático, ℂ é onde análise real encontra álgebra. A análise complexa (variáveis complexas) é notavelmente mais "bonita" que a análise real: funções complexas diferenciáveis são automaticamente analíticas (infinitamente diferenciáveis), e fórmulas integrais como a de Cauchy têm poder enorme.

Para dev e ML: processamento de sinais usa transformada de Fourier, que naturalmente vive em ℂ; o espectro de uma matriz (autovalores) pode ser complexo mesmo para matrizes reais — sistemas de controle, estabilidade de redes neurais recorrentes (RNNs) e análise de gradiente em treinamento de redes dependem de entender autovalores complexos. Criptografia de curvas elípticas opera sobre corpos finitos mas a teoria subjacente usa análise complexa (funções elípticas, toros complexos).

## Conceitos-chave

- **Forma algébrica e geométrica**: z = a + bi = r·e^{iθ} = r(cos θ + i·sen θ). Parte real Re(z) = a, imaginária Im(z) = b, módulo |z| = √(a²+b²), argumento arg(z) = θ.
- **Conjugado**: z̄ = a - bi. Propriedades: |z|² = z·z̄, Re(z) = (z + z̄)/2, Im(z) = (z - z̄)/(2i). Conjugado transforma raízes complexas em pares: se p(z) = 0 e p tem coeficientes reais, então p(z̄) = 0 também.
- **Fórmula de Euler**: e^{iθ} = cos θ + i·sen θ. Consequência: multiplicar por e^{iθ} rotaciona o plano por θ. Elevar ao quadrado: e^{i·2θ} = (e^{iθ})² → fórmula de duplo ângulo imediata.
- **Raízes n-ésimas da unidade**: soluções de z^n = 1 são ω_k = e^{2πik/n} para k = 0,1,…,n-1. Formam um grupo cíclico de ordem n. São as bases da FFT.
- **Teorema Fundamental da Álgebra**: todo polinômio não-constante p(z) ∈ ℂ[z] tem pelo menos uma raiz em ℂ. Logo, um polinômio de grau n fatoriza em exatamente n fatores lineares (z - r_k). A prova mais elegante usa análise complexa (teorema de Liouville).
- **Fórmulas de Bhaskara, Cardano, Ferrari**: quadráticas (grau 2) têm fórmula fechada; cúbicas (Cardano, 1545) e quárticas (Ferrari) também. Para grau ≥ 5, Abel-Ruffini prova que não existe fórmula geral por radicais — resultado que leva a teoria de Galois.
- **Multiplicidade de raízes**: r é raiz de multiplicidade k de p se (z - r)^k | p(z) mas (z - r)^{k+1} ∤ p(z). Raiz de multiplicidade ≥ 2 é também raiz de p'(z).
- **Exponencial complexa como mapa**: e^z mapeia faixas horizontais em ℂ para setores angulares, e faixas verticais em anéis. Entender a geometria de e^z é base de análise complexa.

## Confusões comuns

**"i = √(-1) é a definição de i"**: É uma notação conveniente mas imprecisa. A definição rigorosa é i² = -1. "√(-1)" é problemático porque a função √ não está definida para negativos em ℝ, e estender ingenuamente leva a paradoxos como: -1 = i·i = √(-1)·√(-1) = √((-1)(-1)) = √1 = 1.

**"|z₁ + z₂| = |z₁| + |z₂|"**: Isso é a desigualdade triangular na igualdade, que só vale quando z₁ e z₂ têm o mesmo argumento (apontam na mesma direção). Em geral, |z₁ + z₂| ≤ |z₁| + |z₂|.

**"Polinômios de grau n têm sempre n raízes distintas"**: Têm n raízes contadas com multiplicidade. O polinômio (z-1)² tem grau 2 mas apenas 1 raiz distinta (z = 1, com multiplicidade 2).

**"Números complexos são uma extensão necessária dos reais para álgebra"**: Para álgebra sobre ℝ, sim. Mas complexos não são a única extensão possível — quaternions (ℍ) estendem ℂ para dimensão 4, perdendo comutatividade da multiplicação. Octônios estendem para dimensão 8, perdendo associatividade. ℂ é o único corpo que estende ℝ como corpo algebricamente fechado de dimensão finita.

**"A fórmula de Euler e^{iπ} + 1 = 0 é misteriosa"**: Não há mistério — é apenas e^{iπ} = cos π + i·sen π = -1 + 0 = -1. A "beleza" está na convergência de cinco constantes fundamentais, não em nenhuma propriedade oculta.

## Aplicação em CS/Dev/ML

**Transformada de Fourier discreta (DFT/FFT)**: os coeficientes de Fourier são somas de produtos por e^{-2πikn/N}, que são raízes da unidade. A FFT explora a estrutura de grupo dessas raízes para reduzir complexidade de O(n²) para O(n log n). NumPy e PyTorch têm FFT direta.

**Autovalores complexos em sistemas dinâmicos**: a estabilidade de um sistema de equações diferenciais x' = Ax depende dos autovalores de A. Se Re(λ) < 0 para todos os autovalores, o sistema é estável. RNNs têm problema análogo: gradientes explodem ou desaparecem conforme os autovalores da matriz de transição.

**Criptografia em curvas elípticas**: curvas elípticas sobre ℂ são toros complexos (ℂ/Λ para um lattice Λ). A teoria de funções elípticas (Weierstrass) conecta álgebra com geometria complexa e embasa a criptografia moderna.

**Renderização com wavelets complexas**: a transformada wavelet de Morlet usa funções complexas e é usada em análise de sinais não-estacionários, compressão de imagem e processamento de áudio.

**Números complexos em Python**: `complex(2, 3)`, `(2+3j)`, `abs(z)`, `z.real`, `z.imag`. NumPy opera nativamente com `np.complex128`. `np.fft.fft` retorna array complexo.

## Como praticar

- **Livro base**: Iezzi — *Fundamentos de Matemática Elementar Vol. 6 (Complexos e Polinômios)*. Para nível avançado: Churchill & Brown — *Complex Variables and Applications*.
- **Resolver equações polinomiais**: encontre todas as raízes (reais e complexas) de z⁴ - 1 = 0, z³ - 8 = 0, z⁴ + 4 = 0 (este requer a identidade de Sophie Germain).
- **SymPy**: `from sympy import *; z = symbols('z'); solve(z**4 + 4, z)`. Explore `roots`, `factor`, `expand` em ℂ.
- **Visualização**: plote raízes da unidade para n = 3, 4, 5, 6, 8 com matplotlib. Veja o polígono regular que elas formam.
- **Projeto**: implemente a FFT recursiva (Cooley-Tukey) do zero usando raízes da unidade. O algoritmo é matemática de complexos convertida em código.

## Exercícios práticos

1. **[Rank E]** Calcule em forma algébrica (a+bi) e polar (r·e^{iθ}): (a) (2+3i)(1-i); (b) (1+i)⁴; (c) 1/(1+i). Verifique a fórmula de De Moivre para o caso (b). *Dica: (a) = 5+i; (b) = (√2)⁴·e^{i·4π/4} = 4e^{iπ} = -4; (c) = (1-i)/2. Para (b): |1+i| = √2, arg(1+i) = π/4, logo (1+i)⁴ = (√2)⁴e^{i·4·π/4} = 4e^{iπ} = -4.*

2. **[Rank D]** Encontre todas as 4 raízes quárticas de z⁴ = -16 em forma polar e algébrica. Plote-as no plano complexo e descreva o padrão geométrico. *Dica: -16 = 16e^{iπ}. As raízes são zₖ = 2e^{i(π+2kπ)/4} = 2e^{iπ(2k+1)/4} para k = 0,1,2,3. Forme: 2e^{iπ/4} = √2(1+i), 2e^{3iπ/4} = √2(-1+i), 2e^{5iπ/4} = √2(-1-i), 2e^{7iπ/4} = √2(1-i). Formam um quadrado.*

3. **[Rank C]** Prove a fórmula de Euler e^{ix} = cos x + i sin x derivando-a como solução da equação diferencial y' = iy com y(0) = 1, e confirmando que a série de Taylor de e^{ix} converge para cos(x) + i sin(x) separando os termos pares e ímpares. *Dica: e^{ix} = Σ (ix)ⁿ/n! = Σ (−1)ᵏx^{2k}/(2k)! + i·Σ (−1)ᵏx^{2k+1}/(2k+1)! = cos x + i sin x. Para a derivação por EDO: y = e^{ix} satisfaz y' = ie^{ix} = iy, y(0) = 1. A solução única (unicidade de Picard) é y = e^{ix}.*

4. **[Rank B]** Use a fórmula de Euler para provar as identidades trigonométricas: (a) cos(2x) = cos²x - sin²x; (b) sin(a+b) = sin a cos b + cos a sin b. Derive-as de e^{i2x} = (e^{ix})² e e^{i(a+b)} = e^{ia}·e^{ib} respectivamente. *Dica: (a) e^{i2x} = cos(2x)+i sin(2x) e (e^{ix})² = (cos x+i sin x)² = cos²x-sin²x+2i cos x sin x. Iguale partes real e imaginária. (b) e^{i(a+b)} = e^{ia}e^{ib} = (cos a+i sin a)(cos b+i sin b). Expanda e iguale partes.*

5. **[Rank A] [BOSS]** Prove o Teorema Fundamental da Álgebra de forma elementar (sem análise complexa avançada): todo polinômio não-constante p(z) ∈ ℂ[z] tem ao menos uma raiz em ℂ. Use o argumento topológico: se p não tem raízes, a função p: ℂ → ℂ\{0} é contínua, e o laço t ↦ p(Re^{it}) para R grande deve ser homotopicamente trivial em ℂ\{0} (por contratibilidade do disco de raio R), mas seu índice de enrolamento em torno da origem é n = grau(p) — contradição para n ≥ 1. *Dica: para R grande, p(Re^{it}) ≈ aₙ(Re^{it})ⁿ, cujo índice de enrolamento em torno da origem é n. Para R = 0, o laço é o ponto p(0) — índice 0. Se p não tem raízes, esses dois laços são homotópicos em ℂ\{0}, portanto têm o mesmo índice. Como n ≥ 1, contradição.*

## Próximos passos

- [analise-complexa](analise-complexa) — funções de variável complexa, teorema de Cauchy
- [trigonometria-essencial](trigonometria-essencial) — conexão via fórmula de Euler
- [estruturas-algebricas](estruturas-algebricas) — ℂ como corpo, raízes da unidade como grupo cíclico
- [algebra-galois](algebra-galois) — por que não existe fórmula para grau ≥ 5
- → Pratique no /math-quest na área **Fundamentos** (Rank C+)
