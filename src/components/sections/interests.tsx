"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import DUO from "../fun/duo.json";

type Key = "anime" | "gaming" | "languages";

const ITEMS: { key: Key; title: string; line: string; hint: string; icon: string[] }[] = [
  {
    key: "anime",
    title: "Watching anime",
    line: "Late-night episodes, rewatching favourite arcs, and one character above all the rest.",
    hint: "hover to meet her",
    icon: [".X...X.", "XXX.XXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
  },
  {
    key: "gaming",
    title: "Gaming",
    line: "Open worlds, fast cars, and counting the days to one release in particular.",
    hint: "hover to press start",
    icon: ["..X....X..", ".XXX..X.X.", "XXXXXXXXXX", "X.X.XX.X.X", "XXXXXXXXXX", ".XX....XX."],
  },
  {
    key: "languages",
    title: "Learning languages",
    line: "Picking up new languages one lesson at a time. The streak must not die.",
    hint: "hover for a reminder",
    icon: ["XXXXX..", "X...X..", "X.XXXXX", "XXX...X", "..X.X.X", "..XXXXX"],
  },
];

export function Interests() {
  const [open, setOpen] = useState<Key | null>(null);

  return (
    <div className="grid border-t border-line sm:grid-cols-3">
      {ITEMS.map((it, i) => (
        <div
          key={it.key}
          className={`group relative border-b border-line px-4 py-6 sm:px-6 ${i < 2 ? "sm:border-r" : ""}`}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(it.key)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(null)}
          onClick={() => setOpen((v) => (v === it.key ? null : it.key))}
          data-cursor="✦"
        >
          <div className="mb-4 text-accent">
            <Pixels d={it.icon} px={3} />
          </div>
          <h3 className="font-pixel text-lg">{it.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{it.line}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-faint transition-colors group-hover:text-accent">
            ✦ {it.hint}
          </p>

          <AnimatePresence>
            {open === it.key && (
              <motion.div
                key={it.key}
                initial={{ opacity: 0, y: 14, scale: 0.92, rotate: -2 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className={`pointer-events-none absolute bottom-[calc(100%-1.5rem)] left-1/2 z-30 -translate-x-1/2 ${it.key === "anime" ? "w-44" : "w-64"}`}
              >
                <EasterEgg k={it.key} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function EasterEgg({ k }: { k: Key }) {
  if (k === "languages") return <DuoCard />;
  const src = k === "anime" ? "/fun/reze.jpg" : "/fun/gta6.jpg";
  const caption = k === "anime" ? "Reze · Chainsaw Man" : "GTA VI · can't wait";
  return (
    <div className="border border-line-2 bg-panel p-2 shadow-[4px_4px_0_var(--accent)]">
      <div className={`relative overflow-hidden ${k === "anime" ? "aspect-[5/6]" : "aspect-[16/10]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption} className="pixelated h-full w-full object-cover" />
        <PixelReveal />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
        <span className="text-fg">{caption}</span>
        <span className="text-accent">♥ fav</span>
      </div>
    </div>
  );
}

/** Blocks covering the image that vanish in a scattered order. */
function PixelReveal() {
  const cells = 8 * 8;
  return (
    <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
      {Array.from({ length: cells }, (_, i) => (
        <motion.span
          key={i}
          className="bg-panel"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: (((i * 37) % cells) / cells) * 0.35, duration: 0.05 }}
        />
      ))}
    </div>
  );
}

const DUO_COLORS: Record<string, string> = {
  G: "#7aaf39",
  L: "#9bcc5a",
  W: "#f7f7f7",
  K: "#111111",
  O: "#e8962c",
  B: "#c77518",
};
const DUO_LINES = ["¡Hola! Lesson time?", "Your streak misses you.", "日本語、がんばって！", "Just 5 minutes. Please."];

function DuoCard() {
  const [blink, setBlink] = useState(false);
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    const b = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 1800);
    const m = setInterval(() => setMsg((v) => (v + 1) % DUO_LINES.length), 1600);
    return () => {
      clearInterval(b);
      clearInterval(m);
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={msg}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 border-2 border-[#58a700] bg-white px-2.5 py-1 font-pixel text-[12px] text-[#3c3c3c] shadow-[2px_2px_0_#58a700]"
      >
        {DUO_LINES[msg]}
      </motion.div>
      <motion.div
        animate={{ y: [0, -14, 0, -6, 0], scaleY: [1, 1.04, 0.92, 1.02, 1], rotate: [0, -3, 0, 3, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        style={{ originY: 1 }}
      >
        <svg width={150} height={125} viewBox="0 0 30 25" shapeRendering="crispEdges" aria-label="Duolingo owl">
          {(DUO as string[]).flatMap((row, y) =>
            [...row].map((c, x) => {
              if (c === ".") return null;
              let col = DUO_COLORS[c];
              // Blink: close the eyes into a green line.
              if (blink && y >= 6 && y <= 11 && (c === "W" || c === "K")) col = y === 9 ? "#58a700" : DUO_COLORS.L;
              return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={col} />;
            }),
          )}
        </svg>
      </motion.div>
      <motion.div
        animate={{ scaleX: [1, 0.7, 1, 0.85, 1], opacity: [0.35, 0.2, 0.35, 0.25, 0.35] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        className="h-1.5 w-20 rounded-full bg-black"
      />
    </div>
  );
}

function Pixels({ d, px = 2 }: { d: string[]; px?: number }) {
  return (
    <svg width={d[0].length * px} height={d.length * px} viewBox={`0 0 ${d[0].length} ${d.length}`} shapeRendering="crispEdges" className="fill-current" aria-hidden>
      {d.flatMap((row, y) => [...row].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  );
}
