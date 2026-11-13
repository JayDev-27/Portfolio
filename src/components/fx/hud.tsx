"use client";

import { useEffect, useRef, useState } from "react";

/** Corner readouts: local time in Jaipur, cursor coordinates and scroll progress. */
export function Hud() {
  const [time, setTime] = useState("");
  const xy = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    const onMove = (e: PointerEvent) => {
      if (xy.current) xy.current.textContent = `x${String(e.clientX).padStart(4, "0")} y${String(e.clientY).padStart(4, "0")}`;
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleY(${p})`;
      if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
    };
    onScroll();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearInterval(id);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-faint lg:block" aria-hidden>
      <div className="absolute bottom-5 left-5 flex flex-col gap-1">
        <span>
          <span className="text-muted">Jaipur</span> {time} IST
        </span>
        <span ref={xy}>x0000 y0000</span>
      </div>
      <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
        <span ref={pct}>000</span>
        <div className="relative h-28 w-px bg-line">
          <div ref={bar} className="absolute inset-0 origin-top bg-accent" style={{ transform: "scaleY(0)" }} />
        </div>
        <span>%</span>
      </div>
    </div>
  );
}
