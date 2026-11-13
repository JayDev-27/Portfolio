import { PixelName } from "../hero/pixel-name";
import { Magnetic } from "../ui/motion";
import { RoleTicker, CopyEmail, TimeAgo } from "./hero-client";
import { profile } from "@/data/profile";
import type { RepoInfo } from "@/lib/github";

export function Hero() {
  return (
    <section id="top" className="rail mx-auto max-w-3xl">
      <div className="flex items-center justify-between px-4 pt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-faint sm:px-6">
        <span>[ Portfolio · 2026 ]</span>
        <span className="flex items-center gap-2 text-muted">
          <span className="live-dot h-1.5 w-1.5 bg-green-400" />
          {profile.status}
        </span>
      </div>
      <div className="px-4 pb-4 pt-6 sm:px-6">
        <PixelName />
      </div>
      <div className="flex items-center justify-between px-4 pb-8 font-mono text-[10px] uppercase tracking-[0.25em] text-faint sm:px-6">
        <span>↑ poke the pixels · click to blast</span>
        <span className="hidden sm:inline">scroll ↓</span>
      </div>
    </section>
  );
}

export function Intro({ latest }: { latest: RepoInfo | null }) {
  return (
    <section className="rail tick mx-auto max-w-3xl border-t border-line">
      <div className="grid gap-8 px-4 py-10 sm:grid-cols-[200px_1fr] sm:px-6">
        <div className="relative mx-auto w-48 sm:w-full">
          <div className="group relative aspect-square overflow-hidden rounded-full border border-line-2 bg-bg-2 p-1.5 transition-colors duration-300 hover:border-accent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/avatar.png"
              alt="Pixel-art portrait of Jatin Pandey"
              width={480}
              height={480}
              className="pixelated h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <span className="live-dot absolute bottom-[12%] right-[12%] h-3.5 w-3.5 rounded-full border-2 border-bg bg-green-400" title={profile.status} />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-pixel text-3xl tracking-tight sm:text-4xl">{profile.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {profile.role} · <RoleTicker />
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            I build <b className="font-medium text-fg">local-first AI tools</b>, <b className="font-medium text-fg">native desktop apps</b> and{" "}
            <b className="font-medium text-fg">real-time audio software</b>, then take them apart to see where they{" "}
            <span className="text-accent">break</span>. Most of what I make runs on your machine, not someone else&apos;s cloud. Off the clock, I
            play <b className="font-medium text-fg">CTFs</b> and read binaries in <b className="font-medium text-fg">Ghidra</b>.
          </p>
          <p className="mt-3 font-mono text-[11px] text-faint">
            {profile.education} · {profile.location}
          </p>

          {latest && (
            <a
              href={`https://github.com/${profile.handle}/${latest.name}`}
              target="_blank"
              rel="noreferrer"
              className="group mt-5 flex w-fit items-center gap-2 border border-line bg-bg-2 px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-line-2 hover:text-fg"
              data-cursor="repo"
            >
              <span className="h-1.5 w-1.5 bg-accent" />
              Latest push — <span className="text-fg">{latest.name}</span>
              <TimeAgo iso={latest.pushedAt} className="text-faint" />
            </a>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Magnetic>
              <CopyEmail />
            </Magnetic>
            <Magnetic>
              <a
                href={profile.sponsorUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-line-2 px-3.5 py-2 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
                data-cursor="sponsor"
              >
                <span className="text-accent">♥</span> Sponsor me
              </a>
            </Magnetic>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
            {profile.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="group font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-fg"
              >
                <span className="text-faint transition-colors group-hover:text-accent">↗</span> {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
