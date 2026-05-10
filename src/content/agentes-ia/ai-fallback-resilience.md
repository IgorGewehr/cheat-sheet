---
title: Fallback & Resilience — Multi-Provider, Circuit Breakers, Retry
category: agentes-ia
stack: [resilience, fallback, retry, circuit-breakers, multi-provider]
tags: [resilience, fallback, retry, circuit-breaker, multi-provider]
excerpt: "Apps LLM em prod precisam funcionar mesmo com providers caindo — circuit breakers, multi-provider fallback (Anthropic → OpenAI → local), retry com backoff, async queue."
related: [ai-openai-vs-anthropic, ai-cost-optimization, ai-latency-budgets]
updated: "2026-05-10"
---

## Por que resilience é mandatory

LLM providers caem. Anthropic teve outages 99.9% SLA mas você faz parte do 0.1%. OpenAI rate-limit em horários pico. GPU quotas hit. Networks fail.

Sem resilience, app down quando provider down. Users abandonam. Receita drops.

Resilience patterns:
1. **Retry com backoff** — para transient errors.
2. **Circuit breaker** — para systemic failures.
3. **Multi-provider fallback** — provider A → B → C.
4. **Graceful degradation** — partial response > full failure.
5. **Async queue** — para retry async.

## Tipos de errors

```python
from anthropic import APIError, RateLimitError, APIConnectionError, APITimeoutError

# Transient (retry):
# - APIConnectionError (network)
# - APITimeoutError (slow response)
# - RateLimitError (429)
# - APIStatusError 500-503

# Permanent (don't retry):
# - AuthenticationError (invalid key)
# - APIStatusError 400 (bad request)
# - APIStatusError 401, 403 (auth)
# - APIStatusError 422 (validation)
```

Treat differently.

## Pattern 1: Retry with backoff

```python
import asyncio
from anthropic import RateLimitError, APITimeoutError, APIConnectionError

async def call_with_retry(messages: list, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=messages,
            )
        except (RateLimitError, APITimeoutError, APIConnectionError) as e:
            if attempt == max_retries - 1:
                raise
            
            # Exponential backoff with jitter
            delay = (2 ** attempt) + (random.random() * 0.5)
            await asyncio.sleep(delay)
        # Don't retry on permanent errors (let them propagate)
```

### Use library — tenacity

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)
import logging

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((RateLimitError, APIConnectionError, APITimeoutError)),
    before_sleep=before_sleep_log(logging.getLogger(), logging.WARNING),
)
async def call_anthropic(messages: list):
    return await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=messages,
    )
```

### Honor rate limit retry-after

```python
async def call_with_smart_retry(messages: list, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return await client.messages.create(...)
        except RateLimitError as e:
            # Anthropic envia retry-after no header
            retry_after = float(e.response.headers.get("retry-after", 2 ** attempt))
            log.warning("rate_limited", retry_after=retry_after)
            await asyncio.sleep(retry_after)
```

## Pattern 2: Circuit Breaker

Quando provider está down, parar de tentar (não desperdiça latency):

```python
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"      # normal
    OPEN = "open"          # falhando, não tenta
    HALF_OPEN = "half_open"  # testando recovery

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception,
    ):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    async def call(self, fn, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpen(f"Circuit open until {self.recovery_timeout}s after last failure")
        
        try:
            result = await fn(*args, **kwargs)
            if self.state == CircuitState.HALF_OPEN:
                # Recovery successful
                self.state = CircuitState.CLOSED
                self.failure_count = 0
            return result
        
        except self.expected_exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                log.warning("circuit_breaker_open", failures=self.failure_count)
            
            raise

# Usage
anthropic_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)

async def call_anthropic_protected(messages):
    return await anthropic_breaker.call(call_anthropic, messages)
```

Quando circuit abre → fallback rapidamente sem 5x retries × 5x timeout.

## Pattern 3: Multi-Provider Fallback

```python
class LLMRouter:
    def __init__(self):
        self.anthropic = AsyncAnthropic()
        self.openai = AsyncOpenAI()
        
        self.anthropic_breaker = CircuitBreaker(failure_threshold=3)
        self.openai_breaker = CircuitBreaker(failure_threshold=3)
    
    async def call(self, messages, system: str, **kwargs):
        # Try primary
        try:
            return await self.anthropic_breaker.call(
                self._call_anthropic, messages, system, **kwargs
            )
        except (CircuitBreakerOpen, APIError) as e:
            log.warning("anthropic_failed_fallback_openai", error=str(e))
        
        # Fallback to OpenAI
        try:
            return await self.openai_breaker.call(
                self._call_openai, messages, system, **kwargs
            )
        except (CircuitBreakerOpen, APIError) as e:
            log.error("all_providers_failed", error=str(e))
            raise AllProvidersFailedError("All providers down")
    
    async def _call_anthropic(self, messages, system, **kwargs):
        response = await self.anthropic.messages.create(
            model="claude-sonnet-4-6",
            system=system,
            messages=messages,
            max_tokens=kwargs.get("max_tokens", 1024),
        )
        return {
            "text": response.content[0].text,
            "provider": "anthropic",
            "model": "claude-sonnet-4-6",
            "usage": response.usage,
        }
    
    async def _call_openai(self, messages, system, **kwargs):
        full_messages = [{"role": "system", "content": system}] + messages
        response = await self.openai.chat.completions.create(
            model="gpt-4o",
            messages=full_messages,
            max_tokens=kwargs.get("max_tokens", 1024),
        )
        return {
            "text": response.choices[0].message.content,
            "provider": "openai",
            "model": "gpt-4o",
            "usage": response.usage,
        }
