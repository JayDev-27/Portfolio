"use client";

import { useEffect, useRef, useState } from "react";
import type { RiverRepo } from "@/lib/github";
import { profile } from "@/data/profile";

const CELL = 4;
const ROW = 34;
const AXIS = 26;
const PALETTE = ["#c9bba9", "#8fb3c9", "#a7c49a", "#d6b26e", "#b9a0d4", "#d99a8a", "#8cc9bf", "#c7a5b8", "#a8b0bd"];
// Koi facing right. W body, R patch (lane colour), K eye, T tail, F fin, H highlight.
const KOI_A = [
  "......FF.....",
  "..T..WWRRH...",
  ".TTWWWRRWWWW.",
  "TTTWWRRRWWWKW",
  ".TTWWWWWRRWW.",
  "..T..WWWWW...",
  ".....FF......",
];
const KOI_B = [
  "......FF.....",
  ".T...WWRRH...",
  "TTTWWWRRWWWW.",
  ".TTWWRRRWWWKW",
  "TTTWWWWWRRWW.",
  ".T...WWWWW...",
  ".....FF......",
];

/**
 * A year of commits as pixel streams: one lane per repository, time flows left → right,
 * the stream gets thicker in weeks I worked on it, and a pixel koi swims along each lane.
 */
export function River({ repos, start }: { repos: RiverRepo[]; start: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ name: string; count: number; week: string; x: number; y: number } | null>(null);
  const H = repos.length * ROW + AXIS;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const WEEKS = repos[0]?.weeks.length ?? 52;
    const recent = repos.reduce((b, r) => (r.lastWeek > b.lastWeek ? r : b), repos[0]);
    const peak = Math.max(1, ...repos.flatMap((r) => r.weeks));
    let W = 0;
    let cols = 0;
    let widths: number[][] = [];
    let colors = { fg: "#ede7df", faint: "#5f5753", line: "#241e1d", glow: "224 38 63" };
    const mouse = { x: -999, y: -999 };
    const kois = repos.map((_, i) => ({ t: (i * 0.37) % 1, dodge: 0 }));

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = { fg: cs.getPropertyValue("--fg").trim(), faint: cs.getPropertyValue("--faint").trim(), line: cs.getPropertyValue("--line").trim(), glow: cs.getPropertyValue("--glow").trim() };
    };
    const weekAt = (x: number) => Math.min(WEEKS - 1, Math.max(0, Math.floor((x / W) * WEEKS)));

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.getBoundingClientRect().width;
      if (W < 10) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL);
      widths = repos.map((r) =>
        Array.from({ length: cols }, (_, c) => {
          const w = (c / cols) * (WEEKS - 1);
          const i = Math.floor(w);
          let s = 0;
          let n = 0;
          for (let k = -2; k <= 2; k++) {
            const v = r.weeks[i + k];
            if (v === undefined) continue;
            const g = Math.exp(-(k * k) / 2);
            s += v * g;
            n += g;
          }
          const v = s / n;
          return v <= 0.05 ? 0 : 3 + Math.sqrt(v / peak) * (ROW - 10);
        }),
      );
    };

    const rgb = (i: number, a: number) => {
      if (repos[i].name === recent.name) return `rgb(${colors.glow} / ${a})`;
      const h = PALETTE[i % PALETTE.length];
      return `rgb(${parseInt(h.slice(1, 3), 16)} ${parseInt(h.slice(3, 5), 16)} ${parseInt(h.slice(5, 7), 16)} / ${a})`;
    };
    const snap = (v: number) => Math.round(v / CELL) * CELL;

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      const flow = reduce ? 0 : frame * 0.4;
      repos.forEach((r, i) => {
        const cy = i * ROW + ROW / 2;
        // Lane guide.
        ctx.fillStyle = colors.line;
        for (let x = 0; x < W; x += 8) ctx.fillRect(x, cy, 2, 1);
        // Stream.
        const wv = widths[i];
        for (let c = 0; c < cols; c++) {
          const w = wv[c];
          if (!w) continue;
          const x = c * CELL;
          const y0 = snap(cy - w / 2);
          const y1 = snap(cy + w / 2);
          ctx.fillStyle = rgb(i, 0.16);
          ctx.fillRect(x, y0, CELL, Math.max(CELL, y1 - y0));
          const lines = Math.max(1, Math.floor(w / 6));
          for (let k = 0; k < lines; k++) {
            const fy = (k + 0.5) / lines;
            const y = snap(y0 + (y1 - y0) * fy);
            if ((x + flow * (1 + (k % 3) * 0.25) + k * 31) % 24 < 14) {
              ctx.fillStyle = rgb(i, 0.45 + 0.5 * (1 - Math.abs(fy - 0.5) * 2));
              ctx.fillRect(x, y, CELL, CELL - 1);
            }
          }
        }
        // Koi swims along the active stretch of its lane.
        const active = wv.map((w, c) => (w > 0 ? c : -1)).filter((c) => c >= 0);
        if (active.length > 8) {
          const k = kois[i];
          k.t = (k.t + (reduce ? 0 : 0.0012 + (i % 3) * 0.0003)) % 1;
          const c = active[Math.floor(active.length * k.t)];
          const x = c * CELL;
          const d = Math.hypot(mouse.x - x, mouse.y - cy);
          k.dodge += ((d < 40 ? (cy > mouse.y ? 1 : -1) * (40 - d) * 0.35 : 0) - k.dodge) * 0.2;
          const y = cy + Math.sin(frame / 18 + i) * 1.5 + Math.max(-10, Math.min(10, k.dodge));
          const px = 3;
          const isRecent = r.name === recent.name;
          const sprite = Math.floor(frame / 10) % 2 ? KOI_A : KOI_B;
          const ox = snap(x) - 7 * px;
          const oy = Math.round(y) - 3 * px;
          // Soft shadow under the fish.
          ctx.fillStyle = "rgb(0 0 0 / 0.28)";
          ctx.fillRect(ox + 3 * px, oy + 7 * px, 8 * px, px);
          sprite.forEach((row, ry) =>
            [...row].forEach((ch, rx) => {
              if (ch === ".") return;
              ctx.fillStyle =
                ch === "W"
                  ? "#f3ece2"
                  : ch === "H"
                    ? "#ffffff"
                    : ch === "K"
                      ? "#1b1514"
                      : ch === "R"
                        ? isRecent
                          ? `rgb(${colors.glow})`
                          : rgb(i, 1)
                        : ch === "F"
                          ? "rgb(243 236 226 / 0.75)"
                          : rgb(i, 0.85);
              ctx.fillRect(ox + rx * px, oy + ry * px, px, px);
            }),
          );
        }
      });

      // Month axis.
      ctx.font = "9px ui-monospace, monospace";
      const s = new Date(start);
      const axisY = repos.length * ROW;
      ctx.fillStyle = colors.line;
      ctx.fillRect(0, axisY + 2, W, 1);
      for (let m = 1; m <= 12; m++) {
        const d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + m, 1));
        const wk = (d.getTime() - s.getTime()) / (7 * 864e5);
        if (wk >= WEEKS - 2) break;
        const x = (wk / WEEKS) * W;
        ctx.fillStyle = colors.faint;
        ctx.fillRect(x, axisY, 1, 6);
        ctx.fillText(d.toLocaleString("en", { month: "short", timeZone: "UTC" }).toUpperCase(), x + 3, axisY + 16);
      }
      ctx.fillStyle = colors.fg;
      ctx.fillText("NOW", W - 22, axisY + 16);
      raf = requestAnimationFrame(draw);
    };

    readColors();
    build();
    raf = requestAnimationFrame(draw);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const ro = new ResizeObserver(build);
    ro.observe(canvas);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      const i = Math.floor(mouse.y / ROW);
      if (i < 0 || i >= repos.length) return setHover(null);
      const w = weekAt(mouse.x);
      const d = new Date(new Date(start).getTime() + w * 7 * 864e5);
      setHover({ name: repos[i].name, count: repos[i].weeks[w], week: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), x: mouse.x, y: i * ROW });
    };
    const onLeave = () => {
      mouse.x = mouse.y = -999;
      setHover(null);
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [repos, start, H]);

  const recentName = repos.reduce((b, r) => (r.lastWeek > b.lastWeek ? r : b), repos[0])?.name;

  return (
    <div className="px-4 pb-6 sm:px-6">
      <div className="grid grid-cols-[minmax(0,8.5rem)_1fr_3rem] gap-x-3">
        <div>
          {repos.map((r) => (
            <a
              key={r.name}
              href={r.isPrivate ? undefined : `https://github.com/${profile.handle}/${r.name}`}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center truncate font-mono text-[11px] transition-colors hover:text-fg ${r.name === recentName ? "text-accent" : "text-muted"}`}
              style={{ height: ROW }}
            >
              <span className="truncate">{r.isPrivate ? "private work" : r.name}</span>
            </a>
          ))}
        </div>
        <div className="relative">
          <canvas ref={ref} className="block w-full" style={{ height: H }} role="img" aria-label="A year of commits, one lane per repository" data-cursor="none" />
          {hover && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-line-2 bg-panel px-2 py-1 font-mono text-[10px] text-fg"
              style={{ left: hover.x, top: hover.y + 4 }}
            >
              {hover.name} · week of {hover.week} · <b className="text-accent">{hover.count}</b> commits
            </div>
          )}
        </div>
        <div>
          {repos.map((r) => (
            <div key={r.name} className="flex items-center justify-end font-mono text-[11px] tabular-nums text-fg" style={{ height: ROW }}>
              {r.total}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-widest text-faint">
        One lane per repo · thicker stream = more commits that week · numbers on the right = commits this year · <span className="text-accent">red</span> = latest work
      </p>
    </div>
  );
}
