#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.BRAIN_API_URL ?? "http://localhost:3000";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY ?? "";
const AUTH_FILE = path.join(os.homedir(), ".claude", "brain-auth.json");

// ─── Token management ────────────────────────────────────────────────────────

function loadAuth() {
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, "utf8")); } catch { return null; }
}

function saveAuth(data) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

async function getToken() {
  const auth = loadAuth();
  if (!auth) throw new Error("Não autenticado. Use brain_login primeiro.");

  if (Date.now() > auth.expiresAt - 5 * 60 * 1000) {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "refresh_token", refresh_token: auth.refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Falha ao renovar token: ${data.error?.message ?? res.status}`);
    saveAuth({ ...auth, idToken: data.id_token, refreshToken: data.refresh_token, expiresAt: Date.now() + parseInt(data.expires_in) * 1000 });
    return data.id_token;
  }
  return auth.idToken;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function aPost(path2, body) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path2}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { const j = JSON.parse(text); if (j.error) return `Erro: ${j.error}`; } catch {}
  return text;
}

async function aGet(path2) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path2}`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  try { const j = JSON.parse(text); if (j.error) return `Erro: ${j.error}`; } catch {}
  return text;
}

async function aPatch(path2, body) {
  const token = await getToken();
  const res = await fetch(`${BASE}${path2}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { const j = JSON.parse(text); if (j.error) return `Erro: ${j.error}`; } catch {}
  return text;
}

async function post(path2, body) {
  const res = await fetch(`${BASE}${path2}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, format: "text" }),
  });
  return res.text();
}

async function get(path2) {
  const res = await fetch(`${BASE}${path2}`);
  return res.text();
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  // Auth
  {
    name: "brain_login",
    description: "Autentica no brain com email e senha Firebase. Salva tokens localmente para uso em todas as ferramentas. Faça login uma vez e as credenciais se renovam automaticamente.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string" },
      },
      required: ["email", "password"],
    },
  },
  {
    name: "brain_whoami",
    description: "Retorna o uid e workspaceId do usuário autenticado. Use para confirmar que o login funcionou.",
    inputSchema: { type: "object", properties: {} },
  },
  // Projects
  {
    name: "brain_projects_list",
    description: "Lista todos os projetos do usuário com contagem de módulos e decisões. Retorno compacto, ideal para escolher um projeto antes de operações específicas.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "brain_project_get",
    description: "Retorna detalhes completos de um projeto: campos, todos os módulos e todas as decisões do decision journal.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
  },
  {
    name: "brain_project_create",
    description: "Cria um novo projeto. Cria automaticamente o módulo Core. Use brain_architecture_import para criar a partir de um scan completo.",
    inputSchema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        descricao: { type: "string" },
        stack: { type: "array", items: { type: "string" } },
        tipo: { type: "string", enum: ["frontend", "backend", "fullstack", "microsservico"] },
        status: { type: "string", enum: ["planejando", "em-desenvolvimento", "concluido", "manutencao"] },
        repoUrl: { type: "string" },
      },
      required: ["nome", "stack"],
    },
  },
  {
    name: "brain_project_update",
    description: "Atualiza campos de um projeto existente (nome, descrição, stack, tipo, status, repoUrl).",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        nome: { type: "string" },
        descricao: { type: "string" },
        stack: { type: "array", items: { type: "string" } },
        tipo: { type: "string", enum: ["frontend", "backend", "fullstack", "microsservico"] },
        status: { type: "string", enum: ["planejando", "em-desenvolvimento", "concluido", "manutencao"] },
        repoUrl: { type: "string" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "brain_architecture_import",
    description: "Importa uma arquitetura completa (output de brain_scan_project) criando projeto + módulos + decisões + adoções em lote. Use após brain_scan_project para registrar um projeto existente.",
    inputSchema: {
      type: "object",
      properties: {
        architecture: { type: "object", description: "JSON retornado por brain_scan_project" },
      },
      required: ["architecture"],
    },
  },
  // Modules
  {
    name: "brain_module_upsert",
    description: "Cria ou atualiza um módulo. Se id for fornecido, atualiza o módulo existente; caso contrário, cria um novo no projeto.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        id: { type: "string", description: "ID do módulo existente para atualizar (omitir para criar)" },
        nome: { type: "string" },
        tipo: { type: "string", description: "core | auth | api | frontend | banco | infra | feature | worker | cli" },
        status: { type: "string", enum: ["planejando", "em-desenvolvimento", "concluido", "extraido"] },
        descricao: { type: "string" },
      },
      required: ["projectId", "nome"],
    },
  },
  // Decisions
  {
    name: "brain_decision_add",
    description: "Adiciona uma decisão técnica ao decision journal do projeto. Capture decisões importantes de arquitetura, escolhas de bibliotecas, trade-offs.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        titulo: { type: "string" },
        contexto: { type: "string", description: "Por que essa decisão precisou ser tomada" },
        decisao: { type: "string", description: "O que foi decidido" },
        consequencias: { type: "string", description: "Trade-offs e impactos" },
        status: { type: "string", enum: ["proposta", "aceita", "depreciada"] },
        cardSlugs: { type: "array", items: { type: "string" }, description: "Slugs de cards relevantes da biblioteca brain" },
      },
      required: ["projectId", "titulo", "decisao"],
    },
  },
  {
    name: "brain_decisions_list",
    description: "Lista todas as decisões do decision journal de um projeto.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: ["projectId"],
    },
  },
  // Anonymous (no auth)
  {
    name: "brain_brief",
    description: "Gera briefing sênior antes de codar: padrões relevantes, armadilhas e checklist. Use antes de qualquer tarefa de engenharia.",
    inputSchema: {
      type: "object",
      properties: {
        task: { type: "string" },
        domains: { type: "array", items: { type: "string" } },
        stack: { type: "string" },
        projectName: { type: "string" },
      },
      required: ["task"],
    },
  },
  {
    name: "brain_sentinela",
    description: "Revisa código e emite veredito PASS / WARN / DENY em 8 categorias. Use após escrever ou receber código de IA.",
    inputSchema: {
      type: "object",
      properties: {
        codigo: { type: "string" },
        diff: { type: "string" },
        titulo: { type: "string" },
        contexto: { type: "string" },
        linguagem: { type: "string" },
      },
    },
  },
  {
    name: "brain_scan_project",
    description: "Extrai arquitetura de um projeto existente. Combine com brain_architecture_import para registrá-la no brain.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        stack: { type: "array", items: { type: "string" } },
        repoUrl: { type: "string" },
        fileTree: { type: "string" },
        packageJson: { type: "string" },
      },
      required: ["name"],
    },
  },
];

