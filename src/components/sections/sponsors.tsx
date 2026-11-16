"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Sponsor } from "@/lib/github";
import { profile } from "@/data/profile";

function drawPixels(c: HTMLCanvasElement | null, img: HTMLImageElement | null, n: number) {
  if (!c || !img) return;
  const ctx = c.getContext("2d")!;
  const off = document.createElement("canvas");
  off.width = off.height = n;
  off.getContext("2d")!.drawImage(img, 0, 0, n, n);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(off, 0, 0, c.width, c.height);
}

/** A GitHub avatar redrawn as 12×12 pixel art. Hovering resolves it to the real photo, block by block. */
function PixelAvatar({ src, size = 96 }: { src: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(false);
  const state = useRef({ level: 12, img: null as HTMLImageElement | null });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      state.current.img = img;
      drawPixels(ref.current, img, state.current.level);
    };
  }, [src]);

  useEffect(() => {
    const steps = hover ? [12, 16, 24, 32, 48, 96] : [48, 24, 16, 12];
    let i = 0;
    const id = setInterval(() => {
      state.current.level = steps[i];
      drawPixels(ref.current, state.current.img, steps[i]);
      if (++i >= steps.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [hover]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="pixelated h-full w-full rounded-full"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    />
  );
}

export function SponsorWall({ sponsors, live }: { sponsors: Sponsor[]; live: boolean }) {
  return (
    <div className="px-4 pb-8 sm:px-6">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {sponsors.map((s, i) => (
          <motion.a
            key={s.login}
            href={s.url ?? `https://github.com/${s.login}`}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group relative block"
            data-cursor={`@${s.login}`}
          >
            <div className="relative aspect-square rounded-full border border-line-2 bg-bg-2 p-1.5 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-accent group-hover:shadow-[0_0_0_3px_rgb(var(--glow)/0.25)]">
              <PixelAvatar src={s.avatarUrl} />
              <span className="absolute right-[6%] top-[6%] grid h-5 w-5 place-items-center rounded-full bg-accent font-pixel text-[10px] text-white">♥</span>
            </div>
            <div className="mt-2 truncate text-center font-mono text-[11px] text-muted transition-colors group-hover:text-fg">{s.name || s.login}</div>
            <div className="truncate text-center font-mono text-[9px] text-faint">@{s.login}</div>
          </motion.a>
        ))}
        <a href={profile.sponsorUrl} target="_blank" rel="noreferrer" className="group block" data-cursor="join">
          <div className="stripes relative grid aspect-square place-items-center rounded-full border border-dashed border-line-2 transition-colors group-hover:border-accent">
            <div className="text-center">
              <div className="font-pixel text-3xl text-faint transition-all group-hover:scale-125 group-hover:text-accent">+</div>
            </div>
          </div>
          <div className="mt-2 text-center font-mono text-[11px] text-muted group-hover:text-accent">your pixel here</div>
          <div className="text-center font-mono text-[9px] text-faint">sponsor ↗</div>
        </a>
      </div>
      <p className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-faint">
        <span className={`h-1.5 w-1.5 ${live ? "live-dot bg-green-400" : "bg-faint"}`} />
        {live ? "Live from GitHub Sponsors · updates when someone sponsors" : "Cached list · GitHub could not be reached just now"}
      </p>
    </div>
  );
}
