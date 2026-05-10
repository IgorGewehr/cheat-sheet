---
title: AI Product UX — Padrões para LLM Interfaces
category: agentes-ia
stack: [UX, product design, LLM interfaces]
tags: [product, ux, design, citations, retry]
excerpt: "UX patterns para apps LLM — streaming, citations clicáveis, retry/escape hatches, partial states, undo, source attribution, expectation setting."
related: [ai-streaming-sse, ai-safety-guardrails, ai-team-process]
updated: "2026-05-10"
---

## Por que UX é Tier 5

Tier 0-4 cobriu engineering. Tier 5 cobre o que separa AI Engineer competente de senior: **entender que produto não é a IA — é a experiência**.

Em 2026, qualquer empresa tem acesso aos mesmos modelos (Claude, GPT). Diferencial é **como a IA é apresentada ao user**. Quem entende UX patterns ganha em retention, satisfaction, monetization.

## Princípios fundamentais

### 1. Set expectations early

User não sabe se IA pode fazer X. Confusão = abandono.

```
❌ "How can I help?"
✅ "I can search company docs, summarize meetings, and draft emails. What would you like?"
```

Anchor capability claramente.

### 2. Show progress always

LLM call demora 2-30s. Sem feedback = "frozen".

```
❌ Loading spinner sem texto.
✅ "Searching docs...", "Analyzing 12 results...", "Composing response..."
```

User entende what's happening.

### 3. Graceful failure

LLM erra. Acomode em UX, não esconda.

```
❌ Error 500.
✅ "I'm having trouble with that. Try rephrasing or [contact support]."
```

### 4. Always give control

User must be able to:
- Stop generation (cancel button).
- Edit prompt and re-generate.
- Mark response as bad (feedback).
- Override AI choice.

LLM is assistant, not authority.

## Pattern 1: Streaming with personality

### Bad streaming UX

```
Lorem ipsum dolor [stops 0.5s] sit amet [stops 1s] ...
```

Choppy. Distracting.

### Good streaming UX

Smooth scroll, typing cursor, predictable rhythm:

```typescript
<div className="response">
  {responseText}
  {isStreaming && <TypingCursor className="animate-blink" />}
</div>
```

CSS:
```css
@keyframes blink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
.animate-blink { animation: blink 1s infinite; }
```

### Better: smart auto-scroll

Don't scroll if user scrolled up to re-read.

```typescript
const [autoScroll, setAutoScroll] = useState(true);

function onScroll(e) {
  const atBottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 50;
  setAutoScroll(atBottom);
}

useEffect(() => {
  if (autoScroll) scrollToBottom();
}, [responseText, autoScroll]);
```

### Bonus: streaming feedback indicators

```typescript
{status === "thinking" && <span>🤔 Thinking...</span>}
{status === "searching" && <span>🔍 Searching docs...</span>}
{status === "writing" && <span>✍️ Writing response...</span>}
```

Anthropic apps usam ths em Claude.ai.

## Pattern 2: Citations clicáveis

Em RAG ou tool use, mostre source:

```typescript
// Response inline com citation
The refund policy allows returns within 30 days [1]. Items must be unused [2].

[1] (clickable) → opens panel:
   Source: Refund Policy v3.2 (PDF, p.4)
   Excerpt: "Customers may return any item within 30 days of purchase..."
   Confidence: 95%
```

```typescript
// React component
function CitedResponse({ text, citations }) {
  const parts = text.split(/\[(\d+)\]/g);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    const cit = citations[parseInt(part) - 1];
    return (
      <Tooltip key={i} content={<CitationCard source={cit} />}>
        <a href={cit.url} className="citation">[{part}]</a>
      </Tooltip>
    );
  });
}
```

Why this matters:
- Trust. User verifies AI didn't hallucinate.
- Compliance (legal/medical AI need provenance).
- Engagement (user explora sources).

## Pattern 3: Retry & escape hatches

User pode disagree com response. Provide easy retry:

