---
title: Teoria da Computabilidade e Complexidade
category: matematica
stack: [Mat]
tags: [cs, fundamentos, discreta]
excerpt: "Máquinas de Turing, problema da parada, P vs NP, classes de complexidade e NP-completude — os limites do que computadores podem resolver e com que eficiência."
related: [logica-matematica, fundamentos-godel-zfc, analise-combinatoria, teoria-grafos-mat]
updated: 2026-05
---

## O que é

Teoria da Computabilidade pergunta: "o que pode ser computado por um algoritmo, em princípio, sem restrições de tempo e memória?" Teoria da Complexidade pergunta: "dentre os problemas computáveis, quais podem ser resolvidos eficientemente?"

Alan Turing formalizou o conceito de algoritmo em 1936 com a **Máquina de Turing**: um modelo abstrato com uma fita infinita, uma cabeça de leitura/escrita, e um conjunto finito de estados e regras de transição. A tese de Church-Turing afirma que qualquer função computável por um processo mecânico é computável por uma Máquina de Turing. Turing demonstrou que o **problema da parada** — "dado M e w, M para em w?" — é indecidível: nenhuma Máquina de Turing pode resolvê-lo.

Complexidade computacional, desenvolvida por Hartmanis, Stearns, Cook, Karp e Levin nas décadas de 1960-70, classifica problemas pela quantidade de recursos (tempo, espaço) necessários para resolvê-los. A questão mais famosa em matemática/ciência da computação é **P vs NP**: os problemas verificáveis em tempo polinomial (NP) são também solúveis em tempo polinomial (P)?

## Por que estuda

Para o matemático, computabilidade é o irmão formal da incompletude de Gödel — ambos são provas por diagonalização mostrando que sistemas formais não podem ser completos e decidíveis simultaneamente. Church e Turing, trabalhando independentemente em 1936, capturaram a mesma ideia de ângulos distintos.

Para o desenvolvedor: entender P vs NP e NP-completude é essencial para não tentar resolver problemas impossíveis e reconhecer quando um problema é intrinsecamente difícil. SAT, TSP, coloração de grafos, agendamento — inúmeros problemas reais são NP-completos. Criptografia repousa sobre a suposição (não provada) de que certos problemas (fatoração, logaritmo discreto) não estão em P.

## Conceitos-chave

- **Máquina de Turing (MT)**: tupla (Q, Σ, Γ, δ, q₀, q_aceita, q_rejeita) onde Q é conjunto de estados, Σ é alfabeto de entrada, Γ é alfabeto da fita (Σ ⊂ Γ), δ: Q×Γ → Q×Γ×{E,D} é função de transição. MT aceita w se atinge q_aceita, rejeita se atinge q_rejeita, pode "rodar para sempre". Uma linguagem L é decidível se alguma MT sempre para e decide L; reconhecível (semidecidível) se alguma MT aceita exatamente L (mas pode não parar nas rejeições).
- **Problema da parada**: A_TM = {⟨M, w⟩ : MT M aceita w}. Teorema: A_TM é indecidível. Prova por diagonalização: suponha que H decide A_TM. Construa D que, na entrada ⟨M⟩, simula H em ⟨M,⟨M⟩⟩ e faz o oposto. Pergunte: D aceita ⟨D⟩? Se sim, H diria que D rejeita ⟨D⟩, então D rejeita — contradição. Análoga à prova de incompletude de Gödel.
- **Redutibilidade**: A ≤_m B (A é redutível a B) se existe função total computável f tal que w ∈ A ↔ f(w) ∈ B. Se B é decidível e A ≤_m B, então A é decidível. Contrapositivo: se A é indecidível e A ≤_m B, então B é indecidível. Redução é a ferramenta para provar que novos problemas são indecidíveis, reduzindo o problema da parada a eles.
- **Classes P e NP**: P = {linguagens decididas por MT determinística em tempo polinomial O(n^k)}. NP = {linguagens com verificadores polinomiais}: L ∈ NP ↔ existe verificador V e polinômio p tal que w ∈ L ↔ ∃c, |c| ≤ p(|w|): V aceita ⟨w,c⟩. Equivalentemente: NP = {linguagens decididas por MT não-determinística em tempo polinomial}. P ⊆ NP. Se P = NP (não sabemos), verificar soluções não é mais fácil que encontrá-las.
- **NP-completude e redução de Cook**: um problema B é NP-completo se (1) B ∈ NP e (2) todo A ∈ NP é redutível a B (A ≤_p B) em tempo polinomial. SAT (satisfazibilidade de fórmulas booleanas) é NP-completo — teorema de Cook-Levin. Se SAT ∈ P, então P = NP. Os teoremas de Karp (1972) reduziram SAT a 21 outros problemas NP-completos (3-SAT, coloração de grafos, clique, cobertura por vértices, TSP, etc.).
- **Hierarquia polinomial**: PH (polynomial hierarchy) é a generalização de P e NP com múltiplos quantificadores alternados. Σ₁^P = NP, Π₁^P = co-NP, Σ₂^P = NP^NP, etc. A conjectura é que PH é infinita (sem colapso). Se P = NP, PH colapsa para P.
- **Classes de espaço**: PSPACE = problemas solucionáveis em espaço polinomial (tempo irrestrito). PSPACE contém PH. P ⊆ NP ⊆ PSPACE ⊆ EXPTIME. PSPACE-completo: QBF (quantified boolean formula). L (log-space), NL (non-deterministic log-space): NL = co-NL (Implicação de Szelepcsényi-Immerman).
- **Teorema de Cook-Levin (esboço)**: SAT ∈ NP-completo. Para mostrar que todo A ∈ NP ≤_p SAT: dada uma MT não-determinística N que decide A em tempo p(n), construir uma fórmula booleana φ_{N,w} (de tamanho polinomial em n) tal que φ_{N,w} é satisfazível ↔ N aceita w. φ codifica a "tabela de configuração" de N: variáveis booleanas representam o conteúdo de cada célula da fita em cada passo de tempo.

