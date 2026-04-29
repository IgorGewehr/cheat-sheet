"use client";

import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium",
  secondary: "bg-card-hover hover:bg-line text-fg border border-line-strong",
  ghost: "bg-transparent hover:bg-card-hover text-fg",
  danger: "bg-red-600 hover:bg-red-500 text-white",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; children: ReactNode }) {
  return (
    <Link
      href={href}
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm transition",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line bg-card p-5 transition hover:border-line-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500",
        className,
      )}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-md bg-card border border-line px-3 py-2 text-sm text-fg outline-none focus:border-amber-500",
        className,
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs uppercase tracking-wide text-muted mb-1.5">
      {children}
    </label>
  );
}

export function Tag({ children, color = "zinc" }: { children: ReactNode; color?: "zinc" | "amber" | "emerald" | "sky" | "violet" }) {
  const colors = {
    zinc: "bg-card-hover text-muted",
    amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  };
  return (
    <span className={clsx("inline-block px-2 py-0.5 rounded text-[11px] font-medium", colors[color])}>
      {children}
    </span>
  );
}