```typescript
<ResponseCard>
  <Text>{response.text}</Text>
  
  <Actions>
    <Button onClick={() => regenerate()}>
      🔄 Try again
    </Button>
    <Button onClick={() => regenerate({ temperature: 0.9 })}>
      🎲 More creative
    </Button>
    <Button onClick={() => regenerate({ shorter: true })}>
      ✂️ Shorter
    </Button>
    <Button onClick={() => editAndRetry()}>
      ✏️ Edit my prompt
    </Button>
    <Button onClick={() => copyToClipboard()}>
      📋 Copy
    </Button>
  </Actions>
  
  <Feedback>
    <Button onClick={() => thumbsUp()}>👍</Button>
    <Button onClick={() => thumbsDown()}>👎</Button>
  </Feedback>
</ResponseCard>
```

User feels control. Feedback flows to your eval dataset (Tier 2 card).

## Pattern 4: Confidence indicators

Tell user when AI is unsure:

```python
# Backend: ask LLM to self-rate
response = await client.messages.create(
    model="claude-sonnet-4-6",
    response_model=AnswerWithConfidence,
    messages=[{
        "role": "user",
        "content": f"""Answer the question. Also rate your confidence 1-5:
1 = very unsure (guessing)
5 = certain (verified from sources)

Question: {question}"""
    }]
)
```

```typescript
// Frontend
{response.confidence === 5 && <Badge color="green">High confidence</Badge>}
{response.confidence <= 2 && (
  <Badge color="yellow">
    ⚠️ Low confidence — verify before using
  </Badge>
)}
```

User calibrate trust.

## Pattern 5: Partial states

LLM output coming in chunks. Show partial UI immediately:

```typescript
// Email composer
const [draft, setDraft] = useState({ subject: "", body: "", recipients: [] });

async function generateEmail() {
  await streamingCall({
    onChunk: (chunk) => {
      // Parse partial JSON as it streams
      const partial = tryParsePartialJSON(accumulatedText);
      if (partial.subject) setDraft(d => ({ ...d, subject: partial.subject }));
      if (partial.body) setDraft(d => ({ ...d, body: partial.body }));
    }
  });
}

return (
  <div>
    <Input value={draft.subject} placeholder="Subject..." />
    <Textarea value={draft.body} placeholder="Body..." />
    {/* User can edit while it streams */}
  </div>
);
```

User não espera passive — interage com partial output.

## Pattern 6: Undo

For destructive AI actions:

```typescript
async function aiCreateInvoice(args) {
  const invoice = await api.createInvoice(args);
  
  showToast({
    message: "Invoice created.",
    action: {
      label: "Undo",
      onClick: async () => {
        await api.deleteInvoice(invoice.id);
        showToast({ message: "Invoice undone." });
      }
    },
    duration: 10000,  // 10s window
  });
}
```

User confidence em letting AI act. Without undo, user blocks AI from doing anything.

## Pattern 7: Explanations on demand

Don't over-explain. Let user ask:

```typescript
<ResponseCard>
  <Text>{response.text}</Text>
  
  <ExpandableSection title="Why this answer?">
    <ReasoningTrace>
      <Step>1. Searched docs for "refund"</Step>
      <Step>2. Found 5 relevant sections</Step>
      <Step>3. Ranked by relevance, top 3 selected</Step>
      <Step>4. Composed answer with citations</Step>
    </ReasoningTrace>
  </ExpandableSection>
</ResponseCard>
```

Default: clean. Expandable: full reasoning para power users.

## Pattern 8: Suggestion chips

Help user discover capability:

```typescript
<ChatInput>
  <Input />
  <Suggestions>
    <Chip onClick={() => setMsg("Summarize my last 5 emails")}>
      📧 Summarize emails
    </Chip>
    <Chip onClick={() => setMsg("Create invoice for John Smith")}>
      💰 Create invoice
    </Chip>
    <Chip onClick={() => setMsg("What's our refund policy?")}>
      ❓ Ask company FAQ
    </Chip>
  </Suggestions>
</ChatInput>
```

Reduce cold-start friction.

## Pattern 9: HITL — human approval UX

Quando AI needs confirmation (Tier 3 ai-agent-patterns), make easy:

