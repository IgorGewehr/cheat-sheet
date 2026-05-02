---
title: LaTeX & Como ler/escrever paper matemático
category: matematica
stack: [Mat]
tags: [meta, fundamentos]
excerpt: Dominar LaTeX, estruturar argumentos matemáticos em papel, e ler literatura técnica com eficiência.
related: [metodologia-cientifica, tecnicas-demonstracao, analise-real, logica-matematica]
updated: 2026-05
---

## O que é

LaTeX é o sistema de composição tipográfica padrão para matemática e ciência. Criado por Leslie Lamport sobre o TeX de Donald Knuth (1978), LaTeX permite escrever equações complexas, gerenciar referências, e produzir documentos com qualidade profissional. Todo paper matemático, de física, e a maioria dos papers de ML/CS é escrito em LaTeX.

Saber LaTeX vai além de dominar a ferramenta — é aprender a linguagem formal de comunicação matemática. A qualidade de apresentação importa: uma prova bem-escrita em LaTeX é mais fácil de verificar, revisar e citar. Papers mal-formatados ou com notação inconsistente enfrentam mais resistência em revisão.

Ler papers matemáticos é habilidade que se aprende separadamente de aprender matemática. Um paper bem-escrito tem estrutura previsível; saber navegar essa estrutura (sem ler do início ao fim linearmente) é o que torna a leitura de literatura técnica gerenciável.

## Por que estuda

Para o matemático: todas as provas sérias serão escritas em LaTeX. Qualquer trabalho de conclusão, artigo ou relatório técnico usará LaTeX. A fluência reduz atrito entre ter a ideia e comunicá-la claramente.

Para dev/ML: papers de ML são escritos em LaTeX (via arXiv). Saber que "(\ref{eq:loss})" é uma referência a uma equação numerada, que "Theorem 3.1" provavelmente está na Seção 3, que "Appendix A" contém provas de Lemmas auxiliares — isso acelera a leitura. Para pesquisa, escrever technical reports e documentação de fórmulas em LaTeX é prática crescente (Notion, Obsidian, Jupyter todos suportam LaTeX inline).

## Conceitos-chave

- **Estrutura básica de documento LaTeX**: `\documentclass{article}`, `\usepackage{}`, `\begin{document}`, `\end{document}`. Ambientes: `equation`, `align`, `theorem`, `proof`, `lemma`, `corollary`. Pacotes essenciais: `amsmath`, `amsthm`, `amssymb` (símbolos), `mathtools`, `hyperref` (links), `biblatex` ou `natbib` (referências).
- **Ambientes matemáticos**: inline com `$...$`, display com `$$...$$` ou `\[...\]`, numerado com `\begin{equation}...\end{equation}`, multi-linha alinhado com `\begin{align}...\end{align}` (usando `&` para alinhamento e `\\` para quebra de linha). `\notag` ou `\nonumber` para suprimir numeração numa linha.
- **Símbolos essenciais em LaTeX**: `\in` (∈), `\subset` (⊂), `\cup` (∪), `\cap` (∩), `\forall` (∀), `\exists` (∃), `\mathbb{R}` (ℝ), `\mathbb{N}` (ℕ), `\mathbb{Z}` (ℤ), `\mathbb{C}` (ℂ), `\partial` (∂), `\nabla` (∇), `\int`, `\sum`, `\prod`, `\lim`, `\frac{num}{den}`, `\sqrt{}`, `\vec{v}` ou `\mathbf{v}`, `\hat{e}`, `\bar{x}`, `\tilde{f}`, `\infty` (∞).
- **Teoremas e provas**: definir ambientes com `\newtheorem{theorem}{Theorem}[section]` (numerado por seção). Escrever `\begin{theorem}\label{thm:main}...\end{theorem}` e `\begin{proof}...\end{proof}`. O símbolo `\qed` (□) marca fim de prova — `amsthm` insere automaticamente.
- **Referências cruzadas**: `\label{sec:intro}`, `\ref{sec:intro}`, `\eqref{eq:schrodinger}`. Fundamental para navegabilidade. Usar prefixos consistentes: `fig:`, `tab:`, `thm:`, `eq:`, `sec:`, `def:`, `lem:`.
- **BibTeX e gerenciamento de referências**: arquivo `.bib` com entradas `@article`, `@book`, `@inproceedings`. `\cite{key}` insere citação. Zotero (gratuito) e Mendeley sincronizam com BibTeX. Google Scholar exporta BibTeX. Overleaf integra com Zotero.
- **Overleaf e fluxo colaborativo**: Overleaf.com é o editor LaTeX colaborativo online mais usado. Permite co-edição em tempo real, sem instalar LaTeX localmente. Tem templates para IEEE, ACM, NeurIPS, ICML, arXiv. Git integration para versionamento.
- **Como ler um paper matemático**: não ler linearmente. Sequência recomendada: (1) abstract + conclusão — entender o claim central; (2) introdução — contexto e visão geral do argumento; (3) enunciados dos teoremas principais — sem provas; (4) exemplos e figuras; (5) provas principais. Ler provas inteiras antes de entender o que estão provando é ineficiente.

