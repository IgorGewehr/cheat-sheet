---
title: Análise Funcional
category: matematica
stack: [Mat]
tags: [analise, funcional, operadores, banach, hilbert]
excerpt: "Espaços de Banach e Hilbert, operadores lineares, dualidade, teorema espectral — a álgebra linear em dimensão infinita."
related: [medida-integracao, topologia-geral, analise-real, equacoes-diferenciais-parciais, analise-harmonica]
updated: 2026-05
---

## O que é

Análise Funcional é o estudo de espaços vetoriais topológicos de dimensão infinita e dos operadores lineares entre eles. Onde a álgebra linear lida com ℝⁿ e matrizes, a análise funcional generaliza para espaços de funções (C[0,1], Lᵖ, espaços de Sobolev) e operadores que são tipicamente diferenciais ou integrais.

O campo nasce do trabalho de Hilbert (espaços ℓ², autovalores de operadores integrais), Banach (espaços normados completos e os três teoremas-pilar) e Riesz (representação de funcionais lineares). A motivação original era resolver EDPs e equações integrais — Fredholm tinha mostrado em 1903 que problemas integrais lineares podem ser tratados como sistemas lineares de dimensão infinita. A axiomatização de Banach (1932) deu a base moderna.

Hoje, análise funcional é a linguagem de EDPs (formulação fraca, espaços de Sobolev), mecânica quântica (observáveis = operadores auto-adjuntos em espaços de Hilbert), teoria de aprendizado (espaços de Hilbert de núcleo reprodutor — RKHS), processamento de sinais (transformadas em L²), e probabilidade (espaços de Banach de variáveis aleatórias).

## Por que estuda

Análise funcional é o terreno onde análise e álgebra linear se encontram. Para qualquer matemático que pretenda trabalhar com análise pós-graduada (EDPs, análise harmônica, teoria espectral, probabilidade abstrata), é pré-requisito incontornável. Para ML/CS: kernel methods (SVMs, gaussian processes), operadores em redes neurais como mapas em L², e a base teórica de transformers (atenção como operador integral kernelizado) usam intuições funcionais.

Pragmaticamente: o teorema de Hahn-Banach é o axioma da escolha em forma analítica — sem ele, não se garante existência de extensões lineares. O teorema da limitação uniforme e o teorema do gráfico fechado dão controle global sobre famílias de operadores. O teorema espectral converte qualquer operador auto-adjunto em multiplicação por uma função — generaliza diagonalização de matrizes simétricas.

## Conceitos-chave

