import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import type { Decisao, Adocao } from "@/lib/types";

export interface QuestResult {
  decisao: Decisao | null;
  pergunta: string;
  contexto: string;
  fallback: boolean;
}

const TRINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
const QUATORZE_DIAS = 14 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { decisoes = [], adocoes = [] } = (await req.json()) as {
      decisoes?: Decisao[];
      adocoes?: Adocao[];
    };

    const agora = Date.now();

    // Filtra decisões com >30 dias e não revisitadas nos últimos 14 dias
    const candidatas = decisoes.filter((d) => {
      const idade = agora - d.data;
      if (idade < TRINTA_DIAS) return false;
      if (!d.revisitadoEm || d.revisitadoEm.length === 0) return true;
      const ultimaRevisao = Math.max(...d.revisitadoEm);
      return agora - ultimaRevisao > QUATORZE_DIAS;
    });

    // Pega as mais antigas (a lista já vem ordenada por data desc, pega o final)
    const top5 = candidatas.slice(-5);

    let decisaoEscolhida: Decisao | null = null;
    let isFallback = false;

    if (top5.length > 0) {
      // Escolhe a mais antiga não revisada
      decisaoEscolhida = top5[0];
    } else {
      isFallback = true;
    }

    // Contexto de adoções para enriquecer o prompt
    const adocoesRecentes = adocoes.slice(0, 3);
    const contextoAdocoes = adocoesRecentes
      .map((a) => `card "${a.cardSlug}" (${a.status ?? "adotado"})`)
      .join(", ");

    let systemPrompt: string;
    let userMessage: string;

    if (decisaoEscolhida) {
      systemPrompt = `Você é um mentor técnico especializado em spaced-repetition de decisões arquiteturais.
Sua tarefa é reformular uma decisão técnica real como uma pergunta de trade-off desafiadora.

Formato da pergunta:
- Cite o contexto original brevemente
- Introduza uma pequena variação de contexto (ex: escala 10x, novo requisito, mudança de time)
- Pergunte: "Ainda escolheria X? Por quê? O que mudaria?"
- Seja direto e específico ao domínio do desenvolvedor (ERPs, backend, Node/TypeScript)
- Máximo 3 frases

Responda em JSON:
{
  "pergunta": "A pergunta de trade-off reformulada",
  "contexto": "1 frase de contexto sobre por que essa decisão ainda é relevante"
}`;

      userMessage = `Decisão original:
Título: ${decisaoEscolhida.titulo}
Contexto: ${decisaoEscolhida.contexto}
Decisão tomada: ${decisaoEscolhida.decisao}
Consequências: ${decisaoEscolhida.consequencias}
Data: ${new Date(decisaoEscolhida.data).toLocaleDateString("pt-BR")}

Adoções recentes do desenvolvedor: ${contextoAdocoes || "nenhuma registrada"}

Gere uma pergunta de revisão reflexiva.`;
    } else {
      // Fallback: gera trade-off genérico de backend/ERP
      systemPrompt = `Você é um mentor técnico de ERPs e sistemas backend.
Gere uma pergunta de trade-off técnico para um desenvolvedor pleno-backend que trabalha com ERPs (Node.js, TypeScript, PostgreSQL, multi-tenant).

A pergunta deve:
- Ser sobre uma decisão arquitetural real e comum em ERPs
- Ter duas opções claras com trade-offs não óbvios
- Ser respondível em 90 segundos

Responda em JSON:
{
  "pergunta": "A pergunta de trade-off",
  "contexto": "Por que essa decisão importa em sistemas ERP de escala"
}`;

      userMessage = `Gere uma pergunta de trade-off técnico para desenvolvedor backend de ERPs. Seja específico e prático.`;
    }

    const completion = await openai.chat.completions.create({
      model: MODELS.suggest,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });

    const aiResult = JSON.parse(
      completion.choices[0].message.content ?? "{}",
    ) as { pergunta: string; contexto: string };

    const result: QuestResult = {
      decisao: decisaoEscolhida,
      pergunta: aiResult.pergunta ?? "Pergunta não gerada.",
      contexto: aiResult.contexto ?? "",
      fallback: isFallback,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("idle/quest error:", err);
    return NextResponse.json({ error: "Falha ao gerar quest." }, { status: 500 });
  }
}
