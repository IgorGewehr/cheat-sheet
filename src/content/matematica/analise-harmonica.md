---
title: Análise Harmônica
category: matematica
stack: [Mat]
tags: [analise, fourier, grupos, representacao, harmonica]
excerpt: "Dualidade de Pontryagin, transformada de Fourier em grupos LCA, representações unitárias — a generalização de Fourier para grupos."
related: [analise-fourier, analise-funcional, grupos-de-lie, teoria-representacao, medida-integracao]
updated: 2026-05
---

## O que é

Análise harmônica clássica é o estudo de decomposições de funções em termos de "harmônicos" — funções que diagonalizam translações. Em ℝ ou no toro 𝕋, esses são exponenciais e^{ixξ} e análise harmônica = análise de Fourier. A análise harmônica moderna estende isso a:

- **Grupos abelianos localmente compactos (LCA)**: ℝⁿ, ℤⁿ, 𝕋ⁿ, ℚₚ, adèles. Dualidade de Pontryagin generaliza FT.
- **Grupos não-abelianos compactos**: SU(n), SO(n). Decomposição em representações irredutíveis (Peter-Weyl).
- **Grupos não-abelianos não-compactos**: SL(2, ℝ), grupos de Lie semi-simples. Análise harmônica em espaços simétricos (Helgason).
- **Variedades**: análise espectral de Laplace-Beltrami em variedades Riemannianas.

A unificação conceitual: harmônicos = autovetores de uma representação de translação. Em ℝ, translação por h: f(x) ↦ f(x−h); exponenciais e^{ixξ} são autovetores (e^{i(x−h)ξ} = e^{−ihξ} · e^{ixξ}). Em grupos não-abelianos, "translação" são operadores de regular representation, e harmônicos vivem em representações irredutíveis.

Análise harmônica foi a fonte de avanços profundos em séc. XX: trabalho de Hardy, Littlewood, Paley (anos 30) sobre operadores singulares; Calderón-Zygmund (anos 50) sobre operadores integrais singulares; Stein, Fefferman (Fields 1978) sobre teoria moderna em ℝⁿ; Tao (Fields 2006) sobre análise multilinear; Bourgain (Fields 1994, Abel 2017) sobre EDPs dispersivas.

## Por que estuda

Para análise pura: análise harmônica é o terreno de operadores singulares (Hilbert, Riesz transforms), espaços de funções (Hardy, BMO, Besov), e EDPs (estimativas de dispersão para Schrödinger/onda). Sem ela, EDPs não-lineares e teoria de regularidade não existem na forma moderna.

Para teoria dos números: análise harmônica em ℤ e em ℚₚ é o ferramental de teoria analítica dos números modernos — função zeta, conjectura de Riemann, primos em progressões aritméticas (Dirichlet), Goldbach (via método circular de Hardy-Littlewood, refinado por Vinogradov), conjectura de Erdős-Ko-Rado e variantes via método de Fourier.

Para física: mecânica quântica de partícula livre é análise harmônica em ℝ³ (autoestados do momento). Em fundo simétrico (esfera, hidrogênio), são análise harmônica em variedades. Teoria de gauge usa análise harmônica em fibrados.

Para ML: kernels Gaussianos / RBF têm interpretação Fourier (Bochner). Sinusoidal positional encoding em Transformers vem de análise harmônica em ℤ. Group equivariant convolutional networks (Cohen & Welling, ICML 2016) usam análise em SO(2)/SO(3). Modelos de difusão usam estimativas de Calderón-Zygmund implicitamente para análise de erro.

## Conceitos-chave

