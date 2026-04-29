"use client";

import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "./login-modal";

export function SignedOutBanner({ message }: { message?: string }) {
  const { signedIn, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading || signedIn) return null;

  return (
    <>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 flex items-start gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <LogIn className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <p className="font-semibold text-sm">Faça login pra ver seus dados</p>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">
            {message ?? "Projetos, adoções e comparações ficam ligados à sua conta. Anonymous foi desativado."}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-md text-xs bg-amber-500 text-zinc-950 font-medium hover:bg-amber-400 transition flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Entrar / criar conta
        </button>
      </div>
      {open && <LoginModal onClose={() => setOpen(false)} />}
    </>
  );
}
