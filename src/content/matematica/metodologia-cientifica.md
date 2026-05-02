---
title: Metodologia Científica (pesquisa em mat)
category: matematica
stack: [Mat]
tags: [meta, fundamentos]
excerpt: Como funciona pesquisa em matemática — estrutura de papers, conjunturas, provas, publicação e comunidade.
related: [tecnicas-demonstracao, latex-mat-papers, logica-matematica, analise-real]
updated: 2026-05
---

## O que é

Metodologia Científica aplicada à matemática é diferente das ciências experimentais: não há experimentos no sentido convencional, não há falseabilidade popperian direta. A matemática opera por definições, conjecturas, demonstrações e teoremas. Mas isso não torna o processo menos metódico — apenas diferente.

O processo típico de pesquisa em matemática: (1) identificar um problema aberto ou formular nova questão; (2) explorar casos pequenos, buscar padrões, computar exemplos; (3) formular conjectura; (4) tentar provar a conjectura ou encontrar contraexemplo; (5) se prova encontrada, escrever o argumento formalmente; (6) submeter para peer review; (7) publicar.

Metodologia Científica como disciplina formal cobre: filosofia da ciência (Popper, Kuhn, Lakatos), lógica de descoberta vs. justificação, estrutura de argumento científico, planejamento de pesquisa, ética acadêmica, e comunicação científica. Para um matemático, o foco é em construção e comunicação de provas rigorosas.

## Por que estuda

A disciplina de Metodologia Científica no currículo existe para que o estudante entenda como o conhecimento matemático é construído e validado — não apenas como consumidor de teoremas, mas como potencial produtor. Mesmo que Igor não vá para academia, entender o processo de pesquisa melhora a leitura crítica de papers de ML e a escrita técnica.

Para dev/ML eng: artigos de ML são papers científicos — mas com diferenças importantes da matemática pura (resultados empíricos, code availability, reproducibility). Saber ler um paper criticamente (o que está provado vs. apenas observado empiricamente, que hipóteses foram feitas, o que o baseline faz) é competência central.

## Conceitos-chave

- **Conjectura vs. teorema**: conjectura é afirmação matemática que se acredita ser verdadeira mas não foi provada. Hipótese de Riemann e hipótese de Goldbach são exemplos de conjecturas abertas há séculos. Teorema é proposição demonstrada rigorosamente a partir de axiomas e resultados anteriores.
- **Estrutura de um artigo matemático**: Abstract (resumo), Introduction (contexto e resultados principais), Preliminaries (definições e notação), Main Results (teoremas e provas), Discussion (conexões e open problems), References. Em ML, adiciona-se Experiments e Related Work.
- **Peer review**: processo de revisão anônima por pares especialistas antes da publicação. Em matemática, revisores verificam correção da prova. Em ML, revisores verificam metodologia, baselines, e reprodutibilidade. Não é infalível — erros passam, bons trabalhos são rejeitados.
- **Preprints e arXiv**: em matemática e ML, é padrão postar preprint no arXiv antes (ou em vez de) de publicar em revista. arXiv.org tem categorias math.*, cs.LG, cs.AI, stat.ML, etc. Preprints aceleraram a disseminação mas não passaram por peer review.
- **Plagiário e integridade**: plágio em matemática inclui usar resultados alheios sem citação adequada, não apenas copiar texto. Replicar uma prova com variação superficial e não atribuir autoria é falta de integridade. A comunidade matemática é pequena e a reputação é capital permanente.
- **Viés de confirmação e contraexemplos**: a tendência humana de buscar evidências que confirmam crenças e ignorar as que contradizem é risco real em matemática. Um único contraexemplo destrói uma conjectura. Ativamente buscar contraexemplos é hábito saudável — se resistir, a conjectura fica mais robusta.
- **Métodos de descoberta**: na prática, a matemática é descoberta por: computação de exemplos (muitas conjecturas vieram de padrões numéricos), analogia com estruturas conhecidas, generalização de resultados especiais, conexão entre áreas distintas. A prova vem depois da descoberta.
- **Open problems e recursos**: Millennium Prize Problems (7 problemas, US$1M cada: P vs NP, hipótese de Riemann, etc.). OEIS (On-Line Encyclopedia of Integer Sequences) para sequências. MathOverflow para perguntas de pesquisa. arXiv.org, zbMATH, MathSciNet para literatura.

