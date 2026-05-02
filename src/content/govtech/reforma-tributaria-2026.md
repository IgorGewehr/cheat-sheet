---
title: "Reforma Tributária 2026 — IBS, CBS e o impacto no sistema municipal"
category: "govtech"
stack: ["NestJS", "Next.js", "PostgreSQL"]
tags: ["nfs-e", "reforma-tributaria", "ibs", "cbs", "iss", "b2g", "govtech", "fiscal", "municipio", "ec-132"]
excerpt: "EC 132/2023 transforma o sistema tributário brasileiro em fases até 2033. Em 2026, ISS e CBS coexistem — e a prefeitura que não integrar o Padrão Nacional NFS-e perde capacidade de fiscalizar e arrecadar. Aqui está o que o desenvolvedor precisa saber para vender e construir esse sistema."
---

## Visão Geral

A Emenda Constitucional 132/2023 é a maior reforma tributária desde 1988. Ela substitui cinco tributos por dois:

| Tributo extinto | Novo tributo | Esfera |
|----------------|--------------|--------|
| PIS | CBS (Contribuição sobre Bens e Serviços) | Federal |
| COFINS | CBS | Federal |
| IPI | CBS (parcialmente) | Federal |
| ICMS | IBS (Imposto sobre Bens e Serviços) | Subnacional (estados e municípios) |
| ISS | IBS | Subnacional (municípios) |

O IBS é gerido pelo **Comitê Gestor do IBS (CG-IBS)**, órgão paritário com representantes de estados e municípios. A arrecadação é centralizada e depois redistribuída — o município perde a relação direta de "eu cobro, eu recebo".

## Contexto B2G

### O que está em vigor em 2026

A transição é gradual. Em 2026:

- **ISS continua vigente** — as prefeituras continuam cobrando ISS normalmente via legislação municipal (LC 116/2003)
- **CBS e IBS entram em vigor com alíquota-teste mínima**: 0,9% de CBS (federal) + 0,1% de IBS (subnacional)
- As alíquotas reais do IBS/CBS serão definidas apenas em 2029-2032 — em 2026 é um teste operacional
- **Dupla incidência por design**: o contribuinte paga ISS (regime antigo) E CBS/IBS (regime novo) em 2026-2028, com compensação via crédito fiscal

### Cronograma de transição (2026-2033)

| Período | O que muda |
|---------|------------|
| 2026 | CBS 0,9% + IBS 0,1% entram em vigor. ISS ainda vigora integralmente. Municípios devem enviar dados ao CG-IBS. |
| 2027-2028 | CBS e IBS aumentam progressivamente. ISS mantido com redução gradual. |
| 2029-2032 | Redução linear do ISS (25% ao ano). IBS sobe proporcionalmente. |
| 2033 | ISS extinto. IBS pleno em vigor. Municípios só arrecadam via CG-IBS. |

### O que a prefeitura precisa fazer em 2026

1. **Enviar dados de NFS-e em tempo real ao CG-IBS** — sem integração, o município não tem como provar ao Comitê o volume de serviços tributados e perde na redistribuição do IBS
2. **Implementar o Padrão Nacional NFS-e (MND 1.x)** — ABRASF e SEFIN determinaram o padrão para garantir interoperabilidade com o sistema federal
3. **Adaptar campos da NFS-e** para incluir informações de regime tributário e código de tributação nacional

## O que muda na prática

### Para o contribuinte (prestador de serviço)

- Continua emitindo NFS-e como sempre — a mudança é transparente
- Em 2026, a nota passa a ter CBS e IBS calculados automaticamente pelo sistema, além do ISS
- O Simples Nacional mantém seu regime até 2028 com regras próprias

### Para a prefeitura

- Continua sendo responsável pela fiscalização do ISS em 2026
- **Nova obrigação**: reportar dados ao CG-IBS via API padronizada
- Municípios sem sistema integrado terão que reportar manualmente — inviável para qualquer prefeitura com mais de 5.000 contribuintes

### Campos novos obrigatórios na NFS-e (Padrão Nacional MND)

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `CodigoTributacaoNacional` | Código nacional do serviço (alinhado com tabela CBS/IBS) | `"1.05"` |
| `CodigoTributacaoMunicipal` | Código municipal histórico (LC 116/2003) | `"7.02"` |
| `regimeTributacao` | Regime do prestador | `1` = Simples, `3` = Lucro Presumido, `6` = MEI |
| `tributacaoNaFonte` | Se o ISS é retido pelo tomador | `true` / `false` |
| `valorIBS` | Valor calculado do IBS (2026 = 0,1%) | `"1.50"` |
| `valorCBS` | Valor calculado da CBS (2026 = 0,9%) | `"13.50"` |

### Validação de Simples Nacional via PGDAS-D

O regime `Simples Nacional` tem alíquota de ISS diferente (entre 2% e 5% dependendo do anexo e faixa de receita). O sistema precisa validar se o contribuinte é realmente optante. A Receita Federal disponibiliza consulta via CPF/CNPJ na API do PGDAS-D.

