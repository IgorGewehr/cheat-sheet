"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSquadPresence } from "@/hooks/use-squad-presence";

export function SquadPresenceSync() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [squadId, setSquadId] = useState<string | null>(null);

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem("brain.squadId") : null;
    setSquadId(saved);
  }, []);

  useSquadPresence({
    squadId,
    userId: user?.uid ?? null,
    displayName: user?.displayName ?? user?.email ?? "Dev",
    currentPage: pathname ?? "/",
  });

  return null;
}
