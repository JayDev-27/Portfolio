import { ViewCounter } from "../ui/view-counter";
import { CopyEmail } from "./hero-client";
import { Magnetic, Scramble } from "../ui/motion";
import { profile } from "@/data/profile";

export function Contact() {
  return (
    <section id="contact" className="rail tick mx-auto max-w-3xl border-t border-line">
      <div className="px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">08 · Contact</div>
        <Scramble as="h2" text="Let's build something." className="mt-4 block font-pixel text-4xl tracking-tight sm:text-6xl" />
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
          Internships, collaborations, a CTF team that needs a reverser, or an idea that should run locally. My inbox is open.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Magnetic strength={0.3}>
            <CopyEmail big />
          </Magnetic>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {profile.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-accent"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="rail mx-auto max-w-3xl border-t border-line">
      <div className="flex flex-col items-center justify-between gap-3 px-4 py-6 font-mono text-[10px] uppercase tracking-widest text-faint sm:flex-row sm:px-6">
        <span>© 2026 {profile.name} · built with Next.js, pixels and one cat</span>
        <ViewCounter className="text-muted" />
        <span className="text-muted">
          1000 − 7 = 993<span className="blink">_</span>
        </span>
      </div>
    </footer>
  );
}
