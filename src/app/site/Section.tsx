import type { ReactNode } from "react";
import { HeadingReveal } from "./HeadingReveal";

/* Shared section frame: one gutter system for the whole page. No entrance
   animation: content is visible by default. 11svh top and bottom on
   desktop (was 16svh): 32svh between two sections read as dead air, not
   pacing, once the cards stopped showing much photo around them. */
export function Section({
  id,
  label,
  children,
  className = "",
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-label={label}
      className={`relative z-[1] mx-auto w-full max-w-[1440px] px-6 py-[10svh] md:px-[6vw] md:py-[11svh] ${className}`}
    >
      {children}
    </section>
  );
}

/* The heading is a statement; what the section IS goes in the kicker
   above it ("02  Work"), numbered in page order. The biggest type in each
   section used to be spent on a label the nav already says. `island` is the
   section's floating voxel island (Island.tsx): above the kicker on phones,
   beside the heading from lg, where the block reserves its height (ISLANDS
   in globals.css). */
export function Heading({
  children,
  kicker,
  index,
  lead,
  island,
}: {
  children: ReactNode;
  kicker: string;
  index: number;
  lead?: string;
  island?: ReactNode;
}) {
  return (
    <div className={`relative mb-10 md:mb-14 ${island ? "heading--island" : ""}`}>
      {island && <div className="heading__island">{island}</div>}
      <p className="mb-5 flex items-center gap-3 font-display text-[12px] font-medium uppercase tracking-[0.3em] text-ink/70">
        <span className="tabular-nums text-ink">{String(index).padStart(2, "0")}</span>
        <span aria-hidden className="h-px w-8 bg-line-strong" />
        {kicker}
      </p>
      <h2 className="max-w-[22ch] font-display text-[clamp(2.2rem,5.2vw,4.6rem)] font-bold leading-[0.98] tracking-[-0.01em] text-ink">
        {typeof children === "string" ? (
          <HeadingReveal>{children}</HeadingReveal>
        ) : (
          children
        )}
      </h2>
      {lead && (
        <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ink/80 md:text-[17px]">
          {lead}
        </p>
      )}
    </div>
  );
}
