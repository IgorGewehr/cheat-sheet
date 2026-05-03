---
title: Teoria da Informação
category: matematica
stack: [Mat, Python]
tags: [aplicada, probabilidade, cs, fundamentos]
excerpt: Entropia de Shannon, informação mútua, capacidade de canal e teoremas de codificação — a matemática que define os limites do que pode ser comunicado e comprimido.
related: [probabilidade, estatistica-inferencia, analise-combinatoria, computabilidade-complexidade]
updated: 2026-05
---

## O que é

Teoria da Informação é o campo fundado por Claude Shannon em 1948 com o paper "A Mathematical Theory of Communication". Shannon resolveu dois problemas fundamentais: qual o mínimo de bits necessários para representar uma fonte de dados (compressão sem perda), e qual a taxa máxima de transmissão confiável por um canal com ruído (capacidade de canal). Ambas as respostas são expressas em termos de uma única quantidade: a **entropia**.

A **entropia de Shannon** de uma variável aleatória discreta X com distribuição P é H(X) = -Σ_x P(x) log₂ P(x) (medida em bits quando a base do log é 2, nats quando é e). H(X) mede a incerteza média de X, ou equivalentemente, o número mínimo médio de bits necessários para codificar uma realização de X. Uma distribuição uniforme em n resultados tem entropia máxima H = log₂ n; uma distribuição degenerada (um resultado certo) tem entropia zero.

O **primeiro teorema de Shannon** (codificação de fonte): a taxa mínima de compressão sem perda é a entropia H(X). O **segundo teorema de Shannon** (codificação de canal): sobre um canal binário simétrico com taxa de erro p, a capacidade de canal é C = 1 - H_b(p) bits por transmissão, onde H_b é a entropia binária. Existe código que transmite a qualquer taxa R < C com probabilidade de erro → 0. Para R > C, não existe.

## Por que estuda

Para o matemático, teoria da informação é análise e probabilidade aplicadas ao problema de comunicação. As provas dos teoremas de Shannon usam lei dos grandes números (típical sequences), análise funcional (desigualdades de Jensen, convexidade), e combinatória.

Para ML/CS: a entropia cruzada (cross-entropy) é a função de perda padrão em classificação — ela mede a "ineficiência" de usar distribuição Q para codificar dados de distribuição P. KL-divergence (Kullback-Leibler) mede quão diferentes são duas distribuições e aparece em todo lugar: VAEs (ELBO = reconstrução - KL), information bottleneck, distilação de modelos, aprendizado por reforço (PPO usa KL penalty). Mutual information é o critério ótimo para feature selection. Compressão (ZIP, zlib, LZ77) são implementações de codificação de fonte.

## Conceitos-chave

- **Entropia de Shannon**: H(X) = -Σ_x P(x) log₂ P(x). Propriedades: H ≥ 0; H = 0 sse X é determinístico; H(X) ≤ log₂ |X| (máximo para uniforme); H é côncava em P. Para variável contínua: entropia diferencial h(X) = -∫f(x)log f(x)dx (pode ser negativa).
- **Entropia conjunta e condicional**: H(X,Y) = -ΣΣ P(x,y) log P(x,y). Entropia condicional: H(Y|X) = Σ_x P(x) H(Y|X=x) = H(X,Y) - H(X). Regra da cadeia: H(X₁,…,Xₙ) = Σᵢ H(Xᵢ|X₁,…,Xᵢ₋₁).
- **Informação mútua**: I(X;Y) = H(X) - H(X|Y) = H(Y) - H(Y|X) = H(X) + H(Y) - H(X,Y). Mede quanto Y diz sobre X. Sempre I(X;Y) ≥ 0 (pela não-negatividade de KL-divergence). I(X;Y) = 0 sse X e Y são independentes.
- **KL-Divergence**: D_KL(P||Q) = Σ_x P(x) log(P(x)/Q(x)). Não é distância (assimétrica, não satisfaz desigualdade triangular). Sempre D_KL ≥ 0 (desigualdade de Gibbs, pelo Jensen). Interpretação: "custo" extra de codificar dados de P usando código ótimo para Q. Forward vs. reverse KL têm comportamentos muito diferentes em inferência variacional.
- **Código e compressão**: prefixo-livre é representável como árvore binária (Kraft inequality: Σ 2^{-lᵢ} ≤ 1). Código de Shannon: comprimento do símbolo x = ⌈-log₂ P(x)⌉ bits. Código de Huffman: ótimo para código simbólico, atinge H(X) ≤ L̄ < H(X) + 1. Codificação aritmética: comprime para H(X) bits por símbolo (assintoticamente).
- **Capacidade de canal**: canal discreto sem memória (DMC) com matriz de transição P(y|x). Capacidade C = max_{P(x)} I(X;Y). Canal binário simétrico (BSC) com erro p: C = 1 - H_b(p). Canal gaussiano (AWGN) com SNR = P/N: C = (1/2)log₂(1 + P/N) bits por símbolo (fórmula de Shannon-Hartley).
- **Desigualdade de processamento de dados (DPI)**: se X → Y → Z formam uma cadeia de Markov, então I(X;Z) ≤ I(X;Y). Processamento de dados não aumenta informação. Corolário: comprimir dado não revela mais sobre a fonte do que o dado original.
- **Sequências típicas**: para X₁,…,Xₙ iid com distribuição P, o conjunto típico Aₑ^{(n)} = {x^n: |-1/n log P(x^n) - H(X)| ≤ ε} tem probabilidade → 1, tamanho ≈ 2^{nH(X)}, e qualquer sequência típica tem probabilidade ≈ 2^{-nH(X)}. Formaliza a "lei dos grandes números" para informação e é o coração dos provas de Shannon.

