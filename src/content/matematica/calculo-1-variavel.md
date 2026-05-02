---
title: Cálculo Diferencial e Integral (1 variável)
category: matematica
stack: [Mat, Python]
tags: [calculo, fundamentos, analise]
excerpt: Limites, derivadas, integrais e o teorema fundamental do cálculo — base de toda análise quantitativa.
related: [analise-real, calculo-multivariavel, series-e-sequencias, equacoes-diferenciais-ordinarias]
updated: 2026-05
---

## O que é

Cálculo diferencial e integral de uma variável é o estudo de como funções mudam (derivação) e como acumular quantidades ao longo de um intervalo (integração). O campo foi desenvolvido simultaneamente por Newton e Leibniz no séc. XVII — um dos maiores achievements intelectuais da humanidade — e formalizado rigorosamente por Cauchy, Weierstrass e Riemann no séc. XIX.

O conceito central é o **limite**: lim_{x→a} f(x) = L significa que f(x) se aproxima arbitrariamente de L quando x se aproxima de a. Derivada e integral são ambas definidas via limite: a derivada é o limite do quociente de diferenças, a integral é o limite de somas de Riemann. Sem limites, nenhum dos dois existe rigorosamente.

O **Teorema Fundamental do Cálculo** (TFC) é o resultado mais importante: conecta diferenciação e integração, mostrando que são operações inversas. Se F é primitiva de f, então ∫_a^b f(x) dx = F(b) - F(a). Este resultado é não-óbvio e sua prova merece atenção cuidadosa.

## Por que estuda

Cálculo é a linguagem em que física, engenharia, economia e ML são escritos. Sem cálculo, não existe gradiente descendente (treinamento de redes neurais), não existe análise de algoritmos por recorrência contínua, não existe modelagem de qualquer fenômeno que varie continuamente.

Para dev/ML: a regra da cadeia (chain rule) é o coração do backpropagation — calcular gradientes em redes neurais é aplicar a regra da cadeia em composições de funções. Derivadas parciais definem o gradiente; integração aparece em expectativas de distribuições de probabilidade; séries de Taylor aparecem em análise de otimizadores (Adam, RMSprop são aproximações de segunda ordem).

## Conceitos-chave

- **Limite e continuidade**: f é contínua em a se lim_{x→a} f(x) = f(a). Três condições: f(a) existe, o limite existe, e são iguais. Continuidade uniforme (mais forte) é necessária para resultados de integração.
- **Derivada**: f'(x) = lim_{h→0} [f(x+h) - f(x)]/h. Interpretação geométrica: inclinação da tangente. Interpretação física: taxa de variação instantânea. A derivada de f em x existe sse o limite existe.
- **Regras de derivação**: soma, produto (Leibniz: (fg)' = f'g + fg'), quociente, e especialmente **regra da cadeia**: (f∘g)'(x) = f'(g(x))·g'(x). A regra da cadeia é o resultado mais importante para aplicações.
- **Teorema de Rolle e valor médio**: se f é contínua em [a,b] e diferenciável em (a,b), existe c ∈ (a,b) com f'(c) = [f(b)-f(a)]/(b-a). Consequências: funções com derivada zero são constantes; se f' > 0 em (a,b), f é crescente.
- **Critérios de extremo**: f'(c) = 0 é condição necessária para extremo local (ponto crítico). Suficiência: se f''(c) > 0, mínimo local; se f''(c) < 0, máximo local; se f''(c) = 0, inconclusivo (usar derivadas de ordem superior ou análise do sinal de f').
- **Integral de Riemann**: ∫_a^b f(x) dx = lim_{‖P‖→0} Σ f(xᵢ*) Δxᵢ. Para f contínua, o limite existe e a função é integrável. Interpretação: área com sinal sob a curva.
- **Teorema Fundamental do Cálculo**: (TFC-1) Se f é contínua em [a,b] e F(x) = ∫_a^x f(t) dt, então F'(x) = f(x). (TFC-2) Se F é primitiva de f, então ∫_a^b f(x) dx = F(b) - F(a). O TFC-1 diz que integração e derivação são inversas; o TFC-2 é o instrumento de cálculo.
- **Técnicas de integração**: substituição (u-sub), integração por partes (∫u dv = uv - ∫v du), frações parciais (para racionais), substituição trigonométrica. Não há algoritmo geral — é reconhecimento de padrão.

## Confusões comuns

**"Derivável implica contínuo, mas contínuo não implica derivável"**: Uma função pode ser contínua em todo ponto mas não derivável em nenhum (função de Weierstrass). A recíproca é verdadeira: se f é derivável em a, então f é contínua em a. Esse sentido único é frequentemente invertido.

**"Se f'(c) = 0, então c é mínimo ou máximo"**: Ponto crítico (f'(c) = 0 ou f'(c) não existe) é condição necessária para extremo local — não suficiente. Ponto de inflexão pode ter f'(c) = 0 sem ser extremo (ex: f(x) = x³, c = 0).

**"∫f(x)g(x) dx = ∫f(x) dx · ∫g(x) dx"**: Completamente errado. Integração não distribui sobre produto. A fórmula correta para integração de produto é integração por partes, não produto de integrais.

**"O limite de f quando x→a é f(a)"**: Isso equivale a dizer que f é contínua em a, o que não é sempre verdade. Calcular lim_{x→a} f(x) sem verificar continuidade pode levar a erro. Para funções descontinuas (racionais com denominador zero), é preciso análise específica.

**"A primitiva é única"**: Primitiva de f é única a menos de constante: se F e G são ambas primitivas de f, então F(x) = G(x) + C para alguma constante C. Por isso se escreve ∫f(x) dx = F(x) + C.

## Aplicação em CS/Dev/ML