```typescript
<ApprovalCard>
  <Title>AI wants to send email</Title>
  
  <Preview>
    To: john@customer.com
    Subject: Your invoice is ready
    
    Body: Hi John, your invoice for $1,200 is attached...
  </Preview>
  
  <Actions>
    <Button variant="primary" onClick={approve}>
      ✅ Send
    </Button>
    <Button onClick={editAndApprove}>
      ✏️ Edit & send
    </Button>
    <Button variant="ghost" onClick={reject}>
      ❌ Cancel
    </Button>
  </Actions>
</ApprovalCard>
```

Friction proportional to risk. Email: 1 click. Database delete: 2 confirmations + reason.

## Pattern 10: Empty states

When LLM has no info:

```typescript
// ❌ Bad
"I don't know."

// ✅ Good
<EmptyState
  icon="🔍"
  title="No matching info found"
  description="I couldn't find anything about that in your docs."
  suggestions={[
    "Try different keywords",
    "Upload relevant documents",
    "Contact human support"
  ]}
/>
```

User given path forward.

## Pattern 11: Conversation management

Chats acumulam history. Help user navigate:

```typescript
<Sidebar>
  <ConversationsList>
    {conversations.map(c => (
      <ConversationItem
        title={c.summary}  // AI-generated summary
        timestamp={c.lastActive}
        unread={c.hasNewMessages}
      />
    ))}
  </ConversationsList>
  
  <Actions>
    <Button onClick={newConversation}>+ New chat</Button>
  </Actions>
</Sidebar>

<Main>
  <ConversationHeader>
    <Title>{currentConversation.title}</Title>
    <Actions>
      <Button onClick={rename}>Rename</Button>
      <Button onClick={share}>Share</Button>
      <Button onClick={archive}>Archive</Button>
      <Button onClick={delete} variant="danger">Delete</Button>
    </Actions>
  </ConversationHeader>
  <Messages />
</Main>
```

ChatGPT, Claude.ai, Notion AI all do this.

## Pattern 12: Onboarding

First-time user needs to understand product capability:

```typescript
<OnboardingFlow>
  <Step>
    <Title>Welcome to AcmeAI</Title>
    <Demo>
      <video src="demo.mp4" autoPlay loop />
    </Demo>
    <Description>
      See how AcmeAI helps you draft emails, summarize meetings, and find docs.
    </Description>
  </Step>
  
  <Step>
    <Title>Connect your data</Title>
    <Connectors>
      <Connector logo={GoogleDriveLogo} name="Google Drive" />
      <Connector logo={SlackLogo} name="Slack" />
      <Connector logo={NotionLogo} name="Notion" />
    </Connectors>
  </Step>
  
  <Step>
    <Title>Try your first query</Title>
    <SuggestedQueries>
      {suggestions.map(s => <Chip onClick={() => trySuggestion(s)}>{s}</Chip>)}
    </SuggestedQueries>
  </Step>
</OnboardingFlow>
```

User gets to "wow" moment in <5min.

## Pattern 13: Error UX para LLM-specific failures

| Failure | UX |
|---------|-----|
| Rate limit | "I'm getting too many requests. Wait 30s." Show countdown. |
| Bad input | Highlight problematic part. Suggest fix. |
| Tool failed | "Tried to search, but database is unavailable. Want to retry?" |
| Output too long | Show partial + "Continue" button. |
| Generation timeout | Show partial + "Generation took too long. Want to retry with shorter response?" |
| Off-topic / refused | "I can't help with that. Try [related capability]." |

## Pattern 14: Cost-aware UX

Transparently show usage:

```typescript
<UsageIndicator>
  <ProgressBar value={used / limit} />
  <Text>{used} / {limit} messages this month</Text>
  {used > limit * 0.8 && (
    <Warning>
      ⚠️ 80% of monthly limit. <Link to="/upgrade">Upgrade</Link> for unlimited.
    </Warning>
  )}
</UsageIndicator>
```

User não surprise at month-end bill.

## Pattern 15: Tool use visibility

When agent uses tools, show:

