"use client";

import { useEffect, useState } from "react";

/* Live GitHub contribution heatmap for `Toshkee`, themed to the amber palette.
   Data: github-contributions-api.jogruber.de (public, no auth). Fetched on the
   client with a graceful fallback so a third-party outage never breaks the page. */

const USER = "Toshkee";
const PROFILE = "https://github.com/Toshkee";

// level 0..4 → cream(empty) → burnt amber. Never GitHub green.
const LEVEL_COLORS = [
  "rgba(33, 28, 22, 0.07)",
  "#f0c89a",
  "#e6a464",
  "#e0853a",
  "#a14d0c",
];

type Day = { date: string; count: number; level: number };

export default function GitHubGraph() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((j: { total?: Record<string, number>; contributions: Day[] }) => {
        if (!alive) return;
        const list = Array.isArray(j.contributions) ? j.contributions : [];
        setDays(list);
        setTotal(
          j.total?.lastYear ??
            list.reduce((s, d) => s + (d.count || 0), 0)
        );
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  // Pad the first column so weekday rows line up (0 = Sunday).
  const leadOffset = days?.length
    ? new Date(days[0].date + "T00:00:00Z").getUTCDay()
    : 0;

  return (
    <div className="glass rounded-2xl p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-body">
          {total != null ? (
            <>
              <span className="font-semibold text-ink">{total}</span>{" "}
              contributions in the last year
            </>
          ) : failed ? (
            "Contributions on GitHub"
          ) : (
            "Loading contributions…"
          )}
        </p>
        <a
          href={PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline text-sm font-medium text-accent-ink"
        >
          @{USER} ↗
        </a>
      </div>

      {failed ? null : (
        <div className="mt-5 overflow-x-auto pb-1">
          <div
            className="grid grid-flow-col grid-rows-7 gap-[3px]"
            role="img"
            aria-label={
              total != null
                ? `${total} GitHub contributions in the last year`
                : "GitHub contribution graph"
            }
          >
            {Array.from({ length: leadOffset }).map((_, i) => (
              <span key={`pad-${i}`} className="h-3 w-3" />
            ))}
            {(days ?? Array.from({ length: 371 }, () => null)).map((d, i) =>
              d ? (
                <span
                  key={d.date}
                  className="h-3 w-3 rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[d.level] ?? LEVEL_COLORS[0] }}
                  title={`${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}`}
                />
              ) : (
                <span
                  key={`skeleton-${i}`}
                  className="h-3 w-3 animate-pulse rounded-[2px]"
                  style={{ backgroundColor: LEVEL_COLORS[0] }}
                />
              )
            )}
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
  );
}
