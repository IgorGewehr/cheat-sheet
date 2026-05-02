import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cwd = process.cwd();

    // 1. Obter git log stat desde a meia-noite
    let gitLog = "";
    try {
      const { stdout } = await execAsync("git log --since=midnight --stat", { cwd });
      gitLog = stdout;
    } catch (e) {
      console.error("Erro ao obter git log:", e);
      gitLog = "Sem commits hoje ou erro ao buscar log.";
    }

    // Retorna a saída pura de stats.
    // Futuro (opcional): Fazer uma chamada para gpt-4o-mini sumarizar o dia,
    // cruzando com os SentinelaSessions salvos no Firebase.
    return NextResponse.json({
      messDoDia: gitLog,
      // resumoIA: "..." // Chamada opcional futura gpt-4o-mini
    });
  } catch (error) {
    console.error("Mess do dia API Error:", error);
    return NextResponse.json({ error: "Failed to fetch mess do dia stats" }, { status: 500 });
  }
}
