---
title: Fuzzing Moderno — AFL++, LibFuzzer, Go Fuzz, Atheris
category: auth
stack: [AFL++, LibFuzzer, OSS-Fuzz, Go fuzz, Atheris]
tags: [fuzzing, coverage-guided, oss-fuzz, vulnerability-research]
excerpt: Coverage-guided fuzzing, structure-aware fuzzing, fuzzing nativo em Go (1.18+), Atheris pra Python, contribuição em OSS-Fuzz.
related: [sec-secure-code-review-playbook, sec-server-side-attacks]
updated: "2026-05-10"
---

## O que fuzzing faz que SAST não faz

SAST analisa código estaticamente — encontra padrões. Fuzzing **executa o código** com input gerado e busca crashes, hangs, memory errors, assertions.

Fuzzing pega:
- Parsers (XML, JSON, ASN.1, protobufs).
- Crypto libraries (boundaries de input).
- Image/video/audio decoders (decadência de Imagemagick, ffmpeg).
- Protocol implementations.
- VM/sandbox isolation.
- File format parsers.

Vulnerabilidades clássicas encontradas via fuzzing:
- Heartbleed (OpenSSL) — encontrável via fuzzing parser TLS.
- Shellshock (bash) — bash parser.
- Centenas de CVEs em ffmpeg, ImageMagick, glibc.
- WebKit, Chromium V8, Firefox SpiderMonkey continuamente fuzzed.

## Tipos de fuzzing

### Dumb / blackbox fuzzing

Random mutations sem feedback. Útil só pra protocolos simples ou validação inicial.

### Coverage-guided fuzzing

Instrument binário pra rastrear edges (branches) executados. Fuzzer prioriza inputs que cobrem novos edges → explora código systematicamente.

**Ferramentas**: AFL++, LibFuzzer, Honggfuzz.

### Structure-aware fuzzing

Fuzzer respeita formato de input (e.g., gera JSON, protobuf válido). Reduz busca em inválidos óbvios.

**Ferramentas**: LibProtobufMutator, custom mutator AFL++, Atheris structure mode.

### Symbolic / Concolic execution

Combina symbolic execution com fuzzing — descobre paths que random não acharia. Cresce com complexity.

**Ferramentas**: KLEE, SymCC, Driller, Manticore.

### Differential fuzzing

Mesmo input pra duas implementations (e.g., 2 parsers JSON). Resultado diferente = bug.

Bom pra: compilers (clang vs gcc), JSON parsers (RapidJSON vs Jansson), crypto (multiple SHA-256 impls).

## AFL++ — workhorse

```bash
# Install
apt install afl++

# Compile target com instrumentação
afl-clang-fast -o target_fuzzer target_fuzzer.c

# Prepare corpus (initial seed inputs)
mkdir corpus
echo '{"key":"value"}' > corpus/seed1
echo '{}' > corpus/seed2

# Run fuzzing
afl-fuzz -i corpus -o output ./target_fuzzer @@
# @@ é placeholder pra arquivo de input

# Watch UI — status, crashes, hangs found
# Output diretory tem:
# - queue/   ← interesting inputs found
# - crashes/ ← inputs that caused crash
# - hangs/   ← inputs that caused hang
```

### Tuning AFL++

- **Parallel**: `afl-fuzz -M master ...` + `afl-fuzz -S slave1 ...` em outros cores.
- **Dictionary**: `-x dict.txt` com tokens conhecidos (JSON keys, HTTP methods).
- **Custom mutator**: plug-in pra estrutura conhecida.
- **CMPLOG**: detect comparison instructions, mutate to satisfy.
- **Persistent mode**: 10-100x rápido — target lê multiple inputs por exec.

```c
// LibFuzzer persistent mode
#include <stddef.h>
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    parse_format(data, size);
    return 0;
}
```

## LibFuzzer — in-process

LibFuzzer (LLVM project) é fuzzer in-process — mesma execução do target.

