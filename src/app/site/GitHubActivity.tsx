/* Server component: fetched once at build time (this whole site is
   prerendered, nothing here revalidates), so the request never reaches a
   visitor's browser. If the API is down or shaped differently than
   expected, render nothing rather than break the page or the build. */

const GITHUB_USER = "Toshkee";

type Contribution = { date: string; count: number; level: number };
type ContributionsResponse = {
  total: Record<string, number>;
  contributions: Contribution[];
};

async function getContributions(): Promise<ContributionsResponse | null> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ContributionsResponse;
    if (!Array.isArray(data.contributions) || data.contributions.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

// Empty cells stay neutral; levels 1-4 mix ember over transparent, so the
// ramp reads as one deliberate accent instead of stock GitHub green.
const LEVEL_MIX: Record<number, number> = { 1: 28, 2: 52, 3: 76, 4: 100 };

export default async function GitHubActivity() {
  const data = await getContributions();
  // The heatmap is a build-time nicety; the profile link is the fact. If the
  // contributions API was unreachable when this build ran, keep the link so
  // the section never silently loses its GitHub line.
  if (!data) {
    return (
      <p className="text-[13px] text-faint">
        Commits, games and experiments in the open on{" "}
        <a
          href={`https://github.com/${GITHUB_USER}`}
          target="_blank"
          rel="noreferrer"
          className="link-underline text-body hover:text-ink"
        >
          github.com/{GITHUB_USER}
        </a>
      </p>
    );
  }

  const { contributions, total } = data;
  const totalLastYear = total.lastYear ?? Object.values(total)[0] ?? 0;

  // Pad the front so columns align on Sunday, then chunk into week columns,
  // the same layout GitHub's own calendar uses.
  const firstDow = new Date(`${contributions[0].date}T00:00:00Z`).getUTCDay();
  const padded: (Contribution | null)[] = [...Array(firstDow).fill(null), ...contributions];
  const weeks: (Contribution | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div>
      <p className="text-[13px] text-faint">
        {totalLastYear.toLocaleString()} contributions in the last year on{" "}
        <a
          href={`https://github.com/${GITHUB_USER}`}
          target="_blank"
          rel="noreferrer"
          className="link-underline text-body hover:text-ink"
        >
          github.com/{GITHUB_USER}
        </a>
      </p>
      <div
        role="img"
        aria-label={`GitHub contribution activity over the last year: ${totalLastYear} contributions`}
        className="mt-4 flex w-full gap-[3px] pb-1"
      >
        {/* Week columns share the column's full width (flex-1, square
            cells), so the calendar spans it instead of stopping short.
            The busiest days (level 4) carry a small ember glow. */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            aria-hidden
            className={`${wi < weeks.length - 26 ? "hidden md:flex" : "flex"} min-w-0 flex-1 flex-col gap-[3px]`}
          >
            {week.map((day, di) => (
              <span
                key={di}
                className="aspect-square w-full rounded-[2px]"
                style={{
                  background: !day
                    ? "transparent"
                    : day.level === 0
                      ? "var(--color-line)"
                      : `color-mix(in srgb, var(--color-ember) ${LEVEL_MIX[day.level] ?? 100}%, transparent)`,
                  boxShadow: day?.level === 4 ? "0 0 10px color-mix(in srgb, var(--color-ember) 55%, transparent)" : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
