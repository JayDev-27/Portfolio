"use client";

import { useEffect, useRef, useState } from "react";

/** Square pixel cursor with a lagging frame that snaps around links and shows a label. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
// eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state after hydration
    setActive(true);
    const m = { x: -100, y: -100 };
    const f = { x: -100, y: -100, w: 28, h: 28 };
    let target: HTMLElement | null = null;
    let raf = 0;
    let down = false;

    const onMove = (e: PointerEvent) => {
      m.x = e.clientX;
      m.y = e.clientY;
      const el = (e.target as HTMLElement)?.closest<HTMLElement>("a, button, [data-cursor], input, textarea, label");
      if (el !== target) {
        target = el;
        const l = el?.dataset.cursor ?? (el ? (el.tagName === "A" ? "open" : el.tagName === "BUTTON" ? "click" : null) : null);
        setLabel(l === "none" ? null : l);
      }
    };
    const onDown = () => (down = true);
    const onUp = () => (down = false);

    const loop = () => {
      if (dot.current) dot.current.style.transform = `translate3d(${m.x - 3}px, ${m.y - 3}px, 0)`;
      let tx = m.x - 14;
      let ty = m.y - 14;
      let tw = 28;
      let th = 28;
      if (target && target.dataset.cursor !== "pet" && target.dataset.cursor !== "none") {
        const r = target.getBoundingClientRect();
        if (r.width < 420 && r.height < 160) {
          tx = r.left - 6 + (m.x - (r.left + r.width / 2)) * 0.08;
          ty = r.top - 6 + (m.y - (r.top + r.height / 2)) * 0.08;
          tw = r.width + 12;
          th = r.height + 12;
        }
      }
      if (down) {
        tx += tw * 0.1;
        ty += th * 0.1;
        tw *= 0.8;
        th *= 0.8;
      }
      f.x += (tx - f.x) * 0.2;
      f.y += (ty - f.y) * 0.2;
      f.w += (tw - f.w) * 0.2;
      f.h += (th - f.h) * 0.2;
      if (frame.current) {
        frame.current.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
        frame.current.style.width = f.w + "px";
        frame.current.style.height = f.h + "px";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  if (!active) return null;
  return (
    <>
      <div ref={frame} className="pointer-events-none fixed left-0 top-0 z-[100]" aria-hidden>
        {/* four corner brackets */}
        <span className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-fg" />
        <span className="absolute right-0 top-0 h-2 w-2 border-r-2 border-t-2 border-fg" />
        <span className="absolute bottom-0 left-0 h-2 w-2 border-b-2 border-l-2 border-fg" />
        <span className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-fg" />
        {label && (
          <span className="absolute -bottom-6 left-0 bg-accent px-1.5 py-px font-pixel text-[10px] uppercase tracking-wider text-white">
            {label}
          </span>
        )}
      </div>
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[101] h-1.5 w-1.5 bg-accent" aria-hidden />
    </>
  );
}