- **Grupo LCA G**: grupo topológico abeliano, localmente compacto, Hausdorff. Exemplos: ℝⁿ, ℤⁿ, 𝕋ⁿ, ℚₚ, 𝔸_K (adèles). Tem **medida de Haar** μ_G — medida regular invariante por translação, única a menos de constante.
- **Caráter** χ: G → 𝕋 (círculo unitário): homomorfismo contínuo. Conjunto Ĝ = Hom(G, 𝕋) com operação ponto-a-ponto é também LCA — o **dual de Pontryagin**.
- **Exemplos de duais**: ℝ̂ = ℝ (χ_ξ(x) = e^{2πixξ}); ẑ = 𝕋; 𝕋̂ = ℤ; ℤ/n ̂ = ℤ/n; ℚ̂ₚ = ℚₚ; (ℝⁿ)̂ = ℝⁿ. Pontryagin: G ≅ Ĝ̂ canonicamente. Compacto ⟺ dual discreto.
- **Transformada de Fourier em G LCA**: f̂(χ) = ∫_G f(x) χ(x)⁻¹ dμ_G(x), para f ∈ L¹(G). Riemann-Lebesgue: f̂ ∈ C₀(Ĝ). Estende a isometria L²(G) → L²(Ĝ) (Plancherel) com escolha conveniente de medida de Haar dual. Inversão: f(x) = ∫_Ĝ f̂(χ) χ(x) dμ_Ĝ(χ).
- **Convolução**: (f * g)(x) = ∫_G f(y) g(x − y) dμ(y). Identidade fundamental: (f̂*g) = f̂ · ĝ. FT diagonaliza convolução — todo operador comutando com translações é convolução com algum núcleo (caso Schwartz / distribuição).
- **Dualidade de Plancherel-Peter-Weyl (compacto não-abel.)**: para G compacto, L²(G) = ⊕_{π∈Ĝ} dim(π) · V_π ⊗ V_π* (decomposição como representação bilateral). Coeficientes matriciais de representações irredutíveis formam base de L²(G). Para G = SO(3): coeficientes = funções esféricas Y_l^m.
- **Operadores singulares e Calderón-Zygmund**: operadores como transformada de Hilbert Hf(x) = (1/π) p.v. ∫ f(y)/(x−y) dy, transformadas de Riesz R_j em ℝⁿ. Características: limitados em Lᵖ para 1 < p < ∞ (não em L¹ nem L∞); BMO substitui L∞ no extremo; H¹ (Hardy) substitui L¹ no outro extremo.
- **Análise harmônica em ℝⁿ moderno**: espaços Lᵖ-pesados de Muckenhoupt (A_p), Hardy Hᵖ, BMO, Besov Bᵖ,q^s, Triebel-Lizorkin Fᵖ,q^s. Cada um caracteriza regularidade ou oscilação. Caracterização via Fourier ou Littlewood-Paley.
- **Princípio de incerteza**: f e f̂ não podem ambos ter suporte compacto a menos que f ≡ 0. Quantitativamente: ‖x f‖₂ · ‖ξ f̂‖₂ ≥ (1/4π) ‖f‖₂². Heisenberg em MQ é o caso ℝ.

## Confusões comuns

**"Análise harmônica = transformada de Fourier"**: FT em ℝⁿ é o caso paradigmático, mas análise harmônica é muito mais: análise em grupos compactos não-abelianos (rep theory), em grupos p-ádicos (teoria dos números), em variedades simétricas (Helgason). FT é apenas a versão LCA.

**"Caracteres em grupos não-abelianos = representações 1D"**: Em grupos abelianos, caráter = rep unitária 1D. Em não-abelianos, caráter de uma rep π é χ_π(g) = tr(π(g)) — não é homomorfismo, é função de classe. Distinção crítica para Peter-Weyl.

**"Convolução é comutativa em todo grupo"**: em LCA abeliano sim. Em grupo não-abeliano, convolução é em geral **não-comutativa** (e^{f*g}(x) ≠ (g*f)(x) genericamente). Algebra de grupo L¹(G) é não-comutativa para G não-abeliano.

**"Função suave em 𝕋 tem decaimento Fourier rápido"**: sim, **se** suave de classe C^∞ (decai mais rápido que qualquer polinômio). Mas Cᵏ suave dá decaimento como 1/|n|ᵏ⁺¹ apenas. Inversamente, decaimento determina regularidade: |f̂(n)| ≤ C/(1+|n|)^s ⟹ f ∈ Cˢ⁻¹⁻ε para s não-inteiro.

**"Princípio de incerteza é só MQ"**: o princípio é puramente matemático — inerente à dualidade Fourier. MQ é o caso onde x = posição, ξ/2π = momento (escalonado por ℏ). O mesmo princípio rege resolução tempo-frequência em processamento de sinais.

