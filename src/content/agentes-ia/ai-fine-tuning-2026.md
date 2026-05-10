---
title: Fine-Tuning 2026 — Quando Vale, LoRA, DPO
category: agentes-ia
stack: [fine-tuning, LoRA, QLoRA, DPO, ORPO, datasets]
tags: [fine-tuning, lora, dpo, dataset, training]
excerpt: "Quando fine-tune vs prompt engineering vs RAG, LoRA/QLoRA, dataset curation, DPO/ORPO, eval de modelo fine-tuned."
related: [ai-prompt-eng-2026, ai-rag-contextual, ai-deployment-2026]
updated: "2026-05-10"
---

## "Devo fine-tuning?"

Pergunta #1 do AI Engineer. Resposta default: **NÃO, ainda.**

Em 2026, Sonnet/GPT-4o são tão capazes que fine-tuning raramente é solução right. Ordem de tentativas:

1. **Better prompt** (free, instant).
2. **Few-shot examples in prompt** (cheap, fast).
3. **RAG** (medium effort, scalable).
4. **Tool use** (medium effort, deterministic).
5. **Fine-tuning** (high effort, expensive).

90% dos problemas: 1-4 resolve. Fine-tuning is the last resort.

## Quando fine-tuning **GANHA**

| Case | Por quê |
|------|---------|
| Specialized format/style consistente | Few-shot grows context custoso; fine-tune internaliza |
| Latency crítica | Smaller fine-tuned model faster que prompt-engineered Sonnet |
| Cost ao scale | Open model fine-tuned + self-hosted < cloud per call |
| Domain language (medical, legal, code) | Vocabulary specific better embedded |
| Privacy: no cloud allowed | Self-host required |
| Compliance: deterministic outputs | Fine-tune reduces variability |

## Quando fine-tuning **PERDE**

| Case | Use instead |
|------|-------------|
| Facts não cobertos no training | RAG (facts mudam, weights difícil update) |
| Tool use behavior | Modern LLMs já bons em tool use |
| Simple chat improvements | Better prompt |
| Multi-task generalization | Pre-trained models melhor than narrow fine-tune |

## Approaches

### 1. SFT (Supervised Fine-Tuning) — basic

Dataset: pairs (input, expected_output). Modelo aprende pattern.

```python
# Dataset format (OpenAI / Anthropic format)
[
    {"messages": [
        {"role": "user", "content": "Classify: 'Great product!'"},
        {"role": "assistant", "content": "positive"}
    ]},
    {"messages": [
        {"role": "user", "content": "Classify: 'Disappointed.'"},
        {"role": "assistant", "content": "negative"}
    ]},
    # ... 100-10000+ examples
]
```

### 2. LoRA (Low-Rank Adaptation)

Em vez de update todos os weights (billions), update only small adapter matrices. **10-100x cheaper** que full fine-tune.

```python
# Hugging Face PEFT
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=16,                          # rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],  # which weights to adapt
    lora_dropout=0.1,
    task_type="CAUSAL_LM",
)

model = get_peft_model(base_model, lora_config)
# Train adapter only (~1% of params)
```

LoRA é standard 2024-2026 para fine-tuning open models.

### 3. QLoRA — quantized LoRA

Quantize base model em 4-bit, train LoRA on top. Fits em consumer GPU (24GB).

```python
from peft import prepare_model_for_kbit_training
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B-Instruct",
    quantization_config=bnb_config,
)
model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)
```

70B model em laptop GPU. Game-changer.

### 4. DPO (Direct Preference Optimization)

Treina modelo em **preference pairs** (chosen vs rejected). Substitui RLHF complexo.

```python
# Dataset
[
    {
        "prompt": "Explain quantum entanglement",
        "chosen": "Quantum entanglement is a phenomenon where...",
        "rejected": "It's like magic stuff."
    },
    # ...
]

# Train com DPO trainer
from trl import DPOTrainer

trainer = DPOTrainer(
    model=model,
    ref_model=ref_model,
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
    beta=0.1,
)
trainer.train()
```

Resultado: modelo prefere chosen-style. Better alignment vs SFT alone.

### 5. ORPO — Odds Ratio Preference Optimization (2024)

Newer than DPO. Combines SFT + preference em 1 step. Simpler training pipeline.

## Dataset curation — onde tudo acerta ou erra

**Garbage in, garbage out.** 70% do esforço de fine-tuning é dataset.

### Volume

| Task complexity | Examples needed |
|-----------------|----------------|
| Simple classification | 100-500 |
| Format consistency | 200-1000 |
| Domain Q&A | 500-5000 |
| Code style transfer | 1000-10000 |
| New behavior/style | 5000-50000 |

Quality > quantity. 100 great examples > 1000 noisy.

### Sources

**1. Manual labeled** (gold standard)
- Domain experts label.
- Slow, expensive, but high quality.

**2. Distillation from larger model**
- GPT-4 generates examples para fine-tune smaller model.
- Cheap, fast, but quality limited by source model.
- License: check provider TOS (OpenAI permite training of "third-party models" with caveats).