## Confusões comuns

**"LaTeX e Word são equivalentes para matemática"**: Para texto puro, Word é adequado. Para matemática com equações complexas, notação consistente, referências cruzadas e formatação científica, LaTeX é incomparavelmente superior. A diferença aparece em: qualidade das equações (tipografia de TeX vs. MathType), gerenciamento de numeração e referências, compatibilidade com arXiv e editoras científicas.

**"Aprender LaTeX leva muito tempo"**: A curva de aprendizado inicial é íngreme por uma semana. Depois disso, para tarefas padrão (artigo, conjunto de exercícios, relatório), LaTeX é rápido. O investimento vale para qualquer um que vai escrever mais do que 3-4 documentos técnicos.

**"O paper diz isso — portanto isso é verdade"**: Papers têm erros. Afirmações que não são o teorema principal merecem escrutínio. Verificar premissas: quais hipóteses o teorema usa? O resultado que eu quero usar aplica ao meu contexto? "Intuitivo" e "claro" no paper pode esconder passos não-triviais.

**"Preciso entender todo o paper para usar o resultado"**: Não. Você pode usar um teorema sem entender sua prova — mas deve entender seu enunciado completo (incluindo hipóteses). O erro é usar um resultado sem verificar que suas hipóteses se aplicam ao seu caso.

**"arXiv significa que foi revisado por pares"**: arXiv não tem peer review. É repositório de preprints. A qualidade varia enormemente — desde trabalhos de pesquisadores seniores até conteúdo de qualidade questionável. Publicação em venues com revisão (NeurIPS, ICML, ICLR, Annals of Math, etc.) é o indicador de qualidade.

## Aplicação em CS/Dev/ML

**Jupyter com LaTeX**: Jupyter suporta LaTeX em células Markdown: `$\sum_{k=1}^n k = \frac{n(n+1)}{2}$`. Ideal para documentar análises com equações. Também em Obsidian, Notion (com MathJax), e sites com KaTeX ou MathJax.

**Escrever RFC e documentação técnica**: equipes de engenharia que trabalham com ML e sistemas quantitativos usam LaTeX-like notation em Google Docs (com addon), Notion, ou documentos Python/Jupyter para documentar algoritmos e análises.

**Leitura de papers de ML**: um paper típico de NeurIPS/ICML tem: Abstract (1 parágrafo), Introduction (1-2 páginas, inclui contribuições), Related Work (1 página), Método/Theory (2-4 páginas), Experiments (2-3 páginas), Conclusion (0.5 página), References, Appendix. Saber a estrutura permite navegar eficientemente.

**arXiv como fonte primária**: `arxiv.org/abs/2301.xxxxx` — todo paper tem abstract na página. Clicar em PDF para ler. Busca por campo: `arxiv.org/list/cs.LG/recent` para ML recente, `arxiv.org/list/math.NT/recent` para teoria dos números, etc. Semantic Scholar e Connected Papers para explorar rede de citações.

**Ferramentas de LaTeX**: TeXstudio (desktop, com preview), Overleaf (web, colaborativo), latexindent (formatação automática), latexmk (compilação automática), detexify.kirelabs.org (desenhar símbolo e descobrir o comando LaTeX).

## Como praticar

