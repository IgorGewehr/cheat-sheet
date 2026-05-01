"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Star, Shield, Zap } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui";
import { listLeaderboard, type PublicProfile } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { SignedOutBanner } from "@/components/signed-out-banner";

export default function RankingPage() {
  const { user, signedIn } = useAuth();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listLeaderboard()
      .then((data) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (!signedIn) return <SignedOutBanner />;

  const getTier = (index: number) => {
    if (index === 0) return { name: "Lenda", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" };
    if (index === 1) return { name: "Grão-Mestre", color: "text-zinc-300", bg: "bg-zinc-300/10", border: "border-zinc-300/30" };
    if (index === 2) return { name: "Mestre", color: "text-amber-700 dark:text-amber-600", bg: "bg-amber-900/10", border: "border-amber-700/30" };
    if (index < 10) return { name: "Diamante", color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30" };
    if (index < 25) return { name: "Ouro", color: "text-amber-500", bg: "bg-transparent", border: "border-amber-500/20" };
    return { name: "Prata", color: "text-zinc-400", bg: "bg-transparent", border: "border-line" };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero */}
      <div className="rounded-3xl p-8 bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/20 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-4">
            <Trophy className="w-3.5 h-3.5" /> Ranking Global
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-fg mb-2">Quadro de Líderes</h1>
          <p className="text-muted max-w-lg">
            Acompanhe a evolução dos desenvolvedores. Complete módulos, sessões de arquitetura e cards diários para subir no ranking.
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <Card className="p-0 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando quadro de líderes...</div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-muted">Nenhum perfil encontrado. O ranking será atualizado em breve.</div>
        ) : (
          <div className="divide-y divide-line">
            {profiles.map((profile, index) => {
              const tier = getTier(index);
              const isMe = user?.uid === profile.userId;

              return (
                <div 
                  key={profile.userId}
                  className={clsx(
                    "flex items-center gap-4 p-4 transition-colors hover:bg-card-hover group",
                    isMe ? "bg-amber-500/5" : ""
                  )}
                >
                  <div className="w-8 text-center font-bold text-muted group-hover:text-fg transition-colors">
                    #{index + 1}
                  </div>
                  
                  {/* Avatar fallback */}
                  <div className="w-12 h-12 rounded-full bg-card-hover border border-line flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-fg">
                        {profile.displayName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={clsx("font-semibold truncate", isMe ? "text-amber-500" : "text-fg")}>
                        {profile.displayName}
                      </p>
                      {isMe && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted mt-1">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 opacity-70" /> Nv. {profile.level} {profile.levelTitle}
                      </span>
                      {profile.topSkill && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-line" />
                          <span className="flex items-center gap-1.5 text-amber-600/80 dark:text-amber-400/80">
                            <Star className="w-3.5 h-3.5" /> Destaque em {profile.topSkill}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border", tier.bg, tier.border, tier.color)}>
                      {index === 0 && <Trophy className="w-3 h-3" />}
                      {index > 0 && index < 3 && <Medal className="w-3 h-3" />}
                      {tier.name}
                    </div>
                    <p className="text-sm font-bold text-fg mt-1.5 flex items-center justify-end gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 opacity-80" />
                      {profile.totalXP.toLocaleString()} <span className="text-[10px] uppercase font-normal text-muted">XP</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
