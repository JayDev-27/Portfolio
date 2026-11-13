import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * GitHub Sponsors webhook. Configure it at github.com/sponsors/satiricalguru/dashboard → Webhooks
 * with this URL, content type application/json and the same secret as SPONSORS_WEBHOOK_SECRET.
 * Any sponsorship event (created, cancelled, tier change…) expires the cached sponsor list,
 * so the next visitor sees the new sponsor immediately.
 */
export async function POST(request: Request) {
  const secret = process.env.SPONSORS_WEBHOOK_SECRET;
  const body = await request.text();

  // The webhook only triggers a refetch from GitHub, so a secret is optional.
  // When SPONSORS_WEBHOOK_SECRET is set, the signature is enforced.
  if (secret) {
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ ok: false, error: "Bad signature" }, { status: 401 });
  }
  }

  const event = request.headers.get("x-github-event");
  if (event === "sponsorship" || event === "ping") {
    revalidateTag("sponsors", { expire: 0 });
  }
  return Response.json({ ok: true, event });
}
