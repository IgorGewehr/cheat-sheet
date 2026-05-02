---
title: Análise Complexa (Variáveis Complexas)
category: matematica
stack: [Mat]
tags: [analise, algebra, fundamentos]
excerpt: Funções de variável complexa, teorema de Cauchy, resíduos e as conexões profundas entre geometria e análise.
related: [numeros-complexos, analise-real, series-e-sequencias, teoria-dos-numeros]
updated: 2026-05
---

## O que é

Análise Complexa estuda funções f: ℂ → ℂ que são diferenciáveis no sentido complexo. A definição de derivada é a mesma que em análise real: f'(z₀) = lim_{z→z₀} [f(z) - f(z₀)]/(z - z₀). A diferença é que z se aproxima de z₀ pelo plano complexo (em qualquer direção), não apenas pelo eixo real.

Essa condição extra — convergir para o mesmo limite independente da direção de aproximação — é muito mais restritiva que no caso real. Uma função complexa diferenciável em um ponto já é automaticamente infinitamente diferenciável e representável por série de potências (analítica) em uma vizinhança do ponto. Em análise real, existem funções infinitamente diferenciáveis que não são analíticas.

As funções holomorfas (diferenciáveis em aberto) têm propriedades extraordinárias: o teorema de Cauchy-Goursat diz que a integral ao longo de qualquer curva fechada (em domínio simplesmente conexo) é zero; a fórmula integral de Cauchy recupera os valores da função a partir de seus valores no bordo; os resíduos permitem calcular integrais reais difíceis ou impossíveis por métodos elementares.

## Por que estuda

Análise complexa é "análise real mas tudo funciona" — as funções são mais bonitas, os teoremas são mais fortes, as provas são mais elegantes. É ferramenta poderosa para analisar funções reais (via continuação analítica) e para cálculo de integrais reais por técnica de resíduos.

Para o matemático, análise complexa é base de geometria algébrica (variedades complexas, curvas algébricas), teoria analítica dos números (função zeta de Riemann), e física teórica (transformada de Laplace e sua inversão, teoria de perturbações, funções de Green).

Para ML: a transformada de Laplace bilateral tem inversão via integral no plano complexo (teorema de inversão de Bromwich). Sistemas de controle clássicos vivem no plano-s (variável de Laplace) — estabilidade depende de posição de polos em ℂ. Séries de Laurent descrevem comportamento assintótico de sinais.

## Conceitos-chave

- **Condições de Cauchy-Riemann**: f = u + iv é holomorfa em z₀ ↔ existem as derivadas parciais e ∂u/∂x = ∂v/∂y, ∂u/∂y = -∂v/∂x em z₀. São condições necessárias e suficientes (com continuidade das parciais). Geometricamente: f é holomorfa ↔ f preserva ângulos (é conforme) onde f'(z) ≠ 0.
- **Funções harmônicas**: u é harmônica se ∇²u = ∂²u/∂x² + ∂²u/∂y² = 0. Se f = u + iv é holomorfa, então u e v são harmônicas e conjugadas. Harmônicas em análise complexa correspondem a potenciais em física (eletrostática, fluido incompressível e irrotacional).
- **Teorema de Cauchy-Goursat**: se f é holomorfa em domínio simplesmente conexo D, então ∮_C f(z)dz = 0 para toda curva fechada C em D. Implicação: valor de integral não depende do caminho — a curva pode ser deformada livremente em D.
- **Fórmula integral de Cauchy**: se f é holomorfa em D e a ∈ D, então f(a) = (1/2πi) ∮_C f(z)/(z-a) dz para C curva fechada simples ao redor de a. Mais geral: f⁽ⁿ⁾(a) = (n!/2πi) ∮_C f(z)/(z-a)^{n+1} dz.
- **Singularidades e série de Laurent**: se f tem singularidade isolada em z₀, a série de Laurent expande f em torno de z₀: Σ_{n=-∞}^{∞} aₙ(z-z₀)ⁿ. O coeficiente a₋₁ é o **resíduo** de f em z₀. Tipos de singularidade: removível (a₋ₙ = 0 para n>0); polo de ordem m (a₋ₙ = 0 para n>m, a₋ₘ ≠ 0); essencial (infinitos termos negativos — Teorema de Casorati-Weierstrass: f assume valores densos em qualquer vizinhança de singularidade essencial).
- **Teorema dos resíduos**: ∮_C f(z)dz = 2πi Σ Res(f, zₖ) onde a soma é sobre todos os polos zₖ dentro de C. Permite calcular integrais reais difíceis: ∫_{-∞}^{∞} f(x)dx via semicírculo em ℂ.
- **Mapeamentos conformes**: f holomorfa com f'(z) ≠ 0 preserva ângulos. Transformações de Möbius f(z) = (az+b)/(cz+c) mapeam círculos e retas em círculos e retas. Transformações conformes resolvem EDPs em geometrias complexas reduzindo a domínios simples (disco, semiplano).
- **Teorema de Liouville e TFA**: função inteira (holomorfa em ℂ inteiro) e limitada é constante (Liouville). Corolário: toda função inteira não-constante é ilimitada. Aplicação: prova elegante do Teorema Fundamental da Álgebra — se p(z) não tem raízes, 1/p(z) é inteira e limitada, logo constante, contradição.

