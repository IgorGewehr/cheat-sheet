"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, TrendingUp, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";
import { listSentinelaSessions } from "@/lib/sentinela-db";
import type { SentinelaSession, SentinelaVeredito } from "@/lib/sentinela-types";

type Bucket = {
  key: string;
  label: string;
  total: number;
  pass: number;
  warn: number;
  deny: number;
  scoreSum: number;
};

const VERDICT_COLOR: Record<SentinelaVeredito, string> = {
  PASS: "bg-emerald-500",
  WARN: "bg-amber-500",
  DENY: "bg-red-500",
};

function trustScore(b: Bucket): number {
  // Heuristic: PASS = 100, WARN = 50, DENY = 0, weighted, blended with mean confidence.
  if (b.total === 0) return 0;
  const verdictAvg = (b.pass * 100 + b.warn * 50 + b.deny * 0) / b.total;
  const confAvg = b.scoreSum / b.total;
  return Math.round(verdictAvg * 0.6 + confAvg * 0.4);
}

function aggregate(
  sessions: SentinelaSession[],
  keyFn: (s: SentinelaSession) => string,
  labelFn?: (k: string) => string,
): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const s of sessions) {
    const key = keyFn(s) || "outro";
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: labelFn?.(key) ?? key,
        total: 0,
        pass: 0,
        warn: 0,
        deny: 0,
        scoreSum: 0,
      });
    }
    const b = map.get(key)!;
    b.total++;
    if (s.veredito === "PASS") b.pass++;
    if (s.veredito === "WARN") b.warn++;
    if (s.veredito === "DENY") b.deny++;
    b.scoreSum += s.scoreConfianca;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function StackedBar({ b }: { b: Bucket }) {
  const pct = (n: number) => (b.total > 0 ? (n / b.total) * 100 : 0);
  return (
    <div className="flex w-full h-2 rounded-full overflow-hidden bg-line">
      <div className="bg-emerald-500" style={{ width: `${pct(b.pass)}%` }} />
      <div className="bg-amber-500" style={{ width: `${pct(b.warn)}%` }} />
      <div className="bg-red-500" style={{ width: `${pct(b.deny)}%` }} />
    </div>
  );
}

export function SlopDashboard() {
  const [sessions, setSessions] = useState<SentinelaSession[] | null>(null);

  useEffect(() => {
    listSentinelaSessions(200).then(setSessions).catch(() => setSessions([]));
  }, []);

  if (sessions === null) return null;
  if (sessions.length === 0) {
    return (
      <Card>
        <p className="text-sm font-semibold flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-violet-500" /> Slop tracking
        </p>
        <p className="text-sm text-muted">
          Nenhuma sessão de Sentinela ainda.{" "}
          <Link href="/sentinela" className="text-violet-500 hover:underline">
            Audite seu primeiro código →
          </Link>
        </p>
      </Card>
    );
  }

  const total = sessions.length;
  const passN = sessions.filter((s) => s.veredito === "PASS").length;
  const warnN = sessions.filter((s) => s.veredito === "WARN").length;
  const denyN = sessions.filter((s) => s.veredito === "DENY").length;
  const slopRate = total > 0 ? Math.round(((warnN + denyN) / total) * 100) : 0;

  const byLanguage = aggregate(sessions, (s) => s.linguagem ?? "outro");
  const byCategory = aggregate(
    sessions.flatMap((s) =>
      s.achados.map((a) => ({ ...s, _cat: a.categoria } as SentinelaSession & { _cat: string })),
    ),
    (s) => (s as SentinelaSession & { _cat: string })._cat,
  );

  // 4-week trend
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const trend = [3, 2, 1, 0].map((wi) => {
    const start = now - (wi + 1) * week;
    const end = now - wi * week;
    const inWeek = sessions.filter((s) => s.criadoEm >= start && s.criadoEm < end);
    const rate =
      inWeek.length > 0
        ? Math.round(
            (inWeek.filter((s) => s.veredito !== "PASS").length / inWeek.length) * 100,
          )
        : 0;
    return { weekIdx: wi, count: inWeek.length, slopRate: rate };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-violet-500" /> Slop tracking
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Sentinela já auditou {total} sessões — slop rate global {slopRate}%
          </p>
        </div>
        <Link
          href="/sentinela"
          className="text-xs text-violet-500 hover:underline flex items-center gap-1"
        >
          Auditar agora <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-[10px] uppercase text-muted">Total auditado</p>
          <p className="text-2xl font-semibold">{total}</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase text-muted">PASS</p>
          <p className="text-2xl font-semibold text-emerald-500">{passN}</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase text-muted">WARN</p>
          <p className="text-2xl font-semibold text-amber-500">{warnN}</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase text-muted">DENY</p>
          <p className="text-2xl font-semibold text-red-500">{denyN}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Tendência 4 semanas</p>
          <span className="text-xs text-muted flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            slop rate por semana
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {trend.map((t) => (
            <div key={t.weekIdx} className="flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center h-16">
                <div
                  className={`w-full rounded-t ${
                    t.slopRate > 50
                      ? "bg-red-500/70"
                      : t.slopRate > 25
                      ? "bg-amber-500/70"
                      : "bg-emerald-500/70"
                  }`}
                  style={{ height: `${Math.max(4, t.slopRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted font-mono">
                {t.weekIdx === 0 ? "esta" : `${t.weekIdx}sem`}
              </span>
              <span className="text-[10px] text-fg font-semibold">
                {t.count > 0 ? `${t.slopRate}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-semibold mb-3">Confiança por linguagem</p>
          {byLanguage.length === 0 ? (
            <p className="text-xs text-muted">Sem dados.</p>
          ) : (
            <div className="space-y-2.5">
              {byLanguage.slice(0, 8).map((b) => (
                <div key={b.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-fg">{b.label}</span>
                    <span className="text-[10px] text-muted">
                      {b.total} · trust {trustScore(b)}/100
                    </span>
                  </div>
                  <StackedBar b={b} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm font-semibold mb-3">Categorias mais frágeis</p>
          {byCategory.length === 0 ? (
            <p className="text-xs text-muted">Sem achados.</p>
          ) : (
            <div className="space-y-2.5">
              {byCategory
                .filter((b) => b.total > 0)
                .slice(0, 8)
                .map((b) => {
                  const pctDeny = b.total > 0 ? Math.round((b.deny / b.total) * 100) : 0;
                  return (
                    <div key={b.key} className="flex items-center gap-3">
                      <span className="text-xs w-32 shrink-0">{b.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                        <div
                          className={VERDICT_COLOR.DENY}
                          style={{ width: `${pctDeny}%`, height: "100%" }}
                        />
                      </div>
                      <span className="text-[10px] text-muted w-10 text-right">{b.total}x</span>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
