---
title: Teoria Algébrica dos Números
category: matematica
stack: [Mat]
tags: [numeros, algebra, dedekind, p-adicos, adèles]
excerpt: "Corpos de números, anéis de Dedekind, ramificação, p-ádicos, adèles, leis de reciprocidade — a álgebra moderna dos números primos."
related: [teoria-dos-numeros, algebra-galois, estruturas-algebricas, algebra-comutativa, analise-harmonica]
updated: 2026-05
---

## O que é

Teoria algébrica dos números é o estudo de extensões finitas de ℚ (corpos de números) e suas estruturas aritméticas, generalizando ℤ ⊂ ℚ a anéis de inteiros 𝒪_K ⊂ K. A motivação histórica vem de tentativas de Fermat, Euler, Gauss, Kummer e Dedekind de provar o último teorema de Fermat e de entender leis de reciprocidade (Gauss generalizou Legendre para reciprocidade quadrática; Eisenstein, Kummer e finalmente Artin para reciprocidade abeliana geral; reciprocidade não-abeliana é o programa de Langlands).

A descoberta-chave de Kummer (1840s) foi que em anéis como ℤ[ζ_p] (inteiros ciclotômicos), a unicidade da fatoração pode falhar — mas se restabelece se trabalhamos com "ideais ideais" (depois sistematizados como ideais de Dedekind). Isso é a transição de "números" para "ideais" como objetos primitivos.

A teoria moderna inclui: anéis de Dedekind, geometria de corpos de números (Minkowski, regulador, número de classe), análise p-ádica e adèlica (Hensel, Tate), teoria de corpos de classe (Hilbert, Artin, Tate, Chevalley), funções zeta e L (Dedekind, Hecke, Artin), e o programa de Langlands (conexão com representações automórficas).

Hoje TAN é fonte de matemática profunda (último teorema de Fermat resolvido por Wiles via curvas elípticas e formas modulares, 1995; conjectura de Sato-Tate, 2009) e ferramenta concreta — pós-FLT, formas modulares são centrais à criptografia de curvas elípticas e à criptografia pós-quântica (reticulados e isogeny-based).

## Por que estuda

Para matemática pura: TAN é uma das áreas mais profundas da matemática contemporânea. O programa de Langlands é o "Santo Graal" — conectando teoria dos números, análise harmônica, representação de grupos, e geometria algébrica. Resolver conjecturas concretas (Birch-Swinnerton-Dyer, Sato-Tate em corpos genéricos, Vojta) ainda é trabalho de fronteira.

Para criptografia: ECC (Elliptic Curve Cryptography) usa aritmética em curvas elípticas sobre corpos finitos — TAN aplicada. Pairing-based cryptography (BLS signatures, ZK-SNARKs como Groth16, PLONK) depende de Weil/Tate pairings em curvas elípticas. NIST padronizou Kyber/Dilithium (PQ-crypto baseada em reticulados) em 2024 — segurança vem de problemas algorítmicos em reticulados ideais (ring-LWE). Isogenia-based PQ-crypto (CSIDH, SQIsign) usa morfismos entre curvas elípticas.

Para CS teórica: algoritmos em TAN (BKZ para reduções de reticulados, baby-step giant-step, polylog generación de primos via PRIMES in P) são profundos. Complexidade aritmética e teoria de algoritmos number-theoretic é campo ativo.

## Conceitos-chave

