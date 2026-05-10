---
title: Agent Patterns 2026 — ReAct, Plan-and-Execute, State Machines
category: agentes-ia
stack: [agents, ReAct, planning, state-machines, MCP]
tags: [agent-patterns, react, plan-execute, reflexion, thin-agent]
excerpt: "Patterns que funcionam em agents production — ReAct, Plan-and-Execute, Reflexion, agentic loop, state machines, thin agent + thick tools, recovery."
related: [ai-agent-architecture, ai-mcp-building, agent-memory-patterns, multi-agent-orchestration]
updated: "2026-05-10"
---

## Realismo sobre agents em 2026

Em 2023-2024, "agent" virou hype. Empresas demos com auto-gpt, agents que fazem tudo. Em produção: 90% falham silenciosamente, custam fortuna, e usuários abandonam.

Em 2026, agents PRODUCTION-GRADE seguem padrões maduros:
- **Thin agents** (LLM faz pouco, tools fazem muito).
- **State machines** (não loops infinitos).
- **Recovery patterns** (errors são esperados, não exceções).
- **Bounded autonomy** (agent decide pequenas coisas, humano confirma grandes).
- **MCP for tool integration** (not custom plugin formats).

Esse card cobre patterns que ganham em produção, sem hype.

## "Quando usar agent" — decisão crítica

```
Task é deterministic? → NÃO use agent. Use código.
Task tem 1-2 steps? → NÃO use agent. Use prompt chain.
Task precisa adapt to runtime? → Talvez agent.
Task tem 5+ steps unknown a priori? → Agent.
Task pode tolerar 80% success? → Agent OK.
Task precisa 99.9% reliability? → NÃO agent. Use code com LLM-augmented.
```

Agent = LLM decidindo o que fazer next baseado em context. **Não é silver bullet.**

## Pattern 1: ReAct (Reasoning + Acting)

Pattern clássico (Yao et al. 2022). Loop: Thought → Action → Observation → Thought → ...

```python
async def react_agent(query: str, tools: list, max_iters: int = 10):
    messages = [{"role": "user", "content": query}]
    
    for iteration in range(max_iters):
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            tools=tools,
            messages=messages,
        )
        
        messages.append({"role": "assistant", "content": response.content})
        
        if response.stop_reason == "end_turn":
            # Agent decided to stop
            text_blocks = [b.text for b in response.content if b.type == "text"]
            return "\n".join(text_blocks)
        
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    try:
                        result = await execute_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result)
                        })
                    except Exception as e:
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": f"Error: {str(e)}",
                            "is_error": True,
                        })
            
            messages.append({"role": "user", "content": tool_results})
    
    return "Max iterations reached without completion."
```

**Pros:**
- Simples de implementar.
- LLM decide flow dinamicamente.

**Cons:**
- Pode loop infinito (mitigado por max_iters).
- Token cost cresce com iterações.
- LLM pode "thinkings" excessivos antes de agir.

Use para: tasks com 3-7 steps, queries variáveis.

## Pattern 2: Plan-and-Execute

LLM planeja TUDO antes de executar. Mais previsível.

```python
async def plan_and_execute(query: str, tools: list):
    # 1. Generate plan
    plan_response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": f"""Decompose this task into atomic steps.
Each step should use one of these tools: {[t['name'] for t in tools]}.
Output JSON: {{"steps": [{{"description": str, "tool": str, "args": dict}}]}}

Task: {query}"""
        }]
    )
    plan = json.loads(plan_response.content[0].text)
    
    # 2. Execute each step
    results = []
    for step in plan["steps"]:
        try:
            result = await execute_tool(step["tool"], step["args"])
            results.append({"step": step, "result": result})
        except Exception as e:
            # Decide replan vs fail
            replan_response = await replan(query, results, error=str(e))
            if replan_response["action"] == "continue":
                # Use modified plan
                pass
            else:
                return {"error": "Plan failed", "completed": results}
    
    # 3. Synthesize final answer
    final = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Synthesize results.
Task: {query}
Steps + Results: {results}"""
        }]
    )
    return final.content[0].text
```

**Pros:**
- Plan inspectable antes de execution.
- Cost predictable (steps known).
- Fácil intervir humano (approve plan).

**Cons:**
- Plan pode estar errado (LLM imagine wrong sequence).
- Não adapta well a unexpected observations.

Use para: tasks well-structured, where plan visible importa.

## Pattern 3: Reflexion (self-correction)

Agent executa, avalia próprio output, refina.

