"use client";

import Link from "next/link";
import { clsx } from "clsx";
import {
  ShieldCheck, Swords, GitBranch, FileText, FlaskConical,
  MessageSquareMore, Sparkles, Scale, BookOpen, Mic, Star,
  AlertCircle, Zap, Activity, BookMarked, Moon, Map, Eye,
  Compass, Bug,
} from "lucide-react";

interface Tool {
  href: string;
  label: string;
  icon: React.ElementType;
  when: string;
  notWhen?: string;
  tip?: string;
}

interface Group {
  intent: string;
  description: string;
  color: string;
  tools: Tool[];
}

const GROUPS: Group[] = [
  {
    intent: "Estou codando agora",
    description: "Uso direto no fluxo de trabalho — abre, faz, fecha.",
    color: "border-violet-500/40 bg-violet-500/5",
    tools: [
      {
        href: "/debug",
        icon: Bug,
        label: "Debug Assistido",
        when: "Travou num erro e precisa de diagnóstico de causa raiz + fix acionável",
        tip: "Cole stack trace para diagnóstico mais preciso",
      },
      {
        href: "/sentinela",
        icon: ShieldCheck,
        label: "Sentinela",
        when: "Revisar código gerado por IA antes de aceitar",
        notWhen: "Seu próprio código com padrões do projeto → use Revisor",
        tip: "⌘⇧A cola direto do clipboard",
      },
      {
        href: "/revisor",
        icon: Eye,
        label: "Revisor",
        when: "Code review com os padrões do seu projeto ativo",
        notWhen: "Revisão genérica de código desconhecido",
      },
      {
        href: "/sprint-sem-ia",
        icon: FlaskConical,
        label: "Sprint sem IA",
        when: "Praticar implementar sem autocomplete — solidificar o que você já sabe",
        notWhen: "Trabalho com prazo real",
      },
      {
        href: "/refatoracao",
        icon: Sparkles,
        label: "Refatoração Guiada",
        when: "Refatorar código com feedback iterativo de um sênior",
      },
    ],
  },
  {
    intent: "Preciso tomar uma decisão técnica",
    description: "Decisões de arquitetura, tecnologia ou resposta sob pressão.",
    color: "border-amber-500/40 bg-amber-500/5",
    tools: [
      {
        href: "/comparar",
        icon: Scale,
        label: "Comparar",
        when: "Decidir entre duas ou mais abordagens/tecnologias com critérios objetivos",
      },
      {
        href: "/decisoes",
        icon: FileText,
        label: "Decision Journal",
        when: "Registrar uma decisão importante (ADR) para não esquecer o contexto depois",
      },
      {
        href: "/rfc-writing",
        icon: FileText,
        label: "RFC Writing",
        when: "Propor uma mudança de arquitetura e convencer o time por escrito",
      },
      {
        href: "/war-game",
        icon: Swords,
        label: "War Game",
        when: "Treinar tomada de decisão sob pressão e ambiguidade — simula incidente real",
      },
      {
        href: "/system-design",
        icon: GitBranch,
        label: "System Design",
        when: "Projetar um sistema do zero, documentar trade-offs e decisões",
      },
    ],
  },
  {
    intent: "Quero aprender algo específico",
    description: "Estudo ativo com conteúdo curado e progressão.",
    color: "border-sky-500/40 bg-sky-500/5",
    tools: [
      {
        href: "/biblioteca",
        icon: BookOpen,
        label: "Biblioteca",
        when: "Pesquisar um padrão, arquitetura ou conceito específico",
        tip: "Busca por título, tag ou stack",
      },
      {
        href: "/mentoria",
        icon: Zap,
        label: "Mentoria",
        when: "Entender um conceito técnico com exemplos e analogias — modo conversacional",
      },
      {
        href: "/interrogatorio",
        icon: MessageSquareMore,
        label: "Interrogatório Socrático",
        when: "Aprofundar entendimento de algo que você acha que já sabe",
        notWhen: "Aprender algo do zero — comece pela Biblioteca ou Mentoria",
      },
      {
        href: "/card-do-dia",
        icon: BookMarked,
        label: "Card do Dia",
        when: "Revisão rápida de um conceito com quiz — 10 minutos de estudo ativo",
      },
      {
        href: "/gerar-card",
        icon: Sparkles,
        label: "Gerar Card",
        when: "Criar um knowledge card de um padrão novo que você quer documentar",
      },
    ],
  },
  {
    intent: "Quero me preparar para entrevista",
    description: "Simulação, prática e preparação de histórias.",
    color: "border-emerald-500/40 bg-emerald-500/5",
    tools: [
      {
        href: "/mock-interview",
        icon: Mic,
        label: "Mock Interview",
        when: "Simular entrevista técnica completa com feedback de um sênior",
      },
      {
        href: "/banco-star",
        icon: Star,
        label: "Banco STAR",
        when: "Preparar e organizar histórias de situações reais para entrevista comportamental",
      },
      {
        href: "/anti-pattern",
        icon: AlertCircle,
        label: "Anti-Pattern Challenge",
        when: "Praticar identificar problemas em código — cai em live coding",
      },
      {
        href: "/jobs",
        icon: Compass,
        label: "Trilhas de Carreira",
        when: "Seguir um roadmap estruturado de pleno → sênior → staff com marcos claros",
      },
    ],
  },
  {
    intent: "Quero treinar raciocínio e fundamentos",
    description: "Exercícios práticos para solidificar base técnica.",
    color: "border-fuchsia-500/40 bg-fuchsia-500/5",
    tools: [
      {
        href: "/math-quest",
        icon: Activity,
        label: "Math Quest",
        when: "Praticar matemática com exercícios adaptativos (prob, álgebra linear, cálculo)",
      },
      {
        href: "/matematica",
        icon: Activity,
        label: "Grade Matemática",
        when: "Acompanhar seu progresso no currículo completo de bacharelado",
      },
      {
        href: "/debate",
        icon: MessageSquareMore,
        label: "Debate Técnico",
        when: "Defender uma posição técnica e ser questionado — treina argumentação",
      },
      {
        href: "/architecture-audit",
        icon: GitBranch,
        label: "Architecture Audit",
        when: "Auditar uma arquitetura existente com framework estruturado",
      },
    ],
  },
  {
    intent: "Quero refletir sobre meu trabalho",
    description: "Visibilidade do progresso e pontos cegos.",
    color: "border-zinc-500/40 bg-zinc-500/5",
    tools: [
      {
        href: "/sessao",
        icon: Zap,
        label: "Sessão IA",
        when: "Planejar e registrar o que você fez numa sessão de trabalho com IA",
      },
      {
        href: "/retrospectiva",
        icon: BookMarked,
        label: "Retrospectiva",
        when: "Fazer retrospectiva de sprint ou semana com framework estruturado",
      },
      {
        href: "/fim-do-dia",
        icon: Moon,
        label: "Fim do Dia",
        when: "Registrar o que entregou e o que aprendeu hoje",
      },
      {
        href: "/divida",
        icon: AlertCircle,
        label: "Dívida de Conhecimento",
        when: "Visualizar gaps de conhecimento que estão te travando",
      },
      {
        href: "/health-score",
        icon: Activity,
        label: "Health Score",
        when: "Avaliar saúde técnica do seu projeto ou da sua prática",
      },
      {
        href: "/mapa-dominio",
        icon: Map,
        label: "Mapa de Domínio",
        when: "Mapear visualmente o domínio de negócio que você está construindo",
      },
    ],
  },
];

