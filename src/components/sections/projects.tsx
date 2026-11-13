"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Category, Project } from "@/data/profile";
import { profile } from "@/data/profile";

const CATS: ("All" | Category)[] = ["All", "AI & Agents", "Native & Desktop", "Real-time Audio", "Security", "Web & 3D"];

export function Projects({ projects, stars }: { projects: Project[]; stars: Record<string, number> }) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [showAll, setShowAll] = useState(false);
  const list = useMemo(() => projects.filter((p) => cat === "All" || p.category === cat), [projects, cat]);
  const visible = showAll || cat !== "All" ? list : list.slice(0, 6);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-y border-line px-4 py-2 sm:px-6">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`relative shrink-0 px-2.5 py-1 font-mono text-[11px] tracking-wide transition-colors ${cat === c ? "text-bg" : "text-muted hover:text-fg"}`}
          >
            {cat === c && <motion.span layoutId="cat-pill" className="absolute inset-0 bg-fg" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <span className="relative">{c}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((p, i) => (
            <motion.div
              key={p.repo}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className={`border-line ${i % 2 === 0 ? "sm:border-r" : ""} border-b`}
            >
              <ProjectCard p={p} stars={stars[p.repo]} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {cat === "All" && list.length > 6 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full py-3 font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:bg-bg-2 hover:text-fg"
        >
          {showAll ? "Show less ↑" : `Show ${list.length - 6} more ↓`}
        </button>
      )}
    </div>
  );
}

function ProjectCard({ p, stars }: { p: Project; stars?: number }) {
  const repoUrl = `https://github.com/${profile.handle}/${p.repo}`;
  return (
    <a href={p.live ?? repoUrl} target="_blank" rel="noreferrer" className="group block p-4 sm:p-5" data-cursor={p.live ? "visit" : "repo"}>
      <div className="relative aspect-[2/1] overflow-hidden border border-line bg-bg-2">
        {/* GitHub's generated social card for the repo, pixelated until hover. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://opengraph.githubassets.com/portfolio/${profile.handle}/${p.repo}`}
          alt={`${p.name} preview`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80 grayscale transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100 group-hover:grayscale-0"
        />
        <PixelCurtain />
        <div className="absolute left-2 top-2 flex gap-1">
          {p.live && (
            <span className="flex items-center gap-1 bg-bg/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-green-400">
              <span className="live-dot h-1 w-1 bg-green-400" /> live
            </span>
          )}
        </div>
        {typeof stars === "number" && stars > 0 && (
          <span className="absolute right-2 top-2 bg-bg/90 px-1.5 py-0.5 font-mono text-[10px] text-fg">★ {stars}</span>
        )}
      </div>
      <div className="mt-3.5 flex items-baseline justify-between gap-2">
        <h3 className="font-pixel text-lg tracking-tight transition-colors group-hover:text-accent">{p.name}</h3>
        <span className="font-mono text-[9px] uppercase tracking-widest text-faint">{p.category}</span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.blurb}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {p.stack.map((s) => (
          <span key={s} className="border border-line px-1.5 py-px font-mono text-[10px] text-muted">
            {s}
          </span>
        ))}
        <span className="ml-auto font-mono text-[11px] text-faint transition-all group-hover:translate-x-0.5 group-hover:text-fg">
          {p.live ? "visit ↗" : "code ↗"}
        </span>
      </div>
    </a>
  );
}

const CURTAIN = Array.from({ length: 48 }, (_, i) => ((i * 37 + 11) % 48) / 48);

/** A grid of blocks over the image that dissolve in a random order on hover. */
function PixelCurtain() {
  const order = CURTAIN;
  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-12 grid-rows-4">
      {order.map((o, i) => (
        <span
          key={i}
          className="bg-bg-2 opacity-60 transition-opacity duration-200 group-hover:opacity-0"
          style={{ transitionDelay: `${Math.round(o * 260)}ms` }}
        />
      ))}
    </div>
  );
}
