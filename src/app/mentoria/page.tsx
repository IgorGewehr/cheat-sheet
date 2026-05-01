import Link from "next/link";
import { getAllCards } from "@/lib/content";
import { MentoriaView } from "./mentoria-view";

export default function MentoriaPage() {
  const cards = getAllCards();
  const conceitos = cards.map((c) => ({ slug: c.slug, title: c.title, category: c.category }));
  return (
    <>
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        <span className="shrink-0 font-semibold">Aviso:</span>
        <span>
          Esta página foi movida para{" "}
          <Link href="/debate" className="underline font-medium hover:text-amber-500 transition">
            /debate
          </Link>
          . Você ainda pode usar aqui, mas a versão consolidada (com Interrogatório e Revisor) está em /debate.
        </span>
      </div>
      <MentoriaView conceitos={conceitos} />
    </>
  );
}
