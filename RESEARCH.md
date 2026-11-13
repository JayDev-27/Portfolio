# Portfolio research notes (2026-11-13)

## Reference: gitsaurabh.in (what to match, then beat)
Next.js + Tailwind + shadcn, dark, narrow centred column with dotted grid lines.
Sections in order:
1. Nav: pixel avatar, Work / Projects / Blogs
2. Hero canvas: pixel "SS" initials, "Hover me" (pixels scatter on hover)
3. Pixel-art avatar + name + role + theme toggle
4. Bio with bolded tech, Spotify "Last played", CTAs (Book a call, Resume), socials
5. GitHub contribution calendar (react-activity-calendar)
6. Experience accordion (logo, role, dates, bullets, tech chips)
7. Projects grid (preview image, Live badge, stack chips, View All)
8. Open Source: list of merged PRs
9. Skills & Technologies chips
10. Blogs, Testimonials marquee, About (gear, editor setup, movies), Newsletter, anime quote footer
- Cat: classic `oneko.js` gif sprite following cursor (fixed div)
- Bottom-right floating chat widget

## Jatin — GitHub (satiricalguru)
- Name: Jatin Pandey · India · hireable · X @JayDevSG
- Bio: "CTF Grinder | App & Web Developer | AI Tinkerer — Building things, breaking things, and occasionally fixing them."
- 81 public repos, 61 followers, 2,568 contributions this year
- Current portfolio: satiricalguru.vercel.app (DO NOT TOUCH), profile README (DO NOT TOUCH)
- Sponsors listing: yes. Current sponsors: Mxhi-04 (Mahi Patni), JayDev-27 (JoJo)
- Top repos by stars: Synthid-remover (30), Beatrice-voicechanger-windows (22), RVC-Voicechanger (16),
  Agents-skills (9), Jarvis (8), OpenBot / Vantage / DriveVault / Teardown / Agent-Swarm (4–6)
- Live projects: Brawlverse, Frontend-Library, Project Beatrice, MangaDock, FloodSetu, Voyara, Ai-atlas,
  Opencode-bridge, Aurora, Nexus-Web-Page, Pixeltunes, Higanbana (Japanese-style-portfolio), Aperture
- Upstream merged PRs: astral-sh/ty #4978, NousResearch/hermes-agent (Dropstation), Corsair #1386 (Parseur),
  hallofcodes/acode-ai-agent-plugin #11, Mxhi-04/Pixeltunes #1–2, Imara mobile app, JayDev-27/open-source-lab (30+)
- Themes from README: local-first AI, native desktop, real-time audio, security & reversing

## Jatin — LinkedIn
- Headline: CS Student @ Manipal University Jaipur | AI & Full-Stack Developer | Open Source Builder
- Jaipur, Rajasthan · 266 followers · first-year B.Tech CSE · Open to work
- Top skills: Python, AI, Full-Stack, React, Git. Also Java, C++, JS/TS, Node, Express, SQL
- No job experience listed → use "Journey / Hackathons" timeline instead:
  - HackBlox 2026 — finalist (Proofline)
  - SIH Internals 2026 (MoSPI Airfare CPI, Sep 7–8)
  - PromptWars Virtual Challenge 5 — Utsav AI
  - Code-e-Manipal 2.0 — 36h hackathon (Oct 15–16)
  - Hermes Agent Plugin Hackathon — Dropstation
  - Project Beatrice 2.2 launch (112 voices, ~10 ms, MIT)
  - MY Bharat Quiz VBYLD 2027 — 19/20
- Certifications (Aug 2026): Anthropic MCP Advanced Topics, Anthropic Claude 101, OpenAI AI Foundations,
  IBM Web Dev Fundamentals, IBM AI Fundamentals, Google Analytics, Kaggle Python

## Awwwards portfolio patterns worth borrowing
(codeofsagar.in, errormade.tech, abhayrohit.com, jaspreetsingh.xyz, lucaslima.design)
- Preloader with 000→100 counter, then curtain/reveal
- Lenis smooth scroll + scroll-linked reveals (text split by line/char)
- Live local time + cursor x/y readout in a corner HUD
- Sound toggle, full-screen menu overlay
- WebGL/canvas hero that reacts to the cursor
- Magnetic buttons, custom cursor that morphs over links/cards

## Build plan (proposed)
- Stack: Next.js (App Router) + Tailwind + Motion + Lenis, deployed on Vercel, repo `satiricalguru/Portfolio`
- Pixel identity: Jatin's photo pixelated on canvas; de-pixelates around the cursor
- Cursor effect: dotted grid where cells near the cursor light up / ripple; pixel trail
- Cat: original pixel-art cat (own sprite), states: idle, walk, run, sleep, groom, pounce on click,
  purrs when petted (hover), sits on section headings
- Sponsors: server route hits GitHub GraphQL (ISR) + GitHub Sponsors webhook → on-demand revalidate,
  avatars rendered as pixel art, "sponsor me" slot
- Live data: GitHub contribution calendar, repo stars, merged PRs pulled at build/ISR time