**Backpropagation**: calcular ∂L/∂w para cada peso w de uma rede neural é aplicação recursiva da regra da cadeia. O algoritmo de backprop é essencialmente a regra da cadeia implementada em grafo computacional (autodiferenciação reversa).

**Autodiff (PyTorch, JAX, TensorFlow)**: frameworks de deep learning computam derivadas automaticamente usando diferenciação automática — que implementa a regra da cadeia de forma exata (não aproximada) em cada operação elementar.

**Análise de algoritmos**: método mestre para recorrências do tipo T(n) = aT(n/b) + f(n) usa integral para estimar somatórios. Análise amortizada de estruturas de dados usa derivadas discretas.

**Métodos numéricos de integração**: quadratura de Gauss, regra do trapézio, regra de Simpson — todos aproximam ∫f(x) dx por somas finitas. Aparecem em simulação física, esperanças de distribuições contínuas, e em training de modelos (cálculo de normalizing constants).

**Otimização contínua**: gradient descent e variantes (Adam, Adagrad, LBFGS) são algoritmos que atualizam parâmetros na direção do gradiente negativo — derivada de primeira ordem. Métodos de Newton usam a derivada de segunda ordem (Hessiana).

## Como praticar

- **Livro base**: Guidorizzi — *Um Curso de Cálculo* (4 volumes, LTC). Apostol — *Calculus* Vol. 1 (mais rigoroso, em inglês). Stewart — *Cálculo* (mais acessível, com muitas aplicações).
- **Derivar tudo à mão**: antes de usar computação simbólica, calcule derivadas e integrais das 50 funções elementares de memória. Velocidade aqui economiza tempo em EDOs e análise.
- **SymPy**: `from sympy import *; x = symbols('x'); diff(sin(x)**2, x)`, `integrate(x*exp(x), x)`. Verifique seus cálculos manuais.
- **Provar o TFC**: escreva a prova do Teorema Fundamental do Cálculo do zero, entendendo cada passo. Se a prova não estiver clara, a intuição de integração está incompleta.
- **Projeto**: implemente integração numérica (regra do trapézio, Simpson, Gauss-Legendre) e compare a acurácia com `scipy.integrate.quad`. Visualize o erro como função do número de subdivisões.

## Exercícios práticos

1. **[Rank E]** Calcule as derivadas das seguintes funções usando as regras elementares (sem usar regra da cadeia no primeiro): (a) f(x) = 3x⁴ - 2x² + 7; (b) g(x) = x·sin(x); (c) h(x) = (x²+1)/(x-1). *Dica: (a) potência; (b) produto: f'g + fg'; (c) quociente: (f'g - fg')/g². Resultados: (a) 12x³-4x; (b) sin(x)+xcos(x); (c) (x²-2x-1)/(x-1)².*

2. **[Rank D]** Encontre os máximos e mínimos locais de f(x) = x³ - 3x² - 9x + 5 no intervalo [-2, 6]. Use o teste da segunda derivada para classificar cada ponto crítico. *Dica: f'(x) = 3x²-6x-9 = 3(x-3)(x+1) = 0 em x = -1 e x = 3. f''(x) = 6x-6: f''(-1) = -12 < 0 (máximo local); f''(3) = 12 > 0 (mínimo local). Compare com os extremos do intervalo.*

3. **[Rank C]** Calcule ∫ x²·e^x dx usando integração por partes repetida. Organize em tabela (método tabular se preferir) e verifique derivando o resultado. *Dica: aplique integração por partes u·v|−∫v·du com u = x², dv = eˣdx: resultado = x²eˣ - 2xeˣ + 2eˣ + C. Verifique diferenciando.*

4. **[Rank B]** Prove o Teorema Fundamental do Cálculo (Parte 1): se f é contínua em [a, b] e F(x) = ∫_{a}^{x} f(t)dt, então F é diferenciável em (a,b) e F'(x) = f(x). Use a definição de derivada e o teorema do valor médio para integrais. *Dica: F'(x) = lim_{h→0} [F(x+h)-F(x)]/h = lim_{h→0} (1/h)∫_{x}^{x+h} f(t)dt. Pelo TVM para integrais, existe c ∈ (x, x+h) tal que essa média é f(c). Quando h → 0, c → x, e por continuidade de f, f(c) → f(x).*

5. **[Rank A] [BOSS]** Calcule ∫₀^{π/2} ln(sin x) dx. Este é um resultado clássico cujo valor é -(π/2)ln 2. Use a seguinte abordagem: (a) chame I = ∫₀^{π/2} ln(sin x) dx; (b) mostre que I = ∫₀^{π/2} ln(cos x) dx pela substituição x ↦ π/2-x; (c) some: 2I = ∫₀^{π/2} ln(sin x cos x) dx = ∫₀^{π/2} ln(sin(2x)/2) dx; (d) use a substituição u = 2x e a periodicidade para reduzir ao próprio I. *Dica: 2I = ∫₀^{π/2} ln(sin(2x))dx - (π/2)ln 2. Substituindo u=2x: ∫₀^{π} ln(sin u)du/2 = ∫₀^{π/2} ln(sin u)du = I (por simetria). Portanto 2I = I - (π/2)ln 2, dando I = -(π/2)ln 2.*

## Próximos passos

- [analise-real](analise-real) — fundamentos rigorosos de limite, derivada e integral
- [calculo-multivariavel](calculo-multivariavel) — funções de várias variáveis, gradiente, integral múltipla
- [equacoes-diferenciais-ordinarias](equacoes-diferenciais-ordinarias) — equações que relacionam f e suas derivadas
- [series-e-sequencias](series-e-sequencias) — séries de Taylor, séries de potências
- → Pratique no /math-quest na área **Análise** (Rank C+)
