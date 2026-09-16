"use client";

import { useEffect, useState } from "react";

/* The literal `tail -f github.log`: the public events feed, folded into one
   line per repo, busiest first (a one-off push to a side repo shouldn't
   outrank the project that got twenty). Public events only, so private
   client work never leaks here by accident. Same shape as GitHubGraph — a
   short module-level TTL cache so deck flips don't refetch, a bounded fetch,
   and an honest failure line instead of a dead skeleton. */

const USER = "Toshkee";
const PROFILE = "https://github.com/Toshkee";
const CACHE_TTL = 5 * 60_000;
const ROWS = 5;
// A repo has to carry at least this share of the window's pushes to be
// listed: the point is where the work is going, not every stray push.
const MIN_SHARE = 0.1;

type Event = {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: { ref?: string; ref_type?: string };
};

export type RepoRow = {
  repo: string; // "Toshkee/VillaVucje"
  name: string; // "VillaVucje"
  branch: string; // "main"
  pushes: number; // pushes to this repo inside the fetched window
  last: string; // ISO of the newest push
};

let cached: { rows: RepoRow[]; at: number } | null = null;
const freshCache = () =>
  cached && Date.now() - cached.at < CACHE_TTL ? cached : null;

/* Fold raw events → one row per repo, most pushes first, recency as the
   tie-break. Creates count as activity too (a new public repo is the most
   "in the open" thing there is). */
export function foldEvents(events: Event[]): RepoRow[] {
  const map = new Map<string, RepoRow>();
  for (const e of events) {
    if (e.type !== "PushEvent" && e.type !== "CreateEvent") continue;
    const ref = e.payload.ref?.replace(/^refs\/heads\//, "") ?? "";
    const cur = map.get(e.repo.name);
    if (cur) {
      cur.pushes += 1;
      if (e.created_at > cur.last) {
        cur.last = e.created_at;
        if (ref) cur.branch = ref;
      }
    } else {
      map.set(e.repo.name, {
        repo: e.repo.name,
        name: e.repo.name.replace(/^[^/]+\//, ""),
        branch: ref || "main",
        pushes: 1,
        last: e.created_at,
      });
    }
  }
  const all = [...map.values()];
  const total = all.reduce((n, r) => n + r.pushes, 0);
  return all
    .filter((r) => r.pushes >= Math.max(2, total * MIN_SHARE))
    .sort((a, b) => b.pushes - a.pushes || (a.last < b.last ? 1 : -1))
    .slice(0, ROWS);
}

export function relTime(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  if (s < 7 * 86_400) return `${Math.round(s / 86_400)}d ago`;
  return `${Math.round(s / (7 * 86_400))}w ago`;
}

export default function GitHubFeed() {
  const [rows, setRows] = useState<RepoRow[] | null>(
    () => freshCache()?.rows ?? null
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (freshCache()) return;
    let alive = true;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    fetch(`https://api.github.com/users/${USER}/events/public?per_page=60`, {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((j: unknown) => {
        if (!alive) return;
        const list = foldEvents(Array.isArray(j) ? (j as Event[]) : []);
        cached = { rows: list, at: Date.now() };
        setRows(list);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => clearTimeout(timeout));
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-line/70 bg-bg/50 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-faint/70" />
        <span className="h-2 w-2 rounded-full bg-accent/70" />
        <span className="h-2 w-2 rounded-full bg-accent-2/70" />
        <span className="ml-2 font-mono text-[11px] text-muted">activity.log</span>
        <span className="ml-auto font-mono text-[11px] text-faint">
          public repos · busiest first
        </span>
      </div>

      <div className="p-5 font-mono text-sm sm:p-7">
        <p className="text-muted">
          <span className="text-accent">$</span> git shortlog --since=recent
          --sort=pushes
          {failed && <span className="text-faint"> · connection timed out</span>}
        </p>

        {failed ? (
          <p className="mt-1 text-faint">
            the pushes are still there:{" "}
            <a
              href={PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-accent-ink"
            >
              github.com/{USER} ↗
            </a>
          </p>
        ) : rows == null ? (
          <ul className="mt-3 space-y-2" aria-hidden>
            {Array.from({ length: ROWS }, (_, i) => (
              <li key={i} className="h-4 w-3/4 rounded bg-bg/60" />
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <p className="mt-1 text-faint">quiet week. nothing public pushed.</p>
        ) : (
          <ol className="mt-3 space-y-1.5">
            {rows.map((r) => (
              <li
                key={r.repo}
                className="grid grid-cols-[4.5rem_1fr_auto] items-baseline gap-x-3 text-[13px] sm:text-sm"
              >
                <span className="text-faint">{relTime(r.last)}</span>
                <span className="min-w-0 truncate">
                  <a
                    href={`https://github.com/${r.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-ink"
                  >
                    {r.name}
                  </a>
                  <span className="text-faint"> @ {r.branch}</span>
                </span>
                <span className="text-accent-ink">
                  {r.pushes} push{r.pushes === 1 ? "" : "es"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
