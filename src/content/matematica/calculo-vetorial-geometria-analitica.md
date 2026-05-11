---
title: Cálculo Vetorial e Geometria Analítica
category: matematica
stack: [Mat, Python]
tags: [calculo, geometria, fundamentos]
excerpt: Vetores no espaço, curvas, superfícies, operadores diferenciais vetoriais e geometria analítica.
related: [calculo-multivariavel, geometria-espacial, algebra-linear, equacoes-diferenciais-parciais]
updated: 2026-05
---

## O que é

Cálculo Vetorial combina álgebra vetorial com cálculo diferencial e integral para estudar campos escalares e vetoriais no espaço. Geometria Analítica aplica coordenadas cartesianas para traduzir problemas geométricos em equações algébricas.

A geometria analítica começa com Descartes (séc. XVII): reta, plano, cônicas e quádricas são descritas por equações. Retas no plano: ax + by + c = 0. Planos em ℝ³: ax + by + cz = d. Cônicas: elipses, parábolas, hipérboles como seções do cone. Quádricas: esfera, cilindro, cone, hiperboloide.

O cálculo vetorial adiciona derivadas e integrais de funções vetoriais e os operadores diferenciais do campo: **gradiente** (∇f), **divergente** (∇·F), **rotacional** (∇×F) e **laplaciano** (∇²f). Esses operadores aparecem em todas as equações da física matemática: equação do calor, equação de onda, equações de Maxwell, equação de Schrödinger.

## Por que estuda

Geometria analítica é o vocabulário de qualquer modelo que existe no espaço: visão computacional (poses de câmera, homografias), robótica (cinemática), simulação física. Cálculo vetorial é o vocabulário das equações que governam campos físicos — elétrico, magnético, gravitacional, de velocidade de fluido.

Para ML: embeddings são vetores em ℝⁿ; produto interno é operação geométrica fundamental; similaridade de cosseno é ângulo entre vetores. Para computação gráfica: toda transformação 3D é álgebra vetorial. Para física de simulação: qualquer simulador de fluidos, corpo rígido ou partículas usa cálculo vetorial.

## Conceitos-chave

- **Vetores em ℝ³**: v = (v₁, v₂, v₃). Soma vetorial, multiplicação por escalar, norma |v| = √(v₁² + v₂² + v₃²). Vetor unitário: v/|v|. Bases ortonormais i = (1,0,0), j = (0,1,0), k = (0,0,1).
- **Produto escalar (dot product)**: u·v = u₁v₁ + u₂v₂ + u₃v₃ = |u||v|cos θ. Vetores ortogonais: u·v = 0. Projeção de v sobre u: proj_u v = (v·u/|u|²)·u. Cosine similarity = (u·v)/(|u||v|).
- **Produto vetorial (cross product)**: u×v = determinante simbólico com i,j,k. Resultado: vetor perpendicular a u e v, módulo |u||v|sen θ. Regra da mão direita para direção. |u×v| = área do paralelogramo gerado por u e v. u×v = -v×u (anti-comutatividade).
- **Equação de reta e plano**: reta por ponto P₀ com direção v: P(t) = P₀ + tv. Plano por ponto P₀ com normal n: n·(P - P₀) = 0, ou ax + by + cz = d. Distância de ponto a plano: |n·(P-P₀)|/|n|.
- **Cônicas e quádricas**: elipse x²/a² + y²/b² = 1; hipérbole x²/a² - y²/b² = 1; parábola y = ax². Quádricas: esfera x² + y² + z² = r²; elipsoide x²/a² + y²/b² + z²/c² = 1; cone z² = x² + y²; hiperboloide.
- **Curvas parametrizadas e referencial de Frenet-Serret**: r(t) = (x(t), y(t), z(t)). Vetor tangente r'(t); comprimento de arco s(t) = ∫_a^t |r'(τ)| dτ. Reparametrizando por arco s: tangente unitária T = dr/ds; normal principal N = (dT/ds)/|dT/ds|; binormal B = T × N. Curvatura κ(s) = |dT/ds| (em parametrização geral, κ = |r' × r''|/|r'|³); torsão τ(s) = −(dB/ds)·N (mede falha de planaridade). Equações de Frenet-Serret: dT/ds = κN; dN/ds = −κT + τB; dB/ds = −τN. Em forma matricial é skew-symmetric. **Teorema fundamental das curvas**: dadas κ(s) > 0 e τ(s) suaves, existe curva única em ℝ³ realizando-as (a menos de isometria). Curvas planas ⟺ τ ≡ 0; círculos ⟺ κ const, τ = 0; hélices ⟺ κ, τ const não-nulas.
- **Operadores diferenciais**: gradiente ∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z); divergente ∇·F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z; rotacional ∇×F = det([[i,j,k],[∂/∂x,∂/∂y,∂/∂z],[F₁,F₂,F₃]]); laplaciano ∇²f = ∂²f/∂x² + ∂²f/∂y² + ∂²f/∂z².
- **Teoremas integrais vetoriais**: teorema da divergência (Gauss): ∯_∂V F·dS = ∭_V (∇·F) dV — fluxo saindo de V = integral da divergência em V. Teorema de Stokes: ∮_∂S F·dr = ∯_S (∇×F)·dS — circulação em ∂S = integral do rotacional em S.

