---
title: Structured Output — JSON Mode, Instructor, Outlines
category: agentes-ia
stack: [Pydantic, Instructor, Outlines, JSON Schema]
tags: [structured-output, json, pydantic, instructor, function-calling]
excerpt: "Garantir output em schema estrito — JSON mode, function calling como validador, Pydantic + Instructor, Outlines pra constrained generation."
related: [ai-py-async, ai-openai-vs-anthropic, ai-eval-driven-dev]
updated: "2026-05-10"
---

## Por que isso importa

LLM tradicional retorna texto livre. App em produção precisa **schema garantido**:

- Tipo correto (string, number, enum, array).
- Required fields presentes.
- Sem extra fields imprevisíveis.
- Parseable sem regex.

Sem structured output garantido, você gasta 30-50% do código tratando edge cases ("e se o LLM responder em prosa?" "e se faltou campo X?").

## Approaches — 4 níveis de garantia

| Nível | Approach | Garantia |
|-------|----------|----------|
| **1. Prompt-only** | "Retorne JSON com keys X, Y, Z" | ~80% sucesso. Frequente erro. |
| **2. JSON mode** | API force JSON-valid output | ~95% sucesso. Schema não garantido. |
| **3. Function calling** | Schema como tool, LLM "chama" | ~98% sucesso. Schema enforced. |
| **4. Constrained generation** | Token-level constraints (Outlines, llama.cpp grammars) | 100% sucesso. Self-hosted. |

Use o mais alto que sua stack permite.

## Approach 1: Prompt-only (avoid quando possível)

```python
prompt = """Extraia informação do email abaixo. Retorne JSON com:
- sender (string)
- subject (string)
- urgency (low|medium|high)

Email:
{email}

JSON:
"""

response = await llm.complete(prompt)
data = json.loads(response.text)  # frequentemente falha
```

**Problemas**:
- LLM adiciona markdown (```json ... ```).
- Prosa antes/depois.
- Trailing commas, quotes erradas.
- Campo extra ou faltando.

Para legacy apps, último recurso. Force JSON mode se disponível.

## Approach 2: JSON Mode

API garante output é JSON válido (parseable). Schema NÃO é enforced.

### OpenAI

```python
response = await gpt.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Retorne JSON com sender, subject, urgency."},
        {"role": "user", "content": email},
    ],
    response_format={"type": "json_object"},
)
data = json.loads(response.choices[0].message.content)
```

### Anthropic (workaround: prefill)

Claude não tem "JSON mode" oficial, mas você pode prefill resposta com `{`:

```python
response = await claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": f"Extract info from: {email}"},
        {"role": "assistant", "content": "{"},  # prefill
    ],
)
data = json.loads("{" + response.content[0].text)
```

Ou use `stop_sequences=["}"]` e adicione `}` no final. Mas function calling é melhor.

## Approach 3: Function Calling como validador

Trick: define schema como tool, "force" LLM a chamar. Resultado é structured.

### OpenAI (Structured Outputs — strict mode)

OpenAI lançou em 2024 o **strict mode** que garante schema 100%:

```python
from pydantic import BaseModel

class EmailExtraction(BaseModel):
    sender: str
    subject: str
    urgency: Literal["low", "medium", "high"]

response = await gpt.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract info from email."},
        {"role": "user", "content": email},
    ],
    response_format=EmailExtraction,  # Pydantic class direto!
)

# Já parseado em Pydantic
data: EmailExtraction = response.choices[0].message.parsed
print(data.urgency)  # Literal type-checked
```

**Strict mode** garante:
- Schema constraints respected.
- Required fields present.
- Enums dentro do allowed.
- Sem extras fields.

### Anthropic (tool use)

