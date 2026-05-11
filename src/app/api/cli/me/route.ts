import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const { uid, workspaceId } = await verifyToken(req);
    return NextResponse.json({ uid, workspaceId });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
