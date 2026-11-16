import { Reveal } from "../ui/motion";
import { certifications, journey, skills } from "@/data/profile";
import type { UpstreamRepo } from "@/lib/github";

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

function formatStars(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : String(n);
}

export function OpenSource({ repos }: { repos: UpstreamRepo[] }) {
  return (
    <div className="grid grid-cols-1 border-t border-line">
      {repos.map((r) => (
        <div key={r.repo} className="group min-w-0 border-b border-line px-4 py-5 transition-colors hover:bg-bg-2/60 sm:px-6">
          <a href={`https://github.com/${r.repo}`} target="_blank" rel="noreferrer" className="flex items-center gap-3.5" data-cursor="repo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r.logo} alt={`${r.owner} logo`} width={44} height={44} className="h-11 w-11 shrink-0 border border-line bg-white object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-mono text-[12px] text-muted">{r.owner}/</span>
                <span className="text-[17px] font-medium text-fg transition-colors group-hover:text-accent">{r.repo.split("/")[1]}</span>
              </div>
              {r.description && <p className="line-clamp-2 text-[12.5px] leading-snug text-muted">{r.description}</p>}
            </div>
            <span className="shrink-0 border border-line px-2 py-1 font-mono text-[11px] text-fg">★ {formatStars(r.stars)}</span>
          </a>
          <ul className="mt-3 space-y-1.5 pl-[58px]">
            {r.prs.slice(0, 3).map((pr) => (
              <li key={pr.number}>
                <a href={pr.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] text-muted transition-colors hover:text-fg" data-cursor="pr">
                  <svg width="12" height="12" viewBox="0 0 16 16" className="shrink-0 fill-[#a371f7]" aria-hidden>
                    <path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />
                  </svg>
                  <span className="truncate">{pr.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">#{pr.number}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
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
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logo} alt={`${c.issuer} logo`} className="h-full w-full object-contain" />
            </span>
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
