export const profile = {
  name: "Jatin Pandey",
  handle: "satiricalguru",
  initials: "JP",
  role: "AI & Full-Stack Developer",
  tagline: "Building things, breaking things, and occasionally fixing them.",
  location: "Jaipur, India",
  timezone: "Asia/Kolkata",
  email: "jatinjio1212@gmail.com",
  education: "B.Tech CSE · Manipal University Jaipur",
  status: "Open to work",
  socials: [
    { label: "GitHub", href: "https://github.com/satiricalguru" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jatin-pandey-66328141a/" },
    { label: "X", href: "https://x.com/JayDevSG" },
    { label: "LeetCode", href: "https://leetcode.com/u/KiKISJ3blF/" },
    { label: "Email", href: "mailto:jatinjio1212@gmail.com" },
  ],
  leetcode: "KiKISJ3blF",
  sponsorUrl: "https://github.com/sponsors/satiricalguru",
};

export const roles = ["AI tinkerer", "CTF grinder", "native app builder", "reverse engineer", "open-source contributor"];

export type Category = "AI & Agents" | "Native & Desktop" | "Real-time Audio" | "Security" | "Web & 3D";

export type Project = {
  repo: string;
  name: string;
  blurb: string;
  category: Category;
  stack: string[];
  live?: string;
  image?: string;
  video?: string;
};

export const projects: Project[] = [
  {
    repo: "Synthid-remover",
    image: "/projects/Synthid-remover.jpg",
    name: "SynthID Remover",
    blurb: "Strips AI watermarks, C2PA Content Credentials and SynthID frequency signals — 100% on your machine.",
    category: "Security",
    stack: ["TypeScript", "Signal processing", "Local-first"],
  },
  {
    repo: "Beatrice-voicechanger-windows",
    image: "/projects/Beatrice-voicechanger-windows.jpg",
    name: "Project Beatrice",
    blurb: "Real-time AI voice changer: 112 voices, ~10 ms latency, fully on-device, for Windows and macOS.",
    category: "Real-time Audio",
    stack: ["Electron", "Python", "VST3", "three.js"],
    live: "https://project-beatrice.vercel.app",
  },
  {
    repo: "Brawlverse",
    image: "/projects/Brawlverse.jpg",
    name: "Brawlverse",
    blurb: "A 3D web brawler built with Three.js, Blender MCP and Tripo 3D assets, with cinematic cutscenes.",
    category: "Web & 3D",
    stack: ["Three.js", "Blender", "Python"],
    live: "https://brawlverse.vercel.app",
  },
  {
    repo: "Forge",
    image: "/projects/Forge.jpg",
    name: "Forge",
    blurb: "A local-first AI IDE forked from VS Code. Works offline with Ollama, LM Studio and vLLM. Telemetry removed.",
    category: "AI & Agents",
    stack: ["TypeScript", "VS Code", "Ollama"],
  },
  {
    repo: "Jarvis",
    image: "/projects/Jarvis.jpg",
    name: "Jarvis",
    blurb: "A holographic Three.js assistant with voice cloning, TTS and real macOS system actions.",
    category: "AI & Agents",
    stack: ["Python", "Three.js", "TTS"],
  },
  {
    repo: "Vantage",
    image: "/projects/Vantage.jpg",
    video: "/projects/Vantage.mp4",
    name: "Vantage",
    blurb: "Fast, free live wallpapers for macOS that render beneath your desktop icons.",
    category: "Native & Desktop",
    stack: ["TypeScript", "macOS", "Native"],
  },
  {
    repo: "OpenBot",
    image: "/projects/OpenBot.jpg",
    video: "/projects/OpenBot.mp4",
    name: "OpenBot",
    blurb: "Open-source AI teammates, each with its own sandboxed computer. Runs 100% locally with Ollama.",
    category: "AI & Agents",
    stack: ["Electron", "Ollama", "Agents"],
  },
  {
    repo: "Wraith",
    image: "/projects/Wraith.jpg",
    name: "Wraith",
    blurb: "A grounding-first AI reverse-engineering co-pilot for Ghidra and Cutter.",
    category: "Security",
    stack: ["Python", "Ghidra", "LLMs"],
  },
  {
    repo: "Frontend-Library",
    image: "/projects/Frontend-Library.jpg",
    video: "/projects/Frontend-Library.mp4",
    name: "Frontend Library",
    blurb: "14,500+ curated frontend assets — components, motion, fonts and templates — with live previews.",
    category: "Web & 3D",
    stack: ["Three.js", "CSS", "Vercel"],
    live: "https://frontendlibrary.vercel.app",
  },
  {
    repo: "MangaDock",
    image: "/projects/MangaDock.jpg",
    video: "/projects/MangaDock.mp4",
    name: "MangaDock",
    blurb: "A free, ad-free, open-source reader for manga, manhwa and manhua.",
    category: "Native & Desktop",
    stack: ["TypeScript", "Next.js"],
    live: "https://mangadock.vercel.app",
  },
  {
    repo: "FloodSetu",
    image: "/projects/FloodSetu.jpg",
    video: "/projects/FloodSetu.mp4",
    name: "FloodSetu",
    blurb: "Multi-agent flood rescue dispatch with Contract-Net auctions, offline SOS and a tamper-evident relief ledger.",
    category: "AI & Agents",
    stack: ["TypeScript", "Multi-agent"],
    live: "https://floodsetu.vercel.app",
  },
  {
    repo: "RVC-Voicechanger",
    image: "/projects/RVC-Voicechanger.jpg",
    video: "/projects/RVC-Voicechanger.mp4",
    name: "RVC Voice Changer",
    blurb: "A desktop voice changer using retrieval-based voice conversion and a Spotify Pedalboard DSP chain.",
    category: "Real-time Audio",
    stack: ["TypeScript", "Python", "DSP"],
  },
];

export const journey = [
  {
    date: "Nov 2026",
    title: "Hermes Agent Plugin Hackathon",
    org: "Nous Research",
    text: "Built Dropstation: drop a file into a folder and Hermes runs that folder's task. Merged upstream.",
    tag: "Merged",
  },
  {
    date: "Nov 2026",
    title: "Project Beatrice 2.2",
    org: "Open source launch",
    text: "Rebuilt the app and website: 112 voices, ~10 ms latency, a WebGL site in 3 languages, MIT-licensed.",
    tag: "Shipped",
  },
  {
    date: "Oct 2026",
    title: "Code-e-Manipal 2.0",
    org: "Manipal University Jaipur",
    text: "A 36-hour hackathon run by the Dept. of IT and LearnIT Club, MUJ.",
    tag: "Hackathon",
  },
  {
    date: "Oct 2026",
    title: "PromptWars Virtual · Challenge 5",
    org: "Google for Developers × Hack2skill",
    text: "Utsav AI: a deterministic budget engine plus Gemini for the personal touches. 14 languages, 110 tests.",
    tag: "Built",
  },
  {
    date: "Sep 2026",
    title: "Smart India Hackathon · Internals",
    org: "MoSPI · SIH26056",
    text: "A real-time Airfare Price Index for India: scraped fares → Jevons micro-indices → a weighted national CPI.",
    tag: "Hackathon",
  },
  {
    date: "Aug 2026",
    title: "HackBlox 2026",
    org: "Finalist",
    text: "Proofline: wallet-bound credentials with an issuer hierarchy, IPFS integrity and revocation.",
    tag: "Finalist",
  },
];

export const certifications = [
  { name: "Model Context Protocol: Advanced Topics", issuer: "Anthropic", logo: "/logos/anthropic.svg" },
  { name: "Claude 101", issuer: "Anthropic", logo: "/logos/anthropic.svg" },
  { name: "AI Foundations", issuer: "OpenAI", logo: "/logos/openai.svg" },
  { name: "AI Fundamentals", issuer: "IBM SkillsBuild", logo: "/logos/ibm.jpg" },
  { name: "Web Development Fundamentals", issuer: "IBM SkillsBuild", logo: "/logos/ibm.jpg" },
  { name: "Google Analytics", issuer: "Google", logo: "/logos/googleanalytics.svg" },
  { name: "Intro to Programming with Python", issuer: "Kaggle", logo: "/logos/kaggle.svg" },
];

export const skills: Record<string, string[]> = {
  Languages: ["Python", "TypeScript", "JavaScript", "Swift", "C++", "Java", "C", "SQL"],
  "Web & 3D": ["React", "Next.js", "Node.js", "Express", "Three.js", "WebGL", "Tailwind CSS"],
  "AI & Agents": ["LLMs", "MCP", "Ollama", "LangGraph", "Gemini", "RAG", "Whisper / TTS"],
  "Native & Audio": ["Electron", "SwiftUI", "AppKit", "DSP", "VST3", "Real-time audio"],
  Security: ["Ghidra", "Cutter", "Reverse engineering", "CTFs", "Forensics"],
  Tools: ["Git", "Docker", "Vercel", "Blender", "Figma", "Linux / macOS"],
};

export const fallbackSponsors = [
  { login: "Mxhi-04", name: "Mahi Patni", avatarUrl: "https://avatars.githubusercontent.com/u/249584456?v=4" },
  { login: "JayDev-27", name: "JoJo", avatarUrl: "https://avatars.githubusercontent.com/u/279688498?v=4" },
];
