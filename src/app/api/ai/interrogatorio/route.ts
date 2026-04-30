import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface InterrogatorioResposta {
  pergunta: string;
  fase: "exploracao" | "aprofundamento" | "sintese" | "conclusao";
  progresso: number;
  lacunasDetectadas: string[];
  pronto: boolean;
  briefingSenior?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { historico, tema, acaoUsuario } = body as {
      historico: { role: "user" | "assistant"; content: string }[];
      tema: string;
      acaoUsuario: string;
    };

    const completion = await openai.chat.completions.create({
      model: MODELS.interrogatorio,
      messages: [
        {
          role: "system",
          content: `Você é um mentor sênior usando o método socrático. NUNCA forneça a resposta diretamente. Faça perguntas que levem o estudante a descobrir por conta própria. Siga estas fases: exploração (entenda o que ele já sabe), aprofundamento (challenge his assumptions, dig deeper), síntese (make him connect the dots), conclusão (verify understanding). Quando o estudante demonstrar entendimento suficiente (progresso >= 80), marque pronto=true e forneça um briefing sênior. Responda JSON.

Retorne um JSON com esta estrutura exata:
{
  "pergunta": "string — próxima pergunta socrática",
  "fase": "exploracao" | "aprofundamento" | "sintese" | "conclusao",
  "progresso": number (0-100),
  "lacunasDetectadas": ["string"],
  "pronto": boolean,
  "briefingSenior": "string — apenas quando pronto=true, guia técnico sênior completo"
}`,
        },
        {
          role: "user",
          content: `O estudante quer: ${acaoUsuario}\nTema: ${tema}\n\nHistórico da conversa até agora:\n${historico.map((m) => `${m.role === "user" ? "Estudante" : "Mentor"}: ${m.content}`).join("\n\n")}\n\nAvalie o progresso do estudante e faça a próxima pergunta socrática apropriada.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return NextResponse.json(
      JSON.parse(completion.choices[0].message.content ?? "{}") as InterrogatorioResposta,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar interrogatório." }, { status: 500 });
  }
}
