"use client";

import { useEffect, useState } from "react";
import { SiGithub } from "react-icons/si";

/* Live GitHub contribution heatmap for `Toshkee`, themed green on the dark
   base and framed in the same terminal-window chrome as the Stack/Work panels.
   Data: github-contributions-api.jogruber.de (public, no auth), fetched on the
   client with a timeout + graceful fallback so a third-party outage never
   breaks the page. Fetched with no-store (the browser's HTTP cache served
   days-stale counts) behind a short module-level TTL cache, since the deck
   remounts this section on every flip. Cells fade in on a short contained
   diagonal wave. */

const USER = "Toshkee";
const PROFILE = "https://github.com/Toshkee";

// level 0..4 → empty(faint) → bright phosphor green (on the dark base).
const LEVEL_COLORS = [
  "rgba(160, 220, 170, 0.08)",
  "#0f3d22",
  "#1a7a3e",
  "#22c55e",
  "#5cf08a",
];

type Day = { date: string; count: number; level: number };

// Module-level cache: instant on quick deck flips (state seeds from it on
// remount), refetched after the TTL / on a fresh page load, so the count
// tracks GitHub near-live. Only ever populated client-side.
let cached: { days: Day[]; total: number; at: number } | null = null;
const CACHE_TTL = 5 * 60_000;
const freshCache = () =>
  cached && Date.now() - cached.at < CACHE_TTL ? cached : null;

export default function GitHubGraph() {
  const [days, setDays] = useState<Day[] | null>(() => freshCache()?.days ?? null);
  const [total, setTotal] = useState<number | null>(
    () => freshCache()?.total ?? null
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (freshCache()) return; // state already seeded from the cache
    let alive = true;
    const ctrl = new AbortController();
    // Bound the third-party call: fall through to the graceful state if it hangs.
    const timeout = setTimeout(() => ctrl.abort(), 6000);
    fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`, {
      signal: ctrl.signal,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((j: { total?: Record<string, number>; contributions: Day[] }) => {
        if (!alive) return;
        const all = Array.isArray(j.contributions) ? j.contributions : [];
        // Trim the empty lead: show from 1 September of the current cycle to
        // today, so the active stretch reads as full rather than mostly empty.
        const now = new Date();
        const startYear =
          now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const cutoff = `${startYear}-09-01`;
        const list = all.filter((d) => d.date >= cutoff);
        const sum = list.reduce((s, d) => s + (d.count || 0), 0);
        cached = { days: list, total: sum, at: Date.now() };
        setDays(list);
        setTotal(sum);
      })
      .catch(() => {
        if (!alive) return;
        // An expired cache still beats an empty section on a network hiccup.
        if (cached) {
          setDays(cached.days);
          setTotal(cached.total);
        } else {
          setFailed(true);
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      alive = false;
      ctrl.abort();
      clearTimeout(timeout);
    };
  }, []);

  // Pad the first column so weekday rows line up (0 = Sunday).
  const leadOffset = days?.length
    ? new Date(days[0].date + "T00:00:00Z").getUTCDay()
    : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      {/* window chrome — matches the Stack/Work panels */}
      <div className="flex items-center gap-1.5 border-b border-line/70 bg-bg/50 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-faint/70" />
        <span className="h-2 w-2 rounded-full bg-accent/70" />
        <span className="h-2 w-2 rounded-full bg-accent-2/70" />
        <span className="ml-2 font-mono text-[11px] text-muted">
          contributions.log
        </span>
        <a
          href={PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-ink"
        >
          <SiGithub aria-hidden /> @{USER} ↗
        </a>
      </div>

      <div className="p-5 sm:p-7">
        <p className="text-sm text-body">
          {total != null ? (
            <>
              <span className="font-semibold text-ink">{total}</span>{" "}
              contributions since September
            </>
          ) : failed ? (
            "Contributions on GitHub"
          ) : (
            "Loading contributions…"
          )}
        </p>

        {failed ? null : (
          <div className="mt-5 overflow-x-auto pb-1">
            <div
              className="grid grid-flow-col grid-rows-7 gap-[3px]"
              role="img"
              aria-label={
                total != null
                  ? `${total} GitHub contributions since September`
                  : "GitHub contribution graph"
              }
            >
              {Array.from({ length: leadOffset }).map((_, i) => (
                <span key={`pad-${i}`} className="h-3 w-3" />
              ))}
              {(days ?? Array.from({ length: 371 }, () => null)).map((d, i) => {
                if (!d) {
                  // static skeleton cell (no per-cell pulse animation)
                  return (
                    <span
                      key={`skeleton-${i}`}
                      className="h-3 w-3 rounded-[2px]"
                      style={{ backgroundColor: LEVEL_COLORS[0] }}
                    />
                  );
                }
                const gi = leadOffset + i;
                const delay = Math.min(
                  (Math.floor(gi / 7) + (gi % 7)) * 0.01,
                  0.9
                );
                return (
                  <span
                    key={d.date}
                    className="gh-cell h-3 w-3 rounded-[2px]"
                    style={{
                      backgroundColor: LEVEL_COLORS[d.level] ?? LEVEL_COLORS[0],
                      animationDelay: `${delay}s`,
                    }}
                    title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <span>Less</span>
          {LEVEL_COLORS.map((c, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-[2px]"
              style={{ backgroundColor: c }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