## Confusões comuns

**"Um paper publicado está definitivamente correto"**: Não. Papers contêm erros. Erros sérios levam a retratações ou correções (errata). A prova de Wiles do Último Teorema de Fermat teve um erro descoberto após o anúncio e levou 18 meses a mais para consertar. Peer review reduz erros, não os elimina.

**"Matemática é acumulativa — novos resultados nunca derrubam os antigos"**: Os teoremas são permanentes (uma prova válida é válida para sempre), mas a *interpretação* e *importância* muda. Às vezes um resultado que parecia central é reinterpretado como caso especial de algo mais geral; às vezes axiomas mudam (geometrias não-euclidianas "derrubaram" a geometria euclidiana como teoria universal, não como teoria válida dentro de seus axiomas).

**"Programas de computador podem verificar provas"**: Cada vez mais verdade. Coq, Lean 4, Isabelle verificam provas formais. A prova das 4 cores (1976) usou computador para verificar casos. O projeto Lean Mathlib tem milhares de teoremas formalizados. Mas a maioria das provas matemáticas ainda é "humana" e verificada por peer review.

**"Matemática é trabalho solitário"**: A imagem do matemático solitário (Nash, Perelman) é exceção. A maioria da matemática moderna é colaborativa. Projetos como Polymath (Terry Tao) são colaborações massivas online. Co-autoria é a norma em ML. Redes de colaboração e seminários são vitais.

**"Se não consigo provar, a conjectura é provavelmente falsa"**: Não há relação direta. A hipótese de Riemann permanece aberta há 165 anos apesar dos melhores matemáticos do mundo tentarem. A impossibilidade de provar reflete a dificuldade do problema, não falsidade da conjectura.

## Aplicação em CS/Dev/ML

**Leitura crítica de papers de ML**: distinguir resultados teóricos (com prova) de resultados empíricos (com experimentos), identificar as hipóteses dos teoremas, verificar se os baselines são justos, checar reprodutibilidade. Recursos: Papers With Code (paperswithcode.com) rastreia código dos papers.

**Escrita técnica**: relatórios de análise, RFCs (Request For Comments) de engenharia, papers internos de empresa — todos se beneficiam da clareza e estrutura de escrita matemática: definir termos antes de usá-los, separar o que é fato do que é hipótese, citar fontes.

**Reproducibility crisis em ML**: ML tem crise de reprodutibilidade — muitos resultados publicados não se reproduzem. Metodologia científica rigorosa (pré-registro de hipóteses, datasets de teste separados, código disponível) são respostas. MLflow, Weights & Biases para rastreamento de experimentos.

**Open source como peer review**: código open source funciona como peer review distribuído — qualquer pessoa pode ler, criticar, e contribuir. Pull requests com testes são análogos a provas verificáveis. Issues são análogos a conjecturas/perguntas abertas.

## Como praticar

- **Livro base**: Polya — *A Arte de Resolver Problemas* (How to Solve It) — clássico sobre heurísticas de descoberta matemática. Lima — *A Matemática do Ensino Médio* e ensaios sobre formação matemática. Para filosofia da ciência: Kuhn — *A Estrutura das Revoluções Científicas*.
- **Ler papers originais**: para 3-4 resultados que você estudou no curso, leia o paper original (arXiv ou JSTOR). Veja como o argumento foi apresentado, quais simplificações o livro didático fez, o que foi deixado de fora.
- **Escrever provas em LaTeX**: mesmo que não vá publicar, escrever provas em LaTeX força clareza e verifica se o argumento é completo. Gaps que passam despercebidos em rascunho aparecem quando você tenta formalizá-los.
- **Participar de seminários**: seminários de matemática na universidade. Mesmo sem entender tudo, a exposição à forma como matemáticos apresentam e debatem ideias é formativa.
- **Explorar arXiv**: configure alertas para math.NT, math.AG, cs.LG, stat.ML. Leia abstract e introdução de 5 papers por semana. Em 6 meses, a leitura de literatura se torna natural.

