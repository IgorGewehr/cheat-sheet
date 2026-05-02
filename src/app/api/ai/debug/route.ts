import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface DebugDiagnosis {
  causaRaiz: string;
  explicacao: string;
  fix: string;
  fixCodigo?: string;
  comoEvitar: string;
  categoriaBug: string;
  severidade: "critica" | "alta" | "media" | "baixa";
  cardsSugeridos?: string[];
}

const SYSTEM = `Você é um engenheiro sênior especialista em diagnóstico de bugs. Dado um erro e contexto, produza um diagnóstico estruturado.

Seja ESPECÍFICO e ACIONÁVEL. Não seja genérico. Se tem stack trace, cite as linhas relevantes. Se tem código, aponte a linha exata.

Categorias de bug: runtime-error, type-error, async-race, memory-leak, network, database, auth, config, dependency, logic, performance

Responda APENAS JSON válido:
{
  "causaRaiz": "1 frase direta: por que isso está acontecendo",
  "explicacao": "2-4 parágrafos explicando o mecanismo do bug — o PORQUÊ profundo, não só o quê",
  "fix": "Como corrigir — passos concretos",
  "fixCodigo": "snippet de código corrigido (opcional, só se for claro e conciso)",
  "comoEvitar": "Como prevenir esse bug no futuro — padrão ou prática",
  "categoriaBug": "uma das categorias acima",
  "severidade": "critica|alta|media|baixa",
  "cardsSugeridos": ["slug1", "slug2"]
}

Para cardsSugeridos, use APENAS slugs desta lista (se relevante):
n-plus-1, async-patterns, dto-validation, event-driven, outbox-pattern, clean-architecture, hexagonal, rbac-vs-abac, session-cookie-vs-jwt, migrations-zero-downtime, docker-compose-dev, observability, rate-limit-distribuido, background-jobs, repository-pattern, soft-delete-audit, decimal-money, caching-layers, audit-trail-immutable, multi-tenant-strategies, secrets-management, owasp-top10, lgpd-compliance`;

export async function POST(req: NextRequest) {
  try {
    const { erro, stackTrace, codigo, contexto, ambiente } = await req.json() as {
      erro: string;
      stackTrace?: string;
      codigo?: string;
      contexto?: string;
      ambiente?: string;
    };

    if (!erro?.trim()) {
      return NextResponse.json({ error: "Descreva o erro." }, { status: 400 });
    }

    const parts: string[] = [`Erro: ${erro}`];
    if (stackTrace?.trim()) parts.push(`\nStack trace:\n${stackTrace}`);
    if (codigo?.trim()) parts.push(`\nCódigo relevante:\n\`\`\`\n${codigo}\n\`\`\``);
    if (contexto?.trim()) parts.push(`\nContexto: ${contexto}`);
    if (ambiente?.trim()) parts.push(`\nAmbiente: ${ambiente}`);

    const completion = await openai.chat.completions.create({
      model: MODELS.revisor,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: parts.join("\n") },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    return NextResponse.json(JSON.parse(raw) as DebugDiagnosis);
  } catch (err) {
    console.error("[debug]", err);
    return NextResponse.json({ error: "Falha ao diagnosticar." }, { status: 500 });
  }
}
