import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json() as {
      prompt: string;
      context?: { projectName?: string; stack?: string[]; module?: string };
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt obrigatório." }, { status: 400 });
    }

    const systemPrompt = `Você é um especialista em prompt engineering para desenvolvimento de software.
Sua tarefa é melhorar um prompt técnico para obter o melhor resultado possível de IAs generativas como Claude ou GPT.

Ao melhorar o prompt, você deve:
1. Adicionar contexto técnico relevante que pode estar faltando
2. Especificar edge cases que a IA precisa considerar
3. Adicionar requisitos de qualidade (testes, tratamento de erros, logs, segurança)
4. Estruturar o prompt com seções claras (contexto, tarefa, restrições, formato de saída)
5. Adicionar exemplos de entrada/saída quando aplicável
6. Incluir critérios explícitos de aceite

Mantenha o prompt em português e retorne APENAS o prompt melhorado, sem explicações sobre as mudanças.
O prompt deve ser completo e pronto para usar.`;

    const contextInfo = context
      ? `\nContexto do projeto: ${context.projectName ?? "não especificado"}, Stack: ${context.stack?.join(", ") ?? "não especificada"}, Módulo: ${context.module ?? "não especificado"}`
      : "";

    const completion = await openai.chat.completions.create({
      model: MODELS.enhance,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Melhore este prompt:${contextInfo}\n\n---\n${prompt}` },
      ],
    });

    return NextResponse.json({ enhanced: completion.choices[0].message.content });
  } catch (err) {
    console.error("AI enhance error:", err);
    return NextResponse.json({ error: "Falha ao melhorar o prompt." }, { status: 500 });
  }
}
