---
title: Multimodal LLMs — Vision, Audio, OCR vs Vision
category: agentes-ia
stack: [Claude Vision, GPT-4V, Whisper, Sonnet Audio]
tags: [multimodal, vision, audio, ocr, whisper]
excerpt: "Como usar Vision LLMs vs OCR tradicional, audio (Whisper, Sonnet 4.5 audio bidirecional), interleaved multimodal, custo vs accuracy."
related: [ai-openai-vs-anthropic, ai-llm-internals-2026, ai-cost-optimization]
updated: "2026-05-10"
---

## Modalidades em 2026

LLMs em 2026 aceitam:
- **Texto** (sempre).
- **Imagens** (Claude, GPT-4V, Gemini, Llama 3 Vision).
- **Áudio** (GPT-4o Realtime, Claude Sonnet 4.5+ audio, Gemini).
- **Vídeo** (Gemini, em beta em Claude/GPT).
- **PDFs/Documentos** (Claude doc input nativo, GPT via APIs auxiliares).

Esse card cobre patterns práticos pra cada modalidade.

## Vision — Claude e GPT-4V

### Anthropic — image input

```python
import base64
from anthropic import Anthropic

client = Anthropic()

# Opção 1: base64 (recomendado pra control privado)
with open("invoice.png", "rb") as f:
    img_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": img_data,
                }
            },
            {"type": "text", "text": "Extract total amount and date from this invoice."}
        ]
    }]
)

# Opção 2: URL (mais simples, mas Claude precisa acessar URL)
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {"type": "url", "url": "https://example.com/invoice.png"}
            },
            {"type": "text", "text": "..."}
        ]
    }]
)
```

### OpenAI — image input

```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Extract total from this invoice."},
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{img_data}",
                    "detail": "high"  # "low" 512x512, "high" full res
                }
            }
        ]
    }]
)
```

### Multi-image input

```python
# Anthropic — múltiplas imagens em mesma message
content = [{"type": "text", "text": "Compare these:"}]
for img_url in image_urls:
    content.append({
        "type": "image",
        "source": {"type": "url", "url": img_url}
    })

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": content}]
)
```

Claude suporta até **100 imagens** por message. GPT-4V limita ~10 imagens (varia).

## Vision vs OCR — quando usar cada

OCR tradicional (Tesseract, AWS Textract, Google Vision API) é **especializado em texto**. Vision LLMs são **multipurpose**. Trade-offs:

| Aspect | OCR tradicional | Vision LLM |
|--------|----------------|------------|
| Text accuracy | ★★★★★ (Tesseract+, Textract) | ★★★★ (good but not surgical) |
| Layout understanding | ★★ (Textract OK, others limited) | ★★★★★ (entende contexto) |
| Tables | Tesseract limited; Textract OK | ★★★★ |
| Handwritten | Limited (Textract handwriting addon) | ★★★★★ (Claude excelente) |
| Math equations | Pobre | ★★★★ |
| Image-to-structured | Não nativo | ★★★★★ |
| Cost | Baixo (~$0.001/page) | Alto ($0.01-0.05/page) |
| Latência | 1-3s | 3-10s |

### Patterns

**Use OCR tradicional quando**:
- Volume alto (1000+ docs/dia).
- Text-only extraction (recibos simples, IDs).
- Layouts repetitivos (mesma forma sempre).

**Use Vision LLM quando**:
- Volume baixo-médio (<100 docs/dia).
- Layout varia ou complex.
- Precisa entender contexto (extract "total" sabendo qual é nota fiscal vs orçamento).
- Outputs structured complex (não só texto).

**Hybrid (recomendado pra production)**:
1. OCR extrai texto raw.
2. LLM (text-only) estrutura.

```python
# Pipeline hybrid
text = await textract.extract(pdf_bytes)  # cheap text extraction
structured = await llm.parse(text, schema=InvoiceSchema)  # cheap LLM call
```

Custo total: $0.005/doc vs $0.05/doc do Vision direto.

### Quando Vision direto vale

Quando a imagem **não é text-primary** — diagrams, charts, photos, screenshots de UI complex:

```python
# Vision direto pra UI screenshot
response = client.messages.create(
    model="claude-sonnet-4-6",
    messages=[{"role": "user", "content": [
        {"type": "image", "source": {...}},
        {"type": "text", "text": "Describe the UI layout and identify bugs visible in this screenshot."}
    ]}]
)
```

## Image tokens — pricing implications

Imagens consomem tokens:

| Provider | Cost per image |
|----------|---------------|
| Anthropic Claude | (width × height) / 750 tokens |
| OpenAI GPT-4o | 85 tokens (low detail) ou 85 + 170 × tiles (high detail) |

Imagem 1024×1024 em Claude: ~1400 tokens. Em GPT-4o high: ~765 tokens.

