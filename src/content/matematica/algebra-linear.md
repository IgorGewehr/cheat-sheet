---
title: Álgebra Linear
category: matematica
stack: [Mat, Python, NumPy]
tags: [algebra, fundamentos, aplicada]
excerpt: Espaços vetoriais, transformações lineares, autovetores e decomposições — a matemática que todo ML usa.
related: [estruturas-algebricas, calculo-multivariavel, probabilidade, analise-numerica]
updated: 2026-05
---

## O que é

Álgebra Linear é o estudo de espaços vetoriais, transformações lineares entre eles, e a representação dessas transformações por matrizes. É a área da matemática mais diretamente relevante para computação científica, machine learning, e ciência de dados.

Um **espaço vetorial** sobre um corpo 𝕂 (tipicamente ℝ ou ℂ) é um conjunto V com duas operações — adição e multiplicação por escalar — satisfazendo oito axiomas (associatividade, comutatividade, elemento neutro, inverso aditivo, distributividade, etc.). Exemplos: ℝⁿ, polinômios de grau ≤ n, funções contínuas em [a,b], sequências de quadrado somável ℓ².

Uma **transformação linear** T: V → W satisfaz T(αu + βv) = αT(u) + βT(v). Toda transformação linear de ℝⁿ para ℝᵐ é representada por uma matriz m×n após escolha de bases. Mudar a base muda a representação — mas não muda a transformação. Álgebra linear é, em essência, o estudo de como separar propriedades intrínsecas das transformações (autovalores) das acidentais (escolha de base).

## Por que estuda

Sem álgebra linear, não existe ML. Dados são matrizes; modelos lineares são matrizes; redes neurais são composições de transformações lineares com não-linearidades; gradientes são vetores; otimização é navegação em espaço vetorial. NumPy, PyTorch, JAX — todas as operações fundamentais são álgebra linear.

Para o matemático, álgebra linear é o template de estrutura axiomática — a forma de pensar por abstração e depois instanciar em contextos concretos. O mesmo teorema sobre espaços vetoriais se aplica a ℝⁿ, a espaços de funções (L²), a espaços de polinômios.

## Conceitos-chave

- **Base, dimensão e coordenadas**: um conjunto B = {v₁,…,vₙ} é base de V se é linearmente independente e V = span(B). Dim(V) = n. Toda base tem o mesmo número de elementos. Coordenadas de v em relação a B: (a₁,…,aₙ) tal que v = Σaᵢvᵢ.
- **Núcleo e imagem**: para T: V → W, Ker(T) = {v: T(v) = 0} ⊂ V, Im(T) = {T(v): v ∈ V} ⊂ W. Teorema do núcleo-imagem: dim(Ker T) + dim(Im T) = dim(V). Para A matriz n×m: rank(A) + nulidade(A) = m.
- **Determinante**: det(A) é o fator pelo qual A escala volumes. det(AB) = det(A)det(B). A é invertível ↔ det(A) ≠ 0. det(A) = produto dos autovalores. Para 2×2: det([[a,b],[c,d]]) = ad-bc. Para n×n: expansão de Laplace ou escalonamento de Gauss.
- **Autovalores e autovetores**: Av = λv. λ é autovalor se det(A - λI) = 0 (equação característica). Os autovetores correspondentes a λ formam o autoespaço E_λ = Ker(A - λI). Autovetores de autovalores distintos são linearmente independentes.
- **Diagonalização**: A é diagonalizável se existe base de autovetores. A = PDP⁻¹ onde D é diagonal (autovalores) e P é a matriz de mudança de base (autovetores nas colunas). Potências: Aⁿ = PDⁿP⁻¹. Condição suficiente: n autovalores distintos.
- **Produto interno e ortogonalidade**: produto interno ⟨u,v⟩ generaliza o produto escalar. Em ℝⁿ: ⟨u,v⟩ = uᵀv. Norma induzida: ||v|| = √⟨v,v⟩. Vetores ortogonais: ⟨u,v⟩ = 0. Processo de Gram-Schmidt: ortogonalização de qualquer base independente.
- **Decomposições matriciais**: LU (eliminação gaussiana: A = LU, L triangular inferior, U superior — resolve sistemas Ax = b). QR (A = QR, Q ortogonal, R triangular superior — base de algoritmos de autovalores). SVD (A = UΣVᵀ, U e V ortogonais, Σ diagonal com valores singulares — a decomposição mais útil).
- **SVD e aplicações**: A = UΣVᵀ. Os k maiores valores singulares σ₁ ≥ … ≥ σₖ > 0 capturam a estrutura de posto k mais próxima de A (em norma de Frobenius). Base de PCA, compressão de imagem, sistemas de recomendação (matrix factorization), LSA.
- **Álgebra multilinear e tensores**: produto tensorial V ⊗ W é espaço de mapas bilineares V* × W* → 𝕂, com dim(V ⊗ W) = dim(V)·dim(W). Tensor (k,l) é elemento de V^⊗k ⊗ (V*)^⊗l — k vezes contravariante, l vezes covariante. Em coords: T^{i₁...iₖ}_{j₁...jₗ}. Operações: produto tensorial, contração (traço sobre par de índices). Tensores diferentes-rank vivem em espaços diferentes — não somam diretamente. Convenção de Einstein: índices repetidos cima/baixo somam.
- **Formas bilineares e quadráticas**: B: V × V → 𝕂 bilinear; simétrica se B(v,w) = B(w,v). Matriz de B numa base: B_{ij} = B(eᵢ, eⱼ). Mudança de base: B' = PᵀBP (não P⁻¹BP como em operadores lineares). Forma quadrática associada: Q(v) = B(v,v). **Teorema de Sylvester (lei de inércia)**: número de autovalores positivos, negativos e zeros de B simétrica é invariante por mudança de base — assinatura (p, q, r). Aplicações: classificação de quádricas, geometria pseudo-Riemanniana (métrica de Lorentz tem assinatura (1, n−1)).
- **Espaço dual e bidual**: V* = mapas lineares V → 𝕂. dim V* = dim V (finito). Base dual: {e_i^*} com e_i^*(eⱼ) = δᵢⱼ. Bidual V**: para dimensão finita, V ≅ V** canonicamente via v ↦ ev_v (avaliação). Em dim. infinita: isomorfismo só vale com reflexividade (análise funcional). Anti-isomorfismo via produto interno em Hilbert (Riesz).
- **Forma canônica de Jordan**: para A complexa não-diagonalizável, existe base em que A = J = ⊕ J_{λᵢ,kᵢ}, com blocos de Jordan J_{λ,k} = λI + N (N nilpotente). Útil para classificar A a menos de similaridade, computar exponencial e^{At}, EDOs lineares com autovalores repetidos. Para matrizes reais: forma de Jordan real (blocos 2×2 para autovalores complexos conjugados).

