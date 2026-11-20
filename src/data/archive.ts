import calendar from "./archive-contributions.json";

/**
 * Frozen snapshot of the main GitHub account (satiricalguru), taken when it was suspended in Nov 2026.
 * GitHub hides a suspended account's profile, repos and pull requests, so the live API returns nothing;
 * the site shows this snapshot and adds the backup account's live numbers on top.
 *
 * Sources: RESEARCH.md (13 Nov 2026), GitHub API output recorded while building this site, and the
 * public contributions mirror for the calendar. Star counts are the last known values (lower bounds).
 */
export const archive = {
  login: "satiricalguru",
  capturedAt: "2026-11-20",
  publicRepos: 81,
  followers: 61,
  /** contributionCalendar.totalContributions (includes private work) as of 13 Nov 2026. */
  contributions: 2568,
  /** Last known stars per repo; the repos listed as "4–6" use the lower bound. */
  stars: {
    "Synthid-remover": 30,
    "Beatrice-voicechanger-windows": 22,
    "RVC-Voicechanger": 16,
    "Agents-skills": 9,
    Jarvis: 8,
    OpenBot: 4,
    Vantage: 4,
    DriveVault: 4,
    Teardown: 4,
    "Agent-Swarm": 4,
  } as Record<string, number>,
  /** Daily public contribution counts, [date, count]. */
  calendar: calendar.days as [string, number][],
  /** Merged pull requests into projects with 1k+ stars. mergedAt is only used for ordering. */
  upstream: [
    {
      repo: "NousResearch/hermes-agent",
      stars: 264841,
      description: "The agent that grows with you",
      ownerId: 134168893,
      prs: [{ number: 150667, title: "plugin-catalog: add Dropstation folder inboxes", mergedAt: "2026-11-08" }],
    },
    {
      repo: "astral-sh/ty",
      stars: 20122,
      description: "An extremely fast Python type checker and language server, written in Rust.",
      ownerId: 115962839,
      prs: [{ number: 4978, title: "Update PyCharm setup instructions for 2026.3", mergedAt: "2026-11-09" }],
    },
    {
      repo: "corsairdev/corsair",
      stars: 15638,
      description: "Connect your users to their apps",
      ownerId: 238079011,
      // First seen merged on 13 Nov 2026; exact merge date not recorded.
      prs: [{ number: 1386, title: "feat(parseur): add Parseur integration", mergedAt: "2026-11-13" }],
    },
    {
      repo: "apache/libcloud",
      stars: 2129,
      description: "Apache Libcloud is a Python library that hides differences between different cloud provider APIs.",
      ownerId: 47359,
      prs: [{ number: 2221, title: "Fix bracketed IPv6 endpoint parsing", mergedAt: "2026-11-13" }],
    },
  ],
};
