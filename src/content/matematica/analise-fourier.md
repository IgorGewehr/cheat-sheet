---
title: Análise de Fourier
category: matematica
stack: [Mat]
tags: [analise, aplicada, fundamentos]
excerpt: "Séries de Fourier, transformada de Fourier, teoria L², Parseval e aplicações a EDPs — decompondo funções em frequências."
related: [analise-real, medida-integracao, equacoes-diferenciais-parciais, series-e-sequencias]
updated: "2026-05"
---

## O que é

Análise de Fourier é o estudo da representação de funções como superposições de exponenciais complexas (ou senos/cossenos) — decomposição em frequências. A ideia central: funções "complicadas" podem ser entendidas por seus **componentes de frequência**, e muitas operações (derivação, convolução, resolução de EDPs) tornam-se simples no **domínio da frequência**.

Joseph Fourier (1822) propôs que qualquer função podia ser representada por uma série trigonométrica, em contexto de condução de calor. A justificativa rigorosa levou 100 anos: Dirichlet (condições de convergência pontual), Riemann (integral), Lebesgue (convergência L²), Fejér (soma de Cesàro), e Carleson (1966, convergência q.c. para funções L²).

## Séries de Fourier

Para f: [-π, π] → ℝ (ou ℂ), periodicamente estendida, a **série de Fourier** é:

f(x) ~ Σ_{n=-∞}^∞ fₙ e^{inx}     (forma complexa)

onde os **coeficientes de Fourier** são fₙ = (1/2π) ∫_{-π}^{π} f(x) e^{-inx} dx.

Forma real: f(x) ~ a₀/2 + Σ_{n=1}^∞ [aₙcos(nx) + bₙsen(nx)] com
- aₙ = (1/π) ∫_{-π}^{π} f(x)cos(nx) dx
- bₙ = (1/π) ∫_{-π}^{π} f(x)sen(nx) dx

**Interpretação:** {e^{inx}/√(2π)} é **base ortonormal** de L²[-π,π] com o produto interno ⟨f,g⟩ = (1/2π)∫fg̅. Os coeficientes fₙ = ⟨f, e^{inx}⟩ são as **coordenadas** de f nesta base.

**Exemplo:** f(x) = x em [-π,π]: bₙ = 2(-1)^{n+1}/n → f(x) = 2Σ_{n=1}^∞ (-1)^{n+1} sen(nx)/n. Em x=π/2: π/4 = 1 - 1/3 + 1/5 - 1/7 + ... (série de Leibniz).

## Convergência

**Convergência L² (Teorema de Riesz-Fischer):** Para f ∈ L²[-π,π], a série de Fourier converge em L²: ‖f - Sₙ(f)‖₂ → 0, onde Sₙ(f) é a soma parcial de N termos.

**Identidade de Parseval:** ‖f‖₂² = (1/2π)∫|f|² = Σ|fₙ|². A norma L² é preservada no domínio de frequência. Equivalente ao Teorema de Pitágoras em dimensão infinita.

**Convergência pontual:** Condições de Dirichlet (f de variação limitada por partes): Sₙ(f)(x) → [f(x+)+f(x-)]/2. No pontos de descontinuidade, a série converge à média lateral.

**Fenômeno de Gibbs:** Próximo a descontinuidades, a série de Fourier overshoot ~9% — independente de quantos termos são somados. Relevante em processamento de sinais.

**Soma de Cesàro (Fejér):** As médias de Cesàro σₙ(f) = (S₀+...+Sₙ)/(n+1) convergem uniformemente para funções contínuas — sem fenômeno de Gibbs.

## Transformada de Fourier

Para f ∈ L¹(ℝ), a **transformada de Fourier** é:

f̂(ξ) = ∫_{-∞}^∞ f(x) e^{-2πiξx} dx    (convenção de frequência)

ou alternativamente f̂(ξ) = ∫ f(x) e^{-iξx} dx (convenção física).

**Inversão:** f(x) = ∫_{-∞}^∞ f̂(ξ) e^{2πiξx} dξ (quando f e f̂ ∈ L¹).

