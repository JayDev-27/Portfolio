import { CountUp } from "../ui/motion";
import type { ContributionDay, LeetCodeStats } from "@/lib/github";
import { ContributionGrid } from "./contribution-grid";
import { profile } from "@/data/profile";

export function Stats({
  repos,
  stars,
  followers,
  contributions,
}: {
  repos: number;
  stars: number;
  followers: number;
  contributions: number;
}) {
  const items = [
    { n: contributions, label: "contributions / yr" },
    { n: repos, label: "public repos" },
    { n: stars, label: "stars earned" },
    { n: followers, label: "followers" },
  ];
  return (
    <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
      {items.map((it, i) => (
        <div key={it.label} className={`px-4 py-5 sm:px-6 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} sm:border-l border-line first:border-l-0`}>
          <CountUp to={it.n} className="font-pixel text-3xl tabular-nums" />
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-faint">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Activity({ weeks, total }: { weeks: ContributionDay[][]; total: number }) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <ContributionGrid weeks={weeks} />
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-faint">
        <span>
          <span className="text-fg">{total.toLocaleString("en-IN")}</span> contributions in the last year
        </span>
        <span className="flex items-center gap-1">
          less
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="h-2.5 w-2.5" style={{ background: levelColor(l) }} />
          ))}
          more
        </span>
      </div>
    </div>
  );
}

export function levelColor(l: number) {
  return l === 0 ? "var(--line)" : `rgb(var(--glow) / ${[0, 0.3, 0.55, 0.8, 1][l]})`;
}

export function LeetCode({ stats }: { stats: LeetCodeStats }) {
  const rows = [
    { k: "Easy", n: stats.easy, t: stats.totals.Easy, c: "#4ade80" },
    { k: "Medium", n: stats.medium, t: stats.totals.Medium, c: "#facc15" },
    { k: "Hard", n: stats.hard, t: stats.totals.Hard, c: "var(--accent)" },
  ];
  return (
    <a
      href={`https://leetcode.com/u/${profile.leetcode}/`}
      target="_blank"
      rel="noreferrer"
      className="grid gap-5 border-t border-line px-4 py-6 transition-colors hover:bg-bg-2/60 sm:grid-cols-[180px_1fr] sm:px-6"
      data-cursor="leetcode"
    >
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-faint">LeetCode · solved</div>
        <div className="mt-1 font-pixel text-4xl tabular-nums">
          <CountUp to={stats.solved} />
        </div>
        <div className="mt-1 font-mono text-[10px] text-faint">rank #{stats.ranking.toLocaleString("en-IN")}</div>
      </div>
      <div className="flex flex-col justify-center gap-2.5">
        {rows.map((r) => {
          const blocks = 30;
          const filled = Math.max(r.n > 0 ? 1 : 0, Math.round((r.n / Math.max(1, r.t)) * blocks * 6));
          return (
            <div key={r.k} className="flex items-center gap-3 font-mono text-[11px]">
              <span className="w-14 text-muted">{r.k}</span>
              <span className="flex flex-1 gap-[2px]">
                {Array.from({ length: blocks }, (_, i) => (
                  <span key={i} className="h-2.5 flex-1" style={{ background: i < Math.min(blocks, filled) ? r.c : "var(--line)" }} />
                ))}
              </span>
              <span className="w-16 text-right tabular-nums text-fg">
                {r.n}
                <span className="text-faint">/{r.t}</span>
              </span>
            </div>
          );
        })}
      </div>
    </a>
  );
}
