---
title: Teoria dos Jogos
category: matematica
stack: [Mat, Python]
tags: [aplicada, probabilidade, cs, discreta]
excerpt: Equilíbrios de Nash, jogos de soma zero, mecanismos e dilema do prisioneiro — a matemática das decisões estratégicas com múltiplos agentes.
related: [probabilidade, otimizacao-pesquisa-op, analise-combinatoria, processos-estocasticos]
updated: 2026-05
---

## O que é

Teoria dos Jogos é o estudo matemático da tomada de decisão estratégica — situações em que o resultado para cada agente depende das ações de todos. O campo foi fundado por von Neumann e Morgenstern com *Theory of Games and Economic Behavior* (1944) e transformado por John Nash, que definiu o conceito central de equilíbrio que leva seu nome.

Um **jogo na forma normal** é uma tripla (N, A, u) onde N = {1,…,n} é o conjunto de jogadores, A = A₁ × … × Aₙ é o espaço de perfis de ação (Aᵢ é o conjunto de ações do jogador i), e u = (u₁,…,uₙ) é o vetor de funções de utilidade. Cada jogador busca maximizar sua utilidade esperada, sabendo que os demais fazem o mesmo.

O **equilíbrio de Nash** é um perfil de estratégias (s₁*,…,sₙ*) tal que nenhum jogador tem incentivo unilateral para desviar: para todo jogador i e toda ação aᵢ ∈ Aᵢ, uᵢ(sᵢ*, s₋ᵢ*) ≥ uᵢ(aᵢ, s₋ᵢ*). Nash provou (1950) que todo jogo finito tem ao menos um equilíbrio, possivelmente em estratégias mistas.

## Por que estuda

Para o matemático, teoria dos jogos combina otimização, análise convexa, topologia (ponto fixo de Brouwer na prova de Nash) e probabilidade (estratégias mistas). Os problemas mais profundos — computabilidade de equilíbrios, jogos de soma geral, design de mecanismos — levam a questões em CS teórica e economia matemática.

Para CS/ML: multiagent reinforcement learning é teoria dos jogos aplicada. AlphaGo/AlphaStar são algoritmos de teoria dos jogos de informação perfeita. Algoritmos de leilão (Google Ads, AWS Spot) são mecanismos de teoria dos jogos. GAN (Generative Adversarial Networks) é um jogo minimax assimétrico de dois jogadores — gerador vs. discriminador, com payoffs não-simétricos em formulações modernas. Sistemas de recomendação criam jogos entre plataforma, usuários e produtores de conteúdo.

## Conceitos-chave

- **Jogos de soma zero**: uᵢ + u_j = 0 para dois jogadores. Um jogador ganha exatamente o que o outro perde. Xadrez, poker (antes do pote). Teorema minimax de von Neumann: max_{i} min_{j} u = min_{j} max_{i} u (em estratégias mistas) — o valor do jogo existe.
- **Estratégias mistas**: em vez de jogar uma ação determinística, o jogador randomiza sobre suas ações. Uma estratégia mista de i é uma distribuição de probabilidade σᵢ sobre Aᵢ. A utilidade esperada de i é Eσ[uᵢ] = Σ_a (Πⱼ σⱼ(aⱼ)) uᵢ(a). Todo jogo finito tem equilíbrio de Nash em estratégias mistas.
- **Equilíbrio de Nash**: perfil σ* onde nenhum jogador lucra desviando. Condição alternativa: no equilíbrio de Nash em estratégias mistas, cada ação na suporte de σᵢ* dá a mesma utilidade esperada ao jogador i (princípio de indiferença). Isso simplifica o cálculo: o oponente randomiza para tornar o jogador indiferente.
- **Dilema do prisioneiro**: o exemplo canônico de falha de coordenação. Dois suspeitos decidem cooperar ou trair sem se comunicar. A traição é estratégia dominante para ambos, mas (trair, trair) é Pareto-inferior a (cooperar, cooperar). O único equilíbrio de Nash é socialmente subótimo. Mostra que racionalidade individual pode ser coletivamente irracional.
- **Jogos extensivos e informação**: árvore de decisão onde jogadores tomam decisões sequencialmente. Informação perfeita (cada jogador vê todo o histórico) vs. informação imperfeita (sets de informação). Equilíbrio perfeito em subjogos (Selten): elimina equilíbrios com ameaças não-críveis — mais refinado que Nash.
- **Design de mecanismos (mechanism design)**: engenharia reversa de teoria dos jogos — dado o resultado desejado, projetar o jogo que o implementa como equilíbrio. Princípio da revelação: qualquer mecanismo pode ser convertido num mecanismo direto onde dizer a verdade é equilíbrio dominante. Teorema de Myerson-Satterthwaite: não existe mecanismo bilateral que seja eficiente, individual-racional e balanceado em orçamento para troca bilateral com tipos privados.
- **Leilões e preços de Vickrey**: leilão de segundo preço (Vickrey): cada agente declara lance, vencedor é o maior lance, paga o segundo maior. Resultado: dizer a valoração verdadeira é estratégia dominante (dominant strategy truthful). Generalização: VCG (Vickrey-Clarke-Groves) para bens múltiplos — o algoritmo que faz Google Ads funcionar.
- **Jogos repetidos e cooperação**: dilema do prisioneiro repetido: com horizonte infinito, é possível sustentar cooperação no equilíbrio via estratégias de punição ("tit-for-tat"). Folk theorem: qualquer resultado factível e individualmente racional pode ser sustentado como equilíbrio de Nash de longo prazo se os jogadores forem suficientemente pacientes (fator de desconto δ → 1).

