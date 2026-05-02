---
title: "Incident Response Playbook para desenvolvedores"
category: "auth"
stack: ["Node.js", "TypeScript", "AWS", "GitHub", "Slack"]
tags: ["incident-response", "breach", "token-leak", "post-mortem", "runbook", "segurança"]
excerpt: "Runbook de token vazado, breach containment checklist, como preservar evidências, comunicação de stakeholders e post-mortem estruturado."
---

## Visão Geral

Resposta a incidente não é para sênior de segurança — todo dev em produção vai lidar com isso. A diferença entre um incidente bem gerenciado e um que destrói a reputação da empresa é normalmente quanto tempo se levou para agir e com que qualidade.

Os três pecados capitais de IR que devs cometem:
1. Entrar em pânico e começar a mudar coisas sem registrar o que foi feito
2. Comunicar antes de entender o escopo (cria caos)
3. Não preservar evidências — impossibilita post-mortem e pode ser ilegal em alguns setores

O modelo mental: **Detectar → Conter → Erradicar → Recuperar → Aprender**

---

## Quando usar

Este playbook se aplica a:
- Token/API key vazado (em repositório, log, e-mail, Slack)
- Credenciais comprometidas (banco de dados, AWS, terceiros)
- Acesso não autorizado detectado (endpoint admin, dados de outro tenant)
- Vulnerabilidade crítica descoberta em produção
- Suspeita de exfiltração de dados

---

## Trade-offs

**Velocidade vs completude na comunicação:**
- Comunicar antes de entender o escopo parece transparente mas cria ruído e pode acionar alertas regulatórios prematuros.
- Esperar muito para comunicar pode agravar o dano.
- Regra prática: comunicar internamente imediatamente, comunicar usuários quando o escopo estiver mapeado.

**Revogar vs monitorar:**
- Revogar imediatamente elimina o vetor mas alerta o atacante e perde logs de atividade.
- Monitorar primeiro permite mapear o escopo mas mantém o risco ativo.
- Em maioria dos casos: revogar imediatamente, depois investigar logs históricos.

---

## Implementação

### Runbook 1 — Token/API Key vazado

```
INCIDENTE: Chave de API ou token encontrado em lugar não autorizado
(repositório público, Slack, e-mail, log de erro)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 1 — DETECÇÃO (0-5 minutos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Identificar o tipo de token: qual serviço? (AWS, Stripe, DB, internal)
[ ] Determinar quando foi exposto (git log, data do commit/mensagem)
[ ] Copiar evidência (URL, screenshot, hash do commit) — NÃO MODIFICAR AINDA
[ ] Notificar o canal de segurança (#security-incidents no Slack)
[ ] Atribuir Incident Commander (IC) — quem toma decisões finais

REGISTRO OBRIGATÓRIO (colocar no ticket de incidente):
  - Data/hora da descoberta: _______________
  - Quem descobriu: _______________
  - Token/tipo: _______________ (não logar o valor completo)
  - Onde foi encontrado: _______________
  - Estimativa de exposição desde: _______________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2 — CONTENÇÃO IMEDIATA (5-15 minutos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] REVOGAR o token comprometido IMEDIATAMENTE
    - AWS: IAM → Access Keys → Delete
    - Stripe: Dashboard → Developers → API Keys → Roll
    - GitHub: Settings → Developer settings → Tokens → Delete
    - DB: ALTER USER <user> WITH PASSWORD '<new>'; ou revogar role
    - Internal: Secrets Manager → rotate / disable

[ ] Gerar novo token com escopo mínimo necessário
[ ] Atualizar secret no ambiente (Secrets Manager/Vault) — NÃO no código
[ ] Deploy de emergência se a aplicação depende do token

[ ] Se token estava em repositório público:
    - Remover o commit do histórico com git filter-repo (NÃO git rebase)
    - Force-push na branch (com aprovação do IC)
    - Notificar o GitHub se for organização: Settings → Security

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3 — ANÁLISE DE ESCOPO (15-60 minutos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] Verificar logs de uso do token comprometido no período de exposição
    - AWS CloudTrail: filtrar por access key ID
    - Stripe: Dashboard → Logs → filtrar por API key
    - Aplicação: grep nos logs pelo prefixo do token

[ ] Identificar ações realizadas com o token:
    - Quais recursos foram acessados?
    - Houve criação de novos recursos (usuários, chaves, webhooks)?
    - Houve exfiltração de dados?

[ ] Verificar se o atacante criou backdoors:
    - Novos usuários IAM ou access keys criados
    - Novos webhooks cadastrados
    - Novas permissões adicionadas a roles
    - Cron jobs ou lambdas criados

[ ] Determinar dados afetados:
    - Quais dados eram acessíveis com esse token?
    - Há obrigação legal de notificação? (LGPD: dados pessoais afetados)
```

### Runbook 2 — Breach de dados / Acesso não autorizado

