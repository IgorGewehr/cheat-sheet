---
title: Análise de Fourier
category: matematica
stack: [Mat, Python]
tags: [analise, aplicada, fundamentos]
excerpt: "Séries de Fourier, transformada de Fourier, teoria L², Parseval e aplicações a EDPs — decompondo funções em frequências."
related: [analise-real, medida-integracao, equacoes-diferenciais-parciais, series-e-sequencias]
updated: 2026-05
---

## O que é

Análise de Fourier é o estudo da representação de funções como superposições de exponenciais complexas (ou senos/cossenos) — decomposição em frequências. A ideia central: funções "complicadas" podem ser entendidas por seus **componentes de frequência**, e muitas operações (derivação, convolução, resolução de EDPs) tornam-se simples no **domínio da frequência**.

Joseph Fourier (1822) propôs que qualquer função podia ser representada por uma série trigonométrica, em contexto de condução de calor. A justificativa rigorosa levou 100 anos: Dirichlet (condições de convergência pontual), Riemann (integral), Lebesgue (convergência L²), Fejér (soma de Cesàro), e Carleson (1966, convergência q.c. para funções L²).

## Por que estuda

Para o matemático, análise de Fourier é onde análise real, teoria de medida e álgebra harmônica se encontram. O teorema de Plancherel (L² é preservado) é um resultado de espaços de Hilbert. O princípio da incerteza de Heisenberg é um teorema de análise funcional que inclui física quântica como caso especial. A generalização para grupos abelianos localmente compactos (análise harmônica abstrata) unifica FFT, séries de Fourier e DFT numa única teoria.

Para ML/CS: a FFT é um dos algoritmos mais importantes da computação — base de compressão (MP3, JPEG, PNG), comunicações digitais (OFDM em WiFi e 5G), e multiplicação de polinômios em criptografia (NTT em CRYSTALS-Kyber). Positional encodings em transformers são senos e cossenos de múltiplas frequências. Redes neurais periódicas (SIREN) usam seno como função de ativação.

## Conceitos-chave