```

### Fallback considerations

- **Model differences**: Sonnet ≠ GPT-4o. Output style/quality varies. Test fallback responses pra ensure acceptable.
- **Costs**: fallback provider may be more expensive. Monitor cost shift.
- **Latency**: fallback adds latency. Circuit breaker prevents trying broken provider.

### Triple fallback

```python
async def call_with_triple_fallback(messages, system):
    providers = [
        ("anthropic", call_anthropic),
        ("openai", call_openai),
        ("local_llama", call_local_llm),  # self-hosted Llama via vLLM
    ]
    
    for name, fn in providers:
        try:
            return await breakers[name].call(fn, messages, system)
        except (CircuitBreakerOpen, APIError) as e:
            log.warning(f"provider_{name}_failed", error=str(e))
            continue
    
    # Last resort: cached response or error
    return {"text": "Service temporarily unavailable. Try again shortly.", "fallback": True}
```

## Pattern 4: Graceful Degradation

Falha total > falha parcial.

```python
async def chat_with_degradation(message: str):
    """Try ideal experience, fallback to simpler if needed."""
    try:
        # Full: RAG + reasoning
        return await full_rag_response(message)
    except Exception as e:
        log.warning("full_rag_failed_fallback_basic", error=str(e))
    
    try:
        # Degrade: basic LLM no RAG
        return await basic_llm_response(message)
    except Exception as e:
        log.error("basic_llm_failed", error=str(e))
    
    # Last resort: static helpful message
    return {
        "text": "I'm experiencing issues. Please rephrase or try again later.",
        "degraded": True
    }
```

User vê algo útil em vez de erro.

## Pattern 5: Async Queue para retry

Para non-critical tasks, queue + retry async:

```python
import asyncio
from collections import deque

class LLMQueue:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.processing = False
    
    async def enqueue(self, task: dict):
        await self.queue.put(task)
        if not self.processing:
            asyncio.create_task(self.process())
    
    async def process(self):
        self.processing = True
        while not self.queue.empty():
            task = await self.queue.get()
            try:
                result = await self._call_with_retry(task)
                await self._notify_completion(task["id"], result)
            except Exception as e:
                log.error("task_failed_after_retries", task=task, error=str(e))
                await self._notify_failure(task["id"], str(e))
        self.processing = False
```

Production: use **Celery**, **RQ**, **Inngest**, ou **Trigger.dev** for queues.

### Example: Inngest workflow

```typescript
// Inngest function
export const processUserQuery = inngest.createFunction(
  { id: "process-llm-query", retries: 3 },
  { event: "user/query.submitted" },
  async ({ event, step }) => {
    const result = await step.run("call-llm", async () => {
      return await callLLMWithFallback(event.data.message);
    });
    
    await step.run("save-result", async () => {
      await db.saveResult(event.data.userId, result);
    });
    
    await step.run("notify-user", async () => {
      await notifyUser(event.data.userId, result);
    });
    
    return result;
  }
);
```

Inngest handles retries, exponential backoff, dead-letter queue automatically.

## Health checks

```python
class LLMHealthChecker:
    async def check_anthropic(self) -> bool:
        try:
            await asyncio.wait_for(
                self.anthropic.messages.create(
                    model="claude-haiku-4-5",
                    max_tokens=10,
                    messages=[{"role": "user", "content": "ping"}],
                ),
                timeout=5,
            )
            return True
        except:
            return False
    
    async def check_openai(self) -> bool:
        try:
            await asyncio.wait_for(
                self.openai.chat.completions.create(
                    model="gpt-4o-mini",
                    max_tokens=10,
                    messages=[{"role": "user", "content": "ping"}],
                ),
                timeout=5,
            )
            return True
        except:
            return False

@app.get("/health/llm")
async def health():
    checker = LLMHealthChecker()
    return {
        "anthropic": await checker.check_anthropic(),
        "openai": await checker.check_openai(),
        "circuit_breaker_anthropic": anthropic_breaker.state.value,
        "circuit_breaker_openai": openai_breaker.state.value,
    }
