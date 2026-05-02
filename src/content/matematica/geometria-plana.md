---
title: Geometria Plana
category: matematica
stack: [Mat]
tags: [fundamentos, geometria]
excerpt: Axiomas euclidianos, figuras planas, congruência, semelhança e as bases da demonstração matemática.
related: [geometria-espacial, trigonometria-essencial, calculo-vetorial-geometria-analitica, tecnicas-demonstracao]
updated: 2026-05
---

## O que é

Geometria Plana — ou geometria euclidiana do plano — é o estudo das propriedades de figuras bidimensionais: pontos, retas, ângulos, triângulos, polígonos, circunferências. O nome vem de Euclides de Alexandria (≈300 a.C.), cujo livro *Os Elementos* organizou todo o conhecimento geométrico da Antiguidade em um sistema axiomático: cinco postulados dos quais todo o resto se deriva por dedução lógica.

Esse sistema foi o modelo de raciocínio dedutivo por dois milênios. Quando no séc. XIX Lobachevsky e Bolyai mostraram que negar o 5° postulado (o das paralelas) gera geometrias consistentes — a hiperbólica e a elíptica — abriram a geometria moderna e, indiretamente, fizeram possível a relatividade geral de Einstein.

Para o matemático de hoje, geometria plana é o lugar onde se aprende a demonstrar. As primeiras provas reais de um bacharel são quase sempre geométricas: congruência de triângulos, a existência do incentro, o teorema de Tales.

## Por que estuda

Além de ser fundamento do currículo, geometria plana é o treino mental para raciocínio rigoroso. O hábito de distinguir "parece óbvio" de "está demonstrado" começa aqui.

Para dev: computação gráfica é geometria plana (clipping, rasterização, hit-testing). Algoritmos computacionais de geometria (computational geometry) — interseção de segmentos, fecho convexo (convex hull), triangulação de Delaunay — são aplicações diretas. Para ML: kernels de SVM têm interpretação geométrica, PCA é geometria (hiperplanos, projeções ortogonais). Para jogos: detecção de colisão 2D, física de corpos rígidos planos.

## Conceitos-chave

- **Postulados de Euclides**: especialmente o 5° (paralelas): por um ponto externo a uma reta passa exatamente uma reta paralela. Negar isso dá geometrias não-euclidianas.
- **Congruência (≅)**: duas figuras são congruentes quando existe isometria (translação, rotação, reflexão) que mapeia uma na outra. Para triângulos: critérios LAL, LLL, ALA, LAA.
- **Semelhança (~)**: figuras com mesma forma mas escala diferente. Razão de semelhança k implica razão de áreas k². Teorema de Tales generaliza para feixes de paralelas.
- **Teorema de Pitágoras**: em triângulo retângulo, c² = a² + b². Existem centenas de provas; a via área é a mais elegante. Converso: se c² = a² + b², o ângulo oposto a c é reto.
- **Circunferência**: lugares geométricos equidistantes de um centro. Propriedades de tangentes, cordas, arcos, ângulos inscritos (ângulo inscrito = metade do ângulo central).
- **Polígonos regulares**: soma dos ângulos internos de n-ágono = (n-2)·180°. Construtibilidade com régua e compasso conecta com teoria de Galois (n-ágono construtível ↔ n é produto de potência de 2 com primos de Fermat).
- **Áreas**: triângulo = (base × altura)/2 = (ab·sen C)/2. Círculo = πr². Trapézio = (B+b)h/2. Saber derivar essas fórmulas, não só memorizar.
- **Lugares geométricos**: circunferência é o LG dos pontos equidistantes de um centro; mediatriz é o LG dos equidistantes de dois pontos. Pensar em LG é pensar em conjuntos definidos por propriedades.

## Confusões comuns

**"Demonstrar com um exemplo é suficiente"**: Não. Em geometria (e em matemática em geral), um exemplo verifica mas não prova. A prova deve cobrir todos os casos. Esse é o erro mais comum no início do bacharelado.

**"Ângulos no triângulo somam sempre 180°"**: Apenas na geometria euclidiana (plano plano). Na esfera (geometria esférica) a soma é maior; no plano hiperbólico, menor. A afirmação é equivalente ao 5° postulado.

**"Congruente e igual são a mesma coisa"**: Não exatamente. Figuras congruentes têm as mesmas medidas mas podem estar em posições diferentes no plano. Igualdade em geometria refere-se a medidas (comprimentos, ângulos).

**"O teorema de Tales diz que triângulos semelhantes têm lados proporcionais — o que é óbvio"**: Não é óbvio; requer prova para o caso incomensurável (lados com razão irracional), que foi historicamente problemático para os gregos porque envolve o conceito de número real.

**"Qualquer triângulo tem circuncentro, incentro, baricentro e ortocentro"**: Todos existem para qualquer triângulo, mas suas posições variam (o ortocentro pode ficar fora do triângulo em casos obtusos). A existência de cada ponto requer demonstração.

## Aplicação em CS/Dev/ML

**Computational Geometry**: algoritmos como o de Graham Scan (fecho convexo em O(n log n)), Shamos-Hoey (interseção de segmentos), e triangulação de Delaunay (usada em malhas de elementos finitos e em jogos 3D) são geometria plana codificada.