## Confusões comuns

**"NP significa 'não polinomial'"**: Não. NP significa "não-determinístico polinomial" — problemas decididos em tempo polinomial por uma MT não-determinística (ou, equivalentemente, com verificadores polinomiais). A questão P vs NP pergunta se todo problema cujas soluções podem ser verificadas rapidamente também pode ser encontrado rapidamente.

**"P ≠ NP já foi provado"**: Não. P vs NP é o maior problema aberto da ciência da computação e matemática. Há um prêmio de USD 1 milhão do Clay Mathematics Institute. Centenas de "provas" foram submetidas e todas tinham erros. A dificuldade é que provar P ≠ NP requer separar dois modelos de computação e as técnicas usuais (diagonalização, algebrização, naturalização) têm limitações conhecidas.

**"Se um problema é NP-completo, não tem algoritmo eficiente"**: A NP-completude diz que não há algoritmo polinomial no pior caso (assumindo P ≠ NP). Mas para instâncias práticas, algoritmos de aproximação, heurísticas (simulated annealing, genetic algorithms), algoritmos FPT (fixed-parameter tractable) ou estrutura especial do problema podem ser eficientes.

**"Problemas indecidíveis não têm solução prática"**: Problemas indecidíveis no caso geral podem ter versões restritas decidíveis. A verificação de programas (model checking) para sistemas finitos é decidível e muito usada. O Presburger arithmetic (aritmética sem multiplicação) é decidível. A fronteira entre decidível e indecidível depende da expressividade do modelo.

## Aplicação em CS/Dev/ML

**Criptografia e P vs NP**: a segurança da maioria da criptografia moderna (RSA, DH, ECC) assume que certos problemas (fatoração de inteiros, logaritmo discreto) não estão em P. Se P = NP, toda essa criptografia seria quebrada em tempo polinomial. A criptografia pós-quântica assume que certos problemas de reticulados não têm algoritmos quânticos eficientes.

**SAT solvers e aplicações**: SAT solvers modernos (DPLL, CDCL — Conflict-Driven Clause Learning, usados em MiniSat, Z3) resolvem instâncias de SAT com milhões de variáveis na prática, apesar da NP-completude teórica. Usados em verificação formal de hardware, síntese de programas, testes de segurança.

**Complexidade de algoritmos de ML**: treinar SVMs é quadrático no número de exemplos; redes neurais profundas são NP-difícil no pior caso para certas arquiteturas; inferência em modelos gráficos pode ser NP-completa (MAP inference em MRFs). Conhecer complexidade informa escolhas de arquitetura.

