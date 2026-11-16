import { cacheLife, cacheTag } from "next/cache";
import { fallbackSponsors, profile } from "@/data/profile";

const LOGIN = profile.handle;
const token = () => process.env.GITHUB_TOKEN;

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
  const t = token();
  if (!t) return null;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) console.error("GitHub GraphQL errors", json.errors);
    return (json.data as T) ?? null;
  } catch (e) {
    console.error("GitHub GraphQL failed", e);
    return null;
  }
}

async function rest<T>(path: string): Promise<T | null> {
  const t = token();
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type Sponsor = { login: string; name: string | null; avatarUrl: string; url?: string };

/** Sponsors are tagged so the GitHub Sponsors webhook can refresh them the moment someone sponsors. */
export async function getSponsors(): Promise<{ sponsors: Sponsor[]; live: boolean }> {
  "use cache";
  cacheTag("sponsors");
  cacheLife("hours");

  type R = {
    user: {
      sponsors: {
        nodes: { login: string; name: string | null; avatarUrl: string; url: string }[];
      };
    };
  };
  const data = await gql<R>(
    `query($login:String!){ user(login:$login){ sponsors(first:100){ nodes{
      ... on User{ login name avatarUrl(size:160) url }
      ... on Organization{ login name avatarUrl(size:160) url } } } } }`,
    { login: LOGIN },
  );
  if (!data?.user) {
    // Tokenless: read the public GitHub Sponsors page.
    try {
      const res = await fetch(`https://github.com/sponsors/${LOGIN}`, { headers: { "User-Agent": "portfolio" } });
      if (res.ok) {
        const html = await res.text();
        const logins = [...new Set([...html.matchAll(/alt="@([A-Za-z0-9-]+)"/g)].map((m) => m[1]))].filter(
          (l) => l.toLowerCase() !== LOGIN.toLowerCase(),
        );
        const known = Object.fromEntries(fallbackSponsors.map((f) => [f.login, f.name]));
        return {
          sponsors: logins.map((login) => ({
            login,
            name: known[login] ?? null,
            avatarUrl: `https://avatars.githubusercontent.com/${login}?s=160`,
            url: `https://github.com/${login}`,
          })),
          live: true,
        };
      }
    } catch {}
    return { sponsors: fallbackSponsors, live: false };
  }
  return { sponsors: data.user.sponsors.nodes.filter((n) => n?.login), live: true };
}

export type ContributionDay = { date: string; count: number; level: number };

export async function getContributions(): Promise<{ total: number; weeks: ContributionDay[][] } | null> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");

  type R = {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
        };
      };
    };
  };
  const levels: Record<string, number> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };
  const data = await gql<R>(
    `query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{
      totalContributions weeks{ contributionDays{ date contributionCount contributionLevel } } } } } }`,
    { login: LOGIN },
  );
  const cal = data?.user?.contributionsCollection.contributionCalendar;
  if (cal) {
    return {
      total: cal.totalContributions,
      weeks: cal.weeks.map((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount, level: levels[d.contributionLevel] ?? 0 })),
      ),
    };
  }

  // Tokenless fallback: public contributions mirror.
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${LOGIN}?y=last`);
    if (!res.ok) return null;
    const j = (await res.json()) as { total: Record<string, number>; contributions: ContributionDay[] };
    const weeks: ContributionDay[][] = [];
    j.contributions.forEach((d, i) => {
      if (i % 7 === 0) weeks.push([]);
      weeks[weeks.length - 1].push(d);
    });
    return { total: j.total.lastYear ?? Object.values(j.total)[0] ?? 0, weeks };
  } catch {
    return null;
  }
}

export type RepoInfo = { name: string; stars: number; pushedAt: string; description: string | null; language: string | null };

export async function getRepos(): Promise<{
  repos: Record<string, RepoInfo>;
  totalStars: number;
  publicRepos: number;
  followers: number;
  latest: RepoInfo | null;
}> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");

  type U = { public_repos: number; followers: number };
  type Repo = { name: string; stargazers_count: number; pushed_at: string; description: string | null; language: string | null; fork: boolean };
  const [user, list] = await Promise.all([
    rest<U>(`/users/${LOGIN}`),
    rest<Repo[]>(`/users/${LOGIN}/repos?per_page=100&sort=pushed`),
  ]);
  const repos: Record<string, RepoInfo> = {};
  let totalStars = 0;
  let latest: RepoInfo | null = null;
  for (const r of list ?? []) {
    const info = { name: r.name, stars: r.stargazers_count, pushedAt: r.pushed_at, description: r.description, language: r.language };
    repos[r.name] = info;
    if (!r.fork) {
      totalStars += r.stargazers_count;
      if (!latest && r.name !== LOGIN) latest = info;
    }
  }
  return { repos, totalStars, publicRepos: user?.public_repos ?? 81, followers: user?.followers ?? 61, latest };
}

export type PR = { title: string; number: number; url: string; mergedAt: string };
export type UpstreamRepo = { repo: string; owner: string; stars: number; description: string | null; logo: string; prs: PR[] };

// Repos GitHub search sometimes misses; always checked in addition to the search.
const EXTRA_UPSTREAM = ["corsairdev/corsair", "NousResearch/hermes-agent", "astral-sh/ty", "apache/libcloud"];
const MIN_STARS = 1000;

/** Merged PRs into well-known repositories I don't own (1k+ stars), grouped by repo. */
export async function getUpstreamPRs(): Promise<UpstreamRepo[]> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");

  type Item = { title: string; number: number; html_url: string; repository_url: string; pull_request: { merged_at: string | null } };
  type S = { items: Item[] };
  const search = (q: string) => rest<S>(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=100`);

  const base = `author:${LOGIN} is:pr is:merged -user:${LOGIN}`;
  const results = await Promise.all([search(base), ...EXTRA_UPSTREAM.map((r) => search(`${base} repo:${r}`))]);
  const byRepo = new Map<string, PR[]>();
  for (const res of results) {
    for (const i of res?.items ?? []) {
      const repo = i.repository_url.replace("https://api.github.com/repos/", "");
      const list = byRepo.get(repo) ?? [];
      if (!list.some((p) => p.number === i.number)) {
        list.push({ title: i.title, number: i.number, url: i.html_url, mergedAt: i.pull_request.merged_at ?? "" });
      }
      byRepo.set(repo, list);
    }
  }

  type R = { stargazers_count: number; description: string | null; owner: { login: string; avatar_url: string } };
  const repos = await Promise.all(
    [...byRepo.keys()].map(async (repo) => {
      const info = await rest<R>(`/repos/${repo}`);
      if (!info || info.stargazers_count < MIN_STARS) return null;
      return {
        repo,
        owner: info.owner.login,
        stars: info.stargazers_count,
        description: info.description,
        logo: `${info.owner.avatar_url}${info.owner.avatar_url.includes("?") ? "&" : "?"}s=96`,
        prs: byRepo.get(repo)!.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt)),
      } satisfies UpstreamRepo;
    }),
  );
  return repos.filter((r): r is UpstreamRepo => !!r).sort((a, b) => b.stars - a.stars);
}

