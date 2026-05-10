---
title: Deployment Patterns — Modal, Bedrock, Vertex, vLLM, Ollama
category: agentes-ia
stack: [Modal, Replicate, AWS Bedrock, Azure OpenAI, GCP Vertex, vLLM, llama.cpp]
tags: [deployment, modal, bedrock, vertex, vllm, ollama]
excerpt: "Como deploy LLM apps em production — serverless GPU (Modal), cloud-managed (Bedrock, Vertex), self-hosted (vLLM, llama.cpp, Ollama), edge."
related: [agent-deployment, ai-cost-optimization, ai-fallback-resilience]
updated: "2026-05-10"
---

## Spectrum de deploy

```
Provider API (Anthropic/OpenAI direct)
    ↓ less control, less infra
Provider via cloud (Bedrock, Vertex, Azure OpenAI)
    ↓ multi-cloud, compliance-friendly
Hosted open models (Together AI, Fireworks, Groq)
    ↓ cheaper, OSS models
Serverless GPU (Modal, Replicate, RunPod)
    ↓ infra burden, pay per use
Self-hosted (vLLM, TGI, Ollama)
    ↓ full control, full ownership
Edge (browser WebLLM, mobile MLC-LLM)
    ↓ ultra-low latency, limited models
```

Decision matrix:

| Need | Choice |
|------|--------|
| MVP fast | Provider API direto |
| Multi-cloud/compliance | Bedrock/Vertex/Azure |
| Cheap open models | Together AI / Groq |
| Custom fine-tuned | Modal serverless ou self-host |
| Privacy/local | Ollama self-host |
| Ultra-low latency | Edge (WebLLM) |
| Massive scale | Self-host com vLLM |

## Provider direto

```python
# Anthropic
from anthropic import AsyncAnthropic
client = AsyncAnthropic()
response = await client.messages.create(...)

# OpenAI
from openai import AsyncOpenAI
client = AsyncOpenAI()
response = await client.chat.completions.create(...)
```

Pros: simplest, latest models immediately, no infra.
Cons: vendor lock-in, no data residency control, region limitations.

Use para: 90% dos apps mainstream.

## Cloud-managed (Bedrock, Vertex, Azure OpenAI)

Mesmos models, mas via cloud provider. Vantagens:
- **Compliance**: data residency, BAA, HIPAA, FedRAMP.
- **Multi-cloud**: same SDK pattern across AWS/Azure/GCP.
- **Pricing**: às vezes (raro) cheaper via committed-use.

### AWS Bedrock

```python
import boto3
import json

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

response = bedrock.invoke_model(
    modelId="anthropic.claude-sonnet-4-6-20260101",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": "Hello"}]
    })
)

result = json.loads(response["body"].read())
print(result["content"][0]["text"])
```

Bedrock hosts Anthropic, Llama, Mistral, Cohere, Amazon Titan, Stability AI.

### Azure OpenAI

```python
from openai import AsyncAzureOpenAI

client = AsyncAzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    api_version="2024-08-01-preview",
    azure_endpoint="https://your-resource.openai.azure.com",
)

response = await client.chat.completions.create(
    model="gpt-4o",  # deployment name in Azure
    messages=[...]
)
```

Azure OpenAI hosts OpenAI models. Enterprise customers pra Microsoft compliance.

### GCP Vertex AI

```python
from vertexai.preview.generative_models import GenerativeModel
import vertexai

vertexai.init(project="your-project", location="us-central1")

# Anthropic via Vertex
from anthropic import AnthropicVertex
client = AnthropicVertex(region="us-east5", project_id="your-project")

response = client.messages.create(
    model="claude-sonnet-4-6@20260101",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}]
)
```

Vertex hosts Gemini, Claude, Llama, Mistral, PaLM. Google customers.

### Quando usar cloud-managed

✅ Compliance requirements (HIPAA, FedRAMP, etc.).
✅ Already cloud-heavy customer (committed AWS/Azure/GCP).
✅ Data residency requirements (EU data stays EU).

