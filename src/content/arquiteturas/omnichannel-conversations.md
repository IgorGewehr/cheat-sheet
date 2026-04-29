---
title: "Omnichannel — modelo unificado de conversas (WhatsApp + Meta + IG)"
category: arquiteturas
stack: [Next.js, Firestore, Meta]
tags: [omnichannel, whatsapp, meta, conversas, webhooks]
excerpt: "Atendimento multi-canal não é 'integrar 3 APIs'. É decidir um modelo único de Conversation/Message + webhook dedup + token encryption + roteamento por setor. Errar isso vira PDV de bug."
related: [auth-architecture, token-encryption-at-rest, gateway-compliance]
updated: 2026-04
---

## O modelo

Uma `Conversation` representa um diálogo com um contato — independentemente do canal:

```
Conversation {
  id, businessId, contactId,
  channel: 'whatsapp' | 'facebook' | 'instagram',
  externalChannelId,        // wa_id, page_scoped_id, ig_user_id
  assignedToSectorId?,
  sectorIds: string[],      // visibilidade
  priority: 'low'|'normal'|'high',
  unreadCount, lastMessageAt,
  status: 'open'|'pending'|'resolved'
}

Message {
  id, conversationId,
  externalMessageId,        // crítico pra dedup de webhook
  direction: 'inbound'|'outbound',
  channel, type: 'text'|'image'|'audio'|'document'|'template',
  body, mediaUrl?,
  status: 'sent'|'delivered'|'read'|'failed',
  sentAt, deliveredAt?, readAt?
}
```

`externalMessageId` é o que evita dup quando o webhook chega 2x (Meta repete em caso de timeout do seu 200 OK).

## As 4 decisões críticas

### 1. Dedup de webhook
Meta entrega "at-least-once". Antes de criar a mensagem:
```ts
const existing = await db.collection('messages')
  .where('externalMessageId', '==', payload.id)
  .limit(1).get();
if (!existing.empty) return; // já foi
```
Sem isso: notificações duplicadas, contagem errada, automação disparada 2x.

### 2. Tokens encriptados
Access token do WhatsApp/IG Business **nunca** vai pro Firestore em plaintext. Use AES-256-GCM com chave fora do banco (env var ou KMS). Ver card [token-encryption-at-rest](../auth/token-encryption-at-rest).

### 3. Assinatura HMAC dos webhooks
Meta envia `X-Hub-Signature-256`. Validar **sempre** com `crypto.timingSafeEqual`. Sem isso, qualquer um envia mensagem fake pro seu webhook e cria conversa.

### 4. Rate limit por canal
Meta tem limites diferentes por canal e por tier. Mantenha contadores **por businessId + canal**. Em produção: Redis/Firestore (in-memory falha em multi-instance — ver [rate-limit-distribuido](../infra/rate-limit-distribuido)).

## Roteamento por setor

`Conversation.sectorIds[]` controla quem vê a conversa. `assignedToSectorId` controla a quem o SLA pertence. Combinação típica: regras de auto-roteamento por palavra-chave/canal/horário.

## Read receipts e typing — fire-and-forget

Ações leves (read receipt, typing indicator) fazem `POST /typing` sem bloquear UI. Falha é silenciosa, no máximo log estruturado. Não vale a pena retry — a UX já foi.

## Dead-letter queue

Webhook que falha (ex: dedup em race) vai pra `webhookFailures` com `attempts`, `lastError`, `payload`. Cron diário tenta reprocessar até 3x e depois alerta.

## Anti-patterns reais

- **Modelos separados por canal**: 3 tabelas `whatsappMessages`, `fbMessages`, `igMessages`. UI explode em ifs. Refatorar dói.
- **Token em plain text**: Firestore "é privado", até alguém acessar o backup ou ler a Rule errada.
- **Webhook sem dedup**: detectado em produção quando contador de notificações começa a crescer linear.
- **Send sem rate limit**: bloqueio do número/page no segundo dia de uso.

## Checklist de produção

- [ ] `externalMessageId` único + dedup antes de inserir.
- [ ] Tokens criptografados com chave fora do banco.
- [ ] HMAC validado com `timingSafeEqual` (sem bypass em dev).
- [ ] Rate limit por business + canal.
- [ ] Dead-letter queue com retry programado.
- [ ] Read receipt/typing fire-and-forget.
- [ ] Modelo único Conversation/Message — sem if(channel).
