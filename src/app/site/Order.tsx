import { SOCIAL, RESUME } from "./content";

/* Contact: the closing scene, not another panel. No card, so the night-train
   painting behind it (MorphBackdrop) is finally seen whole; the heading at
   poster size; the email as the one ember CTA. The other links are plain
   text links: as glass pills they read as empty form fields.

   From md up the type sits in the top of the scene and leaves the bridge
   clear, so the train (the backdrop's moving plane) crosses under it at the
   end of the page. The bridge's fixed band is ~66-78% of the viewport's
   height, so everything here has to end above ~62%: the heading is capped
   by height too (20svh), and the text and the CTA share one row. The
   section is 9.5rem short of the viewport: with the ~88 px footer below it,
   the end of the page puts its top just under the nav (and the previous
   section's card out of view), and the nav's Contact jump lands only
   ~24 px above that, so both views show the bridge clear. The scrim eases
   in behind the type, stays clear over the bridge and ends on the
   footer's rgb(10 10 12 / .88). Phones
   keep the type at the bottom over a bottom scrim: the train passes behind
   it there. */
const LINKS = [
  { href: SOCIAL.github, label: "GitHub" },
  { href: SOCIAL.linkedin, label: "LinkedIn" },
  { href: RESUME, label: "CV (PDF)" },
];

export default function Order() {
  return (
    <section
      id="contact"
      aria-label="Contact"
      className="relative z-[1] flex min-h-[100svh] flex-col justify-end overflow-hidden md:min-h-[calc(100svh-9.5rem)] md:justify-start"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_20%,rgb(10_10_12/0.55)_55%,rgb(10_10_12/0.88))] md:bg-[linear-gradient(to_bottom,transparent,rgb(10_10_12/0.28)_14%,rgb(10_10_12/0.2)_30%,transparent_50%,transparent_82%,rgb(10_10_12/0.88))]"
      />
      <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-[8svh] pt-[20svh] md:px-[6vw] md:pb-10 md:pt-[4svh]">
        <p className="mb-6 flex items-center gap-3 font-display text-[12px] font-medium uppercase tracking-[0.3em] text-ink/80">
          <span className="tabular-nums text-ink">06</span>
          <span aria-hidden className="h-px w-8 bg-line-strong" />
          Contact
        </p>
        <h2 className="font-display text-[clamp(3.4rem,12.5vw,12.5rem)] font-bold leading-[0.88] tracking-[-0.02em] text-ink [text-shadow:0_4px_40px_rgb(0_0_0/0.35)] md:text-[length:clamp(3.4rem,min(12.5vw,20svh),12.5rem)]">
          Open to work.
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="max-w-[44ch] text-[16px] leading-relaxed text-ink/85 md:text-[18px]">
              Full-time or part-time, remote. If you are hiring or have a site
              that needs building, the email below reaches me directly.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-[16px] md:mt-5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  {/* every link here leaves the page (profiles, the CV PDF), so all open in a new tab */}
                  <a href={l.href} target="_blank" rel="noreferrer" className="link-underline text-ink">
                    {l.label}
                    <span aria-hidden className="ml-1 text-faint">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {/* Primary CTA: ember pill, a static glass-lip highlight (no cursor
              tracking, unlike the 21st.dev reference). Lift is a neutral drop
              shadow, not a coloured glow. */}
          <a
            href={`mailto:${SOCIAL.email}`}
            className="group inline-flex max-w-full items-center gap-4 justify-self-start rounded-full bg-ember px-7 py-4 font-display text-[clamp(1.05rem,2.2vw,1.9rem)] font-bold text-ember-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_10px_24px_-14px_rgba(0,0,0,0.6)] transition-colors duration-200 hover:bg-ember-hover md:justify-self-end md:px-10 md:py-6"
          >
            <span className="truncate">{SOCIAL.email}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              className="h-[0.9em] w-[0.9em] shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