## Exercícios práticos

1. **[Rank E]** Escolha um resultado matemático que você estudou recentemente (ex: teorema de Pitágoras, integral de e^{-x²}). Identifique: (a) o enunciado preciso com todas as hipóteses; (b) o que acontece se cada hipótese for removida (contraexemplo); (c) qual é a ideia central da prova. *Dica: muitos estudantes conhecem o enunciado mas não as hipóteses necessárias. Perguntar "o que acontece sem essa hipótese?" é o exercício de delimitação de escopo mais importante da matemática.*

2. **[Rank D]** Leia o abstract e a introdução de um paper no arXiv (busque em arxiv.org por math.NA, cs.LG ou math.ST). Identifique: qual é a questão central, qual o método principal, qual o resultado e como se relaciona com trabalhos anteriores citados. Escreva um parágrafo de síntese. *Dica: o abstract deve revelar tudo isso em miniatura. A introdução expande cada ponto. Um paper bem estruturado responde 'por que é importante', 'o que foi feito', 'como foi feito' no primeiro par de parágrafos.*

3. **[Rank C]** Dado um dataset sintético de 50 pontos (x, y) com y = 2x + 1 + ruído gaussiano, escreva um pipeline de análise: (a) formulação do modelo; (b) estimação por MLE; (c) teste de hipótese H₀: coeficiente = 0; (d) intervalo de confiança de 95%; (e) diagnóstico de resíduos. Documente cada passo e as decisões metodológicas. *Dica: regressão linear simples é o caso mais pedagógico. Cada etapa do pipeline tem justificativa teórica clara: MLE = mínimos quadrados para Normal; teste t para coeficiente; resíduos devem ser homocedasticos e independentes.*

4. **[Rank B]** Projete um experimento para testar a hipótese "o método de otimização Adam converge mais rápido que SGD em redes neurais para o dataset MNIST". Identifique: a variável resposta, as variáveis controladas, as fontes de variabilidade, o tamanho de amostra necessário para detectar uma diferença de 5% na acurácia com poder de teste 80%. *Dica: múltiplas sementes aleatórias são necessárias para estimar a variabilidade. A diferença mínima detectável requer cálculo do tamanho de amostra: n ≈ 2σ²(z_{α/2}+z_{β})²/δ² onde δ é a diferença mínima a detectar.*

5. **[Rank A] [BOSS]** Critique metodologicamente o seguinte cenário: um pesquisador testa 100 hipóteses (features de um dataset) buscando associação com uma variável resposta (p-value < 0.05 para cada teste). Encontra 5 positivos e conclui "5 features são significativas". Identifique o problema (multiple comparisons), calcule o número esperado de falsos positivos, e reformule o estudo corretamente usando (a) correção de Bonferroni, (b) controle de FDR de Benjamini-Hochberg. *Dica: sob H₀ global (nenhuma feature é relevante), o número esperado de falsos positivos é 100·0.05 = 5 — exatamente o número encontrado! Bonferroni: use α/100 = 0.0005 como limiar. FDR de B-H: ordene p-values p₍ᵢ₎ e rejeite H₍ᵢ₎ se p₍ᵢ₎ ≤ (i/100)·α. FDR controla a proporção esperada de falsos positivos entre os positivos.*

## Próximos passos

- [tecnicas-demonstracao](tecnicas-demonstracao) — as ferramentas concretas de construção de provas
- [latex-mat-papers](latex-mat-papers) — como escrever e ler papers matematicamente
- [logica-matematica](logica-matematica) — fundamentos lógicos do raciocínio matemático
- [analise-real](analise-real) — onde a necessidade de rigor é mais sentida concretamente
- → Pratique no /math-quest na área **Fundamentos** (Rank C+)
