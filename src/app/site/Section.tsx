import type { ReactNode } from "react";
import { HeadingReveal } from "./HeadingReveal";

/* Shared section frame: one gutter system for the whole page. No entrance
   animation: content is visible by default. */
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
      className={`relative z-[1] mx-auto w-full max-w-[1440px] px-6 py-[12svh] md:px-[6vw] md:py-[16svh] ${className}`}
    >
      {children}
    </section>
  );
}

export function Heading({
  children,
  lead,
}: {
  children: ReactNode;
  lead?: string;
}) {
  return (
    <div className="mb-12 md:mb-16">
      <h2 className="font-display text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[0.95] tracking-[-0.01em] text-ink">
        {typeof children === "string" ? (
          <HeadingReveal>{children}</HeadingReveal>
        ) : (
          children
        )}
      </h2>
      {lead && (
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink/80 md:text-[16px]">
          {lead}
        </p>
      )}
    </div>
  );
}
