import { LuGithub } from "react-icons/lu";
import { GITHUB } from "../github";

/* "Are you active on GitHub?": the public account in numbers and the
   project repos by their last push, as counted by scripts/github.mjs on
   the date the card says. Only repos that are projects in projects.ts
   (and this site's own) are listed, so every name here is one the FACTS
   can speak about; the totals count everything public. */
export default function GithubCard() {
  const totals = [
    { value: GITHUB.publicRepos, label: "public repositories" },
    { value: GITHUB.pushes, label: `pushes in the last ${GITHUB.windowDays} days` },
    { value: GITHUB.reposPushed, label: "repositories pushed to" },
  ];

  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xl font-bold tracking-tight text-ink">On GitHub</h3>
        <a
          href={GITHUB.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
        >
          <LuGithub aria-hidden className="size-4" />
          {GITHUB.user}
        </a>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {totals.map(({ value, label }) => (
          // dt must come first in the markup; flex-col-reverse puts the
          // number on top, as on the project card.
          <div
            key={label}
            className="flex flex-col-reverse rounded-2xl bg-surface p-4"
          >
            <dt className="mt-0.5 text-sm text-faint">{label}</dt>
            <dd className="text-2xl font-semibold text-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <h4 className="mt-6 text-xs font-semibold tracking-wider text-faint uppercase">
        Project repos, by last push
      </h4>
      <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
        {GITHUB.repos.map((repo) => (
          <li
            key={repo.url}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5"
          >
            <span>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline font-medium text-ink"
              >
                {repo.name}
              </a>
              {repo.title !== repo.name && (
                <span className="text-faint"> · {repo.title}</span>
              )}
            </span>
            <span className="text-faint tabular-nums">
              {repo.language && `${repo.language} · `}
              {repo.pushed}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-faint">
        Counted from the public GitHub API on {GITHUB.asOfPretty}; on GitHub
        since {GITHUB.memberSince}.
      </p>
    </article>
  );
}
