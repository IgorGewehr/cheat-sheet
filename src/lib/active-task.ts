"use client";

// Active "work session" — costura Sessão IA → Idle → Sentinela.
// Persiste no localStorage e dispara `brain:active-task-changed` ao mudar.

export interface ActiveTaskBriefing {
  systemPrompt: string;
  checklist: string[];
  patternSlugs: string[];
}

export interface ActiveTask {
  id: string;
  titulo: string;
  dominios: string[];
  stack?: string;
  briefing?: ActiveTaskBriefing;
  // ids relacionados — preenchidos conforme o usuário avança
  sentinelaSessionIds: string[];
  idleSessionIds: string[];
  startedAt: number;
}

const KEY = "brain.activeTask";
const EVT = "brain:active-task-changed";

export function getActiveTask(): ActiveTask | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActiveTask) : null;
  } catch {
    return null;
  }
}

export function setActiveTask(t: ActiveTask | null) {
  if (typeof window === "undefined") return;
  if (t) {
    localStorage.setItem(KEY, JSON.stringify(t));
  } else {
    localStorage.removeItem(KEY);
  }
  window.dispatchEvent(new Event(EVT));
}

export function startTask(input: {
  titulo: string;
  dominios?: string[];
  stack?: string;
  briefing?: ActiveTaskBriefing;
}): ActiveTask {
  const task: ActiveTask = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()),
    titulo: input.titulo,
    dominios: input.dominios ?? [],
    stack: input.stack,
    briefing: input.briefing,
    sentinelaSessionIds: [],
    idleSessionIds: [],
    startedAt: Date.now(),
  };
  setActiveTask(task);
  return task;
}

export function attachSentinelaSession(sessionId: string) {
  const t = getActiveTask();
  if (!t) return;
  if (t.sentinelaSessionIds.includes(sessionId)) return;
  setActiveTask({ ...t, sentinelaSessionIds: [...t.sentinelaSessionIds, sessionId] });
}

export function attachIdleSession(sessionId: string) {
  const t = getActiveTask();
  if (!t) return;
  if (t.idleSessionIds.includes(sessionId)) return;
  setActiveTask({ ...t, idleSessionIds: [...t.idleSessionIds, sessionId] });
}

export function onActiveTaskChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}
