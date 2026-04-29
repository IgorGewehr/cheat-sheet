"use client";

import { Info, CheckCircle2, AlertTriangle, AlertOctagon, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "clsx";

type CalloutType = "info" | "success" | "warning" | "danger" | "tip";

const config: Record<CalloutType, { bg: string; border: string; icon: typeof Info; iconColor: string }> = {
  info:    { bg: "bg-sky-500/10",     border: "border-sky-500",     icon: Info,            iconColor: "text-sky-500" },
  success: { bg: "bg-emerald-500/10", border: "border-emerald-500", icon: CheckCircle2,    iconColor: "text-emerald-500" },
  warning: { bg: "bg-amber-500/10",   border: "border-amber-500",   icon: AlertTriangle,   iconColor: "text-amber-500" },
  danger:  { bg: "bg-red-500/10",     border: "border-red-500",     icon: AlertOctagon,    iconColor: "text-red-500" },
  tip:     { bg: "bg-violet-500/10",  border: "border-violet-500",  icon: Lightbulb,       iconColor: "text-violet-500" },
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const { bg, border, icon: Icon, iconColor } = config[type];
  return (
    <div className={clsx("border-l-4 rounded-r-lg p-4 my-4 flex gap-3", bg, border)}>
      <Icon className={clsx("w-5 h-5 shrink-0 mt-0.5", iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1.5">{title}</div>}
        <div className="text-sm leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">{children}</div>
      </div>
    </div>
  );
}