```typescript
<MessageThread>
  <Message role="user">Find customer John Smith and check their order status</Message>
  
  <ToolCall>
    <Icon>🔍</Icon>
    <Description>Searching customers...</Description>
    {status === "complete" && <Result>Found 1 customer (ID: cust_abc123)</Result>}
  </ToolCall>
  
  <ToolCall>
    <Icon>📦</Icon>
    <Description>Checking order status...</Description>
    {status === "complete" && <Result>3 active orders</Result>}
  </ToolCall>
  
  <Message role="assistant">
    Found John Smith with 3 active orders:
    1. Order #1234 - Shipped (delivery 2 days)
    2. ...
  </Message>
</MessageThread>
```

Transparency = trust.

## Anti-patterns comuns

### 1. Hiding AI in product
Forçando user a pensar "is this AI?" — confusing. Be explicit.

### 2. Over-promising
"AI knows everything about your business" → fails on edge case → trust gone.

### 3. No way to fix wrong output
User saw bad answer → can't correct → won't try again.

### 4. Walls of text
LLM outputs verbose. UI shouldn't enable. Use formatting (lists, headings, code blocks).

### 5. Inconsistent voice
AI changes personality per query. Set system prompt for consistent tone.

### 6. No source attribution in RAG
"AI said X." User can't verify. Trust low.

### 7. Generic "Loading..."
Specific: "Searching 5 docs..." much better.

### 8. Ignoring response feedback
User says 👎 → nothing happens. Show acknowledgment. Use feedback to improve.

## Notable AI product UX examples (2026)

Study these for patterns:

- **Claude.ai** — clean, citations, project organization.
- **Perplexity** — gold standard for RAG citations.
- **Cursor** — code editor with AI inline.
- **Linear AI** — terse, action-oriented.
- **Notion AI** — embedded into existing UI.
- **Figma AI** — selective enhancement vs replacement.
- **GitHub Copilot Chat** — context-aware suggestions.

What they share:
- Streaming everywhere.
- Stop button visible.
- Citations/sources.
- Easy retry.
- Cost/usage indicator.
- Settings for power users.

## Designing for new vs experienced users

**New user**:
- Suggestion chips.
- Onboarding.
- Limited options visible.
- Default safe settings.

**Experienced user**:
- Keyboard shortcuts.
- Advanced settings exposed.
- Power features (custom prompts, raw API access).
- API for programmatic access.

Tiered UI based on usage.

## Accessibility

LLM apps especially benefit from a11y:

- Screen reader: announce when streaming completes ("Response complete").
- Keyboard nav: tab through all actions.
- Color contrast: WCAG AA minimum.
- Focus states clear.
- Alt text for AI-generated images.

## Mobile considerations

LLM apps em mobile:
- Voice input (Whisper).
- Streaming smooth even em slow networks.
- Tap targets ≥44px.
- Keyboard avoidance for input.
- Pull-to-refresh para re-generate.

## A/B testing UX

```typescript
// Tier 4 deployment patterns apply
const variant = abTest("retry-button-text", ["Try again", "Regenerate"]);

<Button>{variant === "A" ? "Try again" : "Regenerate"}</Button>
```

Measure: click rate, satisfaction, retention. Iterate.

## Checklist — AI product UX

- [ ] Streaming everywhere user-facing?
- [ ] Stop button always visible during streaming?
- [ ] Citations clicáveis quando RAG/tool use?
- [ ] Retry options (regenerate, edit, alternate)?
- [ ] Confidence indicators quando relevant?
- [ ] Empty states informativos?
- [ ] HITL approval UX clear?
- [ ] Conversation management (history, rename, archive)?
- [ ] Cost/usage transparency?
- [ ] Tool calls visible quando agentic?
- [ ] Onboarding para new users?
- [ ] Error states com path forward?
- [ ] Feedback mechanism (👍👎)?
- [ ] Accessibility (a11y) considered?

## Leituras

- Anthropic Design System (docs.anthropic.com/design)
- "Designing Conversational Interfaces" — Cathy Pearl
- Claude.ai, Perplexity, ChatGPT — analyze patterns
- Nielsen Norman Group AI UX research
- "AI UX Patterns" — Lou Downe, GDS
- Vercel AI SDK examples
- "Beyond the Chatbot" — design beyond conversational
