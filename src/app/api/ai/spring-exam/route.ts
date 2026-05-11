import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getExam, type ExamQuestion } from "@/lib/spring-exam-questions";

export interface QuestionEvaluation {
  questionId: string;
  verdict: "PASS" | "REVIEW" | "FAIL";
  score: number; // 0-10
  feedback: string;
  expectedPoints: string[];
}

export interface ExamEvaluation {
  tier: 1 | 3 | 5;
  finalScore: number;
  passed: boolean;
  threshold: number;
  recommendation: "aprovado" | "revisar-cards" | "refazer-tier";
  feedbackGeral: string;
  pontosFortes: string[];
  areasDesenvolvimento: string[];
  questoes: QuestionEvaluation[];
}

interface SubmittedAnswer {
  questionId: string;
  answer: string;
}

function formatQuestionForPrompt(q: ExamQuestion, answer: string): string {
  let block = `### Questão ${q.id} (tipo: ${q.type}, peso: ${q.weight ?? 1})\n\n${q.prompt}\n`;
  if (q.code) block += `\n\`\`\`kotlin\n${q.code}\n\`\`\`\n`;
  if (q.choices) block += `\nOpções:\n${q.choices.map((c) => `- ${c}`).join("\n")}\n`;
  block += `\nRubrica de avaliação: ${q.rubric}\n`;
  block += `\nResposta do candidato:\n"""\n${answer.trim() || "[em branco]"}\n"""\n`;
  return block;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { tier: number; answers: SubmittedAnswer[] };
    const { tier, answers } = body;

    const exam = getExam(tier);
    if (!exam) {
      return NextResponse.json({ error: "Tier inválido. Use 1, 3 ou 5." }, { status: 400 });
    }

    const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    const questionsBlock = exam.questions
      .map((q) => formatQuestionForPrompt(q, answerMap.get(q.id) ?? ""))
      .join("\n---\n");

    const totalWeight = exam.questions.reduce((s, q) => s + (q.weight ?? 1), 0);

    const completion = await openai.chat.completions.create({
      model: MODELS.springExam,
      messages: [
        {
          role: "system",
          content: `Você é um entrevistador sênior em Spring Boot + Kotlin avaliando o exame Tier ${exam.tier} de um candidato (alvo: ${exam.title}). Seja rigoroso, técnico e honesto. Use a rubrica de cada questão como gabarito — não invente critérios.

Para cada questão atribua:
- verdict: PASS (≥7), REVIEW (4-6), FAIL (≤3)
- score: 0-10
- feedback: 1-2 frases técnicas, sem floreio. Cite o que faltou de concreto.
- expectedPoints: lista dos pontos da rubrica que o candidato NÃO mencionou (vazio se PASS).

Score final agregado é média ponderada por weight, escalada para 0-100. Threshold de aprovação: ${exam.passThreshold}.

Recomendação:
- "aprovado": acima do threshold com poucos REVIEWs
- "revisar-cards": acima do threshold mas com 3+ REVIEWs ou 1 FAIL — sugerir cards específicos
- "refazer-tier": abaixo do threshold

Retorne JSON com EXATAMENTE esta estrutura:
{
  "tier": ${exam.tier},
  "finalScore": number (0-100),
  "passed": boolean,
  "threshold": ${exam.passThreshold},
  "recommendation": "aprovado" | "revisar-cards" | "refazer-tier",
  "feedbackGeral": "string — avaliação em 3-5 frases",
  "pontosFortes": ["string"],
  "areasDesenvolvimento": ["string"],
  "questoes": [
    { "questionId": "string", "verdict": "PASS"|"REVIEW"|"FAIL", "score": number, "feedback": "string", "expectedPoints": ["string"] }
  ]
}`,
        },
        {
          role: "user",
          content: `Total de weight: ${totalWeight}. Avalie todas as ${exam.questions.length} questões.\n\n${questionsBlock}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content ?? "{}") as ExamEvaluation;
    return NextResponse.json(result);
  } catch (err) {
    console.error("[spring-exam] erro:", err);
    return NextResponse.json({ error: "Erro ao avaliar exame." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: "POST tier (1|3|5) e answers para avaliação do exame Spring Boot + Kotlin.",
    body: {
      tier: "1 | 3 | 5",
      answers: "[{ questionId: string, answer: string }]",
    },
  });
}
