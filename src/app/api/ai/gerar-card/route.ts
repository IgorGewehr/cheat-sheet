import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import type { CardCategory } from "@/lib/types";

export interface CardGerado {
  title: string;
  category: CardCategory;
  stack: string[];
  tags: string[];
  excerpt: string;
  body: string;
}

export interface GerarCardResult {
  cards: CardGerado[];
}

const VALID_CATEGORIES: CardCategory[] = [
  "arquiteturas", "auth", "padroes-frontend", "padroes-backend",
  "banco", "stack-guides", "infra", "testes", "craft",
  "agentes-ia", "data-science", "govtech",
];

export async function POST(req: NextRequest) {
  try {
    const { contexto, categoria, stack, quantidade = 3 } = await req.json() as {
      contexto: string;
      categoria?: CardCategory;
      stack?: string[];
      quantidade?: number;
    };

    if (!contexto?.trim()) {
      return NextResponse.json({ error: "Descreva o contexto ou problema." }, { status: 400 });
    }

    const n = Math.min(Math.max(quantidade, 2), 4);

    const systemPrompt = `Você é um arquiteto sênior de software criando cards de conhecimento para uma biblioteca técnica.
Dado um contexto ou problema, gere ${n} abordagens/padrões distintos como cards de conhecimento.

Cada card deve ser:
- Uma abordagem real e bem estabelecida, não inventada
- Opinionado: explique QUANDO usar e QUANDO não usar
- Prático: inclua exemplos de código quando relevante
- Completo: cubra trade-offs, armadilhas e casos de uso reais

Categorias disponíveis: ${VALID_CATEGORIES.join(", ")}

Responda APENAS JSON válido:
{
  "cards": [
    {
      "title": "Nome conciso e descritivo da abordagem",
      "category": "categoria da lista acima",
      "stack": ["tecnologias relevantes"],
      "tags": ["3-5 tags específicas"],
      "excerpt": "1-2 frases descrevendo quando e por que usar esta abordagem",
      "body": "markdown completo com seções: ## Visão Geral, ## Quando usar, ## Trade-offs, ## Implementação (com código), ## Armadilhas"
    }
  ]
}`;

    const userMessage = `Contexto / Problema:
${contexto.trim()}
${categoria ? `\nCategoria preferida: ${categoria}` : ""}
${stack?.length ? `\nStack do projeto: ${stack.join(", ")}` : ""}

Gere ${n} abordagens distintas como cards de conhecimento. As abordagens devem ser genuinamente diferentes (não variações do mesmo padrão).`;

    const completion = await openai.chat.completions.create({
      model: MODELS.card,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as GerarCardResult;

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao gerar cards." }, { status: 500 });
  }
}
