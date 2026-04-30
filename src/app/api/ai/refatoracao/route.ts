import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface RefatoracaoResposta {
  mensagem: string;
  etapa: "diagnostico" | "planejamento" | "implementacao" | "validacao";
  progresso: number;
  hints?: string[];
  concluido: boolean;
  resumoFinal?: string;
}

const SYSTEM_PROMPT = `Você é um tech lead sênior ensinando refatoração pelo método socrático. NUNCA forneça o código refatorado. Guie o desenvolvedor ATRAVÉS DE PERGUNTAS a descobrir os problemas e as soluções por conta própria.

Fases:
- diagnostico: Faça perguntas para o dev identificar responsabilidades, violações, problemas. Ex: 'Quantas responsabilidades diferentes você consegue identificar nessa função?'
- planejamento: Guie a proposta de solução. Ex: 'Como você dividiria essas responsabilidades?'
- implementacao: Quando o dev propuser uma solução, questione edge cases. Ex: 'Como essa mudança afeta o tratamento de erro?'
- validacao: Valide o entendimento. Ex: 'Que princípio SOLID você aplicou aqui?'

Avance a etapa quando o dev demonstrar entendimento suficiente na etapa atual.

Retorne APENAS JSON válido no formato:
{
  "mensagem": "sua pergunta socrática ou orientação (NUNCA o código solução)",
  "etapa": "diagnostico" | "planejamento" | "implementacao" | "validacao",
  "progresso": 0-100,
  "hints": ["dica opcional se o dev estiver travado, sem revelar a solução"],
  "concluido": false,
  "resumoFinal": "apenas quando concluido=true — o que o dev aprendeu"
}

Regras:
- NUNCA escreva código refatorado
- Hints são opcionais — só inclua se o dev demonstrar que está travado
- progresso aumenta conforme o dev demonstra entendimento real
- concluido=true apenas quando validacao estiver completa e o dev demonstrou entendimento profundo
- Responda em português`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      codigo: string;
      historico: Message[];
      etapa: "diagnostico" | "planejamento" | "implementacao" | "validacao";
    };

    const { codigo, historico, etapa } = body;

    if (!codigo?.trim()) {
      return NextResponse.json({ error: "Cole o código para refatorar." }, { status: 400 });
    }

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Código para refatorar:\n\`\`\`\n${codigo}\n\`\`\`\n\nEtapa atual: ${etapa}`,
      },
      ...historico.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    if (historico.length === 0) {
      messages.push({
        role: "user",
        content: "Inicie a sessão de refatoração socrática. Comece com uma pergunta de diagnóstico.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: MODELS.refatoracao,
      messages,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as RefatoracaoResposta;
    return NextResponse.json(result);
  } catch (err) {
    console.error("Refatoracao AI error:", err);
    return NextResponse.json({ error: "Erro ao processar a refatoração." }, { status: 500 });
  }
}