```python
async def reflexion_agent(query: str, tools: list, max_iters: int = 3):
    history = []
    
    for iteration in range(max_iters):
        # Execute
        result = await execute_attempt(query, tools, history)
        
        # Self-evaluate
        evaluation = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""Evaluate this attempt at the task.
Task: {query}
Attempt: {result}

Was this correct? What went wrong? What to do differently?

Output JSON: {{"success": bool, "lessons": [str]}}"""
            }]
        )
        eval_data = json.loads(evaluation.content[0].text)
        
        if eval_data["success"]:
            return result
        
        # Add lessons to history for next iter
        history.append({
            "attempt": iteration,
            "result": result,
            "lessons": eval_data["lessons"],
        })
    
    return f"Max iterations. Best attempt: {history[-1]['result']}"
```

**Pros:**
- Agent improves with retries.
- Better em tasks com binary success criterion.

**Cons:**
- Multiplica cost por max_iters.
- Self-evaluation pode estar errado.

Use para: code generation, math, tasks com clear success criteria.

## Pattern 4: Thin Agent + Thick Tools

**O pattern mais importante em 2026.**

Em vez de LLM tentar fazer tudo, encapsula logic complex em tools. LLM só **roteia**.

```python
# ❌ Thick agent (LLM faz tudo)
agent_prompt = """
Você é um assistente. Para cada query:
1. Parse user intent.
2. Validate authorization.
3. Query database (sintaxe SQL correta).
4. Format result.
5. Respond.
"""

# ✅ Thin agent + thick tools
tools = [
    {
        "name": "search_customers",
        "description": "Search customers by name, email, or phone",
        "input_schema": {"type": "object", "properties": {"query": {"type": "string"}}}
    },
    {
        "name": "create_invoice",
        "description": "Create invoice. Requires customer_id and items.",
        "input_schema": {...}
    },
    # ... cada tool encapsula validation + DB + formatting
]

agent_prompt = "You are an assistant. Use tools to help users."
```

**Vantagens**:
- Tools são unit-testable (Python code, deterministic).
- LLM erra menos (não tem que se preocupar com SQL).
- Authorization, validation, audit happen em tool (predictable).
- Custo menor (LLM short prompt).
- Performance melhor (tool em código nativo, não LLM).

**Desvantagens**:
- Cada tool tem fixed interface. Menos flexibility.
- More upfront engineering effort.

Para production agents, este pattern é **default recommended**.

## Pattern 5: State Machine Agent

Para multi-turn agents complex, estrutura como state machine explícito.

```python
from enum import Enum

class State(Enum):
    GREETING = "greeting"
    INTENT_CLASSIFICATION = "intent_classification"
    GATHERING_INFO = "gathering_info"
    EXECUTING = "executing"
    CONFIRMING = "confirming"
    DONE = "done"

class StatefulAgent:
    def __init__(self):
        self.state = State.GREETING
        self.context = {}
    
    async def step(self, user_input: str) -> str:
        if self.state == State.GREETING:
            self.state = State.INTENT_CLASSIFICATION
            return await self.classify_intent(user_input)
        
        elif self.state == State.INTENT_CLASSIFICATION:
            intent = await self.classify(user_input)
            self.context["intent"] = intent
            self.state = State.GATHERING_INFO
            return await self.ask_for_info(intent)
        
        elif self.state == State.GATHERING_INFO:
            info_complete = await self.extract_info(user_input, self.context)
            if info_complete:
                self.state = State.EXECUTING
                return await self.execute()
            else:
                return await self.ask_missing()
        
        elif self.state == State.EXECUTING:
            result = await self.do_action(self.context)
            self.context["result"] = result
            self.state = State.CONFIRMING
            return await self.confirm_with_user(result)
        
        # ...
```

Vantagens:
- Predictable transitions.
- Easy to debug (log state changes).
- Easy to add HITL (state CONFIRMING pauses for human).

Frameworks que ajudam: **LangGraph** (Tier 3 node `ai-langgraph-prod`).

## Pattern 6: Hierarchical (Supervisor + Workers)

Agent supervisor delegates a sub-agents specialized.

```python
async def supervisor(query: str):
    # Classify task type
    task_type = await classify_task(query)
    
    if task_type == "research":
        return await research_agent(query)
    elif task_type == "code":
        return await code_agent(query)
    elif task_type == "schedule":
        return await scheduling_agent(query)
```

Each sub-agent has own tools, prompt, state.

Ver `multi-agent-orchestration`.

## Pattern 7: Bounded Autonomy

