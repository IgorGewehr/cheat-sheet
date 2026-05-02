---
title: "Dispensa de Licitação para SaaS GovTech — Estratégia Comercial"
category: "govtech"
stack: ["NestJS", "Next.js", "PostgreSQL"]
tags: ["govtech", "b2g", "licitacao", "comercial", "saas", "lei-14133", "prefeitura", "secretaria-fazenda", "nfs-e"]
excerpt: "Art. 75, II da Lei 14.133/2021 permite contratar SaaS municipal até R$ 59.904,82/ano sem licitação. Este card cobre a estratégia completa: documentação, Termo de Referência a seu favor, precificação defensável e como evitar nulidade do contrato."
---

## Visão Geral

A Nova Lei de Licitações (Lei 14.133/2021) manteve e atualizou a dispensa de licitação para contratos de baixo valor. Para fornecedores de software B2G, o **Art. 75, inciso II** é o principal mecanismo de entrada em prefeituras sem precisar enfrentar um processo licitatório completo — que pode durar 6 a 18 meses.

**O limite em 2026**: R$ 59.904,82/ano (atualizado pelo Decreto 11.871/2023 para 2024 em diante).

Isso equivale a **R$ 4.992,07/mês** — ou seja, contratos mensais abaixo de R$ 4.992,07 podem ser firmados por dispensa.

A estratégia prática: posicionar o produto entre R$ 4.500 e R$ 4.900/mês, deixando margem de segurança e simplificando a negociação com o gestor municipal.

## Contexto B2G

### Quem tem autoridade para assinar

Diferente de uma licitação formal (onde o processo passa pelo Prefeito e Câmara em alguns casos), a dispensa de licitação pode ser autorizada e assinada pelo **Secretário da Fazenda** ou **Diretor de Tributos** — dependendo da estrutura municipal.

Isso corta semanas de burocracia. Foque a abordagem comercial nessas pessoas, não no Prefeito.

### Por que a prefeitura usa dispensa

A prefeitura usa dispensa porque:
1. É mais rápido — atende urgência real (prazo legal, mudança de sistema)
2. Menos exposição política — sem audiência pública, sem impugnação de concorrentes no processo
3. O Secretário tem autonomia — não precisa mobilizar o Legislativo

### A vedação ao fracionamento

A lei proíbe **fracionar** um objeto para enquadrá-lo em dispensa. Exemplo proibido: dividir um contrato de R$ 120k em dois contratos de R$ 60k com a mesma prefeitura para o mesmo objeto.

**Como estruturar módulos legitimamente distintos**:

| Módulo | Objeto contratual | Valor sugerido/mês |
|--------|------------------|--------------------|
| NFS-e + Integração CG-IBS | Emissão eletrônica de notas e integração com Comitê Gestor do IBS | R$ 4.500 |
| Portal Transparência | Publicação de dados orçamentários conforme LAI | R$ 4.500 |
| Módulo de Tributos (IPTU/ITBI) | Lançamento, cálculo e emissão de guias de tributos imobiliários | R$ 4.800 |

Objetos distintos = contratos distintos = cada um enquadrado separadamente na dispensa. A chave é que cada módulo funcione de forma independente e tenha utilidade própria — não que seja artificialmente separado do mesmo sistema.

## O que muda na prática

### O processo real de uma contratação por dispensa

1. Você prospecta o Secretário da Fazenda com o argumento de urgência (reforma tributária, prazo legal)
2. O Secretário sinaliza interesse — você ajuda a montar a documentação da prefeitura
3. A prefeitura emite o **Termo de Referência** (você redige a minuta e entrega para adaptação)
4. A prefeitura coleta **3 orçamentos de mercado** (você indica concorrentes ou apresenta comparativos)
5. O Secretário autoriza a dispensa e assina o contrato
6. Publicação no Portal Nacional de Contratações Públicas (PNCP) — obrigatório mesmo em dispensa
7. Você emite a nota fiscal e inicia o serviço

O prazo realista do item 1 ao item 6: **15 a 30 dias úteis** em municípios bem organizados. Em municípios menores, pode ser mais rápido porque a burocracia interna é menor.

### A realidade dos 3 orçamentos

A prefeitura precisa de 3 orçamentos para comprovar que o preço é justo. Na prática, você pode:

- **Indicar concorrentes reais**: Betha Sistemas, Govbr, Ciasc, Tecnos — sistemas com preços públicos ou estimáveis
- **Apresentar um comparativo de mercado**: "O sistema X cobra R$ 8.000/mês, o sistema Y cobra R$ 6.500/mês, nossa solução custa R$ 4.800/mês com as funcionalidades A, B e C a mais"
- **A prefeitura pode solicitar orçamentos diretamente**: envie uma lista de fornecedores para ela contactar

Nunca sugira que a prefeitura crie orçamentos fictícios — isso é crime (fraude em licitação, mesmo em dispensa). O comparativo de mercado bem documentado é suficiente e legal.

