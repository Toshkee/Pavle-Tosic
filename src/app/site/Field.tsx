"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { PROJECTS, type Project } from "../projects";
import { Section, Heading } from "./Section";
import Island from "./Island";

/* Client work as a ruled index. These sites have no demo video, so they get
   an honest table instead of being padded out to match the rail above: year,
   name, one line of scope, the live link. On desktop the screenshot of the
   row under the pointer shows in a plate on the right. */
const CLIENT = PROJECTS.filter((p) => p.kind === "client");

/* Whole-page captures of the live sites (Playwright, 1440 wide, every lazy
   image scrolled in first, resized to 960 wide), so the frame can scroll
   through the real page rather than show its first screen. Heights are the
   960-wide files' own. */
const FULL: Record<string, { src: string; h: number }> = {
  "villa-vucje": { src: "/images/projects/villa-vucje-full.webp", h: 4116 },
  "mandarina-petrovac": { src: "/images/projects/mandarina-petrovac-full.webp", h: 5822 },
};

/* The page inside the frame scrolls top to bottom and back on a loop
   (globals.css, .scroll-shot), holding at each end. Speed is constant, so a
   longer page takes longer: ~240 px of capture per second. It runs only
   while the frame is on screen and holds still under the pointer, so it can
   be read. Under reduced motion it is the page's first screen, still. */
function ScrollShot({ project, eager = false }: { project: Project; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  const full = FULL[project.slug];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRun(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="scroll-shot aspect-[16/10]" data-run={run ? "true" : undefined}>
      <img
        src={full?.src ?? project.shot}
        alt={`${project.title}, the full live page`}
        width={960}
        height={full?.h ?? 600}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={full ? { animationDuration: `${Math.round(full.h / 240)}s` } : undefined}
        className={full ? "scroll-shot__page" : "h-full w-full object-cover object-top"}
      />
    </div>
  );
}

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
    <Section id="clients" label="Client work">
      <Heading
        kicker="Client work"
        index={3}
        island={<Island name="village" />}
        lead="Paid freelance sites, both bilingual, both static, both on Cloudflare. Shipped September 2026."
      >
        Two paid sites, live for real clients.
      </Heading>
      <div className="glass glass-panel glass-dark-deep grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:items-center lg:gap-14 lg:p-12">
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
                  <ScrollShot project={p} />
                </BrowserFrame>
              </a>
            </li>
          ))}
        </ul>
        <BrowserFrame domain={shown.domain} className="hidden lg:block">
          {/* keyed, so switching rows starts the new page from its top */}
          <ScrollShot key={shown.slug} project={shown} eager />
        </BrowserFrame>
      </div>
    </Section>
  );
}