## Confusões comuns

**"Produto vetorial é comutativo"**: u×v = -v×u. Anti-comutativo. Ao contrário do produto escalar (u·v = v·u). Trocar a ordem inverte a direção do vetor resultante.

**"Divergente e rotacional são a mesma coisa"**: São operadores completamente diferentes. Divergente transforma campo vetorial em campo escalar (mede "quanto o campo diverge de um ponto"); rotacional transforma campo vetorial em outro campo vetorial (mede "quanto o campo circula em torno de um ponto"). Divergente de rotacional = 0; rotacional de gradiente = 0.

**"Toda curva parametrizada tem o mesmo comprimento independente da parametrização"**: O comprimento de arco é invariante por reparametrização, mas a velocidade |r'(t)| pode mudar. Reparametrizar por comprimento de arco (s) faz |r'(s)| = 1 e simplifica a geometria (curvatura fica κ = |r''(s)|).

**"Normal ao plano é única"**: A direção normal é única (a menos de sinal), mas o vetor normal não é: n e -n são ambos normais ao mesmo plano. Sinal importa para orientação (qual lado do plano é "exterior").

**"Teorema de Stokes é mais geral que o teorema de Green"**: Stokes para superfícies planas no plano xy reduz exatamente a Green. Green é um caso especial de Stokes em 2D. E ambos são casos especiais do teorema de Stokes generalizado para formas diferenciais em variedades.

## Aplicação em CS/Dev/ML

**Embeddings e similaridade**: word embeddings (Word2Vec, GloVe), sentence embeddings (SBERT) são vetores em ℝ³⁰⁰ ou ℝ⁷⁶⁸. Similaridade de cosseno = produto interno normalizado. Operações geométricas (projeção, distância, ângulo) são álgebra vetorial.

**Computer vision / 3D**: pose de câmera é (R, t) — matriz de rotação e vetor de translação. Homografia é transformação projetiva. Normal de superfície (para iluminação) é produto vetorial de dois vetores tangentes. SfM (Structure from Motion) e NeRF são geometria analítica computacional.

**Simulação de fluidos**: equação de Navier-Stokes usa divergente (incompressibilidade: ∇·u = 0), laplaciano (difusão: ∇²u) e gradiente de pressão. Simuladores de fluidos em jogos (como nos engines Unity/Unreal) discretizam essas operações.

**Eletromagnetismo computacional**: equações de Maxwell usam ∇·E, ∇×B, etc. Métodos de elementos finitos (FEM) para campos eletromagnéticos resolvem essas equações numericamente.

**Gradiente de funções de matriz**: em otimização de ML, gradiente de f(A) em relação a A é uma matriz. Cálculo matricial (matrix cookbook) é cálculo vetorial para objetos matriciais — essencial para derivar updates de gradiente em álgebra linear.

## Como praticar