## Confusões comuns

**"Diferenciável em ℂ é apenas diferenciável em ℝ² com componentes complexas"**: Não. Diferenciabilidade complexa (holomorfia) é uma condição muito mais forte que diferenciabilidade em ℝ². As condições de Cauchy-Riemann adicionam rigidez que torna funções holomorfas automaticamente analíticas — o que não ocorre em ℝ².

**"Singularidade é onde a função está indefinida"**: Singularidade isolada é ponto onde f não é holomorfa mas é holomorfa numa vizinhança perfurada. Singularidade removível: f pode ser estendida holomorficamente (o ponto da descontinuidade é espúrio). Polo: |f(z)| → ∞. Essencial: comportamento caótico (Casorati-Weierstrass).

**"∮_C f(z)dz = 0 para toda curva fechada"**: Só para f holomorfa em domínio simplesmente conexo. Se o domínio tem buracos (não simplesmente conexo), a integral pode ser não-nula. Ex: ∮_{|z|=1} 1/z dz = 2πi ≠ 0 (f(z) = 1/z tem polo em 0, que está dentro do círculo).

**"Resíduo é a singularidade mais importante de uma série de Laurent"**: Resíduo é apenas o coeficiente a₋₁ da série de Laurent — ele tem importância especial no teorema dos resíduos porque é o que sobrevive à integração. Os outros termos negativos descrevem o tipo da singularidade mas não contribuem para o valor da integral de contorno.

**"Continuação analítica é apenas extensão do domínio"**: Continuação analítica é um processo único quando existe: dada função f holomorfa em aberto U e g holomorfa em aberto V com U ∩ V ≠ ∅ e f = g em U ∩ V, então g é a única continuação de f a V. A função zeta de Riemann é definida por série convergente para Re(s) > 1 e continuada analiticamente para ℂ\{1} — o resultado tem vida própria além do domínio original.

## Aplicação em CS/Dev/ML

**Transformada de Laplace e sistemas de controle**: transformada de Laplace F(s) = ∫₀^∞ f(t)e^{-st}dt onde s ∈ ℂ. Inversão via fórmula de Bromwich: f(t) = (1/2πi)∫_{γ-i∞}^{γ+i∞} F(s)e^{st}ds (integral no plano complexo). Estabilidade de sistema LTI: polos de F(s) à esquerda do eixo imaginário → sistema estável.

**Processamento de sinais e transformada Z**: a transformada Z (versão discreta da Laplace) é Z{f[n]} = Σ f[n]z^{-n} para z ∈ ℂ. Análise de filtros digitais usa região de convergência no plano z. Polos e zeros no plano z determinam a resposta em frequência do filtro.

**Função zeta de Riemann e teoria analítica dos números**: ζ(s) = Σ n^{-s} para Re(s) > 1, continuada analiticamente. A hipótese de Riemann (zeros não-triviais têm Re(s) = 1/2) é equivalente à melhor estimativa possível para o erro no teorema dos números primos. Algoritmos de geração de primos e criptografia dependem indiretamente desta teoria.

**Otimização no plano complexo**: gradiente no plano complexo usa derivadas de Wirtinger (∂/∂z e ∂/∂z̄). Otimização de funções de matrizes complexas aparece em processamento de array em antenas e em filtros complexos.

**SciPy para análise complexa**: `scipy.signal` para transformadas de Laplace/Z e sistemas de controle. `scipy.integrate.quad` aceita funções complexas. Visualização de funções complexas (domain coloring): `matplotlib` com coloração pelo argumento e brilho pelo módulo.

## Como praticar

