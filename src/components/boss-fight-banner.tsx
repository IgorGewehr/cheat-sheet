"use client";

import { Swords } from "lucide-react";
import { clsx } from "clsx";
import type { ReactNode } from "react";

interface BossFightBannerProps {
  headline?: string;
  subtitle?: string;
  cta?: ReactNode;
  className?: string;
}

export function BossFightBanner({
  headline = "BOSS FIGHT INCOMING",
  subtitle,
  cta,
  className,
}: BossFightBannerProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border-2 border-fuchsia-500 bg-fuchsia-950/20 p-4 hunter-pulse-fuchsia",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center">
          <Swords className="w-5 h-5 text-fuchsia-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-fuchsia-400 mb-0.5">
            [SYSTEM] · {headline}
          </p>
          {subtitle && (
            <p className="text-sm font-semibold text-zinc-100 leading-snug">{subtitle}</p>
          )}
        </div>
        {cta && (
          <div className="shrink-0">{cta}</div>
        )}
      </div>
    </div>
  );
}
