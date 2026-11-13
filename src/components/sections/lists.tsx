import { Reveal } from "../ui/motion";
import { certifications, journey, skills } from "@/data/profile";
import type { PR } from "@/lib/github";

export function Journey() {
  return (
    <ol className="relative px-4 pb-8 sm:px-6">
      <span className="absolute bottom-8 left-[calc(1rem+5px)] top-2 w-px bg-line sm:left-[calc(1.5rem+5px)]" aria-hidden />
      {journey.map((j, i) => (
        <Reveal key={j.title} delay={i * 0.05}>
          <li className="group relative grid gap-1 py-4 pl-8 sm:grid-cols-[96px_1fr] sm:gap-6">
            <span className="absolute left-0 top-[1.35rem] h-[11px] w-[11px] border border-line-2 bg-bg transition-colors group-hover:border-accent group-hover:bg-accent" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-faint sm:pt-0.5">{j.date}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-fg">{j.title}</h3>
                <span className="border border-accent/40 bg-accent/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-widest text-accent">{j.tag}</span>
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted">{j.org}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{j.text}</p>
            </div>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

export function OpenSource({ prs }: { prs: PR[] }) {
  return (
    <div>
      <ul>
        {prs.map((pr) => (
          <li key={pr.url} className="border-t border-line first:border-t-0">
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-2/70 sm:px-6"
              data-cursor="pr"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0 fill-[#a371f7]" aria-hidden>
                <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] text-fg transition-colors group-hover:text-accent">{pr.title}</div>
                <div className="font-mono text-[11px] text-faint">
                  {pr.repo} · #{pr.number}
                </div>
              </div>
              <span className="shrink-0 border border-[#a371f7]/40 bg-[#a371f7]/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-widest text-[#a371f7]">
                merged
              </span>
            </a>
          </li>
        ))}
      </ul>
      <a
        href="https://github.com/pulls?q=is%3Apr+author%3Asatiricalguru+is%3Amerged+-user%3Asatiricalguru"
        target="_blank"
        rel="noreferrer"
        className="block border-t border-line px-4 py-3 text-center font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:bg-bg-2 hover:text-fg sm:px-6"
      >
        All merged PRs on GitHub ↗
      </a>
    </div>
  );
}

export function Skills() {
  return (
    <div className="grid border-t border-line sm:grid-cols-2">
      {Object.entries(skills).map(([group, list], i) => (
        <div key={group} className={`border-b border-line px-4 py-4 sm:px-6 ${i % 2 === 0 ? "sm:border-r" : ""}`}>
          <div className="mb-2.5 font-mono text-[10px] uppercase tracking-widest text-faint">{group}</div>
          <div className="flex flex-wrap gap-1.5">
            {list.map((s) => (
              <span
                key={s}
                className="border border-line bg-bg-2 px-2 py-0.5 text-[12.5px] text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-fg hover:shadow-[2px_2px_0_var(--accent)]"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Certifications() {
  const doubled = [...certifications, ...certifications];
  return (
    <div className="marquee-wrap overflow-hidden border-b border-line py-4 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div className="marquee flex w-max gap-3">
        {doubled.map((c, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 border border-line bg-panel px-3.5 py-2.5">
            <span className="grid h-7 w-7 place-items-center bg-accent/10 font-pixel text-xs text-accent">{c.issuer[0]}</span>
            <div>
              <div className="text-[13px] text-fg">{c.name}</div>
              <div className="font-mono text-[10px] text-faint">{c.issuer} · 2026</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