// ─── Server ───────────────────────────────────────────────────────────────────

const server = new Server({ name: "brain", version: "2.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    let text;

    if (name === "brain_login") {
      if (!FIREBASE_API_KEY) return { content: [{ type: "text", text: "FIREBASE_API_KEY não configurado no MCP. Adicione em ~/.claude/mcp.json." }], isError: true };
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: args.email, password: args.password, returnSecureToken: true }),
      });
      const data = await res.json();
      if (!res.ok) return { content: [{ type: "text", text: `Login falhou: ${data.error?.message ?? res.status}` }], isError: true };
      saveAuth({ idToken: data.idToken, refreshToken: data.refreshToken, uid: data.localId, email: data.email, expiresAt: Date.now() + parseInt(data.expiresIn) * 1000 });
      text = `Login OK. uid=${data.localId} — credenciais salvas em ~/.claude/brain-auth.json`;

    } else if (name === "brain_whoami") {
      text = await aGet("/api/cli/me");

    } else if (name === "brain_projects_list") {
      const raw = await aGet("/api/cli/projetos");
      const projects = JSON.parse(raw);
      if (!Array.isArray(projects)) { text = raw; }
      text = projects.map((p) => `[${p.id}] ${p.nome} (${p.status ?? "—"}) — stack: ${(p.stack ?? []).join(", ")} | módulos: ${p.modulosCount} | decisões: ${p.decisoesCount}`).join("\n") || "(nenhum projeto)";

    } else if (name === "brain_project_get") {
      text = await aGet(`/api/cli/projetos/${args.projectId}`);

    } else if (name === "brain_project_create") {
      text = await aPost("/api/cli/projetos", args);

    } else if (name === "brain_project_update") {
      const { projectId, ...fields } = args;
      text = await aPatch(`/api/cli/projetos/${projectId}`, fields);

    } else if (name === "brain_architecture_import") {
      text = await aPost("/api/cli/projetos/import", args.architecture);

    } else if (name === "brain_module_upsert") {
      const { projectId, ...fields } = args;
      text = await aPost(`/api/cli/projetos/${projectId}/modulos`, fields);

    } else if (name === "brain_decision_add") {
      const { projectId, ...fields } = args;
      text = await aPost(`/api/cli/projetos/${projectId}/decisoes`, fields);

    } else if (name === "brain_decisions_list") {
      text = await aGet(`/api/cli/projetos/${args.projectId}/decisoes`);

    } else if (name === "brain_brief") {
      text = await post("/api/cli/brief", args);

    } else if (name === "brain_sentinela") {
      text = await post("/api/cli/sentinela", args);

    } else if (name === "brain_scan_project") {
      text = await post("/api/cli/scan-project", args);

    } else {
      return { content: [{ type: "text", text: `Tool desconhecida: ${name}` }], isError: true };
    }

    return { content: [{ type: "text", text: String(text) }] };
  } catch (err) {
    return { content: [{ type: "text", text: `Erro: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
