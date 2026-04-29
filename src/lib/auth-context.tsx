"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { subscribeAuth, type User } from "./firebase";
import { getWorkspaceId, setWorkspaceId } from "./workspace";

type AuthState = {
  user: User | null;
  loading: boolean;
  signedIn: boolean;
  workspaceId: string;
};

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  signedIn: false,
  workspaceId: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWsId] = useState("");

  useEffect(() => {
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setLoading(false);

      // Sem usuário: workspace fica vazio (DB calls vão falhar com AuthRequiredError).
      if (!u) {
        setWsId("");
        return;
      }

      // Usuário logado: workspace = UID, a menos que user tenha trocado manualmente.
      const wasManuallySet =
        typeof window !== "undefined" &&
        window.localStorage.getItem("brain.workspaceManual") === "1";

      if (wasManuallySet) {
        setWsId(getWorkspaceId());
      } else {
        setWorkspaceId(u.uid);
        setWsId(u.uid);
      }
    });
    return () => unsub();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        signedIn: !!user,
        workspaceId,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
