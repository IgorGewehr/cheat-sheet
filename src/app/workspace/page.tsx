"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Label, Tag } from "@/components/ui";
import { exportWorkspace, importWorkspace } from "@/lib/db";
import { getWorkspaceId, resetWorkspaceId, setWorkspaceId } from "@/lib/workspace";
import { useAuth } from "@/lib/auth-context";

export default function WorkspacePage() {
  const { user, isAnonymous } = useAuth();
  const [wsId, setWsId] = useState("");
  const [novoId, setNovoId] = useState("");
  const [msg, setMsg] = useState("");
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    setWsId(getWorkspaceId());
  }, [user]);

  async function exportar() {
    const data = await exportWorkspace();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brain-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Exportado.");
  }

  async function importar(file: File) {
    let payload: unknown;
    try {
      payload = JSON.parse(await file.text());
    } catch {
      setMsg("Erro: arquivo não é um JSON válido.");
      return;
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      setMsg("Erro: JSON inválido — deve ser um objeto.");
      return;
    }
    const p = payload as Record<string, unknown>;
    const known = ["projetos", "modulos", "adocoes", "decisoes"];
    if (!known.some((k) => k in p)) {
      setMsg("Erro: este arquivo não parece ser um backup do brain.");
      return;
    }
    for (const k of known) {
      if (k in p && !Array.isArray(p[k])) {
        setMsg(`Erro: campo "${k}" deve ser um array.`);
        return;
      }
    }
    await importWorkspace(payload as Parameters<typeof importWorkspace>[0]);
    setMsg("Importado com sucesso.");
  }

  function trocarWorkspace() {
    if (!novoId.trim()) return;
    setWorkspaceId(novoId, true); // marca como manual
    location.reload();
  }

  function gerarNovo() {
    if (!confirm("Isso muda pra um workspace NOVO e vazio. O atual continua salvo no Firestore — você pode voltar colando o ID antigo. Continuar?")) return;
    resetWorkspaceId();
    location.reload();
  }

  async function migrarParaUid() {
    if (!user || isAnonymous) return;
    if (wsId === user.uid) {
      setMsg("Você já está usando seu UID como workspace.");
      return;
    }
    if (!confirm(`Vai copiar TODOS os dados do workspace atual (${wsId.slice(0, 8)}…) pro seu UID (${user.uid.slice(0, 8)}…). Os dados antigos continuam no Firestore. Continuar?`)) return;
    setMigrating(true);
    setMsg("");
    try {
      const data = await exportWorkspace();
      setWorkspaceId(user.uid);
      await importWorkspace(data);
      setMsg("Migrado. Recarregando…");
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      setMsg("Erro na migração: " + (e as Error).message);
    } finally {
      setMigrating(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Workspace</h1>
        <p className="text-muted">
          Onde seus projetos e adoções moram. Cria conta com email/senha pra ter um workspace
          ligado ao seu UID Firebase — assim você acessa de qualquer dispositivo.
        </p>
      </header>

      <Card>
        <Label>Conta</Label>
        {user && !isAnonymous ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-amber-500 text-zinc-950 text-sm font-bold flex items-center justify-center">
                {(user.displayName ?? user.email ?? "?")[0]?.toUpperCase()}
              </span>
              <div>
                <p className="font-medium">{user.displayName ?? user.email}</p>
                <p className="text-xs text-subtle">{user.email}</p>
              </div>
              <Tag color="emerald">conectado</Tag>
            </div>
            <p className="text-xs text-subtle font-mono mt-2">UID: {user.uid}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted">
              Você está em modo anônimo. Crie uma conta no botão <strong>Entrar</strong> no topo
              pra ter um workspace fixo ligado ao seu UID.
            </p>
            <Tag color="amber">anônimo</Tag>
          </div>
        )}
      </Card>

      <Card>
        <Label>Workspace ID atual</Label>
        <div className="flex gap-2">
          <Input value={wsId} readOnly />
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(wsId)}>
            Copiar
          </Button>
        </div>
        {user && !isAnonymous && wsId !== user.uid && (
          <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm space-y-2">
            <p>
              Seu workspace ainda não está ligado à sua conta. Clique pra copiar todos os dados
              deste navegador pro workspace do seu UID.
            </p>
            <Button onClick={migrarParaUid} disabled={migrating}>
              {migrating ? "Migrando…" : "Migrar dados pra minha conta"}
            </Button>
          </div>
        )}
        {user && !isAnonymous && wsId === user.uid && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            ✓ Workspace ligado ao seu UID
          </p>
        )}
      </Card>

      <Card>
        <Label>Trocar pra outro workspace</Label>
        <div className="flex gap-2">
          <Input
            value={novoId}
            onChange={(e) => setNovoId(e.target.value)}
            placeholder="cole aqui o ID do workspace"
          />
          <Button onClick={trocarWorkspace}>Trocar</Button>
        </div>
        <p className="text-xs text-subtle mt-2">
          A página recarrega e você passa a ver os dados daquele workspace.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Backup</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <Button onClick={exportar}>Exportar JSON</Button>
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm bg-card-hover hover:bg-line text-fg border border-line-strong cursor-pointer">
            Importar JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])}
            />
          </label>
          <Button variant="danger" onClick={gerarNovo}>
            Gerar workspace novo (vazio)
          </Button>
        </div>
        {msg && (
          <p className={`text-sm ${msg.startsWith("Erro") ? "text-red-400" : "text-emerald-400"}`}>
            {msg}
          </p>
        )}
      </Card>
    </div>
  );
}
