"use client";

import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { subscribeProjects } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import type { Project } from "@/lib/types";

type CardLite = { slug: string; title: string; category: string; excerpt: string };

export function CommandPaletteClient({ cards }: { cards: CardLite[] }) {
  const { signedIn } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!signedIn) {
      setProjects([]);
      return;
    }
    const unsub = subscribeProjects(setProjects);
    return () => unsub();
  }, [signedIn]);

  return <CommandPalette cards={cards} projects={projects.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo }))} />;
}