- **Séries de Fourier**: para f: [-π,π] → ℝ periódica, f(x) ~ Σ_{n=-∞}^∞ fₙ e^{inx} com coeficientes fₙ = (1/2π)∫_{-π}^π f(x) e^{-inx} dx. Forma real: f(x) ~ a₀/2 + Σ_{n=1}^∞ [aₙcos(nx) + bₙsen(nx)]. Os {e^{inx}/√(2π)} formam **base ortonormal** de L²[-π,π] — os coeficientes fₙ = ⟨f, e^{inx}⟩ são coordenadas de f nesta base.
- **Convergência de séries de Fourier**: (L²/Riesz-Fischer) para f ∈ L²[-π,π], a série converge em L²: ‖f-Sₙ(f)‖₂ → 0. (Pontual/Dirichlet) para f de variação limitada por partes: Sₙ(f)(x) → [f(x+)+f(x-)]/2. **Fenômeno de Gibbs**: perto de descontinuidades, a série overshoot ~9% independente de quantos termos — não desaparece com mais termos. Soma de Cesàro (Fejér): médias convergem uniformemente para f contínua, sem Gibbs.
- **Identidade de Parseval**: ‖f‖₂² = (1/2π)∫|f|² = Σ|fₙ|². A norma L² é preservada no domínio de frequência — analogia com teorema de Pitágoras em dimensão infinita. Base dos algoritmos de compressão por energia espectral.
- **Transformada de Fourier**: para f ∈ L¹(ℝ), f̂(ξ) = ∫_{-∞}^∞ f(x) e^{-2πiξx} dx. Inversão: f(x) = ∫ f̂(ξ) e^{2πiξx} dξ. Propriedades fundamentais: f'(x) ↔ 2πiξ f̂(ξ) (derivação → multiplicação); (f*g)(x) ↔ f̂(ξ)ĝ(ξ) (convolução → produto). Translação f(x-a) ↔ e^{-2πiξa}f̂(ξ); modulação e^{2πiax}f(x) ↔ f̂(ξ-a).
- **Teorema de Plancherel**: a transformada de Fourier estende-se a isometria unitária de L²(ℝ) em L²(ℝ): ‖f̂‖₂ = ‖f‖₂. A transformada de Fourier em L² é uma **rotação** no espaço de Hilbert.
- **Princípio da Incerteza de Heisenberg**: para f ∈ L²(ℝ) normalizado, (∫x²|f|²dx)^{1/2} · (∫ξ²|f̂|²dξ)^{1/2} ≥ 1/(4π). Uma função não pode ser simultaneamente concentrada em espaço e em frequência. Igualdade para gaussianas f(x) = e^{-αx²}. Corresponde diretamente a Δx·Δp ≥ ℏ/2 em mecânica quântica.
- **Transformada de Fourier Discreta (DFT/FFT)**: para sinal discreto (x₀,…,x_{N-1}): X_k = Σ_{n=0}^{N-1} xₙ e^{-2πikn/N}. FFT (Cooley-Tukey, 1965): O(N log N) em vez de O(N²). Um dos algoritmos mais importantes da história da computação.
- **Aplicações a EDPs**: derivação → multiplicação transforma EDPs em álgebra no domínio de frequência. Equação do calor ∂u/∂t = k∂²u/∂x²: aplicando Fourier, dû/dt = -4π²kξ²û → û(ξ,t) = û(ξ,0)·e^{-4π²kξ²t}. O núcleo de calor Φ_t = ℱ⁻¹[e^{-4π²kξ²t}] é gaussiano — a transformada de Fourier revela por que o calor difunde por convolução com gaussiana.
- **Análise harmônica abstrata**: a análise de Fourier generaliza para grupos abelianos localmente compactos via teorema de Pontryagin (o dual do dual é o grupo original). Grupo ℝ → ℝ̂ = ℝ (transformada de Fourier). Grupo ℤ/Nℤ → ℤ/Nℤ (DFT). Grupo S¹ → ℤ (séries de Fourier).

## Confusões comuns

**"Séries de Fourier convergem pontualmente para qualquer função L²"**: Falso. O teorema de Carleson (1966, medalha Fields) prova convergência q.c. para L², mas é um resultado difícil. Em geral, funções L² podem ter séries de Fourier que divergem num conjunto de medida zero. Para convergência uniforme, precisa-se de regularidade adicional (Lipschitz é suficiente).

**"A FFT calcula a transformada contínua de Fourier"**: Não. A FFT calcula a DFT — a transformada de Fourier Discreta — que é a transformada de Fourier de uma sequência discreta periódica, não de uma função contínua. A relação com a transformada contínua envolve amostragem (teorema de Nyquist-Shannon) e periodicidade implícita.

**"Convolução no domínio do tempo = produto no domínio da frequência"**: Isso é exato para a transformada de Fourier e DFT, mas requer cuidado com a convenção de periodicidade. Na DFT, convolução linear (a usual) ≠ convolução circular (que corresponde ao produto de DFTs). Para convolução linear com DFT, usa-se zero-padding.

**"Sinais com mais componentes de frequência são mais complexos"**: Não necessariamente. Uma função muito suave (analítica) tem coeficientes de Fourier que decaem muito rápido — mais suavidade = mais concentrado no domínio de frequência. Funções descontínuas têm coeficientes que decaem lentamente (1/n) — menos suavidade = espalhado em frequência.

**"Princípio da incerteza implica que não podemos medir posição e momentum simultaneamente"**: O princípio matemático (desigualdade de Heisenberg em análise de Fourier) é um resultado sobre funções e suas transformadas. A interpretação física (Δx·Δp ≥ ℏ/2) adiciona a identificação de amplitudes quânticas com funções em L² — mas o teorema matemático é mais geral.

## Aplicação em CS/Dev/ML

