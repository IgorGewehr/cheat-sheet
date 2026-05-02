---
title: Geometria Diferencial
category: matematica
stack: [Mat]
tags: [geometria, analise, fisica]
excerpt: Curvas, superfícies, curvatura, variedades e a geometria que embasa a relatividade geral e o deep learning geométrico.
related: [calculo-vetorial-geometria-analitica, topologia-geral, calculo-multivariavel, fisica-mecanica-classica]
updated: 2026-05
---

## O que é

Geometria Diferencial aplica o cálculo diferencial e integral ao estudo de curvas e superfícies, e mais geralmente de variedades — espaços que localmente se parecem com ℝⁿ. É a matemática que descreve a geometria intrínseca de objetos curvos: a curvatura da Terra, a geometria do espaço-tempo, e a forma de espaços de parâmetros de modelos de ML.

O campo foi construído por Gauss, Riemann e Cartan. Gauss descobriu que a curvatura de uma superfície pode ser medida intrinsecamente (sem referência ao espaço ambiente) — o Theorema Egregium. Riemann generalizou para variedades de dimensão arbitrária com uma métrica (tensor de Riemann), que é a estrutura que Einstein usou para descrever a gravidade na relatividade geral.

As ferramentas centrais são: o tensor métrico g (que define distância e ângulo em cada ponto), a conexão de Levi-Civita (que define transporte paralelo e curvatura), e as formas diferenciais (que generalizam gradiente, rotacional e divergente de forma coordenada-independente).

## Por que estuda

Para o matemático, geometria diferencial é onde análise, topologia e álgebra convergem em sua forma mais rica. Variedades Riemannianas são o objeto central de estudo de muitos dos problemas abertos mais importantes em matemática.

Para ML/IA: "geometric deep learning" estuda arquiteturas de redes neurais que respeitam a geometria dos dados. Se os dados vivem numa variedade (e pelo manifold hypothesis, muitos dados de alta dimensão vivem em variedades de baixa dimensão), então operar diretamente na variedade — com operações equivariantes sob as simetrias do espaço — pode ser mais eficiente e expressivo. Modelos em SO(3), SE(3), grupos de Lie — todos são geometria diferencial.

## Conceitos-chave

- **Curvas parametrizadas e triedro de Frenet-Serret**: r(t) = (x(t), y(t), z(t)). Vetor tangente T = r'/|r'|; normal principal N = T'/|T'|; binormal B = T×N. Curvatura κ = |T'(s)| (resistência à dobra); torção τ (resistência ao torção fora do plano). Equações de Frenet: T' = κN, N' = -κT + τB, B' = -τN.
- **Superfícies parametrizadas**: X(u,v) = (x(u,v), y(u,v), z(u,v)). Primeira forma fundamental: ds² = E du² + 2F du dv + G dv² onde E = X_u·X_u, F = X_u·X_v, G = X_v·X_v. Define comprimentos, ângulos e áreas na superfície intrinsecamente.
- **Segunda forma fundamental e curvatura**: segunda forma fundamental usa a normal N à superfície. Curvaturas principais k₁, k₂ são os extremos das curvaturas normais. Curvatura gaussiana K = k₁k₂ (invariante intrínseco — Theorema Egregium de Gauss). Curvatura média H = (k₁+k₂)/2.
- **Theorema Egregium**: K é invariante por isometria. Consequências: não existe mapa isométrico do plano para a esfera (impossível achatar a Terra sem distorção); um cone pode ser planificado (K=0 em cone = K=0 no plano). É por isso que mapas cartográficos sempre distorcem algo.
- **Geodésicas**: curvas de comprimento mínimo numa superfície (generalização de linhas retas). Num plano: linhas retas. Na esfera: círculos máximos. Em superfície de revolução: perfis da superfície, círculos paralelos (sob condições), etc. Equações de geodésica envolvem os símbolos de Christoffel (da conexão de Levi-Civita).
- **Variedades Riemannianas**: generalização de superfície para n dimensões com tensor métrico g. Tensor de curvatura de Riemann R mede o fracasso do transporte paralelo de vetores. Curvatura escalar e de Ricci (contrações de R) são fundamentais na relatividade geral.
- **Formas diferenciais e o teorema de Stokes generalizado**: forma diferencial de grau k é objeto que integra sobre k-subvariedades. Operador exterior d: k-forma → (k+1)-forma. Teorema de Stokes: ∫_M dω = ∫_{∂M} ω. Unifica todos os teoremas integrais (Green, Stokes clássico, Gauss) em uma única fórmula elegante.
- **Teorema de Gauss-Bonnet**: ∫∫_M K dA + ∮_{∂M} κ_g ds = 2πχ(M) onde χ é a característica de Euler. Liga curvatura (análise) a topologia (χ). Para esfera: K=1/r², área = 4πr², então ∫∫K dA = 4π = 2π·2 = 2πχ(S²), confirmando χ(S²) = 2.

