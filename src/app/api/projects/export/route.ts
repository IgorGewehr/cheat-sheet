// This route is intentionally a placeholder — exports are done client-side
// via exportProjectAsArchitecture() in db.ts, called from the project page.
// This file exists to document the pattern.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    info: "Project export is performed client-side via /projetos/[id]. See exportProjectAsArchitecture() in db.ts.",
  });
}
