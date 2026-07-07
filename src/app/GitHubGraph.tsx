"use client";

import { useEffect, useState } from "react";
import { SiGithub } from "react-icons/si";

/* Live GitHub contribution cadence for `Toshkee`, themed green on the dark
   base and framed in the same terminal-window chrome as the Stack/Work panels.
   Data: github-contributions-api.jogruber.de (public, no auth), fetched on the
   client with a timeout + graceful fallback so a third-party outage never
   breaks the page. Fetched with no-store (the browser's HTTP cache served
   days-stale counts) behind a short module-level TTL cache, since the deck
   remounts this section on every flip.
   Shown as real stats + a WEEKLY strip, not the classic day grid: sparse days
   spread over months read as inactivity, while the weekly rhythm is honest
   AND healthy-looking. Cells fade in on a short left-to-right wave. */

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

  // Aggregate days → calendar weeks (split on Sundays; first week may be
  // partial) and derive the honest headline stats from the same data.
  const weeks: { start: string; count: number }[] = [];
  if (days) {
    for (const d of days) {
      const dow = new Date(d.date + "T00:00:00Z").getUTCDay();
      if (weeks.length === 0 || dow === 0) weeks.push({ start: d.date, count: 0 });
      weeks[weeks.length - 1].count += d.count || 0;
    }
  }
  const activeDays = days?.filter((d) => d.count > 0).length ?? 0;
  const busiest = days?.length ? Math.max(...days.map((d) => d.count)) : 0;
  const weekLevel = (c: number) =>
    c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 11 ? 3 : 4;
  const monthOf = (w: { start: string }) =>
    new Date(w.start + "T00:00:00Z").toLocaleString("en", {
      month: "short",
      timeZone: "UTC",
    });

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
        {/* Headline stats — all derived from the same live data as the strip. */}
        {total != null ? (
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {[
              { n: total, label: "contributions since September" },
              { n: activeDays, label: "active days" },
              { n: busiest, label: "on the busiest day" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl font-bold leading-none text-ink">
                  {s.n}
                </div>
                <div className="mt-1.5 font-mono text-xs text-muted">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-body">
            {failed ? "Contributions on GitHub" : "Loading contributions…"}
          </p>
        )}

        {failed ? null : (
          <div className="mt-6">
            <div
              className="flex gap-[3px]"
              role="img"
              aria-label={
                total != null
                  ? `${total} GitHub contributions since September, by week`
                  : "GitHub contribution graph"
              }
            >
              {(weeks.length
                ? weeks
                : Array.from({ length: 44 }, () => null)
              ).map((w, i) =>
                w ? (
                  <span
                    key={w.start}
                    className="gh-cell h-6 min-w-0 flex-1 rounded-[2px]"
                    style={{
                      backgroundColor: LEVEL_COLORS[weekLevel(w.count)],
                      animationDelay: `${Math.min(i * 0.02, 0.7)}s`,
                    }}
                    title={`${w.count} contribution${w.count === 1 ? "" : "s"} in the week of ${w.start}`}
                  />
                ) : (
                  // static skeleton cell (no per-cell pulse animation)
                  <span
                    key={`skeleton-${i}`}
                    className="h-6 min-w-0 flex-1 rounded-[2px]"
                    style={{ backgroundColor: LEVEL_COLORS[0] }}
                  />
                )
              )}
            </div>
            {/* month ticks — one label under the first week of each month */}
            {weeks.length > 0 && (
              <div className="mt-2 flex gap-[3px] font-mono text-[10px] text-faint">
                {weeks.map((w, i) => (
                  <span
                    key={w.start}
                    className="min-w-0 flex-1 overflow-visible whitespace-nowrap"
                  >
                    {i === 0 || monthOf(w) !== monthOf(weeks[i - 1])
                      ? monthOf(w)
                      : ""}
                  </span>
                ))}
              </div>
            )}
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
