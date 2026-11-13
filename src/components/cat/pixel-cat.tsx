"use client";

import { useEffect, useRef, useState } from "react";
import FRAMES from "./frames.json";

type FrameName = keyof typeof FRAMES;
type Mode = "sit" | "walk" | "run" | "sleep" | "groom" | "pet" | "pounce";

const PALETTE: Record<string, string> = {
  O: "#1b1514",
  B: "#efe6da",
  S: "#c9bba9",
  E: "#2a1f1d",
  P: "#f29aa6",
  R: "#e0263f",
};

const SCALE = 3;
const SIZE = 16 * SCALE;

/** Pre-render every frame to an offscreen canvas once. */
function buildSprites() {
  const sprites = {} as Record<FrameName, HTMLCanvasElement>;
  (Object.keys(FRAMES) as FrameName[]).forEach((name) => {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const ctx = c.getContext("2d")!;
    FRAMES[name].forEach((row, y) => {
      for (let x = 0; x < 16; x++) {
        const col = PALETTE[row[x]];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
    sprites[name] = c;
  });
  return sprites;
}

type Particle = { x: number; y: number; vy: number; life: number; kind: "heart" | "z" | "dust" };

export function PixelCat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    try {
// eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state after hydration
      if (localStorage.getItem("cat") === "off") setEnabled(false);
    } catch {}
    const onToggle = () =>
      setEnabled((v) => {
        try {
          localStorage.setItem("cat", v ? "off" : "on");
        } catch {}
        return !v;
      });
    window.addEventListener("cat:toggle", onToggle);
    return () => window.removeEventListener("cat:toggle", onToggle);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current!;
    const fx = fxRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const fctx = fx.getContext("2d")!;
    const sprites = buildSprites();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const s = {
      x: window.innerWidth - 120,
      y: window.innerHeight - 80,
      tx: window.innerWidth - 120,
      ty: window.innerHeight - 80,
      face: -1,
      mode: "sit" as Mode,
      modeT: 0,
      lastMove: performance.now(),
      hovered: false,
      jump: null as null | { sx: number; sy: number; ex: number; ey: number; t: number },
      tick: 0,
      pets: 0,
    };
    const particles: Particle[] = [];
    let raf = 0;
    let bubbleTimer: ReturnType<typeof setTimeout> | undefined;

    const say = (text: string, ms = 1800) => {
      setBubble(text);
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => setBubble(null), ms);
    };

    const setMode = (m: Mode) => {
      if (s.mode !== m) {
        s.mode = m;
        s.modeT = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && fine) return;
      s.tx = e.clientX;
      s.ty = e.clientY;
      s.lastMove = performance.now();
      if (s.mode === "sleep" && Math.hypot(s.tx - s.x, s.ty - s.y) > 60) {
        say("!", 700);
        setMode("sit");
      }
    };

    const onDown = (e: PointerEvent) => {
      if (wrap.contains(e.target as Node)) return;
      if (!fine) {
        s.tx = e.clientX;
        s.ty = e.clientY;
        s.lastMove = performance.now();
        return;
      }
      const d = Math.hypot(e.clientX - s.x, e.clientY - s.y);
      if (d < 260 && s.mode !== "sleep" && !reduce) {
        s.jump = { sx: s.x, sy: s.y, ex: e.clientX, ey: e.clientY + 18, t: 0 };
        s.face = e.clientX > s.x ? 1 : -1;
        setMode("pounce");
      }
    };

    const onEnter = () => {
      s.hovered = true;
      if (s.mode !== "pounce") setMode("pet");
    };
    const onLeave = () => {
      s.hovered = false;
      if (s.mode === "pet") setMode("sit");
    };
    const onCatClick = () => {
      s.pets++;
      const lines = ["purrr…", "mrrp?", "more pets pls", "nya~", "sponsor jatin, I need treats"];
      say(lines[Math.min(s.pets - 1, lines.length - 1)] ?? "purr");
      for (let i = 0; i < 4; i++) particles.push({ x: 24 + (Math.random() - 0.5) * 30, y: 30, vy: -0.6 - Math.random() * 0.6, life: 1, kind: "heart" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    wrap.addEventListener("pointerenter", onEnter);
    wrap.addEventListener("pointerleave", onLeave);
    wrap.addEventListener("click", onCatClick);

    const drawFx = () => {
      fctx.clearRect(0, 0, fx.width, fx.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy;
        p.life -= 0.012;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        fctx.globalAlpha = Math.min(1, p.life * 1.5);
        const px = Math.round(p.x);
        const py = Math.round(p.y);
        if (p.kind === "heart") {
          fctx.fillStyle = "#e0263f";
          const h = [".X.X.", "XXXXX", ".XXX.", "..X.."];
          h.forEach((row, yy) => [...row].forEach((c, xx) => c === "X" && fctx.fillRect(px + xx * 2, py + yy * 2, 2, 2)));
        } else if (p.kind === "z") {
          fctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#9a918a";
          const z = ["XXX", "..X", ".X.", "X..", "XXX"];
          z.forEach((row, yy) => [...row].forEach((c, xx) => c === "X" && fctx.fillRect(px + xx * 2, py + yy * 2, 2, 2)));
        } else {
          fctx.fillStyle = "#c9bba9";
          fctx.fillRect(px, py, 2, 2);
        }
      }
      fctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      s.tick++;
      s.modeT++;
      const idleFor = now - s.lastMove;
      const ox = s.tx - s.x;
      const oy = s.ty - s.y - 6;
      const dist = Math.hypot(ox, oy);

      if (s.mode === "pounce" && s.jump) {
        s.jump.t += 1 / 26;
        const t = Math.min(1, s.jump.t);
        s.x = s.jump.sx + (s.jump.ex - s.jump.sx) * t;
        s.y = s.jump.sy + (s.jump.ey - s.jump.sy) * t - Math.sin(t * Math.PI) * 60;
        if (t >= 1) {
          s.jump = null;
          for (let i = 0; i < 6; i++) particles.push({ x: 10 + Math.random() * 28, y: 82, vy: -0.3 - Math.random() * 0.3, life: 0.6, kind: "dust" });
          setMode("sit");
          s.lastMove = now;
        }
      } else if (s.mode === "pet") {
        if (s.tick % 40 === 0) particles.push({ x: 18 + Math.random() * 14, y: 22, vy: -0.5, life: 1, kind: "heart" });
      } else if (dist > 48 && s.mode !== "sleep" && !s.hovered) {
        const speed = reduce ? 2 : dist > 320 ? 9 : 3.4;
        setMode(dist > 320 && !reduce ? "run" : "walk");
        s.x += (ox / dist) * Math.min(speed, dist);
        s.y += (oy / dist) * Math.min(speed, dist);
        if (Math.abs(ox) > 2) s.face = ox > 0 ? 1 : -1;
      } else if (s.mode === "walk" || s.mode === "run") {
        setMode("sit");
      } else if (s.mode === "sit" && idleFor > 9000) {
        setMode("sleep");
        say("zzz", 1200);
      } else if (s.mode === "sit" && s.modeT > 240 && Math.random() < 0.004) {
        setMode("groom");
      } else if (s.mode === "groom" && s.modeT > 150) {
        setMode("sit");
      }

      if (s.mode === "sleep" && s.tick % 70 === 0) particles.push({ x: s.face > 0 ? 34 : 6, y: 20, vy: -0.35, life: 1, kind: "z" });

      // Keep inside the viewport.
      s.x = Math.max(SIZE / 2, Math.min(window.innerWidth - SIZE / 2, s.x));
      s.y = Math.max(SIZE, Math.min(window.innerHeight - 4, s.y));

      // Pick a frame.
      let frame: FrameName = "sit1";
      const t = s.tick;
      switch (s.mode) {
        case "walk":
          frame = Math.floor(t / 9) % 2 ? "walk1" : "walk2";
          break;
        case "run":
          frame = Math.floor(t / 5) % 2 ? "run1" : "run2";
          break;
        case "sleep":
          frame = Math.floor(t / 50) % 2 ? "sleep1" : "sleep2";
          break;
        case "groom":
          frame = Math.floor(t / 12) % 2 ? "groom1" : "groom2";
          break;
        case "pounce":
          frame = "pounce";
          break;
        case "pet":
          frame = Math.floor(t / 30) % 2 ? "blink" : "sit1";
          break;
        default:
          frame = t % 220 < 8 ? "blink" : Math.floor(t / 45) % 2 ? "sit1" : "sit2";
      }

      ctx.clearRect(0, 0, 16, 16);
      ctx.drawImage(sprites[frame], 0, 0);
      const purr = s.mode === "pet" ? Math.sin(t / 2) * 0.6 : 0;
      wrap.style.transform = `translate3d(${Math.round(s.x - SIZE / 2 + purr)}px, ${Math.round(s.y - SIZE)}px, 0)`;
      canvas.style.transform = `scaleX(${s.face})`;
      drawFx();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bubbleTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      wrap.removeEventListener("pointerenter", onEnter);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.removeEventListener("click", onCatClick);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed left-0 top-0 z-[60] select-none"
      style={{ width: SIZE, height: SIZE, willChange: "transform" }}
      data-cursor="pet"
      aria-hidden
    >
      <canvas ref={fxRef} width={48} height={88} className="pixelated pointer-events-none absolute -top-10 left-0" style={{ width: 48, height: 88 }} />
      <canvas ref={canvasRef} width={16} height={16} className="pixelated" style={{ width: SIZE, height: SIZE }} />
      {bubble && (
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap border border-line-2 bg-panel px-2 py-0.5 font-pixel text-[11px] text-fg shadow-[2px_2px_0_var(--line-2)]">
          {bubble}
        </span>
      )}
    </div>
  );
}
