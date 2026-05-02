import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { QuickCapture } from "@/components/quick-capture";
import { TopNavWrapper } from "@/components/top-nav-wrapper";
import { IdleTrigger } from "@/components/idle-trigger";
import { AuditHotkey } from "@/components/audit-hotkey";
import { SquadPresenceSync } from "@/components/squad-presence-sync";

export const metadata: Metadata = {
  title: "brain — cheat sheet de engenharia",
  description: "Cheat sheet para lembrar padrões, arquiteturas e auditar código gerado por IA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "brain",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("brain.theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = saved ? saved === "dark" : prefersDark;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <AuthProvider>
          {/* Global top navigation */}
          <TopNavWrapper />

          {/* QuickCapture drawer — always available globally */}
          <QuickCapture />

          {/* Contextual sidebar (desktop only, collapses to icon strip) */}
          <SidebarWrapper />

          {/* Idle Companion floating trigger (hidden on /idle) */}
          <IdleTrigger />

          {/* Global ⌘⇧A → Sentinela with clipboard */}
          <AuditHotkey />

          {/* Squad presence heartbeat — no-op for users without squad */}
          <SquadPresenceSync />

          <main className="lg:pl-14 min-h-screen">
            <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
