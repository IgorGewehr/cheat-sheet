"use client";

import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { updateSquadPresence, clearSquadPresence } from "@/lib/squad-db";

const SESSION_ID = uuidv4();
const HEARTBEAT_MS = 60_000; // update presence every 60s

export function useSquadPresence(params: {
  squadId: string | null;
  userId: string | null;
  displayName: string;
  currentPage: string;
  currentTask?: string;
}) {
  const { squadId, userId, displayName, currentPage, currentTask } = params;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!squadId || !userId) return;

    async function pulse() {
      if (!squadId || !userId) return;
      try {
        await updateSquadPresence(squadId, userId, {
          displayName,
          currentPage,
          currentTask,
          lastSeen: Date.now(),
          sessionId: SESSION_ID,
        });
      } catch {
        // Presence is best-effort
      }
    }

    pulse();
    timerRef.current = setInterval(pulse, HEARTBEAT_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        pulse();
        timerRef.current = setInterval(pulse, HEARTBEAT_MS);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (squadId && userId) {
        clearSquadPresence(squadId, userId).catch(() => {});
      }
    };
  }, [squadId, userId, displayName, currentPage, currentTask]);
}
