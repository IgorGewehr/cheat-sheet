import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

const VALID_CATEGORIES = [
  "arquiteturas",
  "auth",
  "padroes-frontend",
  "padroes-backend",
  "banco",
  "stack-guides",
  "infra",
  "testes",
  "prompts",
  "checklists",
  "armadilhas-ia",
  "craft",
] as const;

const SYSTEM_PROMPT = `Você é um engenheiro sênior especialista em criar knowledge cards para desenvolvedores.

Gere um card de conhecimento técnico completo em JSON seguindo EXATAMENTE esta estrutura:

{
  "title": "Título claro e conciso do padrão",
  "category": "uma das categorias válidas",
  "stack": ["tecnologias", "relevantes"],
  "tags": ["tags", "específicas"],
  "excerpt": "Uma frase descrevendo o padrão e quando usá-lo",
  "body": "conteúdo markdown completo"
}

Categorias válidas: arquiteturas, auth, padroes-frontend, padroes-backend, banco, stack-guides, infra, testes, prompts, checklists, armadilhas-ia, craft

O campo "body" deve ser um Markdown completo seguindo EXATAMENTE este template:

## Quando usar

[2-3 situações concretas onde este padrão é a escolha certa]

## Quando NÃO usar

[2-3 anti-padrões ou situações onde não aplicar]

## Como implementar

[Explicação técnica com exemplos de código quando relevante]

## Como pedir pra IA

[Prompt template específico para solicitar este padrão a uma IA generativa. Inclua variáveis em {{duplas chaves}} como {{nome_do_modulo}}, {{stack}}, etc.]

## Como auditar o que a IA gerou

- [ ] Critério de auditoria 1
- [ ] Critério de auditoria 2
- [ ] Critério de auditoria 3
- [ ] Critério de auditoria 4
- [ ] Critério de auditoria 5

## Armadilhas comuns

[3-4 erros que a IA costuma cometer ao implementar este padrão]

Regras:
- Escreva em português brasileiro
- Seja específico e técnico, não genérico
- Os checklists devem ter pelo menos 5 itens verificáveis
- O prompt pra IA deve ser um template real e detalhado
- Responda APENAS com o JSON válido, sem markdown ao redor, sem explicações`;

export async function POST(req: NextRequest) {
  try {
    const { description, stack } = await req.json() as {
      description: string;
      stack?: string;
    };

    if (!description?.trim()) {
      return NextResponse.json({ error: "Descrição obrigatória." }, { status: 400 });
    }

    const userMessage = `Crie um card de conhecimento técnico sobre:

${description}

${stack ? `Stack/tecnologias do projeto: ${stack}` : ""}

Gere o card completo seguindo o template especificado.`;

    const completion = await openai.chat.completions.create({
      model: MODELS.card,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      title?: string;
      category?: string;
      stack?: string[];
      tags?: string[];
      excerpt?: string;
      body?: string;
    };

    const category = VALID_CATEGORIES.includes(parsed.category as typeof VALID_CATEGORIES[number])
      ? parsed.category
      : "padroes-backend";

    return NextResponse.json({
      title: parsed.title ?? "",
      category,
      stack: Array.isArray(parsed.stack) ? parsed.stack.join(", ") : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.join(", ") : "",
      excerpt: parsed.excerpt ?? "",
      body: parsed.body ?? "",
    });
  } catch (err) {
    console.error("AI generate-card error:", err);
    return NextResponse.json({ error: "Falha ao gerar card." }, { status: 500 });
  }
}
