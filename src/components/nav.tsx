"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#work", label: "Work" },
  { href: "#journey", label: "Journey" },
  { href: "#open-source", label: "OSS" },
  { href: "#sponsors", label: "Sponsors" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state after hydration
    setTheme((document.documentElement.dataset.theme as "dark" | "light") ?? "dark");
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const apply = () => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch {}
    };
    const d = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (d.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) d.startViewTransition(apply);
    else apply();
  };

  return (
    <header className="sticky top-0 z-50">
      <div
        className={`mx-auto flex h-14 max-w-3xl items-center justify-between border-x border-b px-4 transition-colors duration-300 sm:px-6 ${
          scrolled ? "border-line bg-bg/80 backdrop-blur-md" : "border-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5" data-cursor="home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/me-32.png" alt="" width={28} height={28} className="pixelated h-7 w-7 bg-line" />
          <span className="font-pixel text-sm tracking-wide">satiricalguru</span>
        </a>
        <nav className="flex items-center gap-1">
          <ul className="hidden items-center gap-0.5 sm:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-fg">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={() => window.dispatchEvent(new Event("cat:toggle"))}
            className="grid h-8 w-8 place-items-center text-muted transition-colors hover:text-fg"
            aria-label="Toggle the cat"
            data-cursor="cat"
          >
            <PixelIcon d={["X...X", "XX.XX", "XXXXX", "X.X.X", ".XXX."]} />
          </button>
          <button
            onClick={toggleTheme}
            className="grid h-8 w-8 place-items-center text-muted transition-colors hover:text-fg"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            data-cursor={theme === "dark" ? "light" : "dark"}
          >
            {theme === "dark" ? (
              <PixelIcon d={["..X..", "X.X.X", ".XXX.", "XXXXX", ".XXX.", "X.X.X", "..X.."]} />
            ) : (
              <PixelIcon d={[".XXX.", "XX...", "XX...", "XX...", ".XXX."]} />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function PixelIcon({ d, px = 2 }: { d: string[]; px?: number }) {
  const w = d[0].length;
  const h = d.length;
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden className="fill-current">
      {d.flatMap((row, y) => [...row].map((c, x) => (c === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  );
}