## Confusões comuns

**"Matriz invertível e quadrada são sinônimos"**: Toda invertível é quadrada, mas não toda quadrada é invertível. A é invertível ↔ det(A) ≠ 0 ↔ rank(A) = n ↔ Ker(A) = {0}. Matrizes com linhas/colunas linearmente dependentes são singulares (não invertíveis).

**"Autovalores são sempre reais"**: Para matrizes reais arbitrárias, autovalores podem ser complexos. Para matrizes simétricas reais (Aᵀ = A), todos os autovalores são reais (teorema espectral). Para matrizes positivas definidas, todos os autovalores são positivos reais.

**"PCA é só escalar os dados"**: PCA muda a base do espaço de features para a base de autovetores da matriz de covariância — ou equivalentemente, aplica SVD aos dados centrados. Os componentes principais são direções de máxima variância, não escalamentos dos eixos originais.

**"Dois vetores são ortogonais se e somente se o produto escalar é zero"**: Isso é a definição em espaços com produto interno. Mas ortogonalidade é relativa ao produto interno escolhido. Em ℝⁿ com produto interno não-padrão ⟨u,v⟩ = uᵀAv (A positiva definida), ortogonalidade muda.

**"O espaço nulo e o espaço linha de A são independentes por acidente"**: Não. O teorema fundamental da álgebra linear diz que ℝⁿ = Im(Aᵀ) ⊕ Ker(A) (decomposição ortogonal). Espaço linha e espaço nulo são ortogonais e somam o espaço inteiro. Idem para espaço coluna e espaço nulo esquerdo.

## Aplicação em CS/Dev/ML

**PCA e redução de dimensionalidade**: PCA = SVD dos dados centrados. Reduz dimensão preservando máxima variância. Usado em pré-processamento, visualização (t-SNE parte de PCA), compressão. `sklearn.decomposition.PCA` usa SVD internamente.

**Sistemas de recomendação via matrix factorization**: a matriz usuário-item R ≈ UVᵀ (posto baixo). SVD truncada encontra a melhor aproximação de posto k. Alternating Least Squares (ALS) e variantes são o estado-da-arte em factorização colaborativa.

**Transformações em redes neurais**: cada camada linear é multiplicação matricial. Backpropagation propaga gradientes via transposta da jacobiana (que é matriz de álgebra linear). Inicialização (Xavier, He) é projetada para preservar variância dos sinais — análise de autovalores.

**Transformers e self-attention**: Q, K, V são projeções lineares dos embeddings. A atenção computa QKᵀ/√d_k (produto de matrizes) seguido de softmax. O mecanismo inteiro é álgebra linear + softmax.

**NumPy para álgebra linear**: `np.linalg.svd(A)`, `np.linalg.eig(A)`, `np.linalg.solve(A, b)`, `np.linalg.lstsq(A, b)`. `scipy.linalg` tem decomposições adicionais (LU, QR, Cholesky, Schur).