export default function QuandoUsarPage() {
  return (
    <div className="max-w-4xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold flex items-center gap-3">
          <Compass className="w-7 h-7 text-amber-500" />
          O que usar quando?
        </h1>
        <p className="text-muted text-sm max-w-2xl">
          Organize por intenção — comece pelo que você está tentando fazer, não pelo nome da ferramenta.
        </p>
      </header>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <section key={group.intent} className="space-y-3">
            <div className={clsx("rounded-xl border p-4 space-y-1", group.color)}>
              <h2 className="text-base font-bold">{group.intent}</h2>
              <p className="text-xs text-muted">{group.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-start gap-3 p-4 rounded-xl border border-line bg-card hover:border-line-strong hover:bg-card-hover transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-card-hover border border-line flex items-center justify-center shrink-0 group-hover:border-line-strong transition">
                    <tool.icon className="w-4 h-4 text-muted group-hover:text-fg transition" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold">{tool.label}</p>
                    <p className="text-xs text-muted leading-relaxed">{tool.when}</p>
                    {tool.notWhen && (
                      <p className="text-[11px] text-amber-500/80">
                        Não use se: {tool.notWhen}
                      </p>
                    )}
                    {tool.tip && (
                      <p className="text-[11px] text-violet-400">
                        ✦ {tool.tip}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
