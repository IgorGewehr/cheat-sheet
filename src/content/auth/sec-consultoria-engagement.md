---
title: Consultoria & Engagement Business — Scoping, SOW, RoE, Pricing
category: auth
stack: [consultoria, contratos, pricing, sales]
tags: [consultoria, scoping, sow, roe, pricing, retainer]
excerpt: Lado de negócio da consultoria de segurança — scoping calls, SOW, RoE, pricing models (project/retainer/day-rate), kick-off, readout, follow-up & retest economics.
related: [sec-pentest-report-pro, sec-red-team-ops-2026, sec-capstone-pentest-engagement]
updated: "2026-05-10"
---

## Por que esse card existe

90% dos cursos de cybersecurity ensinam ataque. Quase nenhum ensina **como cobrar pra fazer ataque**. Mas em consultoria empresarial real, o lado business pesa tanto quanto o técnico — e diferencia consultor que ganha R$10k/mês de quem ganha R$50k+.

Esse card é a base pra você operar como consultor independente ou tech lead em consultancy.

## Engagement lifecycle

```
Lead → Scoping → Proposal → SOW + RoE → Kick-off → Execution → Readout → Report → Retest → Renew
```

Cada etapa tem entregáveis e armadilhas.

## 1. Lead generation

Sources típicas:
- **Referral**: cliente atual indica. **Highest conversion** — confiança transferida.
- **Network**: LinkedIn, conferences, communities (OWASP, ISSA, ISACA Brazil).
- **Content marketing**: blog, talks, tools open-source. Slow burn, alto valor.
- **Cold outreach**: low conversion mas escala. Use Apollo.io / Lemlist + research-heavy.
- **Bug bounty findings**: report a CVE bem feito gera lead orgânico.
- **Lead aggregators**: Upwork, Clutch — race to bottom em preço, evite.

Build pipeline de 10x leads que você quer fechar. Sales é números.

## 2. Discovery / Scoping call

**Goal**: descobrir if fit + collect info pra proposal.

**Duration**: 30-60min. NÃO mais que isso na primeira call.

**Topics a cobrir**:
- Por que estão buscando pentest agora? (audit due? incident? compliance?)
- Quem é o decision maker?
- Que sistemas / superfícies em escopo?
- Tamanho aproximado (LoC, users, infra)?
- Compliance requirements (PCI, SOC2, LGPD)?
- Budget range já aprovado?
- Timing — when start, when end?
- Past pentests — what they liked/disliked?

**Don't**:
- Quote price em primeira call sem due diligence.
- Promise specific findings or outcomes.
- Sign NDA em call sem advogado revisar.

**End of call**: agree em next step + timeline pra proposal (típicamente 5 business days).

## 3. Proposal

Documento (15-30 páginas) com:

### Sections

1. **Cover** + executive summary.
2. **Problem statement**: rephrase what client said (proves you listened).
3. **Approach / Methodology**: PTES, OWASP, custom — name and brief.
4. **Scope**: explicit. What's in, what's out.
5. **Deliverables**:
   - Executive summary report.
   - Technical findings report.
   - Custom Semgrep / Sigma rules.
   - Readout call.
   - Retest within X months.
6. **Timeline**: phase by phase, dependencies on client.
7. **Team**: senior + supporting consultant. Bios.
8. **Pricing**: total + payment terms.
9. **Terms & Conditions**:
   - IP ownership (deliverables to client, methodology yours).
   - Liability cap (often 1x fees).
   - Confidentiality (mutual).
   - Insurance held (E&O coverage).
   - Out clauses (force majeure, mutual termination).
10. **Acceptance**: signature block.

### Pricing models

| Model | Quando |
|-------|--------|
| **Fixed-price project** | Scope claro, defined deliverable. Most common. |
| **Time & Materials (T&M)** | Scope unclear, exploratory. Risk on client. |
| **Day-rate** | Short engagement (1-3 days), single consultant. |
| **Retainer** | Ongoing relationship, monthly recurring. |
| **Outcome-based** | Risk shared. E.g., "pay X if we find no findings". RARO. |

### Pricing reference — Brazil 2026

**Senior independent consultant**:
- Day rate: R$3-8k/dia.
- Hour rate: R$400-1000/hora.
- Pentest small web app (2 sem): R$50-120k.
- Pentest medium (4 sem): R$120-280k.
- Red team engagement (6-8 sem): R$300-600k.
- LLM red team (2-4 sem): R$80-250k.
- Code audit (5-10k LoC, 4 sem): R$100-250k.
- Threat model session (1 dia): R$15-40k.
- Tabletop exec (1 dia): R$15-30k.

**Junior in agência** (entrega para a agência):
- Salário: R$8-25k/mês (PJ/CLT).
- Agência cobra cliente 2-4x do salário.

