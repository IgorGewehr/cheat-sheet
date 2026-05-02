"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

interface SystemWindowProps {
  children: ReactNode;
  /** Top monospace pill label. Defaults to "[SYSTEM]". */
  label?: string;
  subtitle?: string;
  variant?: "default" | "alert" | "success";
  className?: string;
}

const VARIANT_BORDER: Record<string, string> = {
  default: "border-cyan-500 dark:border-[var(--hunter-cyan)]",
  alert:   "border-red-500",
  success: "border-emerald-500",
};

const VARIANT_LABEL_COLOR: Record<string, string> = {
  default: "text-cyan-600 dark:text-cyan-400",
  alert:   "text-red-500",
  success: "text-emerald-500",
};

export function SystemWindow({
  children,
  label = "[SYSTEM]",
  subtitle,
  variant = "default",
  className,
}: SystemWindowProps) {
  const glowVar =
    variant === "alert"   ? "var(--hunter-glow-danger)" :
    variant === "success" ? "0 0 20px rgba(34, 197, 94, 0.4)" :
    "var(--hunter-glow-cyan)";

  return (
    <div
      className={clsx(
        "rounded-lg border bg-white dark:bg-[var(--hunter-panel)] p-4",
        VARIANT_BORDER[variant],
        className,
      )}
      style={{ boxShadow: glowVar }}
    >
      {/* Header pill */}
      <div className="mb-3 flex flex-col gap-0.5">
        <span
          className={clsx(
            "inline-block w-fit px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest border",
            VARIANT_LABEL_COLOR[variant],
            variant === "default" ? "border-cyan-500/40 dark:border-[var(--hunter-cyan)]/40 bg-cyan-50 dark:bg-cyan-950/30" :
            variant === "alert"   ? "border-red-500/40 bg-red-50 dark:bg-red-950/30" :
            "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30",
          )}
        >
          {label}
        </span>
        {subtitle && (
          <p className="text-xs text-muted mt-1">{subtitle}</p>
        )}
      </div>

      <hr className="hunter-divider mb-3" />

      {children}
    </div>
  );
}