export type LeetCodeStats = { solved: number; easy: number; medium: number; hard: number; totals: Record<string, number>; ranking: number };

export async function getLeetCode(): Promise<LeetCodeStats | null> {
  "use cache";
  cacheTag("leetcode");
  cacheLife("hours");
  try {
    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
      body: JSON.stringify({
        query: `query($u:String!){ matchedUser(username:$u){ profile{ ranking } submitStatsGlobal{ acSubmissionNum{ difficulty count } } } allQuestionsCount{ difficulty count } }`,
        variables: { u: profile.leetcode },
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const u = j.data?.matchedUser;
    if (!u) return null;
    const ac: Record<string, number> = Object.fromEntries(u.submitStatsGlobal.acSubmissionNum.map((d: { difficulty: string; count: number }) => [d.difficulty, d.count]));
    const totals: Record<string, number> = Object.fromEntries(j.data.allQuestionsCount.map((d: { difficulty: string; count: number }) => [d.difficulty, d.count]));
    return { solved: ac.All ?? 0, easy: ac.Easy ?? 0, medium: ac.Medium ?? 0, hard: ac.Hard ?? 0, totals, ranking: u.profile.ranking };
  } catch {
    return null;
  }
}

export type RiverRepo = { name: string; weeks: number[]; total: number; lastWeek: number; isPrivate: boolean };

/**
 * Weekly activity per repository over the last 52 weeks, for the river.
 * Uses commit contributions by repository when a token is set, else public commit stats.
 */
export async function getRiver(): Promise<{ repos: RiverRepo[]; start: string } | null> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");

  const WEEKS = 52;
  const now = Date.now();
  const start = new Date(now - WEEKS * 7 * 864e5);
  const weekOf = (iso: string) => Math.min(WEEKS - 1, Math.max(0, Math.floor((Date.parse(iso) - start.getTime()) / (7 * 864e5))));

  type G = {
    user: {
      contributionsCollection: {
        commitContributionsByRepository: {
          repository: { name: string; isPrivate: boolean };
          contributions: { nodes: { occurredAt: string; commitCount: number }[] };
        }[];
      };
    };
  };
  const g = await gql<G>(
    `query($login:String!,$from:DateTime!){ user(login:$login){ contributionsCollection(from:$from){
      commitContributionsByRepository(maxRepositories:25){ repository{ name isPrivate }
        contributions(first:100){ nodes{ occurredAt commitCount } } } } } }`,
    { login: LOGIN, from: start.toISOString() },
  );

  let repos: RiverRepo[] = [];
  if (g?.user) {
    repos = g.user.contributionsCollection.commitContributionsByRepository.map((r) => {
      const weeks = new Array(WEEKS).fill(0);
      for (const n of r.contributions.nodes) weeks[weekOf(n.occurredAt)] += n.commitCount;
      return { name: r.repository.name, weeks, total: 0, lastWeek: 0, isPrivate: r.repository.isPrivate };
    });
  } else {
    // Tokenless: public weekly commit stats for the most recently pushed repositories.
    type Repo = { name: string; fork: boolean };
    const list = (await rest<Repo[]>(`/users/${LOGIN}/repos?per_page=30&sort=pushed`)) ?? [];
    const own = list.filter((r) => !r.fork && r.name !== LOGIN).slice(0, 14);
    const stats = await Promise.all(
      own.map(async (r) => {
        const s = await rest<{ week: number; total: number }[]>(`/repos/${LOGIN}/${r.name}/stats/commit_activity`);
        if (!Array.isArray(s)) return null;
        const weeks = new Array(WEEKS).fill(0);
        for (const w of s) weeks[weekOf(new Date(w.week * 1000).toISOString())] += w.total;
        return { name: r.name, weeks, total: 0, lastWeek: 0, isPrivate: false };
      }),
    );
    repos = stats.filter((x): x is RiverRepo => !!x);
  }

  for (const r of repos) {
    r.total = r.weeks.reduce((a, b) => a + b, 0);
    r.lastWeek = r.weeks.reduce((last, v, i) => (v > 0 ? i : last), -1);
  }
  repos = repos.filter((r) => r.total > 0).sort((a, b) => b.total - a.total).slice(0, 9);
  if (!repos.length) return null;
  return { repos, start: start.toISOString() };
}

/** Total stars across every Beatrice repository, from the Beatrice website's own API. */
export async function getBeatriceStars(): Promise<number | null> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");
  try {
    const res = await fetch("https://project-beatrice.vercel.app/api/stars");
    if (!res.ok) return null;
    const j = (await res.json()) as { total?: number };
    return typeof j.total === "number" ? j.total : null;
  } catch {
    return null;
  }
}