Critical: define what agent can do vs what needs human approval.

```python
TOOL_PERMISSIONS = {
    "search_database": {"auto": True},
    "send_email": {"auto": False, "requires_approval": True},
    "create_invoice": {"auto": False, "requires_approval": True, "approver": "manager"},
    "transfer_funds": {"auto": False, "requires_approval": True, "approver": "executive"},
}

async def execute_tool_with_approval(tool_name, args, user):
    perm = TOOL_PERMISSIONS[tool_name]
    if perm["auto"]:
        return await execute(tool_name, args)
    
    # Pause for approval
    approval_request = await create_approval_request(
        tool=tool_name,
        args=args,
        approver=perm.get("approver", user.id),
        agent_reasoning=...,
    )
    
    # Block until approved
    approved = await wait_for_approval(approval_request.id)
    if approved:
        return await execute(tool_name, args)
    else:
        return {"error": "Action denied by human"}
```

## Tool Definition Best Practices

### 1. Description matters MORE than name

```python
# ❌ Bad
{"name": "search", "description": "Search."}

# ✅ Good
{
    "name": "search_customers",
    "description": """Search customer records by name, email, or phone number.
    Returns up to 10 matching customers with id, name, email, phone, account_status.
    Use when user asks to find or look up customer info."""
}
```

LLM uses description to decide if/when to call. Be specific.

### 2. Strict input schemas

```python
{
    "name": "create_invoice",
    "description": "Create new invoice for customer.",
    "input_schema": {
        "type": "object",
        "properties": {
            "customer_id": {"type": "string", "pattern": "^cust_[A-Z0-9]{12}$"},
            "items": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "string"},
                        "quantity": {"type": "integer", "minimum": 1},
                        "unit_price": {"type": "number", "minimum": 0}
                    },
                    "required": ["product_id", "quantity", "unit_price"]
                }
            },
            "currency": {"type": "string", "enum": ["BRL", "USD", "EUR"]},
        },
        "required": ["customer_id", "items", "currency"]
    }
}
```

Strict schema = LLM erra menos. Validation acontece automatically (OpenAI strict mode, Anthropic tool use validation).

### 3. Idempotent tools

Tool retry quando network falha. Idempotent = safe to retry.

```python
# ❌ Not idempotent
async def create_invoice(customer_id, items):
    invoice = await db.create_invoice(...)  # creates duplicate if retried
    return invoice.id

# ✅ Idempotent
async def create_invoice(customer_id, items, idempotency_key=None):
    if idempotency_key:
        existing = await db.find_invoice_by_key(idempotency_key)
        if existing:
            return existing.id
    
    invoice = await db.create_invoice(..., idempotency_key=idempotency_key)
    return invoice.id
```

### 4. Error handling explicit

```python
async def search_customers(query: str):
    try:
        results = await db.search(query)
        if not results:
            return {"status": "no_results", "message": f"No customers found matching '{query}'"}
        return {"status": "success", "results": results}
    except DatabaseError as e:
        return {"status": "error", "message": "Database temporarily unavailable. Try again."}
    except Exception as e:
        log.exception("search_customers_failed", query=query)
        return {"status": "error", "message": "Internal error."}
```

LLM lê error message e adapta — vs raw exception que sequer chegar at agent.

## Memory patterns

### Conversation memory

```python
class ConversationMemory:
    def __init__(self):
        self.messages = []
    
    def add(self, role, content):
        self.messages.append({"role": role, "content": content})
    
    def get_context(self, max_tokens: int = 4000):
        """Truncate to recent messages within budget."""
        relevant = []
        token_count = 0
        for msg in reversed(self.messages):
            msg_tokens = estimate_tokens(msg["content"])
            if token_count + msg_tokens > max_tokens:
                break
            relevant.insert(0, msg)
            token_count += msg_tokens
        return relevant
```

### Summary memory

For very long conversations, summarize older messages:

```python
async def get_compressed_context(self):
    if len(self.messages) < 20:
        return self.messages
    
    # Summarize older
    older = self.messages[:-10]
    summary = await client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": f"Summarize this conversation in 3 sentences:\n{older}"
        }]
    )
    
    return [
        {"role": "user", "content": f"Previous conversation summary: {summary}"},
    ] + self.messages[-10:]
```

### Vector memory (semantic recall)

Store messages as embeddings, retrieve relevant ones:

```python
async def remember_relevant(self, query: str, k: int = 5):
    query_emb = await embed(query)
    relevant = await vector_search_memory(query_emb, k=k)
    return relevant
```

