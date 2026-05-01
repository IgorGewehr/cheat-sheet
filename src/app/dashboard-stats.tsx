"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { getActiveProject, setActiveProject, type ActiveProjectContext } from "@/lib/active-project";
import {
  CalendarDays,
  Flame,
  BookOpen,
  Swords,
  Mic,
  PenTool,
  FlaskConical,
  AlertCircle,
  BookMarked,
  TrendingUp,
  Map,
  BarChart3,
  GitFork,
  Brain,
  Layers,
  Shield,
  ClipboardCheck,
  Scale,
  Zap,
  ChevronRight,
  Users,
  FileText,
  Bug,
  Target,
  Trophy,
  Star,
  Bot,
  GitBranch,
  MessageSquareMore,
  Briefcase,
  GraduationCap,
  Moon,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui";
import { SignedOutBanner } from "@/components/signed-out-banner";
import { useAuth } from "@/lib/auth-context";
import { RadarChart, computeRadarAxes } from "@/components/radar-chart";
import {
  listProjects,
  listAllAdocoes,
  listCardDoDiaProgresso,
  listDividas,
  listErrosPersonais,
  listSprintsSemIA,
  listRetrospectivas,
  listWarGames,
  listMockInterviews,
  listSystemDesigns,
  listRFCSessions,
  listRevisoesCodigo,
  listTrilhaProgresso,
  listComparacoes,
  syncPublicProfile,
} from "@/lib/db";
import type {
  Card as CardType,
  Project,
  Adocao,
  CardDoDiaProgresso,
  DividaConhecimento,
  ErroPersonal,
  SprintSemIA,
  Retrospectiva,
  WarGameSession,
  MockInterviewSession,
  SystemDesignSession,
  RFCSession,
  RevisorSession,
  TrilhaProgresso,
  SavedComparison,
} from "@/lib/types";

// ─── XP Table ───────────────────────────────────────────────

const XP_TABLE = {
  cardDoDia: 20,
  warGame: 30,
  mockInterview: 50,
  systemDesign: 40,
  sprintSemIA: 35,
  retrospectiva: 25,
  dividaPaga: 15,
  revisorSession: 20,
  rfcRevisado: 45,
  erroRegistrado: 5,
  padraoAdotado: 10,
  comparacaoFeita: 15,
};

const WORK_XP_DAILY_GOAL = 30;

// ─── Levels ─────────────────────────────────────────────────

const LEVELS = [
  { level: 0, title: "Aprendiz",   min: 0,    max: 50,        color: "zinc",    emoji: "🌱" },
  { level: 1, title: "Estagiário", min: 50,   max: 200,       color: "zinc",    emoji: "📚" },
  { level: 2, title: "Júnior",     min: 200,  max: 500,       color: "sky",     emoji: "💡" },
  { level: 3, title: "Pleno",      min: 500,  max: 1100,      color: "emerald", emoji: "⚡" },
  { level: 4, title: "Sênior",     min: 1100, max: 2500,      color: "amber",   emoji: "🔥" },
  { level: 5, title: "Staff",      min: 2500, max: 5000,      color: "violet",  emoji: "🚀" },
  { level: 6, title: "Principal",  min: 5000, max: Infinity,  color: "rose",    emoji: "👑" },
];

// ─── Achievements ────────────────────────────────────────────

interface AchievementData {
  cardsCompleted: number;
  streak: number;
  warGames: number;
  interviews: number;
  systemDesigns: number;
  sprintsSemIA: number;
  dividasRegistradas: number;
  dividasPagas: number;
  errosRegistrados: number;
  conceitosDominados: number;
  rfcsRevisados: number;
  agentCardsCompleted: number;
}

const ACHIEVEMENTS = [
  { id: "first-card",      icon: "🧠", title: "Primeira Faísca",   desc: "Completou o primeiro Card do Dia",          condition: (d: AchievementData) => d.cardsCompleted >= 1 },
  { id: "streak-3",        icon: "🔥", title: "Pegando Fogo",       desc: "3 dias seguidos de Card do Dia",            condition: (d: AchievementData) => d.streak >= 3 },
  { id: "streak-7",        icon: "⚡", title: "Semana Completa",    desc: "7 dias seguidos de Card do Dia",            condition: (d: AchievementData) => d.streak >= 7 },
  { id: "streak-30",       icon: "🌟", title: "Mês de Dedicação",   desc: "30 dias seguidos de Card do Dia",           condition: (d: AchievementData) => d.streak >= 30 },
  { id: "first-war",       icon: "⚔️", title: "Primeira Batalha",   desc: "Completou o primeiro War Game",             condition: (d: AchievementData) => d.warGames >= 1 },
  { id: "war-5",           icon: "🛡️", title: "Veterano de Guerra", desc: "5 War Games completados",                   condition: (d: AchievementData) => d.warGames >= 5 },
  { id: "first-interview", icon: "🎤", title: "No Palco",           desc: "Completou a primeira Mock Interview",       condition: (d: AchievementData) => d.interviews >= 1 },
  { id: "first-design",    icon: "🏗️", title: "Arquiteto",          desc: "Primeiro System Design avaliado",           condition: (d: AchievementData) => d.systemDesigns >= 1 },
  { id: "first-sprint",    icon: "💪", title: "Sem Muleta",         desc: "Primeiro Sprint sem IA completado",         condition: (d: AchievementData) => d.sprintsSemIA >= 1 },
  { id: "debts-10",        icon: "📖", title: "Honestidade Radical", desc: "10 dívidas de conhecimento registradas",   condition: (d: AchievementData) => d.dividasRegistradas >= 10 },
  { id: "debts-paid-5",    icon: "✅", title: "Quitando Dívidas",   desc: "5 dívidas de conhecimento pagas",           condition: (d: AchievementData) => d.dividasPagas >= 5 },
  { id: "errors-5",        icon: "🔍", title: "Detetive de Bugs",   desc: "5 erros pessoais catalogados",              condition: (d: AchievementData) => d.errosRegistrados >= 5 },
  { id: "trilha-20",       icon: "🎓", title: "Em Progresso",       desc: "20 conceitos dominados na trilha",          condition: (d: AchievementData) => d.conceitosDominados >= 20 },
  { id: "trilha-50",       icon: "👑", title: "Quase Lá",           desc: "50 conceitos dominados na trilha",          condition: (d: AchievementData) => d.conceitosDominados >= 50 },
  { id: "rfc-first",       icon: "📝", title: "Proposta Técnica",   desc: "Primeiro RFC escrito e avaliado",           condition: (d: AchievementData) => d.rfcsRevisados >= 1 },
  { id: "agent-first",    icon: "🤖", title: "Primeiro Agente",      desc: "Completou o primeiro card de Agentes IA",            condition: (d: AchievementData) => d.agentCardsCompleted >= 1 },
  { id: "agent-5",        icon: "🔗", title: "Encadeador",            desc: "Dominou 5 conceitos de Agentes IA",                  condition: (d: AchievementData) => d.agentCardsCompleted >= 5 },
  { id: "agent-10",       icon: "🧠", title: "Memória Vetorial",      desc: "Dominou 10 conceitos de Agentes IA (RAG, memória...)", condition: (d: AchievementData) => d.agentCardsCompleted >= 10 },
  { id: "agent-master",   icon: "🕸️", title: "Arquiteto de Agentes",  desc: "Dominou 20 ou mais conceitos de Agentes IA",          condition: (d: AchievementData) => d.agentCardsCompleted >= 20 },
];

// ─── Helpers ─────────────────────────────────────────────────

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function isEndOfWeek(): boolean {
  return new Date().getDay() >= 4;
}

function computeStreak(progresso: CardDoDiaProgresso[]): number {
  const doneSet = new Set(
    progresso.filter((p) => p.completado).map((p) => p.data)
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (doneSet.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function computeXP(data: {
  cardProgresso: CardDoDiaProgresso[];
  warGames: WarGameSession[];
  interviews: MockInterviewSession[];
  systemDesigns: SystemDesignSession[];
  sprints: SprintSemIA[];
  retrospectivas: Retrospectiva[];
  dividas: DividaConhecimento[];
  revisoes: RevisorSession[];
  rfcs: RFCSession[];
  erros: ErroPersonal[];
  adocoes: Adocao[];
  comparacoes: SavedComparison[];
}): number {
  let xp = 0;
  xp += data.cardProgresso.filter((p) => p.completado).length * XP_TABLE.cardDoDia;
  xp += data.warGames.length * XP_TABLE.warGame;
  xp += data.interviews.filter((i) => i.status === "concluido").length * XP_TABLE.mockInterview;
  xp += data.systemDesigns.filter((s) => s.status === "avaliado").length * XP_TABLE.systemDesign;
  xp += data.sprints.filter((s) => s.status === "concluido").length * XP_TABLE.sprintSemIA;
  xp += data.retrospectivas.length * XP_TABLE.retrospectiva;
  xp += data.dividas.filter((d) => d.status === "paga").length * XP_TABLE.dividaPaga;
  xp += data.revisoes.filter((r) => r.status === "avaliado").length * XP_TABLE.revisorSession;
  xp += data.rfcs.filter((r) => r.status === "revisado").length * XP_TABLE.rfcRevisado;
  xp += data.erros.length * XP_TABLE.erroRegistrado;
  xp += data.adocoes.length * XP_TABLE.padraoAdotado;
  xp += data.comparacoes.length * XP_TABLE.comparacaoFeita;
  return xp;
}

// ─── Work XP ────────────────────────────────────────────────

function computeWorkXP(data: {
  revisoes: RevisorSession[];
  comparacoes: SavedComparison[];
  erros: ErroPersonal[];
  adocoes: Adocao[];
  dividas: DividaConhecimento[];
}): number {
  let xp = 0;
  xp += data.revisoes.filter((r) => r.status === "avaliado").length * XP_TABLE.revisorSession;
  xp += data.comparacoes.length * XP_TABLE.comparacaoFeita;
  xp += data.erros.length * XP_TABLE.erroRegistrado;
  xp += data.adocoes.length * XP_TABLE.padraoAdotado;
  xp += data.dividas.filter((d) => d.status === "paga").length * XP_TABLE.dividaPaga;
  return xp;
}

function computeWorkXPToday(data: {
  revisoes: RevisorSession[];
  comparacoes: SavedComparison[];
  erros: ErroPersonal[];
  adocoes: Adocao[];
  dividas: DividaConhecimento[];
}): number {
  const today = new Date().toISOString().split("T")[0];
  const todayMs = new Date(today).getTime();
  const tomorrowMs = todayMs + 86400000;
  const inToday = (ts: number) => ts >= todayMs && ts < tomorrowMs;
  let xp = 0;
  xp += data.revisoes.filter((r) => r.status === "avaliado" && inToday(r.criadoEm)).length * XP_TABLE.revisorSession;
  xp += data.comparacoes.filter((c) => inToday(c.criadoEm)).length * XP_TABLE.comparacaoFeita;
  xp += data.erros.filter((e) => inToday(e.criadoEm)).length * XP_TABLE.erroRegistrado;
  xp += data.adocoes.filter((a) => inToday(a.dataDecisao)).length * XP_TABLE.padraoAdotado;
  xp += data.dividas.filter((d) => d.status === "paga" && d.resolvidoEm && inToday(d.resolvidoEm)).length * XP_TABLE.dividaPaga;
  return xp;
}

function computeWorkStreak(data: {
  revisoes: RevisorSession[];
  comparacoes: SavedComparison[];
  erros: ErroPersonal[];
  adocoes: Adocao[];
}): number {
  const toDate = (ts: number) => new Date(ts).toISOString().split("T")[0];
  const workDates = new Set<string>();
  data.revisoes.filter((r) => r.status === "avaliado").forEach((r) => workDates.add(toDate(r.criadoEm)));
  data.comparacoes.forEach((c) => workDates.add(toDate(c.criadoEm)));
  data.erros.forEach((e) => workDates.add(toDate(e.criadoEm)));
  data.adocoes.forEach((a) => workDates.add(toDate(a.dataDecisao)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (workDates.has(d.toISOString().split("T")[0])) streak++;
    else break;
  }
  return streak;
}

function computeXPToday(data: {
  cardProgresso: CardDoDiaProgresso[];
  warGames: WarGameSession[];
  interviews: MockInterviewSession[];
  systemDesigns: SystemDesignSession[];
  sprints: SprintSemIA[];
  retrospectivas: Retrospectiva[];
  dividas: DividaConhecimento[];
  revisoes: RevisorSession[];
  rfcs: RFCSession[];
  erros: ErroPersonal[];
  adocoes: Adocao[];
  comparacoes: SavedComparison[];
}): number {
  const today = new Date().toISOString().split("T")[0];
  const todayMs = new Date(today).getTime();
  const tomorrowMs = todayMs + 86400000;

  const inToday = (ts: number) => ts >= todayMs && ts < tomorrowMs;

  let xp = 0;
  xp += data.cardProgresso.filter((p) => p.completado && p.data === today).length * XP_TABLE.cardDoDia;
  xp += data.warGames.filter((w) => inToday(w.criadoEm)).length * XP_TABLE.warGame;
  xp += data.interviews.filter((i) => i.status === "concluido" && inToday(i.criadoEm)).length * XP_TABLE.mockInterview;
  xp += data.systemDesigns.filter((s) => s.status === "avaliado" && inToday(s.criadoEm)).length * XP_TABLE.systemDesign;
  xp += data.sprints.filter((s) => s.status === "concluido" && s.concluidoEm && inToday(s.concluidoEm)).length * XP_TABLE.sprintSemIA;
  xp += data.retrospectivas.filter((r) => inToday(r.criadoEm)).length * XP_TABLE.retrospectiva;
  xp += data.dividas.filter((d) => d.status === "paga" && d.resolvidoEm && inToday(d.resolvidoEm)).length * XP_TABLE.dividaPaga;
  xp += data.revisoes.filter((r) => r.status === "avaliado" && inToday(r.criadoEm)).length * XP_TABLE.revisorSession;
  xp += data.rfcs.filter((r) => r.status === "revisado" && inToday(r.criadoEm)).length * XP_TABLE.rfcRevisado;
  xp += data.erros.filter((e) => inToday(e.criadoEm)).length * XP_TABLE.erroRegistrado;
  xp += data.adocoes.filter((a) => inToday(a.dataDecisao)).length * XP_TABLE.padraoAdotado;
  xp += data.comparacoes.filter((c) => inToday(c.criadoEm)).length * XP_TABLE.comparacaoFeita;
  return xp;
}

function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function getLevelProgress(xp: number): number {
  const lvl = getLevel(xp);
  if (lvl.max === Infinity) return 100;
  const range = lvl.max - lvl.min;
  const progress = xp - lvl.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

function getNextLevel(xp: number) {
  const current = getLevel(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1);
  return next ?? current;
}

// ─── Smart Today section ─────────────────────────────────────

interface TodayAction {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
  urgency: "high" | "medium" | "low" | "suggestion";
  color: string;
}

function getTodayActions(data: {
  cardProgresso: CardDoDiaProgresso[];
  dividas: DividaConhecimento[];
  sprints: SprintSemIA[];
  retrospectivas: Retrospectiva[];
}): TodayAction[] {
  const actions: TodayAction[] = [];
  const today = new Date().toISOString().split("T")[0];

  const doneToday = data.cardProgresso.some((p) => p.data === today && p.completado);
  if (!doneToday) {
    actions.push({
      icon: CalendarDays,
      title: "Card do Dia pendente",
      desc: "Seus 10 minutos de aprendizado de hoje",
      href: "/card-do-dia",
      urgency: "high",
      color: "amber",
    });
  }

  const pendenteDividas = data.dividas.filter((d) => d.status === "pendente");
  if (pendenteDividas.length > 0) {
    actions.push({
      icon: AlertCircle,
      title: `${pendenteDividas.length} dívida${pendenteDividas.length > 1 ? "s" : ""} pendente${pendenteDividas.length > 1 ? "s" : ""}`,
      desc: "Conhecimento que você usou sem entender de verdade",
      href: "/divida",
      urgency: "medium",
      color: "red",
    });
  }

  const sprintAtivo = data.sprints.find((s) => s.status === "em-andamento");
  if (sprintAtivo) {
    actions.push({
      icon: FlaskConical,
      title: "Sprint sem IA em andamento",
      desc: sprintAtivo.titulo,
      href: "/sprint-sem-ia",
      urgency: "medium",
      color: "emerald",
    });
  }

  const semana = getCurrentWeek();
  const temRetro = data.retrospectivas.some((r) => r.semana === semana);
  if (!temRetro && isEndOfWeek()) {
    actions.push({
      icon: BookMarked,
      title: "Retrospectiva da semana",
      desc: "Reflita sobre o que aprendeu esta semana",
      href: "/retrospectiva",
      urgency: "low",
      color: "violet",
    });
  }

  if (actions.length === 0) {
    actions.push({
      icon: Swords,
      title: "Pronto para um desafio?",
      desc: "Teste sua tomada de decisão com um War Game",
      href: "/war-game",
      urgency: "suggestion",
      color: "sky",
    });
  }

  return actions.slice(0, 4);
}

// ─── Urgency colors ──────────────────────────────────────────

const urgencyBorder: Record<string, string> = {
  high:       "border-amber-500/40 bg-amber-500/5",
  medium:     "border-line bg-card",
  low:        "border-line bg-card",
  suggestion: "border-sky-500/30 bg-sky-500/5",
};

const actionIconColor: Record<string, string> = {
  amber:   "text-amber-500",
  red:     "text-red-500",
  emerald: "text-emerald-500",
  violet:  "text-violet-500",
  sky:     "text-sky-500",
};

// ─── Feature grid ─────────────────────────────────────────────

interface FeatureLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
  hot?: boolean;
}

interface FeatureSection {
  title: string;
  links: FeatureLink[];
}

// ─── Skeleton ─────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("animate-pulse bg-card-hover rounded-xl", className)} />
  );
}

// ─── Health score (simplified) ────────────────────────────────

function computeHealthScore(adocoes: Adocao[], cardProgresso: CardDoDiaProgresso[]): number {
  const adocaoRate = Math.min(1, adocoes.length / 10);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });
  const completedLast7 = last7.filter((day) =>
    cardProgresso.some((p) => p.data === day && p.completado)
  ).length;
  const cardRate = completedLast7 / 7;
  return Math.round(((adocaoRate + cardRate) / 2) * 100);
}

// ─── Main component ──────────────────────────────────────────

export function DashboardStats({ totalCards, allCards }: { totalCards: number; allCards: CardType[] }) {
  const { signedIn, user } = useAuth();

  const [loadingCore, setLoadingCore] = useState(true);
  const [loadingFull, setLoadingFull] = useState(true);
  const loading = loadingCore || loadingFull;
  const [projects, setProjects] = useState<Project[]>([]);
  const [adocoes, setAdocoes] = useState<Adocao[]>([]);
  const [cardProgresso, setCardProgresso] = useState<CardDoDiaProgresso[]>([]);
  const [dividas, setDividas] = useState<DividaConhecimento[]>([]);
  const [erros, setErros] = useState<ErroPersonal[]>([]);
  const [sprints, setSprints] = useState<SprintSemIA[]>([]);
  const [retrospectivas, setRetrospectivas] = useState<Retrospectiva[]>([]);
  const [warGames, setWarGames] = useState<WarGameSession[]>([]);
  const [interviews, setInterviews] = useState<MockInterviewSession[]>([]);
  const [systemDesigns, setSystemDesigns] = useState<SystemDesignSession[]>([]);
  const [rfcs, setRfcs] = useState<RFCSession[]>([]);
  const [revisoes, setRevisoes] = useState<RevisorSession[]>([]);
  const [trilha, setTrilha] = useState<TrilhaProgresso[]>([]);
  const [comparacoes, setComparacoes] = useState<SavedComparison[]>([]);

  useEffect(() => {
    if (!signedIn) {
      setLoadingCore(false);
      setLoadingFull(false);
      return;
    }

    // Wave 1: data needed for "Hoje" section — loads fast
    (async () => {
      try {
        const [cp, div, sp, retro] = await Promise.all([
          listCardDoDiaProgresso(),
          listDividas(),
          listSprintsSemIA(),
          listRetrospectivas(),
        ]);
        setCardProgresso(cp);
        setDividas(div);
        setSprints(sp);
        setRetrospectivas(retro);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCore(false);
      }
    })();

    // Wave 2: data needed for XP, radar, achievements
    (async () => {
      try {
        const [ps, ads, err, wg, iv, sd, rfc, rev, tr, comp] = await Promise.all([
          listProjects(),
          listAllAdocoes(),
          listErrosPersonais(),
          listWarGames(),
          listMockInterviews(),
          listSystemDesigns(),
          listRFCSessions(),
          listRevisoesCodigo(),
          listTrilhaProgresso(),
          listComparacoes(),
        ]);
        setProjects(ps);
        setAdocoes(ads);
        setErros(err);
        setWarGames(wg);
        setInterviews(iv);
        setSystemDesigns(sd);
        setRfcs(rfc);
        setRevisoes(rev);
        setTrilha(tr);
        setComparacoes(comp);

      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFull(false);
      }
    })();
  }, [signedIn]);

  // Persist sidebar progress once both loading waves complete
  useEffect(() => {
    if (loadingCore || loadingFull) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const xpData = { cardProgresso, warGames, interviews, systemDesigns, sprints, retrospectivas, dividas, revisoes, rfcs, erros, adocoes, comparacoes };
      const currentXP = computeXP(xpData);
      const lvl = getLevel(currentXP);
      const stk = computeStreak(cardProgresso);
      localStorage.setItem("brain.sidebarProgress", JSON.stringify({
        level: lvl.level,
        levelTitle: lvl.title,
        levelEmoji: lvl.emoji,
        streak: stk,
        xpPercent: getLevelProgress(currentXP),
        pendingDividas: dividas.filter((d) => d.status === "pendente").length,
        cardDoneToday: cardProgresso.some((p) => p.data === today && p.completado),
        updatedAt: Date.now(),
      }));

      if (user) {
        const rAxes = computeRadarAxes(trilha, allCards, interviews, sprints, warGames, rfcs);
        const topAxis = [...rAxes].sort((a,b) => b.value - a.value)[0];
        syncPublicProfile({
          userId: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "Usuário",
          photoURL: user.photoURL || undefined,
          totalXP: currentXP,
          level: lvl.level,
          levelTitle: lvl.title,
          topSkill: topAxis && topAxis.value > 0 ? topAxis.label : undefined,
          updatedAt: Date.now(),
        }).catch(console.error);
      }
    } catch {}
  }, [loadingCore, loadingFull, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed values ──────────────────────────────────────────
  const allData = {
    cardProgresso,
    warGames,
    interviews,
    systemDesigns,
    sprints,
    retrospectivas,
    dividas,
    revisoes,
    rfcs,
    erros,
    adocoes,
    comparacoes,
  };

  const totalXP = computeXP(allData);
  const xpToday = computeXPToday(allData);
  const level = getLevel(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const xpPercent = getLevelProgress(totalXP);
  const streak = computeStreak(cardProgresso);
  const conceitosDominados = trilha.filter((t) => t.dominado).length;
  const healthScore = computeHealthScore(adocoes, cardProgresso);
  const todayActions = getTodayActions({ cardProgresso, dividas, sprints, retrospectivas });
  const radarAxes = computeRadarAxes(trilha, allCards, interviews, sprints, warGames, rfcs);

  const lastCard = cardProgresso[0];
  const lastCardDaysAgo = lastCard
    ? Math.floor((Date.now() - new Date(lastCard.data).getTime()) / 86400000)
    : null;

  const agentSlugs = new Set(allCards.filter((c) => c.category === "agentes-ia").map((c) => c.slug));
  const agentCardsCompleted = trilha.filter((t) => t.dominado && agentSlugs.has(t.cardSlug)).length;

  const achievementData: AchievementData = {
    cardsCompleted: cardProgresso.filter((p) => p.completado).length,
    streak,
    warGames: warGames.length,
    interviews: interviews.filter((i) => i.status === "concluido").length,
    systemDesigns: systemDesigns.filter((s) => s.status === "avaliado").length,
    sprintsSemIA: sprints.filter((s) => s.status === "concluido").length,
    dividasRegistradas: dividas.length,
    dividasPagas: dividas.filter((d) => d.status === "paga").length,
    errosRegistrados: erros.length,
    conceitosDominados,
    rfcsRevisados: rfcs.filter((r) => r.status === "revisado").length,
    agentCardsCompleted,
  };

  const earnedAchievements = ACHIEVEMENTS.filter((a) => a.condition(achievementData));

  // ── Work mode gamification ───────────────────────────────────
  const workData = { revisoes, comparacoes, erros, adocoes, dividas };
  const workXP = computeWorkXP(workData);
  const workXPToday = computeWorkXPToday(workData);
  const workStreak = computeWorkStreak({ revisoes, comparacoes, erros, adocoes });
  const workGoalPct = Math.min(100, Math.round((workXPToday / WORK_XP_DAILY_GOAL) * 100));
  const workGoalMet = workXPToday >= WORK_XP_DAILY_GOAL;

  const revisoeAvaliadas = revisoes.filter((r) => r.status === "avaliado").length;
  const workAchievements = [
    { id: "revisor",   icon: ClipboardCheck, title: "Revisor",    color: "sky",     current: revisoeAvaliadas,  total: 5,  label: "revisão"   },
    { id: "arquiteto", icon: Scale,          title: "Arquiteto",  color: "violet",  current: comparacoes.length, total: 5, label: "comparação" },
    { id: "honesto",   icon: AlertCircle,    title: "Honesto",    color: "amber",   current: dividas.length,    total: 10, label: "dívida"    },
    { id: "detetive",  icon: Bug,            title: "Detetive",   color: "red",     current: erros.length,      total: 5,  label: "erro"      },
    { id: "padroes",   icon: Shield,         title: "Padrões",    color: "emerald", current: adocoes.length,    total: 10, label: "adoção"    },
  ] as const;

  const healthColor =
    healthScore >= 80 ? "text-emerald-500" :
    healthScore >= 50 ? "text-amber-500" :
    "text-red-500";

  const levelColor =
    level.color === "amber"   ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400" :
    level.color === "emerald" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
    level.color === "sky"     ? "bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400" :
    level.color === "violet"  ? "bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-400" :
    level.color === "rose"    ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400" :
    "bg-card-hover border-line text-muted";

  // ── Feature sections ─────────────────────────────────────────
  const featureSections: FeatureSection[] = [
    {
      title: "Aprender",
      links: [
        { href: "/card-do-dia",    label: "Card do Dia",          icon: CalendarDays, hot: streak >= 3 },
        { href: "/trilha",         label: "Trilha de Senioridade", icon: TrendingUp },
        { href: "/retrospectiva",  label: "Retrospectiva Semanal", icon: BookMarked },
        { href: "/mapa-dominio",   label: "Mapa de Domínio",       icon: Map },
        { href: "/divida",         label: "Dívidas de Conhecimento", icon: BookOpen, isNew: dividas.length === 0 },
      ],
    },
    {
      title: "Treinar",
      links: [
        { href: "/revisor",        label: "Revisor de Código",      icon: ClipboardCheck, isNew: revisoes.length === 0 },
        { href: "/anti-pattern",   label: "Caçador de Anti-Padrões", icon: Bug, isNew: true },
        { href: "/interrogatorio", label: "Interrogatório Técnico",  icon: Brain },
        { href: "/sprint-sem-ia",  label: "Sprint sem IA",           icon: FlaskConical, hot: sprints.some((s) => s.status === "em-andamento") },
        { href: "/mentoria",       label: "Mentoria Sênior",         icon: Users, isNew: true },
      ],
    },
    {
      title: "Desafios",
      links: [
        { href: "/war-game",      label: "War Game",               icon: Swords, hot: true },
        { href: "/system-design", label: "System Design",          icon: Layers },
        { href: "/sessao",        label: "Sessão com IA",          icon: Zap, isNew: warGames.length === 0 && systemDesigns.length === 0 },
        { href: "/comparar",      label: "Comparar Arquiteturas",  icon: Scale, isNew: true },
        { href: "/erros-pessoais", label: "Erros Pessoais",        icon: Shield, isNew: erros.length === 0 },
      ],
    },
    {
      title: "Entrevista",
      links: [
        { href: "/mock-interview", label: "Mock Interview",       icon: Mic, hot: interviews.length === 0 },
        { href: "/rfc",            label: "Escrita de RFC",        icon: FileText, isNew: rfcs.length === 0 },
        { href: "/banco-star",     label: "Banco de Experiências STAR", icon: Star, isNew: true },
        { href: "/analytics",      label: "Analytics",            icon: BarChart3 },
        { href: "/health-score",   label: "Health Score",         icon: Target },
      ],
    },
    {
      title: "Agentes de IA",
      links: [
        { href: "/biblioteca?category=agentes-ia", label: "Biblioteca — Agentes IA", icon: Bot, isNew: agentCardsCompleted === 0 },
        { href: "/card-do-dia",    label: "Estudar LangGraph",           icon: GitBranch },
        { href: "/system-design",  label: "System Design de Agente",     icon: Layers },
        { href: "/interrogatorio", label: "Interrogatório sobre IA",     icon: MessageSquareMore },
        { href: "/rfc-writing",    label: "RFC de Sistema com Agente",   icon: FileText },
      ],
    },
  ];

  const recentProjects = projects.slice(0, 5);

  const [mode, setMode] = useState<"trabalho" | "estudo">("estudo");
  useEffect(() => {
    const saved = localStorage.getItem("brain.mode") as "trabalho" | "estudo" | null;
    if (saved === "trabalho" || saved === "estudo") setMode(saved);
  }, []);
  function switchMode(m: "trabalho" | "estudo") {
    setMode(m);
    localStorage.setItem("brain.mode", m);
  }

  const [activeProject, setActiveProjectState] = useState<ActiveProjectContext | null>(null);
  useEffect(() => { setActiveProjectState(getActiveProject()); }, []);
  function selectProject(p: ActiveProjectContext) {
    setActiveProjectState(p);
    setActiveProject(p);
  }
  function clearProject() {
    setActiveProjectState(null);
    setActiveProject(null);
  }

  const pendingDividas = dividas.filter((d) => d.status === "pendente");

  const WORK_ACTIONS = [
    { href: "/sessao",         label: "Sessão com IA",         desc: "Pergunta livre, brainstorm, dúvida técnica",  icon: Zap,            color: "amber"   },
    { href: "/revisor",        label: "Revisor de Código",     desc: "Cole código, receba feedback técnico",         icon: ClipboardCheck, color: "sky"     },
    { href: "/comparar",       label: "Comparar Arquiteturas", desc: "A vs B — qual usar neste contexto",            icon: Scale,          color: "violet"  },
    { href: "/interrogatorio", label: "Interrogatório",        desc: "Teste seu entendimento antes de decidir",      icon: Brain,          color: "emerald" },
    { href: "/mentoria",       label: "Mentoria Sênior",       desc: "Dúvida de carreira ou decisão técnica",        icon: Users,          color: "rose"    },
    { href: "/divida",         label: "Registrar Dívida",      desc: "Usou algo que não entende de verdade? Anota",  icon: AlertCircle,    color: "red"     },
    { href: "/fim-do-dia",    label: "Fim do Dia",            desc: "Capture dívidas e erros de hoje em 5 min",     icon: Moon,           color: "sky"     },
  ] as const;

  const workIconColor: Record<string, string> = {
    amber:   "text-amber-500",
    sky:     "text-sky-500",
    violet:  "text-violet-500",
    emerald: "text-emerald-500",
    rose:    "text-rose-500",
    red:     "text-red-500",
  };

  return (
    <div className="space-y-6">
      <SignedOutBanner />

      {/* ── Mode Toggle ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-line w-fit">
        <button
          onClick={() => switchMode("trabalho")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
            mode === "trabalho"
              ? "bg-card-hover text-fg border border-line-strong shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <Briefcase className="w-4 h-4" />
          Estou trabalhando
        </button>
        <button
          onClick={() => switchMode("estudo")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
            mode === "estudo"
              ? "bg-card-hover text-fg border border-line-strong shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          <GraduationCap className="w-4 h-4" />
          Quero estudar
        </button>
      </div>

      {mode === "trabalho" ? (
        /* ═══════════════════════════════════════════════════════════
           MODO TRABALHO
           ═══════════════════════════════════════════════════════════ */
        <div className="space-y-6">

          {/* ── Work XP Strip ── */}
          {loadingFull ? (
            <div className="h-24 rounded-2xl bg-card border border-line animate-pulse" />
          ) : (
            <div className={clsx(
              "rounded-2xl p-5 space-y-4 relative overflow-hidden transition-all duration-500",
              workGoalMet 
                ? "border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-card shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
                : "border border-line bg-card"
            )}>
              {workGoalMet && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />
              )}
              <div className="flex items-center justify-between gap-4 flex-wrap relative z-10">
                {/* Left: daily goal */}
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-500",
                    workGoalMet ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md" : "bg-card-hover border border-line",
                  )}>
                    <Wrench className={clsx("w-4 h-4", workGoalMet ? "text-zinc-950" : "text-muted")} />
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider font-semibold">Meta do dia</p>
                    <p className={clsx(
                      "text-sm font-bold mt-0.5",
                      workGoalMet ? "text-amber-500 dark:text-amber-400" : "text-fg"
                    )}>
                      {workGoalMet
                        ? "Meta atingida!"
                        : `${workXPToday} / ${WORK_XP_DAILY_GOAL} XP`}
                      {workXPToday > 0 && !workGoalMet && (
                        <span className="text-emerald-500 font-medium ml-2 text-xs">+{workXPToday} hoje</span>
                      )}
                    </p>
                  </div>
                </div>
                {/* Right: streak + total */}
                <div className="flex items-center gap-6 text-right">
                  {workStreak > 0 && (
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-0.5">Streak</p>
                      <p className="text-sm font-bold flex items-center gap-1.5 justify-end text-fg">
                        <Flame className="w-4 h-4 text-amber-500" />
                        {workStreak} dias
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-0.5">XP Total</p>
                    <p className="text-sm font-bold text-fg flex items-center gap-1.5 justify-end">
                      <Zap className="w-3.5 h-3.5 text-sky-500" />
                      {workXP}
                    </p>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2.5 rounded-full bg-card-hover overflow-hidden relative z-10 border border-line">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-1000",
                    workGoalMet ? "bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-amber-500/60",
                  )}
                  style={{ width: `${workGoalPct}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Work Achievements ── */}
          {loadingFull ? (
            <div className="grid grid-cols-5 gap-2">
              {[0,1,2,3,4].map((i) => <div key={i} className="h-20 rounded-xl bg-card border border-line animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {workAchievements.map((ach) => {
                const pct = Math.min(100, Math.round((ach.current / ach.total) * 100));
                const done = ach.current >= ach.total;
                const Icon = ach.icon;
                const iconColor =
                  ach.color === "sky"     ? "text-sky-500" :
                  ach.color === "violet"  ? "text-violet-500" :
                  ach.color === "amber"   ? "text-amber-500" :
                  ach.color === "red"     ? "text-red-500" :
                  "text-emerald-500";
                return (
                  <div
                    key={ach.id}
                    className={clsx(
                      "flex flex-col gap-2 p-3 rounded-xl border transition",
                      done ? "border-amber-500/40 bg-amber-500/5" : "border-line bg-card",
                    )}
                    title={`${ach.current}/${ach.total} ${ach.label}${ach.current !== 1 ? "s" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={clsx("w-4 h-4", done ? "text-amber-500" : iconColor)} />
                      {done && <CheckCircle2 className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-[11px] font-medium text-fg leading-tight">{ach.title}</p>
                    <div className="space-y-1">
                      <div className="h-1 rounded-full bg-card-hover overflow-hidden">
                        <div
                          className={clsx("h-full rounded-full transition-all", done ? "bg-amber-500" : "bg-amber-500/50")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted">{ach.current}/{ach.total}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dívidas pendentes — aviso urgente */}
          {!loading && pendingDividas.length > 0 && (
            <a
              href="/divida"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition group"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fg">
                  {pendingDividas.length} dívida{pendingDividas.length > 1 ? "s" : ""} de conhecimento pendente{pendingDividas.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-muted">Coisas que você usou sem entender de verdade</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition" />
            </a>
          )}

          {/* Ações rápidas */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WORK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.href}
                    href={action.href}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-line bg-card hover:border-line-strong hover:bg-card-hover transition group"
                  >
                    <Icon className={clsx("w-5 h-5", workIconColor[action.color])} />
                    <div>
                      <p className="text-sm font-semibold text-fg leading-tight">{action.label}</p>
                      <p className="text-xs text-muted mt-0.5 leading-snug">{action.desc}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {/* Projeto ativo */}
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-muted" />
                  Contexto de trabalho
                </h3>
                <div className="flex items-center gap-2">
                  {activeProject && (
                    <button onClick={clearProject} className="text-xs text-muted hover:text-fg transition">
                      limpar
                    </button>
                  )}
                  <a href="/projetos" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
                    gerenciar →
                  </a>
                </div>
              </div>
              <p className="text-xs text-muted mb-3">
                Clique no projeto que está trabalhando agora — Sessão e Card do Dia vão usar esse contexto.
              </p>
              {recentProjects.length > 0 ? (
                <div className="space-y-1">
                  {recentProjects.map((p) => {
                    const isActive = activeProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectProject({ id: p.id, nome: p.nome, stack: p.stack, tipo: p.tipo })}
                        className={clsx(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left group",
                          isActive
                            ? "bg-amber-500/10 border border-amber-500/30"
                            : "hover:bg-card-hover border border-transparent",
                        )}
                      >
                        <span className={clsx("w-2 h-2 rounded-full shrink-0", isActive ? "bg-amber-500" : "bg-muted/40")} />
                        <span className={clsx("text-sm flex-1", isActive ? "text-fg font-medium" : "text-muted")}>{p.nome}</span>
                        {p.stack.length > 0 && (
                          <span className="text-[10px] text-muted hidden group-hover:inline">{p.stack.slice(0, 3).join(", ")}</span>
                        )}
                        {isActive && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">ativo</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-muted mb-3">Nenhum projeto ainda</p>
                  <a
                    href="/projetos/novo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-card-hover hover:bg-line text-fg border border-line-strong transition"
                  >
                    + Criar projeto
                  </a>
                </div>
              )}
            </Card>
          )}

          {/* Referência rápida */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted" />
                Referência rápida
              </h3>
              <a href="/biblioteca" className="text-xs text-amber-600 dark:text-amber-400 hover:underline">
                explorar →
              </a>
            </div>
            <div className="space-y-1.5">
              {[
                { href: "/biblioteca/auth-architecture",   label: "Auth Architecture" },
                { href: "/biblioteca/audit-api-endpoint",  label: "Checklist de endpoint IA" },
                { href: "/biblioteca/multi-tenant-strategies", label: "Multi-tenant strategies" },
                { href: "/biblioteca/modular-monolith",    label: "Modular Monolith" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-muted hover:text-amber-600 dark:hover:text-amber-300 transition group"
                >
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100 transition" />
                  {item.label}
                </a>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════
           MODO ESTUDO
           ═══════════════════════════════════════════════════════════ */
        <div className="space-y-6">

      {/* ── Hoje — Smart recommendations ──────────────────────── */}
      {loadingCore ? (
        <Skeleton className="h-32" />
      ) : (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            Hoje
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {todayActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className={clsx(
                    "flex flex-col gap-2.5 p-4 rounded-xl border transition hover:border-line-strong group",
                    urgencyBorder[action.urgency],
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Icon className={clsx("w-4 h-4 shrink-0 mt-0.5", actionIconColor[action.color])} />
                    <ChevronRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg leading-tight">{action.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hero / Level section ─────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-36" />
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted">Bem-vindo de volta</p>
              <h1 className="text-2xl font-semibold mt-0.5 text-fg">brain</h1>
              <p className="text-xs text-muted mt-1">
                Sua jornada de mid-level a sênior engineer
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <div className={clsx(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border",
                levelColor,
              )}>
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span className="text-sm font-semibold">{level.emoji} Nível {level.level}</span>
                <span className="text-sm">{level.title}</span>
              </div>
              {xpToday > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  +{xpToday} XP hoje
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>{totalXP} XP total</span>
              {level.level < 6 ? (
                <span>{nextLevel.min - totalXP} XP para {nextLevel.title}</span>
              ) : (
                <span>Nível máximo alcançado</span>
              )}
            </div>
            <div className="h-2 rounded-full bg-card-hover overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 4 Metric cards ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Streak */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs uppercase text-muted font-medium">Streak</span>
            </div>
            <p className="text-2xl font-bold text-fg">{streak} <span className="text-base font-normal text-muted">dias</span></p>
            <p className="text-xs text-muted mt-1">
              {lastCardDaysAgo === 0
                ? "último card: hoje"
                : lastCardDaysAgo === 1
                ? "último card: ontem"
                : lastCardDaysAgo !== null
                ? `último card: ${lastCardDaysAgo}d atrás`
                : "nenhum card ainda"}
            </p>
          </Card>

          {/* Health Score */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-muted shrink-0" />
              <span className="text-xs uppercase text-muted font-medium">Health</span>
            </div>
            <p className={clsx("text-2xl font-bold", healthColor)}>
              {healthScore}
              <span className="text-base font-normal text-muted">%</span>
            </p>
            <p className="text-xs text-muted mt-1">
              {healthScore >= 80 ? "excelente" : healthScore >= 50 ? "bom, pode melhorar" : "precisa de atenção"}
            </p>
          </Card>

          {/* Trilha */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted shrink-0" />
              <span className="text-xs uppercase text-muted font-medium">Trilha</span>
            </div>
            <p className="text-2xl font-bold text-fg">
              {conceitosDominados}
              <span className="text-base font-normal text-muted">/65</span>
            </p>
            <div className="mt-1.5 h-1.5 rounded-full bg-card-hover overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, (conceitosDominados / 65) * 100)}%` }}
              />
            </div>
          </Card>

          {/* XP Hoje */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-muted shrink-0" />
              <span className="text-xs uppercase text-muted font-medium">XP Hoje</span>
            </div>
            <p className="text-2xl font-bold text-fg">
              {xpToday > 0 ? "+" : ""}{xpToday}
              <span className="text-base font-normal text-muted"> XP</span>
            </p>
            <p className="text-xs text-muted mt-1">
              {xpToday === 0 ? "nenhuma atividade hoje" : "ótimo trabalho hoje"}
            </p>
          </Card>
        </div>
      )}

      {/* ── Radar de Habilidades ─────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-80" />
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-fg flex items-center gap-2">
                Evolução de Especialidades
              </h2>
              <p className="text-sm text-muted">Complete cards, sprints e entrevistas para subir de rank em cada área.</p>
            </div>
            <Link href="/mapa-dominio" className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">
              ver mapa completo →
            </Link>
          </div>
          
          <Card className="flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 relative overflow-hidden">
            {/* Background glowing effect */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Chart */}
            <div className="w-[300px] h-[300px] shrink-0 mx-auto relative z-10">
              <RadarChart axes={radarAxes} size={300} />
            </div>
            
            {/* Legend / Mastery levels */}
            <div className="flex-1 grid grid-cols-2 gap-3 w-full relative z-10">
              {radarAxes.map((axis) => {
                const isDiamond = axis.value >= 80;
                const isGold = axis.value >= 50 && axis.value < 80;
                const isSilver = axis.value >= 20 && axis.value < 50;
                
                const mastery = isDiamond ? "Mestre" : isGold ? "Avançado" : isSilver ? "Intermediário" : "Iniciante";
                const masteryColor = isDiamond ? "text-cyan-500 dark:text-cyan-400" : isGold ? "text-amber-500 dark:text-amber-400" : isSilver ? "text-zinc-500 dark:text-zinc-300" : "text-amber-900/40 dark:text-amber-900/60";
                
                return (
                  <div key={axis.label} className="flex flex-col gap-1.5 p-3 rounded-xl bg-card border border-line shadow-sm hover:border-amber-500/30 transition group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-fg flex items-center gap-1.5 group-hover:text-amber-500 transition">
                          <span className="opacity-80">{axis.emoji}</span> {axis.label}
                        </p>
                        <p className={clsx("text-[10px] font-bold uppercase tracking-wider mt-0.5", masteryColor)}>
                          {mastery}
                        </p>
                      </div>
                      <span className={clsx(
                        "text-sm font-bold",
                        isDiamond ? "text-cyan-500 dark:text-cyan-400" :
                        isGold ? "text-amber-500" :
                        isSilver ? "text-fg" :
                        "text-muted"
                      )}>{axis.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-card-hover overflow-hidden mt-1">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-1000",
                          isDiamond ? "bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" :
                          isGold ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" :
                          isSilver ? "bg-zinc-400 dark:bg-zinc-300" :
                          "bg-amber-900/20 dark:bg-amber-900/40"
                        )}
                        style={{ width: `${Math.max(2, axis.value)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Conquistas ─────────────────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-40" />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Conquistas</h2>
            <span className="text-xs text-muted">
              {earnedAchievements.length} de {ACHIEVEMENTS.length} desbloqueadas
            </span>
          </div>
          <Card>
            <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-5 xl:grid-cols-8 gap-2">
              {ACHIEVEMENTS.map((achievement) => {
                const earned = achievement.condition(achievementData);
                return (
                  <div
                    key={achievement.id}
                    title={earned ? achievement.desc : `Bloqueado — ${achievement.desc}`}
                    className={clsx(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition cursor-default select-none",
                      earned
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-line bg-card opacity-40 grayscale",
                    )}
                  >
                    <span className="text-2xl leading-none">{achievement.icon}</span>
                    <span className="text-[10px] font-medium text-center leading-tight text-fg">
                      {achievement.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Feature grid ─────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureSections.map((section) => (
            <Card key={section.title} className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-card-hover transition group"
                    >
                      <Icon className="w-4 h-4 text-muted shrink-0 group-hover:text-amber-500 transition" />
                      <span className="text-sm flex-1 text-fg">{link.label}</span>
                      {link.isNew && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 font-semibold shrink-0">
                          NOVO
                        </span>
                      )}
                      {link.hot && !link.isNew && (
                        <Flame className="w-3 h-3 text-amber-500 opacity-60 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Bottom: Projects + library ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projects */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <GitFork className="w-4 h-4 text-muted" />
              Projetos
            </h3>
            <Link
              href="/projetos"
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              ver todos →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-6" />)}
            </div>
          ) : recentProjects.length > 0 ? (
            <ul className="space-y-1.5">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projetos/${p.id}`}
                    className="text-sm text-muted hover:text-amber-600 dark:hover:text-amber-300 transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0" />
                    {p.nome}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted mb-3">Nenhum projeto ainda</p>
              <Link
                href="/projetos/novo"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-card-hover hover:bg-line text-fg border border-line-strong transition"
              >
                + Criar projeto
              </Link>
            </div>
          )}
        </Card>

        {/* Library quick access */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted" />
              Biblioteca
            </h3>
            <Link
              href="/biblioteca"
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              explorar →
            </Link>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted mb-2">{totalCards} cards de conhecimento sênior</p>
            {[
              { href: "/biblioteca/modular-monolith", label: "Modular Monolith" },
              { href: "/biblioteca/auth-architecture", label: "Auth Architecture" },
              { href: "/biblioteca/audit-api-endpoint", label: "Checklist de endpoint IA" },
              { href: "/biblioteca/multi-tenant-strategies", label: "Multi-tenant strategies" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 text-sm text-muted hover:text-amber-600 dark:hover:text-amber-300 transition group"
              >
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100 transition" />
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
        </div>
      )}
    </div>
  );
}
