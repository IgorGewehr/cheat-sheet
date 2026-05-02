---
title: Teoria dos Números
category: matematica
stack: [Mat]
tags: [discreta, fundamentos]
excerpt: Divisibilidade, primos, congruências e os fundamentos da criptografia moderna.
related: [logica-matematica, analise-combinatoria, estruturas-algebricas, tecnicas-demonstracao]
updated: 2026-05
---

## O que é

Teoria dos Números é o ramo da matemática que estuda as propriedades dos números inteiros — em especial dos números primos. É um dos campos mais antigos da matemática (Euclides provou a infinidade dos primos ≈300 a.C.) e ao mesmo tempo um dos mais ativos hoje (a hipótese de Riemann, aberta desde 1859, tem prêmio de 1 milhão de dólares do Instituto Clay).

Gauss chamou a teoria dos números de "a rainha das matemáticas" — ela é elegante, seus resultados são frequentemente surpreendentes e suas provas criam técnicas que influenciam toda a matemática. O teorema de Fermat-Wiles (prova do Último Teorema de Fermat, 1995) mobilizou análise complexa, geometria algébrica e teoria das formas modulares — a teoria dos números moderna é interdisciplinar.

Formalmente, o campo cobre: divisibilidade e o algoritmo de Euclides, números primos e sua distribuição (teorema dos números primos), congruências e aritmética modular (Gauss), resíduos quadráticos e reciprocidade quadrática, e funções aritméticas (função de Euler, função de Möbius).

## Por que estuda

Para o matemático, teoria dos números combina elementar e profundo de maneira única: os enunciados são acessíveis, as provas exigem criatividade real. É campo onde demonstração por indução e contradição aparecem com frequência máxima.

Para dev/engenheiro de segurança: toda a criptografia moderna é teoria dos números aplicada. RSA depende da dificuldade de fatorar produtos de primos grandes. Curvas elípticas sobre corpos finitos (ECC) dependem de aritmética modular. Hashing, protocolos de acordo de chave (Diffie-Hellman), assinaturas digitais — tudo é teoria dos números.

## Conceitos-chave

- **Divisibilidade e MDC**: a | b (a divide b) se existe k tal que b = ka. MDC(a,b) é o maior divisor comum. Algoritmo de Euclides: MDC(a,b) = MDC(b, a mod b), base de quase toda a computação numérica com inteiros.
- **Identidade de Bezout**: dados a, b inteiros com MDC(a,b) = d, existem inteiros x, y tais que ax + by = d. Algoritmo de Euclides estendido os encontra. Base para calcular inversos modulares.
- **Teorema fundamental da aritmética**: todo inteiro n > 1 se escreve de forma única como produto de primos (a menos da ordem). Unicidade é não trivial e requer prova.
- **Aritmética modular**: a ≡ b (mod n) se n | (a-b). Congruências formam ℤ/nℤ, um anel. Se n é primo, ℤ/pℤ é corpo (campo). Base do algoritmo RSA e de todos os cifras de chave pública.
- **Teorema de Fermat (pequeno)**: se p é primo e p ∤ a, então a^{p-1} ≡ 1 (mod p). Generalização: teorema de Euler: a^{φ(n)} ≡ 1 (mod n) quando MDC(a,n) = 1.
- **Função de Euler (φ)**: φ(n) = |{k : 1 ≤ k ≤ n, MDC(k,n) = 1}|. φ(p) = p-1. φ(pq) = (p-1)(q-1) para p,q primos distintos — chave da construção RSA.
- **Teorema Chinês dos Restos (CRT)**: dado sistema de congruências x ≡ a_i (mod n_i) com n_i coprimos entre si, existe solução única módulo n₁·n₂·…·n_k. Usado em computação para operações com inteiros grandes e na criptografia.
- **Distribuição dos primos**: teorema dos números primos — π(x) ~ x/ln(x) onde π(x) conta primos ≤ x. A hipótese de Riemann refina isso: diz que os zeros não triviais de ζ(s) = Σ n^{-s} têm todos parte real 1/2.

## Confusões comuns

