---
title: "Checkpoint Tier 2: CloudGoat + HTB AD Pro Lab"
category: checklists
stack: [CloudGoat, HTB, Active Directory, AWS, CICD-Goat]
tags: [checkpoint, labs, cloudgoat, htb, ad-pentest]
excerpt: Validação do Tier 2 — CloudGoat (AWS), HTB AD Pro Lab e CICD-Goat com writeup técnico. Critério pra avançar pra Red Team.
related: [sec-aws-pentest, sec-k8s-container-pentest, sec-ad-network-pentest, sec-supply-chain-attacks]
updated: "2026-05-10"
---

## Objetivo

Demonstrar capacidade de realizar pentest em ambiente empresarial real (não apenas web). Cobre 3 superfícies que aparecem em consultoria de verdade: AWS cloud, AD on-prem, supply chain CI/CD.

## Critério de aprovação

- **3 cenários CloudGoat** completados (escolha entre vários).
- **1 HTB Pro Lab AD** completo (Dante, Offshore, ou Cybernetics).
- **CICD-Goat** completo (10+ escapes).
- **3 writeups técnicos** estilo cliente (executivo + detalhe técnico) submetidos via `/sentinela`.
- **Bonus**: 1 escape de container (KubernetesGoat ou TryHackMe K8s room).

## Tempo estimado: 60-100h (8-12 semanas a 1h/dia)

## Setup

### CloudGoat (AWS vulnerable scenarios)

```bash
# Pré-requisito: conta AWS própria (free tier OK) + CLI configurado
# Custos: <$5 USD por cenário se destruído imediatamente após

git clone https://github.com/RhinoSecurityLabs/cloudgoat.git
cd cloudgoat
pip install -r ./core/python/requirements.txt
chmod +x cloudgoat.py

# Setup primeiro
./cloudgoat.py config aws
./cloudgoat.py config whitelist --auto

# Deploy scenario
./cloudgoat.py create iam_privesc_by_attachment

# Cleanup
./cloudgoat.py destroy iam_privesc_by_attachment
```

### HTB Pro Labs

```bash
# Conta HTB Academy / Pro Labs
# Custo: ~$20-30/mês durante engagement (~3 meses)
# Pro Labs recomendados (do mais fácil pro mais difícil):
# 1. Dante — Linux focused, beginner
# 2. RastaLabs — Windows AD intermediate
# 3. Offshore — AD enterprise simulation
# 4. Cybernetics — multi-platform advanced
# 5. APTLabs — APT-style ops
```

### CICD-Goat

```bash
git clone https://github.com/cider-security-research/cicd-goat.git
cd cicd-goat
docker-compose up
# Acessa Jenkins, GitLab, GitHub Actions simulados em http://localhost
# 10 desafios cobrindo poisoning, secrets exfil, branch protection bypass
```

## Cenários CloudGoat — 3 obrigatórios

Escolha 3, recomendados:

### 1. iam_privesc_by_attachment

Você ganha credentials de um IAM user limitado. Objetivo: escalar pra admin via attached policies. Cobre:
- IAM policy enumeration.
- Attach managed policy AdministratorAccess.

### 2. ec2_ssrf

EC2 metadata SSRF clássico. Cobre:
- Encontrar SSRF em web app.
- Acessar IMDSv1.
- Usar credenciais roubadas pra escalation.

### 3. cloud_breach_s3

Cenário de external attacker:
- Encontrar bucket S3 publicamente listável.
- Achar credenciais em arquivos.
- Escalation via IAM.

### Outros relevantes (escolha mais um se quiser)

- **rce_web_app** — RCE básico em app, depois pivot.
- **codebuild_secrets** — secrets em CodeBuild project.
- **iam_privesc_by_rollback** — IAM policy version rollback abuse.
- **vulnerable_lambda** — Lambda code injection.
- **cicd** — CodePipeline com permissions over-privileged.
- **detection_evasion** — completar cenário sem deixar CloudTrail trail.

## Template de writeup — CloudGoat