❌ Want latest models immediately (cloud lag few days/weeks).
❌ MVP fast (direct provider simpler).

## Hosted open models

### Together AI

OpenAI-compatible API, hosts Llama, Mixtral, Qwen, DeepSeek, etc.

```python
from openai import AsyncOpenAI

together = AsyncOpenAI(
    api_key=os.environ["TOGETHER_API_KEY"],
    base_url="https://api.together.xyz/v1",
)

response = await together.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[...]
)
```

Pros: cheap (Llama 3.3 70B: ~$0.88/1M tokens), OpenAI SDK compatible.
Cons: no Claude/GPT, less reliable than hyperscalers.

### Fireworks AI

Similar to Together. Faster inference (~200 tok/s on some models).

### Groq

Specialized hardware (LPUs) for ultra-fast inference.

```python
from groq import AsyncGroq
client = AsyncGroq()

response = await client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[...]
)
# 300-500 tokens/s on Llama 70B
```

Speed is killer feature. Use for voice agents, real-time apps.

### Replicate

Pay-per-second compute. Wider model selection (image, video, audio).

```python
import replicate

output = replicate.run(
    "meta/meta-llama-3-70b-instruct",
    input={"prompt": "Hello", "max_tokens": 1024}
)
```

## Serverless GPU — Modal

Modal é game-changer pra deploy ML/AI workloads. Function-as-a-Service com GPU.

```python
import modal

stub = modal.Stub("my-llm-app")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("vllm==0.5.0", "transformers")
)

@stub.cls(
    gpu="A100",            # GPU type
    image=image,
    container_idle_timeout=120,
    concurrency_limit=5,
)
class LLM:
    @modal.enter()
    def load_model(self):
        from vllm import LLM
        self.llm = LLM(model="meta-llama/Llama-3.3-70B-Instruct")
    
    @modal.method()
    def generate(self, prompt: str, max_tokens: int = 512):
        outputs = self.llm.generate([prompt])
        return outputs[0].outputs[0].text

# Use from anywhere
llm = LLM()
result = llm.generate.remote("Hello, world!")
```

Pros:
- Spin up GPU em demanda.
- No idle GPU cost.
- Python-native (no Dockerfile, no Kubernetes).
- Cold start ~1-30s, warm ~ms.

Cons:
- Cold start latency (mitigate via keep_warm).
- Vendor (Modal Inc).
- Cost per GPU-second adds quickly if 24/7 traffic.

Use cases:
- Fine-tuned model serving.
- Batch jobs.
- Inference de modelos não disponíveis em hosted APIs.

## Self-host com vLLM

vLLM é o framework padrão pra production LLM serving open models.

```bash
# Install
pip install vllm

# Serve OpenAI-compatible API
python -m vllm.entrypoints.openai.api_server \
    --model meta-llama/Llama-3.3-70B-Instruct \
    --tensor-parallel-size 4 \
    --gpu-memory-utilization 0.9 \
    --port 8000
```

Cliente:
```python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    api_key="EMPTY",
    base_url="http://your-server:8000/v1",
)

response = await client.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[...]
)
```

### vLLM optimization

- **PagedAttention**: efficient KV cache management.
- **Continuous batching**: maximize GPU utilization.
- **Tensor parallelism**: split across GPUs.
- **Quantization**: AWQ, GPTQ, FP8 to reduce VRAM.
- **Prefix caching**: similar to prompt caching.

For 70B model with vLLM:
- Throughput: 100-200 req/s on 8×H100.
- Latency: 30-50ms/token.
- Cost: ~$25/hour for 8×H100 reserved.

### When self-host worth it

```
Monthly tokens: 100M output
Hosted (Anthropic): 100M × $15/1M = $1500/mês
Self-hosted: 4 × A100/month rental = $2400/mês

❌ Não vale for 100M tokens

Monthly tokens: 1B output
Hosted: $15,000/mês
Self-hosted: $5,000/mês
✅ Vale
```

Break-even: ~500M-1B tokens/mês depending on model.

### Self-host alternatives