## Confusões comuns

**"Entropia em termodinâmica e em informação são a mesma coisa"**: São formalmente análogas (ambas da forma -Σ p log p) mas conceitos distintos. A entropia termodinâmica mede desordem microscópica (graus de liberdade de um sistema físico). A entropia de Shannon mede incerteza de informação. A analogia é real — Boltzmann havia chegado à mesma fórmula por razões físicas — mas as interpretações são diferentes.

**"Entropia diferencial é sempre não-negativa"**: Ao contrário da discreta, a entropia diferencial h(X) = -∫f log f pode ser negativa. Ex: X uniforme em [0, 1/2] tem h(X) = log(1/2) = -1 bit. Isso ocorre porque diferencial de informação é relativo ao elemento de volume — h(X) mede entropia relativa à medida de Lebesgue.

**"KL(P||Q) = KL(Q||P)"**: KL-divergence é assimétrica. Em inferência variacional, minimizar KL(Q||P) (reverse KL, "exclusive") tende a produzir aproximações que cobrem um modo de P. Minimizar KL(P||Q) (forward KL, "inclusive") tende a cobrir todos os modos. Essa assimetria importa em prática.

**"Compressão sem perda pode sempre chegar abaixo da entropia"**: Não. A entropia H(X) é o limite fundamental: nenhum código sem perda pode comprimir para menos que H(X) bits por símbolo em média. Qualquer código abaixo desse limite necessariamente terá erros de decodificação.

**"Canal de capacidade C transmite C bits por símbolo de forma exata"**: A capacidade é um limite assintótico. Para qualquer ε > 0, existe código de bloco com taxa R < C e probabilidade de erro < ε para n suficientemente grande. Para n finito, sempre há um custo.

## Aplicação em CS/Dev/ML

**Cross-entropy loss em classificação**: para y_true ~ P e y_pred ~ Q, H(P,Q) = -Σ P(y) log Q(y) = H(P) + D_KL(P||Q). Minimizar cross-entropy minimiza KL entre predição e verdade. Para distribuição one-hot (classificação exata), H(P,Q) = -log Q(y_true) = log-loss.

**VAE e ELBO**: o ELBO (Evidence Lower BOund) = E_q[log p(x|z)] - D_KL(q(z|x)||p(z)). O segundo termo penaliza o quão longe o encoder q fica do prior p(z). Minimizar KL(q||p) em VAEs (reverse KL) causa o fenômeno de "posterior collapse" para dimensões que o decoder não usa.

**Feature selection via informação mútua**: I(X_i; Y) mede quanto a feature i informa sobre o label Y. Algoritmos como mRMR (minimum Redundancy Maximum Relevance) selecionam features que maximizam informação sobre Y e minimizam redundância entre elas.

**Compressão em Python**: `zlib.compress(data)` implementa DEFLATE (LZ77 + Huffman). `bz2.compress` usa BWT + Huffman. `lzma.compress` implementa LZMA. A eficácia de compressão é limitada pela entropia da fonte — dados puramente aleatórios não comprimem.

**SciPy e scikit-learn**: `scipy.stats.entropy(p, q)` calcula H(P) ou D_KL(P||Q). `sklearn.metrics.mutual_info_score(x, y)` calcula I(X;Y). `sklearn.feature_selection.mutual_info_classif` para feature selection.

## Como praticar

- **Livro base**: Cover & Thomas — *Elements of Information Theory* (2a ed., Wiley) — a referência padrão, rigoroso e completo. MacKay — *Information Theory, Inference, and Learning Algorithms* (Cambridge, disponível online gratuitamente) — mais acessível e com foco em aplicações.
- **Calcular entropias à mão**: para distribuições pequenas (3-4 resultados), calcule H, H(X|Y), I(X;Y) manualmente. Entenda por que I(X;Y) = 0 para X, Y independentes e I(X;X) = H(X).
- **Implementar código de Huffman**: escreva o algoritmo de Huffman do zero em Python. Comprima um texto e compare comprimento médio com H(X) teórica.
- **Visualizar KL e cross-entropy**: plote D_KL(N(0,1)||N(μ,1)) em função de μ. Observe que o mínimo é em μ = 0. Compare forward e reverse KL para uma mistura gaussiana.
- **Projeto**: implemente compressão por codificação aritmética (arithmetic coding) e compare com Huffman num corpus de texto. Meça a eficiência em bits/símbolo vs. H(texto).

