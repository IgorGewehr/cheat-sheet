"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "./ui";
import { signInEmail, signUpEmail, resetPassword } from "@/lib/firebase";

type Mode = "signin" | "signup" | "reset";

const FRIENDLY_ERR: Record<string, string> = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-not-found": "Conta não encontrada.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Esse e-mail já está cadastrado.",
  "auth/weak-password": "Senha muito fraca (mínimo 6 caracteres).",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco.",
  "auth/network-request-failed": "Falha de rede.",
  "auth/missing-email": "Informe o e-mail.",
};

export function LoginModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setResetSent(false);
  }

  async function submit() {
    setError("");

    if (mode === "reset") {
      if (!email.trim()) return;
      setLoading(true);
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        setError(FRIENDLY_ERR[code] ?? (err as Error).message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) return;
    setLoading(true);
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

  if (!mounted) return null;

  const titles: Record<Mode, string> = {
    signin: "Entrar",
    signup: "Criar conta",
    reset: "Recuperar senha",
  };

  const submitLabel: Record<Mode, string> = {
    signin: "Entrar",
    signup: "Criar conta",
    reset: "Enviar link de redefinição",
  };

  const submitDisabled =
    loading ||
    !email.trim() ||
    (mode !== "reset" && !password);

  const modal = (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            {mode === "reset" && (
              <button
                onClick={() => switchMode("signin")}
                className="text-muted hover:text-fg"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-semibold">{titles[mode]}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {mode === "reset" && resetSent ? (
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Link enviado.</p>
                <p className="text-xs text-muted leading-relaxed">
                  Se existe uma conta para <strong className="text-fg">{email}</strong>, você
                  receberá em alguns segundos um e-mail com link pra criar uma nova senha.
                  Cheque também sua caixa de spam.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => switchMode("signin")}
              className="w-full"
              variant="secondary"
            >
              Voltar pro login
            </Button>
          </div>
        ) : (
          <form
            className="p-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {mode === "reset" && (
              <p className="text-xs text-muted leading-relaxed bg-card-hover/60 border border-line rounded-md px-3 py-2.5">
                Informe seu e-mail. Enviamos um link pra você definir uma nova senha.
              </p>
            )}

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

            {mode !== "reset" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wide text-muted">
                    Senha
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
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
                    minLength={mode === "signup" ? 6 : undefined}
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitDisabled} className="w-full">
              {loading ? "Aguarde…" : submitLabel[mode]}
            </Button>

            <div className="text-center text-xs text-subtle">
              {mode === "signin" && (
                <>
                  Sem conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Criar uma
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Entrar
                  </button>
                </>
              )}
              {mode === "reset" && (
                <>
                  Lembrou?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Voltar pro login
                  </button>
                </>
              )}
            </div>

            {mode !== "reset" && (
              <p className="text-[11px] text-subtle leading-relaxed pt-2 border-t border-line">
                Sua conta vincula seu workspace ao seu UID Firebase. Os dados que você criou
                anonimamente neste navegador continuam acessíveis — você pode migrá-los na
                página Workspace.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