- **Instalar ou usar Overleaf**: em 1 hora, reproduza em LaTeX uma página de matemática do seu livro de análise (com definições, teorema, e prova). Esse exercício forçará aprender os 80% mais usados do LaTeX.
- **Escrever suas provas em LaTeX**: de agora em diante, toda prova de exercício que merecer registro, escreva em LaTeX. Um template simples (article, amsmath, amsthm) serve para tudo.
- **Ler 1 paper inteiro**: escolha um paper clássico curto (~10 páginas) na sua área preferida (teoria dos números, análise, ML). Leia na sequência recomendada: abstract → conclusão → introdução → teoremas → provas. Documente o que você entendeu e o que não entendeu.
- **Escrever summary de paper lido**: em LaTeX, escreva 1 página resumindo um paper: qual é o resultado, quais são as hipóteses, qual é a ideia principal da prova. Isso consolida a leitura e produz material de referência para o futuro.
- **Símbolos por flashcard**: use Anki com 50 cartões de símbolos LaTeX mais comuns (10 minutos para criar, 5 minutos por dia para revisar). Em 2 semanas, a digitação de LaTeX fica fluente.

## Exercícios práticos

1. **[Rank E]** Abra o Overleaf (ou instale uma distribuição LaTeX local) e reproduza exatamente a seguinte equação: a fórmula de Euler e^{iπ} + 1 = 0, a série de Taylor e^x = Σ_{n=0}^{∞} x^n/n!, e a definição ε-δ de limite. Use os ambientes `equation` e `align*`. *Dica: \sum_{n=0}^{\infty} \frac{x^n}{n!}; para o limite: \forall \varepsilon > 0, \exists \delta > 0: 0 < |x-a| < \delta \Rightarrow |f(x)-L| < \varepsilon.*

2. **[Rank D]** Escreva em LaTeX um ambiente de teorema/prova usando `amsthm` para o teorema de Pitágoras: enuncie formalmente, dê a prova usando o ambiente `proof`. Inclua um ambiente `definition` para triângulo retângulo. *Dica: no preâmbulo: \newtheorem{theorem}{Teorema} e \newtheorem{definition}[theorem]{Definição}. O ambiente proof termina com \qed automático em amsthm.*

3. **[Rank C]** Crie um documento LaTeX de 2 páginas com: capa (título, autor, data com \maketitle), seções, uma matriz 3×3, um diagrama comutativo simples usando o pacote `tikz-cd`, e uma tabela de valores de funções trigonométricas. *Dica: para diagrama comutativo com tikz-cd: \begin{tikzcd} A \arrow{r}{f} & B \\ C \arrow{u}{g} \arrow{ur}{h} \end{tikzcd}. O pacote `array` melhora formatação de matrizes.*

4. **[Rank B]** Leia o abstract e introdução de um paper clássico curto de sua escolha (sugestão: Turing — *Computing Machinery and Intelligence*, 1950, ou um artigo recente do arXiv sobre ML theory). Escreva em LaTeX um summary de 1 página: contexto, resultado principal, hipóteses necessárias, conexão com outros resultados que você conhece. *Dica: estruture como: Contexto e Motivação → Resultado Principal (enunciado precisamente) → Hipóteses → Técnica da Prova (sem deta­lhe, só ideia) → Conexões. Use \cite{} e um ambiente `thebibliography` simples.*

5. **[Rank A] [BOSS]** Escreva um documento LaTeX completo no estilo de paper matemático (classe `amsart`) com: título, resumo, introdução, seção de resultados, e uma prova completa de um teorema não-trivial (sugestão: o teorema de que ℚ é denso em ℝ, ou o teorema de Bolzano-Weierstrass). O documento deve usar: ambientes theorem/proof, referências cruzadas (\label/\ref), pelo menos uma figura com tikz, e bibliografia. Verifique que compila sem erros e que a prova está matematicamente completa e formalmente apresentada. *Dica: o template de amsart tem macros como \begin{abstract}, \maketitle, \section. Para tikz: \begin{tikzpicture} com \draw, \node, \fill. A qualidade de um paper matemático é avaliada por: precisão dos enunciados, completude das provas, clareza da narrativa, e formatação correta.*

## Próximos passos

- [metodologia-cientifica](metodologia-cientifica) — o processo de pesquisa no qual LaTeX e leitura de papers se encaixam
- [tecnicas-demonstracao](tecnicas-demonstracao) — o conteúdo que LaTeX vai formatar
- [analise-real](analise-real) — primeiro campo onde você vai querer escrever provas formais
- [logica-matematica](logica-matematica) — fundamentos para interpretar afirmações matemáticas precisamente
- → Pratique no /math-quest na área **Fundamentos** (Rank C+)