## Confusões comuns

**"Curvatura de superfície = curvatura de curva na superfície"**: Curvatura de curva (κ) mede dobra em ℝ³. Curvatura gaussiana K de superfície é propriedade intrínseca — não depende de como a superfície está embutida. Um cilindro tem K=0 (pode ser planificado) embora "pareça curvo" em ℝ³.

**"Geodésica é o caminho mais curto entre dois pontos"**: Geodésica é caminho que localmente minimiza comprimento — é extremo local, não necessariamente mínimo global. Na esfera, entre dois polos existem infinitas geodésicas (todos os meridianos), e cada uma é mínimo local mas só uma é mínimo global (a que não passa pelo ponto antipodal).

**"Variedade Riemanniana e espaço euclidiano são a mesma coisa"**: ℝⁿ é variedade riemanniana (plana). Mas uma variedade Riemanniana pode ter curvatura — a esfera S² com métrica redonda tem K=1. A diferença entre geometria euclidiana e não-euclidiana é precisamente a curvatura gaussiana.

**"Tensor métrico é apenas uma matriz"**: O tensor métrico gᵢⱼ(p) é uma família de matrizes (uma para cada ponto p da variedade). Ele varia de ponto a ponto, capturando como a geometria muda. É isso que permite que uma variedade seja localmente similar a ℝⁿ mas globalmente curva.

**"Transporte paralelo preserva ângulos e comprimentos"**: Sim, mas em variedades curvas, transporte paralelo ao longo de curvas diferentes do mesmo ponto A ao ponto B dá resultados diferentes. A falha do transporte paralelo ao longo de um loop fechado é medida pela curvatura de Riemann.

## Aplicação em CS/Dev/ML

**Geometric Deep Learning (GDL)**: Michael Bronstein et al. propõem GDL como framework unificado para redes em grafos, malhas, grupos de Lie, variedades. A ideia: arquiteturas devem respeitar as simetrias do espaço de dados. Redes em grafos (GCN) são o caso onde o espaço é um grafo (variedade discreta).

**SE(3) equivariance**: proteínas são estruturas 3D. Redes como SE(3)-Transformer e EGNN processam pontos em ℝ³ respeitando simetria do grupo de Euclidean motions SE(3) — rotações + translações. Usam produtos escalares e vetoriais como operações equivariantes. Base de AlphaFold e sucessores.

**Otimização em variedades**: otimizar sobre a variedade de Stiefel (matrizes ortogonais), variedade de Grassmann (subespaços), grupo de Lie SO(n) — todos são otimização riemanniana. `geoopt` é biblioteca PyTorch para isso. Usado em treinamento de redes com restrições de ortogonalidade.

**Modelos generativos em variedades**: quando dados vivem em variedades (ângulos, orientações, dados em superfícies esféricas), VAEs e flows padrão em ℝⁿ são subótimos. "Riemannian VAE", "Wrapped Normal Distribution" em hiperbólico, "Hyperbolic embeddings" — todos são geometria diferencial aplicada.

**Relatividade e física computacional**: simulação de buracos negros (LIGO), cálculo de trajetórias de satélites (GPS com correção relativística), simulação de fluidos em geometrias curvas — todos usam geometria diferencial computacional.

## Como praticar

- **Livro base**: do Carmo — *Geometria Diferencial de Curvas e Superfícies* (Prentice Hall, autor brasileiro) — referência clássica, excelente para o nível de bacharelado. Para variedades: do Carmo — *Riemannian Geometry*. Lee — *Introduction to Smooth Manifolds* (rigoroso e moderno).
- **Calcular curvatura à mão**: dado parabolóide z = x² + y², compute a primeira e segunda formas fundamentais, as curvaturas principais e a curvatura gaussiana K em (0,0,0) e em (1,0,1).
- **Geodésicas em superfícies simples**: derive as equações de geodésica no cilindro e verifique que os "helicoides" são geodésicas (ou que linhas do cilindro se tornam linhas retas ao planificar).
- **SageMath / SageManifolds**: SageMath tem o pacote SageManifolds para cálculo simbólico de geometria diferencial (tensor métrico, conexão, curvatura). Tutorial em sagemanifolds.obspm.fr.
- **Projeto GDL**: use PyTorch Geometric para treinar uma rede equivariante em SE(3) em um dataset de proteínas (ex: ProteinNet). Compare com CNN sobre representação vetorizada — a equivariância deve dar vantagem com menos dados.