- **TGI (Text Generation Inference)** — HuggingFace's. Similar to vLLM.
- **TensorRT-LLM** — NVIDIA, fastest if you commit to NVIDIA stack.
- **MLX-LM** — Apple Silicon optimized.
- **DeepSpeed-MII** — Microsoft, batching.
- **OpenLLM** — BentoML-based.

## Ollama — local desktop

For dev, personal apps, privacy:

```bash
# Install
curl https://ollama.ai/install.sh | sh

# Run model
ollama run llama3.3:70b

# OpenAI-compatible API
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{"model": "llama3.3", "messages": [{"role": "user", "content": "Hello"}]}'
```

Pros:
- Zero cloud, fully private.
- Easy install.
- Free.

Cons:
- Consumer GPU may struggle with 70B.
- Single user typically.

Use cases: dev, personal AI tools, demos, privacy-critical scenarios.

## llama.cpp

Pure C++ inference. Runs CPU, GPU, Apple Silicon.

```bash
# Build
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make

# Download quantized model (GGUF format)
wget https://huggingface.co/.../llama-3.3-8b-Q4_K_M.gguf

# Serve
./llama-server -m llama-3.3-8b-Q4_K_M.gguf -c 4096 --port 8080
```

Pros: works without dedicated GPU, ultra-portable.
Cons: slower than vLLM, less features.

Use: edge devices, IoT, Raspberry Pi-class hardware.

## Edge — browser/mobile

### WebLLM

LLM runs **no browser do user**:

```html
<script type="module">
import * as webllm from "@mlc-ai/web-llm";

const engine = await webllm.CreateMLCEngine("Llama-3.2-3B-Instruct-q4f16_1");

const reply = await engine.chat.completions.create({
  messages: [{ role: "user", content: "Hello" }],
});
</script>
```

Pros: zero server cost, privacy.
Cons: 1-2GB download, only small models (3-8B max), slower than cloud.

Use: privacy-critical UI features (e.g., grammar check inside browser, no data leaves).

### MLC-LLM (mobile)

Llama running on iOS/Android. React Native + native bindings.

Use: offline AI apps, accessibility tools, embedded.

## Production deploy patterns

### Pattern 1: Single provider direct

```
User → Your app → Anthropic API
```

Simplest. Para 90% of MVPs.

### Pattern 2: Multi-provider with fallback

```
User → Your app → Anthropic
                ↓ (fallback)
                  OpenAI
                ↓ (fallback)
                  Self-hosted Llama
```

Resilience. See `ai-fallback-resilience`.

### Pattern 3: Routing per task

```
User → Your app → Router → Haiku (simple)
                        → Sonnet (default)
                        → Opus (complex)
                        → Llama fine-tuned (domain)
```

Cost optimization + best model per task.

### Pattern 4: Hybrid hosted + self-host

```
User → Your app → Cloud (premium models for hard tasks)
                → Self-hosted (high-volume cheap tasks)
```

E.g., Sonnet for chat, fine-tuned Llama on Modal for classification.

### Pattern 5: Edge + cloud

```
User device (WebLLM for instant classification)
            → Cloud (Claude for complex queries)
```

Instant UX for common cases, cloud para rare/complex.

## Infrastructure considerations

### Networking

- Region matters: latency from BR → us-east is ~200ms vs us-east1 → us-east1 ~5ms.
- Multi-region deployment: replicate stateless service, share data layer.
- CDN for static assets, NOT for LLM responses (caching layer is your responsibility).

### Storage

- **Conversation history**: PostgreSQL or DynamoDB.
- **Vector embeddings**: pgvector (single-region) ou Pinecone/Qdrant (multi-region).
- **Logs**: structured to S3/GCS via OTel + log management (Datadog, Honeycomb, Grafana Loki).

### Compute

- **API layer (stateless)**: Cloud Run, Lambda, Vercel — autoscale.
- **GPU layer (if self-host)**: dedicated instances or Modal/Replicate.
- **Queue**: Inngest, Trigger.dev, SQS, Celery + Redis.

