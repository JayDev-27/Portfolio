"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ContributionDay } from "@/lib/github";

function color(l: number) {
  return l === 0 ? "var(--line)" : `rgb(var(--glow) / ${[0, 0.3, 0.55, 0.8, 1][l]})`;
}

export function ContributionGrid({ weeks }: { weeks: ContributionDay[][] }) {
  const [tip, setTip] = useState<{ d: ContributionDay; x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // On narrow screens, start at the most recent weeks.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // Jump to the newest weeks the first time the graph is on screen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && el.scrollWidth > el.clientWidth) {
        el.scrollLeft = el.scrollWidth;
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const shown = weeks.slice(-53);
  const months: { i: number; label: string }[] = [];
  shown.forEach((w, i) => {
    const d = new Date(w[0].date);
    if (d.getUTCDate() <= 7) months.push({ i, label: d.toLocaleString("en", { month: "short", timeZone: "UTC" }) });
  });

  return (
    <div className="relative" data-grid-root onPointerLeave={() => setTip(null)}>
      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="min-w-[640px]">
          <div className="relative mb-1.5 h-3 font-mono text-[9px] uppercase tracking-wider text-faint">
            {months.map((m) => (
              <span key={m.i} className="absolute" style={{ left: `${(m.i / shown.length) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${shown.length}, 1fr)` }}>
            {shown.map((w, wi) => (
              <div key={wi} className="grid grid-rows-7 gap-[3px]">
                {w.map((d, di) => (
                  <motion.span
                    key={d.date}
                    initial={{ opacity: 0, scale: 0.4 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (wi + di) * 0.006, duration: 0.25 }}
                    className="aspect-square w-full transition-transform hover:scale-150"
                    style={{ background: color(d.level), gridRow: new Date(d.date).getUTCDay() + 1 }}
                    onPointerEnter={(e) => {
                      const r = e.currentTarget.closest("[data-grid-root]")?.getBoundingClientRect();
                      const s = e.currentTarget.getBoundingClientRect();
                      setTip({ d, x: s.left - (r?.left ?? 0) + s.width / 2, y: s.top - (r?.top ?? 0) });
                    }}
                    data-cursor="none"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-line-2 bg-panel px-2 py-1 font-mono text-[10px] text-fg"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          <b className="text-accent">{tip.d.count}</b> on{" "}
          {new Date(tip.d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
        </div>
      )}
    </div>
  );
}
