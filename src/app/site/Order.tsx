import { SOCIAL, RESUME } from "./content";

/* Contact: one glass panel. Email is the primary ember CTA (the fastest
   way to reach me); the rest stay as the plain glass link list. */
const LINKS = [
  { href: SOCIAL.github, label: "github.com/Toshkee", note: "Code" },
  { href: SOCIAL.linkedin, label: "linkedin.com/in/tosiicp", note: "Profile" },
  { href: RESUME, label: "CV", note: "One page" },
];

export default function Order() {
  return (
    <section
      id="contact"
      aria-label="Contact"
      className="relative z-[1] overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 py-[12svh] md:px-[6vw] md:py-[16svh]">
        <div className="glass glass-panel glass-dark-deep grid gap-10 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 md:p-10 lg:p-12">
          <div>
            <h2 className="font-display text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[0.95] text-ink">
              Open to work.
            </h2>
            <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-ink/80 md:text-[16px]">
              Full-time or part-time, remote. If you are hiring or have a site
              that needs building, the email below reaches me directly.
            </p>
            {/* Primary CTA: ember pill, a static glass-lip highlight (no
                cursor tracking, unlike the 21st.dev reference). Lift is a
                neutral drop shadow, not a coloured glow. */}
            <a
              href={`mailto:${SOCIAL.email}`}
              className="group mt-7 inline-flex items-center gap-3 rounded-full bg-ember px-7 py-4 text-[15px] font-semibold text-ember-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_10px_24px_-14px_rgba(0,0,0,0.6)] transition-colors duration-200 hover:bg-ember-hover"
            >
              <span>{SOCIAL.email}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
          <ul className="flex flex-col gap-3 md:justify-center">
            {LINKS.map((l) => {
              // every link here leaves the page (profiles, the CV PDF), so all open in a new tab
              return (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="glass glass-btn grid grid-cols-[1fr_auto] items-baseline gap-4 px-5 py-3.5 text-ink"
                  >
                    <span className="text-[15px] md:text-[16px]">{l.label}</span>
                    <span className="hidden text-[13px] text-faint sm:inline">{l.note}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