```markdown
# CloudGoat — [Scenario Name]

## Cenário (resumo do contexto fornecido)
[Descrição do início — quais credenciais, escopo, "objetivo do red team"]

## Recon
- [Comandos aws cli usados]
- [Permissões enumeradas]
- [Pacu modules executados]

## Path de exploração
1. Descobri que user X tem permissão Y.
2. Tentativa fail: Z (e por quê — incluir output).
3. Path bem-sucedido: A → B → C.
4. Achei AdministratorAccess.

## Comandos exatos
\`\`\`bash
aws iam list-attached-user-policies --user-name <user>
aws iam attach-user-policy --user-name <user> --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws sts get-caller-identity   # confirma escalation
\`\`\`

## Root cause
- Política inline tinha `iam:AttachUserPolicy` sem condição.
- Best practice violated: principle of least privilege.

## Remediation
1. Aplicar Service Control Policy (SCP) no organization bloqueando attach de AdministratorAccess.
2. Habilitar IAM Access Analyzer.
3. Implementar Permission Boundary em IAM users.

## Impacto de negócio
Comprometimento total da conta AWS — acesso a TODOS os recursos, secrets, dados de cliente.

## CVSS 4.0
CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H → 10.0 Critical

## Detection — o que o cliente veria
CloudTrail `AttachUserPolicy` event com TargetUser ≠ típico admin.
GuardDuty `IAMUser/AnomalousBehavior.SuccessfulAuthentication`.
Mitigação: alerta em PolicyAttach com policy contendo "Admin*".
```

## HTB Pro Lab — critério de completude

Para ser considerado completo:

- [ ] **Todas as flags** capturadas (não apenas user/root, ALL flags do Pro Lab).
- [ ] **Network map** desenhado (Excalidraw/draw.io) mostrando hosts comprometidos + paths.
- [ ] **Lista de credenciais** coletadas + onde encontrou + onde usou.
- [ ] **Timeline de attack chain** com timestamps.
- [ ] **Relatório executivo** de 1-2 páginas estilo "deliverable pra cliente".

## CICD-Goat — 10 desafios mínimos

CICD-Goat tem ~50 desafios. Mínimo 10 pra checkpoint, distribuídos:

- **Repository poisoning** (3): poison via PR, branch protection bypass, force push.
- **Pipeline-Based Access Control** (2): exec arbitrário via PR malicioso.
- **Credentials disclosure** (2): secrets em logs, env vars em CI.
- **Supply chain attack** (2): malicious dependency, hijacked maintainer.
- **Insufficient logging** (1): atacar sem deixar trace claro.

## Como submeter pro /sentinela

Estrutura:

```
tier2-checkpoint/
├── cloudgoat/
│   ├── scenario1-iam-privesc-by-attachment.md
│   ├── scenario2-ec2-ssrf.md
│   └── scenario3-cloud-breach-s3.md
├── htb-prolab-dante/
│   ├── executive-summary.md
│   ├── technical-report.md
│   ├── network-map.png
│   ├── timeline.csv
│   └── flags.txt
└── cicd-goat/
    └── 10-challenges.md
```

Acessar `/sentinela` e submeter pra revisão. Critérios:

- Reprodução técnica completa e correta?
- Root cause vs sintoma identificados separadamente?
- Remediation prioritizada (não apenas listada)?
- Linguagem profissional (cliente entende)?
- Impacto de negócio explícito?
- Detection / monitoramento sugerido?

## Bonus — KubernetesGoat (recomendado)

```bash
git clone https://github.com/madhuakula/kubernetes-goat
cd kubernetes-goat
bash setup-kubernetes-goat.sh
# Acesso: http://localhost:1230

# Cenários:
# - Sensitive keys in Code
# - DIND with Container Escape
# - SSRF in K8s World
# - Container Escape to Host
# - Docker in Docker exploitation
# - Helm v2 Tiller priv esc
# - Hidden in Layers
# - RBAC Least Privilege Misconfig
# - KubeAudit secrets
# - Falco rules bypass
```

Se completar 8+ cenários, **bonus** anexado ao checkpoint — sinaliza pra Tier 3 que K8s+container está sólido.

## Realismo — limitações dos labs

Esses labs ensinam mecânica. O que **não ensinam**:

- **Scoping conversation** com cliente (Tier 5).
- **Limitações de tempo** (engagement é 1-2 semanas, lab você roda o tempo que quiser).
- **OPSEC adversária** — em lab não tem EDR. Em prod tem.
- **Compliance** (PCI, HIPAA) impondo regras especiais.
- **Internal politics** — qual finding o cliente quer ver primeiro, como vender pra leadership.

Tiers 3-5 cobrem o que falta.

## Próximo passo

Após /sentinela retornar **PASS** no Tier 2, abre Tier 3 (Red Team & Adversary Simulation) — onde você aprende OPSEC, C2 frameworks modernos, e o cenário de "atacante sofisticado em ambiente monitorado".

## Recursos paralelos

- **TCM Security** (TheCyberMentor) — cursos práticos AD pentest.
- **HackTheBox Academy** — paths AD, AWS, Web.
- **TryHackMe** — rooms gratuitos pra iniciantes.
- **Antisyphon Training** (Black Hills InfoSec) — pay-what-you-can.
- **Pentester Academy** — Bootcamp AD.