**Propriedades fundamentais:**
| Operação em f | Efeito em f̂ |
|---|---|
| Translação f(x-a) | e^{-2πiξa} f̂(ξ) |
| Modulação e^{2πiax}f(x) | f̂(ξ-a) |
| Derivada f'(x) | 2πiξ · f̂(ξ) |
| Convolução (f*g)(x) | f̂(ξ)·ĝ(ξ) |
| Produto f(x)g(x) | (f̂*ĝ)(ξ) |
| Dilatação f(ax) | f̂(ξ/a)/\|a\| |

**Derivação → multiplicação:** Esta propriedade é a razão pela qual a transformada de Fourier resolve EDPs — derivadas se tornam multiplicações algébricas no domínio de frequência.

## Teoria L² (Plancherel)

Para f ∈ L²(ℝ), a transformada de Fourier não é diretamente definida pela integral (que pode não convergir absolutamente), mas é definida por extensão do isomorfismo:

**Teorema de Plancherel:** A transformada de Fourier estende-se a uma **isometria unitária** de L²(ℝ) em L²(ℝ):

‖f̂‖₂ = ‖f‖₂   (igualdade de Parseval/Plancherel)

Isso significa: a transformada de Fourier em L² é uma **rotação** (isometria bijetiva) no espaço de Hilbert L²(ℝ).

## Princípio da Incerteza de Heisenberg

Para f ∈ L²(ℝ) com ‖f‖₂ = 1:

(∫x²|f(x)|²dx)^{1/2} · (∫ξ²|f̂(ξ)|²dξ)^{1/2} ≥ 1/(4π)

Interpretação: uma função não pode ser simultaneamente concentrada em espaço e em frequência. A igualdade vale para gaussianas f(x) = e^{-αx²} — funções de mínima incerteza. Este resultado matemático corresponde diretamente ao princípio de incerteza da mecânica quântica (Δx · Δp ≥ ℏ/2).

## Transformada de Fourier Discreta (DFT)

Para sinal discreto x = (x₀, ..., x_{N-1}), a DFT é:

X_k = Σ_{n=0}^{N-1} xₙ e^{-2πikn/N},   k = 0, ..., N-1

**FFT (Fast Fourier Transform):** O algoritmo de Cooley-Tukey (1965) computa a DFT em O(N log N) em vez de O(N²). É um dos algoritmos mais importantes da computação — base de compressão de áudio/vídeo (MP3, JPEG), comunicação digital (OFDM em LTE/5G), e multiplicação rápida de polinômios.

## Aplicações a EDPs

**Equação do calor:** ∂u/∂t = k∂²u/∂x². Aplicando Fourier em x: dû(ξ,t)/dt = -4π²kξ²û. Solução: û(ξ,t) = û(ξ,0)·e^{-4π²kξ²t}. Invertendo: u(x,t) = (f * Φ_t)(x) onde Φ_t é o núcleo do calor gaussiano.

**Equação de ondas:** ∂²u/∂t² = c²∂²u/∂x². No domínio de Fourier: d²û/dt² = -4π²c²ξ²û → û(ξ,t) = û₊e^{2πicξt} + û₋e^{-2πicξt} (propagação de ondas).

**Equação de Schrödinger:** iℏ∂ψ/∂t = -(ℏ²/2m)∂²ψ/∂x². A transformada de Fourier diagonaliza o operador de Hamiltoniano cinético.

## Análise de Fourier Abstrata e Grupos

A análise de Fourier generaliza para grupos topológicos localmente compactos. O grupo ℝ tem grupo dual ℝ̂ = ℝ (via χ_ξ(x) = e^{2πiξx}). O grupo finito ℤ/Nℤ tem dual ℤ/Nℤ, dando a DFT. O grupo S¹ = ℝ/ℤ tem dual ℤ, dando as séries de Fourier.

**Teorema de Pontryagin:** O grupo dual de um grupo abeliano localmente compacto é também localmente compacto, e o dual do dual é canonicamente isomorfo ao grupo original. Isso unifica a transformada de Fourier clássica, séries de Fourier e DFT numa única teoria.
