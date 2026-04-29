"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ensureSignedIn, subscribeAuth, type User } from "./firebase";
import { getWorkspaceId, setWorkspaceId } from "./workspace";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAnonymous: boolean;
  workspaceId: string;
};

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  isAnonymous: true,
  workspaceId: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWsId] = useState("");

  useEffect(() => {
    let unsub: (() => void) | undefined;
    ensureSignedIn().then(() => {
      unsub = subscribeAuth((u) => {
        setUser(u);
        setLoading(false);
        // workspace ID:
        // - se usuário tem email (não-anônimo) e localStorage não foi setado manualmente,
        //   usar o UID como workspace
        const current = getWorkspaceId();
        if (u && !u.isAnonymous && current !== u.uid) {
          // só promove se localStorage ainda é o anônimo default (UUID)
          // para não quebrar quem trocou de workspace manualmente
          const wasManuallySet = window.localStorage.getItem("brain.workspaceManual") === "1";
          if (!wasManuallySet) {
            setWorkspaceId(u.uid);
            setWsId(u.uid);
            return;
          }
        }
        setWsId(current);
      });
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isAnonymous: user?.isAnonymous ?? true,
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
