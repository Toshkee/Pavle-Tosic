"use client";

import { useState } from "react";
import { PROJECTS } from "../projects";
import { Section, Heading } from "./Section";

/* Client work as a ruled index. These sites have no demo video, so they get
   an honest table instead of being padded out to match the rail above: year,
   name, one line of scope, the live link. On desktop the screenshot of the
   row under the pointer shows in a plate on the right. */
const CLIENT = PROJECTS.filter((p) => p.video === null);

export default function Field() {
  const [active, setActive] = useState(0);
  const shown = CLIENT[active] ?? CLIENT[0];

  return (
    <Section id="field" label="Client work">
      <Heading lead="Paid freelance sites, both bilingual, both static, both on Cloudflare. Shipped September 2026.">
        Client work
      </Heading>
      <div className="glass glass-panel glass-dark grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:p-12">
        <ul className="divide-y divide-line">
          {CLIENT.map((p, i) => (
            <li key={p.slug}>
              <a
                href={p.live}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`flex flex-col gap-1.5 py-5 transition-colors sm:grid sm:grid-cols-[5rem_1fr_auto] sm:gap-4 ${
                  i === active ? "text-ink" : "text-body hover:text-ink"
                }`}
              >
                <span className="text-[13px] text-faint">2026</span>
                <span>
                  <span className="font-display text-[20px] font-medium leading-tight">
                    {p.title}
                  </span>
                  <span className="mt-1 block max-w-[52ch] text-[14px] leading-relaxed text-ink/80">
                    {p.blurb}
                  </span>
                  <span className="mt-2 block text-[13px] text-faint">
                    {p.stack.join(", ")}
                  </span>
                </span>
                <span className="hidden text-[13px] text-faint sm:block">
                  {p.domain}
                </span>
                <img
                  src={p.shot}
                  alt={`${p.title} screenshot`}
                  width={1440}
                  height={900}
                  loading="lazy"
                  className="plate mt-2 aspect-[16/10] w-full rounded-[10px] object-cover object-top sm:col-span-3 lg:hidden"
                />
              </a>
            </li>
          ))}
        </ul>
        <div className="plate hidden overflow-hidden rounded-[8px] lg:block">
          <img
            key={shown.slug}
            src={shown.shot}
            alt={`${shown.title} screenshot`}
            width={1440}
            height={900}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover object-top"
          />
        </div>
      </div>
    </Section>
  );
}
