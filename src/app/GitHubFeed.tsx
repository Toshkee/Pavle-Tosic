"use client";

import { memo, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* Live activity lines — the newest public GitHub events for @Toshkee rendered
   as terminal log output under the contribution graph ("tail -f github.log"
   made literal). Unauthenticated API (60 req/h per client IP is plenty for a
   portfolio view); on any failure the feed simply doesn't render, the graph
   above still carries the section. */

const USER = "Toshkee";
const MAX_LINES = 5;

type Line = { id: string; time: string; text: string; repo: string };

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

type GhEvent = {
  id: string;
  type: string;
  created_at: string;
  repo?: { name?: string };
  payload?: {
    // The events API reports push size in `size`; the `commits` array is
    // capped (and sometimes omitted), so it can't be counted directly.
    size?: number;
    commits?: unknown[];
    action?: string;
    ref_type?: string;
    ref?: string | null;
    pull_request?: { number?: number };
  };
};

// One log verb per event type; unknown/noisy event types are skipped.
function describe(e: GhEvent): string | null {
  const p = e.payload ?? {};
  switch (e.type) {
    case "PushEvent": {
      const n = p.size ?? p.commits?.length ?? 0;
      return n > 0 ? `push ${n} commit${n === 1 ? "" : "s"}` : "push";
    }
    case "CreateEvent":
      return p.ref_type === "repository"
        ? "create repo"
        : `create ${p.ref_type ?? "ref"} ${p.ref ?? ""}`.trimEnd();
    case "PullRequestEvent":
      return `pr ${p.action ?? ""}${
        p.pull_request?.number ? ` #${p.pull_request.number}` : ""
      }`.trim();
    case "IssuesEvent":
      return `issue ${p.action ?? ""}`.trim();
    case "ReleaseEvent":
      return `release ${p.action ?? ""}`.trim();
    case "ForkEvent":
      return "fork";
    case "PublicEvent":
      return "open-sourced";
    default:
      return null;
  }
}

function GitHubFeed() {
  const reduce = useReducedMotion();
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    fetch(`https://api.github.com/users/${USER}/events/public?per_page=30`, {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((events: GhEvent[]) => {
        const out: Line[] = [];
        for (const e of events) {
          const text = describe(e);
          if (!text) continue;
          out.push({
            id: e.id,
            time: relTime(e.created_at),
            text,
            repo: e.repo?.name ?? "",
          });
          if (out.length >= MAX_LINES) break;
        }
        setLines(out);
      })
      .catch(() => {
        /* offline / rate-limited — render nothing */
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  if (lines.length === 0) return null;

  return (
    <ul
      aria-label="Latest GitHub activity"
      className="mt-6 space-y-1.5 font-mono text-[13px]"
    >
      {lines.map((l, i) => (
        <motion.li
          key={l.id}
          initial={reduce ? false : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 + i * 0.12 }}
          className="flex flex-wrap items-baseline gap-x-3"
        >
          <span className="w-7 shrink-0 text-right text-faint">{l.time}</span>
          <span className="text-accent-ink">{l.text}</span>
          <span className="truncate text-muted">→ {l.repo}</span>
        </motion.li>
      ))}
    </ul>
  );
}

export default memo(GitHubFeed);