- **Corpo de números K**: extensão finita K/ℚ. Grau [K : ℚ] = n. K = ℚ(α) para algum α (teorema do elemento primitivo). **Anel de inteiros** 𝒪_K = elementos α ∈ K tais que existe polinômio mônico em ℤ[x] anulando α. 𝒪_K é ℤ-módulo livre de posto n.
- **Anel de Dedekind**: domínio Noetheriano, integralmente fechado, em que todo ideal primo não-nulo é maximal. Equivalentemente: todo ideal não-nulo se fatora unicamente como produto de primos. 𝒪_K é Dedekind. ℤ é Dedekind (trivial). Curvas algébricas afins sobre corpo dão anéis de Dedekind ⟺ não-singularidade.
- **Fatoração de ideais e ramificação**: para p primo em ℤ, ideal p𝒪_K se fatora em K como p𝒪_K = 𝔭₁^{e₁} · ... · 𝔭_g^{e_g}, com 𝔭ᵢ primos em 𝒪_K. Identidade fundamental: Σ eᵢ fᵢ = n, onde fᵢ = [𝒪_K/𝔭ᵢ : 𝔽_p] é grau residual e eᵢ é índice de ramificação. p **ramifica** se algum eᵢ > 1. Discriminante δ_K detecta primos ramificados.
- **Norma e traço**: para K/ℚ de grau n com mergulhos σ₁, ..., σₙ: ℕ_{K/ℚ}(α) = Π σᵢ(α), Tr_{K/ℚ}(α) = Σ σᵢ(α). Multiplicativa: ℕ(αβ) = ℕ(α)ℕ(β). Norma de ideais: ℕ(𝔞) = |𝒪_K/𝔞|. Fundamental para teoria de classes.
- **Grupo de classe Cl(K) = Ideais fracionários / Principais**: mede falha da fatoração única em 𝒪_K. Teorema de Minkowski: Cl(K) é finito; ordem = número de classes h_K. ℚ(√−5) tem h = 2 (logo ℤ[√−5] não é UFD): 6 = 2 · 3 = (1+√−5)(1−√−5).
- **Unidades 𝒪_K***: elementos com inverso em 𝒪_K. Teorema de Dirichlet das unidades: 𝒪_K* ≅ μ_K × ℤ^{r₁+r₂−1}, onde r₁ = mergulhos reais, r₂ = pares conjugados complexos, μ_K = raízes da unidade em K. Regulador R_K = covolume do reticulado log das unidades.
- **Lugares (places)**: classes de equivalência de valuações em K. Lugares arquimedianos: r₁ reais + r₂ complexos. Lugares não-arquimedianos: correspondem a primos 𝔭 de 𝒪_K (completação: K_𝔭, p-ádico).
- **p-ádicos ℚ_p e ℤ_p**: completação de ℚ sob valuação p-ádica |x|_p = p^{−v_p(x)}. ℤ_p = {x : |x|_p ≤ 1} = lim_← ℤ/pⁿ. Hensel: lifting de raízes mod p para ℤ_p. Análise p-ádica é alternativa à análise real — diferente, igualmente rica.
- **Adèles 𝔸_K**: produto restrito dos completamentos K_v sobre todos os lugares v. 𝔸_K = {(x_v) ∈ Π K_v : x_v ∈ 𝒪_v para quase todos v}. K mergulha discretamente em 𝔸_K com quociente compacto — análogo de ℤ ⊂ ℝ. Análise harmônica em 𝔸_K = teoria das L-funções de Tate.
- **Teoria de corpos de classe**: descreve abelianizações Gal(K^{ab}/K) via mapa de Artin Cl_K^∞ → Gal(K^{ab}/K). Para K = ℚ: Gal(ℚ^{ab}/ℚ) ≅ Ẑ* (Kronecker-Weber: extensões abelianas de ℚ estão em ℚ(ζ_n) ciclotômicas).
- **Funções L**: L(s, χ) = Σ_n χ(n)/nˢ generaliza zeta. L(s, χ) tem continuação analítica e equação funcional. Conjectura de Riemann generalizada: zeros não-triviais em Re(s) = 1/2. Implicaria distribuição ótima de primos em progressões aritméticas e classes ideais.

## Confusões comuns

**"𝒪_K é sempre ℤ[α] se K = ℚ(α)"**: Falso em geral. ℚ(√5) tem 𝒪_K = ℤ[(1+√5)/2] (golden ratio), não ℤ[√5]. ℚ(α) com α raiz de x³ − x − 1: 𝒪_K = ℤ[α] (lucky); mas para α raiz de x³ + 11x − 4: 𝒪_K ⊋ ℤ[α]. Computar 𝒪_K explicitamente é trabalhoso — usar Magma/Sage/PARI.

