import type { SentinelaChecklistItem } from "./sentinela-types";

export const SENTINELA_CHECKLIST: SentinelaChecklistItem[] = [
  {
    id: "leu-tudo",
    pergunta: "Li cada linha do código — não apenas escaneei.",
    obrigatorio: true,
  },
  {
    id: "entende-funcoes",
    pergunta: "Entendo por que cada função existe e o que ela faz.",
    obrigatorio: true,
  },
  {
    id: "sem-secrets",
    pergunta: "Confirmo que não há secrets, tokens ou senhas hardcoded.",
    obrigatorio: true,
  },
  {
    id: "validacao-input",
    pergunta: "Todo input externo é validado antes de ser usado.",
    obrigatorio: true,
  },
  {
    id: "erros-tratados",
    pergunta: "Todos os caminhos de erro são tratados explicitamente.",
    obrigatorio: true,
  },
  {
    id: "imports-verificados",
    pergunta: "Verifiquei que cada import, API e método usado realmente existe.",
    obrigatorio: true,
  },
  {
    id: "testes-edge",
    pergunta: "Os testes cobrem edge cases: null, vazio, concorrência, volume.",
    obrigatorio: false,
  },
  {
    id: "sem-dead-code",
    pergunta: "Não há código morto, variáveis não usadas ou lógica inalcançável.",
    obrigatorio: false,
  },
  {
    id: "convencoes",
    pergunta: "O código segue as convenções e padrões do restante da codebase.",
    obrigatorio: false,
  },
  {
    id: "performance",
    pergunta: "A performance é aceitável para a carga esperada em produção.",
    obrigatorio: false,
  },
  {
    id: "explicavel",
    pergunta: "Consigo explicar este código a um colega amanhã sem precisar reler.",
    obrigatorio: false,
  },
  {
    id: "auth",
    pergunta: "Endpoints e operações sensíveis têm autenticação e autorização corretas.",
    obrigatorio: false,
  },
  {
    id: "logs",
    pergunta: "Operações críticas têm logs de auditoria adequados.",
    obrigatorio: false,
  },
  {
    id: "rollback",
    pergunta: "Há uma estratégia de rollback ou reversão se algo der errado.",
    obrigatorio: false,
  },
];