Ver card `agent-memory-patterns`.

## Recovery patterns

### Retry with backoff

```python
async def call_tool_with_retry(name, args, max_attempts=3):
    for attempt in range(max_attempts):
        try:
            return await execute_tool(name, args)
        except TransientError as e:
            if attempt < max_attempts - 1:
                await asyncio.sleep(2 ** attempt)
            else:
                raise
        except PermanentError:
            raise  # don't retry
```

### Graceful degradation

```python
async def search_with_fallback(query: str):
    try:
        return await semantic_search(query)
    except Exception as e:
        log.warning("semantic_search_failed_fallback_keyword")
        return await keyword_search(query)
```

### Circuit breaker

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failures = 0
        self.last_failure_time = None
        self.threshold = failure_threshold
        self.timeout = recovery_timeout
    
    async def call(self, fn, *args, **kwargs):
        if self.is_open():
            raise CircuitBreakerOpen()
        
        try:
            result = await fn(*args, **kwargs)
            self.failures = 0  # reset on success
            return result
        except Exception:
            self.failures += 1
            self.last_failure_time = time.time()
            raise
    
    def is_open(self):
        if self.failures < self.threshold:
            return False
        if time.time() - self.last_failure_time > self.timeout:
            self.failures = 0  # recovery
            return False
        return True
```

## Logging & observability

```python
import structlog
log = structlog.get_logger()

async def agent_step(state, user_input):
    log.info("agent_step_start", state=state.name, input=user_input)
    
    response = await llm_call(...)
    log.info("agent_step_llm_response",
        tokens=response.usage.input_tokens + response.usage.output_tokens,
        tools_called=[b.name for b in response.content if b.type == "tool_use"],
    )
    
    for tool_call in tool_calls:
        log.info("tool_call_start", tool=tool_call.name, args=tool_call.input)
        try:
            result = await execute_tool(tool_call.name, tool_call.input)
            log.info("tool_call_success", tool=tool_call.name, result_summary=truncate(result))
        except Exception as e:
            log.error("tool_call_failed", tool=tool_call.name, error=str(e))
            raise
```

Use LangSmith ou Langfuse pra dashboards (ver Tier 4 `ai-observability`).

## Common pitfalls

### 1. Agent loops indefinitely
Max iters não set. Tool retorna ambíguo → LLM tenta novamente forever.

### 2. Agent has too many tools
50 tools = LLM confuso, ranks errado. Mantenha < 15. Use sub-agents.

### 3. Tool descriptions vague
"search()" — LLM não sabe quando usar. Write detailed descriptions.

### 4. Não handles tool errors
Tool throws → agent crashes. Return error string em tool body.

### 5. Sem HITL para destructive actions
Agent deleta dados production. Sem approval gate. Disastre.

### 6. Sem eval
Agent feels good em demo, fails em diverse user inputs. Eval com golden dataset (Tier 2 card).

## Frameworks comparison

| Framework | Strengths | When |
|-----------|-----------|------|
| **None (SDK direto)** | Full control, no abstraction tax | Production prod |
| **LangGraph** | State machines, HITL native, persistence | Complex flows |
| **CrewAI** | Multi-agent collaborative | Multi-agent specifically |
| **AutoGen** | Microsoft, research-oriented | Research/exploration |
| **AnthropicAgentSDK** | Claude-native, hooks, slash commands | Claude-only apps |

Para production-grade simples: SDK direto + Pydantic + uvloop. Para complex multi-step: LangGraph. Para multi-agent: CrewAI ou supervisor pattern manual.

## Checklist — agent production

- [ ] Thin agent + thick tools pattern?
- [ ] Max iterations capped?
- [ ] Tool errors retornam strings, não throws?
- [ ] Idempotent tools onde possível?
- [ ] HITL para destructive actions?
- [ ] Logging estruturado per step?
- [ ] Eval suite (Tier 2)?
- [ ] Memory strategy escolhida (none/conv/summary/vector)?
- [ ] Recovery patterns (retry, fallback, circuit breaker)?
- [ ] Cost monitoring per agent run?

## Leituras

- "ReAct: Synergizing Reasoning and Acting" — Yao et al. 2022
- "Reflexion" paper — Shinn et al. 2023
- Anthropic Building Effective Agents (anthropic.com/engineering/building-effective-agents)
- LangGraph docs (langchain-ai.github.io/langgraph)
- "Agents" — Chip Huyen blog post
- Eugene Yan blog (eugeneyan.com) on agent patterns
- "12-factor agents" — humanloop.com
