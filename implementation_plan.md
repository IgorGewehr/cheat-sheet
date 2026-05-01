# Melhorias de Gamificação e Sistema de Ranking

Este plano propõe uma evolução profunda na gamificação do app "brain", dividida em duas fases: (1) Melhoria da Gamificação Individual (destacando skills/módulos de forma elegante) e (2) Criação do Sistema de Ranking (Leaderboard).

## User Review Required

> [!IMPORTANT]  
> **Escopo do Ranking:** Atualmente os dados são salvos em coleções por `workspaceId` no Firestore. Para um ranking competitivo, precisaremos de uma coleção global (ex: `publicProfiles` ou `leaderboard`) que sincronize o XP e nível de todos os usuários. Você concorda com essa abordagem de ter uma coleção pública de perfis?
> 
> **Novas Collections no Firebase:** Será necessário adicionar regras no `firestore.rules` para a nova coleção do Leaderboard. 

## Proposed Changes

### 1. Gamificação Individual (Evolução do Radar de Habilidades)

Conforme seu feedback, em vez de criar *badges* que podem ser ignoradas, vamos transformar o **Radar de Habilidades** existente no centro das atenções da evolução individual. Ele será refeito para ter um visual extremamente premium, dinâmico e profissional.

#### [MODIFY] [components/radar-chart.tsx](file:///Users/igorgewehr/air/brain/src/components/radar-chart.tsx)
- Reescrever o SVG do Radar para utilizar gradientes suaves (ex: fundo com opacidade que se intensifica nas pontas), linhas de grade refinadas (glassmorphism ou neon sutil) e animações de preenchimento ao carregar.
- Adicionar tooltips interativos no hover sobre os eixos (mostrando o progresso exato e os próximos passos para subir aquela skill).
- Otimizar a tipografia e os ícones para dar uma cara mais "Pro" e menos "dashboard genérico".

#### [MODIFY] [dashboard-stats.tsx](file:///Users/igorgewehr/air/brain/src/app/dashboard-stats.tsx)
- Redesenhar a seção do "Radar de Habilidades" para dar mais destaque a ele, fazendo com que a progressão nos módulos (Data Science, Agentes IA, Dev) seja o grande troféu visual do usuário.
- **Modo Estudo:** O radar será a estrela principal. Vamos adicionar feedbacks de "Level Up" por eixo (ex: quando o eixo "Agentes IA" passa de 20% para 50%).
- **Modo Trabalho:** Melhorar a comemoração da Meta Diária (Work XP), adicionando uma animação mais premium e responsiva quando `workGoalMet` for atingido.

---

### 2. Sistema de Ranking e Competitividade

Para tornar o app competitivo, vamos criar uma nova aba no menu principal para o Ranking e sincronizar o progresso do usuário no Firebase globalmente.

#### [MODIFY] [db.ts](file:///Users/igorgewehr/air/brain/src/lib/db.ts)
- Adicionar funções de sync: `syncPublicProfile(xp, level, badges)`.
- Adicionar função `listLeaderboard()` para buscar os top usuários de uma coleção global `publicProfiles`.

#### [NEW] [app/ranking/page.tsx](file:///Users/igorgewehr/air/brain/src/app/ranking/page.tsx)
- Criação da página do **Leaderboard Global**.
- Exibição de Tiers competitivos (Bronze, Prata, Ouro, Mestre).
- Os usuários serão listados por XP total ou XP da semana, exibindo também a principal badge de especialidade que eles conquistaram.

#### [MODIFY] [components/sidebar.tsx](file:///Users/igorgewehr/air/brain/src/components/sidebar.tsx) ou Navigation
- Adicionar o link para o "Ranking Global" com um ícone de troféu (`Trophy`), destacando a posição atual do usuário.

## Verification Plan

### Manual Verification
1. Acessar o Dashboard no modo Estudo e verificar se as novas **Skill Badges** aparecem e calculam o nível (Bronze/Ouro/etc) corretamente baseado no progresso da trilha.
2. Atingir a meta diária no Modo Trabalho e validar a nova animação de recompensa.
3. Acessar a nova rota `/ranking` e garantir que o quadro de líderes está listando os perfis corretamente, aplicando o design visual competitivo proposto.
4. Validar se a atualização do XP atualiza o rank em tempo real ou no recarregamento.
