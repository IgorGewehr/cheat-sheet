import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import type { ChallengeArea, ChallengeRank, CodingChallenge } from "@/lib/coding-challenge-types";

const AREA_LABEL: Record<ChallengeArea, string> = {
  "arrays-strings":  "Arrays e Strings (two pointers, sliding window)",
  "hashmaps":        "Hash Maps e Sets (frequência, agrupamento, prefix sum)",
  "trees-graphs":    "Árvores e Grafos (BFS, DFS, componentes conectados)",
  "dp":              "Dynamic Programming (subproblemas sobrepostos, memoização)",
  "nestjs-design":   "Design de Sistema/API em NestJS (estrutura de módulo, padrões)",
};

const RANK_LABEL: Record<ChallengeRank, string> = {
  E: "Fácil — aquecimento, fundamentos básicos, O(n) direto",
  D: "Médio — requer um padrão específico, típico de entrevista pleno",
  C: "Difícil — típico de entrevista sênior, requer insight não óbvio",
  B: "Expert — nível FAANG/Staff, múltiplas otimizações necessárias",
};

const FALLBACK: CodingChallenge = {
  titulo: "Erro ao gerar desafio",
  area: "arrays-strings",
  rank: "D",
  enunciado: "Não foi possível gerar o desafio. Tente novamente.",
  exemplos: [],
  dicas: [],
  expectedConcepts: [],
  complexidadeEsperada: "—",
};

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }

  const { area, rank } = (await req.json()) as { area: ChallengeArea; rank: ChallengeRank };

  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.enhance,
      messages: [
        {
          role: "system",
          content: `Você é um entrevistador técnico sênior especializado em vagas de backend com NestJS e TypeScript.
Gere problemas de entrevista realistas — não puzzles abstratos. Problemas que aparecem em empresas de produto reais.
Os exemplos devem ser claros e as dicas devem ser progressivas (não entregar a solução de uma vez).
Retorne SOMENTE JSON válido no formato especificado.`,
        },
        {
          role: "user",
          content: `Gere um problema de entrevista técnica com estas características:
- Área: ${AREA_LABEL[area]}
- Dificuldade: ${RANK_LABEL[rank]}
- Linguagem: TypeScript (Node.js/NestJS context)
- Contexto: desenvolvedor backend, pode referenciar cenários reais (pedidos, usuários, eventos, cache)

Retorne JSON exatamente neste formato:
{
  "titulo": "string — título claro e específico do problema",
  "enunciado": "string — descrição completa com contexto, constraints e o que retornar",
  "exemplos": [
    { "input": "string", "output": "string", "explicacao": "string opcional" }
  ],
  "dicas": ["string — dica 1 (mais suave)", "string — dica 2 (mais direta)", "string — dica 3 (quase entrega o padrão)"],
  "expectedConcepts": ["conceito 1", "conceito 2", "conceito 3"],
  "complexidadeEsperada": "O(n) tempo, O(n) espaço"
}

Inclua 2-3 exemplos e 3 dicas. O enunciado deve ter constraints claros (tamanho do input, valores possíveis).`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    let parsed: Partial<CodingChallenge>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(FALLBACK);
    }

    const challenge: CodingChallenge = {
      titulo: parsed.titulo ?? FALLBACK.titulo,
      area,
      rank,
      enunciado: parsed.enunciado ?? FALLBACK.enunciado,
      exemplos: Array.isArray(parsed.exemplos) ? parsed.exemplos : [],
      dicas: Array.isArray(parsed.dicas) ? parsed.dicas : [],
      expectedConcepts: Array.isArray(parsed.expectedConcepts) ? parsed.expectedConcepts : [],
      complexidadeEsperada: parsed.complexidadeEsperada ?? "—",
    };

    return NextResponse.json(challenge);
  } catch (err) {
    console.error("[coding-challenge/gerar]", err);
    return NextResponse.json(FALLBACK);
  }
}
