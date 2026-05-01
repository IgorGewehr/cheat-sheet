"use client";

import { useEffect, useState } from "react";
import { subscribeProjects } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import type { Project } from "@/lib/types";
import { TopNav } from "./top-nav";
import { CommandPalette } from "./command-palette";

type CardLite = { slug: string; title: string; category: string; excerpt: string };

export function TopNavClient({ cards }: { cards: CardLite[] }) {
  const { signedIn } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!signedIn) { setProjects([]); return; }
    const unsub = subscribeProjects(setProjects);
    return () => unsub();
  }, [signedIn]);

  const projectItems = projects.map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo }));

  return (
    <TopNav
      cmdKTrigger={
        <CommandPalette cards={cards} projects={projectItems} />
      }
    />
  );
}