```python
tools = [{
    "name": "extract_email_info",
    "description": "Extract structured info from email",
    "input_schema": {
        "type": "object",
        "properties": {
            "sender": {"type": "string"},
            "subject": {"type": "string"},
            "urgency": {"type": "string", "enum": ["low", "medium", "high"]},
        },
        "required": ["sender", "subject", "urgency"],
    }
}]

response = await claude.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    tools=tools,
    tool_choice={"type": "tool", "name": "extract_email_info"},  # FORCE this tool
    messages=[{"role": "user", "content": f"Extract from: {email}"}]
)

# Parse tool_use block
for block in response.content:
    if block.type == "tool_use":
        data = block.input  # dict matching schema
```

### Instructor library — works with both

[Instructor](https://github.com/jxnl/instructor) abstrai isso lindamente:

```python
import instructor
from pydantic import BaseModel
from openai import OpenAI

class EmailExtraction(BaseModel):
    sender: str
    subject: str
    urgency: Literal["low", "medium", "high"]

client = instructor.from_openai(OpenAI())

result = client.chat.completions.create(
    model="gpt-4o",
    response_model=EmailExtraction,
    messages=[{"role": "user", "content": email}],
    max_retries=3,  # se schema falha, retry com error feedback
)
print(result.urgency)
```

Instructor também suporta Anthropic, Groq, Cohere, etc:

```python
client = instructor.from_anthropic(anthropic.Anthropic())
result = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": email}],
    response_model=EmailExtraction,
)
```

**Recomendação 2026**: use Instructor para multi-provider. Code idêntico.

## Approach 4: Constrained generation

Para self-hosted (Llama, Mixtral, etc.), você pode constrain no nível de token:

### Outlines

```python
import outlines
from pydantic import BaseModel

class Sentiment(BaseModel):
    label: Literal["positive", "negative", "neutral"]
    confidence: float

model = outlines.models.transformers("meta-llama/Llama-3.3-70B-Instruct")
generator = outlines.generate.json(model, Sentiment)

result = generator("This product is amazing!")
# Garantido Sentiment válido — token-level grammar enforce
```

### llama.cpp grammars

```bash
# JSON schema → GBNF grammar
./llama-cli -m model.gguf --grammar-file schema.gbnf -p "..."
```

Para self-hosted, garantia matemática. Para APIs (Anthropic, OpenAI), confie no provider strict mode.

## Patterns úteis

### Discriminated unions (Pydantic)

```python
from typing import Literal, Union
from pydantic import BaseModel, Field

class CreateUser(BaseModel):
    action: Literal["create_user"]
    name: str
    email: str

class DeleteUser(BaseModel):
    action: Literal["delete_user"]
    user_id: int

class UpdateUser(BaseModel):
    action: Literal["update_user"]
    user_id: int
    changes: dict

Action = Union[CreateUser, DeleteUser, UpdateUser]

class Plan(BaseModel):
    actions: list[Action] = Field(discriminator="action")
```

Útil pra LLM gerar plan multi-step com actions diversas.

### Nested validation

```python
class Citation(BaseModel):
    source_id: int
    page: int = Field(ge=1)
    excerpt: str = Field(max_length=500)

class Answer(BaseModel):
    text: str
    citations: list[Citation]
    confidence: float = Field(ge=0, le=1)
    
    @field_validator("citations")
    def at_least_one_citation(cls, v):
        if not v:
            raise ValueError("At least one citation required")
        return v
```

### Optional fields with defaults

```python
class Extraction(BaseModel):
    title: str
    summary: str
    tags: list[str] = []
    sentiment: Literal["positive", "negative", "neutral"] = "neutral"
```

LLM pode omitir optional — você tem default.

## Error handling

```python
from instructor.exceptions import IncompleteOutputException
from pydantic import ValidationError

try:
    result = client.chat.completions.create(
        model="gpt-4o",
        response_model=EmailExtraction,
        messages=[...],
        max_retries=3,
    )
except IncompleteOutputException:
    # max_tokens stopped before complete JSON
    log.warning("LLM output incomplete — increase max_tokens")
except ValidationError as e:
    # After retries, schema still invalid
    log.error("Schema validation failed", errors=e.errors())
```

## Avoid common pitfalls

### Strings com newlines em JSON

```python
# ❌ LLM mete \n no meio sem escapar
{"text": "line1
line2"}  # invalid JSON

# ✅ Pydantic + Instructor lidam. Mas se for prompt-only:
# Tell LLM: "Use \\n for newlines in JSON strings"
```

### Number fields recebendo strings

```python
class Output(BaseModel):
    count: int

# LLM responde {"count": "5"}
# Pydantic v2 coerce automatically? Depends on strict mode.
# Use strict=True para reject string em int field.

class Output(BaseModel):
    model_config = {"strict": True}
    count: int
```

### Enums "fuzzy match"

```python
# LLM responde "positivo" mas schema espera "positive"
# Solução: translate prompt para English, ou:

class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    
    @classmethod
    def _missing_(cls, value):
        # Custom resolution
        mapping = {"positivo": cls.POSITIVE, "negativo": cls.NEGATIVE}
        return mapping.get(value.lower())
```

## Composição com tools

Structured output e tool use podem coexistir:

```python
# Agent retorna intent OU tool call
class Intent(BaseModel):
    action: Literal["answer", "search", "compute"]
    args: dict

# Mas para tool use real, prefira tool use API direto.
# Structured output é mais para "extract" / "classify" / "summarize structured"
```

## Performance — speed comparison

Em benchmark interno (variável):

- **Prompt-only**: rapidíssimo, mas falha 15-30% das vezes.
- **JSON mode**: same speed as text, ~5% extra latency.
- **Function calling**: ~10% extra latency vs text.
- **OpenAI strict mode**: similar to function calling, mais latency primeiro request (compile schema).
- **Outlines (self-hosted)**: variável, depends on model + grammar size.

Trade-off acceptable em produção: 10% extra latency vale garantia de schema.

## Quando NÃO usar structured

- **Chat livre** — não force schema, deixa criatividade.
- **Generation longa** com partial info — usa partial JSON parsing (streaming).
- **Output deve ter "I don't know" não-óbvio** — schema esconde uncertainty.

Em qualquer caso onde LLM precisa expressar "não tenho certeza", inclua field `confidence` ou `unknown` no schema.

## Test de schema com fixtures

```python
@pytest.fixture
def sample_emails():
    return [
        "From: john@x.com\nSubject: Hi\n\nHello",
        "From: alert@y.com\nSubject: URGENT\n\nServer down",
    ]

@pytest.mark.parametrize("email", sample_emails())
async def test_extraction(email):
    result = await extract_email(email)
    assert isinstance(result, EmailExtraction)
    assert result.urgency in ["low", "medium", "high"]
```

## Multi-step structured output

Para tasks complex, decomponha:

```python
# Step 1: identifica intent
class IntentClassification(BaseModel):
    intent: Literal["question", "command", "complaint"]

# Step 2: extract details (different schema por intent)
class QuestionDetails(BaseModel):
    topic: str
    requires_research: bool

class CommandDetails(BaseModel):
    action: str
    target: str

intent = await classify(user_msg, IntentClassification)
if intent.intent == "question":
    details = await extract(user_msg, QuestionDetails)
elif intent.intent == "command":
    details = await extract(user_msg, CommandDetails)
```

Cada step com schema simples > one giant schema.

## Checklist — structured output prod

- [ ] Pydantic v2 para todos os schemas
- [ ] Instructor library para multi-provider
- [ ] Strict mode habilitado onde disponível (OpenAI)
- [ ] `max_retries` configurado em Instructor
- [ ] Validation errors logged e monitored
- [ ] Schemas testados com edge cases (empty, malformed)
- [ ] `confidence` field para LLM expressar uncertainty
- [ ] Token budget suficiente pra output completo (max_tokens)

## Leituras

- Instructor docs (python.useinstructor.com)
- Outlines docs (dottxt-ai.github.io/outlines)
- OpenAI Structured Outputs (platform.openai.com/docs/guides/structured-outputs)
- Anthropic tool use (docs.anthropic.com/claude/docs/tool-use)
- "Coalescence" (Outlines) — paper on grammar-constrained gen
- Pydantic docs (docs.pydantic.dev)
- "AI Engineering" — Chip Huyen
