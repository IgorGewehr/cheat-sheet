---
title: Threat Modeling 2026 — STRIDE, PASTA, AI-Assisted
category: auth
stack: [STRIDE, PASTA, attack trees, threat modeling]
tags: [threat-modeling, stride, pasta, appsec, design-review]
excerpt: Threat modeling pra software moderno (microservices, AI, cloud) com STRIDE + LLM-assisted, attack trees, abuser stories, dataflow.
related: [sec-secure-code-review-playbook, sec-owasp-top10-2025, sec-llm-redteam-2026]
updated: "2026-05-10"
---

## Por que isso é o core do AppSec

Threat modeling é a única atividade de AppSec que **escala**. Code review encontra bugs específicos. Threat modeling encontra **classes inteiras** de bugs ao desenhar contra ataque desde início.

Em consultoria 2026, threat modeling é serviço alto-margem porque:
- Cliente "moderno" tem CI/CD + scanning automatizado mas falta arquitetura defensável.
- Decisões de design são caras pra reverter — model up-front previne refactor.
- Output (data flow + threat catalog + decisions log) é deliverable claro.

## STRIDE — framework canônico

Microsoft's STRIDE mapeia ameaças a propriedades de segurança:

| Threat | Propriedade quebrada | Exemplo |
|--------|---------------------|---------|
| **S**poofing | Authentication | Atacante finge ser user X |
| **T**ampering | Integrity | Modificar dado em trânsito ou repouso |
| **R**epudiation | Non-repudiation | User nega ter feito ação |
| **I**nformation Disclosure | Confidentiality | Vazar dado sensível |
| **D**enial of Service | Availability | Esgotar recurso, derrubar serviço |
| **E**levation of Privilege | Authorization | User ganha permissão indevida |

Para cada elemento (component, data store, dataflow), pergunte: pode haver S? T? R? I? D? E? Documenta.

## Processo (8 passos pragmáticos)

### 1. Defina escopo

- Sistema novo ou alteração específica?
- Boundary: o que está in-scope vs out-of-scope?
- Trust boundaries: onde dados cruzam entre níveis de confiança?

### 2. Desenhe o sistema (DFD — Data Flow Diagram)

Use 4 símbolos:

```
[Process]          ← componente que executa (app, service, lambda)
{Data store}       ← persistência (DB, queue, cache, S3)
(External entity)  ← user, partner, vendor
─────────────►     ← data flow direction
═══════════════    ← trust boundary crossing
```

Exemplo:
```
(User Browser) ═════►[Web App: Next.js]──►{PostgreSQL}
                        │                    
                        ▼                    
                   [Auth Service]─►{Redis sessions}
                        │
                        ▼
                  (External: Stripe API)
```

Trust boundaries: user → web app, web app → external API, web app → DB.

### 3. Identifique threats em cada elemento

Vá item por item:

**[Web App: Next.js]:**
- S: Tampering com session cookie → spoofing.
- T: Tampering com request body → mass assignment.
- R: User executa ação sem log → repudiation.
- I: Error stack revela paths → info disclosure.
- D: Heavy endpoint sem rate limit → DoS.
- E: Authorization fraco em endpoint admin → privilege escalation.

**{PostgreSQL}:**
- T: SQL injection altera dado.
- I: Backup mal protegido vaza schema + dados.
- D: Heavy query sem timeout.
- E: DB user com permissões além do necessário.

[continua pra cada componente e dataflow]

### 4. Categorize por risco

Use DREAD (legado, mas útil) ou CVSS 4.0:

| Aspect | 1-3 | 4-7 | 8-10 |
|--------|-----|-----|------|
| Damage | Minor | Significant | Severe |
| Reproducibility | Hard | Conditional | Easy |
| Exploitability | Skilled | Average | Anyone |
| Affected users | Few | Many | All |
| Discoverability | Hidden | Public | Obvious |

### 5. Decida mitigation

Para cada threat:
- **Mitigate** — adicione control (input validation, MFA, rate limit).
- **Eliminate** — remova componente/feature.
- **Transfer** — outsource (Stripe handles PCI).
- **Accept** — risco menor que custo de mitigar.

Documente decisão em **ADR** (Architecture Decision Record) — explicado em outro card.

### 6. Validate

- Senior architect review.
- Pentest específico das mitigations.
- Tabletop: "imagine atacante hábil — consegue achar bypass?"

### 7. Iterate

Threat model é vivo — revisita a cada release major, security incident, ou mudança em compliance.