```

Monitor health dashboard. Alert pra circuit-breaker-open.

## Provider status pages

- Anthropic: status.anthropic.com
- OpenAI: status.openai.com
- AWS Bedrock: health.aws.amazon.com
- Google Vertex: status.cloud.google.com
- Azure: status.azure.com

Subscribe RSS or webhook em status changes. Adjust provider priorities accordingly.

### Automated status check

```python
async def auto_route_based_on_status():
    """Periodically check providers, route to healthy."""
    anthropic_ok = await check_anthropic_status()
    openai_ok = await check_openai_status()
    
    if anthropic_ok:
        primary = "anthropic"
    elif openai_ok:
        primary = "openai"
        log.warning("anthropic_down_using_openai_primary")
    else:
        primary = "local"  # last resort
        log.error("both_cloud_providers_down")
    
    settings.PRIMARY_PROVIDER = primary
```

## Timeout strategy

```python
# Per-call timeouts
async def call_with_timeout(fn, *args, timeout: float = 30.0):
    try:
        return await asyncio.wait_for(fn(*args), timeout=timeout)
    except asyncio.TimeoutError:
        log.error("llm_call_timeout", timeout=timeout)
        raise APITimeoutError(f"Exceeded {timeout}s timeout")
```

Tiered timeouts:
- Fast classification: 5s.
- Standard chat: 30s.
- Long generation: 60s.
- Extended thinking: 120s.

Aggressive timeout reduces user wait when provider slow.

## Stale-while-revalidate

Para data-fetching workflows:

```python
@cache(ttl=300, stale_ttl=3600)
async def get_user_summary(user_id: str):
    return await generate_user_summary_llm(user_id)
```

- Cache válido 5min.
- Após 5min, return stale + refresh em background.
- Após 1h, force refresh.
- Provider down? Return stale (better than error).

## Anti-patterns

### 1. Sem timeout
LLM call pode hang forever. Sempre timeout.

### 2. Retry infinito
Infinite retries em transient = DoS de você mesmo. Max retries 3.

### 3. Retry em errors permanentes
Re-tentar 401 errors. Disrespect rate limits. Triggera ban.

### 4. Fallback model muito diferente
Sonnet → Haiku fallback ruim em complex tasks. User confuso.

### 5. Sem circuit breaker
Provider down → 5 minutes of failed retries × 5s timeouts × 100 requests = bad latency.

### 6. Mix síncrono/assíncrono retry
Blocking event loop. Use async retry.

## Monitoring metrics

Track:
- **Error rate** por provider.
- **Retry rate** (% requests requiring retry).
- **Fallback rate** (% requests using fallback provider).
- **Circuit breaker state** (open/closed/half-open) per provider.
- **Latency p99** per provider.
- **Cost shift** when fallback active.

Dashboard:
```
[Anthropic]  ━━━━━━━━━━━━━━━━━━━━ 99.7% (closed)
[OpenAI]     ━━━━━━━━━━━━━━━━━━━━ 99.8% (closed)
[Local Llama]━━━━━━━━━━━━━━━━━━━━ 100% (closed)

Fallback rate last 24h: 0.3%
Retry rate last 24h: 1.2%
```

## Testing resilience

### Chaos engineering

```python
async def chaos_test_provider_outage():
    """Simulate Anthropic down, validate fallback works."""
    with mock.patch("anthropic.AsyncAnthropic.messages.create", side_effect=APIError("Simulated outage")):
        result = await call_llm_with_fallback("test")
        assert result["provider"] == "openai"
        assert result["fallback"] == True
```

### Load testing

```bash
# Use locust ou k6
locust -f loadtest.py --users=100 --spawn-rate=10
```

Sob load, latência cresce, rate limits hit, retries kick in. Validar gracefulness.

## Cost de resilience

Fallback adds:
- Extra LLM calls (retry).
- Different provider (often more expensive).
- Engineering effort (maintain breakers, monitoring).

ROI: app uptime. Calculate revenue lost durante outage. Resilience usually pays off em < 1 outage prevented.

## Provider selection for resilience

When choosing providers:
- **Multiple regions** offered? (Anthropic AWS, OpenAI Azure).
- **SLA published**? (Anthropic 99.9%, OpenAI varies by tier).
- **Status page transparent**?
- **Bedrock/Azure/Vertex** offer same model via cloud (multi-cloud).

Setup: Anthropic native + Bedrock Anthropic + Azure OpenAI = 3 paths para Claude+GPT.

## Checklist — resilient app

- [ ] Retry com exponential backoff?
- [ ] Distinguish transient vs permanent errors?
- [ ] Circuit breaker per provider?
- [ ] Multi-provider fallback chain?
- [ ] Graceful degradation (RAG → basic LLM → static)?
- [ ] Async queue para retry (Inngest/Celery)?
- [ ] Health checks em endpoint?
- [ ] Status pages monitored?
- [ ] Timeouts apropriados per task?
- [ ] Chaos tests em CI?
- [ ] Monitoring dashboard com error/retry/fallback rates?

## Leituras

- "Release It!" — Michael Nygard (circuit breakers, bulkheads)
- Tenacity docs (retry library)
- "Building Reliable Systems" — multiple posts
- Anthropic, OpenAI SLA docs
- Inngest / Trigger.dev / Temporal docs
- "Chaos Engineering" — Netflix book
- "The Twelve-Factor App" — heroku.com/12factor
