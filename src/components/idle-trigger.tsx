"use client";

import { usePathname, useRouter } from "next/navigation";
import { Hourglass } from "lucide-react";
import { clsx } from "clsx";

export function IdleTrigger() {
  const pathname = usePathname();
  const router = useRouter();

  // Oculta na própria página /idle
  if (pathname === "/idle") return null;

  return (
    <button
      onClick={() => router.push("/idle")}
      title="Enquanto a IA trabalha"
      className={clsx(
        "fixed bottom-6 right-6 z-40",
        "flex items-center gap-2 px-3 py-2.5 rounded-xl",
        "bg-amber-500 hover:bg-amber-400 text-zinc-950",
        "shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30",
        "text-sm font-medium",
      )}
    >
      <Hourglass className="w-4 h-4" />
      <span>IDLE</span>
    </button>
  );
}
