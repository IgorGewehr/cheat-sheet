---
title: Teoria dos Grafos
category: matematica
stack: [Mat, Python]
tags: [discreta, aplicada]
excerpt: "Grafos como estrutura matemática: árvores, planaridade, coloração, fluxo e algoritmos."
related: [analise-combinatoria, algebra-linear, otimizacao-pesquisa-op, probabilidade]
updated: 2026-05
---

## O que é

Teoria dos Grafos é o estudo de grafos — estruturas formadas por vértices (ou nós) e arestas (conexões entre pares de vértices). Formalmente, um grafo G = (V, E) onde V é conjunto de vértices e E ⊆ V × V é conjunto de arestas. O campo nasceu com Euler em 1736, ao provar que o problema das Sete Pontes de Königsberg não tem solução — e ao fazê-lo, abstraiu a essência do problema: conectividade e grau dos vértices, não geometria.

Grafos podem ser dirigidos (arestas com direção, dígrafos), não-dirigidos, ponderados (arestas com peso), bipartidos, planares (desenháveis no plano sem cruzamento de arestas). Cada variante captura uma classe diferente de problemas do mundo real.

Teoria dos Grafos moderna é ampla: inclui teoria espectral (autovalores da matriz de adjacência), teoria de Ramsey (em qualquer grafo grande existe subestrutura ordenada), fluxo em redes (max-flow min-cut), grafos aleatórios (Erdős-Rényi), e teoria de grafos estrutural (conjecturas profundas como a de Hadwiger).

## Por que estuda

Grafos são a estrutura de dados mais universal: redes sociais, internet, rotas de transporte, dependências de código, moléculas, circuitos elétricos, mapas de conhecimento (knowledge graphs) — tudo é grafo. Para o matemático, grafos são laboratório para combinatória, álgebra linear e topologia.

Para dev: sistemas de banco de dados em grafo (Neo4j), algoritmos de roteamento (Dijkstra, A*), detecção de dependências circulares em módulos, análise de redes sociais, compiladores (grafos de controle de fluxo, grafos de dependência) — grafos aparecem em todo lugar. Para ML: graph neural networks (GNNs) são hoje estado-da-arte em química computacional, bioinformática e redes sociais. PageRank (Google) é teoria espectral de grafos.

## Conceitos-chave

- **Grau e handshaking lemma**: grau d(v) = número de arestas incidentes em v. Σ d(v) = 2|E| (cada aresta contribui 2 ao total de graus). Consequência: número de vértices de grau ímpar é sempre par.
- **Caminhos e conectividade**: caminho de u a v é sequência de vértices adjacentes. Grafo é conexo se existe caminho entre quaisquer dois vértices. Componentes conexas particionam V.
- **Árvores**: grafo conexo acíclico. Equivalências: (1) conexo e acíclico; (2) conexo com n-1 arestas; (3) qualquer dois vértices conectados por único caminho; (4) acíclico e adicionar qualquer aresta cria ciclo. Árvores espanhadoras (spanning trees) de um grafo ponderado são otimizadas por Prim e Kruskal.
- **Ciclos eulerianos e hamiltonianos**: ciclo euleriano passa por cada aresta exatamente uma vez (existe sse grafo é conexo e todo vértice tem grau par). Ciclo hamiltoniano passa por cada vértice exatamente uma vez — decidir se existe é NP-completo. Contraste elegante: euleriano é polinomial, hamiltoniano é NP-completo.
- **Planaridade**: grafo planar é desenhável sem cruzamento de arestas. Fórmula de Euler para grafos planares conexos: V - E + F = 2 (F = número de faces, incluindo a face externa). K₅ e K_{3,3} são os grafos não-planares mínimos (teorema de Kuratowski/Wagner).
- **Coloração de grafos**: número cromático χ(G) = número mínimo de cores para colorir vértices sem dois adjacentes com a mesma cor. Teorema das Quatro Cores: todo grafo planar tem χ ≤ 4 (prova de 1976 usa computador para verificar 1936 casos redutíveis). χ(G) ≤ Δ(G) + 1 (Δ = grau máximo) pelo algoritmo guloso.
- **Teoria espectral**: a matriz de adjacência A (ou laplaciana L = D - A) de um grafo tem autovalores que codificam sua estrutura. O segundo menor autovalor de L (conectividade algébrica, ou constante de Fiedler) mede quão difícil é desconectar o grafo. PageRank é o autovetor dominante de uma versão da matriz de transição.
- **Fluxo em redes**: grafo dirigido com capacidades nas arestas. Max-flow min-cut: o fluxo máximo de s a t iguala a capacidade do corte mínimo separando s de t (Ford-Fulkerson). Algoritmo de Edmonds-Karp corre em O(VE²).