Um contribuinte que declara ser Simples Nacional mas foi excluído paga ISS à alíquota cheia — e a responsabilidade pelo recolhimento correto é da prefeitura.

## Implementação técnica

Não há implementação de código neste card — veja o card `nfs-e-padrao-nacional.md` para integração MND e JAdES. Aqui o foco é no que os campos representam e por que existem.

O campo `regimeTributacao` é crítico: ele determina qual tabela de alíquota usar, se há retenção na fonte e qual o fluxo de crédito de CBS/IBS. Um erro aqui gera autuação fiscal para o contribuinte e responsabilidade para a prefeitura.

A integração com o CG-IBS em 2026 será via API REST com autenticação por certificado digital (mTLS) — o mesmo padrão já usado na NFS-e nacional. Quem já implementou NFS-e com mTLS tem 80% do trabalho feito.

## A janela de oportunidade

### Por que 2026 é urgente

Prefeituras com sistemas legados (Delphi, PHP 5.x, Access/VBA) **não conseguem implementar os campos obrigatórios do IBS/CBS a tempo**. O prazo é o início do exercício fiscal de 2026 — sistemas que não se adequarem ficam em não-conformidade.

O CG-IBS não vai esperar. A distribuição do IBS para cada município será baseada nos dados que o município conseguir reportar. Município que não reporta, não recebe a parcela correta.

### O argumento para o Secretário da Fazenda

> *"Secretário, o ISS que o município arrecada hoje vai ser redistribuído via Comitê Gestor do IBS a partir de 2029. Em 2026, já começa a fase de testes — e os dados que o município enviar agora definem o histórico que vai embasar a cota de distribuição futura. Com o sistema atual, o município não consegue enviar esses dados. São dados que nunca mais vão ser recuperados."*

Esse argumento tem três vetores de urgência que funcionam com gestores públicos:
1. **Perda financeira irreversível** — receita que não vem de volta
2. **Prazo legal** — não é opção, é obrigação
3. **Complexidade técnica** — o sistema atual não faz, ponto final

### Estratégia de entrada: dispensa de licitação

Art. 75, II da Lei 14.133/2021 (Nova Lei de Licitações) — contratos até **R$ 59.904,82/ano** (corrigido 2024) não precisam de licitação. Isso equivale a **R$ 4.992,07/mês**.

Posicione o módulo de integração NFS-e + IBS/CBS em R$ 4.500-4.900/mês:
- Fica dentro do limite de dispensa
- O Secretário da Fazenda pode assinar sem ir ao Prefeito
- A urgência justifica a contratação direta

## Armadilhas

**1. Tratar CBS/IBS como substituição direta do ISS**
Em 2026, CBS e IBS são adicionais — o ISS continua. Calcular só um dos dois gera obrigação fiscal incorreta e autuação dupla.

**2. Ignorar o regime tributário do prestador**
Simples Nacional, MEI, Lucro Presumido e Lucro Real têm alíquotas de ISS, CBS e IBS diferentes. Um sistema que aplica alíquota flat para todos está errado para a maioria dos contribuintes.

**3. Não implementar o `CodigoTributacaoNacional`**
O código municipal (LC 116/2003) e o código nacional (tabela CBS/IBS) são sistemas diferentes. A NFS-e do Padrão Nacional exige os dois. Não mapeá-los gera rejeição da nota pelo sistema federal.

**4. Confundir o Comitê Gestor com a Receita Federal**
O CG-IBS é um órgão novo, independente da Receita Federal. Tem API própria, certificação própria e prazo próprio. Integrar com a Receita Federal não resolve a obrigação com o CG-IBS.

**5. Vender "adequação ao IBS" como projeto de longa duração**
A urgência é o argumento. Um projeto que começa em março de 2026 para ser entregue em dezembro não serve — o exercício fiscal já começou. O sistema precisa estar operacional em janeiro.

**6. Não atualizar as tabelas de alíquota anualmente**
As alíquotas de CBS e IBS sobem a cada ano até 2033. O sistema precisa de uma tabela de alíquotas configurável por data de vigência, não hardcoded.

## Referências

- [EC 132/2023 — Emenda Constitucional da Reforma Tributária](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm)
- [LC 116/2003 — Lei do ISS](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm)
- [LC 157/2016 — Altera LC 116 (ISS digital, retenção)](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp157.htm)
- [Lei 14.133/2021 — Nova Lei de Licitações, Art. 75](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm)
- [Resolução CGSN 140/2018 — Simples Nacional e ISS](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=92278)
- [ABRASF — Padrão Nacional NFS-e MND](https://www.abrasf.org.br/nfse.php)
- [Comitê Gestor do IBS — Portal oficial](https://www.gov.br/receitafederal/pt-br/assuntos/reforma-tributaria)