- **Espaços normados, Banach, Hilbert**: (X, ‖·‖) é normado se a norma satisfaz positividade, homogeneidade e desigualdade triangular. Banach: normado e completo. Hilbert: Banach cuja norma vem de um produto interno ⟨·,·⟩ — então vale identidade do paralelogramo. Exemplos canônicos: Lᵖ(μ) (Banach para p ∈ [1,∞]; Hilbert só para p=2), C(K) com norma sup, espaços de Sobolev Hˢ.
- **Os três teoremas-pilar (Banach, anos 1930)**: (1) **Hahn-Banach** — todo funcional linear definido num subespaço com norma controlada se estende ao espaço todo preservando a norma. Versão geométrica: separação de convexos por hiperplanos. (2) **Banach-Steinhaus / limitação uniforme** — se {Tₐ} é família de operadores limitados pontualmente, então é uniformemente limitada (em espaços de Banach). (3) **Aplicação aberta / gráfico fechado** — operador linear sobrejetivo entre Banach é aberto; gráfico fechado ⇒ operador contínuo. Cada um depende do teorema de Baire.
- **Dualidade**: X* = {funcionais lineares contínuos X → 𝕂}. Reflexividade: X = X** canonicamente. Hilbert: H ≅ H* via Riesz (toda forma linear contínua é ⟨·, y⟩ para único y). Lᵖ* = Lq para 1/p + 1/q = 1, 1 ≤ p < ∞. L¹* = L∞ mas (L∞)* ⊋ L¹.
- **Topologia fraca e fraca-***: convergência fraca xₙ ⇀ x ↔ ϕ(xₙ) → ϕ(x) para todo ϕ ∈ X*. Convergência fraca-* em X*: ϕₙ ⇀* ϕ ↔ ϕₙ(x) → ϕ(x) ∀x. Banach-Alaoglu: bola unitária em X* é fraca-* compacta (essencial para EDPs).
- **Operadores lineares**: T: X → Y é limitado se ‖T‖ = sup_{‖x‖≤1} ‖Tx‖ < ∞. Compactos: levam limitados em pré-compactos. Spectrum σ(T) ⊆ ℂ. Operadores auto-adjuntos em Hilbert: T = T* ⇒ σ(T) ⊆ ℝ.
- **Teorema espectral**: para T auto-adjunto compacto em Hilbert separável, existe base ortonormal {eₙ} com Teₙ = λₙeₙ, λₙ → 0. Para T auto-adjunto limitado geral: T = ∫ λ dE(λ) (medida espectral). Para ilimitado densamente definido: análogo, mas exige cuidado com domínio (Stone-Friedrichs).
- **Espaços de Sobolev Wᵏ'ᵖ(Ω) e Hᵏ(Ω)**: funções com derivadas distribucionais até ordem k em Lᵖ. Hˢ = Wˢ'² para s real (via Fourier). Imersões de Sobolev: Hˢ(Ω) ⊂ C(Ω) se s > d/2. Trace operators, espaço dual H⁻ˢ. Fundamentais para EDPs.
- **Operadores compactos e teoria de Fredholm**: alternativa de Fredholm para T = I − K com K compacto: ou Tx = y tem solução para todo y, ou núcleo é não-trivial. Index ind(T) = dim ker T − dim coker T é invariante sob perturbações compactas.

## Confusões comuns

**"Hilbert é só ℓ² ou L²"**: ℓ² e L² são os exemplos paradigmáticos, mas existem Hilbert mais sofisticados: espaços de Sobolev Hˢ, espaços de Bergman A²(Ω) (funções holomorfas em L²), RKHS associados a kernels positivos (centrais em ML). O que define Hilbert é o produto interno, não a representação concreta.

**"Em dimensão infinita, base equivale ao caso de dimensão finita"**: Falso. Há **base de Hamel** (combinação linear finita, em geral não-construtiva, usa axioma da escolha) e **base de Schauder** (combinação linear convergente, ordem importa). Em Hilbert separável, há **base ortonormal** (séries de Fourier abstratas). Nenhuma é igual a base no sentido de ℝⁿ — em particular, projeção em "subespaço gerado" exige fechamento.

**"Operador limitado = contínuo = uniformemente contínuo"**: para operadores **lineares**, sim — limitado ⟺ contínuo ⟺ uniformemente contínuo. Mas isso é específico de lineares; mapas não-lineares podem ser contínuos sem ser limitados (e vice-versa, no sentido óbvio).

**"Em Hilbert, fechado e limitado implica compacto"**: Falso categoricamente em dimensão infinita. A bola unitária de ℓ² é fechada e limitada, mas não compacta (sequência {eₙ} dos vetores canônicos não tem subsequência convergente em norma). Compacidade em dim. infinita exige convergência fraca ou condições de Arzelà-Ascoli.

**"Operador auto-adjunto = simétrico"**: Para operadores **limitados** em Hilbert, equivalente. Para **ilimitados densamente definidos** (caso típico em MQ: operador momento −iℏ d/dx), distintos: simétrico = ⟨Tx, y⟩ = ⟨x, Ty⟩ no domínio; auto-adjunto = simétrico **e** dom(T*) = dom(T). Distinção crítica: só operadores auto-adjuntos têm teorema espectral e geram unitários (postulado de evolução em MQ).

**"Espectro = conjunto de autovalores"**: Em dim. infinita, espectro = pontos onde T − λI não tem inversa limitada, e tem três partes: espectro pontual (autovalores), contínuo, residual. Operador shift à direita em ℓ² tem espectro = disco fechado mas zero autovalores — espectro inteiramente contínuo.