**"Fatoração de p em primos é única"**: a fatoração **de ideais** é única. Mas a escolha de geradores não é (ideal 𝔭 = (π) tem π determinado a menos de unidade, e unidades podem ser infinitas em 𝒪_K). Esse é literalmente o ponto: Kummer trocou números por ideais para recuperar unicidade.

**"ℤ_p = {0, 1, ..., p−1, p, p+1, ...}"**: não. ℤ_p contém somas infinitas a₀ + a₁p + a₂p² + ... com aᵢ ∈ {0,...,p−1}. Tem cardinalidade contínua, é compacto Hausdorff. ℤ ⊂ ℤ_p como subset denso. Inteiros negativos: −1 = (p−1) + (p−1)p + (p−1)p² + ... em ℤ_p.

**"Hensel é só lifting Newton p-ádico"**: o método é Newton aplicado em ℤ_p, mas a profundidade é maior. Hensel garante: se f(x) ∈ ℤ_p[x] e f(a₀) ≡ 0 mod p com f'(a₀) ≢ 0 mod p, então existe único α ∈ ℤ_p com f(α) = 0 e α ≡ a₀ mod p. Sem hipótese f'(a₀) ≠ 0, falha pode ocorrer.

**"Adèles é abstração desnecessária; trabalhar em cada lugar separado é equivalente"**: locamente sim, mas globalmente não. Reciprocidade de Artin, BSD, equação funcional de L(s, χ) — tudo se enuncia adèlica e prova-se via análise harmônica em GL_n(𝔸_K). Tate's thesis (1950) demonstrou que abordagem adèlica unifica e simplifica drasticamente análise clássica de Hecke.

**"Programa de Langlands é só conjectura abstrata"**: Wiles provou modularidade de curvas elípticas semi-estáveis (caso especial de Langlands) → último teorema de Fermat (1995). Modularidade completa por Breuil-Conrad-Diamond-Taylor (2001). Sato-Tate, BSD-rank-zero, FLT — todos consequências concretas. Langlands é programa de pesquisa, não filosofia.

## Aplicação em CS/Dev/ML

**Criptografia de curvas elípticas (ECC)**: ECDSA, EdDSA, ECDH baseadas no problema do logaritmo discreto em E(𝔽_p) com E curva elíptica. Curve25519 (Bernstein) é padrão TLS 1.3. NIST P-256, P-384. Segurança ~2^{160} bits em curvas de 256 bits — vs RSA 2048 bits para mesma segurança.

**Pairings em criptografia avançada**: pairings de Weil/Tate em curvas pairing-friendly (BLS12-381) habilitam: BLS signatures (agregáveis, usadas em Ethereum 2.0), identity-based encryption (Boneh-Franklin), ZK-SNARKs (Groth16, PLONK). Sem TAN moderna, nenhuma dessa primitivas existe.

**PQ-Crypto baseada em reticulados**: Kyber (KEM), Dilithium (signature) — padronizados NIST 2024. Segurança vem de problemas em reticulados ideais sobre ℤ_q[X]/(Xⁿ+1) (anéis ciclotômicos truncados). Análise de segurança usa TAN: anel de inteiros, ramificação, geometria de Minkowski.

**Isogeny-based PQ-crypto**: SIKE foi quebrado em 2022 (ataque de Castryck-Decru via grafos de isogenias). CSIDH e SQIsign continuam. Computação envolve morfismos entre curvas elípticas, anéis de endomorfismo (quaternion orders) — TAN puro.

**Number Theoretic Transform (NTT)**: DFT em ℤ/p, p primo, com p ≡ 1 mod 2N. Multiplicação polinomial em ℤ_p[X]/(Xⁿ−1) em O(n log n). Usado em FHE (BGV, BFV, CKKS), Kyber, Dilithium.

**Reduções de reticulados (LLL, BKZ)**: algoritmos clássicos em TAN computacional. LLL é polinomial mas dá aproximação fraca; BKZ é exponencial mas melhor. Determinam segurança real de schemes lattice-based.

