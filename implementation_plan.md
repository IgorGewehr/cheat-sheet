# Gamificação Avançada e Expansão de Cibersegurança

Este plano visa implementar as novas mecânicas de retenção de usuários (Missões Diárias e Decaimento de Habilidades) e expandir massivamente o conteúdo técnico focado em Cibersegurança na era da IA e monitoramento moderno.

## User Review Required

> [!WARNING]
> **Penalidade por Inatividade (Decay):** Você concorda que as habilidades do Radar comecem a "enferrujar" (perder pontuação percentual) se o usuário ficar mais de 30 dias sem registrar uma Adoção, Decisão ou progresso de Estudo naquela área específica?

## Proposed Changes

### 1. Skill Decay (A Ameaça da Inatividade)
Para forçar a manutenção do conhecimento e prestação de contas, o radar sofrerá deterioração nas habilidades não praticadas.

#### [MODIFY] [components/radar-chart.tsx](file:///Users/igorgewehr/air/brain/src/components/radar-chart.tsx)
- No `computeRadarAxes`, checaremos a data da última ação (`TrilhaProgresso.date`, `Adocao.dataDecisao` e `Decisao.data`) relacionada a cada eixo.
- Se a última ação tiver mais de 30 dias, aplicaremos uma penalidade (ex: -10% na nota do eixo).
- **Feedback Visual:** Se a skill estiver decaindo, exibiremos um ícone (🔥 apagando ou ⚠️) ao lado do rótulo do Radar para induzir o usuário a estudar aquele tema urgente.

### 2. Daily Quests (Missões Diárias de Baixa Fricção)
Para engajar o usuário logo que ele entra, sem exigir que ele faça fluxos longos.

#### [MODIFY] [app/dashboard-stats.tsx](file:///Users/igorgewehr/air/brain/src/app/dashboard-stats.tsx)
- Criar um widget de **"Daily Quests"** no topo. 
- O sistema sorteará dinamicamente 1 a 3 missões simples por dia baseadas no estado do usuário. Exemplo: *"Você está perdendo nível em Backend. Revise 1 card dessa categoria hoje para recuperar o XP."* ou *"Você tem 3 dívidas técnicas, resolva 1 hoje."*
- Concluir a Quest renderá Work XP.

### 3. Expansão de Conteúdo (Auth, Sec & AI)
Criar cards técnicos aprofundados sobre a arquitetura e segurança na era da IA, tornando o app um arsenal obrigatório para DevSecOps e Arquitetos.

#### [NEW] [src/content/auth/ai-prompt-injection.md](file:///Users/igorgewehr/air/brain/src/content/auth/ai-prompt-injection.md)
- Card sobre mitigação de Prompt Injection, Jailbreaks e Data Exfiltration via LLMs.
#### [NEW] [src/content/auth/zero-trust-architecture.md](file:///Users/igorgewehr/air/brain/src/content/auth/zero-trust-architecture.md)
- Card detalhando o conceito de Zero Trust e como implementar a nível de rede, IAM e microsserviços.
#### [NEW] [src/content/auth/modern-monitoring-sec.md](file:///Users/igorgewehr/air/brain/src/content/auth/modern-monitoring-sec.md)
- Card sobre Observabilidade Orientada à Segurança (SIEM, CSPM, Logs auditáveis e detecção de anomalias com IA).
#### [NEW] [src/content/auth/oauth-2-1.md](file:///Users/igorgewehr/air/brain/src/content/auth/oauth-2-1.md)
- Card consolidando as melhores práticas do OAuth 2.1 (rejeitando Implicit Flow, exigindo PKCE, etc).

## Verification Plan
1. Alterar a data simulada de algumas `Adocoes` no Firestore (ou hardcodar no teste) para mais de 30 dias atrás e confirmar se o radar avisa sobre o "decay".
2. Validar o surgimento do Card de Daily Quests no Dashboard e sua lógica condicional.
3. Checar a Biblioteca para garantir que os 4 novos cards de Cibersegurança estão disponíveis para estudo e vinculados ao eixo "Auth & Sec".