## Aplicação em CS/Dev/ML

**Kernel methods e RKHS**: SVMs, gaussian processes e kernel ridge regression vivem em espaços de Hilbert de núcleo reprodutor. O teorema do representante diz que minimizar Σ L(yᵢ, f(xᵢ)) + λ‖f‖² em RKHS dá solução f = Σ αᵢ k(·, xᵢ) — finitária. Sem análise funcional, isso é mágica; com ela, é álgebra linear em H_K.

**Atenção em transformers como operador integral**: a operação de atenção softmax(QKᵀ/√d)V pode ser vista como operador integral kernelizado — kernel softmax. Análise espectral desse operador determina capacidade. Linear attention substitui softmax por feature map ϕ tal que k(q, k) = ϕ(q)ᵀϕ(k), reduzindo de O(n²) para O(n).

**Redes neurais como aproximadores universais**: o teorema da aproximação universal (Cybenko, Hornik) diz que MLPs com função de ativação sigmoidal são densos em C(K) para K compacto em ℝⁿ. Demonstração: análise funcional (Hahn-Banach + Riesz para medidas).

**Mecânica quântica matemática**: estados = vetores unitários em Hilbert; observáveis = operadores auto-adjuntos (limitados ou ilimitados); evolução = grupo unitário e^{−itH/ℏ}; espectro de H = valores possíveis da medida de energia. Sem teorema espectral, MQ é manipulação simbólica; com ele, é matemática.

**EDPs em formulação fraca / método de elementos finitos**: ao invés de buscar u ∈ C² resolvendo −Δu = f, busca-se u ∈ H¹ tal que ∫∇u·∇v = ∫fv para todo v ∈ H¹₀. Lax-Milgram (consequência funcional) garante existência. FEM aproxima H¹ por subespaços de dimensão finita.

**Probabilidade abstrata e processos**: espaços L²(Ω, ℱ, ℙ) de variáveis aleatórias formam Hilbert; esperança condicional E[X | 𝒢] é projeção ortogonal sobre L²(𝒢). Processos Markovianos são semigrupos de operadores em L².

## Como praticar

- **Livro base**: Kreyszig — *Introductory Functional Analysis with Applications* (didático). Conway — *A Course in Functional Analysis* (mais avançado, Hilbert + teoria espectral em profundidade). Brezis — *Functional Analysis, Sobolev Spaces and PDEs* (best para análise + EDPs). Rudin — *Functional Analysis* (compacto e rigoroso).
- **Demonstre os três pilares**: Hahn-Banach via lema de Zorn (forma analítica e geométrica); Banach-Steinhaus via Baire; teorema do gráfico fechado via aplicação aberta.
- **Calcule espectro de operadores concretos**: (a) operador multiplicação Mf(x) = xf(x) em L²([0,1]) — espectro = [0,1] contínuo; (b) shift à direita em ℓ² — espectro = disco unitário fechado; (c) Laplaciano −Δ em H¹₀(0,π) — espectro discreto {n²}.
- **Projeto Python/NumPy**: implementar SVD truncado e usá-lo para aproximação de baixo posto de matrizes grandes (analógico finito-dimensional de aproximação espectral em Hilbert). Comparar com PCA.
- **Lean 4 / Mathlib**: formalize Hahn-Banach em ℝⁿ ou prove que ℓ² é Hilbert. Mathlib já tem `NormedSpace`, `InnerProductSpace`.
- **Exercício de Brezis**: faça os capítulos 1-3 (Hahn-Banach, Baire+pilares, topologia fraca). É curto e brutalmente eficaz.

## Exercícios práticos

1. **[Rank E]** Mostre que ℓ²(ℕ) = {(xₙ) : Σ|xₙ|² < ∞} com ⟨x, y⟩ = Σ xₙ ȳₙ é espaço de Hilbert. Verifique cada axioma (produto interno, completude). *Dica: positividade e simetria conjugada são diretas; desigualdade Cauchy-Schwarz dá a triangular. Completude: dada sequência de Cauchy (x⁽ᵏ⁾), cada coordenada xₙ⁽ᵏ⁾ converge em ℂ; verifique que o limite está em ℓ² e que x⁽ᵏ⁾ → x em norma.*