**Senior em agência sênior** (Mandiant, Tempest, Bishop Fox):
- Salário: R$25-50k/mês.
- Agência cobra cliente $$$$ (premium pricing).

**Boutique consultora (own shop, 1-5 people)**:
- Margens próprias = pricing acima.
- Overhead lower vs grande agência → competitive em mid-market.

### EUA / Europa comparação
Multiplicar por 2-3x para EUA (mid-market). Multiplicar por 3-5x para tier-1 consulting (Mandiant, NCC).

### Como justificar pricing pra cliente

Cliente vai comparar com:
- Bug bounty (HackerOne): "encontre vuln e paga só se achar".
- Outras consultorias.
- Tools automatizadas (Burp Enterprise, custom DAST in CI).

Diferencial pra cobrar premium:
- **Custom expertise** (AI security, AD, cloud — não commodities).
- **Track record**: case studies, CVEs disclosed, talks.
- **Methodology clara** (PTES, custom playbook).
- **Deliverable quality** (sample reports — anonymized).
- **Insurance + legal** (E&O coverage signals serious).
- **Aftercare**: retest, ongoing support included.

## 4. SOW — Statement of Work

Subset do proposal, contractually binding:

- Scope (in/out).
- Deliverables.
- Timeline.
- Fees + payment schedule (e.g., 50% upfront, 50% on report delivery).
- IP, confidentiality, liability.
- Termination clauses.

Inclui anexos:
- RoE.
- Acceptance criteria for deliverables.
- Change order process (scope changes).

Hire lawyer pra primeiro template — depois reutiliza.

## 5. RoE — Rules of Engagement

Documento técnico de "como vamos fazer":

- **Scope técnico explícito**:
  - In-scope IPs, CIDRs, hostnames, URLs.
  - Out-of-scope (e.g., AWS infrastructure itself, third-party SaaS).
  - Crown jewels / objectives específicos.

- **Permitted methods**:
  - Active exploitation? Read-only?
  - DoS testing? (often excluded).
  - Phishing real users? (requires HR notice ou pre-coordinated).
  - Social engineering, vishing?
  - Physical?

- **Timing**:
  - Working hours / 24/7?
  - Blackout periods (holidays, releases)?
  - Engagement start/end.

- **Communications**:
  - Primary POC (technical) + executive escalation.
  - Daily / weekly check-ins.
  - Emergency contact 24/7.

- **Emergency stop conditions**:
  - Production outage caused by engagement.
  - Specific stop word from POC.
  - Crown jewel achieved (stop further escalation).

- **Get out of jail letter**:
  - PDF carried by team during engagement.
  - Signed by executive POC.
  - Phone numbers for verification.

- **Data handling**:
  - PII / sensitive data discovered: handling protocol.
  - Storage during engagement (encrypted vault).
  - Destruction post-engagement (retention period).

## 6. Kick-off

Meeting (1h) com client team:
- Re-confirm scope + RoE.
- Introductions.
- Communication channels.
- Tools / VPN access setup.
- Schedule check-ins.
- Quick threat model session (if needed).
- Q&A.

After kick-off, send written summary + decisions.

## 7. Execution

(Coberto em outros cards.)

