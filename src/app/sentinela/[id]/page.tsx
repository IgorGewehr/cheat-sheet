import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Sentinela · Sessão — Brain",
};

export const dynamic = "force-dynamic";

async function loadSession(id: string) {
  const { getSentinelaSession } = await import("@/lib/sentinela-db");
  return getSentinelaSession(id);
}

export default async function SentinelaSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session: Awaited<ReturnType<typeof loadSession>>;
  try {
    session = await loadSession(id);
  } catch {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-muted font-mono">
          Sessão não pôde ser carregada. Faça login e tente novamente.
        </p>
        <Link href="/sentinela" className="mt-4 inline-block text-xs text-violet-400 hover:underline">
          Voltar ao Sentinela
        </Link>
      </div>
    );
  }

  if (!session) notFound();

  const VEREDITO_COLOR: Record<string, string> = {
    PASS: "text-violet-400 border-violet-500",
    WARN: "text-amber-400 border-amber-500",
    DENY: "text-red-400 border-red-500",
  };

  const DECISAO_LABEL: Record<string, string> = {
    aceito: "Aceito",
    rejeitado: "Rejeitado",
    corrigir: "Corrigir antes",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/sentinela"
          className="text-xs text-muted hover:text-fg transition"
        >
          ← Sentinela
        </Link>
        <h1 className="text-xl font-semibold text-fg mt-1">{session.titulo}</h1>
        <p className="text-xs text-muted mt-0.5">
          {new Date(session.criadoEm).toLocaleString("pt-BR")}
        </p>
      </div>

      <div className={`border-l-4 px-4 py-3 rounded-none mb-6 ${VEREDITO_COLOR[session.veredito] ?? "border-zinc-500 text-zinc-400"}`}>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-0.5">Veredito</p>
        <p className="font-mono text-3xl font-black">{session.veredito}</p>
        <p className="text-xs text-muted mt-1">
          Score de confiança: <strong>{session.scoreConfianca}/100</strong>
        </p>
      </div>

      {session.achados.length > 0 && (
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
            [{session.achados.length}] Achados
          </p>
          <div className="space-y-2">
            {session.achados.map((a, i) => (
              <div key={i} className="border border-line rounded-md px-3 py-2.5 bg-card space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase text-muted border border-line rounded px-1.5 py-0.5">
                    {a.severidade}
                  </span>
                  <span className="text-[10px] font-mono text-muted">{a.categoria}</span>
                  {a.linha != null && (
                    <span className="text-[10px] font-mono text-muted">linha {a.linha}</span>
                  )}
                </div>
                <p className="text-xs text-fg">{a.descricao}</p>
                <p className="text-[11px] text-muted border-l border-cyan-500/40 pl-2">{a.comoCorrigir}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.decisaoFinal && (
        <div className="border border-line rounded-md px-4 py-3 bg-card mb-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Decisão final</p>
          <p className="text-sm font-semibold text-fg">
            {DECISAO_LABEL[session.decisaoFinal] ?? session.decisaoFinal}
          </p>
          {session.reflexao && (
            <p className="text-xs text-muted mt-2 italic">{session.reflexao}</p>
          )}
        </div>
      )}

      {session.codigo && (
        <details className="border border-line rounded-md overflow-hidden">
          <summary className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted cursor-pointer bg-card hover:bg-card-hover transition">
            Ver código auditado
          </summary>
          <pre className="text-[11px] font-mono p-4 bg-zinc-950/60 overflow-x-auto text-zinc-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto">
            {session.codigo}
          </pre>
        </details>
      )}
    </div>
  );
}