## Confusões comuns

**"Árvore é um grafo com forma de árvore"**: Matematicamente, árvore é um grafo conexo sem ciclos. A forma visual de "árvore" é apenas representação. Uma cadeia linear de nós é uma árvore; um ciclo não é.

**"Grafo bipartido significa que tem dois lados iguais"**: Bipartido significa que os vértices se dividem em dois grupos V₁ e V₂ tal que toda aresta vai de V₁ para V₂ (sem arestas dentro de V₁ ou dentro de V₂). Os grupos não precisam ter o mesmo tamanho. Equivalente: o grafo não tem ciclos de comprimento ímpar.

**"Ciclo euleriano e ciclo hamiltoniano são variantes do mesmo problema"**: Estruturalmente diferentes. Ciclo euleriano é sobre arestas (cada uma exatamente uma vez) e tem caracterização simples. Ciclo hamiltoniano é sobre vértices e é NP-completo. São problemas de natureza completamente diferente.

**"Coloração de arestas é o mesmo que coloração de vértices"**: São diferentes. Coloração de arestas: colorir arestas sem dois incidentes em mesmo vértice com mesma cor. O índice cromático χ'(G) ≥ Δ(G) e por teorema de Vizing vale χ'(G) ∈ {Δ, Δ+1}.

**"Grafo planar ↔ grafo desenhado sem cruzamento"**: Planaridade é propriedade do grafo (abstrato), não do desenho. Um mesmo grafo planar pode ser desenhado com cruzamentos (mau desenho). A afirmação é: grafo planar admite ao menos um desenho sem cruzamentos.

## Aplicação em CS/Dev/ML

**Algoritmos de caminho mínimo**: Dijkstra em O((V+E) log V) com heap; Bellman-Ford em O(VE) para grafos com arestas negativas; Floyd-Warshall em O(V³) para todos os pares. Base de GPS, roteamento de redes, pipelines de CI/CD (dependências).

**Detecção de ciclos e ordenação topológica**: compiladores verificam dependências circulares entre módulos. Bundlers (webpack, esbuild) usam DFS com coloração de vértices para detectar ciclos e gerar ordenação topológica.

**Graph Neural Networks (GNNs)**: Message passing networks (GCN, GAT, GraphSAGE) propagam informação pela estrutura do grafo. Estado-da-arte em predição de propriedades moleculares (drug discovery), detecção de fraude em transações, sistemas de recomendação.

**PageRank**: cada página web é um vértice; link é aresta dirigida. PageRank(v) é proporcional à soma dos PageRanks dos vértices que apontam para v, ponderada pelo grau de saída. É o autovetor dominante de uma matrix de transição de Markov modificada.

**Banco de dados em grafo**: Neo4j usa Cypher (linguagem de consulta para grafos). Amazon Neptune, TigerGraph — usados em detecção de fraude, redes de conhecimento, roteamento.

## Como praticar

- **Livro base**: Diestel — *Graph Theory* (4a ed., disponível gratuito no site do autor). Em português: Lopes & Rauber — *Teoria dos Grafos* (livros universitários brasileiros).
- **Implementar BFS e DFS**: da raiz, implemente busca em largura e profundidade para grafos genéricos. Depois use-os para: conectividade, detecção de ciclo, ordenação topológica, componentes fortemente conexas (Tarjan, Kosaraju).
- **NetworkX**: `import networkx as nx`. Crie grafos, calcule caminhos mínimos, detecte planaridade, calcule PageRank, visualize com matplotlib. É a biblioteca de referência em Python.
- **Problemas clássicos**: implemente Dijkstra, Kruskal (árvore espanhadota mínima), detecção de ciclos. Resolva problemas de fluxo (max bipartite matching como max-flow).
- **Projeto ML**: treine um GNN simples com PyTorch Geometric em um dataset de grafos moleculares (QM9 ou ZINC). Entender o que o modelo faz requer entender a estrutura do grafo.