### Secrets

```python
# Never commit
# Use secrets manager
import boto3

ssm = boto3.client("ssm")
api_key = ssm.get_parameter(Name="/prod/anthropic-key", WithDecryption=True)["Parameter"]["Value"]
```

AWS Parameter Store, Azure Key Vault, GCP Secret Manager, HashiCorp Vault.

### Monitoring

```python
# Observability stack
import structlog
import opentelemetry
from langfuse.openai import openai as langfuse_openai

# Structured logs → Loki/Datadog
# Traces → Jaeger/Tempo/Langfuse
# Metrics → Prometheus/Datadog
# Errors → Sentry
```

Dashboard: latency, cost, error rate, cache hit rate per endpoint.

## CI/CD para LLM apps

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: pytest tests/
      - run: deepeval test run tests/evals  # eval-driven gate
      - run: promptfoo eval                  # prompt regression
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: fly deploy   # or vercel, modal deploy, etc.
```

Eval-driven CI: PRs that degrade eval scores blocked.

## Environment strategy

```
dev:
  - Local Ollama or sandbox API keys
  - Cheap models, generous limits
  - No real PII

staging:
  - Real API but staging env
  - Production-like config
  - Synthetic data

prod:
  - Real keys, rate limits configured
  - Monitoring + alerts
  - Real users, real PII (encrypted)
```

Don't share API keys across envs. Separate accounts even better.

## Pricing reality

| Setup | Setup cost | Per 1M tokens | Notes |
|-------|-----------|---------------|-------|
| Anthropic API | $0 | $3 input, $15 output | Easy start |
| OpenAI API | $0 | $2.50 input, $10 output | Lower price, similar quality |
| AWS Bedrock | $0 | ~Anthropic + 10-20% | Compliance |
| Together AI Llama 70B | $0 | ~$0.88 | OSS model |
| Groq Llama 70B | $0 | ~$0.79 | Fast |
| Modal Llama 70B | $0 setup, $$ ongoing | ~$0.50 | Self-managed |
| Self-host Llama 70B | $5-50k hardware | ~$0.20 effective | High volume only |
| Ollama Llama 70B local | $5k GPU | $0 | Single user |

## Disaster recovery

- Backup conversation history daily (S3).
- DR plan: switch to secondary provider em 5min.
- Test failover quarterly (chaos engineering).
- Document runbooks: "what to do when Anthropic down?".

## Compliance considerations

### GDPR / LGPD

- **Data residency**: store data em region required.
- **Right to deletion**: user data deletable (incluindo embeddings).
- **Right to access**: provide user data export.
- **Anthropic has GDPR/LGPD compliance**: data not used for training by default.

### HIPAA (healthcare US)

- Need BAA (Business Associate Agreement).
- Anthropic Cloud (AWS Bedrock) com BAA.
- Microsoft Azure OpenAI with BAA.
- Self-host (you control everything).

### EU AI Act

- "High-risk" AI systems require conformity assessment.
- Document model use, eval results, risk mitigations.
- See `ai-compliance-2026`.

## Checklist — production deploy

- [ ] Multi-provider fallback configured?
- [ ] Monitoring stack (logs, traces, metrics, errors)?
- [ ] Cost tracking per request?
- [ ] Eval-driven CI gates?
- [ ] Secrets em secrets manager (não env vars committed)?
- [ ] Backup strategy?
- [ ] Region-appropriate deployment (data residency)?
- [ ] Rate limits + abuse protection?
- [ ] DR plan documentado e tested?
- [ ] Compliance requirements met (GDPR, HIPAA se aplicável)?

## Leituras

- Modal docs (modal.com/docs)
- vLLM docs (docs.vllm.ai)
- AWS Bedrock docs
- Anthropic Bedrock/Vertex integration docs
- Together AI docs
- Replicate docs
- "Production LLM Apps" — Hamel Husain talks
- "Deploying LLMs" — Eugene Yan blog series
- WebLLM docs (mlc.ai/web-llm)
- llama.cpp wiki