## Exercícios práticos

1. **[Rank E]** Para a curva plana α(t) = (cos t, sin t, 0) (círculo unitário em ℝ³), calcule: o vetor tangente T(t) = α'(t)/|α'(t)|; a curvatura κ(t) = |α''(t)|/|α'(t)|²; e o vetor normal principal N(t). *Dica: α'(t) = (-sin t, cos t, 0), |α'(t)| = 1. T = (-sin t, cos t, 0). T'(t) = (-cos t, -sin t, 0), κ = |T'|/|α'| = 1. N = T'/|T'| = (-cos t, -sin t, 0). O círculo tem curvatura constante 1/raio.*

2. **[Rank D]** Para a superfície de revolução S gerada ao rotacionar a curva (r(u), 0, z(u)) em torno do eixo z: parametrize S como X(u,v) = (r(u)cos v, r(u)sin v, z(u)), calcule os coeficientes da primeira forma fundamental E, F, G e determine o elemento de área dA = √(EG-F²) du dv. *Dica: X_u = (r'cos v, r'sin v, z'), X_v = (-r sin v, r cos v, 0). E = r'² + z'², F = 0, G = r². dA = r√(r'²+z'²) du dv. Para a esfera r = cos u, z = sin u: dA = cos u du dv.*

3. **[Rank C]** Calcule a curvatura gaussiana K e a curvatura média H para o parabolóide z = x² + y² no ponto (0,0,0). Use a segunda forma fundamental e a fórmula K = (LN-M²)/(EG-F²). *Dica: parametrize X(u,v) = (u,v,u²+v²). E = 1+4u², F = 4uv, G = 1+4v², L = 2/√(1+4u²+4v²), M = 0, N = 2/√(1+4u²+4v²). Em (0,0): K = 4/1 = 4, H = 2.*

4. **[Rank B]** Prove o teorema egregium de Gauss: a curvatura gaussiana K é invariante por isometrias, ou seja, K pode ser calculada apenas com os coeficientes E, F, G da primeira forma fundamental (sem usar o encastramento em ℝ³). Use a fórmula de Brioschi: K em termos de E, F, G e suas derivadas. *Dica: a fórmula de Brioschi (complexa mas explícita) expressa K como função de E, F, G e suas derivadas de até segunda ordem. A prova usa os símbolos de Christoffel e as equações de Gauss-Codazzi. O resultado implica que uma superfície que pode ser planificada (K=0) não pode ser mapeada isometricamente para uma de K≠0.*

5. **[Rank A] [BOSS]** Enuncie e prove o teorema de Gauss-Bonnet para uma superfície compacta orientada S sem bordo: ∬_S K dA = 2π χ(S), onde χ(S) é a característica de Euler. Para a esfera S²: K = 1 (curvatura constante), Área = 4π, logo ∬K dA = 4π = 2π·2 = 2πχ(S²) com χ(S²) = 2. Para o toro T²: K muda de sinal e integra para zero, χ(T²) = 0. *Dica: a prova local usa o teorema de Gauss-Bonnet para polígonos geodésicos (ângulos exteriores + integral de curvatura geodésica + integral de curvatura gaussiana = 2π). A versão global é obtida cobrindo S por uma triangulação geodésica e somando sobre todos os triângulos. A soma dos ângulos exteriores relaciona-se com V-E+F = χ(S) pela fórmula de Euler para poliedros.*

## Próximos passos

- [topologia-geral](topologia-geral) — variedades como espaços topológicos com estrutura diferencial
- [calculo-vetorial-geometria-analitica](calculo-vetorial-geometria-analitica) — o caso local de curvas e superfícies em ℝ³
- [fisica-mecanica-classica](fisica-mecanica-classica) — mecânica lagrangiana usa geometria de variedades
- [medida-integracao](medida-integracao) — integração em variedades via formas diferenciais
- → Pratique no /math-quest na área **Geometria** (Rank C+)