## Como praticar

- **Livro base**: Marcus — *Number Fields* (didático, computacional). Neukirch — *Algebraic Number Theory* (canônico moderno, completo, adèlico). Lang — *Algebraic Number Theory* (denso, referência). Janusz — *Algebraic Number Fields* (sólido americano). Para p-ádicos: Koblitz — *p-adic Numbers, p-adic Analysis, and Zeta-Functions*.
- **PARI/GP, Sage**: instale Sage (open-source). Compute 𝒪_K para K = ℚ(α) com α raiz de polinômio dado: `K.<a> = NumberField(x^3 - x - 1); K.ring_of_integers()`. Fatoração de primos: `K.factor(11)`. Grupo de classe: `K.class_group()`. Unidades: `K.units()`.
- **Resolva problemas clássicos**: (a) determine 𝒪_K para K = ℚ(√−23) e mostre que tem número de classe 3; (b) fatore 5 e 7 em ℤ[ζ_7] (inteiros ciclotômicos); (c) demonstre que ℤ[√−5] não é UFD exibindo 6 = 2·3 = (1+√−5)(1−√−5) e mostre que os fatores são primos relativos.
- **Calcule explicitamente com p-ádicos**: ache √2 em ℚ_7 (existe, pois 2 é resíduo quadrático mod 7); compute os primeiros 10 dígitos da expansão p-ádica. Verifique Hensel: comece com a₀ = 3 (pois 3² = 9 ≡ 2 mod 7) e refine.
- **Implemente ECC simples**: curva E: y² = x³ + ax + b sobre 𝔽_p. Adição de pontos, multiplicação escalar. Compute |E(𝔽_p)| via Schoof's algorithm (ou contagem direta para p pequeno). Compare ECDLP com DLP em 𝔽_p* — exponencialmente mais difícil em ECC.
- **Lean 4 / Mathlib**: tem `NumberField`, `Ideal`, `DiscreteValuation`, `Padic`. Formalize anel de inteiros de ℚ(√2), fatoração de 5 em ℤ[i].
- **Projeto**: implemente versão simplificada de BLS signature (agregada) usando pairing de Tate em curva BLS12-381 (via biblioteca como py_ecc). Entenda cada passo: chave secreta = ℤ_q, pública = g^x ∈ G₁, assinatura = H(m)^x ∈ G₂, verificação = e(g, σ) = e(pk, H(m)).

## Exercícios práticos

1. **[Rank E]** Calcule 𝒪_K para K = ℚ(i) = ℚ(√−1). Determine: (a) base de 𝒪_K como ℤ-módulo; (b) fatoração de 2, 3, 5, 7, 11, 13 em ideais primos; (c) número de classe h_K. *Dica: (a) 𝒪_K = ℤ[i] (inteiros Gaussianos), base {1, i}. (b) 2 = −i(1+i)² (ramificado), 3 inerte, 5 = (2+i)(2−i) (cinde), 7 inerte, 11 inerte, 13 = (3+2i)(3−2i). Regra: p ímpar cinde ⟺ p ≡ 1 mod 4; inerte ⟺ p ≡ 3 mod 4. (c) h_K = 1.*

2. **[Rank D]** Mostre que ℤ[√−5] não é domínio de fatoração única exibindo dois fatorações não-equivalentes de 6. Em seguida, demonstre que os fatores são primos (irredutíveis). *Dica: 6 = 2 · 3 = (1+√−5)(1−√−5). Norma: ℕ(a+b√−5) = a²+5b². ℕ(2) = 4, ℕ(3) = 9, ℕ(1±√−5) = 6. Se 2 = αβ com α, β não-unidades, então ℕ(α)ℕ(β) = 4 implica ℕ(α) = 2, mas a²+5b² = 2 não tem solução em ℤ. Logo 2 é irredutível. Argumento análogo para 3, 1±√−5. Para mostrar não-equivalência: 2 não divide 1±√−5 (verificar via norma).*

