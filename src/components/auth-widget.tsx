"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { signOutUser } from "@/lib/firebase";
import { LoginModal } from "./login-modal";

export function AuthWidget() {
  const { user, signedIn, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="w-7 h-7 rounded-full bg-card-hover animate-pulse" aria-hidden />
    );
  }

  if (!signedIn || !user) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-amber-500 text-zinc-950 font-medium hover:bg-amber-400 transition"
        >
          <LogIn className="w-3.5 h-3.5" />
          Entrar
        </button>
        {open && <LoginModal onClose={() => setOpen(false)} />}
      </>
    );
  }

  const initial = (user.displayName ?? user.email ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative flex-1 min-w-0" ref={wrapperRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-card-hover transition w-full"
        title={user.email ?? user.displayName ?? user.uid}
      >
        <span className="w-7 h-7 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <span className="text-xs text-muted truncate flex-1 text-left">
          {user.displayName ?? user.email}
        </span>
      </button>
      {menuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-line bg-card shadow-xl z-30 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-line">
            <p className="text-xs text-subtle">logado como</p>
            <p className="text-sm font-medium truncate">{user.email}</p>
            <p className="text-[10px] text-subtle font-mono mt-1 truncate">{user.uid}</p>
          </div>
          <a
            href="/workspace"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-card-hover transition"
          >
            <UserIcon className="w-4 h-4" />
            Workspace
          </a>
          <button
            onClick={async () => {
              await signOutUser();
              location.reload();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-card-hover transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
