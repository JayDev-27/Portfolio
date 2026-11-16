import { Suspense } from "react";
import { Nav } from "@/components/nav";
import { Section } from "@/components/section";
import { Hero, Intro } from "@/components/sections/hero";
import { Stats, Activity, LeetCode } from "@/components/sections/stats";
import { Projects } from "@/components/sections/projects";
import { Journey, OpenSource, Skills, Certifications } from "@/components/sections/lists";
import { SponsorWall } from "@/components/sections/sponsors";
import { Contact, Footer } from "@/components/sections/contact";
import { projects } from "@/data/profile";
import { getContributions, getLeetCode, getRepos, getRiver, getBeatriceStars, getSponsors, getUpstreamPRs } from "@/lib/github";
import { River } from "@/components/sections/river";
import { Interests } from "@/components/sections/interests";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Suspense fallback={<Intro latest={null} />}>
          <IntroData />
        </Suspense>

        <Section index="01 · Activity" title="Commit log" kicker="Live from GitHub and LeetCode. Hover a day to see the count.">
          <Suspense fallback={<Placeholder h={260} />}>
            <ActivityData />
          </Suspense>
        </Section>

        <Section index="01b · Flow" title="The river" kicker="Where my commits went this year. Hover a lane for weekly detail.">
          <Suspense fallback={<Placeholder h={300} />}>
            <RiverData />
          </Suspense>
        </Section>

        <Section id="work" index="02 · Work" title="Selected projects" kicker="Most run locally. Hover a card to reveal it.">
          <Suspense fallback={<Projects projects={projects} stars={{}} />}>
            <ProjectsData />
          </Suspense>
        </Section>

        <Section id="journey" index="03 · Journey" title="Hackathons & launches" kicker="First-year CSE, already shipping.">
          <Journey />
        </Section>

        <Section id="open-source" index="04 · Open source" title="Merged upstream" kicker="Merged pull requests in well-known projects (1k+ stars).">
          <Suspense fallback={<Placeholder h={300} />}>
            <PRData />
          </Suspense>
        </Section>

        <Section index="05 · Toolkit" title="Skills & stack">
          <Skills />
        </Section>

        <Section index="06 · Learning" title="Certifications">
          <Certifications />
        </Section>

        <Section id="off-the-clock" index="06b · Off the clock" title="Things I love" kicker="Hover each one. There's a little surprise in every card.">
          <Interests />
        </Section>

        <Section id="sponsors" index="07 · Sponsors" title="Pixel hall of fame" kicker="People who back my open-source work. Each one becomes a pixel portrait.">
          <Suspense fallback={<Placeholder h={200} />}>
            <SponsorData />
          </Suspense>
        </Section>

        <Contact />
      </main>
      <Footer />
    </>
  );
}

function Placeholder({ h }: { h: number }) {
  return <div className="stripes mx-4 mb-6 animate-pulse border border-line sm:mx-6" style={{ height: h }} />;
}

async function IntroData() {
  const { latest } = await getRepos();
  return <Intro latest={latest} />;
}

async function ActivityData() {
  const [cal, repos, lc] = await Promise.all([getContributions(), getRepos(), getLeetCode()]);
  return (
    <>
      <Stats repos={repos.publicRepos} stars={repos.totalStars} followers={repos.followers} contributions={cal?.total ?? 0} />
      {cal && <Activity weeks={cal.weeks} total={cal.total} />}
      {lc && <LeetCode stats={lc} />}
    </>
  );
}

async function RiverData() {
  const river = await getRiver();
  if (!river)
    return (
      <p className="px-4 pb-8 font-mono text-[11px] text-faint sm:px-6">
        The river is waiting for GitHub to finish counting. Check back in a minute.
      </p>
    );
  return <River repos={river.repos} start={river.start} />;
}

async function ProjectsData() {
  const [{ repos }, beatrice] = await Promise.all([getRepos(), getBeatriceStars()]);
  const stars = Object.fromEntries(Object.values(repos).map((r) => [r.name, r.stars]));
  // Beatrice spans several repos and an organisation; show the combined count.
  if (beatrice !== null) stars["Beatrice-voicechanger-windows"] = beatrice;
  return <Projects projects={projects} stars={stars} />;
}

async function PRData() {
  const repos = await getUpstreamPRs();
  return <OpenSource repos={repos} />;
}

async function SponsorData() {
  const { sponsors, live } = await getSponsors();
  return <SponsorWall sponsors={sponsors} live={live} />;
}
