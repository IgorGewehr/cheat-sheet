import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface AntiPatternChallenge {
  codigo: string;
  linguagem: string;
  dificuldade: "facil" | "medio" | "dificil";
}

export interface AntiPatternFeedback {
  nomeAntiPattern: string;
  acertou: boolean;
  explicacao: string;
  comoCorrigir: string;
  codigoCorrigido?: string;
  dicas: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "generate") {
      const { dificuldade = "medio" } = body as { dificuldade?: string };

      const completion = await openai.chat.completions.create({
        model: MODELS.antiPattern,
        messages: [
          {
            role: "system",
            content: `Você é um instrutor de código. Gere um trecho de código TypeScript/JavaScript/SQL com um anti-pattern real embutido. O código deve parecer plausível e ser do tipo que se veria em um projeto real. Não mencione o problema — o estudante deve encontrá-lo. Use um destes anti-patterns: N+1 Query, God Object, Magic Numbers, Hardcoded Secrets, Missing Error Handling, Race Condition, Mutation in Loop, Missing Index, SELECT *, God Function. Retorne JSON.`,
          },
          {
            role: "user",
            content: `Gere um desafio de dificuldade "${dificuldade}".

Retorne um JSON com:
{
  "codigo": "string com o trecho de código contendo o anti-pattern (não mencione qual é o problema no código em si)",
  "linguagem": "typescript" | "javascript" | "sql" | "python",
  "dificuldade": "${dificuldade}"
}

O código deve ter entre 15-40 linhas, parecer código real de produção, e ter o anti-pattern sutil o suficiente para o nível de dificuldade escolhido.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(
        completion.choices[0].message.content ?? "{}",
      ) as AntiPatternChallenge;

      return NextResponse.json(result);
    }

    if (body.action === "evaluate") {
      const { codigo, identificacao, nomeAntiPattern } = body as {
        codigo: string;
        identificacao: string;
        nomeAntiPattern: string;
      };

      const completion = await openai.chat.completions.create({
        model: MODELS.antiPattern,
        messages: [
          {
            role: "system",
            content: `Compare a identificação do estudante com o anti-pattern real no código. Avalie se o estudante identificou o problema corretamente (mesmo que não soubesse o nome oficial). Seja generoso: se identificou o problema substancialmente correto, marque acertou=true. Explique o anti-pattern e como corrigir. Retorne JSON.`,
          },
          {
            role: "user",
            content: `Código com anti-pattern:
\`\`\`
${codigo}
\`\`\`

O estudante disse que o anti-pattern é: "${nomeAntiPattern}"

Descrição do problema pelo estudante:
${identificacao}

Retorne um JSON com:
{
  "nomeAntiPattern": "nome oficial do anti-pattern (ex: 'N+1 Query', 'God Object')",
  "acertou": true/false,
  "explicacao": "markdown: o que é esse anti-pattern, por que é prejudicial, onde aparece no código",
  "comoCorrigir": "markdown: como corrigir esta instância específica",
  "codigoCorrigido": "versão corrigida do código (opcional)",
  "dicas": ["array com pistas que estavam no código e indicavam o problema"]
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(
        completion.choices[0].message.content ?? "{}",
      ) as AntiPatternFeedback;

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar desafio." }, { status: 500 });
  }
}
