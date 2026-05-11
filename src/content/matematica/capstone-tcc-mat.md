---
title: "Capstone — TCC & Preparação para Mestrado"
category: matematica
stack: [Mat]
tags: [capstone, tcc, paper, mestrado, latex]
excerpt: "Projeto final: TCC formato paper em LaTeX, banca simulada, formulário de doutorado/mestrado, candidatura internacional."
related: [latex-mat-papers, metodologia-cientifica, modelagem-matematica, tecnicas-demonstracao, fundamentos-godel-zfc, geometria-algebrica-intro, computabilidade-complexidade, teoria-da-informacao, teoria-dos-jogos]
updated: 2026-05
---

## O que é

Capstone é o projeto final da trilha — equivalente a Trabalho de Conclusão de Curso + portfólio de candidatura a mestrado internacional. Você escolhe um tópico de pesquisa, conduz estudo independente sob orientação (real ou auto-supervisionada), produz monografia em LaTeX no padrão de paper, e simula apresentação de banca.

Diferente dos checkpoints anteriores (validação de domínio), o capstone é **produção de conhecimento** — não apenas resolver problema dado, mas formular questão, contextualizar literatura, conduzir investigação, escrever expor matematicamente.

## Por que estuda

Sem produzir um trabalho longo e original, você não verifica se realmente internalizou a maturidade matemática necessária para mestrado/doutorado. Resolver exercícios é diferente de sustentar um projeto de 30-80 páginas com coerência argumentativa por meses. Bancas de admissão a mestrado (MS Princeton, MIT, ETH, IMPA, USP) avaliam capacidade de pesquisa em forma de TCC ou writing sample.

Adicionalmente: aprender LaTeX no padrão de paper (não só notas), escrever resumo em inglês, organizar bibliografia em BibTeX, defender oralmente — competências que faltam em quem só fez problemset.

## Estrutura do Capstone

### Fase 1 — Seleção de tópico (2-4 semanas)

Escolha um tópico que:
1. Você domine os pré-requisitos (Tiers 0-5 cobrem o terreno)
2. Tenha literatura primária acessível (livros, surveys, papers recentes)
3. Seja focado o suficiente para 30-80 páginas de monografia

Sugestões organizadas por área:

**Análise & EDPs**
- Existência fraca de soluções da equação de Navier-Stokes 2D
- Estimativas dispersivas para Schrödinger não-linear (Tao, Bourgain)
- Princípio do máximo para operadores elípticos via Moser
- Teoria de regularidade de De Giorgi-Nash-Moser

**Álgebra & TAN**
- Demonstração do teorema da aritmética de Hasse-Minkowski (formas quadráticas)
- Curvas elípticas sobre ℚ: Mordell-Weil e rank
- Reciprocidade quadrática via teoria de Galois
- Teorema de Kronecker-Weber

**Topologia & Geometria**
- Fluxo de Ricci em superfícies (Hamilton, anterior a Perelman)
- Teorema de Gauss-Bonnet generalizado
- Cohomologia de De Rham e teorema de Hodge para Riemann
- Classes características via teoria de Chern-Weil

**Probabilidade & Estocástico**
- Convergência fraca via tightness (Prokhorov)
- Cadeias de Markov, ergodicidade, e Mixing time
- Movimento Browniano e EDEs como limite de passeios aleatórios
- Concentração de medida (Talagrand, Ledoux)

**Aplicada**
- Teorema da aproximação universal de redes neurais (Hornik)
- Análise espectral de grafos e detecção de comunidades (Lovász, Spielman)
- Otimização convexa via método do ponto interior (Nesterov)
- Princípio variacional para difusão (Jordan-Kinderlehrer-Otto)

**Matemática Discreta & CS Teórica**
- Teorema de Cook-Levin completo (SAT é NP-completo)
- Erdős-Ko-Rado e variantes via método polynomial
- PCP theorem (esboço de Dinur 2007)
- Aprendizado PAC e dimensão VC (Vapnik-Chervonenkis)

**Lógica & Fundamentos**
- Demonstração detalhada do 1º teorema da incompletude de Gödel
- Forçamento de Cohen e independência da hipótese do contínuo
- Aritmética de Heyting vs Peano: intuicionismo
- Bissimulação e equivalência elementar

