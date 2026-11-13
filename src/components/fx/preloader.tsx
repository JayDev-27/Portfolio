"use client";

import { useEffect, useState } from "react";

const COLS = 14;
const ROWS = 9;
// Deterministic scatter so the server and client agree.
const delays = Array.from({ length: COLS * ROWS }, (_, i) => ((i * 7919 + 13) % 97) * 4.3);

/** 000 → 100 counter, then the screen breaks apart into pixels. Shown once per session. */
export function Preloader() {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"count" | "out" | "done">("count");
  

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("loaded") === "1";
      sessionStorage.setItem("loaded", "1");
    } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
// eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state after hydration
      setPhase("done");
      window.dispatchEvent(new Event("intro:done"));
      return;
    }
    document.documentElement.style.overflow = "hidden";
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * 100));
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        setTimeout(() => {
          setPhase("out");
          window.dispatchEvent(new Event("intro:done"));
          document.documentElement.style.overflow = "";
        }, 180);
        setTimeout(() => setPhase("done"), 1100);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className="fixed inset-0 z-[200]" aria-hidden>
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
        {delays.map((d, i) => (
          <div
            key={i}
            className="bg-bg transition-opacity duration-150"
            style={{ opacity: phase === "out" ? 0 : 1, transitionDelay: phase === "out" ? `${d}ms` : "0ms" }}
          />
        ))}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 transition-opacity duration-200"
        style={{ opacity: phase === "out" ? 0 : 1 }}
      >
        <div className="font-pixel text-7xl tabular-nums text-fg sm:text-8xl">{String(n).padStart(3, "0")}</div>
        <div className="flex gap-1">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className={`h-2 w-2 ${i < n / 5 ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-faint">loading satiricalguru.exe</div>
      </div>
    </div>
  );
}