### 8. Documenta

- DFD (diagram).
- Threat catalog (table).
- Mitigation status (open / mitigated / accepted / transferred).
- ADRs anexados.

Output formato: Markdown no repo, gerado via [pytm](github.com/izar/pytm), [Threagile](threagile.io), ou Threat Dragon (OWASP).

## PASTA — Process for Attack Simulation and Threat Analysis

7 stages, mais corporate / business-aligned:

1. **Define business objectives** — o que estamos protegendo, por quê.
2. **Define technical scope** — tech stack, integrations.
3. **Application decomposition** — DFD, components.
4. **Threat analysis** — ameaças relevantes ao negócio + indústria.
5. **Vulnerability analysis** — onde os controles falham?
6. **Attack modeling** — attack trees, scenarios.
7. **Risk and impact analysis** — quantificação.

PASTA é heavier. Use em projeto grande, alto-risco (banking, govt, healthcare). STRIDE é o tátil de design review semanal.

## Attack Trees

Decompose objetivo do atacante em sub-objetivos:

```
Goal: Steal customer PII
├── AND: Have access to customer DB
│   ├── OR: Compromise web app (SQLi)
│   ├── OR: Compromise DB server directly
│   │   ├── AND: Network access to DB port
│   │   └── AND: Valid DB credentials
│   │       ├── OR: Phish DBA
│   │       ├── OR: Find in source code
│   │       └── OR: Memory dump
│   └── OR: Steal backup
└── AND: Exfil data
    ├── OR: Direct HTTP POST
    ├── OR: DNS tunneling
    └── OR: Encrypted SaaS upload
```

Útil pra justificar investment: "Se mitigamos 'Find in source code' (1 dia trabalho), bloqueamos N caminhos do tree".

## Abuser stories

Inverso de user stories:

> **User story:** As a user, I want to transfer money to another account so I can pay bills.
> 
> **Abuser story:** As an attacker, I want to transfer money from another account to my own without that user knowing.

Cada user story tem 1-3 abuser stories. Inclui no backlog: abuser story tem critério de aceite = mitigation verificável.

## Dataflow modeling — onde dados sensíveis fluem

Para cada classe de dado sensível (PII, credentials, PHI, financial), trace:

- **Origem** — user input form, partner API, integration.
- **Path** — quais services tocam, em quais dataformat.
- **Stores** — onde repousa (DB, cache, log, audit trail).
- **Egress** — sai pra onde (vendor, analytics, backup).
- **Encryption** — em trânsito? em repouso? at field level (PII tokenized)?
- **Access** — quem (humano e service) pode ler?
- **Retention** — quanto tempo guarda?
- **Deletion** — como deleta (LGPD/GDPR right to be forgotten)?

Isso é base de DPIA (Data Protection Impact Assessment) — exigido por LGPD/GDPR para dado sensível.

## AI-Assisted threat modeling

Em 2026, LLM ajuda em:

### Geração inicial de threats

Prompt template:
```
You are a threat modeling expert using STRIDE. 

System description:
[arquitetura em prosa ou DFD em ASCII]

For each component and dataflow, enumerate STRIDE threats. For each threat:
1. Describe the attack scenario.
2. Rate likelihood (Low/Med/High).
3. Suggest mitigations.

Output: markdown table.
```

LLM dá first pass — humano revisa, descarta absurdo, adiciona context-specific.

### Attack tree expansion

```
Given the goal "Steal customer PII", expand attack tree to 3 levels with AND/OR nodes.
```

### Review of design docs

Submit arquitetura, peça "find weaknesses em STRIDE categories".

### Tools

- **STRIDE GPT** (stride-gpt.streamlit.app) — open source, OpenAI.
- **MS Security Copilot** — integrado em Microsoft stack.
- **Threat Modeler** com AI add-on.

**Importante**: LLM regurgita training data. Output sempre revisado por human expert. Não delega responsabilidade legal.

## Threat modeling para sistemas com AI/LLM

Cobertura adicional STRIDE+LM:

**LLM-specific threats** (alinhar com LLM Top 10):

| LLM Threat | Mitigation |
|-----------|------------|
| Prompt injection | Separar canais instruction vs data, output validation |
| Insecure output handling | Treat LLM output as untrusted (NEVER eval/sql/shell) |
| Sensitive info in prompt | Pre-process: strip PII before sending to LLM |
| Tool abuse | Allow-list tools, sandbox execution, human in loop pra ações destrutivas |
| Excessive agency | Capability boundaries: agente faz READ, humano confirma WRITE |
| Data poisoning | RAG vector store provenance, model artifact integrity (signed) |
| Model theft | Rate limit + query pattern detection |