**Otimização**: resize imagens antes de enviar se detail preciso < HD.

```python
from PIL import Image
import io

def prepare_image(image_path: str, max_dimension: int = 1568) -> bytes:
    """Anthropic recomenda max 1568px na maior dimensão."""
    img = Image.open(image_path)
    img.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
```

## PDFs

Claude suporta PDF input nativo (até 100 páginas):

```python
with open("contract.pdf", "rb") as f:
    pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": "application/pdf",
                    "data": pdf_data,
                }
            },
            {"type": "text", "text": "Summarize the contract obligations."}
        ]
    }]
)
```

OpenAI doesn't accept PDF directly — você converte pra imagens (pdf2image) ou extrai texto antes.

## Audio — Speech to Text

### Whisper (OpenAI)

```python
from openai import OpenAI
client = OpenAI()

with open("interview.mp3", "rb") as audio:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio,
        response_format="verbose_json",  # com timestamps
        timestamp_granularities=["word"],
        language="pt",  # opcional, melhora accuracy se você sabe
    )

# transcript.text — texto completo
# transcript.words — list of {word, start, end}
```

Whisper-1: $0.006/min. State-of-art para muitos idiomas. Suporta 100+ idiomas.

Alternativas:
- **Deepgram** — faster, real-time streaming.
- **AssemblyAI** — multi-speaker diarization built-in.
- **whisper.cpp** — self-hosted, GPU-free.

### Claude Sonnet 4.5+ audio (2026)

Claude suporta audio input direto:

```python
with open("call.mp3", "rb") as f:
    audio_data = base64.standard_b64encode(f.read()).decode("utf-8")

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "audio",
                "source": {
                    "type": "base64",
                    "media_type": "audio/mp3",
                    "data": audio_data,
                }
            },
            {"type": "text", "text": "Transcribe and identify the main issues discussed."}
        ]
    }]
)
```

Vantagem: 1 call faz transcript + analysis (vs Whisper + LLM em 2 calls).

## Audio — Realtime API (OpenAI)

GPT-4o Realtime API permite audio bidirecional baixa-latência (<500ms):

```python
import asyncio
import websockets
import json

async def realtime_audio():
    uri = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview"
    headers = {
        "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
        "OpenAI-Beta": "realtime=v1",
    }
    
    async with websockets.connect(uri, extra_headers=headers) as ws:
        # Send session config
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "voice": "alloy",
                "instructions": "You are a helpful assistant.",
                "modalities": ["text", "audio"],
            }
        }))
        
        # Send audio chunks (PCM 16-bit 24kHz)
        await ws.send(json.dumps({
            "type": "input_audio_buffer.append",
            "audio": base64_audio_chunk,
        }))
        
        # Receive responses
        async for msg in ws:
            event = json.loads(msg)
            if event["type"] == "response.audio.delta":
                # PCM audio chunk back
                play_audio(base64.b64decode(event["delta"]))
            elif event["type"] == "response.text.delta":
                print(event["delta"], end="")
```

Use case: voice agents, real-time translation, accessibility.

## TTS (Text to Speech)

```python
# OpenAI TTS
response = client.audio.speech.create(
    model="tts-1",        # ou tts-1-hd
    voice="alloy",        # alloy, echo, fable, onyx, nova, shimmer
    input="Olá, como posso ajudar?",
    response_format="mp3",  # mp3, opus, aac, flac
)
response.stream_to_file("output.mp3")
```

Alternativas:
- **ElevenLabs** — quality top, voice cloning, multilingual.
- **PlayHT** — affordable, decent quality.
- **OpenVoice** (open-source) — self-host.

## Vídeo

### Gemini (Google)

```python
import google.generativeai as genai

model = genai.GenerativeModel("gemini-2.0-pro")
video_file = genai.upload_file(path="meeting.mp4")

response = model.generate_content([
    "Summarize the key points of this meeting.",
    video_file,
])
```

Gemini é state-of-art em vídeo (até 1h de vídeo input).

### Claude / GPT — sem vídeo nativo (2026)

Workaround: extrair frames + audio separado.

```python
import cv2

# Extract frames a cada 5s
cap = cv2.VideoCapture("video.mp4")
fps = cap.get(cv2.CAP_PROP_FPS)
frames = []
for i in range(0, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), int(fps * 5)):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ret, frame = cap.read()
    if ret:
        frames.append(frame)

# Send frames + audio transcript to Claude/GPT
```

Em 2026+, expectativa de vídeo nativo em Claude/GPT.

## Interleaved multimodal

Conversation com mix texto + imagem + áudio:

```python
messages = [
    {"role": "user", "content": [
        {"type": "image", "source": {...}},
        {"type": "text", "text": "What is this?"},
    ]},
    {"role": "assistant", "content": "That's a circuit diagram."},
    {"role": "user", "content": [
        {"type": "image", "source": {...other circuit...}},
        {"type": "text", "text": "How does this differ?"},
    ]},
]
```

Útil para tutoring (user mostra figs em sequência), code review com screenshots, debug.

## Common multimodal use cases

### 1. Invoice/receipt processing

```python
class InvoiceData(BaseModel):
    vendor: str
    date: str  # ISO format
    total: float
    items: list[dict]
    tax: float

# Vision direto pra extract structured
result = await instructor_client.messages.create(
    model="claude-sonnet-4-6",
    response_model=InvoiceData,
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {...}},
            {"type": "text", "text": "Extract invoice data."}
        ]
    }]
)
```

### 2. Screenshot to code (UI replicate)

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    messages=[{
        "role": "user",
        "content": [
            {"type": "image", "source": {...screenshot of design...}},
            {"type": "text", "text": "Generate React component matching this UI. Use Tailwind."}
        ]
    }]
)
```

### 3. Voice assistant pipeline

```python
async def voice_pipeline(audio_input: bytes) -> bytes:
    # 1. STT
    transcript = await whisper.transcribe(audio_input)
    
    # 2. LLM
    response_text = await llm.complete(transcript)
    
    # 3. TTS
    audio_output = await tts.synthesize(response_text)
    
    return audio_output
```

Latency budget: 1.5s STT + 2s LLM + 1.5s TTS = 5s total. Realtime API reduces para <1s end-to-end.

### 4. Document QA com PDF

```python
# Claude direto com PDF
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    system=[{
        "type": "text",
        "text": "You are a contract analyst.",
    }, {
        "type": "document",
        "source": {"type": "base64", "media_type": "application/pdf", "data": pdf_data},
        "cache_control": {"type": "ephemeral"},  # cache PDF para Qs subsequentes
    }],
    messages=[{"role": "user", "content": "What is the termination clause?"}]
)
```

PDF cached → subsequent questions são cheap.

## Quality vs cost — selection table

| Task | Recommended approach | Cost/unit | Latency |
|------|---------------------|-----------|---------|
| Simple text recibo | Tesseract + GPT-4o-mini | $0.001 | 2s |
| Layout-complex invoice | AWS Textract + GPT-4o | $0.01 | 3s |
| Handwritten letter | Claude Vision direto | $0.03 | 4s |
| UI screenshot to code | Claude Sonnet Vision | $0.05 | 6s |
| Meeting transcription | Whisper | $0.006/min | RT |
| Voice agent | GPT-4o Realtime | varies | <1s |
| Long video summary | Gemini 2.0 Pro | $0.10 | 30s |
| PDF QA (long doc) | Claude + caching | $0.02 first, $0.002 next | 5s |

## Pitfalls

### 1. Sending huge images

```python
# ❌ 20MP photo → 4000+ tokens, slow
# ✅ Resize antes:
img = Image.open("photo.jpg")
img.thumbnail((1568, 1568))  # Anthropic recommended max
```

### 2. Wrong media type

```python
# Detail importa
{"type": "image", "source": {
    "type": "base64",
    "media_type": "image/jpeg",  # ❌ era "image/jpg"
    ...
}}
# Use "image/jpeg" não "image/jpg"
```

### 3. Audio formato não suportado

Whisper aceita: mp3, mp4, mpeg, mpga, m4a, wav, webm. NÃO aceita: OGG, FLAC em alguns providers. Convert antes:

```python
from pydub import AudioSegment
audio = AudioSegment.from_file("input.ogg")
audio.export("output.mp3", format="mp3")
```

### 4. Vision LLM falha em texto pequeno

```python
# Texto muito pequeno (<10px tall) → vision LLM erra
# Soluções:
# 1. Upscale + sharpen com PIL
# 2. Crop + zoom in pra região específica
# 3. Use OCR como fallback
```

## Checklist — multimodal app

- [ ] Images resized para <1568px antes de envio?
- [ ] OCR + LLM hybrid para text-heavy docs (cheaper)?
- [ ] Vision LLM só quando precisa entender layout/context?
- [ ] PDF input usa Claude doc input (com cache) quando possível?
- [ ] Audio convertido pra formato supported?
- [ ] Realtime API considered para voice agents?
- [ ] Cost por modality tracked separately?
- [ ] Multimodal evals testando cada modalidade?

## Leituras

- Anthropic vision docs (docs.anthropic.com/claude/docs/vision)
- OpenAI vision guide (platform.openai.com/docs/guides/vision)
- OpenAI Whisper docs
- OpenAI Realtime API docs
- Gemini multimodal guides
- "Vision LLMs vs OCR" — comparison studies
- ElevenLabs docs (TTS)
- pydub docs (audio manipulation Python)