```
INCIDENTE: Acesso suspeito detectado, dados potencialmente exfiltrados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECKLIST DE CONTENÇÃO IMEDIATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRESERVAÇÃO DE EVIDÊNCIAS (antes de qualquer mudança):
[ ] Exportar logs relevantes do período para storage imutável (S3 com Object Lock)
[ ] Screenshot ou export de queries suspeitas no banco
[ ] Capturar estado atual: ips conectados, processos rodando, conexões ativas

ISOLAMENTO:
[ ] Bloquear IP suspeito no WAF/Security Group
[ ] Revogar sessões do usuário comprometido: invalidar todos os tokens/sessões
[ ] Se conta de serviço: revogar credenciais e investigar qual serviço usa

VERIFICAÇÃO DE INTEGRIDADE:
[ ] Os dados no banco correspondem ao esperado? (checksums, contagens)
[ ] Há registros criados/modificados/deletados no período suspeito?
[ ] Há exfiltração evidenciada nos logs (respostas grandes, exports incomuns)?
```

### Scripts de investigação

```typescript
// Verificar logins e ações suspeitas no período
// scripts/investigate-incident.ts

import { db } from '../src/lib/db';
import { format } from 'date-fns';

const INCIDENT_START = new Date('2026-05-02T10:00:00Z');
const INCIDENT_END = new Date('2026-05-02T14:00:00Z');

async function investigateAuthLogs() {
  // Logins no período
  const logins = await db.query(`
    SELECT
      u.email,
      al.ip_address,
      al.user_agent,
      al.event,
      al.metadata,
      al.created_at
    FROM audit_logs al
    JOIN users u ON u.id = al.user_id
    WHERE al.event IN ('auth.login.success', 'auth.login.failure')
      AND al.created_at BETWEEN $1 AND $2
    ORDER BY al.created_at DESC
  `, [INCIDENT_START, INCIDENT_END]);

  console.log('=== LOGINS NO PERÍODO ===');
  console.table(logins.rows);

  // Ações em dados sensíveis
  const sensitiveActions = await db.query(`
    SELECT
      resource_type,
      resource_id,
      action,
      user_id,
      ip_address,
      created_at
    FROM audit_logs
    WHERE resource_type IN ('invoice', 'customer', 'payment', 'user')
      AND action IN ('read', 'export', 'delete', 'update')
      AND created_at BETWEEN $1 AND $2
    ORDER BY created_at DESC
    LIMIT 500
  `, [INCIDENT_START, INCIDENT_END]);

  console.log('\n=== AÇÕES EM DADOS SENSÍVEIS ===');
  console.table(sensitiveActions.rows);
}

// Verificar registros modificados
async function checkDataIntegrity(tableName: string) {
  const modified = await db.query(`
    SELECT *
    FROM ${tableName}
    WHERE updated_at BETWEEN $1 AND $2
    ORDER BY updated_at DESC
  `, [INCIDENT_START, INCIDENT_END]);

  console.log(`\n=== REGISTROS MODIFICADOS: ${tableName} ===`);
  console.log(`Total: ${modified.rowCount}`);
  console.table(modified.rows.slice(0, 20));
}
```

### Preservação de evidências

```bash
#!/bin/bash
# scripts/preserve-evidence.sh
# Executar ANTES de qualquer mudança no sistema

INCIDENT_ID="INC-2026-0502-001"
EVIDENCE_DIR="/tmp/evidence-${INCIDENT_ID}"
S3_BUCKET="s3://incident-evidence/$(date +%Y%m%d)"

mkdir -p "${EVIDENCE_DIR}"

# 1. Logs de aplicação no período
echo "Exportando logs de aplicação..."
docker logs myapp --since "2026-05-02T10:00:00" --until "2026-05-02T14:00:00" \
  > "${EVIDENCE_DIR}/app-logs.txt" 2>&1

# 2. Logs de nginx/load balancer
echo "Exportando access logs..."
grep "2026:1[0-3]:" /var/log/nginx/access.log \
  > "${EVIDENCE_DIR}/nginx-access.txt"

# 3. Conexões ativas no banco
echo "Capturando conexões ativas..."
psql "${DATABASE_URL}" -c "
  SELECT pid, usename, application_name, client_addr, state, query_start, query
  FROM pg_stat_activity
  WHERE state != 'idle'
" > "${EVIDENCE_DIR}/db-connections.txt"

# 4. Hash dos arquivos para verificação de integridade
sha256sum "${EVIDENCE_DIR}"/* > "${EVIDENCE_DIR}/checksums.sha256"

# 5. Upload para storage imutável
aws s3 cp "${EVIDENCE_DIR}/" "${S3_BUCKET}/${INCIDENT_ID}/" --recursive \
  --storage-class GLACIER_IR

echo "Evidências preservadas em ${S3_BUCKET}/${INCIDENT_ID}/"
echo "Checksums: ${EVIDENCE_DIR}/checksums.sha256"
```

### Comunicação — templates

