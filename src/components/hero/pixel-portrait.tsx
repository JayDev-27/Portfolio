"use client";

import { useEffect, useRef } from "react";

const SIZE = 240;
const LEVELS = [16, 8, 4, 2]; // block size in px, coarse → fine

/**
 * Jatin's photo as chunky pixel art. Moving the cursor over it resolves the image
 * into finer pixels around the pointer, like a lens.
 */
export function PixelPortrait({ src = "/img/avatar.png", size = SIZE, className = "" }: { src?: string; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const img = new Image();
    // Prefer the pixel-art avatar; fall back to the photo if it is missing.
    img.onerror = () => {
      if (!img.src.endsWith("/img/me.jpg")) img.src = "/img/me.jpg";
    };
    img.src = src;
    let levels: { block: number; n: number; data: Uint8ClampedArray }[] = [];
    const m = { x: -999, y: -999 };
    let radius = 0;
    let targetRadius = 0;
    let raf = 0;
    let dirty = true;

    img.onload = () => {
      levels = LEVELS.map((block) => {
        const n = Math.round(size / block);
        const off = document.createElement("canvas");
        off.width = off.height = n;
        const o = off.getContext("2d")!;
        o.imageSmoothingEnabled = true;
        o.imageSmoothingQuality = "high";
        o.drawImage(img, 0, 0, n, n);
        return { block, n, data: o.getImageData(0, 0, n, n).data };
      });
      dirty = true;
    };

    const quant = (v: number) => Math.round(v / 12) * 12;

    const drawCell = (lv: number, cx: number, cy: number) => {
      const L = levels[lv];
      const b = L.block;
      const finer = levels[lv + 1];
      const mx = cx * b + b / 2;
      const my = cy * b + b / 2;
      const d = Math.hypot(mx - m.x, my - m.y);
      // Ring thresholds: inner rings use finer levels.
      const threshold = radius * (1 - lv / LEVELS.length) * 1.0;
      if (finer && d < threshold + b) {
        const ratio = b / finer.block;
        for (let y = 0; y < ratio; y++) for (let x = 0; x < ratio; x++) drawCell(lv + 1, cx * ratio + x, cy * ratio + y);
        return;
      }
      const i = (cy * L.n + cx) * 4;
      ctx.fillStyle = `rgb(${quant(L.data[i])},${quant(L.data[i + 1])},${quant(L.data[i + 2])})`;
      ctx.fillRect(cx * b, cy * b, b, b);
    };

    const loop = () => {
      radius += (targetRadius - radius) * 0.12;
      if (levels.length && (dirty || Math.abs(targetRadius - radius) > 0.5)) {
        ctx.clearRect(0, 0, size, size);
        const L = levels[0];
        for (let y = 0; y < L.n; y++) for (let x = 0; x < L.n; x++) drawCell(0, x, y);
        dirty = false;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      m.x = ((e.clientX - r.left) / r.width) * size;
      m.y = ((e.clientY - r.top) / r.height) * size;
      targetRadius = size * 0.42;
      dirty = true;
    };
    const onLeave = () => {
      targetRadius = 0;
      dirty = true;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [src, size]);

  return (
    <canvas
      ref={ref}
      className={`pixelated block aspect-square w-full ${className}`}
      role="img"
      aria-label="Pixel-art portrait of Jatin Pandey"
      data-cursor="focus"
    />
  );
}
