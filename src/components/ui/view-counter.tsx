"use client";

import { useEffect, useState } from "react";

const URL_BASE = "https://abacus.jasoncameron.dev";
const KEY = "jatin-pandey-portfolio/views";

let pending: Promise<number | null> | null = null;

/** One request per page load, shared by every counter on the page; one hit per browser session. */
function load(): Promise<number | null> {
  if (pending) return pending;
  let counted = false;
  try {
    counted = sessionStorage.getItem("view-counted") === "1" || location.hostname === "localhost";
    sessionStorage.setItem("view-counted", "1");
  } catch {}
  pending = fetch(`${URL_BASE}/${counted ? "get" : "hit"}/${KEY}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (typeof j?.value === "number" ? j.value : null))
    .catch(() => null);
  return pending;
}

export function ViewCounter({ className = "" }: { className?: string }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    load().then(setN);
  }, []);
  if (n === null) return null;
  return (
    <span className={className} title="Visits to this site">
      ◉ {n.toLocaleString("en-IN")} {n === 1 ? "view" : "views"}
    </span>
  );
}