## Implementação técnica

Esta seção trata da implementação da estratégia comercial, não de código.

### Documentação que o fornecedor (você) precisa ter sempre pronta

**Checklist de documentos do fornecedor — mantenha atualizados:**

- [ ] Cartão CNPJ ativo (Receita Federal)
- [ ] Certidão Negativa de Débitos Federais (RFB + PGFN) — validade 180 dias
- [ ] Certidão Negativa Estadual (Secretaria da Fazenda do estado sede) — validade variável
- [ ] Certidão Negativa Municipal (prefeitura sede da empresa) — validade variável
- [ ] Certidão de Regularidade FGTS (CEF) — validade 30 dias
- [ ] Certidão Negativa de Débitos Trabalhistas (CNTD/TST) — validade 180 dias
- [ ] Contrato Social ou Requerimento MEI
- [ ] Alvará de funcionamento (se município exigir)

Configure alertas de vencimento. Perder um contrato por CND vencida na hora da assinatura é o erro mais comum e mais evitável do setor.

### Documentação que a prefeitura precisa produzir (e você ajuda a redigir)

- **Termo de Referência** — descrição do objeto, justificativa, especificações técnicas, critérios de aceite
- **Atestado de necessidade** — documento interno da secretaria justificando a contratação (1-2 páginas)
- **Pesquisa de preços** — os 3 orçamentos ou comparativo de mercado
- **Autorização do ordenador de despesa** — assinatura do Secretário

### Como escrever o Termo de Referência a seu favor

O Termo de Referência define o que a prefeitura está comprando. Se você ajudar a escrê-lo, pode especificar as integrações e padrões técnicos que você já tem e o concorrente legado não tem.

**Especificações técnicas que funcionam como diferencial:**

> "O sistema de NFS-e deve implementar o Padrão Nacional MND (Modelo Nacional de Dados) versão 1.x conforme especificação ABRASF, com assinatura digital JAdES (JSON Advanced Electronic Signatures) conforme a-sign 3.x, autenticação mTLS por certificado ICP-Brasil e integração em tempo real com a API do Comitê Gestor do IBS para reporte de operações tributadas."

Sistemas legados em Delphi ou PHP 5.x não têm JAdES. Sistemas sem API REST não fazem mTLS. Especificar isso é legítimo e elimina tecnicamente a concorrência antiga.

**Critérios de SLA que o sistema legado não cumpre:**

> "Disponibilidade mínima de 99,5% medida mensalmente, com janela de manutenção programada de no máximo 4 horas mensais, fora do horário de expediente. Tempo de resposta máximo de 2 segundos para 95% das requisições de emissão de NFS-e."

### Template de primeiro contato com o Secretário da Fazenda

**Assunto do e-mail:** Adequação da NFS-e à Reforma Tributária 2026 — prazo urgente

> Senhor Secretário [Nome],
>
> Entro em contato porque identificamos que o Município de [nome] pode enfrentar dificuldade técnica para cumprir as novas obrigações de reporte ao Comitê Gestor do IBS, que passam a valer a partir de 2026 (EC 132/2023).
>
> A partir do exercício de 2026, os municípios precisam enviar dados de NFS-e em tempo real ao CG-IBS para garantir a correta distribuição da sua cota do IBS nos anos seguintes. Municípios que não reportarem terão o histórico prejudicado na fase de redistribuição (2029-2032).
>
> Nossa solução [nome do produto] já está integrada ao Padrão Nacional NFS-e (MND 1.x) e à API do CG-IBS. Podemos ter o sistema operacional em até 30 dias.
>
> O contrato pode ser formalizado por dispensa de licitação (Art. 75, II da Lei 14.133/2021), com investimento mensal de R$ [valor] — abaixo do limite legal para dispensa.
>
> Posso apresentar a solução em uma reunião de 30 minutos esta semana?
>
> Atenciosamente,
> [seu nome]

### Cláusulas contratuais essenciais

**No contrato que você assina com a prefeitura, garanta:**

| Cláusula | O que especificar | Por que importa |
|----------|-------------------|-----------------|
| SLA de disponibilidade | 99,5% mensal, medido por ferramenta de monitoramento | Define multa contratual proporcional |
| Hospedagem de dados | Servidores no território nacional | LGPD + requisito de alguns editais |
| Portabilidade na saída | Exportação de todos os dados em formato aberto (CSV/JSON) em até 30 dias | Evita o argumento de lock-in contra você |
| Propriedade intelectual | O código-fonte é propriedade do fornecedor — a prefeitura tem licença de uso | Você não vende o software, vende o serviço |
| Subcontratação | Autorização expressa para uso de infraestrutura cloud (AWS/GCP/Azure) | Evita questionamento sobre onde os dados estão |
| Confidencialidade | Dados da prefeitura são confidenciais, não podem ser usados para treinar modelos | Ponto sensível em 2026 com IA |
| Renovação | Possibilidade de renovação anual por interesse das partes | Previne que a renovação precise de novo processo |

