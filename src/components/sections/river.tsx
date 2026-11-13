"use client";

import { useEffect, useRef, useState } from "react";
import type { RiverRepo } from "@/lib/github";

const CELL = 4; // pixel grid size
const H = 300;
const PALETTE = ["#c9bba9", "#8fb3c9", "#a7c49a", "#d6b26e", "#b9a0d4", "#d99a8a", "#8cc9bf", "#c7a5b8", "#a8b0bd"];
const KOI = ["..XX...", ".XXXXX.", "XXXXXXT", ".XXXXX.", "..XX..."]; // facing right, T = tail tip

type Lane = { repo: RiverRepo; color: string; widths: number[]; center: number[]; top: number[]; bot: number[] };

/**
 * A year of commits as a pixel river: time flows left → right, every repository is a current
 * whose width is how much I worked on it, and a pixel koi swims down each one.
 */
export function River({ repos, start }: { repos: RiverRepo[]; start: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ name: string; total: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const WEEKS = repos[0]?.weeks.length ?? 52;
    let W = 0;
    let cols = 0;
    let lanes: Lane[] = [];
    let colors = { fg: "#ede7df", faint: "#5f5753", line: "#241e1d", glow: "224 38 63" };
    const mouse = { x: -999, y: -999 };
    const recent = repos.reduce((best, r) => (r.lastWeek > best.lastWeek ? r : best), repos[0]);
    const maxTotal = Math.max(...repos.map((r) => r.total));

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        fg: cs.getPropertyValue("--fg").trim(),
        faint: cs.getPropertyValue("--faint").trim(),
        line: cs.getPropertyValue("--line").trim(),
        glow: cs.getPropertyValue("--glow").trim(),
      };
    };

    // Time axis widens toward today so recent months get more room.
    const xToWeek = (x: number) => Math.pow(x / W, 1 / 1.35) * (WEEKS - 1);
    const weekToX = (w: number) => Math.pow(w / (WEEKS - 1), 1.35) * W;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.getBoundingClientRect().width;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL);

      // Smooth weekly counts with a Gaussian, then square-root so small projects stay visible.
      const smooth = (a: number[]) =>
        a.map((_, i) => {
          let s = 0;
          let n = 0;
          for (let k = -3; k <= 3; k++) {
            const j = i + k;
            if (j < 0 || j >= a.length) continue;
            const g = Math.exp(-(k * k) / (2 * 1.4 * 1.4));
            s += a[j] * g;
            n += g;
          }
          return s / n;
        });
      const sm = repos.map((r) => smooth(r.weeks).map(Math.sqrt));
      // Sample per pixel column.
      const perCol = sm.map((series) =>
        Array.from({ length: cols }, (_, c) => {
          const w = xToWeek(c * CELL);
          const i = Math.floor(w);
          const f = w - i;
          return (series[i] ?? 0) * (1 - f) + (series[i + 1] ?? series[i] ?? 0) * f;
        }),
      );
      let maxStack = 0;
      for (let c = 0; c < cols; c++) maxStack = Math.max(maxStack, perCol.reduce((s, p) => s + p[c], 0));
      const gap = 3;
      const scale = (H - 70 - gap * repos.length) / Math.max(maxStack, 0.001);

      // Earliest work in the middle, later work alternating outward.
      const firstWeek = (r: RiverRepo) => r.weeks.findIndex((v) => v > 0);
      const order = repos.map((r, i) => i).sort((a, b) => firstWeek(repos[a]) - firstWeek(repos[b]));
      const above: number[] = [];
      const below: number[] = [];
      order.forEach((idx, k) => (k % 2 === 0 ? above : below).push(idx));

      lanes = repos.map((repo, i) => ({
        repo,
        color: repo.name === recent.name ? "accent" : PALETTE[i % PALETTE.length],
        widths: perCol[i].map((v) => v * scale),
        center: new Array(cols).fill(0),
        top: new Array(cols).fill(0),
        bot: new Array(cols).fill(0),
      }));
      const mid = (H - 24) / 2;
      for (let c = 0; c < cols; c++) {
        let up = mid;
        let down = mid;
        above.forEach((idx, k) => {
          const L = lanes[idx];
          const w = L.widths[c];
          if (k === 0) {
            L.top[c] = mid - w / 2;
            L.bot[c] = mid + w / 2;
            up = L.top[c];
            down = L.bot[c];
          } else {
            L.bot[c] = up - (w > 0.5 ? gap : 0);
            L.top[c] = L.bot[c] - w;
            up = L.top[c];
          }
          L.center[c] = (L.top[c] + L.bot[c]) / 2;
        });
        below.forEach((idx) => {
          const L = lanes[idx];
          const w = L.widths[c];
          L.top[c] = down + (w > 0.5 ? gap : 0);
          L.bot[c] = L.top[c] + w;
          down = L.bot[c];
          L.center[c] = (L.top[c] + L.bot[c]) / 2;
        });
      }
      kois = lanes.map((L, i) => makeKoi(L, i));
    };

    type Koi = { lane: Lane; c0: number; c1: number; t: number; speed: number; size: number; depth: number; dodge: number };
    let kois: Koi[] = [];
    const makeKoi = (L: Lane, i: number): Koi => {
      // Swim along the longest stretch wide enough for the fish.
      let best = [0, 0];
      let s = -1;
      for (let c = 0; c <= cols; c++) {
        const ok = c < cols && L.widths[c] > 5;
        if (ok && s < 0) s = c;
        if (!ok && s >= 0) {
          if (c - s > best[1] - best[0]) best = [s, c - 1];
          s = -1;
        }
      }
      const depth = 1 - Math.min(1, (recent.lastWeek - L.repo.lastWeek) / 30);
      return {
        lane: L,
        c0: best[0],
        c1: best[1],
        t: Math.random(),
        speed: 0.0009 + (i % 3) * 0.0003,
        size: L.repo.total / maxTotal > 0.5 ? 2 : 1,
        depth,
        dodge: 0,
      };
    };

    const laneColor = (L: Lane, a: number) => {
      if (L.color === "accent") return `rgb(${colors.glow} / ${a})`;
      const hex = L.color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${r} ${g} ${b} / ${a})`;
    };

    const snap = (v: number) => Math.round(v / CELL) * CELL;

    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      const flow = reduce ? 0 : frame * 0.35;

      // Currents: a body tint plus pixel streamlines that drift toward today.
      for (const L of lanes) {
        for (let c = 0; c < cols; c++) {
          const w = L.widths[c];
          if (w < 1) continue;
          const x = c * CELL;
          const y0 = snap(L.top[c]);
          const y1 = snap(L.bot[c]);
          ctx.fillStyle = laneColor(L, 0.1);
          ctx.fillRect(x, y0, CELL, Math.max(CELL, y1 - y0));
          // Streamlines: more lines in wide parts; outer lines end first as the current thins.
          const lines = Math.max(1, Math.floor(w / 7));
          for (let k = 0; k < lines; k++) {
            const fy = (k + 0.5) / lines;
            const y = snap(y0 + (y1 - y0) * fy);
            const dash = (x + flow * (1 + (k % 3) * 0.3) + k * 37) % 28;
            if (dash < 16) {
              ctx.fillStyle = laneColor(L, 0.35 + 0.5 * (1 - Math.abs(fy - 0.5) * 2));
              ctx.fillRect(x, y, CELL, CELL - 1);
            }
          }
        }
      }

      // Koi.
      for (const k of kois) {
        if (k.c1 - k.c0 < 6) continue;
        k.t = (k.t + (reduce ? 0 : k.speed)) % 1;
        const c = Math.floor(k.c0 + (k.c1 - k.c0) * k.t);
        const x = c * CELL;
        let y = k.lane.center[c] + Math.sin(frame / 20 + k.c0) * 2;
        const d = Math.hypot(mouse.x - x, mouse.y - y);
        k.dodge += ((d < 50 ? (y > mouse.y ? 1 : -1) * (50 - d) * 0.4 : 0) - k.dodge) * 0.15;
        y += Math.max(-k.lane.widths[c] / 2, Math.min(k.lane.widths[c] / 2, k.dodge));
        const px = CELL * k.size * 0.5 + 1;
        const alpha = 0.35 + k.depth * 0.65;
        const isRecent = k.lane.color === "accent";
        if (k.depth > 0.8) {
          // Shadow for fish at the surface.
          ctx.fillStyle = "rgb(0 0 0 / 0.25)";
          KOI.forEach((row, ry) => [...row].forEach((ch, rx) => ch !== "." && ctx.fillRect(snap(x) + rx * px + 2, snap(y) + (ry - 2) * px + 3, px, px)));
        }
        KOI.forEach((row, ry) =>
          [...row].forEach((ch, rx) => {
            if (ch === ".") return;
            ctx.fillStyle = ch === "T" ? laneColor(k.lane, alpha) : isRecent ? `rgb(${colors.glow} / ${alpha})` : rx === 4 && ry === 1 ? `rgb(224 38 63 / ${alpha})` : `rgb(239 230 218 / ${alpha})`;
            ctx.fillRect(snap(x) + rx * px - 4 * px, snap(y) + (ry - 2) * px, px, px);
          }),
        );
      }

      // Ripples at today's edge for anything touched in the last few weeks.
      if (!reduce) {
        for (const L of lanes) {
          if (L.repo.lastWeek < WEEKS - 3) continue;
          const r = (frame * 0.4 + L.center[cols - 1]) % 24;
          ctx.strokeStyle = laneColor(L, 0.6 * (1 - r / 24));
          ctx.strokeRect(W - 6 - r, L.center[cols - 1] - r, r * 2, r * 2);
        }
      }

      // Month ticks.
      ctx.fillStyle = colors.faint;
      ctx.font = "9px ui-monospace, monospace";
      const s = new Date(start);
      for (let m = 1; m <= 12; m++) {
        const d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + m, 1));
        const w = (d.getTime() - s.getTime()) / (7 * 864e5);
        if (w >= WEEKS) break;
        const x = weekToX(w);
        ctx.fillRect(x, H - 20, 1, 4);
        ctx.fillText(d.toLocaleString("en", { month: "short", timeZone: "UTC" }).toUpperCase(), x + 3, H - 8);
      }
      ctx.fillStyle = colors.fg;
      ctx.fillText("TODAY", W - 34, H - 8);

      // Labels at each current's widest point.
      ctx.font = "10px ui-monospace, monospace";
      for (const L of lanes) {
        if (L.repo.isPrivate) continue;
        let bi = 0;
        for (let c = 0; c < cols; c++) if (L.widths[c] > L.widths[bi]) bi = c;
        if (L.widths[bi] < 12) continue;
        const label = L.repo.name;
        const tw = ctx.measureText(label).width;
        const lx = Math.min(W - tw - 4, Math.max(4, bi * CELL - tw / 2));
        ctx.fillStyle = colors.fg;
        ctx.globalAlpha = 0.85;
        ctx.fillText(label, lx, L.center[bi] + 3);
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(draw);
    };

    readColors();
    build();
    raf = requestAnimationFrame(draw);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onResize = () => build();
    window.addEventListener("resize", onResize);
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      const c = Math.floor(mouse.x / CELL);
      const L = lanes.find((l) => c >= 0 && c < cols && mouse.y >= l.top[c] - 2 && mouse.y <= l.bot[c] + 2 && l.widths[c] > 1);
      setHover(L ? { name: L.repo.isPrivate ? "private work" : L.repo.name, total: L.repo.total, x: mouse.x, y: mouse.y } : null);
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
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [repos, start]);

  return (
    <div className="relative px-4 pb-6 sm:px-6">
      <canvas ref={ref} className="block w-full" style={{ height: H }} role="img" aria-label="A year of commits drawn as a river, one current per repository" data-cursor="none" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-line-2 bg-panel px-2 py-1 font-mono text-[10px] text-fg"
          style={{ left: hover.x + 24, top: hover.y - 8 }}
        >
          {hover.name} · <b className="text-accent">{hover.total}</b> commits
        </div>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-faint">
        Each current is a repo, its width is how much I worked on it. One koi per repo; the red one is what I touched last.
      </p>
    </div>
  );
}
