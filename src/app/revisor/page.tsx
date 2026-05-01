import Link from "next/link";
import { RevisorView } from "./revisor-view";

export default function RevisorPage() {
  return (
    <>
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
        <span className="shrink-0 font-semibold">Aviso:</span>
        <span>
          Esta página foi movida para{" "}
          <Link href="/debate" className="underline font-medium hover:text-amber-500 transition">
            /debate
          </Link>
          . Você ainda pode usar aqui, mas a versão consolidada (com Interrogatório e Mentoria) está em /debate.
        </span>
      </div>
      <RevisorView />
    </>
  );
}