```c
// fuzz_target.c
#include <string.h>

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    if (size < 4) return 0;
    if (data[0] == 'F' && data[1] == 'U' && data[2] == 'Z' && data[3] == 'Z') {
        // Bug here — abort detected
        __builtin_trap();
    }
    return 0;
}
```

```bash
clang -fsanitize=fuzzer,address -o fuzz fuzz_target.c
./fuzz corpus/   # discovers "FUZZ" prefix
```

Sanitizers (ASan, UBSan, TSan, MSan) combine for memory error detection.

## Go Fuzz (nativo, 1.18+)

Go tem fuzzing built-in desde 1.18:

```go
// fuzz_test.go
package mypackage

import "testing"

func FuzzParseURL(f *testing.F) {
    // Seed corpus
    f.Add("https://example.com/path?q=1")
    f.Add("")
    f.Add("invalid url")
    
    f.Fuzz(func(t *testing.T, urlStr string) {
        u, err := ParseURL(urlStr)
        if err != nil {
            return
        }
        // Property check
        if u.String() != urlStr && !equivalent(u.String(), urlStr) {
            t.Errorf("round-trip failed: %s → %s", urlStr, u.String())
        }
    })
}
```

```bash
# Run fuzz
go test -fuzz=FuzzParseURL -fuzztime=10s ./mypackage

# Crashes salvos em testdata/fuzz/<test>/
```

Pra Go projects, fuzzing nativo + `go test -race` cobre ampla área. OSS-Fuzz integration is straightforward.

## Atheris — fuzz Python (Google)

```python
# fuzz_target.py
import atheris
import sys

with atheris.instrument_imports():
    import my_parser

def TestOneInput(data):
    fdp = atheris.FuzzedDataProvider(data)
    s = fdp.ConsumeUnicodeNoSurrogates(1024)
    try:
        my_parser.parse(s)
    except (ValueError, TypeError):
        pass   # expected
    # Any other exception (or memory issues) caught.

atheris.Setup(sys.argv, TestOneInput)
atheris.Fuzz()
```

```bash
pip install atheris
python fuzz_target.py
```

## Structure-aware — exemplo protobuf

```python
import atheris
from google.protobuf import message_factory
from my_pb2 import MyMessage

@atheris.instrument_func
def TestOneInput(data):
    msg = MyMessage()
    try:
        msg.ParseFromString(data)
        process_message(msg)
    except Exception as e:
        if not isinstance(e, ValueError):
            raise   # only ValueError expected

atheris.Setup(sys.argv, TestOneInput)
atheris.Fuzz()
```

Ou via libprotobuf-mutator em LibFuzzer (C++).

## OSS-Fuzz — contribuir

OSS-Fuzz (Google) roda fuzzers em projects open-source 24/7. Bugs encontrados disclosed após patch.

### Como contribuir

1. **Choose project** com fuzzers vazios ou ausentes.
2. **Submit fuzz target** em PR.
3. **OSS-Fuzz roda** continuamente.
4. **Receives credits** — bug bounty pra critical findings (até $20k+ pra issues sérios).
5. **Reputation**: contributions track-able, looks great in resume.

```bash
# Clone OSS-Fuzz repo
git clone https://github.com/google/oss-fuzz.git
cd oss-fuzz/projects/<project_name>

# Build localmente
python3 infra/helper.py build_image <project>
python3 infra/helper.py build_fuzzers --sanitizer address <project>
python3 infra/helper.py run_fuzzer <project> <fuzzer_name>

# Submit PR
```

Projects sempre needing fuzzers: protobuf parsers, custom CSV parsers, network protocol implementations, image format decoders.

## Honggfuzz — alternative

Honggfuzz (Google) é fuzzer com SAN coverage measurement:
- Persistent mode native.
- macOS support melhor que AFL++.
- Network fuzzing built-in.

## Vulnerability research workflow