- **Livro base**: Churchill & Brown — *Complex Variables and Applications* (acessível, com muitos exemplos de resíduos). Para nível universitário rigoroso: Ahlfors — *Complex Analysis* (clássico). Conway — *Functions of One Complex Variable* (rigoroso e completo).
- **Calcular integrais por resíduos**: ∫₀^{2π} dθ/(2+cos θ), ∫_{-∞}^{∞} x²/(x⁴+1)dx. Esses exercícios clássicos consolidam o método. Faça 10-15 integrais desse tipo.
- **Verificar Cauchy-Riemann**: dado f(z), encontre u e v, verifique C-R, e quando não satisfeitas mostre que f não é holomorfa (ex: f(z) = |z|²).
- **SymPy**: `from sympy import *; z = symbols('z'); f = 1/(z**2+1); residue(f, z, I)` calcula resíduo em z=i.
- **Domain coloring**: plote f(z) = (z²-1)/(z²+1) usando domain coloring (ângulo de f(z) como matiz, módulo como brilho). Visualize zeros (matiz indefinido, brilho zero) e polos (todos os matizes se encontram).

## Exercícios práticos

1. **[Rank E]** Verifique que f(z) = z² = (x+iy)² satisfaz as equações de Cauchy-Riemann ∂u/∂x = ∂v/∂y e ∂u/∂y = -∂v/∂x, onde u = Re(f) e v = Im(f). Conclua que f é holomorfa e calcule f'(z). *Dica: z² = x²-y² + 2xyi, logo u = x²-y², v = 2xy. Calcule as quatro derivadas parciais e verifique as equações C-R. A derivada complexa é f'(z) = 2z.*

2. **[Rank D]** Classifique as singularidades de f(z) = sin(z)/z² em z = 0: determine se é polo, singularidade removível ou singularidade essencial, e calcule o resíduo Res(f, 0). *Dica: expanda sin(z) = z - z³/6 + z⁵/120 - … em série de Laurent: f(z) = 1/z - z/6 + z³/120 - … O coeficiente de z⁻¹ é 1, portanto Res(sin(z)/z², 0) = 1. Como há apenas um termo de potência negativa (z⁻¹), é polo simples.*

3. **[Rank C]** Calcule a integral ∫_{-∞}^{∞} 1/(x² + 1) dx usando o teorema dos resíduos. Feche o contorno no semiplano superior com semicírculo de raio R → ∞ e verifique que a contribuição do semicírculo tende a zero (lema de Jordan). *Dica: os polos de 1/(z²+1) = 1/((z-i)(z+i)) são z = ±i. Apenas z = i está no semiplano superior. Res(f, i) = 1/(2i). Pelo teorema dos resíduos: ∫_contorno = 2πi · (1/2i) = π. O resultado é π.*

4. **[Rank B]** Prove o princípio do módulo máximo: se f é holomorfa e não-constante numa região aberta conexa D ⊆ ℂ, então |f| não atinge seu máximo em nenhum ponto interior de D. *Dica: use a fórmula da média de Cauchy: f(z₀) = (1/2π)∫₀^{2π} f(z₀ + re^{iθ})dθ. Portanto |f(z₀)| ≤ (1/2π)∫₀^{2π}|f(z₀+re^{iθ})|dθ ≤ max_{|z-z₀|=r}|f(z)|. Se |f(z₀)| fosse máximo global, a igualdade exigiria |f| constante no círculo, e por continuação analítica f seria constante em D.*

5. **[Rank A] [BOSS]** Prove o Teorema Fundamental da Álgebra usando análise complexa: todo polinômio não-constante p(z) ∈ ℂ[z] tem ao menos uma raiz em ℂ. Use o princípio do módulo mínimo: se p(z) ≠ 0 em todo ℂ, então 1/p(z) é inteira (holomorfa em ℂ) e limitada (pois |p(z)| → ∞ quando |z| → ∞), logo constante pelo teorema de Liouville — contradição com p não-constante. *Dica: formalize os dois passos: (a) se p não tem raízes, 1/p é inteira; (b) |p(z)| → ∞ conforme |z| → ∞ pois p(z)/zⁿ → aₙ ≠ 0 (coeficiente líder), portanto 1/p é limitada. Aplique Liouville: toda inteira limitada é constante.*

## Próximos passos

- [series-e-sequencias](series-e-sequencias) — séries de Laurent e raio de convergência em ℂ
- [teoria-dos-numeros](teoria-dos-numeros) — função zeta de Riemann e distribuição de primos
- [medida-integracao](medida-integracao) — fundamentos rigorosos de integração para C
- [algebra-galois](algebra-galois) — funções elípticas conectam análise complexa e álgebra
- → Pratique no /math-quest na área **Análise** (Rank C+)