**Algoritmos de aproximação**: para NP-difícil TSP métrico, o algoritmo de Christofides garante solução ≤ 1.5 vezes a ótima. Para vertex cover, algoritmo simples dá razão 2. A teoria de aproximação (PCP theorem, hardness of approximation) classifica o "melhor factor de aproximação possível" para problemas NP-difíceis.

## Como praticar

- **Livro base**: Sipser — *Introduction to the Theory of Computation* (3a ed.) — o texto padrão, muito bem escrito, rigoroso e acessível. Para aprofundamento: Arora e Barak — *Computational Complexity: A Modern Approach* (Cambridge; draft gratuito online) — a referência avançada.
- **Praticar reduções**: dado um problema P₁ do qual se sabe NP-completude, reduzir P₁ ≤_p P₂ para mostrar NP-completude de P₂. Praticar com: 3-SAT ≤_p 3-Coloração, Vertex Cover ≤_p Independent Set, etc.
- **Implementar MT em Python**: simular uma Máquina de Turing para uma linguagem simples (palíndromos, {0ⁿ1ⁿ}). Verificar decidibilidade.
- **Resolver instâncias de SAT com Z3**: usar a biblioteca Z3 Python para expressar e resolver instâncias de satisfazibilidade. Formular um problema prático (scheduling, planejamento) como SAT.

## Exercícios práticos

1. **[Rank E]** Desenhe (como tabela de transição) uma Máquina de Turing que decide a linguagem {0ⁿ1ⁿ : n ≥ 0} (strings com n zeros seguidos de n uns, incluindo a string vazia). Descreva o funcionamento da MT em alto nível antes de especificar as transições. *Dica: a MT pode marcar símbolos correspondentes — marcar um 0 com X, percorrer até o último 1 não marcado, marcá-lo com X, repetir. Aceita se todos estão marcados; rejeita se as contagens não batem.*

2. **[Rank D]** Prove que o problema HALT_TM = {⟨M, w⟩ : MT M para com entrada w} é indecidível, usando uma redução de A_TM. *Dica: construa uma MT M' que, dado w, simula M em w e aceita se M aceita (substituindo um "ciclo infinito" por aceite). Formalize a redução.*

3. **[Rank C]** Mostre que 3-SAT ≤_p CLIQUE: dado uma fórmula φ com k cláusulas na forma normal conjuntiva com 3 literais cada, construa um grafo G e inteiro m tais que φ é satisfazível ↔ G tem k-clique. *Dica: para cada cláusula (l₁ ∨ l₂ ∨ l₃), crie um triplete de vértices (l₁, l₂, l₃); conecte vértices de cláusulas distintas cujos literais não sejam complementares. Um k-clique escolhe um literal satisfeito de cada cláusula.*

4. **[Rank B]** Prove que PRIMES = {n ∈ ℕ : n é primo} ∈ NP demonstrando um certificado polinomial de primalidade. *Dica: use o certificado de Pratt — um número primo p tem um gerador primitivo g e uma decomposição de p-1 = p₁^{a₁}·…·pₖ^{aₖ} com certificados recursivos de primalidade para cada pᵢ. Verifique que o tamanho total do certificado é polinomial em log p.*

5. **[Rank A] [BOSS]** Prove o teorema de Cook: SAT é NP-completo. Especificamente, dado um verificador V para uma linguagem A ∈ NP que roda em tempo p(n), construa explicitamente uma fórmula booleana φ_{V,w} de tamanho polinomial em |w| tal que φ_{V,w} é satisfazível se e somente se w ∈ A. *Dica: a fórmula codifica a "tabela de configuração" de V em ⟨w, c⟩ para algum certificado c. Crie variáveis booleanas x_{i,j,s} indicando que na posição (i, j) da tabela (tempo i, célula j) o símbolo é s. As cláusulas codificam: estado inicial; função de transição válida em cada passo; condição de aceitação. A construção é polinomial em p(n)².*

## Próximos passos

- [logica-matematica](logica-matematica) — cálculo de predicados, decidibilidade e completude
- [fundamentos-godel-zfc](fundamentos-godel-zfc) — incompletude de Gödel como parente da indecidibilidade
- [analise-combinatoria](analise-combinatoria) — contagem e combinatória discreta como base
- [teoria-grafos-mat](teoria-grafos-mat) — grafos como estrutura para NP-completude
- → Pratique no /math-quest na área **Fundamentos/CS** (Rank C+)
