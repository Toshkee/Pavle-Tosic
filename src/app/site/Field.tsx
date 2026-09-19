"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { PROJECTS, thumbOf } from "../projects";
import { Section, Heading } from "./Section";

/* Client work as a ruled index. These sites have no demo video, so they get
   an honest table instead of being padded out to match the rail above: year,
   name, one line of scope, the live link. On desktop the screenshot of the
   row under the pointer shows in a plate on the right. */
const CLIENT = PROJECTS.filter((p) => p.video === null);

/* Screenshots ship at 1600x1000 (16:10). A 640w "-thumb.webp" twin already
   exists per project (see thumbOf in projects.ts, also used by /work), reused
   here as the srcset's small candidate instead of generating a new 720w tier. */
const SHOT_W = 1600;
const SHOT_H = 1000;

/* A thin browser chrome around each screenshot, so it reads as a live site
   rather than a loose image: a bar with three neutral dots (no macOS
   red/yellow/green) and the domain, then the framed shot. Solid plate, not
   glass: it already sits inside a glass panel and nesting blur is wasted
   GPU work. */
function BrowserFrame({
  domain,
  children,
  className = "",
}: {
  domain: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`plate overflow-hidden rounded-[10px] ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-line px-3 py-2">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
        </span>
        <span className="truncate text-[12px] text-faint">{domain}</span>
      </div>
      {children}
    </div>
  );
}

export default function Field() {
  const [active, setActive] = useState(0);
  const shown = CLIENT[active] ?? CLIENT[0];

  return (
    <Section id="field" label="Client work">
      <Heading lead="Paid freelance sites, both bilingual, both static, both on Cloudflare. Shipped September 2026.">
        Client work
      </Heading>
      <div className="glass glass-panel glass-dark-deep grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:p-12">
        <ul className="divide-y divide-line">
          {CLIENT.map((p, i) => (
            <li key={p.slug}>
              <a
                href={p.live}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
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
                <BrowserFrame
                  domain={p.domain}
                  className="mt-2 sm:col-span-3 lg:hidden"
                >
                  <img
                    src={p.shot}
                    srcSet={`${thumbOf(p.shot)} 640w, ${p.shot} ${SHOT_W}w`}
                    sizes="(max-width: 640px) 100vw, 90vw"
                    alt={`${p.title} screenshot`}
                    width={SHOT_W}
                    height={SHOT_H}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[16/10] w-full object-cover object-top"
                  />
                </BrowserFrame>
              </a>
            </li>
          ))}
        </ul>
        <BrowserFrame domain={shown.domain} className="hidden lg:block">
          <img
            key={shown.slug}
            src={shown.shot}
            srcSet={`${thumbOf(shown.shot)} 640w, ${shown.shot} ${SHOT_W}w`}
            sizes="(min-width: 1024px) 35vw, 0px"
            alt={`${shown.title} screenshot`}
            width={SHOT_W}
            height={SHOT_H}
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover object-top"
          />
        </BrowserFrame>
      </div>
    </Section>
  );
}
