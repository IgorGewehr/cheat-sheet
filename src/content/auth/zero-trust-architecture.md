---
title: "Zero Trust Architecture"
category: "auth"
excerpt: "Por que firewalls de perímetro não funcionam mais e como adotar 'Never trust, always verify'."
stack: ["Security", "Networking", "IAM"]
tags: ["Zero Trust", "mTLS", "BeyondCorp"]
---

# Zero Trust Architecture (ZTA)

A abordagem tradicional de segurança corporativa era o "Castelo com Fosso": uma vez que o usuário passava pela VPN ou firewall de borda, ele tinha acesso livre à rede interna (movimentação lateral). 
Na nuvem e com o trabalho remoto, o perímetro sumiu. O Zero Trust assume que **a rede sempre é hostil**, e nenhuma entidade (usuário ou serviço) é confiável por padrão, mesmo que já esteja "dentro" da VPC.

## Quando usar

* Na construção de infraestruturas cloud-native e microsserviços.
* Quando sua empresa permite trabalho remoto ou BYOD (Bring Your Own Device).
* Ao lidar com dados altamente regulamentados (HIPAA, PCI-DSS).

## Pilares do Zero Trust (Como fazer)

1. **Autenticação Contínua e Rigorosa:**
   MFA (Múltiplos Fatores) não é opcional. Todo acesso deve ser validado não só pela senha, mas pelo contexto (IP, postura de segurança do dispositivo, horário, geolocalização).
2. **Microssegmentação:**
   Microsserviços não devem conseguir falar com o banco de dados livremente só porque estão na mesma subnet privada. Cada serviço deve ter permissões explícitas para falar com o outro (usando IAM roles, Security Groups estritos ou Network Policies no Kubernetes).
3. **Identidade de Serviço (mTLS):**
   Comunicação entre serviços no backend deve ser encriptada usando TLS mútuo (mTLS), garantindo que o Serviço A prove quem ele é para o Serviço B através de certificados dinâmicos.

## Quando NÃO usar

* Se for uma aplicação pequena, monolítica e interna, a complexidade de gerenciar mTLS e políticas granulares de Zero Trust pode atrasar a entrega mais do que agregar valor. (Ainda assim, use SSL e Auth!).

## Como auditar

* Tente rodar requisições de um pod/serviço no seu cluster Kubernetes contra o banco de dados. Se o pod A não deveria falar com o Banco, mas conseguir abrir conexão, sua segmentação falhou.
* Valide o log de acessos. Se tudo for logado como `internal_system`, você tem um problema. Zero trust exige rastreabilidade granular (quem acessou, qual IP, de qual máquina).