3. **[Rank C]** Demonstre o teorema de Hensel: se f(x) ∈ ℤ_p[x] e a₀ ∈ ℤ_p satisfaz f(a₀) ≡ 0 mod p e f'(a₀) ≢ 0 mod p, então existe único α ∈ ℤ_p com f(α) = 0 e α ≡ a₀ mod p. *Dica: defina iterativamente a_{n+1} = a_n − f(a_n)/f'(a_n) (Newton p-ádico). Mostre por indução que f(a_n) ≡ 0 mod p^{n+1} (use Taylor: f(a_n + h) = f(a_n) + f'(a_n)h + O(h²); aplicando à correção, ganha-se uma potência de p por iteração). A sequência é Cauchy em ℤ_p (completude); o limite α satisfaz f(α) = 0 (continuidade). Unicidade: dois zeros próximos divergem por Taylor + |f'(a₀)|_p = 1.*

4. **[Rank B]** Demonstre o teorema das unidades de Dirichlet em sua forma fraca: para corpo de números K com r₁ mergulhos reais e r₂ pares de mergulhos complexos conjugados, o grupo de unidades 𝒪_K* tem posto exatamente r₁ + r₂ − 1 (como ℤ-módulo, módulo a torsão). *Dica: defina o mapa log L: 𝒪_K* → ℝ^{r₁+r₂} por L(α) = (log|σ₁(α)|, ..., log|σ_{r₁}(α)|, 2log|σ_{r₁+1}(α)|, ..., 2log|σ_{r₁+r₂}(α)|). Núcleo: μ_K (raízes da unidade), finito. Imagem L(𝒪_K*) está contida no hiperplano Σ xᵢ = 0 (pois ℕ(unidade) = ±1). Mostre que L(𝒪_K*) é discreto (lema de Minkowski geometria dos números aplicado a 𝒪_K) e cobre o hiperplano (constructive: para cada direção, ache unidades grandes via geometria de números). Posto = dim do hiperplano = r₁+r₂−1.*

5. **[Rank A] [BOSS]** Demonstre a equação funcional da função zeta de Dedekind ζ_K(s) = Σ_𝔞 ℕ(𝔞)^{−s} para corpo de números K: defina Λ_K(s) = |d_K|^{s/2} (Γ_ℝ(s))^{r₁} (Γ_ℂ(s))^{r₂} ζ_K(s) com Γ_ℝ(s) = π^{−s/2}Γ(s/2), Γ_ℂ(s) = (2π)^{1−s}Γ(s). Então Λ_K(s) = Λ_K(1−s). *Dica: estratégia de Hecke (1917) ou Tate (1950). (a) Hecke: use representação integral Λ_K(s) = ∫_0^∞ (θ_K(it) − 1) t^{s/2} dt/t, onde θ_K é série teta sobre todos os ideais inteiros, com termo constante 1 isolado. Separe em [0,1] + [1,∞]. Em [0,1] use transformação modular θ_K(i/t) = t^{n/2}|d_K|^{−1/2} θ_K(it) (deriva da fórmula de Poisson aplicada a 𝒪_K como reticulado em ℝⁿ ≅ K_∞). Equação funcional emerge.* (b) Tate: integre função teste Schwartz-Bruhat sobre 𝔸_K* contra caráter |·|^s; equação funcional vem da fórmula de Poisson adèlica + auto-dualidade. Tate é mais elegante e generaliza a todos os corpos globais.*

## Próximos passos

- [teoria-dos-numeros](teoria-dos-numeros) — pré-requisito: aritmética elementar
- [algebra-galois](algebra-galois) — Galois é a estrutura por trás de TAN
- [algebra-comutativa](algebra-comutativa) — anéis de Dedekind como Krull dim 1 + integralmente fechado
- [analise-harmonica](analise-harmonica) — análise adèlica em 𝔸_K para L-funções
- [analise-complexa](analise-complexa) — continuação analítica de zeta/L
- → Pratique no /math-quest na área **Álgebra** (Rank A+)
