"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { profile, roles } from "@/data/profile";

export function RoleTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % roles.length), 2200);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-flex h-4 overflow-hidden align-bottom text-accent">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="block"
        >
          {roles[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function CopyEmail({ big = false }: { big?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(profile.email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          window.location.href = `mailto:${profile.email}`;
        }
      }}
      className={`inline-flex items-center gap-2 bg-fg font-medium text-bg transition-transform active:scale-95 ${
        big ? "px-5 py-3 text-base" : "px-3.5 py-2 text-sm"
      }`}
      data-cursor={copied ? "copied!" : "copy"}
    >
      <span className="font-pixel">{copied ? "✓" : "@"}</span>
      {copied ? "Email copied" : big ? profile.email : "Copy email"}
    </button>
  );
}

export function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const s = Date.now() - Date.parse(iso);
    const h = Math.floor(s / 3.6e6);
    const d = Math.floor(h / 24);
// eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only state after hydration
    setLabel(h < 1 ? "just now" : h < 24 ? `${h}h ago` : d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`);
  }, [iso]);
  return <span className={className}>{label}</span>;
}