```python
async def distill_dataset(prompts: list, n_per_prompt: int = 3):
    """Use GPT-4 / Claude to generate training examples."""
    dataset = []
    for prompt in prompts:
        for _ in range(n_per_prompt):
            response = await client.messages.create(
                model="claude-opus-4-6",  # use STRONG model
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            dataset.append({
                "messages": [
                    {"role": "user", "content": prompt},
                    {"role": "assistant", "content": response.content[0].text}
                ]
            })
    return dataset
```

**3. Synthetic with diversity**
- LLM generates DIVERSE examples (varia phrasing, difficulty).
- Verify quality with human spot-check.

**4. From production logs**
- Real user inputs.
- Filter and clean.
- Privacy: scrub PII.

### Quality control

```python
# Dedupe near-duplicates
from datasketch import MinHash, MinHashLSH

def find_duplicates(dataset, threshold=0.9):
    lsh = MinHashLSH(threshold=threshold, num_perm=128)
    for i, item in enumerate(dataset):
        mh = MinHash(num_perm=128)
        for word in item["text"].split():
            mh.update(word.encode())
        lsh.insert(i, mh)
    # ... return duplicates

# Length filtering
filtered = [d for d in dataset if 50 < len(d["text"]) < 2000]

# Manual sample review
import random
sample = random.sample(dataset, 100)
# Human reviews
```

### Train/eval split

```python
from sklearn.model_selection import train_test_split

train, test = train_test_split(dataset, test_size=0.1, random_state=42)
```

Eval set: 10-20%. Test on it during training to detect overfitting.

## Provider-managed vs self-hosted

### OpenAI Fine-Tuning

```python
from openai import OpenAI
client = OpenAI()

# Upload dataset
file = client.files.create(
    file=open("training.jsonl", "rb"),
    purpose="fine-tune",
)

# Create fine-tune job
job = client.fine_tuning.jobs.create(
    training_file=file.id,
    model="gpt-4o-mini-2024-07-18",
    suffix="my-classifier",
)

# Wait + check
while True:
    job = client.fine_tuning.jobs.retrieve(job.id)
    if job.status == "succeeded":
        break
    elif job.status == "failed":
        raise Exception("Fine-tune failed")
    await asyncio.sleep(60)

# Use fine-tuned model
response = client.chat.completions.create(
    model=job.fine_tuned_model,  # "ft:gpt-4o-mini-..."
    messages=[...]
)
```

Pros: zero infra, validated quality.
Cons: limited customization, vendor lock-in, can be expensive.

### Anthropic Fine-Tuning

Em 2026, Anthropic offers fine-tuning via Bedrock (Claude Haiku) e via custom contract pra Sonnet.

### Self-hosted (open models)

```python
# Llama 3.3, Mistral, Qwen — fine-tune with HF + PEFT
from transformers import Trainer, TrainingArguments

training_args = TrainingArguments(
    output_dir="./output",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    save_strategy="epoch",
    eval_strategy="epoch",
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_data,
    eval_dataset=eval_data,
)

trainer.train()
trainer.save_model("./output/final")
```

Tools: **Axolotl** (orchestration), **Unsloth** (2-5x faster), **TRL** (DPO/PPO).

## Deployment fine-tuned model

### Self-hosted via vLLM

```python
# Serve com vLLM (OpenAI-compatible)
from vllm import LLM, SamplingParams

llm = LLM(
    model="./output/final",
    tensor_parallel_size=2,  # 2 GPUs
)

# Or via vllm serve (OpenAI API)
# vllm serve ./output/final --port 8000
```

### Modal / Replicate / Together AI

```python
# Modal — serverless GPU
import modal

stub = modal.Stub("fine-tuned-model")
image = modal.Image.debian_slim().pip_install("transformers", "torch", "peft")

@stub.function(gpu="A100", image=image)
def generate(prompt: str):
    from transformers import AutoModelForCausalLM, AutoTokenizer
    model = AutoModelForCausalLM.from_pretrained("/model")
    # ...
    return response
```

Replicate, Together AI host fine-tuned models too (drop-in).

### LoRA hot-swap

Múltiplos LoRA adapters em mesmo base model:

```python
# Load base + multiple LoRAs
base_model = AutoModelForCausalLM.from_pretrained("llama-3-8b")
model = PeftModel.from_pretrained(base_model, "./lora-task-a")

# Switch task at runtime
model.load_adapter("./lora-task-b", "task_b")
model.set_adapter("task_b")
```

Eficiente: 1 base model + multiple tiny adapters.

## Eval — fine-tuned model

Critical: validate qualidade pós-training.

```python
# Eval on held-out test set
def evaluate_finetuned(model, test_dataset):
    correct = 0
    for item in test_dataset:
        prediction = model.generate(item["input"])
        if prediction == item["expected"]:
            correct += 1
    accuracy = correct / len(test_dataset)
    return accuracy

# Compare baseline vs fine-tuned
baseline_accuracy = evaluate_finetuned(base_model, test)
finetuned_accuracy = evaluate_finetuned(ft_model, test)

print(f"Baseline: {baseline_accuracy:.2%}")
print(f"Fine-tuned: {finetuned_accuracy:.2%}")
print(f"Delta: {finetuned_accuracy - baseline_accuracy:+.2%}")
```

