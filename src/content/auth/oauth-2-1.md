---
title: "OAuth 2.1 & OIDC"
category: "auth"
excerpt: "As principais mudanças na nova spec de OAuth, PKCE para todos e o fim do Implicit Flow."
stack: ["Security", "OAuth", "OIDC"]
tags: ["PKCE", "Authentication", "Tokens"]
---

# OAuth 2.1 Best Practices

O OAuth 2.0 existe há uma década e sofreu com vulnerabilidades estruturais (como o *Implicit Flow* que vazava tokens na URL). A especificação do **OAuth 2.1** vem para consolidar as melhores práticas modernas e fechar falhas antigas, tornando o fluxo mais robusto para SPAs (Single Page Apps) e apps nativos.

## Quando usar

* Ao desenhar qualquer sistema moderno de Single Sign-On (SSO) ou provedor de identidade.
* Na integração da sua aplicação com Google, GitHub ou ferramentas Enterprise via OIDC (OpenID Connect).

## O que muda no OAuth 2.1 (O que Fazer)

1. **PKCE é Obrigatório (Proof Key for Code Exchange):**
   Antes usado apenas para apps mobile, agora o PKCE deve ser usado em TODOS os fluxos de Authorization Code (incluindo apps backend e SPAs). Isso previne a interceptação de códigos de autorização.
2. **Fim do Implicit Flow:**
   A prática de retornar o *Access Token* diretamente na hash do redirecionamento (URL) está banida. Use o Authorization Code Flow com PKCE, mantendo os tokens fora do histórico do browser.
3. **Fim do ROPC (Resource Owner Password Credentials):**
   Você não deve mais pedir que o usuário insira seu login e senha na sua UI para trocar por um token na API de terceiros. A página de login sempre deve pertencer ao servidor de autorização.
4. **Refresh Tokens Seguro:**
   Refresh Tokens agora devem sofrer *Rotation* (serem rotacionados a cada uso) ou estarem fortemente vinculados ao cliente através de mTLS / DPoP (Demonstrating Proof-of-Possession).

## Armadilhas

* **Usar OAuth 2.0 para Autenticação (Login):** OAuth foi feito para *Autorização* (dar acesso a recursos). Se você precisa de Autenticação (saber quem é o usuário logado), use **OIDC (OpenID Connect)**, que introduz o `id_token`.
* Armazenar o Access Token no LocalStorage de um SPA sem as devidas proteções CSP e prevenções de XSS. A recomendação moderna para SPAs é usar arquiteturas BFF (Backend for Frontend) para manter os tokens blindados no servidor e enviar apenas Cookies HttpOnly pro frontend.

## Como auditar

* Tente requisitar um token ao seu Authorization Server usando o "Implicit Flow" (`response_type=token`). O servidor atualizado deve rejeitar o pedido.
* Intercepte um Refresh Token válido e tente usá-lo duas vezes consecutivas (Replay Attack). Um sistema moderno revogará instantaneamente toda a cadeia de tokens daquele usuário por detectar vazamento.
