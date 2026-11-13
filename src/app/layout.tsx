import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Pixelify_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const pixelify = Pixelify_Sans({ variable: "--font-pixelify", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jatin Pandey — AI & Full-Stack Developer",
  description:
    "Jatin Pandey (satiricalguru): local-first AI tools, native desktop apps, real-time audio and security tinkering. Building things, breaking things, and occasionally fixing them.",
  metadataBase: new URL("https://satiricalguru-portfolio.vercel.app"),
  openGraph: {
    title: "Jatin Pandey — AI & Full-Stack Developer",
    description: "Building things, breaking things, and occasionally fixing them.",
    images: ["/img/avatar.png"],
  },
  twitter: { card: "summary", creator: "@JayDevSG" },
};

export const viewport: Viewport = {
  themeColor: "#080606",
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${pixelify.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