Operacional:
- Daily standup (sync, no formal).
- Weekly status email (high-level findings count, what's next).
- Real-time escalation pra critical findings (NÃO wait pra report).

### Real-time critical disclosure

Encontrou RCE em production system? **Não wait pra report final.**

Process:
1. **Stop exploitation** (don't worsen).
2. **Notify POC imediatamente** (call/email).
3. **Brief description + mitigation suggestion**.
4. **Coordinate fix** if urgent.
5. **Document for report** depois.

Cliente paga pra you helping fix vulnerabilities, não pra esperar 4 semanas até findings.

## 8. Readout

Meeting (1-2h) post-report delivery:
- Walkthrough of executive summary.
- Top findings explanation.
- Q&A.
- Discussion of remediation priorities.
- Schedule retest if applicable.

**Audience**: mix técnico + executivo. Adjust technical depth ao vivo.

Common questions:
- "How urgent é fixing F-003?"
- "What's similar at our peers?"
- "Should we go public with disclosure?"
- "What's next step?" → propose retest, more services.

## 9. Follow-up / Retest

Retest típicamente included em SOW (30-60-90 days post-report).

Retest scope:
- All P0/P1 findings.
- 10-20% sample of P2.
- Verify fixes complete + não introduced novos issues.

Output: retest report (shorter — focused on resolved/unresolved status).

If client has lots of remediation work, retest pode tornar standalone engagement ($).

## 10. Renewal / Annual

Best clients = recurring clients.

Cadence options:
- **Annual** pentest: replicate engagement, find regression.
- **Quarterly** lightweight: continuous coverage.
- **Retainer**: monthly hours, flexible use.

Renewal value much higher than new client acquisition. Foster relationship: send relevant articles, congratulate on company milestones, invite to dinner.

## Retainer model — recurring revenue

```
Monthly retainer: R$30k
Includes:
- 40 hours of consulting time.
- Quarterly threat model refresh.
- Annual pentest discount (-20%).
- Priority response (24h SLA).
- Unused hours rollover up to 50%.
```

Predictable revenue (yours) + ongoing service (client value).

## Operational — solo consultant

If you're solo:

### Tools

- **CRM**: Pipedrive, HubSpot Free, Notion (simple).
- **Invoicing**: Quaderno, FreshBooks, Stripe Invoicing.
- **Time tracking**: Toggl, Clockify (free).
- **Contracts**: HelloSign, Docusign, PandaDoc.
- **Project management**: Notion, Linear, Jira.
- **Secrets**: 1Password Business, Bitwarden.
- **Encryption**: VeraCrypt, age, GPG.

### Legal

- **MEI or LLC** (Brazil: PJ ou ME ou LTDA).
- **E&O insurance** (Errors & Omissions): R$5-15k/ano em Brazil.
- **Cyber Liability** insurance separately.
- **NDA mútuo** template.
- **Master Services Agreement** template.

### Taxes

- Brazil: ~17-32% effective rate for PJ doing services (Simples Nacional anexo III/V).
- Save 30% of revenue separately for taxes.
- Accountant: R$200-500/mês — vale.

## Equity / cap table — boutique

Se monta consultora boutique:
- 2-5 founders, equal-ish split early.
- Vest 4 anos, cliff 1 ano.
- Reserve 10-15% for hiring / advisors.
- Document everything em shareholder agreement.

## Skills além do técnico

Pra crescer revenue:
- **Sales**: cold outreach, qualifying leads, closing.
- **Writing**: blog posts, talks, reports. Inbound marketing.
- **Speaking**: conferences (BHack, H2HC, Mind the Sec, Latinoware). Build authority.
- **Networking**: OWASP chapter meetings, ISACA, CISO communities (CSO BR, ICO Brasil).
- **Negotiation**: anchor high, justify with value.

## Red flags em clients

Reject ou price-up:
- **"Pay on success"** — never. Risk all on you.
- **Tiny budget but huge scope** — they're shopping, will haggle endlessly.
- **No technical POC** — communication will be hell.
- **Hostile to security teams** — fix is uncertain.
- **Crisis mode after breach** — emotional, expectations unrealistic. Charge premium for chaos.

Embrace:
- **Renewing client** with growing scope.
- **Referral from trusted source**.
- **CISO/CTO who has been pentested before** — knows process.
- **Modern stack** — interesting work, you learn.

## Career path opportunities

After consultor competente independente:

1. **Solo lifestyle**: 6-figure income, 30-40h/wk, choose clients.
2. **Boutique founder**: 5-15 people, $1-5M revenue, more management.
3. **Acquired by big firm**: Mandiant / NCC / Tempest buys boutiques.
4. **CISO role**: deep technical + consulting → many CISOs come from consulting.
5. **AppSec at scale-up**: comfortable salary, ownership of program.
6. **Product (security tool)**: own startup, harder path but huge upside.

## Mentorship + community

- **OWASP local chapter**: free, monthly meetings.
- **ISSA / ISACA**: paid memberships, networking.
- **DEF CON / Black Hat conferences**: travel investment, ROI varies.
- **H2HC** (Brazil), **BSides**, **Mind the Sec**: lower cost, similar value.
- **OffSec / SANS** alumni networks.

Build local + international network. Both produce leads.

## Checklist — first engagement as solo consultor

- [ ] Legal entity (PJ, LLC) registered?
- [ ] E&O insurance bought?
- [ ] Bank account business separate?
- [ ] CRM started tracking leads?
- [ ] Template proposal + SOW + RoE drafted?
- [ ] Accountant lined up?
- [ ] LinkedIn profile updated?
- [ ] Past work case studies (anonymized) prepared?
- [ ] At least 3 references contactable?
- [ ] Pricing benchmark by market (research peers)?

## Leituras

- "Solo: Inspired and Powered to Do It Alone" — Rebecca Seal
- "Million Dollar Consulting" — Alan Weiss
- "The Pumpkin Plan" — Mike Michalowicz (scale consulting business)
- "Built to Sell" — John Warrillow (boutique to acquired)
- Patrick McKenzie blog (kalzumeus.com) — software consulting
- "Hourly Billing Is Nuts" — Jonathan Stark
- "Show Your Work" — Austin Kleon (audience building)
