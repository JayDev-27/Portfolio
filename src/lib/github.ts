import { cacheLife, cacheTag } from "next/cache";
import { fallbackSponsors, mainAccountSuspended, profile } from "@/data/profile";
import { archive } from "@/data/archive";

/** Live data comes from the active account; while the main one is suspended, the archive fills in its history. */
const LOGIN = profile.handle;
const SPONSOR_LOGIN = profile.mainHandle;
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
  const get = (auth: boolean) =>
    fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(auth && t ? { Authorization: `Bearer ${t}` } : {}),
      },
    });
  try {
    let res = await get(true);
    // A revoked token (e.g. one from a suspended account) fails every call; public data still works without it.
    if (res.status === 401 && t) res = await get(false);
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
    { login: SPONSOR_LOGIN },
  );
  if (!data?.user) {
    // Tokenless: read the public GitHub Sponsors page.
    try {
      const res = await fetch(`https://github.com/sponsors/${SPONSOR_LOGIN}`, { headers: { "User-Agent": "portfolio" } });
      if (res.ok) {
        const html = await res.text();
        const logins = [...new Set([...html.matchAll(/alt="@([A-Za-z0-9-]+)"/g)].map((m) => m[1]))].filter(
          (l) => l.toLowerCase() !== SPONSOR_LOGIN.toLowerCase(),
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

/** Re-bucket counts into GitHub-style quartile levels after merging two calendars. */
function withLevels(weeks: ContributionDay[][]): ContributionDay[][] {
  const counts = weeks.flat().map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p: number) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return weeks.map((w) =>
    w.map((d) => ({ ...d, level: d.count === 0 ? 0 : d.count <= q1 ? 1 : d.count <= q2 ? 2 : d.count <= q3 ? 3 : 4 })),
  );
}

/** Live calendar of the active account plus the archived main-account calendar, day by day. */
export async function getContributions(): Promise<{ total: number; weeks: ContributionDay[][] } | null> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");

  const live = await getLiveContributions();
  if (!mainAccountSuspended) return live;

  const old = new Map(archive.calendar);
  let weeks: ContributionDay[][];
  if (live) {
    weeks = live.weeks.map((w) => w.map((d) => ({ ...d, count: d.count + (old.get(d.date) ?? 0) })));
  } else {
    weeks = [];
    archive.calendar.forEach(([date, count], i) => {
      if (i % 7 === 0) weeks.push([]);
      weeks[weeks.length - 1].push({ date, count, level: 0 });
    });
  }
  return { total: archive.contributions + (live?.total ?? 0), weeks: withLevels(weeks) };
}

async function getLiveContributions(): Promise<{ total: number; weeks: ContributionDay[][] } | null> {
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

  // Tokenless fallback 1: live GitHub profile contributions fragment (includes private contributions if enabled).
  try {
    const res = await fetch(`https://github.com/users/${LOGIN}/contributions`, { headers: { "User-Agent": "portfolio" } });
    if (res.ok) {
      const html = await res.text();
      const totalMatch = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)/);
      const tips = new Map<string, number>();
      for (const m of html.matchAll(/for="(contribution-day-component-[^"]+)"[^>]*>([^<]+)</g)) {
        const cm = m[2].match(/^(\d+)\s+contribution/);
        tips.set(m[1], cm ? Number(cm[1]) : 0);
      }
      const days: ContributionDay[] = [];
      for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="(contribution-day-component-[^"]+)"[^>]*data-level="(\d+)"/g)) {
        days.push({ date: m[1], count: tips.get(m[2]) ?? 0, level: Number(m[3]) });
      }
      days.sort((a, b) => a.date.localeCompare(b.date));
      if (days.length > 0) {
        const weeks: ContributionDay[][] = [];
        days.forEach((d, i) => {
          if (i % 7 === 0) weeks.push([]);
          weeks[weeks.length - 1].push(d);
        });
        const total = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : days.reduce((s, d) => s + d.count, 0);
        return { total, weeks };
      }
    }
  } catch {}

  // Tokenless fallback 2: public contributions mirror.
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
  if (!mainAccountSuspended) {
    return { repos, totalStars, publicRepos: user?.public_repos ?? archive.publicRepos, followers: user?.followers ?? archive.followers, latest };
  }

  // Main account history from the archive, plus anything new on the backup account.
  for (const [name, stars] of Object.entries(archive.stars)) {
    const r = repos[name];
    if (r) r.stars += stars;
    else repos[name] = { name, stars, pushedAt: "", description: null, language: null };
    totalStars += stars;
  }
  return {
    repos,
    totalStars,
    publicRepos: Math.max(archive.publicRepos, user?.public_repos ?? 0),
    followers: archive.followers + (user?.followers ?? 0),
    latest,
  };
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
  const found = repos.filter((r): r is UpstreamRepo => !!r);

  if (mainAccountSuspended) {
    // GitHub hides a suspended account's pull requests, so the main account's merged PRs come from the archive.
    // Their PR pages 404 until the account is restored, so they link to the project instead.
    const archived = await Promise.all(
      archive.upstream.map(async (a) => {
        const info = await rest<R>(`/repos/${a.repo}`);
        const prs: PR[] = a.prs.map((p) => ({ title: p.title, number: p.number, url: `https://github.com/${a.repo}`, mergedAt: p.mergedAt }));
        return {
          repo: a.repo,
          owner: info?.owner.login ?? a.repo.split("/")[0],
          stars: info?.stargazers_count ?? a.stars,
          description: info?.description ?? a.description,
          logo: info ? `${info.owner.avatar_url}${info.owner.avatar_url.includes("?") ? "&" : "?"}s=96` : `https://avatars.githubusercontent.com/u/${a.ownerId}?s=96`,
          prs,
        } satisfies UpstreamRepo;
      }),
    );
    for (const a of archived) {
      const same = found.find((f) => f.repo === a.repo);
      if (same) same.prs = [...same.prs, ...a.prs.filter((p) => !same.prs.some((s) => s.number === p.number))].sort((x, y) => y.mergedAt.localeCompare(x.mergedAt));
      else found.push(a);
    }
  }
  return found.sort((a, b) => b.stars - a.stars);
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
        const path = `/repos/${LOGIN}/${r.name}/stats/commit_activity`;
        let s = await rest<{ week: number; total: number }[]>(path);
        // GitHub answers 202 with an empty body while it computes stats for a repo it hasn't counted yet.
        if (!Array.isArray(s)) {
          await new Promise((res) => setTimeout(res, 3000));
          s = await rest<{ week: number; total: number }[]>(path);
        }
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
