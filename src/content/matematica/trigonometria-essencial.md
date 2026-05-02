---
title: Trigonometria Essencial
category: matematica
stack: [Mat]
tags: [fundamentos, geometria, calculo]
excerpt: Funções trigonométricas, identidades, e suas aparições em análise, física e processamento de sinais.
related: [geometria-plana, numeros-complexos, calculo-1-variavel, calculo-vetorial-geometria-analitica]
updated: 2026-05
---

## O que é

Trigonometria é o estudo das relações entre ângulos e razões de lados em triângulos, generalizado para funções de variável real e complexa. A palavra vem do grego: trígonon (triângulo) + métron (medida). A origem remota está nos astrônomos babilônicos e indianos (Aryabhata, séc. V), e a formulação moderna deve muito a Euler, que definiu sen, cos e tan como funções da reta real, não apenas como razões geométricas.

O salto conceitual fundamental é esse: seno e cosseno deixam de ser "cateto sobre hipotenusa" e passam a ser funções periódicas ℝ → [-1, 1] definidas pela circunferência unitária. Isso abre a trigonometria para análise, equações diferenciais e álgebra.

As funções trigonométricas são, na prática, a forma como qualquer fenômeno periódico é descrito matematicamente — desde a oscilação de uma mola até a portadora de um sinal de rádio.

## Por que estuda

Todo bacharel em matemática precisa de trigonometria como linguagem. Ela aparece inevitavelmente em cálculo (integral de funções compostas, séries de Fourier), geometria analítica (produto escalar, ângulo entre vetores), equações diferenciais (solução de EDOs lineares com coeficientes constantes) e análise complexa (fórmula de Euler: e^{iθ} = cos θ + i·sen θ).

Para dev e ML eng: processamento de sinais (FFT — transformada rápida de Fourier — usa senos e cossenos), codificação posicional em transformers (o paper original "Attention is All You Need" usa senos e cossenos com frequências variadas), computação gráfica (rotações 2D e 3D são matrizes trigonométricas), e física de jogos (colisão, trajetória de projétil).

## Conceitos-chave

- **Circunferência unitária**: ponto (cos θ, sen θ) percorre o círculo x² + y² = 1 ao variar θ. Definição-base de sen e cos para qualquer θ ∈ ℝ.
- **Periodicidade**: sen(θ + 2π) = sen θ. Período de tan é π. Consequência: não são injetoras, logo suas inversas (arcsen, arccos, arctan) requerem restrição de domínio.
- **Identidade fundamental**: sen²θ + cos²θ = 1. Deriva diretamente da definição na circunferência e é a mãe de todas as outras identidades.
- **Fórmulas de adição**: sen(α ± β) = sen α cos β ± cos α sen β; cos(α ± β) = cos α cos β ∓ sen α sen β. Derivam o resto: duplo ângulo, produto-para-soma.
- **Lei dos senos**: a/sen A = b/sen B = c/sen C = 2R (R: raio da circunferência circunscrita).
- **Lei dos cossenos**: c² = a² + b² - 2ab·cos C. Generaliza Pitágoras para triângulos arbitrários.
- **Relação de Euler**: e^{iθ} = cos θ + i·sen θ. Unifica trigonometria com exponencial complexa. Caso θ = π dá a identidade de Euler: e^{iπ} + 1 = 0.
- **Funções inversas e seus domínios**: arcsen: [-1,1] → [-π/2, π/2]; arccos: [-1,1] → [0, π]; arctan: ℝ → (-π/2, π/2). Ignorar esses domínios gera erros clássicos.
- **Séries de Taylor**: sen x = x - x³/3! + x⁵/5! - … ; cos x = 1 - x²/2! + x⁴/4! - … Essas séries são frequentemente a definição rigorosa em análise real.

## Confusões comuns

**"sin⁻¹(x) é 1/sin(x)"**: Não. A notação sin⁻¹ é arcsin (inversa da função), não o recíproco. O recíproco de sen é cossecante (csc). Essa ambiguidade de notação persiste em calculadoras e código.

**"cos(a + b) = cos a + cos b"**: Linearidade não existe aqui. Funções trigonométricas não são lineares. A fórmula correta envolve o produto cruzado. Verificar com a = b = π/4 imediatamente destrói a ilusão.

**"arctan(y/x) dá o ângulo do vetor (x, y)"**: Só no 1º e 4º quadrantes. Para o ângulo correto em todos os quadrantes use atan2(y, x) — função que existe em todas as linguagens de programação e que considera o sinal de x e y separadamente.

**"Radianos e graus são intercambiáveis"**: Radianos são a unidade natural (arco = raio × ângulo em radianos). As fórmulas de derivada (d/dx sen x = cos x) e as séries de Taylor só são válidas em radianos. Misturar graus em cálculo gera resultados errados por um fator de π/180.

**"Funções trigonométricas são definidas apenas em triângulos retângulos"**: A definição via razões em triângulos é apenas o caso escolar. A definição via circunferência unitária — ou via séries de potências — é a correta em análise.

## Aplicação em CS/Dev/ML

**Transformada de Fourier e FFT**: qualquer sinal periódico (áudio, imagem, série temporal) se decompõe em combinação de senos e cossenos. FFT tem complexidade O(n log n) e é um dos algoritmos mais importantes na computação.