**"Fourier discreto = Fourier contínuo discretizado"**: DFT em ℤ/N é dualidade Pontryagin para grupo finito ℤ/N (auto-dual). FFT (Cooley-Tukey) é algoritmo O(N log N) explorando fatoração da estrutura. Relação com FT contínua é via amostragem (Nyquist-Shannon) — sob condições, com erro controlado.

## Aplicação em CS/Dev/ML

**Kernel methods e teorema de Bochner**: kernel positivo definido em ℝⁿ ⟺ FT de medida finita positiva. Kernel Gaussiano k(x,y) = e^{−|x−y|²/2σ²} tem FT = densidade Gaussiana — daí "RBF" tem aproximação por features Fourier aleatórias (Rahimi & Recht 2007): k(x,y) ≈ (1/D) Σ cos(ωⱼᵀx + bⱼ) cos(ωⱼᵀy + bⱼ), com ωⱼ ~ medida de Bochner.

**Group equivariant CNNs**: convoluções padrão são equivariantes por translação. Convoluções em SE(2), SO(3) (rotações 2D/3D) são equivariantes — aplicações em visão (rotação), química (moléculas rotation-invariant). Implementação via Peter-Weyl e harmônicos esféricos (Y_l^m).

**Positional encoding em Transformers**: sinusoidal encoding PE(pos, 2k) = sin(pos/10000^{2k/d}) é literalmente expansão Fourier em ℤ. Pré-treinado encoding (RoPE — Rotary Position Embedding, Su et al. 2021) usa multiplicação por exponencial complexa para implementar atenção translacionalmente invariante.

**Difusão e EDPs no ML**: convergência de diffusion models (DDPM, score-based) depende de estimativas de regularidade tipo Sobolev/Besov para score function. Análise harmônica fornece o ferramental (Calderón-Zygmund estende quando score é singular, gera melhores schedules).

**Computação criptográfica**: Number Theoretic Transform (NTT) é DFT em ℤ/p; usado em criptografia pós-quântica (CRYSTALS-Kyber, Dilithium — padronizados NIST 2024). Multiplicação de polinômios via NTT em O(n log n).

**Compressão e processamento**: JPEG usa DCT (transformada cosseno discreta = FT em grupo de simetrias de 𝕋²). MP3 usa MDCT. Wavelet compression (JPEG2000) usa análise harmônica multiresolução (Daubechies, Mallat).

## Como praticar

- **Livro base**: Stein & Shakarchi — *Fourier Analysis* + *Real Analysis* + *Functional Analysis* (série Princeton Lectures, didática, completa). Folland — *A Course in Abstract Harmonic Analysis* (canônico para LCA + grupos compactos). Helgason — *Groups and Geometric Analysis* (não-compacto, espaços simétricos). Para representações: Knapp.
- **Calcule duais**: ℤ/n, ℤ, ℝ, ℝ/ℤ, p-ádicos ℚₚ. Em cada, verifique Pontryagin G ≅ Ĝ̂. Para ℚₚ, dual é o próprio ℚₚ (via χ(x) = e^{2πi {x}_p}, parte fracionária).
- **Demonstre Plancherel em ℝ**: defina FT em 𝒮(ℝ) (Schwartz), prove fórmula de Plancherel ‖f̂‖₂ = ‖f‖₂, estenda por densidade a L².
- **Implemente FFT manualmente**: Cooley-Tukey radix-2 em Python; compare com numpy.fft. Compute power spectrum de sinais reais (áudio, EEG).
- **Projeto ML**: implemente Random Fourier Features para regressão de kernel; compare com kernel ridge exato em dataset pequeno. Mostre convergência empírica.
- **Teoria dos números computacional**: implemente teste de Miller-Rabin (não usa análise harmônica diretamente) e depois NTT para multiplicação rápida de polinômios em ℤ_q[x].
- **Lean 4 / Mathlib**: tem `MeasureTheory.Function.LpSpace`, `Fourier`. Formalize Riemann-Lebesgue ou Parseval para séries de Fourier em 𝕋.

## Exercícios práticos

1. **[Rank E]** Calcule a transformada de Fourier de f(x) = e^{−|x|} em ℝ. *Dica: separar a integral em duas partes ±∞. f̂(ξ) = ∫_{−∞}^∞ e^{−|x|} e^{−2πixξ} dx = 2 ∫_0^∞ e^{−x} cos(2πxξ) dx = 2 · 1/(1+4π²ξ²) = 2/(1+4π²ξ²). Note a Lorentziana.*