**Detecção de colisão**: games e simulações físicas usam testes de separação de eixos (SAT — Separating Axis Theorem), que é um resultado de geometria convexa plana.

**Kernels geométricos em SVM**: o kernel linear corresponde a separar dados com um hiperplano. A margem máxima é uma construção de geometria (distância de ponto a reta).

**Computação gráfica 2D**: rasterização de polígonos, anti-aliasing, clipping de Sutherland-Hodgman — toda pipeline 2D.

**GIS e cartografia**: cálculo de áreas, interseções, containment queries em bases de dados geoespaciais (PostGIS usa algoritmos de geometria plana computacional).

## Como praticar

- **Livro base**: Gelson Iezzi et al. — *Fundamentos de Matemática Elementar Vol. 9 (Geometria Plana)*. Para nível superior com provas: Moise & Downs — *Geometry*.
- **Provar, não calcular**: pegue os teoremas clássicos (Pitágoras, Tales, ângulo inscrito) e prove do zero, sem consultar. Isso treina o músculo da demonstração.
- **GeoGebra**: visualize construções, explore conjecturas dinamicamente antes de tentar provar. Ferramenta gratuita, imprescindível.
- **Problemas de olimpíada**: OBMEP nível 2 e 3. Geometria olímpica exige criatividade com os mesmos resultados básicos. IMO tem problemas de geometria que exigem construções auxiliares sofisticadas.
- **Código**: implemente o algoritmo de Graham Scan em Python. Formaliza o entendimento de ângulos, orientação e convexidade.

## Exercícios práticos

1. **[Rank E]** Num triângulo ABC com lados a = 5, b = 7, c = 8, calcule: (a) o perímetro; (b) a área usando a fórmula de Heron; (c) o raio do círculo inscrito r = Área/s onde s é o semiperímetro. *Dica: s = (5+7+8)/2 = 10. Área = √(10·5·3·2) = √300 = 10√3. r = 10√3/10 = √3.*

2. **[Rank D]** Prove o teorema de Pitágoras geometricamente usando a rearranjo de quatro triângulos retângulos num quadrado. Construa a demonstração: coloque quatro triângulos retângulos congruentes de catetos a, b e hipotenusa c num quadrado de lado a+b e mostre que o quadrado central tem área c². *Dica: o quadrado grande tem área (a+b)². Os quatro triângulos têm área total 4·(ab/2) = 2ab. O quadrado central tem área (a+b)²-2ab = a²+b². Portanto c² = a²+b².*

3. **[Rank C]** Prove o teorema do ângulo inscrito: um ângulo inscrito numa circunferência é igual à metade do arco correspondente (ou à metade do ângulo central que subentende o mesmo arco). Considere os três casos: o centro está no interior, no bordo, ou no exterior do ângulo inscrito. *Dica: para o caso em que o diâmetro é um lado do ângulo inscrito: o triângulo inscrito com um lado no diâmetro é isósceles (dois raios iguais). O ângulo central é ângulo externo de um dos triângulos isósceles. Use a relação entre ângulo externo e soma dos ângulos internos.*

4. **[Rank B]** Prove que as três medianas de um triângulo são concorrentes (se encontram num único ponto, o centróide G) e que G divide cada mediana na razão 2:1 a partir do vértice. *Dica: use coordenadas. Se os vértices são A, B, C, as medianas vão dos vértices aos pontos médios dos lados opostos. O ponto G = (A+B+C)/3 está em cada mediana e divide cada uma na razão 2:1. Verifique: G está na mediana de A a M_A = (B+C)/2 pois G = A + (2/3)(M_A - A) = (A+B+C)/3.*

5. **[Rank A] [BOSS]** Prove o teorema de Ptolomeu: para um quadrilátero inscrito numa circunferência (quadrilátero cíclico), o produto das diagonais é igual à soma dos produtos dos lados opostos: AC·BD = AB·CD + AD·BC. Use a inversão em um ponto da circunferência, ou use lei dos cossenos e a identidade trigonométrica de ângulos inscrito. *Dica: usando a lei dos cossenos e a propriedade que ângulos opostos de quadrilátero cíclico são suplementares. Alternativamente, usando inversão centrada em D com raio r: a inversão mapeia A, B, C para pontos A', B', C' na mesma reta (pois A, B, C, D são cocíclicos e D é o centro de inversão). As distâncias se transformam por d(P',Q') = d(P,Q)·r²/(d(D,P)·d(D,Q)). Expresse AC·BD e AB·CD + AD·BC em termos das distâncias e derive a identidade.*

## Próximos passos

- [geometria-espacial](geometria-espacial) — extensão para 3D
- [trigonometria-essencial](trigonometria-essencial) — ferramentas analíticas para geometria
- [calculo-vetorial-geometria-analitica](calculo-vetorial-geometria-analitica) — geometria com coordenadas e vetores
- [tecnicas-demonstracao](tecnicas-demonstracao) — métodos formais de prova que aparecem aqui primeiro
- → Pratique no /math-quest na área **Geometria** (Rank C+)
