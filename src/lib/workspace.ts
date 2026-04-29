"use client";

import { v4 as uuidv4 } from "uuid";

const WORKSPACE_KEY = "brain.workspaceId";
const MANUAL_KEY = "brain.workspaceManual";

export function getWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(WORKSPACE_KEY);
  if (!id) {
    id = uuidv4();
    window.localStorage.setItem(WORKSPACE_KEY, id);
  }
  return id;
}

export function setWorkspaceId(id: string, manual = false): void {
  if (typeof window === "undefined") return;
  const trimmed = id.trim();
  if (!trimmed) return;
  window.localStorage.setItem(WORKSPACE_KEY, trimmed);
  if (manual) {
    window.localStorage.setItem(MANUAL_KEY, "1");
  }
}

export function clearWorkspaceManual(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MANUAL_KEY);
}

export function resetWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  const id = uuidv4();
  window.localStorage.setItem(WORKSPACE_KEY, id);
  window.localStorage.removeItem(MANUAL_KEY);
  return id;
}