### Tabela de preços defensável por módulo

Para a pesquisa de preços, você precisa justificar o valor. Use TCO (Total Cost of Ownership) comparativo:

| Módulo | Nosso preço | Sistema legado típico | Fundamento |
|--------|------------|----------------------|------------|
| NFS-e + CG-IBS | R$ 4.500/mês | R$ 6.000-8.000/mês (Betha/Govbr) | Padrão Nacional, sem taxa de implantação |
| Portal Transparência | R$ 4.500/mês | R$ 5.000-7.000/mês | LAI compliant, atualização em tempo real |
| Tributos (IPTU/ITBI) | R$ 4.800/mês | R$ 8.000-12.000/mês | SaaS sem custo de servidor local |

Adicione no comparativo: "O sistema legado cobra taxa de implantação de R$ 15.000-40.000 além da mensalidade. Nossa solução inclui implantação, migração de dados e treinamento."

### Construindo dependência saudável para renovação

A renovação anual não precisa de nova licitação — é continuidade do objeto original. Para garantir que a prefeitura renove:

1. **Dados históricos**: o sistema acumula 5 anos de NFS-e, IPTU, contribuintes — migrar perde esse histórico
2. **Relatórios de gestão**: dashboards mensais que o Secretário usa na prestação de contas ao Prefeito
3. **Integração profunda**: conectar o módulo NFS-e com o Portal Transparência cria uma dependência técnica legítima
4. **Suporte que funciona**: resposta em 4h para incidentes críticos — gestor público que fica sem sistema em dia de vencimento de IPTU não esquece

## Armadilhas

**1. Fracionamento de objeto (nulidade do contrato)**
Dividir artificialmente um único sistema em módulos para contornar o limite de dispensa é crime de fraude à licitação (Art. 337-E do Código Penal). Cada módulo precisa ter utilidade independente e poder ser contratado separadamente. Se os módulos são interdependentes e não funcionam sem o outro, é um único objeto.

**2. Não publicar no PNCP**
A Nova Lei de Licitações exige publicação de TODOS os contratos — inclusive por dispensa — no Portal Nacional de Contratações Públicas (PNCP). Prefeituras que não publicam estão em irregularidade. Contratos não publicados podem ser declarados nulos em auditoria do TCE. Oriente o gestor municipal sobre essa obrigação.

**3. Prestar serviço antes da assinatura**
"Começar a implantar enquanto o contrato está sendo assinado" cria uma situação de contrato verbal sem respaldo legal. O TCE pode glosar o pagamento. Só inicie após assinatura e publicação no PNCP.

**4. Sobrepreço documentado**
Se o TCE fizer auditoria e o seu preço for significativamente maior que o de mercado sem justificativa técnica, o contrato pode ser invalidado e o gestor que assinou pode ser responsabilizado. Mantenha documentação de comparativos de mercado no processo. Justifique qualquer diferencial técnico (JAdES, mTLS, SLA garantido).

**5. Impugnação por concorrente**
Um fornecedor concorrente pode impugnar o processo junto ao TCE alegando que o Termo de Referência foi escrito para favorecer seu produto. Proteja-se: as especificações técnicas precisam ser justificadas pela necessidade real da prefeitura, não por serem exclusivas suas. "Integração com API do CG-IBS" é necessidade real — "uso de framework NestJS" não é.

**6. Contrato sem objeto claro**
Termos como "sistema de gestão tributária" sem especificações são questionados em auditoria. Defina no Termo de Referência: quais funcionalidades, quais integrações, qual SLA, quantos usuários, qual volume de notas/mês. Quanto mais específico, mais difícil de contestar.

**7. Ignorar o Controle Interno municipal**
Algumas prefeituras têm Controladoria Interna que analisa contratos por dispensa antes da assinatura. Não é burocracia opcional — é obrigatória em municípios com mais de 50.000 habitantes (em geral). Pergunte ao Secretário se existe essa etapa e planeje o prazo.

## Referências

- [Lei 14.133/2021 — Art. 75 (Dispensa de Licitação)](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm#art75)
- [Decreto 11.871/2023 — Atualização dos limites de dispensa](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/D11871.htm)
- [PNCP — Portal Nacional de Contratações Públicas](https://www.gov.br/compras/pt-br/pncp)
- [TCE-SP — Orientações sobre dispensa de licitação](https://www.tce.sp.gov.br)
- [LC 116/2003 — Lei do ISS (para justificar objeto NFS-e)](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm)
- [EC 132/2023 — Base legal para urgência do argumento de venda](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm)
- [ABRASF — Especificação técnica NFS-e MND (para Termo de Referência)](https://www.abrasf.org.br/nfse.php)
- [Art. 337-E do Código Penal — Fraude em licitação](https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm)
