"use client";

import { Icon } from "@iconify/react";
import { MARKS, STACK_LINE } from "../content";
import "../icons";

/* "What do you build with?": the brand marks, in the CV's groups, each
   with its logo. Icons come from the bundled set in icons.ts, never from
   the Iconify API (CSP allows no such origin). */
export default function SkillsCard() {
  return (
    <article className="rounded-3xl border border-line p-6 sm:p-8">
      <h3 className="text-xl font-bold tracking-tight text-ink">
        What I build with
      </h3>
      <p className="mt-1 max-w-[60ch] text-sm text-faint">{STACK_LINE}</p>
      {MARKS.map((group) => (
        <section key={group.heading} className="mt-6">
          <h4 className="text-xs font-semibold tracking-wider text-faint uppercase">
            {group.heading}
          </h4>
          <ul className="mt-3 flex flex-wrap gap-2">
            {group.marks.map((mark) => (
              <li
                key={mark.name}
                className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink"
              >
                <Icon
                  icon={mark.icon}
                  color={mark.color}
                  width={16}
                  height={16}
                  aria-hidden
                  focusable="false"
                />
                {mark.name}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
