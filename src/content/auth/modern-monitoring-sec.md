---
title: "Sec Monitoring & SIEM"
category: "auth"
excerpt: "Observabilidade focada em segurança, SIEM, CSPM e detecção proativa de anomalias."
stack: ["Security", "Observability", "SIEM"]
tags: ["CSPM", "Audit Logs", "Anomaly Detection"]
---

# Modern Security Monitoring

Enquanto a Observabilidade tradicional foca em latência e erros, a **Observabilidade de Segurança (Sec Monitoring)** tenta responder: "Quem mexeu no quê, quando e de onde?". 
Sistemas modernos exigem a consolidação de logs em ferramentas de SIEM (Security Information and Event Management) e detecção ativa na nuvem via CSPM (Cloud Security Posture Management).

## Quando usar

* Aplicações corporativas que processam dados PII, financeiros ou tokens sensíveis.
* Quando sua empresa busca certificações ISO 27001 ou SOC2 (onde logs inalteráveis são obrigatórios).

## Como implementar (O que Fazer)

1. **Audit Logs Inalteráveis (WORM):**
   Grave os logs de auditoria em locais com proteção contra deleção e sobrescrita (*Write Once, Read Many*), como buckets S3 com *Object Lock*. Se a infra for comprometida, o hacker não pode apagar seu próprio rastro.
2. **Separe Logs de Aplicação dos de Auditoria:**
   Logs do tipo `Request timeout` vão para o Datadog. Logs do tipo `User 123 altered permissions of Role Admin` devem ir para o seu SIEM, com marcação de timestamp criptográfica.
3. **Detecção de Anomalias (Machine Learning):**
   Utilize regras ou IA para flaggar comportamentos estranhos. Ex: "Usuário X faz login de São Paulo todos os dias. Hoje fez login da Rússia e tentou exportar 10.000 clientes." Isso deve gerar um alerta imediato no SOC (Security Operations Center).

## Quando NÃO usar (Armadilhas)

* **Logar dados sensíveis no Payload:** NUNCA logue senhas, CPFs inteiros, números de cartão de crédito (PAN) ou Bearer Tokens completos nos seus agregadores de log. Aplique mascaramento/sanitização antes de emitir o log no backend.
* **Volume massivo de "Noise":** Não crie alertas críticos de segurança para comportamentos de rotina. "Alert fatigue" (fadiga de alertas) fará sua equipe ignorar avisos importantes.

## Como auditar

* Tente rodar um script que simula acessos errados (brute force) a uma rota administrativa. O SIEM deve capturar e possivelmente triggar o bloqueio automático (via WAF) em segundos.