Ver `sec-llm-redteam-2026` e `sec-agent-mcp-security` pra deep dive.

## Threat modeling pra microservices

Em microservices, adicione:

- **Service-to-service auth** — mTLS, SPIFFE/SPIRE? Service mesh handles?
- **East-west traffic** — internal network também trust boundary?
- **Service discovery** — DNS poisoning attack vector?
- **Message queue** — quem publica em qual tópico? Encryption em transit?
- **Distributed tracing leak** — traces vazam PII em backend de tracing?
- **Saga / compensation** — failure modes seguros?

## Templates práticos

### One-page threat model (start here)

```markdown
# Feature: [Name]

## What we're building
[2-3 frases]

## Assets at risk
- [PII, secrets, financial data, intellectual property]

## Trust boundaries
- [User → Web, Web → Internal, Internal → External Vendors]

## Top 5 threats
1. [Threat] — likelihood — impact — mitigation — owner
2. ...

## Decisions made
- Accepted risk: [list with justification]
- Mitigations to implement: [list with effort estimate]

## Next review date
[3 months from now or before next major release]
```

### Threat catalog full

| ID | Component | Threat (STRIDE) | Description | Likelihood | Impact | Mitigation | Status | Owner |
|----|-----------|-----------------|-------------|------------|--------|-----------|--------|-------|
| T-001 | Auth Service | S | Session token brute force | M | H | Rate limit 5/min | Mitigated | @sec |
| T-002 | DB | T | SQL injection via search field | H | C | Parameterized queries + WAF | Mitigated | @backend |
| ... | | | | | | | | |

## Ferramentas

| Tool | Free? | Notas |
|------|-------|-------|
| **OWASP Threat Dragon** | ✓ | Web-based, simple DFD + STRIDE |
| **Microsoft Threat Modeling Tool** | ✓ | Windows only, mais features |
| **pytm** | ✓ | Python DSL, gera DFD + report |
| **Threagile** | ✓ | YAML-based, modelo grande |
| **IriusRisk** | ✗ | Enterprise, integra Jira |
| **STRIDE GPT** | ✓ | LLM-assisted, open source |
| **OWASP Cornucopia** | ✓ | Card game pra workshops |

## Workshop format — facilitando session

Para sessão de threat modeling de 2-3h:

1. **Pre-work** (1 sem antes): owner do feature escreve "what we're building" + envia.
2. **Whiteboard / Miro**: time desenha DFD juntos. 30min.
3. **STRIDE walk-through**: per component, sessão guiada. 60-90min.
4. **Prioritize**: vote dot pra top 5 threats. 15min.
5. **Action items**: mitigation owners + dates. 15min.

Facilitator (você, security consultant) não escreve tudo — equipe escreve. Tem mais buy-in.

## Output em código

```yaml
# threat-model.yml — Threagile style
business_overview:
  description: Customer-facing checkout
data_assets:
  payment_data:
    description: Credit card info, transaction details
    classification: payment-card-data
    confidentiality_level: strict
trust_boundaries:
  - id: customer-internet
    type: network-of-untrusted-entities
technical_assets:
  - id: web-app
    type: application
    trust_boundary: app-network
    communication_links:
      - target: payment-gateway
        protocol: https
        authentication: api-key
        authorization: api-key
```

Threagile gera DFD + risk report + ADR templates a partir desse YAML.

## Checklist de modelo bom

- [ ] DFD com trust boundaries explícitas?
- [ ] Cada componente analisado contra todos STRIDE?
- [ ] Dataflows com classificação (data type) + encryption status?
- [ ] Top threats com mitigation owner + due date?
- [ ] Decisions log (aceitamos risco X porque Y)?
- [ ] Review date pra revalidar?
- [ ] Linked aos ADRs?
- [ ] Versionado em repo?

## Leituras

- "Threat Modeling: Designing for Security" — Adam Shostack (livro canônico)
- "Threat Modeling: A Practical Guide for Development Teams" — Tarandach & Coles
- OWASP Threat Modeling Cheat Sheet
- "Threats: What Every Engineer Should Learn From Star Wars" — Adam Shostack (fun and instructive)
- Adam Shostack blog (shostack.org/blog)
- pytm docs (github.com/izar/pytm)