## Confusões comuns

**"Equilíbrio de Nash é o resultado ótimo do jogo"**: Não. Equilíbrio de Nash é estável (ninguém tem incentivo para desviar unilateralmente), mas pode ser Pareto-inferior ao ótimo social. O dilema do prisioneiro é o exemplo clássico. Eficiência de equilíbrio (social welfare) é um campo separado — o "preço da anarquia" mede a perda de eficiência.

**"Todo jogo tem equilíbrio único"**: Não. Muitos jogos têm múltiplos equilíbrios. Coordination game (dirigir à direita ou à esquerda): dois equilíbrios em estratégias puras, um equilíbrio em mistas. A seleção de equilíbrio (qual equilíbrio jogarão agentes racionais?) é um problema em aberto.

**"Estratégias mistas são irracionais"**: Ao contrário — em jogos de soma zero, qualquer estratégia pura é explorável pelo adversário se ele descobrir o padrão. Randomização é necessária para segurança: poker sem bluff é trivialmente explorado.

**"Nash provou que equilíbrios são computáveis eficientemente"**: A existência de equilíbrio (por ponto fixo de Brouwer) não diz nada sobre computabilidade. Encontrar um equilíbrio de Nash de jogo geral é PPAD-completo (Daskalakis, Goldberg, Papadimitriou, 2006) — provavelmente não tem algoritmo polinomial.

**"Mecanismos de leilão de segundo preço revelam preferências verdadeiras"**: Apenas quando há um único item e licitantes com valorações independentes. Para múltiplos itens ou com complementaridades, VCG pode ter problemas: não-monotonicidade da receita, vulnerabilidade a coalizões, orçamento não-balanceado.

## Aplicação em CS/Dev/ML

**GANs como jogo de dois jogadores assimétrico**: o jogo é minimax — não simétrico. Discriminador D maximiza ℒ_D = E_x[log D(x)] + E_z[log(1 − D(G(z)))]; gerador G minimiza essa quantidade (ou variantes não-saturating). Em formulações modernas (Wasserstein GAN, hinge loss), os payoffs **não são exatamente opostos** (ℒ_G ≠ −ℒ_D), logo o jogo nem sempre é soma zero. O ponto de sela ideal tem G produzindo a distribuição real e D ficando indeciso (D ≡ ½). Mode collapse e instabilidade surgem porque o jogo é **não convexo-côncavo** (von Neumann minimax falha) e o gradiente conjunto pode divergir mesmo com pontos de sela existentes (Mescheder et al., ICML 2018).

**Multiagent RL**: aprender políticas ótimas em ambientes com múltiplos agentes é teoria dos jogos. Algoritmos como MADDPG, MAPPO tratam o problema como jogo estocástico de n-jogadores. Convergência para equilíbrio de Nash é garantida apenas em casos especiais (jogos de soma zero com dois jogadores).

**Algorithmic game theory em sistemas distribuídos**: roteamento de tráfego em redes é jogo onde cada pacote busca o caminho mais rápido. O paradoxo de Braess mostra que adicionar capacidade pode piorar o tempo de rota (equilíbrio de Nash piora). Design de protocolos que são "strategy-proof" (não incentivam comportamento estratégico) usa mecanismos.

**Leilões em advertising**: Google Ads e Meta Ads usam variantes de mecanismos de Vickrey. O anunciante declara seu bid; o sistema calcula o preço por clique baseado no segundo maior bid × quality score. Entender o mecanismo é essencial para otimizar campanhas.

**Teoria de jogos em segurança (security games)**: Stackelberg games modelam defensor vs. atacante. O defensor commita primeiro a uma estratégia de alocação de recursos; o atacante observa e ataca o ponto mais vulnerável. Utilizado para alocar segurança em aeroportos, portos e infraestrutura crítica (ARMOR system, LAUP).

## Como praticar

- **Livro base**: Osborne & Rubinstein — *A Course in Game Theory* (disponível online gratuitamente) — rigoroso e completo. Shoham & Leyton-Brown — *Multiagent Systems* (disponível online) — foco em CS e AI. Para mecanismos: Roughgarden — *Twenty Lectures on Algorithmic Game Theory* (Cambridge).
- **Calcular equilíbrios à mão**: para jogos 2×2 e 3×3, calcule os equilíbrios de Nash em estratégias puras e mistas pelo princípio de indiferença. Pratique com Battle of Sexes, Matching Pennies, Chicken, e Prisoner's Dilemma.
- **Implementar support enumeration**: para encontrar equilíbrios mistos em jogos finitos, implemente o método de enumeração de supports — para cada par de supports, resolver o sistema linear de indiferença.
- **Nashpy em Python**: biblioteca para cálculo de equilíbrios de Nash. `nashpy.Game(A, B).support_enumeration()` lista todos os equilíbrios.
- **Projeto**: implemente um torneio de dilema do prisioneiro iterado (à la Axelrod) com estratégias: always cooperate, always defect, tit-for-tat, grim trigger. Meça a pontuação média de longo prazo e verifique quais estratégias são evolutivamente estáveis.

