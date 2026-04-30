import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export interface ProximaPergunta {
  pergunta: string;
  tipo: "abertura" | "tecnica" | "comportamental" | "followup" | "system-design" | "encerramento";
  dica?: string;
  concluido: boolean;
}

export interface AvaliacaoFinal {
  scoreGeral: number;
  dimensoes: {
    conhecimentoTecnico: number;
    comunicacao: number;
    resolucaoProblemas: number;
    lideranca: number;
    cultura: number;
  };
  pontosFortes: string[];
  areasDesenvolvimento: string[];
  feedbackDetalhadoPorPergunta: Array<{ pergunta: string; avaliacao: string; score: number }>;
  recomendacaoContratacao: "forte-sim" | "sim" | "talvez" | "nao";
  feedbackGeral: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "next-question") {
      const { tipo, nivel, historico } = body as {
        tipo: string;
        nivel: string;
        historico: Array<{ pergunta: string; resposta: string }>;
      };

      const historicoText =
        historico.length > 0
          ? historico
              .map((h, i) => `Pergunta ${i + 1}: ${h.pergunta}\nResposta: ${h.resposta}`)
              .join("\n\n")
          : "Nenhuma pergunta anterior — esta é a primeira pergunta.";

      const completion = await openai.chat.completions.create({
        model: MODELS.mockInterview,
        messages: [
          {
            role: "system",
            content: `Você é um entrevistador técnico sênior conduzindo uma entrevista para posição de ${nivel}. Faça perguntas progressivamente mais profundas. Comece com abertura (apresentação, motivação), avance para técnico (padrões, arquitetura, decisões passadas), comportamental (conflitos, liderança, failures), e encerre com dúvidas do candidato. Adapte baseado no histórico. Após 8-10 perguntas, marque concluido=true. Responda JSON.

Tipo de entrevista: ${tipo}

Retorne um JSON com esta estrutura exata:
{
  "pergunta": "string — a próxima pergunta da entrevista",
  "tipo": "abertura" | "tecnica" | "comportamental" | "followup" | "system-design" | "encerramento",
  "dica": "string opcional — o que faz uma boa resposta (mostrar apenas após o candidato responder)",
  "concluido": boolean
}`,
          },
          {
            role: "user",
            content: `Histórico da entrevista até agora:\n\n${historicoText}\n\nGere a próxima pergunta.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      return NextResponse.json(
        JSON.parse(completion.choices[0].message.content ?? "{}") as ProximaPergunta,
      );
    }

    if (action === "evaluate") {
      const { tipo, nivel, perguntas } = body as {
        tipo: string;
        nivel: string;
        perguntas: Array<{ pergunta: string; resposta: string }>;
      };

      const perguntasText = perguntas
        .map((p, i) => `Pergunta ${i + 1}: ${p.pergunta}\nResposta do candidato: ${p.resposta}`)
        .join("\n\n---\n\n");

      const completion = await openai.chat.completions.create({
        model: MODELS.mockInterview,
        messages: [
          {
            role: "system",
            content: `Você é um entrevistador avaliando um candidato após a entrevista completa. Seja rigoroso e honesto. Avalie cada dimensão separadamente. A recomendação deve refletir se você contrataria de verdade. Responda JSON.

Tipo de entrevista: ${tipo}
Nível da posição: ${nivel}

Retorne um JSON com esta estrutura exata:
{
  "scoreGeral": number (0-100),
  "dimensoes": {
    "conhecimentoTecnico": number (0-10),
    "comunicacao": number (0-10),
    "resolucaoProblemas": number (0-10),
    "lideranca": number (0-10),
    "cultura": number (0-10)
  },
  "pontosFortes": ["string"],
  "areasDesenvolvimento": ["string"],
  "feedbackDetalhadoPorPergunta": [{ "pergunta": "string", "avaliacao": "string", "score": number (0-10) }],
  "recomendacaoContratacao": "forte-sim" | "sim" | "talvez" | "nao",
  "feedbackGeral": "string — avaliação geral em 3-5 frases"
}`,
          },
          {
            role: "user",
            content: `Transcrição completa da entrevista:\n\n${perguntasText}\n\nAvalie este candidato.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      return NextResponse.json(
        JSON.parse(completion.choices[0].message.content ?? "{}") as AvaliacaoFinal,
      );
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar entrevista." }, { status: 500 });
  }
}