### Eval além de accuracy

- **General capability**: ainda bom em tasks fora do fine-tune? (Catastrophic forgetting check.)
- **Latency**: faster than base? (Should be, smaller model.)
- **Cost**: cheaper per call?
- **Refusal rate**: not over-refusing?
- **Hallucination rate**: not making up facts?

Run MMLU, MT-Bench (or domain-specific eval) before/after.

## Cost analysis

### OpenAI fine-tuning (GPT-4o-mini)

- Training: ~$3 per 1M tokens.
- 1M-token dataset = $3 training cost.
- Inference: $0.30/1M input + $1.20/1M output (cheaper than base GPT-4o-mini? Actually similar).

Custo total: small, mostly for training data preparation.

### Self-hosted

- Training: GPU cost. A100 8h = ~$15 (Modal/Lambda Labs).
- Inference: ongoing GPU rental.
- Effective if traffic high (justifies dedicated infra).

### Cost ROI calculation

```
Monthly volume: 10M tokens generated
Base Sonnet cost: 10M × $15 = $150
Fine-tuned Haiku cost: 10M × $1.25 = $12.50
Savings: $137.5/mês

Training one-time: $50
Eval: $20
Engineer time: 40h × $100 = $4000

Break-even: $4070 / $137.5 = 30 months
```

Fine-tuning vale **só se** sustained high volume. Para spike workloads, prompt engineering ganha.

## Quando NOT fine-tune (specific anti-patterns)

### 1. "I want it to know about my company"
→ Use RAG. Fine-tune for **how** to respond, RAG for **what** info.

### 2. "It hallucinates facts"
→ Fine-tuning não fixa hallucination. RAG + citation tracking sim.

### 3. "Output format inconsistent"
→ Use structured output (JSON mode, Pydantic). Cheaper, instant.

### 4. "Want consistent style"
→ Few-shot in prompt or system prompt iteration. Fine-tune se 100+ examples.

### 5. "Don't have budget for Sonnet"
→ Try Haiku first. Often sufficient. Fine-tune Haiku if needed.

## Pre-flight checklist before fine-tuning

- [ ] Tried better prompt? (At least 5 iterations)
- [ ] Tried few-shot examples in prompt? (5-20 examples)
- [ ] Tried RAG if facts needed?
- [ ] Tried different base model? (Haiku vs Sonnet, Llama 3.3 vs Mistral)
- [ ] Have 200+ quality examples?
- [ ] Have test set for eval?
- [ ] Volume justifies $$$ in training + ongoing?
- [ ] Comfortable maintaining (training updates, drift)?

If NO em qualquer → don't fine-tune yet.

## Common pitfalls

### 1. Overfitting
Fine-tuned model perfect on train, ruim em real users. Use eval set, regularize.

### 2. Catastrophic forgetting
After fine-tune, model esqueceu general capabilities. Mix general data in training.

### 3. Dataset bias
Examples too similar → modelo só lida com narrow input. Diversify.

### 4. Wrong base model
Fine-tune GPT-3.5 → 2024-vintage. Use latest base.

### 5. Train e deploy non-deterministic
Different seed, different result. Pin everything.

### 6. No A/B in production
Roll out fine-tuned without comparing user satisfaction vs base. Could be worse!

## Tools landscape (2026)

| Layer | Tools |
|-------|-------|
| **Dataset curation** | Argilla, LabelStudio, Snorkel, manual |
| **Training framework** | HF Transformers + PEFT, Axolotl, Unsloth, MosaicML |
| **Hyperparameter** | Weights & Biases sweeps |
| **Serving** | vLLM, TGI (HuggingFace), Modal, Replicate, Together |
| **Eval** | LM-Eval-Harness, MT-Bench, custom |
| **Monitoring** | Langfuse, Weights & Biases, Helicone |

## Future direction (2026+)

- **Mixture of LoRAs** — many adapters served per base.
- **Online fine-tuning** — RLHF-like from user feedback.
- **Constitutional fine-tuning** — Anthropic's approach.
- **Cheap fine-tuning** — providers competing on price.

For most AI Engineers 2026: avoid fine-tuning unless niche case. Use it carefully when needed.

## Checklist — fine-tune project

- [ ] Justified after exhausting easier options?
- [ ] Dataset 200+ quality examples?
- [ ] Train/eval split done?
- [ ] LoRA preferred over full fine-tune?
- [ ] Deployment strategy clear (managed vs self-host)?
- [ ] Eval baseline + post-tune compared?
- [ ] Catastrophic forgetting checked?
- [ ] Cost ROI projected positive?
- [ ] A/B test in production?

## Leituras

- "Fine-Tuning LLMs" — Hugging Face guides
- "QLoRA" paper — Dettmers et al. 2023
- "DPO" paper — Rafailov et al. 2023
- Axolotl docs (axolotl-ai-cloud.github.io)
- Unsloth docs (unsloth.ai)
- OpenAI fine-tuning docs
- "Fine-Tuning vs RAG" comparison blog posts
- "How to fine-tune Llama" — Meta tutorials