**FFT em processamento de sinais e áudio**: a FFT decompõe sinal de áudio em frequências. Spectrograma = FFT em janelas deslizantes. Compressão MP3 descarta frequências inaudíveis. Convolução de impulso para reverberação é produto no domínio de Fourier — rápido com FFT. Librosa (Python) implementa toda análise de áudio via FFT.

**Positional Encoding em Transformers**: o paper "Attention is All You Need" codifica posição i na dimensão 2k como sin(i/10000^{2k/d}) e dimensão 2k+1 como cos(i/10000^{2k/d}). Diferentes frequências permitem ao modelo aprender padrões de posição relativa. A escolha de senos e cossenos garante que PE(pos+k) é combinação linear de PE(pos) — facilitando generalização para posições não vistas.

**NTT (Number Theoretic Transform) em criptografia**: NTT é a FFT sobre ℤ_q para q primo, usando raízes primitivas da unidade modulares. É o núcleo de CRYSTALS-Kyber e CRYSTALS-Dilithium (padrões pós-quânticos do NIST) — multiplicação de polinômios em ℤ_q[x]/(xⁿ+1) via NTT em O(n log n).

**SIREN (Sinusoidal Representation Networks)**: usa sin como função de ativação (em vez de ReLU) para representar sinais contínuos (imagens, formas, física). Vantagem: derivadas de qualquer ordem são representáveis (derivada de sin é cos — ainda sinusoidal). Usado em campos neurais implícitos, representação de cenas 3D (NeRF combinado).

**NumPy/SciPy para Fourier**: `numpy.fft.fft(x)`, `numpy.fft.ifft(X)`, `numpy.fft.fftfreq(n, d)`. `scipy.fft` é mais completo. Para séries de Fourier simbólicas: `sympy.fourier_series(f, (x, -pi, pi))`.

## Como praticar

- **Livro base**: Körner — *Fourier Analysis* (Cambridge, acessível com motivação excelente). Stein & Shakarchi — *Fourier Analysis: An Introduction* (Princeton Lectures in Analysis, rigoroso). Para aplicações a EDPs: Evans — *Partial Differential Equations* (Capítulo 4).
- **Calcular coeficientes de Fourier à mão**: derivar a série de Fourier de f(x) = x, de f(x) = x², de f(x) = |x|, e do degrau. Verificar convergência pontual nos pontos de descontinuidade.
- **Implementar FFT do zero**: escreva a FFT recursiva de Cooley-Tukey em Python (divide por par/ímpar, usa raízes da unidade). Compare com numpy.fft.fft. Entender o algoritmo requer números complexos e recursão.
- **Visualizar fenômeno de Gibbs**: plote as somas parciais N=1,5,10,50 da série de Fourier da função degrau. Observe o overshoot de ~9% que não diminui com N.
- **Projeto**: implemente equalização de áudio — carregue um arquivo WAV, aplique FFT, modifique os coeficientes em certas faixas de frequência (boost/cut), aplique IFFT. Compare o áudio resultante com o original.

## Exercícios práticos

1. **[Rank E]** Calcule os coeficientes de Fourier da função f(x) = 1 para 0 < x < π e f(x) = -1 para -π < x < 0 (onda quadrada). Escreva a série de Fourier e calcule a soma nos pontos x = 0, x = π/2, x = π. *Dica: por simetria ímpar, aₙ = 0. bₙ = (2/π)∫₀^π 1·sin(nx)dx = 2/(nπ)(1-cos(nπ)) = 4/(nπ) para n ímpar, 0 para n par. Série: f(x) = (4/π)Σ_{k=0}^∞ sin((2k+1)x)/(2k+1). Em x=π/2: 1 = (4/π)(1 - 1/3 + 1/5 - …) → π/4 = 1 - 1/3 + 1/5 - …*