## Como praticar

- **Livro base**: Strang — *Introduction to Linear Algebra* (5a ed., MIT). Para nível mais abstrato: Axler — *Linear Algebra Done Right* (sem determinantes como ponto de partida). Em português: Steinbruch & Winterle — *Álgebra Linear*.
- **Resolver sistemas à mão**: escalonamento de Gauss, cálculo de determinante por expansão, inversão de matrizes 3×3. Velocidade aqui é necessária em análise e EDPs.
- **Implementar decomposições**: implemente LU sem pivô, Gram-Schmidt, e SVD (via iteração de potências) do zero. Compara com NumPy.
- **Curso MIT OCW 18.06**: Gilbert Strang, disponível gratuitamente. Melhor conjunto de videoaulas de álgebra linear existente.
- **Projeto**: implemente um sistema de recomendação via SVD truncada no dataset MovieLens-100k. Meça RMSE para diferentes números de componentes. Visualize os vetores latentes de filmes e usuários.

## Exercícios práticos

1. **[Rank E]** Resolva o sistema linear de 3 equações e 3 incógnitas pelo método de escalonamento de Gauss: 2x + y - z = 8; -3x - y + 2z = -11; -2x + y + 2z = -3. Exiba a matriz aumentada, os passos de eliminação e identifique o posto da matriz. *Dica: use a primeira equação para eliminar x das equações 2 e 3. Em seguida use a segunda equação pivô para eliminar y da terceira.*

2. **[Rank D]** Para a matriz A = [[2,1],[5,3]], calcule: (a) os autovalores λ₁, λ₂; (b) os autovetores correspondentes; (c) a decomposição espectral A = PDP⁻¹. Verifique que AP = PD. *Dica: det(A - λI) = (2-λ)(3-λ) - 5 = λ² - 5λ + 1 = 0. Os autovalores são (5 ± √21)/2. Para cada autovalor, resolva (A - λI)v = 0.*

3. **[Rank C]** Prove que a dimensão do espaço nulo (Null(A)) e o posto (rank(A)) de uma matriz A m×n satisfazem a equação do núcleo-imagem: rank(A) + dim(Null(A)) = n. *Dica: tome uma base {u₁,…,uₖ} de Null(A) e complete para uma base {u₁,…,uₖ,v₁,…,vᵣ} de ℝⁿ. Mostre que {Av₁,…,Avᵣ} é base de Im(A) (linearmente independente porque se Σcᵢ(Avᵢ) = 0, então A(Σcᵢvᵢ) = 0, logo Σcᵢvᵢ ∈ Null(A), e portanto Σcᵢvᵢ = Σdⱼuⱼ, mas {u,v} é base de ℝⁿ, logo todos cᵢ = 0).*

4. **[Rank B]** Calcule a decomposição SVD da matriz A = [[1,1],[0,1],[1,0]]: encontre as matrizes U (3×3 ortogonal), Σ (3×2 diagonal), Vᵀ (2×2 ortogonal) tais que A = UΣVᵀ. Use AᵀA para encontrar os valores singulares e os vetores direitos. *Dica: os valores singulares σᵢ são as raízes dos autovalores de AᵀA. Os vetores coluna de V são autovetores de AᵀA. Os vetores coluna de U são: uᵢ = (1/σᵢ)Avᵢ para i = 1,2; completa com vetor no Null(Aᵀ).*

5. **[Rank A] [BOSS]** Prove o teorema espectral para matrizes simétricas reais: toda matriz A ∈ ℝⁿˣⁿ com Aᵀ = A tem autovalores reais e autovetores ortogonais (para autovalores distintos). Estenda para mostrar que A é ortogonalmente diagonalizável: A = QDQᵀ com Q ortogonal e D diagonal real. *Dica: para autovalores reais: se Av = λv com v ∈ ℂⁿ, tome o produto interno complexo ⟨Av, v⟩ = λ||v||² e ⟨Av, v⟩ = ⟨v, Aᵀv⟩ = ⟨v, Av⟩ = λ̄||v||², logo λ = λ̄. Para ortogonalidade: se Av₁ = λ₁v₁ e Av₂ = λ₂v₂ com λ₁ ≠ λ₂, então λ₁⟨v₁,v₂⟩ = ⟨Av₁,v₂⟩ = ⟨v₁,Av₂⟩ = λ₂⟨v₁,v₂⟩, logo ⟨v₁,v₂⟩ = 0.*

## Próximos passos

- [calculo-multivariavel](calculo-multivariavel) — gradiente, Jacobiana e Hessiana são objetos de álgebra linear
- [probabilidade](probabilidade) — matrizes de covariância, distribuição normal multivariada
- [analise-numerica](analise-numerica) — algoritmos eficientes para as decomposições (BLAS, LAPACK)
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — programação linear, dualidade, quadrática convexa
- → Pratique no /math-quest na área **Álgebra Linear** (Rank C+)
