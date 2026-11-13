import type { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

/** Manual refresh: GET /api/revalidate?secret=…&tag=sponsors|github */
export async function GET(request: NextRequest) {
  const secret = process.env.SPONSORS_WEBHOOK_SECRET;
  const params = request.nextUrl.searchParams;
  if (!secret || params.get("secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const tag = params.get("tag") === "github" ? "github" : "sponsors";
  revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, tag });
}