```
COMUNICAÇÃO INTERNA (Slack #security-incidents, imediato)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 INCIDENTE ABERTO — INC-2026-0502-001

Tipo: [Token vazado / Acesso não autorizado / Vulnerability]
Detectado: 2026-05-02 14:23 UTC
Incident Commander: @nome
Status: Investigando / Contido / Recuperado

O que sabemos:
- [fato 1]
- [fato 2]

O que NÃO sabemos ainda:
- [questão aberta 1]

Próxima atualização: 15:00 UTC
Ticket: https://linear.app/myteam/INC-001
```

```
COMUNICAÇÃO PARA USUÁRIOS AFETADOS (após escopo mapeado)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Assunto: Comunicado de segurança importante

Detectamos um acesso não autorizado em [data]. Tomamos as seguintes ações imediatas:
- [ação 1]
- [ação 2]

Com base em nossa investigação, [seus dados / não encontramos evidências de que seus dados]
foram afetados. Especificamente: [descrever o que foi ou não afetado].

O que você deve fazer:
- Redefinir sua senha (link)
- Verificar atividades recentes na sua conta
- [ação específica se necessário]

Continuamos investigando e atualizaremos este comunicado à medida que tivermos mais informações.

[Nome] — [Cargo]
[Empresa]
```

### Post-mortem estruturado

```markdown
# Post-Mortem: INC-2026-0502-001
**Severidade:** P1 / P2 / P3
**Data:** 2026-05-02
**Duração:** 2h17m (14:23 → 16:40 UTC)
**IC:** Nome

## Resumo executivo (3 linhas máximo)
Token de API do Stripe foi commitado por acidente em pull request no GitHub.
Detectado por alerta do Gitleaks. Revogado em 8 minutos, novo token em produção em 23 minutos.
Nenhum uso malicioso identificado nos logs do período de exposição (47 minutos).

## Timeline
| Horário | Evento |
|---|---|
| 13:36 | Commit com token no PR #142 |
| 14:23 | Gitleaks alert no CI disparado |
| 14:31 | Token revogado no dashboard Stripe |
| 14:44 | Novo token em produção |
| 15:30 | Investigação de logs concluída |
| 16:40 | Incidente encerrado |

## Root Cause
O desenvolvedor copiou o arquivo `.env.local` para testar localmente e
inadvertidamente incluiu o arquivo num commit. O `.env.local` estava no
`.gitignore` mas a pasta `config/` onde foi copiado, não.

## Contributing factors
- Não havia pre-commit hook para detectar secrets
- Review do PR não identificou o arquivo de configuração

## O que funcionou bem
- Gitleaks no CI detectou em < 1 hora
- Runbook estava documentado — rotação foi rápida
- Comunicação interna foi clara e sem pânico

## O que não funcionou
- Detecção dependeu do CI rodar (levou 47 min desde o commit)
- Não havia proteção na máquina do desenvolvedor

## Action items
| Ação | Responsável | Prazo |
|---|---|---|
| Adicionar Gitleaks como pre-commit hook em todos os repos | @dev-infra | 2026-05-09 |
| Treinar time sobre gestão de secrets (.env.local guidelines) | @tech-lead | 2026-05-16 |
| Adicionar .gitignore rule para pasta config/ | @dev | 2026-05-05 |
| Configurar alerta Stripe para uso em IPs novos | @security | 2026-05-12 |

## Métricas
- MTTD (Mean Time to Detect): 47 min
- MTTC (Mean Time to Contain): 8 min após detecção
- MTTR (Mean Time to Recover): 23 min após detecção
```

---

## Armadilhas

- **Deletar logs durante investigação**: nunca delete nada antes de preservar. Logs são evidência — em LGPD, apagar pode ser obstruction.
- **Comunicar aos usuários antes de mapear o escopo**: "possível vazamento de dados" sem especificar o quê cria pânico desnecessário e pode acionar obrigações legais prematuramente.
- **Não documentar o que foi feito durante a resposta**: sem timeline de ações, o post-mortem é impossível e você não sabe se a contenção foi completa.
- **Revogar e achar que está feito**: verificar se o atacante criou backdoors (novos usuários, novas chaves, webhooks) é obrigatório.
- **Post-mortem como sessão de culpa**: post-mortem é sobre sistemas, não pessoas. "O desenvolvedor commitou o token" é fato; "o desenvolvedor foi descuidado" é julgamento que mata a cultura de segurança.
- **Não testar o playbook**: runbook que nunca foi executado vai falhar no momento crítico. Faça simulações (game days) trimestrais.

---

## Referências

- [Google SRE — Managing Incidents](https://sre.google/sre-book/managing-incidents/)
- [NIST SP 800-61 — Computer Security Incident Handling Guide](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf)
- [PagerDuty Incident Response Docs](https://response.pagerduty.com/)
- [Gitleaks — Detecção de secrets](https://github.com/gitleaks/gitleaks)
- [LGPD — Notificação de incidentes (ANPD)](https://www.gov.br/anpd/pt-br)
