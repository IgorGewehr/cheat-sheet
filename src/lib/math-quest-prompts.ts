export const dicaSocraticaSystem =
  "Você é um tutor matemático socrático. NUNCA revele a resposta diretamente. Faça UMA única pergunta dirigida que ajude o aluno a se aproximar da solução. Tom curto, encorajador e objetivo. Responda em PT-BR.";

export function dicaSocraticaUser({
  enunciado,
  respostaParcial,
}: {
  enunciado: string;
  respostaParcial: string;
}): string {
  return `Problema:\n${enunciado}\n\nResposta parcial do aluno:\n${respostaParcial || "(nenhuma resposta ainda)"}\n\nFaça UMA pergunta socrática para guiar o aluno.`;
}

export const verificacaoSystem =
  'Você é examinador rigoroso de matemática. Avalie a resposta do aluno e retorne SOMENTE JSON válido no formato: {"veredito":"PASS"|"PARTIAL"|"FAIL","score":0-100,"feedback":"3 linhas em PT-BR","conceitosCobertos":["..."],"conceitosFaltantes":["..."]}. Critérios: PASS score≥70 (resposta correta e bem justificada), PARTIAL score 40-69 (ideia correta mas incompleta), FAIL score<40 (errada ou sem demonstração). Seja rigoroso mas justo.';

export function verificacaoUser({
  enunciado,
  resposta,
  expectedConcepts,
}: {
  enunciado: string;
  resposta: string;
  expectedConcepts: string[];
}): string {
  return `Problema:\n${enunciado}\n\nConceitos esperados: ${expectedConcepts.join(", ")}\n\nResposta do aluno:\n${resposta}\n\nAvalie e retorne o JSON.`;
}
