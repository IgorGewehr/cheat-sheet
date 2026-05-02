"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// ⌘⇧A (or Ctrl+Shift+A) → /sentinela?from=clipboard
// The Sentinela page reads navigator.clipboard and pre-fills code/diff input.
export function AuditHotkey() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || !e.shiftKey) return;
      // Skip when user is typing inside an input/textarea
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable =
        tag === "input" || tag === "textarea" || target?.isContentEditable;
      if (e.key.toLowerCase() === "a" && !isEditable) {
        e.preventDefault();
        if (pathname?.startsWith("/sentinela")) return;
        router.push("/sentinela?from=clipboard");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname]);

  return null;
}
