import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cwd = process.cwd();

    // 1. Linhas não commitadas (untracked/modified)
    let addedLines = 0;
    let changedFiles = 0;
    try {
      const { stdout: diffStat } = await execAsync("git diff HEAD --shortstat", { cwd });
      // ex: " 3 files changed, 150 insertions(+), 20 deletions(-)"
      if (diffStat) {
        const filesMatch = diffStat.match(/(\d+)\s+file/);
        const insertionsMatch = diffStat.match(/(\d+)\s+insertion/);
        if (filesMatch) changedFiles = parseInt(filesMatch[1], 10);
        if (insertionsMatch) addedLines = parseInt(insertionsMatch[1], 10);
      }
    } catch (e) {
      console.error("Erro ao rodar git diff", e);
    }

    // 2. Linhas commitadas hoje (midnight)
    let commitsToday = 0;
    try {
      const { stdout: logStat } = await execAsync("git log --since=midnight --oneline", { cwd });
      if (logStat) {
        commitsToday = logStat.trim().split("\n").filter(Boolean).length;
      }
    } catch (e) {
      console.error("Erro ao rodar git log", e);
    }

    // 3. TSC Errors (em background, mas aqui aguardaremos com timeout para não travar muito)
    // Para npx tsc --noEmit, pode demorar alguns segundos.
    let tsErrors = 0;
    try {
      await Promise.race([
        execAsync("npx tsc --noEmit", { cwd }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TSC Timeout")), 10000))
      ]);
    } catch (e: any) {
      if (e.stdout) {
        // Tsc falha exibindo erros no stdout
        const errorMatches = e.stdout.match(/error TS/g);
        if (errorMatches) {
          tsErrors = errorMatches.length;
        }
      }
    }

    // 4. ESLint Errors
    let lintErrors = 0;
    try {
      await Promise.race([
        execAsync("npx eslint . --ext .ts,.tsx --max-warnings=0", { cwd }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("ESLint Timeout")), 10000))
      ]);
    } catch (e: any) {
      if (e.stdout) {
        const problemMatches = e.stdout.match(/(\d+) problem/);
        if (problemMatches) {
          lintErrors = parseInt(problemMatches[1], 10);
        }
      }
    }

    return NextResponse.json({
      addedLines,
      changedFiles,
      commitsToday,
      tsErrors,
      lintErrors,
      untested: 0, // Placeholder, implementação complexa de cobertura
    });
  } catch (error) {
    console.error("Damage Meter API Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
