import type { MathArea, MathQuestProblem, QuestRank } from "./math-quest-types";

const BANK: MathQuestProblem[] = [
  // ───── CÁLCULO ─────
  {
    id: "calculo-E-1",
    area: "calculo",
    rank: "E",
    enunciado: "Calcule o limite:\n\nlim(x→0) (sen x) / x\n\nJustifique sua resposta usando a definição de limite ou o teorema do confronto.",
    expectedConcepts: ["limite-trigonometrico", "teorema-confronto", "continuidade"],
  },
  {
    id: "calculo-D-1",
    area: "calculo",
    rank: "D",
    enunciado: "Derive f(x) = x³·eˣ usando a regra do produto.\n\nEm seguida, encontre os pontos críticos de f em ℝ e classifique-os como máximo, mínimo ou ponto de sela.",
    expectedConcepts: ["regra-produto", "derivada-exponencial", "pontos-criticos"],
  },
  {
    id: "calculo-C-1",
    area: "calculo",
    rank: "C",
    enunciado: "Calcule a integral definida:\n\n∫₀¹ x·√(1 − x²) dx\n\nUse substituição trigonométrica ou a substituição u = 1 − x². Mostre todos os passos.",
    expectedConcepts: ["integral-definida", "substituicao-u", "teorema-fundamental"],
  },
  {
    id: "calculo-B-1",
    area: "calculo",
    rank: "B",
    enunciado: "Seja f: ℝ² → ℝ definida por f(x, y) = x²y − y³.\n\n(a) Calcule as derivadas parciais ∂f/∂x e ∂f/∂y.\n(b) Encontre todos os pontos críticos de f.\n(c) Classifique cada ponto crítico usando a matriz Hessiana.",
    expectedConcepts: ["derivada-parcial", "gradiente", "hessiana", "ponto-critico-multivariavel"],
  },
  {
    id: "calculo-A-1",
    area: "calculo",
    rank: "A",
    isBoss: true,
    enunciado: "Enuncie e demonstre o Teorema de Stokes:\n\n∬_S (∇ × F) · dS = ∮_C F · dr\n\nonde S é uma superfície orientável com bordo C.\n\nAplique o teorema para calcular ∮_C F · dr onde F(x,y,z) = (−y, x, z) e C é o círculo x² + y² = 1 no plano z = 0, orientado anti-horário visto de cima.",
    expectedConcepts: ["rotacional", "integral-superficie", "teorema-stokes", "orientacao-superficie", "diferencial-forma"],
  },

  // ───── ÁLGEBRA ─────
  {
    id: "algebra-E-1",
    area: "algebra",
    rank: "E",
    enunciado: "Dado o sistema linear:\n\n2x + y = 5\nx − y = 1\n\nResolva pelo método de eliminação de Gauss e verifique a solução.",
    expectedConcepts: ["eliminacao-gaussiana", "sistema-linear", "verificacao-solucao"],
  },
  {
    id: "algebra-D-1",
    area: "algebra",
    rank: "D",
    enunciado: "Seja A = [[1, 2], [3, 4]]. Calcule:\n\n(a) det(A)\n(b) A⁻¹ (se existir)\n(c) Verifique que A · A⁻¹ = I₂",
    expectedConcepts: ["determinante", "matriz-inversa", "identidade"],
  },
  {
    id: "algebra-C-1",
    area: "algebra",
    rank: "C",
    enunciado: "Seja T: ℝ³ → ℝ² a transformação linear definida por T(x, y, z) = (x + y, y − z).\n\n(a) Encontre a matriz de T na base canônica.\n(b) Determine o núcleo (ker T) e a imagem (Im T).\n(c) Verifique o Teorema do Núcleo-Imagem: dim(ker T) + dim(Im T) = dim(ℝ³).",
    expectedConcepts: ["transformacao-linear", "nucleo", "imagem", "teorema-nucleo-imagem", "espaco-vetorial"],
  },
  {
    id: "algebra-B-1",
    area: "algebra",
    rank: "B",
    enunciado: "Encontre os autovalores e autovetores da matriz:\n\nA = [[4, 1], [2, 3]]\n\nEm seguida, decomponha A = PDP⁻¹ onde D é diagonal. Use essa decomposição para calcular A⁵ eficientemente.",
    expectedConcepts: ["autovalores", "autovetores", "diagonalizacao", "polinomio-caracteristico"],
  },
  {
    id: "algebra-A-1",
    area: "algebra",
    rank: "A",
    isBoss: true,
    enunciado: "Seja V um espaço vetorial de dimensão finita sobre ℝ e T: V → V um operador linear.\n\nDemonstre o Teorema de Cayley-Hamilton: todo operador linear satisfaz seu próprio polinômio característico, isto é, p_T(T) = 0.\n\nAplique o teorema para calcular A⁻¹ a partir do polinômio característico de A = [[2, 1], [1, 3]].",
    expectedConcepts: ["cayley-hamilton", "polinomio-caracteristico", "operador-linear", "anulador", "algebra-linear-abstrata"],
  },

  // ───── ANÁLISE ─────
  {
    id: "analise-E-1",
    area: "analise",
    rank: "E",
    enunciado: "Prove que a sequência aₙ = 1/n converge para 0 usando a definição ε-N de limite de sequências:\n\n∀ε > 0 ∃N ∈ ℕ : n > N ⟹ |aₙ − 0| < ε",
    expectedConcepts: ["limite-sequencia", "definicao-epsilon-N", "convergencia"],
  },
  {
    id: "analise-D-1",
    area: "analise",
    rank: "D",
    enunciado: "Prove que f(x) = x² é contínua em x₀ = 2 usando a definição ε-δ:\n\n∀ε > 0 ∃δ > 0 : |x − 2| < δ ⟹ |f(x) − f(2)| < ε\n\nEncontre explicitamente δ em função de ε.",
    expectedConcepts: ["continuidade", "definicao-epsilon-delta", "limite-epsilon-delta"],
  },
  {
    id: "analise-C-1",
    area: "analise",
    rank: "C",
    enunciado: "Determine se a série Σₙ₌₁^∞ 1/n² converge ou diverge.\n\nUse o critério de comparação com a integral ∫₁^∞ 1/x² dx. Calcule a integral e conclua sobre a convergência.",
    expectedConcepts: ["series-numericas", "criterio-integral", "convergencia-series", "p-series"],
  },
  {
    id: "analise-B-1",
    area: "analise",
    rank: "B",
    enunciado: "Seja f: [a, b] → ℝ contínua. Prove o Teorema de Weierstrass:\n\nf atinge seu máximo e mínimo em [a, b], i.e., ∃x_M, x_m ∈ [a,b] : f(x_m) ≤ f(x) ≤ f(x_M) ∀x ∈ [a,b].\n\nIndique quais propriedades de compacidade e continuidade são essenciais.",
    expectedConcepts: ["teorema-weierstrass", "compacidade", "continuidade-uniforme", "extremo-global"],
  },
  {
    id: "analise-A-1",
    area: "analise",
    rank: "A",
    isBoss: true,
    enunciado: "Enuncie e demonstre o Teorema do Valor Médio de Lagrange:\n\nSe f: [a,b] → ℝ é contínua em [a,b] e diferenciável em (a,b), então ∃c ∈ (a,b) : f'(c) = [f(b) − f(a)] / (b − a).\n\nUse o resultado para provar que se f'(x) = 0 ∀x ∈ (a,b), então f é constante em [a,b].",
    expectedConcepts: ["TVM-Lagrange", "Rolle", "diferenciabilidade", "continuidade", "consequencias-TVM"],
  },

  // ───── PROBABILIDADE ─────
  {
    id: "probabilidade-E-1",
    area: "probabilidade",
    rank: "E",
    enunciado: "Uma moeda honesta é lançada 3 vezes. Calcule:\n\n(a) P(exatamente 2 caras)\n(b) P(pelo menos 1 cara)\n\nDescreva o espaço amostral Ω explicitamente.",
    expectedConcepts: ["espaco-amostral", "combinatoria-basica", "probabilidade-classica"],
  },
  {
    id: "probabilidade-D-1",
    area: "probabilidade",
    rank: "D",
    enunciado: "Em uma urna há 5 bolas vermelhas e 3 azuis. Retiramos 2 sem reposição.\n\n(a) Calcule P(ambas vermelhas).\n(b) Calcule P(uma de cada cor).\n(c) Verifique que todas as probabilidades somam 1.",
    expectedConcepts: ["probabilidade-condicional", "sem-reposicao", "combinacoes"],
  },
  {
    id: "probabilidade-C-1",
    area: "probabilidade",
    rank: "C",
    enunciado: "X é uma variável aleatória com distribuição Binomial B(n=10, p=0.3).\n\n(a) Calcule E[X] e Var(X).\n(b) Calcule P(X = 3) explicitamente.\n(c) Descreva quando usar a aproximação de Poisson à Binomial e calcule essa aproximação para P(X=3).",
    expectedConcepts: ["distribuicao-binomial", "esperanca", "variancia", "aproximacao-poisson"],
  },
  {
    id: "probabilidade-B-1",
    area: "probabilidade",
    rank: "B",
    enunciado: "Seja X ~ Normal(μ, σ²). Derive a função geradora de momentos M_X(t) = E[eᵗˣ].\n\nUse M_X(t) para calcular E[X] e E[X²], confirmando que Var(X) = σ².",
    expectedConcepts: ["distribuicao-normal", "funcao-geradora-momentos", "calculo-momentos", "variancia"],
  },
  {
    id: "probabilidade-A-1",
    area: "probabilidade",
    rank: "A",
    isBoss: true,
    enunciado: "Enuncie e demonstre a Lei dos Grandes Números (versão fraca):\n\nSe X₁, X₂, ..., Xₙ são i.i.d. com E[Xᵢ] = μ e Var(Xᵢ) = σ² < ∞, então X̄ₙ →_P μ.\n\nUse a desigualdade de Chebyshev na demonstração. Explique a diferença entre convergência em probabilidade e convergência quase certa.",
    expectedConcepts: ["lei-grandes-numeros", "chebyshev", "convergencia-probabilidade", "iid", "media-amostral"],
  },

  // ───── DISCRETA ─────
  {
    id: "discreta-E-1",
    area: "discreta",
    rank: "E",
    enunciado: "Prove por indução matemática que, para todo n ∈ ℕ:\n\n1 + 2 + 3 + ... + n = n(n+1)/2\n\nApresente claramente o caso base e o passo indutivo.",
    expectedConcepts: ["inducao-matematica", "soma-aritmetica", "base-indutiva", "hipotese-indutiva"],
  },
  {
    id: "discreta-D-1",
    area: "discreta",
    rank: "D",
    enunciado: "Determine o número de subconjuntos de um conjunto com n elementos.\n\nProve combinatoriamente que Σₖ₌₀ⁿ C(n,k) = 2ⁿ usando o Teorema Binomial com x = y = 1.",
    expectedConcepts: ["combinatoria", "binomio-newton", "subconjuntos", "principio-contagem"],
  },
  {
    id: "discreta-C-1",
    area: "discreta",
    rank: "C",
    enunciado: "Seja G um grafo simples com n vértices. Prove o Lema dos Apertos de Mão:\n\nΣᵥ deg(v) = 2|E|\n\nonde |E| é o número de arestas. Conclua que o número de vértices de grau ímpar é sempre par.",
    expectedConcepts: ["teoria-grafos", "lema-apertos-mao", "grau-vertice", "arestas"],
  },
  {
    id: "discreta-B-1",
    area: "discreta",
    rank: "B",
    enunciado: "Defina a função de Euler φ(n).\n\nProve que se p é primo, então φ(p) = p − 1.\n\nUse o Teorema de Euler (aᵠ⁽ⁿ⁾ ≡ 1 (mod n) quando mdc(a,n) = 1) para calcular 7¹⁰⁰ mod 13.",
    expectedConcepts: ["funcao-euler", "aritmetica-modular", "teorema-euler", "numero-primo"],
  },
  {
    id: "discreta-A-1",
    area: "discreta",
    rank: "A",
    isBoss: true,
    enunciado: "Enuncie e demonstre o Princípio da Inclusão-Exclusão para n conjuntos:\n\n|A₁ ∪ A₂ ∪ ... ∪ Aₙ| = Σ|Aᵢ| − Σ|Aᵢ ∩ Aⱼ| + ... + (−1)ⁿ⁺¹|A₁ ∩ ... ∩ Aₙ|\n\nAplique para contar o número de inteiros de 1 a 100 que são divisíveis por 2, 3 ou 5.",
    expectedConcepts: ["inclusao-exclusao", "conjuntos", "contagem", "divisibilidade", "inducao"],
  },

  // ───── GEOMETRIA ─────
  {
    id: "geometria-E-1",
    area: "geometria",
    rank: "E",
    enunciado: "Dados os vetores u = (1, 2, 3) e v = (4, −1, 2) em ℝ³:\n\n(a) Calcule u · v (produto interno).\n(b) Calcule |u| e |v|.\n(c) Encontre o ângulo θ entre u e v usando cos θ = (u · v)/(|u||v|).",
    expectedConcepts: ["produto-interno", "norma-vetor", "angulo-entre-vetores"],
  },
  {
    id: "geometria-D-1",
    area: "geometria",
    rank: "D",
    enunciado: "Calcule o produto vetorial u × v onde u = (1, 0, 2) e v = (3, 1, −1).\n\nVerifique que u × v é perpendicular a u e a v. Interprete geometricamente |u × v|.",
    expectedConcepts: ["produto-vetorial", "perpendicularidade", "area-paralelogramo"],
  },
  {
    id: "geometria-C-1",
    area: "geometria",
    rank: "C",
    enunciado: "Prove que a soma dos ângulos internos de qualquer triângulo no plano euclidiano é 180°.\n\nUse o fato de que retas paralelas cortadas por uma transversal formam ângulos alternos internos iguais.",
    expectedConcepts: ["triangulo", "angulos-internos", "retas-paralelas", "geometria-euclidiana"],
  },
  {
    id: "geometria-B-1",
    area: "geometria",
    rank: "B",
    enunciado: "Seja C a curva parametrizada por r(t) = (cos t, sen t, t) para t ∈ [0, 2π].\n\n(a) Calcule o vetor tangente r'(t).\n(b) Calcule o comprimento de arco de C.\n(c) Determine a curvatura κ(t) = |r'(t) × r''(t)| / |r'(t)|³.",
    expectedConcepts: ["curva-parametrizada", "vetor-tangente", "comprimento-arco", "curvatura"],
  },
  {
    id: "geometria-A-1",
    area: "geometria",
    rank: "A",
    isBoss: true,
    enunciado: "Descreva o modelo de disco de Poincaré para a geometria hiperbólica.\n\nDemonstre que a soma dos ângulos internos de um triângulo hiperbólico é estritamente menor que π.\n\nComente como isso viola o postulado das paralelas de Euclides e qual é a consequência para a unicidade de paralelas.",
    expectedConcepts: ["geometria-hiperbolica", "modelo-poincare", "postulado-paralelas", "triangulo-hiperbolico", "geometria-nao-euclidiana"],
  },

  // ───── LÓGICA ─────
  {
    id: "logica-E-1",
    area: "logica",
    rank: "E",
    enunciado: "Construa a tabela verdade das fórmulas:\n\n(a) p → q\n(b) ¬q → ¬p (contrapositiva)\n\nMostre que (a) e (b) são logicamente equivalentes.",
    expectedConcepts: ["tabela-verdade", "implicacao", "contrapositiva", "equivalencia-logica"],
  },
  {
    id: "logica-D-1",
    area: "logica",
    rank: "D",
    enunciado: "Prove por contradição que √2 ∉ ℚ.\n\nAssuma √2 = p/q com mdc(p,q) = 1 e derive uma contradição mostrando que p e q são ambos pares.",
    expectedConcepts: ["prova-por-contradicao", "irracionalidade", "mdc", "paridade"],
  },
  {
    id: "logica-C-1",
    area: "logica",
    rank: "C",
    enunciado: "Considere os predicados P(x): 'x é par' e Q(x): 'x é divisível por 4', ambos sobre ℤ.\n\nAnalise a validade de:\n(a) ∀x (Q(x) → P(x))\n(b) ∀x (P(x) → Q(x))\n(c) ∃x (P(x) ∧ ¬Q(x))\n\nJustifique cada resposta com prova ou contraexemplo.",
    expectedConcepts: ["logica-predicados", "quantificadores", "contraexemplo", "implicacao-predicativa"],
  },
  {
    id: "logica-B-1",
    area: "logica",
    rank: "B",
    enunciado: "Enuncie os axiomas de Peano para os números naturais ℕ.\n\nUse os axiomas para provar que a adição é comutativa: ∀m, n ∈ ℕ, m + n = n + m.\n\n(Dica: use indução em n, com definição recursiva de adição: m + 0 = m e m + S(n) = S(m + n).)",
    expectedConcepts: ["axiomas-peano", "inducao-estrutural", "aritmetica-peano", "recursao-primitiva"],
  },
  {
    id: "logica-A-1",
    area: "logica",
    rank: "A",
    isBoss: true,
    enunciado: "Enuncie o Teorema da Incompletude de Gödel (primeiro teorema).\n\nExplique a ideia central da demonstração via numeração de Gödel e a sentença auto-referente G = 'Esta sentença não é demonstrável'.\n\nDiscuta as implicações para o programa de Hilbert e os limites do método axiomático-formal.",
    expectedConcepts: ["incompletude-godel", "numeracao-godel", "auto-referencia", "consistencia", "completude", "hilbert"],
  },

  // ───── NÚMEROS ─────
  {
    id: "numeros-E-1",
    area: "numeros",
    rank: "E",
    enunciado: "Use o Algoritmo de Euclides para calcular mdc(48, 18).\n\nEm seguida, expresse mdc(48, 18) como combinação linear inteira de 48 e 18 (Identidade de Bézout).",
    expectedConcepts: ["algoritmo-euclides", "mdc", "identidade-bezout", "divisao-euclidiana"],
  },
  {
    id: "numeros-D-1",
    area: "numeros",
    rank: "D",
    enunciado: "Prove que existem infinitos números primos.\n\nUse a demonstração clássica de Euclides por contradição: assuma que há finitos primos p₁, ..., pₙ e considere N = p₁·p₂·...·pₙ + 1.",
    expectedConcepts: ["infinidade-primos", "prova-euclides", "contradicao", "numero-primo"],
  },
  {
    id: "numeros-C-1",
    area: "numeros",
    rank: "C",
    enunciado: "Enuncie o Teorema Fundamental da Aritmética.\n\nDemonstre a unicidade da fatoração prima usando o Lema de Euclides: se p é primo e p | ab, então p | a ou p | b.",
    expectedConcepts: ["fatoracao-prima", "unicidade", "lema-euclides", "teorema-fundamental-aritmetica"],
  },
  {
    id: "numeros-B-1",
    area: "numeros",
    rank: "B",
    enunciado: "Resolva o sistema de congruências pelo Teorema Chinês do Resto:\n\nx ≡ 2 (mod 3)\nx ≡ 3 (mod 5)\nx ≡ 2 (mod 7)\n\nEncontre a solução geral e a menor solução positiva.",
    expectedConcepts: ["teorema-chines-resto", "congruencias", "sistema-congruencias", "inverso-modular"],
  },
  {
    id: "numeros-A-1",
    area: "numeros",
    rank: "A",
    isBoss: true,
    enunciado: "Enuncie o Pequeno Teorema de Fermat: se p é primo e mdc(a, p) = 1, então aᵖ⁻¹ ≡ 1 (mod p).\n\nDemonstre usando a bijeção dos resíduos: {a·1, a·2, ..., a·(p−1)} é uma permutação de {1, 2, ..., p−1} mod p.\n\nUse o teorema para calcular 2¹⁰⁰ mod 101.",
    expectedConcepts: ["pequeno-fermat", "residuos-modular", "bijecao", "aritmetica-modular", "grupo-multiplicativo"],
  },

  // ───── APLICADA ─────
  {
    id: "aplicada-E-1",
    area: "aplicada",
    rank: "E",
    enunciado: "Resolva a equação diferencial ordinária:\n\ndy/dx = 2x,  y(0) = 1\n\nUse separação de variáveis e a condição inicial para encontrar a solução particular.",
    expectedConcepts: ["equacao-diferencial", "separacao-variaveis", "condicao-inicial", "integracao-direta"],
  },
  {
    id: "aplicada-D-1",
    area: "aplicada",
    rank: "D",
    enunciado: "Resolva a EDO linear de primeira ordem:\n\ndy/dx + 2y = 4x,  y(0) = 0\n\nUse o fator integrante μ(x) = e^(∫2 dx) e verifique a solução.",
    expectedConcepts: ["edo-linear", "fator-integrante", "solucao-geral", "solucao-particular"],
  },
  {
    id: "aplicada-C-1",
    area: "aplicada",
    rank: "C",
    enunciado: "Calcule a Transformada de Laplace de f(t) = t·eᵃᵗ usando a propriedade de multiplicação por t:\n\nL{t·f(t)} = −F'(s)\n\nonde F(s) = L{f(t)}. Verifique com a tabela: L{eᵃᵗ} = 1/(s−a) para s > a.",
    expectedConcepts: ["transformada-laplace", "propriedades-laplace", "edo-resolucao", "funcao-exponencial"],
  },
  {
    id: "aplicada-B-1",
    area: "aplicada",
    rank: "B",
    enunciado: "Encontre a solução geral da EDO de segunda ordem:\n\ny'' − 3y' + 2y = eˣ\n\n(a) Resolva a equação homogênea associada.\n(b) Encontre uma solução particular pelo método dos coeficientes indeterminados.\n(c) Escreva a solução geral.",
    expectedConcepts: ["edo-segunda-ordem", "equacao-caracteristica", "coeficientes-indeterminados", "solucao-homogenea", "variacao-parametros"],
  },
  {
    id: "aplicada-A-1",
    area: "aplicada",
    rank: "A",
    isBoss: true,
    enunciado: "Modele e resolva o problema de valor de contorno:\n\n−u''(x) = f(x),  x ∈ (0,1)\nu(0) = u(1) = 0\n\nUsando o método de elementos finitos com funções chapéu em N = 3 subintervalos iguais.\n\nMonste a matriz de rigidez K e o vetor de carga F para f(x) = 1 constante. Explique o que representa cada entrada de K.",
    expectedConcepts: ["elementos-finitos", "PVP", "matriz-rigidez", "funcoes-chapeu", "aproximacao-numerica"],
  },
];

const RANK_ORDER: QuestRank[] = ["E", "D", "C", "B", "A", "S"];

function rankDistance(a: QuestRank, b: QuestRank): number {
  return Math.abs(RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b));
}

export function pickQuestForRun(area: MathArea, rank: QuestRank): MathQuestProblem[] {
  const areaProblems = BANK.filter((p) => p.area === area);
  const nonBoss = areaProblems.filter((p) => !p.isBoss);
  const boss = areaProblems.find((p) => p.isBoss) ?? areaProblems[areaProblems.length - 1];

  const sorted = [...nonBoss].sort((a, b) => rankDistance(a.rank, rank) - rankDistance(b.rank, rank));
  const picked: MathQuestProblem[] = [];
  for (const p of sorted) {
    if (picked.length >= 4) break;
    picked.push(p);
  }
  while (picked.length < 4 && areaProblems.length > 0) {
    picked.push(areaProblems[picked.length % areaProblems.length]);
  }

  return [...picked, boss];
}

export function listAllProblems(): MathQuestProblem[] {
  return BANK;
}