**"1 é primo"**: Não. Primos são definidos como inteiros maiores que 1 com exatamente dois divisores positivos (1 e si mesmo). Incluir 1 quebraria o teorema fundamental da aritmética (unicidade da fatoração).

**"a ≡ b (mod n) significa que a e b têm o mesmo resto ao dividir por n"**: Isso é verdade mas é a consequência, não a definição. A definição é n | (a - b). Começar pela definição torna as provas mais claras.

**"Se MDC(a, n) = 1, então a tem inverso módulo n — mas calcular esse inverso é difícil"**: Não é difícil — o algoritmo de Euclides estendido calcula o inverso em O(log n) operações. O que é presumivelmente difícil é fatorar n (e é essa dificuldade que protege RSA).

**"O teorema do pequeno Fermat prova que p é primo"**: Ao contrário: o teorema diz que se p é primo, então a^{p-1} ≡ 1 (mod p). A recíproca é falsa — existem compostos que satisfazem a congruência para todo a (números de Carmichael). Pseudoprimalidade não é primalidade.

**"RSA é seguro porque fatorar é NP-completo"**: Fatorar não é sabidamente NP-completo. Está em NP ∩ co-NP, e sua hardness é uma hipótese não provada. O algoritmo de Shor (computador quântico) fatora em tempo polinomial — RSA é vulnerável a computadores quânticos suficientemente grandes.

## Aplicação em CS/Dev/ML

**RSA**: gera chave pública (n, e) com n = pq (p, q primos grandes), e coprimo com φ(n) = (p-1)(q-1). Cifra: c = m^e (mod n). Decifra: m = c^d (mod n) onde d é o inverso de e módulo φ(n). Segurança depende de n ser difícil de fatorar.

**Criptografia de curvas elípticas (ECC)**: opera em grupos de pontos de curvas y² = x³ + ax + b sobre ℤ/pℤ. Problema do logaritmo discreto em curvas elípticas é mais difícil que em ℤ/pℤ, então chaves menores dão segurança equivalente. Ed25519, P-256, secp256k1 (Bitcoin).

**Hashing e tabelas hash**: tabelas hash de boa qualidade usam funções hash modulares com tamanho primo para minimizar colisões. Primos de Mersenne (2^p - 1) aparecem em algoritmos de rolling hash (Rabin-Karp).

**Geração de números pseudoaleatórios**: Blum Blum Shub e outros geradores criptograficamente seguros dependem de teoria dos números (resíduos quadráticos).

**Transformada Numérica de Teorema (NTT)**: versão da FFT em aritmética modular. Usada em criptografia pós-quântica (CRYSTALS-Kyber, ML-KEM) para multiplicação eficiente de polinômios em ℤ/qℤ.

## Como praticar

- **Livro base**: Hefez — *Aritmética* (SBM). Para nível mais avançado: Hardy & Wright — *An Introduction to the Theory of Numbers* (clássico, em inglês).
- **Implementar do zero**: MDC de Euclides, Euclides estendido, exponenciação modular rápida (fast exponentiation), crivo de Eratóstenes. São 4 algoritmos que aparecem em toda computação criptográfica.
- **Resolver exercícios de congruência**: "encontre todos os x ∈ ℤ tais que 3x ≡ 7 (mod 11)". Faça 20 desses e internalize o processo.
- **SymPy**: `from sympy import isprime, factorint, gcd, mod_inverse, nthroot_mod`. Explore o módulo `sympy.ntheory`.
- **Projeto**: implemente RSA do zero em Python (geração de primos, cálculo de φ, inverso modular, cifra/decifra). Não use bibliotecas de criptografia para isso — o objetivo é entender a matemática.

## Exercícios práticos

1. **[Rank E]** Use o algoritmo de Euclides para calcular gcd(252, 105). Exiba cada passo da divisão com resto. Em seguida use o algoritmo de Euclides estendido para encontrar inteiros x, y tais que 252x + 105y = gcd(252, 105). *Dica: 252 = 2·105 + 42; 105 = 2·42 + 21; 42 = 2·21 + 0. Logo gcd = 21. Back-substitution: 21 = 105 - 2·42 = 105 - 2(252-2·105) = 5·105 - 2·252. Portanto x=-2, y=5.*

