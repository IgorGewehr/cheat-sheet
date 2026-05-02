import Link from "next/link";
import { Terminal, ShieldAlert, Hourglass, Zap, FileCode, ExternalLink } from "lucide-react";
import { Card, Tag } from "@/components/ui";

export const metadata = {
  title: "Claude Code × brain",
  description: "Integração do brain com o Claude Code — slash commands e hooks.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-[11px] font-mono bg-zinc-950/60 border border-line rounded p-3 overflow-x-auto text-zinc-300 whitespace-pre">
      {children}
    </pre>
  );
}

export default function ClaudeCodePage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Terminal className="w-8 h-8 text-violet-500" />
          Claude Code × brain
        </h1>
        <p className="text-muted max-w-2xl">
          Use o brain direto do terminal: brief antes, audit depois, idle no meio.
          Tudo aparece em <Link href="/analytics" className="underline">Analytics → Slop tracking</Link>.
        </p>
      </header>

      <Card>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-500" /> Setup em 3 passos
        </p>
        <ol className="space-y-4 text-sm text-fg list-decimal pl-5">
          <li>
            <p className="mb-1.5">Suba o brain localmente (já está rodando se você está vendo isso):</p>
            <CodeBlock>{`cd ~/air/brain
pnpm dev   # http://localhost:3000`}</CodeBlock>
            <p className="text-xs text-muted mt-1">Garanta <code className="font-mono text-violet-400">OPENAI_API_KEY</code> em <code className="font-mono">.env.local</code>.</p>
          </li>

          <li>
            <p className="mb-1.5">Instale a CLI (<code className="font-mono text-violet-400">brain.sh</code>) no PATH:</p>
            <CodeBlock>{`mkdir -p ~/.local/bin
ln -sf ~/air/brain/claude-code/brain.sh ~/.local/bin/brain
chmod +x ~/air/brain/claude-code/brain.sh

# teste
brain audit --staged
brain brief "endpoint de pagamentos com Stripe"`}</CodeBlock>
            <p className="text-xs text-muted mt-1">Dependências: <code className="font-mono">curl</code>, <code className="font-mono">jq</code> (<code className="font-mono">brew install jq</code>).</p>
          </li>

          <li>
            <p className="mb-1.5">Copie os slash commands pro seu projeto (ou pra <code className="font-mono">~/.claude/commands/</code> globalmente):</p>
            <CodeBlock>{`mkdir -p .claude/commands
cp ~/air/brain/claude-code/commands/*.md .claude/commands/`}</CodeBlock>
          </li>
        </ol>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-semibold flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-violet-500" /> /brain-brief
          </p>
          <p className="text-xs text-muted mb-2">
            Antes de implementar. Gera systemPrompt + checklist + padrões do brain. Inicia uma <strong>tarefa</strong>.
          </p>
          <CodeBlock>{`/brain-brief endpoint de pagamentos com Stripe webhook`}</CodeBlock>
        </Card>

        <Card>
          <p className="text-sm font-semibold flex items-center gap-2 mb-1.5">
            <Hourglass className="w-4 h-4 text-violet-500" /> /brain-idle
          </p>
          <p className="text-xs text-muted mb-2">
            Enquanto outro agente trabalha. 3 riscos + 2 perguntas + 1 alternativa.
          </p>
          <CodeBlock>{`/brain-idle .claude/plans/auth.md`}</CodeBlock>
        </Card>

        <Card>
          <p className="text-sm font-semibold flex items-center gap-2 mb-1.5">
            <ShieldAlert className="w-4 h-4 text-violet-500" /> /brain-audit
          </p>
          <p className="text-xs text-muted mb-2">
            Depois da IA gerar. Veredito PASS/WARN/DENY com achados. DENY auto-cria ADR draft.
          </p>
          <CodeBlock>{`/brain-audit --staged
/brain-audit --pr https://github.com/o/r/pull/12`}</CodeBlock>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-violet-500" /> Hooks automáticos (opcional)
        </p>
        <p className="text-sm text-muted mb-3">
          Cole no <code className="font-mono">~/.claude/settings.json</code> pra rodar Sentinela sempre que Claude Code terminar uma resposta:
        </p>
        <CodeBlock>{`{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/air/brain/claude-code/hooks/stop-audit.sh"
          }
        ]
      }
    ]
  }
}`}</CodeBlock>
        <p className="text-xs text-muted mt-3">
          O hook anexa o veredito ao transcript. Pra <strong>bloquear</strong> respostas com DENY, descomente o bloco no fim de <code className="font-mono">stop-audit.sh</code>.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-3">Endpoints HTTP</p>
        <p className="text-xs text-muted mb-3">
          Se quiser chamar de outra ferramenta, os endpoints CLI aceitam JSON anônimo:
        </p>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Tag color="violet">POST</Tag>
            <code>/api/cli/sentinela</code>
            <span className="text-muted text-[10px]">{`{ titulo, codigo|diff|prUrl, format? }`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag color="violet">POST</Tag>
            <code>/api/cli/brief</code>
            <span className="text-muted text-[10px]">{`{ task, domains?, stack?, format? }`}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag color="violet">POST</Tag>
            <code>/api/cli/idle</code>
            <span className="text-muted text-[10px]">{`{ plano, format? }`}</span>
          </div>
        </div>
        <p className="text-[11px] text-muted mt-3">
          Use <code className="font-mono">format: &quot;text&quot;</code> pra resposta pronta pra terminal.
        </p>
      </Card>

      <Card>
        <p className="text-sm font-semibold mb-2">Variáveis</p>
        <ul className="text-sm text-fg space-y-1.5">
          <li><code className="font-mono text-violet-400">BRAIN_URL</code> — onde o brain está rodando (default <code className="font-mono">http://localhost:3000</code>)</li>
          <li><code className="font-mono text-violet-400">BRAIN_STACK</code> — stack passada pro brief</li>
          <li><code className="font-mono text-violet-400">GITHUB_TOKEN</code> — pra auditar PRs privados</li>
          <li><code className="font-mono text-violet-400">OPENAI_API_KEY</code> — server-side, do brain</li>
        </ul>
      </Card>

      <p className="text-xs text-muted text-center">
        Detalhes completos em{" "}
        <a
          href="https://github.com/anthropics/claude-code"
          target="_blank"
          rel="noreferrer"
          className="underline inline-flex items-center gap-1"
        >
          claude-code <ExternalLink className="w-3 h-3" />
        </a>
        {" "}+ <code className="font-mono">claude-code/README.md</code> deste repo.
      </p>
    </div>
  );
}