## Exercícios práticos

1. **[Rank E]** Para o grafo G com 5 vértices e arestas {12, 13, 23, 34, 45}, desenhe o grafo, calcule o grau de cada vértice, verifique o lema dos apertos de mão (Σ graus = 2|E|), e determine se o grafo é conexo. *Dica: graus: deg(1)=2, deg(2)=2, deg(3)=3, deg(4)=2, deg(5)=1. Soma = 10 = 2·5. Conexo: existe caminho entre qualquer par (verifique: 1-3-4-5, 1-2-3-4-5).*

2. **[Rank D]** Prove o teorema de Euler para grafos: um grafo conexo tem um circuito Euleriano (percorre todas as arestas exatamente uma vez) se e somente se todo vértice tem grau par. *Dica: necessidade: num circuito Euleriano, cada vez que passamos por um vértice usamos 2 arestas (entrada + saída), logo todo grau é par (o vértice inicial contribui com 2 para o par). Suficiência: argumento construtivo — inicie um caminho; ele não pode fechar antes de esgotar arestas (senão algum vértice teria grau ímpar); eventualmente fecha e forma um circuito; se nem todas as arestas foram usadas, encontre o vértice com aresta não-usada no circuito e insira um subcircuito.*

3. **[Rank C]** Para o grafo bipartido K₃,₃ (três vértices de cada lado, todos conectados a todos do outro lado), determine: (a) número de arestas; (b) verifique pela fórmula de Euler (V-E+F=2 para grafos planares, adaptada) se K₃,₃ é planar; (c) use o teorema de Kuratowski para concluir. *Dica: K₃,₃ tem 6 vértices, 9 arestas. Para planar, de V-E+F=2 e F ≥ E·2/4 = 4.5 (cada face tem ≥ 4 lados pois é bipartido): F ≥ ⌈9/2⌉. Mas 2-6+F = 2 → F = 8 < 9/2·2 — impossível. Logo K₃,₃ não é planar (e é menor topológico de qualquer grafo não-planar).*

4. **[Rank B]** Prove o teorema de Menger para cortes de vértices: o número máximo de caminhos internamente disjuntos (não compartilham vértices internos) entre dois vértices s e t é igual ao mínimo número de vértices que separa s de t (cujo remoção desconecta s de t). *Dica: use o teorema do fluxo máximo-corte mínimo (Max-Flow Min-Cut) de Ford-Fulkerson, após construir uma rede de fluxo onde cada vértice v ≠ s,t é dividido em v_in e v_out com aresta de capacidade 1, e cada aresta original tem capacidade infinita. O fluxo máximo = número de caminhos internamente disjuntos = corte mínimo de vértices.*

5. **[Rank A] [BOSS]** Prove o teorema de Ramsey R(3,3) = 6: em qualquer coloração das arestas de K₆ com duas cores (vermelho e azul), existe um triângulo monocromático. Mostre também que K₅ não tem essa propriedade (existe coloração de K₅ sem triângulo monocromático). *Dica: Para K₆: tome qualquer vértice v — ele tem 5 arestas. Por pombal (pigeonhole), pelo menos 3 arestas são da mesma cor, digamos vermelho, ligando v a u₁, u₂, u₃. Se alguma aresta entre u₁, u₂, u₃ for vermelha, forma triângulo vermelho com v. Se todas as arestas de {u₁,u₂,u₃} são azuis, o triângulo u₁u₂u₃ é azul. Para K₅: construa explicitamente uma 2-coloração de K₅ sem triângulo monocromático (o grafo de Petersen fornece uma).*

## Próximos passos

- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — problemas de fluxo e programação linear em grafos
- [probabilidade](probabilidade) — grafos aleatórios de Erdős-Rényi e percolação
- [algebra-linear](algebra-linear) — teoria espectral de grafos usa autovalores de matrizes
- [analise-combinatoria](analise-combinatoria) — contar caminhos, árvores espanhadoras, colorações
- → Pratique no /math-quest na área **Discreta** (Rank C+)