## Exercícios práticos

1. **[Rank E]** Calcule a entropia de Shannon (em bits) para as distribuições: (a) X uniforme em {A, B, C, D} (4 símbolos igualmente prováveis); (b) X com P(A) = 1/2, P(B) = 1/4, P(C) = 1/8, P(D) = 1/8. Construa o código de Huffman ótimo para cada caso e verifique que o comprimento médio é ≥ H(X). *Dica: (a) H = log₂ 4 = 2 bits; (b) H = (1/2)·1 + (1/4)·2 + (1/8)·3 + (1/8)·3 = 1.75 bits. Para Huffman em (b): A=0(1 bit), B=10(2 bits), C=110(3 bits), D=111(3 bits) → comprimento médio = 1.75 bits = H(X).*

2. **[Rank D]** Para X e Y com distribuição conjunta P(X=0,Y=0) = 1/4, P(0,1) = 1/4, P(1,0) = 1/4, P(1,1) = 1/4: calcule H(X), H(Y), H(X,Y), H(X|Y), H(Y|X), I(X;Y). Interprete o resultado de I(X;Y). *Dica: X e Y são independentes uniformes, portanto H(X) = H(Y) = 1 bit, H(X,Y) = 2 bits, H(X|Y) = H(X) = 1 bit, I(X;Y) = 0. Nenhuma informação de Y sobre X.*

3. **[Rank C]** Prove a desigualdade de Gibbs: D_KL(P||Q) ≥ 0 com igualdade sse P = Q. Use a desigualdade de Jensen: para função côncava f, E[f(X)] ≤ f(E[X]). *Dica: D_KL(P||Q) = -Σ P(x) log(Q(x)/P(x)) ≥ -log(Σ P(x) · Q(x)/P(x)) = -log(Σ Q(x)) = -log(1) = 0. A igualdade em Jensen vale sse a função é constante no suporte de P, i.e., Q(x)/P(x) = cte para todo x com P(x)>0, o que implica P = Q.*

4. **[Rank B]** Prove o primeiro teorema de Shannon (compressão de fonte): para X₁,…,Xₙ iid com entropia H(X), o conjunto típico Aₑ^{(n)} tem as seguintes propriedades: (a) P(Aₑ^{(n)}) → 1 quando n → ∞; (b) |Aₑ^{(n)}| ≤ 2^{n(H+ε)}; (c) |Aₑ^{(n)}| ≥ (1-δ)2^{n(H-ε)} para n grande. Conclua que a taxa mínima de compressão é H(X). *Dica: (a) usa lei fraca dos grandes números aplicada a -1/n log P(Xⁿ), que converge em probabilidade para H(X). (b) é contagem: |Aₑ| × 2^{-n(H+ε)} ≤ Σ_{x∈Aₑ} P(x) ≤ 1. (c): 1-δ ≤ P(Aₑ) = Σ_{x∈Aₑ} P(x) ≤ |Aₑ| × 2^{-n(H-ε)}.*

5. **[Rank A] [BOSS]** Prove a fórmula de capacidade de canal gaussiano: para um canal Y = X + Z onde Z ~ N(0,N) (ruído gaussiano) e com restrição de potência E[X²] ≤ P, a capacidade é C = (1/2)log₂(1 + P/N) bits por uso. Use dois passos: (a) demonstre que a entrada que maximiza I(X;Y) é X ~ N(0,P) (a distribuição gaussiana maximiza a entropia diferencial para variância fixada); (b) calcule I(X;Y) para X ~ N(0,P) e Z ~ N(0,N) independentes. *Dica: h(X) ≤ (1/2)log₂(2πeσ²) para qualquer X com variância σ², com igualdade para X gaussiano (teorema da máxima entropia gaussiana). Para X ~ N(0,P), Z ~ N(0,N): Y ~ N(0,P+N). I(X;Y) = h(Y) - h(Y|X) = h(Y) - h(Z) = (1/2)log₂(2πe(P+N)) - (1/2)log₂(2πeN) = (1/2)log₂(1 + P/N).*

## Próximos passos

- [probabilidade](probabilidade) — variáveis aleatórias, distribuições e convergência
- [estatistica-inferencia](estatistica-inferencia) — estimação e testes de hipóteses usam entropia e KL
- [analise-combinatoria](analise-combinatoria) — contagem de sequências típicas
- [computabilidade-complexidade](computabilidade-complexidade) — complexidade de Kolmogorov como entropia algorítmica
- → Pratique no /math-quest na área **Probabilidade/Estatística** (Rank C+)
