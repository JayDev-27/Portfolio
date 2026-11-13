"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { PixelField } from "./fx/pixel-field";
import { Cursor } from "./fx/cursor";
import { Hud } from "./fx/hud";
import { Preloader } from "./fx/preloader";
import { PixelCat } from "./cat/pixel-cat";

export function Shell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 } });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      <Preloader />
      <PixelField />
      <div className="relative z-10">{children}</div>
      <Hud />
      <PixelCat />
      <Cursor />
    </>
  );
}