## Exercícios práticos

1. **[Rank E]** Para o jogo com matriz de payoff (linha = jogador 1, coluna = jogador 2):
   - Cooperar/Cooperar: (3,3); Cooperar/Trair: (0,5); Trair/Cooperar: (5,0); Trair/Trair: (1,1).
   Encontre todos os equilíbrios de Nash em estratégias puras. Identifique se é o dilema do prisioneiro. *Dica: verificar cada perfil — se algum jogador lucra desviando, não é equilíbrio. Em (C,C): J1 desvia para T e ganha 5 > 3. Em (T,T): J1 em T ganha 1, desviaria para C e ganharia 0 < 1. Portanto (T,T) é o único equilíbrio de Nash.*

2. **[Rank D]** Para o jogo de Matching Pennies (soma zero, sem equilíbrio em estratégias puras):
   - Cara/Cara: (1,-1); Cara/Coroa: (-1,1); Coroa/Cara: (-1,1); Coroa/Coroa: (1,-1).
   Encontre o equilíbrio de Nash em estratégias mistas. Use o princípio de indiferença. *Dica: seja p a prob de J1 jogar Cara. Para J2 ser indiferente: p·(-1) + (1-p)·1 = p·1 + (1-p)·(-1), logo 1-2p = 2p-1, logo p = 1/2. Por simetria J2 também joga (1/2, 1/2). O valor do jogo é 0.*

3. **[Rank C]** Prove que o leilão de segundo preço (Vickrey) é estratégia-dominante-verdadeiro: para qualquer valoração v₁ de J1, sua estratégia dominante é declarar b₁ = v₁ (dizer a verdade), independentemente dos lances dos demais. *Dica: considere dois casos — J1 ganha ou J1 perde — e mostre que desviar de v₁ nunca aumenta a utilidade. Se J1 ganha com b₁ = v₁, paga o segundo preço p₂ ≤ v₁ e tem utilidade v₁ - p₂ ≥ 0. Declarar b₁ < v₁ pode perder o leilão quando b₁ < p₂ < v₁ — piora. Declarar b₁ > v₁ pode ganhar quando p₂ > v₁ — utilidade negativa.*

4. **[Rank B]** Prove o teorema minimax de von Neumann para jogos de soma zero: max_{σ₁} min_{σ₂} E[u₁(σ₁, σ₂)] = min_{σ₂} max_{σ₁} E[u₁(σ₁, σ₂)] (onde o max e min são sobre estratégias mistas). Use que o problema de otimização resultante é um programa linear e a dualidade forte de LP. *Dica: escreva max_{p∈Δₘ} min_{j=1,…,n} (Ap)_j como LP: max v sujeito a Ap ≥ v·1, 1ᵀp=1, p≥0. O dual é min_{q∈Δₙ} max_{i=1,…,m} (Aᵀq)_i. Pela dualidade forte de LP, os valores ótimos coincidem.*

5. **[Rank A] [BOSS]** Prove a existência de equilíbrio de Nash para jogos finitos usando o ponto fixo de Brouwer: defina o mapa de melhor resposta best-response(σ) = ×ᵢ BR_i(σ₋ᵢ), mostre que é upper-hemicontinuous com valores convexos e não-vazios, e aplique o teorema do ponto fixo de Kakutani (generalização de Brouwer para correspondências). Conclua que todo jogo finito em estratégias mistas tem equilíbrio de Nash. *Dica: o espaço Δ = ×ᵢ Δ(Aᵢ) de perfis de estratégias mistas é compacto e convexo (produto de simplexes). BR_i(σ₋ᵢ) = arg max_{σᵢ} Eσ[uᵢ] é convexo (por linearidade em σᵢ) e não-vazio (max de linear em compacto). A upper-hemicontinuity segue da continuidade das funções de utilidade. Por Kakutani, existe σ* com σ* ∈ BR(σ*) — que é exatamente a definição de equilíbrio de Nash.*

## Próximos passos

- [probabilidade](probabilidade) — estratégias mistas são distribuições de probabilidade
- [otimizacao-pesquisa-op](otimizacao-pesquisa-op) — dualidade LP e programação convexa em equilíbrios
- [processos-estocasticos](processos-estocasticos) — jogos estocásticos e MDP com múltiplos agentes
- [analise-combinatoria](analise-combinatoria) — contagem de perfis e tipos de estratégias
- → Pratique no /math-quest na área **Aplicada/Discreta** (Rank C+)
