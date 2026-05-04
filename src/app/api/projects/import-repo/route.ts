import { NextResponse } from "next/server";

interface GithubTreeItem {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
  url: string;
}

interface GithubTreeResponse {
  sha: string;
  truncated: boolean;
  tree: GithubTreeItem[];
}

interface GithubFileResponse {
  content: string;
  encoding: string;
}

const FETCH_FILES = ["package.json", "README.md", "readme.md"];

async function githubGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function GET() {
  return NextResponse.json({
    description: "POST { repoUrl, githubToken } — retorna árvore e arquivos chave do repo",
  });
}

export async function POST(req: Request) {
  let body: { repoUrl?: string; githubToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { repoUrl, githubToken } = body;

  if (!githubToken) {
    return NextResponse.json({ error: "githubToken obrigatório" }, { status: 401 });
  }
  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl obrigatório" }, { status: 400 });
  }

  const match = repoUrl.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?(?:\/|$)/);
  if (!match) {
    return NextResponse.json({ error: "URL inválida — esperado github.com/owner/repo" }, { status: 400 });
  }
  const repo = match[1];

  try {
    const tree = await githubGet<GithubTreeResponse>(
      `/repos/${repo}/git/trees/HEAD?recursive=1`,
      githubToken,
    );

    const blobs = tree.tree.filter((n) => n.type === "blob");
    const keyFiles: Record<string, string> = {};

    await Promise.all(
      FETCH_FILES.map(async (filename) => {
        const node = blobs.find((n) => n.path === filename);
        if (!node) return;
        try {
          const file = await githubGet<GithubFileResponse>(
            `/repos/${repo}/contents/${node.path}`,
            githubToken,
          );
          if (file.encoding === "base64") {
            keyFiles[filename] = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");
          }
        } catch {
          // arquivo não acessível — ignora
        }
      }),
    );

    return NextResponse.json({
      repo,
      truncated: tree.truncated,
      fileTree: blobs.map((n) => n.path),
      keyFiles,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao acessar GitHub";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