### Fase 2 — Estudo & escrita (8-16 semanas)

- **Leia primária**: 1-2 livros base + 3-5 papers. Reconstrua todas as demonstrações com lápis.
- **Esboce estrutura** (template em [latex-mat-papers](latex-mat-papers)):
  - Resumo (1 parágrafo, 150 palavras, em PT e EN)
  - Introdução: contexto histórico + motivação + statement do resultado principal + visão geral
  - Pré-requisitos: notação, definições, resultados básicos com referências
  - Conteúdo principal: 2-4 capítulos com seções
  - Aplicações ou refinamentos (opcional)
  - Conclusão e direções futuras
  - Bibliografia (15-40 referências)
- **Escreva incrementalmente**: 1-2 páginas/dia, revisando o que escreveu antes.
- **Use LaTeX desde o dia 1**: amsmath, amsthm, amssymb. Template TCC USP/IMPA disponível.
- **Referencie correctamente**: BibTeX, MathSciNet, zbMATH para entradas precisas. Padrão Springer/AMS.

### Fase 3 — Revisão e defesa (2-4 semanas)

- **Banca simulada**: apresente em 30-40 min para colegas, professor, ou auto-simule gravando vídeo. Defenda perguntas dirigidas a buracos do texto.
- **Lista de melhorias** após cada leitura:
  - Argumentos lacunosos (notas TODO)
  - Notação inconsistente
  - Demonstrações que pulam passos
  - Falta de exemplos
  - Bibliografia incompleta
- **Versão final** em PDF, ~30-80 páginas, paginação ABNT ou AMS-LaTeX, ImageMagick para figuras.

### Fase 4 — Candidatura (opcional, paralelo)

Se objetivo é mestrado:
- **CV acadêmico** em LaTeX (2 páginas, padrão internacional)
- **Statement of purpose** (2-3 páginas explicando o motivador científico + por que essa instituição)
- **3 cartas de recomendação** (peça ≥ 2 meses antes; forneça CV, TCC, e contexto)
- **Writing sample** = capítulo principal do TCC + 1-2 demonstrações representativas
- **Programas alvo**:
  - Brasil: IMPA (verão / mestrado), USP-IME, UFRJ, UNICAMP, UFMG
  - Europa: ETH Zurich, EPFL, Bonn, Paris-Saclay, ENS, Cambridge Part III, Oxford
  - EUA: Princeton, MIT, Harvard, Berkeley, Stanford, Chicago, Columbia
  - Outras: Toronto, McGill, ANU (Austrália), Kyoto (Japão), Pisa
- **GRE/TOEFL** se aplicável (PhD nos EUA geralmente exige; Europa varia)

## Critério de "aprovação"

- TCC de 30-80 páginas em LaTeX, com pelo menos 1 demonstração original (mesmo que reformulação criativa de algo existente)
- Apresentação oral simulada, 30-40 min, com slides ou quadro virtual
- Bibliografia 15+ referências, mistura de livros canônicos + papers recentes (últimos 5 anos)
- Capacidade de defender qualquer afirmação no texto: "onde isso vem?", "por que isso vale?", "exemplo concreto?"

Aprovado: você está pronto para mestrado em matemática em instituição internacional de elite.

## Recursos

- **Templates LaTeX**: USP-IME, IMPA, AMS article, Springer thesis class
- **Bancos de problemas**: Putnam (graduação), Tripos (Cambridge Part II/III), exames de qualificação de programas de doutorado (NYU/Princeton qualifying exam papers são públicos)
- **Surveys de mathoverflow / arXiv (math.HO)**: para tópicos modernos com referências curadas
- **Plataformas para mentor**: Math.StackExchange (perguntas pontuais), AoPS, ProofMarketplace, talvez orientador real via email a especialistas em livros que admira

## Próximos passos

- Iniciar TCC → escolher tópico (Fase 1)
- Revisão final → [latex-mat-papers](latex-mat-papers), [metodologia-cientifica](metodologia-cientifica)
- Mestrado → candidatar-se a programas (paralelo com TCC)
- → Pratique no /math-quest em todas as áreas para revisar antes de defesa