2. **[Rank D]** Prove o teorema de representação de Riesz para Hilbert: para todo funcional linear contínuo ϕ: H → 𝕂, existe único y ∈ H com ϕ(x) = ⟨x, y⟩, e ‖ϕ‖ = ‖y‖. *Dica: se ϕ ≡ 0, tome y = 0. Senão, M = ker ϕ é subespaço fechado próprio; M⊥ é não-trivial. Tome z ∈ M⊥, z ≠ 0; mostre que ϕ(x) = ⟨x, ϕ(z)z/‖z‖²⟩ verifica.*

3. **[Rank C]** Seja T: ℓ² → ℓ² o operador shift à direita: T(x₁, x₂, ...) = (0, x₁, x₂, ...). (a) Calcule ‖T‖; (b) determine o adjunto T*; (c) mostre que T é isometria mas não unitário; (d) determine espectro σ(T) e classifique cada parte. *Dica: (a) ‖T‖ = 1 por isometria; (b) T*(y₁, y₂, ...) = (y₂, y₃, ...) shift à esquerda; (c) T*T = I mas TT* ≠ I; (d) para |λ| < 1, λ é autovalor de T*; consequentemente o espectro de T é o disco fechado |λ| ≤ 1 e é todo residual+contínuo (nenhum autovalor).*

4. **[Rank B]** Demonstre o teorema da limitação uniforme: se X é Banach, Y normado, e {Tₐ}ₐ∈ᴬ é família de operadores lineares limitados tais que sup_α ‖Tₐx‖ < ∞ para todo x ∈ X, então sup_α ‖Tₐ‖ < ∞. *Dica: use Baire. Os conjuntos Fₙ = {x : sup_α ‖Tₐx‖ ≤ n} cobrem X e são fechados; por Baire algum Fₙ₀ tem interior. Logo existe bola B(x₀, r) ⊆ Fₙ₀. Para x com ‖x‖ < r: x = (x₀ + x) − x₀, ‖Tₐx‖ ≤ ‖Tₐ(x₀+x)‖ + ‖Tₐx₀‖ ≤ 2n₀. Daí ‖Tₐ‖ ≤ 2n₀/r.*

5. **[Rank A] [BOSS]** Prove o teorema espectral para operadores auto-adjuntos compactos em Hilbert: se T: H → H é auto-adjunto compacto e H é separável, então existe base ortonormal {eₙ} de H com Teₙ = λₙeₙ, λₙ ∈ ℝ, λₙ → 0, e T = Σ λₙ ⟨·, eₙ⟩ eₙ. *Dica: passo 1 — ‖T‖ ou −‖T‖ é autovalor (use ‖T‖² = sup ⟨Tx, Tx⟩ e compacidade). Passo 2 — autovalor não-nulo λ tem espaço próprio de dim. finita (núcleo de T − λI; usa compacidade). Passo 3 — autoespaços associados a autovalores distintos são ortogonais (T auto-adjunto). Passo 4 — indução sobre H ⊖ E_{λ₁}: o restrito ainda é compacto e auto-adjunto, repita. Passo 5 — base ortonormal por união dos autoespaços; em ker T, escolha base ortonormal qualquer.*

## Próximos passos

- [medida-integracao](medida-integracao) — pré-requisito para Lᵖ, e provê a base de medida
- [analise-harmonica](analise-harmonica) — Fourier em LCA groups usa análise funcional em representações
- [equacoes-diferenciais-parciais](equacoes-diferenciais-parciais) — espaços de Sobolev e formulação fraca
- [processos-estocasticos](processos-estocasticos) — semigrupos de operadores e martingales como projeções
- [variedades-riemannianas](variedades-riemannianas) — operador Laplace-Beltrami e espectro em variedades
- → Pratique no /math-quest na área **Análise** (Rank B+)