2. **[Rank D]** Prove a identidade de Parseval para séries de Fourier: ‖f‖₂² = (1/2π)∫_{-π}^π |f(x)|² dx = Σ_{n=-∞}^∞ |fₙ|². Aplique para calcular Σ_{n=1}^∞ 1/n² = π²/6 usando os coeficientes de Fourier de f(x) = x. *Dica: ‖f‖₂² = ⟨f,f⟩ = ⟨Σfₙe^{inx}, Σfₙe^{inx}⟩ = Σ|fₙ|² pela ortonormalidade de {e^{inx}/√(2π)}. Para f(x) = x: fₙ = (-1)^n i/n (n≠0), f₀=0. Parseval: (1/2π)∫x²dx = 2π²/6 = Σ_{n≠0}1/n² = 2Σ_{n=1}^∞ 1/n². Logo Σ 1/n² = π²/6.*

3. **[Rank C]** Resolva a equação do calor ∂u/∂t = ∂²u/∂x² em ℝ com dado inicial u(x,0) = e^{-x²} usando a transformada de Fourier. Mostre que û(ξ,t) = e^{-πξ²}e^{-4π²ξ²t} e inverta para obter u(x,t). *Dica: a transformada de Fourier de e^{-x²} é √π e^{-πξ²} (prop. da gaussiana). A EDP no domínio de Fourier é ∂û/∂t = -4π²ξ²û → û(ξ,t) = û(ξ,0)e^{-4π²ξ²t} = √π e^{-π(1+4πt)ξ²}. Invertendo (gaussiana): u(x,t) = (1/√(1+4πt))e^{-x²/(1+4πt)} — a gaussiana se alarga no tempo.*

4. **[Rank B]** Prove o teorema de convolução: f̂*g(ξ) = f̂(ξ)·ĝ(ξ), onde (f*g)(x) = ∫f(y)g(x-y)dy. Use a definição da transformada de Fourier e troque a ordem de integração (justificando com Fubini para f,g ∈ L¹). *Dica: (f*g)^(ξ) = ∫(f*g)(x)e^{-2πiξx}dx = ∫∫f(y)g(x-y)e^{-2πiξx}dy dx. Troque a ordem (Fubini: f,g ∈ L¹ → f⊗g ∈ L¹): ∫f(y)e^{-2πiξy}[∫g(x-y)e^{-2πiξ(x-y)}dx] dy = ∫f(y)e^{-2πiξy}ĝ(ξ) dy = f̂(ξ)ĝ(ξ).*

5. **[Rank A] [BOSS]** Prove o princípio da incerteza de Heisenberg: para f ∈ L²(ℝ) com ‖f‖₂ = 1, (∫x²|f(x)|²dx)^{1/2}·(∫ξ²|f̂(ξ)|²dξ)^{1/2} ≥ 1/(4π). Use a desigualdade de Cauchy-Schwarz aplicada à identidade ‖f‖₂² = ∫|f|² = Re∫x·f·(-2πiξf̂)^∨ dx, onde (g)^∨ é a antitransformada. *Dica: use integração por partes: 1 = ‖f‖₂² = ∫|f|²dx = -∫x·(f̄'f + ff̄')dx/1 = -∫x·∂_x|f|²dx = ∫|f|²dx (por partes) — o que dá 1 = -2Re∫xf̄(df/dx)dx. Pela fórmula da derivada e da transformada: df/dx corresponde a 2πiξf̂(ξ). Aplicando C-S: 1 ≤ 2(∫x²|f|²dx)^{1/2}·‖df/dx‖₂ = 2(∫x²|f|²dx)^{1/2}·(2π)(∫ξ²|f̂|²dξ)^{1/2}.*

## Próximos passos

- [analise-real](analise-real) — convergência em L² e espaços de Hilbert
- [medida-integracao](medida-integracao) — teoria de Lebesgue como base rigorosa da integral de Fourier
- [equacoes-diferenciais-parciais](equacoes-diferenciais-parciais) — Fourier resolve a equação do calor, onda e Laplace
- [series-e-sequencias](series-e-sequencias) — séries de potências e séries de Fourier como casos especiais
- → Pratique no /math-quest na área **Análise** (Rank C+)
