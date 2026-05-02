import { NextRequest, NextResponse } from "next/server";
import { openai, MODELS } from "@/lib/openai";
import { getAllCards } from "@/lib/content";

// Analyzes an existing project and returns an importable architecture JSON.
// Accepts: name, stack, description, package.json, file tree, code snippets.
// Returns: ArchitectureJSON ready to paste into /projetos/importar.

const SYSTEM_PROMPT = `Você é um arquiteto sênior que analisa projetos de software e extrai sua arquitetura.

Dado informações de um projeto existente, gere um JSON no formato exato abaixo.
Extraia o máximo de informação possível: módulos, decisões técnicas já tomadas, padrões adotados.

FORMATO OBRIGATÓRIO (retorne APENAS este JSON, nada mais):
{
  "version": "1",
  "source": "URL do repo ou descrição da origem",
  "project": {
    "nome": "nome do projeto",
    "descricao": "descrição em 1-2 frases",
    "stack": ["tech1", "tech2"],
    "tipo": "frontend|backend|fullstack|microsservico",
    "status": "planejando|em-desenvolvimento|concluido|manutencao",
    "repoUrl": "https://github.com/..."
  },
  "modulos": [
    {
      "nome": "NomeDoModulo",
      "tipo": "core|auth|api|frontend|banco|infra|feature|worker|cli",
      "status": "planejando|em-desenvolvimento|concluido|extraido",
      "descricao": "o que este módulo faz"
    }
  ],
  "decisoes": [
    {
      "titulo": "Título da decisão técnica",
      "contexto": "por que essa decisão precisou ser tomada",
      "decisao": "o que foi decidido",
      "consequencias": "trade-offs e impactos",
      "status": "aceita",
      "cardSlugs": ["slug-do-card-relevante"]
    }
  ],
  "adocoes": [
    {
      "cardSlug": "slug-do-card",
      "moduloNome": "NomeDoModulo",
      "status": "adotado",
      "notas": "detalhes de como foi implementado"
    }
  ],
  "squadConstraints": [
    {
      "title": "regra de arquitetura obrigatória",
      "description": "contexto da regra",
      "type": "must|should|never|pattern",
      "category": "auth|banco|infra|frontend|backend|testes|segurança|arquitetura|geral"
    }
  ]
}

REGRAS:
- modulos: sempre inclua "Core" como primeiro módulo; quebre em módulos reais baseado na estrutura
- decisoes: extraia decisões técnicas reais (ex: ORM escolhido, estratégia de auth, padrão de deploy)
- adocoes: cardSlugs precisam ser slugs REAIS da lista fornecida — só inclua se tiver certeza
- squadConstraints: 3-6 constraints críticas baseadas na arquitetura detectada
- Se a info for insuficiente para um campo, omita-o ou deixe vazio — não invente
`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY não configurada." }, { status: 500 });
  }

  try {
    const body = (await req.json()) as {
      name: string;
      description?: string;
      stack?: string | string[];
      repoUrl?: string;
      packageJson?: string | object;
      fileTree?: string;
      codeSnippets?: string[];
      existingDecisions?: string[];
      format?: "json" | "text";
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name obrigatório." }, { status: 400 });
    }

    // Build available card slugs for reference
    const allCards = getAllCards();
    const slugList = allCards
      .filter((c) => !["checklists", "prompts", "matematica"].includes(c.category))
      .map((c) => `${c.slug} (${c.title} — ${c.category})`)
      .join("\n");

    // Compose the user message
    const parts: string[] = [];
    parts.push(`Projeto: ${body.name}`);
    if (body.description) parts.push(`Descrição: ${body.description}`);

    const stack = Array.isArray(body.stack)
      ? body.stack.join(", ")
      : body.stack ?? "";
    if (stack) parts.push(`Stack: ${stack}`);
    if (body.repoUrl) parts.push(`Repo: ${body.repoUrl}`);

    if (body.packageJson) {
      const pkg = typeof body.packageJson === "string"
        ? body.packageJson
        : JSON.stringify(body.packageJson, null, 2);
      parts.push(`\npackage.json:\n\`\`\`json\n${pkg.slice(0, 3000)}\n\`\`\``);
    }

    if (body.fileTree) {
      parts.push(`\nEstrutura de arquivos:\n\`\`\`\n${body.fileTree.slice(0, 2000)}\n\`\`\``);
    }

    if (body.codeSnippets?.length) {
      const snippets = body.codeSnippets.map((s, i) => `// Snippet ${i + 1}\n${s}`).join("\n\n");
      parts.push(`\nTrechos de código relevantes:\n\`\`\`\n${snippets.slice(0, 3000)}\n\`\`\``);
    }

    if (body.existingDecisions?.length) {
      parts.push(`\nDecisões técnicas já documentadas:\n${body.existingDecisions.join("\n")}`);
    }

    parts.push(`\nCards disponíveis para referência (use apenas slugs exatos desta lista):\n${slugList}`);

    const completion = await openai.chat.completions.create({
      model: MODELS.briefing,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: parts.join("\n\n") },
      ],
      response_format: { type: "json_object" },
    });

    const architecture = JSON.parse(completion.choices[0].message.content ?? "{}");

    // Ensure version field
    architecture.version = "1";

    if (body.format === "text") {
      return new NextResponse(JSON.stringify(architecture, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return NextResponse.json(architecture);
  } catch (err) {
    console.error("[cli/scan-project]", err);
    return NextResponse.json({ error: "Falha ao escanear projeto." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "brain.scan-project",
    description: "POST { name, description?, stack?, repoUrl?, packageJson?, fileTree?, codeSnippets? }",
    returns: "ArchitectureJSON pronto para /projetos/importar",
    usage: [
      "# Scan básico:",
      'curl -s -X POST "$BRAIN_API_URL/api/cli/scan-project" \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '{\"name\":\"saas-erp\",\"stack\":[\"NestJS\",\"PostgreSQL\"],\"description\":\"ERP multi-tenant\"}' \\",
      "  > architecture.json",
      "",
      "# Scan com package.json:",
      'curl -s -X POST "$BRAIN_API_URL/api/cli/scan-project" \\',
      '  -H "Content-Type: application/json" \\',
      '  -d "{\"name\":\"saas-erp\",\"packageJson\":$(cat package.json | jq -c .),\"fileTree\":\"$(find src -type f -name \'*.ts\' | head -60)\"}" \\',
      "  > architecture.json",
    ].join("\n"),
  });
}
