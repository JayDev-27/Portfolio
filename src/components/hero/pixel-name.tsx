"use client";

import { useEffect, useRef } from "react";

type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; heat: number };

/**
 * The name drawn as physical pixels. They fly in after the preloader, scatter away from the
 * cursor, heat up red where you touch them, and spring back into place.
 */
export function PixelName({ lines = ["JATIN", "PANDEY"] }: { lines?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let parts: P[] = [];
    let cell = 6;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const mouse = { x: -999, y: -999, down: false };
    let colors = { fg: "#ede7df", glow: "224 38 63" };

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = { fg: cs.getPropertyValue("--fg").trim(), glow: cs.getPropertyValue("--glow").trim() };
    };

    const build = (scatter: boolean) => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      if (w < 10) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = w < 420 ? 4 : w < 640 ? 5 : 6;
      const fontPx = Math.floor(w / 4.4);
      h = Math.round(fontPx * lines.length * 1.02 + cell * 2);
      canvas.style.height = h + "px";
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      off.width = Math.ceil(w);
      off.height = h;
      const o = off.getContext("2d")!;
      o.fillStyle = "#fff";
      o.textBaseline = "top";
      o.font = `700 ${fontPx}px ${getComputedStyle(document.body).getPropertyValue("--font-pixelify") || "monospace"}, monospace`;
      lines.forEach((line, i) => {
        o.fillText(line, 0, i * fontPx * 1.0 + cell);
      });
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const next: P[] = [];
      for (let y = 0; y < h; y += cell) {
        for (let x = 0; x < off.width; x += cell) {
          const a = data[((y + (cell >> 1)) * off.width + x + (cell >> 1)) * 4 + 3];
          if (a > 128) {
            next.push({
              hx: x,
              hy: y,
              x: scatter ? Math.random() * w : x,
              y: scatter ? h + Math.random() * 200 : y,
              vx: 0,
              vy: 0,
              heat: scatter ? 1 : 0,
            });
          }
        }
      }
      parts = next;
    };

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      build(!reduce);
    };

    readColors();
    // Wait for the pixel font so the shapes are right.
    document.fonts.ready.then(() => {
      if (document.querySelector("[data-intro-done]") || sessionStorage.getItem("loaded") === "1") start();
      else build(false);
    });
    const onIntro = () => {
      started = false;
      start();
    };
    window.addEventListener("intro:done", onIntro);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -999;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > w || y > h) return;
      for (const p of parts) {
        const dx = p.x - x;
        const dy = p.y - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 220) {
          const f = (1 - d / 220) * 22;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
          p.heat = 1;
        }
      }
    };
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => build(parts.length === 0 && !reduce), 120);
    };
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas.parentElement!);
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const R = 90;
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (!reduce && d2 < R * R) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) * 2.4;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
          p.heat = Math.min(1, p.heat + 0.25);
        }
        p.vx += (p.hx - p.x) * 0.06;
        p.vy += (p.hy - p.y) * 0.06;
        p.vx *= 0.8;
        p.vy *= 0.8;
        p.x += p.vx;
        p.y += p.vy;
        p.heat *= 0.965;
        const s = cell - 1;
        if (p.heat > 0.05) {
          ctx.fillStyle = `rgb(${colors.glow} / ${0.35 + p.heat * 0.65})`;
          ctx.fillRect(p.x, p.y, s, s);
          if (p.heat < 0.6) {
            ctx.globalAlpha = 1 - p.heat / 0.6;
            ctx.fillStyle = colors.fg;
            ctx.fillRect(p.x, p.y, s, s);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.fillStyle = colors.fg;
          ctx.fillRect(p.x, p.y, s, s);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("intro:done", onIntro);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      ro.disconnect();
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [lines]);

  return (
    <canvas
      ref={ref}
      className="block w-full"
      style={{ height: 240 }}
      role="img"
      aria-label={lines.join(" ")}
      data-cursor="poke"
    />
  );
}
