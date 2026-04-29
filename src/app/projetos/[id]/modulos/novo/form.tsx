"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { createAdocao, createModulo } from "@/lib/db";

type CardLite = { slug: string; title: string; excerpt: string };

export function NovoModuloForm({
  projetoId,
  tipos,
  cards,
  recomendacoesPorTipo,
}: {
  projetoId: string;
  tipos: string[];
  cards: CardLite[];
  recomendacoesPorTipo: Record<string, string[]>;
}) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("core");
  const [descricao, setDescricao] = useState("");
  const [adotar, setAdotar] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recomendados = useMemo(() => {
    const slugs = recomendacoesPorTipo[tipo] ?? [];
    return slugs
      .map((s) => cards.find((c) => c.slug === s))
      .filter((c): c is CardLite => Boolean(c));
  }, [tipo, cards, recomendacoesPorTipo]);

  function toggle(slug: string) {
    setAdotar((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function salvar() {
    if (!nome.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const m = await createModulo({
        projetoId,
        nome: nome.trim(),
        tipo,
        descricao: descricao.trim() || undefined,
        status: "planejando",
      });
      await Promise.all(
        [...adotar].map((slug) => createAdocao({ projetoId, moduloId: m.id, cardSlug: slug })),
      );
      router.push(`/projetos/${projetoId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar módulo.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href={`/projetos/${projetoId}`} className="text-sm text-amber-600 dark:text-amber-400">← projeto</Link>
        <h1 className="text-3xl font-semibold mt-1">Novo módulo</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Contas a pagar" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <p className="text-xs text-subtle mt-1">
              O tipo define quais padrões o sistema vai recomendar abaixo.
            </p>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>
      </Card>

      {recomendados.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-1">Padrões recomendados pra módulos do tipo &ldquo;{tipo}&rdquo;</h2>
          <p className="text-xs text-subtle mb-3">
            Marque os que você vai adotar. Você pode adicionar mais depois.
          </p>
          <div className="space-y-2">
            {recomendados.map((c) => (
              <label key={c.slug} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adotar.has(c.slug)}
                  onChange={() => toggle(c.slug)}
                  className="mt-1 accent-amber-500"
                />
                <div>
                  <Link href={`/biblioteca/${c.slug}`} target="_blank" className="text-fg font-medium hover:text-amber-600 dark:hover:text-amber-300">
                    {c.title}
                  </Link>
                  <p className="text-xs text-muted">{c.excerpt}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      {error && <p className="text-sm text-red-500 text-right">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => history.back()}>Cancelar</Button>
        <Button onClick={salvar} disabled={!nome.trim() || saving}>
          {saving ? "Salvando…" : "Criar módulo"}
        </Button>
      </div>
    </div>
  );
}