1. **Choose target**: project well-known + low fuzzing coverage.
2. **Write fuzzer**: pick API entry point most likely to crash.
3. **Seed corpus**: existing valid inputs (test files, samples).
4. **Run for days/weeks**.
5. **Triage crashes**: dedup by stack trace; minimize crash inputs (`afl-tmin`).
6. **Reproduce manually**: confirm crash, understand root cause.
7. **Disclose responsibly**: contact maintainer, 90-day disclosure.
8. **CVE request** if security-relevant.

## What goes wrong (common pitfalls)

- **No coverage feedback enabled** — running blackbox by accident.
- **Sanitizers off** — missing memory bugs.
- **Bad seed corpus** — empty or non-representative.
- **Fuzz target too high-level** — never reaches interesting code.
- **No persistent mode** — too slow.
- **Resources allocated wrong** — fuzz one core for 1h vs 16 cores 24h.
- **No corpus minimization** — corpus blows up to GB, slows down.

## Differential fuzzing example

```python
# Test JSON parsers
def TestOneInput(data):
    fdp = atheris.FuzzedDataProvider(data)
    json_input = fdp.ConsumeUnicodeNoSurrogates(1024)
    
    try:
        result_a = json_lib_a.loads(json_input)
    except Exception:
        result_a = None
    
    try:
        result_b = json_lib_b.loads(json_input)
    except Exception:
        result_b = None
    
    # Differential bug if both succeed but differ
    if result_a is not None and result_b is not None and result_a != result_b:
        raise AssertionError(f"Mismatch: {json_input}")
```

Achados famosos: GoLang `net/url` vs Python `urllib.parse` interpretations (CVE-2023-XXXX em SSRF context).

## ML-guided fuzzing — emerging

Em 2025-2026, fuzzers começam usar ML pra:
- Predict promising mutations.
- Learn protocol grammar de corpus.
- Generate fuzzing harness via LLM.

Tools: **DeepFuzz**, **LLM4Fuzz** (research). Not production-mature yet, mas estudar.

## Custos / ROI

Fuzzing requer:
- CPU (servers / cloud com sustained util).
- Tempo (often weeks for first deep bug).
- Triage capacity (bugs found needs reproduction).

ROI alto pra:
- Crypto libraries (single bug = wide impact).
- Parsers em format complexo (HTML, X.509, ASN.1).
- Network stack pieces.

ROI baixo pra:
- Apps web (use SAST + DAST).
- Business logic (no random input model).
- Async/distributed (race conditions need fuzzing+threading approach).

## Engagement modelo — fuzzing consultoria

Tipos de engagement:
- **Audit + fuzz**: 4-8 semanas, develop fuzzers customizados, report findings.
- **CI integration**: setup OSS-Fuzz para project, 1-2 semanas.
- **Vulnerability research retainer**: ongoing, $5-15k/mo, focus em targets defined.

Cliente comum: crypto/security companies (Cure53 model), embedded/IoT, browser vendors.

## Checklist before engagement

- [ ] Project escolhido com low fuzzing coverage?
- [ ] Build infrastructure setup (Docker, sanitizers)?
- [ ] Seed corpus collected (good quality)?
- [ ] Fuzz targets identified (parser entry points)?
- [ ] Persistent mode enabled?
- [ ] Coverage report enabled?
- [ ] CI pipeline integration possible?
- [ ] Disclosure policy documentada?

## Leituras

- "The Fuzzing Book" (fuzzingbook.org) — free, comprehensive
- "Fuzzing Brute Force Vulnerability Discovery" — Sutton, Greene, Amini
- OSS-Fuzz blog (google.github.io/oss-fuzz)
- AFL++ docs (aflplus.plus)
- LibFuzzer tutorial (llvm.org/docs/LibFuzzer.html)
- Google's "Fuzzing for SQLite" article — case study
- "Project Zero" blog — fuzzing-found CVEs
