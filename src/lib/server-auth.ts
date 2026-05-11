import { adminAuth } from "./admin";

export type AuthContext = { uid: string; workspaceId: string };

export async function verifyToken(req: Request): Promise<AuthContext> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const decoded = await adminAuth().verifyIdToken(header.slice(7));
  return { uid: decoded.uid, workspaceId: decoded.uid };
}
