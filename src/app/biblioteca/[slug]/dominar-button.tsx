"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "lucide-react";
import { getTrilhaProgresso, saveTrilhaProgresso } from "@/lib/db";

export function DominarButton({ slug }: { slug: string }) {
  const [dominado, setDominado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTrilhaProgresso(slug)
      .then((p) => setDominado(p?.dominado ?? false))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function toggle() {
    setSaving(true);
    try {
      const next = !dominado;
      await saveTrilhaProgresso(slug, { dominado: next });
      setDominado(next);
    } catch {
      // silencia — AuthRequiredError se não logado
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition ${
        dominado
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
          : "border-line bg-card text-muted hover:text-fg hover:border-amber-500"
      }`}
    >
      {dominado ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Dominado
        </>
      ) : (
        <>
          <Circle className="w-4 h-4" />
          Marcar como dominado
        </>
      )}
    </button>
  );
}
