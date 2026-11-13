"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen dotted grid. Cells near the cursor charge up and glow as pixels,
 * fast movement leaves a longer trail, and clicks send out a square shockwave.
 */
export function PixelField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GAP = 22;
    let cols = 0;
    let rows = 0;
    let energy = new Float32Array(0);
    let dpr = 1;
    let w = 0;
    let h = 0;
    const mouse = { x: -999, y: -999, px: -999, py: -999, v: 0 };
    const waves: { x: number; y: number; r: number }[] = [];
    let colors = { dot: "#2a2221", accent: "224 38 63", fg: "#ede7df" };

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        dot: cs.getPropertyValue("--dot").trim() || colors.dot,
        accent: cs.getPropertyValue("--glow").trim() || colors.accent,
        fg: cs.getPropertyValue("--fg").trim() || colors.fg,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP) + 1;
      rows = Math.ceil(h / GAP) + 1;
      energy = new Float32Array(cols * rows);
    };

    const charge = (x: number, y: number, radius: number, amount: number) => {
      const c0 = Math.max(0, Math.floor((x - radius) / GAP));
      const c1 = Math.min(cols - 1, Math.ceil((x + radius) / GAP));
      const r0 = Math.max(0, Math.floor((y - radius) / GAP));
      const r1 = Math.min(rows - 1, Math.ceil((y + radius) / GAP));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const d = Math.hypot(c * GAP - x, r * GAP - y);
          if (d < radius) {
            const i = r * cols + c;
            energy[i] = Math.min(1, energy[i] + amount * (1 - d / radius));
          }
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -999;
    };
    const onDown = (e: PointerEvent) => {
      if (!reduce) waves.push({ x: e.clientX, y: e.clientY, r: 0 });
    };

    readColors();
    resize();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    let t = 0;
    const loop = () => {
      t++;
      if (mouse.x > -500) {
        const v = mouse.px > -500 ? Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py) : 0;
        mouse.v += (v - mouse.v) * 0.2;
        charge(mouse.x, mouse.y, 70 + Math.min(mouse.v, 40) * 2.2, 0.08 + Math.min(mouse.v, 40) / 160);
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      for (let i = waves.length - 1; i >= 0; i--) {
        const wv = waves[i];
        wv.r += 9;
        // Charge only the ring.
        const ring = 26;
        for (let a = 0; a < Math.PI * 2; a += GAP / Math.max(wv.r, 1)) {
          const x = wv.x + Math.cos(a) * wv.r;
          const y = wv.y + Math.sin(a) * wv.r;
          const c = Math.round(x / GAP);
          const r = Math.round(y / GAP);
          if (c >= 0 && c < cols && r >= 0 && r < rows) {
            const idx = r * cols + c;
            energy[idx] = Math.min(1, energy[idx] + 0.6 * (1 - wv.r / 700));
          }
        }
        if (wv.r > 700 + ring) waves.splice(i, 1);
      }

      // Occasional idle twinkle so the field feels alive.
      if (!reduce && t % 6 === 0) {
        const i = Math.floor(Math.random() * energy.length);
        energy[i] = Math.max(energy[i], 0.35);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = colors.dot;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillRect(c * GAP - 1, r * GAP - 1, 2, 2);
        }
      }
      for (let i = 0; i < energy.length; i++) {
        const e = energy[i];
        if (e < 0.02) continue;
        const c = i % cols;
        const r = (i / cols) | 0;
        const size = 2 + Math.round(e * 6) * 2;
        ctx.fillStyle = `rgb(${colors.accent} / ${Math.min(1, e * 1.1)})`;
        ctx.fillRect(c * GAP - size / 2, r * GAP - size / 2, size, size);
        if (e > 0.75) {
          ctx.fillStyle = colors.fg;
          ctx.fillRect(c * GAP - 1, r * GAP - 1, 2, 2);
        }
        energy[i] = e * 0.94;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}