2. **[Rank D]** Demonstre a fórmula de soma de Poisson: para f ∈ 𝒮(ℝ), Σ_{n∈ℤ} f(n) = Σ_{k∈ℤ} f̂(k). *Dica: Defina g(x) = Σ_{n∈ℤ} f(x+n), periódica de período 1. Expanda em série de Fourier em 𝕋: g(x) = Σ_k c_k e^{2πikx} com c_k = ∫_0^1 g(x) e^{−2πikx} dx = Σ_n ∫_n^{n+1} f(x) e^{−2πikx} dx = ∫_ℝ f(x)e^{−2πikx}dx = f̂(k). Avalie em x = 0.*

3. **[Rank C]** Demonstre o teorema de Bochner em ℝⁿ: K: ℝⁿ → ℂ contínua é kernel positivo-definido (i.e., para todos x_1, ..., x_N e c_1, ..., c_N ∈ ℂ, Σ_{i,j} c_i c̄_j K(x_i − x_j) ≥ 0) se e somente se K = μ̂ para alguma medida finita positiva μ em ℝⁿ. *Dica: (⟸) cálculo direto usando definição de FT. (⟹) Mostre que K é hermitiano e |K(x)| ≤ K(0); então defina forma sesquilinear em C_c(ℝⁿ) por ⟨ϕ, ψ⟩ = ∫∫ K(x − y) ϕ(x) ψ̄(y) dx dy, positiva semi-definida; complete e use Riesz para representar como ∫|ϕ̂|² dμ.*

4. **[Rank B]** Demonstre o teorema de Peter-Weyl para G compacto: L²(G) decompõe-se ortogonalmente como ⊕_{π ∈ Ĝ} (V_π ⊗ V_π*), onde Ĝ = classes de equivalência de representações unitárias irredutíveis (todas de dim. finita para G compacto). *Dica: passo 1 — para G compacto, operadores de convolução são compactos em L²; aplique teorema espectral; obtenha decomposição em subespaços invariantes finitos. Passo 2 — restrição a cada subespaço invariante minimal é representação irredutível. Passo 3 — coeficientes matriciais π_{ij}(g) = ⟨π(g) eⱼ, eᵢ⟩ são ortogonais em L²(G) entre representações distintas (Schur) e dão base de L²(G).*

5. **[Rank A] [BOSS]** Demonstre a fórmula de inversão de Mellin para zeta function de Dirichlet em estrita L-funções: para χ caráter de Dirichlet mod q não-principal, e Re(s) > 1, L(s, χ) = Σ_{n≥1} χ(n)/nˢ se estende analiticamente a função inteira; e satisfaz equação funcional Λ(s, χ) = ε(χ) Λ(1−s, χ̄), onde Λ(s, χ) = (q/π)^{s/2} Γ((s+a)/2) L(s, χ), a ∈ {0,1} dependendo de χ(−1). *Dica: estratégia clássica (Riemann-Siegel via Hecke). Use a representação integral Λ(s, χ) = ∫_0^∞ θ_χ(it) t^{(s+a)/2} dt/t, onde θ_χ é série teta torcida por χ. Separe a integral em [0,1] + [1,∞]; em [0,1] use transformação modular θ_χ(it) = ε(χ) (1/q^{1/2} t) θ_{χ̄}(i/qt) (provada via fórmula de Poisson em ℤ/q + condição sobre χ); equação funcional emerge automaticamente. Continuação analítica vem de combinar as duas peças.*

## Próximos passos

- [analise-fourier](analise-fourier) — caso clássico ℝⁿ / 𝕋
- [analise-funcional](analise-funcional) — pré-requisito para representações em Hilbert
- [grupos-de-lie](grupos-de-lie) — análise harmônica em grupos compactos e semi-simples
- [teoria-representacao](teoria-representacao) — Peter-Weyl é representação aplicada
- [teoria-algebrica-numeros](teoria-algebrica-numeros) — L-funções e adèles
- → Pratique no /math-quest na área **Análise** (Rank A+)
