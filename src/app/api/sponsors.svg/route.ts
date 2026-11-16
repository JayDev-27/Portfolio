import { cacheLife, cacheTag } from "next/cache";
import { getSponsors } from "@/lib/github";

/**
 * GET /api/sponsors.svg — every sponsor as a round avatar, for the GitHub profile README.
 * Avatars are inlined as data URIs because GitHub's image proxy blocks external images inside SVGs.
 * Shares the "sponsors" cache tag, so the Sponsors webhook refreshes this image instantly.
 */
async function renderSvg(): Promise<string> {
  "use cache";
  cacheTag("sponsors");
  cacheLife("hours");

  const { sponsors } = await getSponsors();
  const SIZE = 72;
  const GAP = 22;
  const LABEL = 22;
  const slots = sponsors.length + 1; // + "you?"
  const width = slots * SIZE + (slots - 1) * GAP + 8;
  const height = SIZE + LABEL + 8;

  const avatars = await Promise.all(
    sponsors.map(async (s) => {
      try {
        const res = await fetch(`https://avatars.githubusercontent.com/${encodeURIComponent(s.login)}?s=144`);
        if (!res.ok) return null;
        const type = res.headers.get("content-type") ?? "image/png";
        return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
      } catch {
        return null;
      }
    }),
  );

  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const parts: string[] = [];
  sponsors.forEach((s, i) => {
    const x = 4 + i * (SIZE + GAP);
    const cx = x + SIZE / 2;
    const cy = 4 + SIZE / 2;
    parts.push(
      `<clipPath id="c${i}"><circle cx="${cx}" cy="${cy}" r="${SIZE / 2 - 3}"/></clipPath>`,
      `<circle cx="${cx}" cy="${cy}" r="${SIZE / 2 - 1}" fill="#131010" stroke="#e0263f" stroke-width="2"/>`,
      avatars[i]
        ? `<image href="${avatars[i]}" x="${x + 3}" y="7" width="${SIZE - 6}" height="${SIZE - 6}" clip-path="url(#c${i})" preserveAspectRatio="xMidYMid slice"/>`
        : "",
      `<circle cx="${x + SIZE - 10}" cy="14" r="9" fill="#e0263f"/><text x="${x + SIZE - 10}" y="18" text-anchor="middle" font-size="11" fill="#fff" font-family="sans-serif">♥</text>`,
      `<text x="${cx}" y="${SIZE + LABEL}" text-anchor="middle" font-size="12" fill="#9a918a" font-family="ui-monospace,Menlo,monospace">${esc(s.name || s.login)}</text>`,
    );
  });
  const jx = 4 + sponsors.length * (SIZE + GAP);
  parts.push(
    `<circle cx="${jx + SIZE / 2}" cy="${4 + SIZE / 2}" r="${SIZE / 2 - 1}" fill="none" stroke="#5f5753" stroke-width="2" stroke-dasharray="5 5"/>`,
    `<text x="${jx + SIZE / 2}" y="${4 + SIZE / 2 + 9}" text-anchor="middle" font-size="28" fill="#9a918a" font-family="ui-monospace,Menlo,monospace">+</text>`,
    `<text x="${jx + SIZE / 2}" y="${SIZE + LABEL}" text-anchor="middle" font-size="12" fill="#9a918a" font-family="ui-monospace,Menlo,monospace">you?</text>`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
}

export async function GET() {
  const svg = await renderSvg();
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Short cache so GitHub's image proxy re-fetches soon after a new sponsor.
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