- **Livro base**: Boulos & Camargo — *Geometria Analítica: Um Tratamento Vetorial* (3a ed.). Para cálculo vetorial: Guidorizzi Vol. 3. Stewart — *Cálculo Vol. 2* também cobre bem.
- **Calcular com produtos**: dados u = (1,2,3), v = (4,5,6), calcule u·v, u×v, |u×v|, ângulo entre eles, projeção de v sobre u. Depois calcule equação do plano que contém u, v e passa pela origem.
- **Verificar teoremas numericamente**: compute ∭_V (∇·F) dV e ∯_∂V F·dS para F e V simples e confirme que são iguais. Use scipy.integrate.
- **NumPy para álgebra vetorial**: `np.dot(u, v)`, `np.cross(u, v)`, `np.linalg.norm(v)`. Implemente projeção de Gram-Schmidt como exercício.
- **Projeto**: crie um visualizador de campos vetoriais 2D com matplotlib (quiver plot). Implemente divergente e rotacional numericamente com diferenças finitas e visualize-os para vários campos.

## Exercícios práticos

1. **[Rank E]** Dados os vetores u = (2, -1, 3) e v = (1, 4, -2), calcule: (a) o produto interno u·v; (b) o módulo de cada vetor; (c) o ângulo entre eles (em graus); (d) o produto vetorial u × v. *Dica: (a) u·v = 2·1 + (-1)·4 + 3·(-2) = -8; (b) |u| = √14, |v| = √21; (c) cos θ = -8/(√14·√21); (d) use o determinante com e₁, e₂, e₃.*

2. **[Rank D]** Para o campo vetorial F(x,y,z) = (xy, yz, xz), calcule o divergente ∇·F e o rotacional ∇×F em qualquer ponto. Identifique se F é conservativo ou rotacional. *Dica: ∇·F = y + z + x. ∇×F = (x-y, y-z, z-x) — um campo rotacional. Para ser conservativo precisaria ∇×F = 0.*

3. **[Rank C]** Use o teorema de Green para calcular ∮_C (y dx - x dy) onde C é o círculo x²+y² = 4 percorrido no sentido anti-horário. Compare com integrar diretamente parametrizando C. *Dica: pelo teorema de Green com P = y, Q = -x: ∮_C (P dx + Q dy) = ∬_D (∂Q/∂x - ∂P/∂y) dA = ∬_D (-1-1) dA = -2·Área(D) = -2·4π = -8π. Parametrizando: x = 2cos t, y = 2sin t, dx = -2sin t dt, dy = 2cos t dt; ∮ = ∫₀^{2π}(2sin t·(-2sin t) - 2cos t·2cos t)dt = -8π.*

4. **[Rank B]** Verifique o teorema da divergência de Gauss para F = (x², y², z²) e V = {(x,y,z): x²+y²+z² ≤ 1} (bola unitária). Calcule tanto o fluxo de saída ∯_∂V F·n dS quanto a integral de volume ∭_V ∇·F dV e confirme a igualdade. *Dica: ∇·F = 2x+2y+2z. Por simetria ∭_V (2x+2y+2z) dV = 0 (integrais de x, y, z sobre a bola são zero por simetria). Calcular o fluxo superficial diretamente na esfera confirma o mesmo valor.*

5. **[Rank A] [BOSS]** Prove o teorema de Stokes: para uma superfície orientada S com bordo ∂S orientado consistentemente, e campo vetorial F suave, vale ∮_{∂S} F·dr = ∬_S (∇×F)·dS. Prove o caso especial de S planar (reduzindo a Green) e esboce a prova geral via partição de S em pedaços parametrizados por patches com coordenadas locais (u,v). *Dica: para S planar no plano xy: ∬_S (∇×F)·k dA = ∬_S (∂F₂/∂x - ∂F₁/∂y) dA = ∮_{∂S} (F₁dx + F₂dy) pelo teorema de Green. Para S geral: parametrize cada patch por Φ(u,v) e use que d(Φ*(ω)) = Φ*(dω) — equivalentemente, a derivada exterior e a pullback comutam.*

## Próximos passos

- [calculo-multivariavel](calculo-multivariavel) — gradiente, Jacobiana, Hessiana, integrais múltiplas
- [equacoes-diferenciais-parciais](equacoes-diferenciais-parciais) — as equações que os operadores vetoriais formam
- [geometria-diferencial](geometria-diferencial) — curvatura de curvas e superfícies no espaço
- [fisica-mecanica-classica](fisica-mecanica-classica) — cálculo vetorial aplicado à mecânica
- → Pratique no /math-quest na área **Análise** (Rank C+)