2. **[Rank D]** Prove o pequeno teorema de Fermat: se p é primo e p ∤ a, então aᵖ⁻¹ ≡ 1 (mod p). Use o argumento: os números a, 2a, 3a, …, (p-1)a são uma permutação de 1, 2, …, p-1 módulo p. *Dica: os valores ia (mod p) para i = 1,…,p-1 são todos distintos e não-nulos (se ia ≡ ja então p | (i-j)a; como p∤a, p | i-j; mas 0 < |i-j| < p — impossível). Logo {ia mod p} = {1,…,p-1}. Multiplicando: a^{p-1}·(p-1)! ≡ (p-1)! (mod p). Como p∤(p-1)!, divide: a^{p-1} ≡ 1.*

3. **[Rank C]** Resolva o sistema de congruências x ≡ 3 (mod 5), x ≡ 2 (mod 7), x ≡ 4 (mod 9) usando o teorema chinês dos restos. Encontre a solução única módulo 5·7·9 = 315. *Dica: M = 315, M₁ = 63, M₂ = 45, M₃ = 35. Calcule y₁ = M₁⁻¹ mod 5: 63 ≡ 3 (mod 5), 3⁻¹ ≡ 2 (mod 5). Similarmente y₂ mod 7 e y₃ mod 9. Solução: x ≡ 3·63·2 + 2·45·y₂ + 4·35·y₃ (mod 315).*

4. **[Rank B]** Prove que há infinitos primos da forma 4k + 3 (Dirichlet para progressão 4k+3). Use o seguinte argumento: suponha que p₁,…,pₙ são todos os primos 4k+3, e considere N = 4p₁p₂…pₙ - 1. Mostre que N tem um fator primo da forma 4k+3. *Dica: N ≡ -1 ≡ 3 (mod 4). Se todos os fatores primos de N fossem da forma 4k+1, o produto também seria 4k+1 — contradição. Portanto N tem um fator p ≡ 3 (mod 4). Como p | N e N = 4p₁…pₙ-1, p não é nenhum dos pᵢ (senão p | 1) — contradição com a lista completa.*

5. **[Rank A] [BOSS]** Prove o teorema de Quadrados de Fermat: um primo ímpar p é soma de dois quadrados inteiros (p = a² + b²) se e somente se p ≡ 1 (mod 4). Use o argumento de Zagier (prova de uma linha expandida): considere o conjunto S = {(x,y,z) ∈ ℕ³ : x²+4yz = p} e a involução τ: S → S que não tem ponto fixo e outra σ que tem ponto fixo único. Conclua que S tem cardinalidade ímpar, logo τ tem ponto fixo — que é a representação p = a² + b². *Dica: Zagier define τ(x,y,z) = (x+2z, z, y-x-z) se x < y-z; (2y-x, y, x-y+z) se x > 2y; (x-2y, x-y+z, y) em geral. τ é involução sem ponto fixo se p ≡ 1 (mod 4). A involução σ(x,y,z) = (x,z,y) tem ponto fixo único quando y = z, que significa p = x²+4y² = (x)² + (2y)² só se p ≡ 1 (mod 4) garantir que y=z é possível. A bijetividade de τ em S implica |S| ≡ 0 (mod 2), mas |S| é determinado pela paridade — completar o argumento mostrando |S| é ímpar e τ portanto tem ponto fixo.*

## Próximos passos

- [estruturas-algebricas](estruturas-algebricas) — ℤ/nℤ como anel, ℤ/pℤ como corpo
- [analise-combinatoria](analise-combinatoria) — contagem aplicada a problemas de teoria dos números
- [analise-complexa](analise-complexa) — função zeta de Riemann e distribuição de primos
- [tecnicas-demonstracao](tecnicas-demonstracao) — indução e contradição são as ferramentas mais usadas aqui
- → Pratique no /math-quest na área **Fundamentos** (Rank B+)
