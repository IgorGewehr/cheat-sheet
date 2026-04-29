"use client";

import { useState } from "react";
import { X, Mail, Lock, User as UserIcon } from "lucide-react";
import { Button } from "./ui";
import { signInEmail, signUpEmail } from "@/lib/firebase";

type Mode = "signin" | "signup";

const FRIENDLY_ERR: Record<string, string> = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-not-found": "Conta não encontrada.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
  "auth/weak-password": "Senha muito fraca (mínimo 6 caracteres).",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco.",
  "auth/network-request-failed": "Falha de rede.",
};

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUpEmail(email, password, name);
      } else {
        await signInEmail(email, password);
      }
      onClose();
      location.reload();
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(FRIENDLY_ERR[code] ?? (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-lg font-semibold">
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {mode === "signup" && (
            <div>
              <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
                Nome
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="w-full rounded-md bg-card-hover border border-line pl-9 pr-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="seu nome"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full rounded-md bg-card-hover border border-line pl-9 pr-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-muted mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="w-full rounded-md bg-card-hover border border-line pl-9 pr-3 py-2 text-sm text-fg outline-none focus:border-amber-500"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "mínimo 6 caracteres" : "sua senha"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading || !email.trim() || !password} className="w-full">
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </Button>

          <div className="text-center text-xs text-subtle">
            {mode === "signin" ? (
              <>
                Sem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Criar uma
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-subtle leading-relaxed pt-2 border-t border-line">
            Sua conta vincula seu workspace ao seu UID Firebase. Os dados que você criou
            anonimamente neste navegador continuam acessíveis — você pode migrá-los na página
            Workspace.
          </p>
        </form>
      </div>
    </div>
  );
}