**Positional Encoding em Transformers**: o paper "Attention is All You Need" codifica a posição do token i na dimensão 2k com sen(i/10000^{2k/d}) e na dimensão 2k+1 com cos(i/10000^{2k/d}). Isso permite ao modelo aprender padrões de posição relativa.

**Rotações em computação gráfica**: rotação 2D por ângulo θ é a matriz [[cos θ, -sen θ], [sen θ, cos θ]]. Quaternions (extensão 3D) usam a mesma estrutura.

**Física de jogos**: cálculo de trajetória de projétil, direção de força, colisão com superfícies — tudo vira vetor com componentes trigonométricas.

**Redes neurais periódicas**: a ativação SIREN (Implicit Neural Representations with Periodic Activation Functions) usa sen como função de ativação para representar sinais contínuos com derivadas de alta frequência.

## Como praticar

- **Livro base**: Gelson Iezzi — *Trigonometria* (Atual Editora). Para nível universitário: Guidorizzi Vol. 1, capítulos de funções trigonométricas.
- **Problemas**: resolva todos os casos da lei dos senos e cossenos; derive identidades partindo apenas de sen² + cos² = 1 e das fórmulas de adição.
- **SymPy**: `from sympy import *; x = symbols('x'); trigsimp(sin(x)**2 + cos(x)**2)`. Explore `expand_trig`, `trigsimp`, `fourier_series`.
- **Visualização**: plote sen, cos, tan e suas inversas com matplotlib. Anime o ponto na circunferência unitária gerando a curva de seno — isso consolida a intuição.
- **Projeto concreto**: implemente a FFT manualmente (Cooley-Tukey) e compare com `numpy.fft.fft`. Entender o que os coeficientes representam requer trigonometria sólida.

## Exercícios práticos

1. **[Rank E]** Calcule sem calculadora usando os valores exatos das funções trigonométricas: (a) sin(π/6); (b) cos(3π/4); (c) tan(π/3); (d) sin(5π/6). Esboce o ângulo no círculo unitário para cada caso. *Dica: memorize os ângulos do primeiro quadrante (30°, 45°, 60°, 90°) e use simetria para os demais. sin(π/6) = 1/2; cos(3π/4) = -√2/2; tan(π/3) = √3; sin(5π/6) = sin(π-π/6) = 1/2.*

2. **[Rank D]** Prove as identidades de adição sin(a+b) = sin a cos b + cos a sin b e cos(a+b) = cos a cos b - sin a sin b geometricamente (usando vetores rotacionados no plano) ou algebricamente (usando a fórmula de Euler e^{i(a+b)} = e^{ia}e^{ib}). *Dica: pela fórmula de Euler: e^{i(a+b)} = (cos a + i sin a)(cos b + i sin b) = (cos a cos b - sin a sin b) + i(sin a cos b + cos a sin b). Igualando partes real e imaginária.*

3. **[Rank C]** Resolva a equação trigonométrica 2sin²(x) - 3sin(x) + 1 = 0 no intervalo [0, 2π]. Liste todas as soluções exatas. *Dica: seja u = sin(x). A equação 2u²-3u+1 = (2u-1)(u-1) = 0 tem raízes u = 1/2 e u = 1. Para sin(x) = 1/2: x = π/6 ou x = 5π/6. Para sin(x) = 1: x = π/2.*

4. **[Rank B]** Use a lei dos cossenos para demonstrar que a mediana m_a de um triângulo com lados a, b, c (onde a é o lado oposto ao vértice A) satisfaz: 4m_a² = 2b² + 2c² - a². *Dica: seja M o ponto médio de BC. Aplique a lei dos cossenos ao triângulo ABM: m_a² = c² + (a/2)² - 2c·(a/2)·cos(B), e ao triângulo ACM: m_a² = b² + (a/2)² - 2b·(a/2)·cos(C). Note que ângulo C em ACM e ângulo B em ABM são suplementares (o ângulo externo é π - B); some as duas equações.*

5. **[Rank A] [BOSS]** Prove a fórmula de Euler para polinômios trigonométricos: se p(x) = Σ_{k=-n}^n cₖe^{ikx} é um polinômio trigonométrico, then p é não-negativo (p(x) ≥ 0 para todo x) se e somente se p(x) = |q(e^{ix})|² para algum polinômio q(z) = Σ_{k=0}^n dₖzᵏ. Use a fatoração de Riesz-Fejér: toda função trigonométrica não-negativa é o módulo quadrado de uma soma de exponenciais. *Dica: escreva p(z) = Σ cₖzᵏ para z = e^{ix}. p ≥ 0 implica que p, visto como polinômio de grau 2n em z com coeficientes c_{-n},…,c_n, tem raízes complexas simétricas em relação ao círculo unitário (se z₀ é raiz, 1/z̄₀ também é). Fatore: p(z) = cₙ Π|z-zᵢ|² para |zᵢ|≤1. Então q(z) = √cₙ Π(z-zᵢ) é o polinômio desejado.*

## Próximos passos

- [numeros-complexos](numeros-complexos) — fórmula de Euler conecta trig com exponencial complexa
- [calculo-1-variavel](calculo-1-variavel) — derivadas e integrais de funções trigonométricas
- [analise-complexa](analise-complexa) — sen e cos como funções de variável complexa
- [series-e-sequencias](series-e-sequencias) — séries de Fourier como generalização
- → Pratique no /math-quest na área **Fundamentos** (Rank C+)
