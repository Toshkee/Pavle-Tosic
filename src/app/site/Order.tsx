import Link from "next/link";
import { SOCIAL, RESUME } from "./content";

/* Contact: one glass panel, the links as glass buttons. */
const LINKS = [
  { href: `mailto:${SOCIAL.email}`, label: SOCIAL.email, note: "Email, the fastest way" },
  { href: SOCIAL.github, label: "github.com/Toshkee", note: "Code" },
  { href: SOCIAL.linkedin, label: "linkedin.com/in/tosiicp", note: "Profile" },
  { href: RESUME, label: "CV, PDF", note: "One page" },
];

export default function Order() {
  return (
    <section
      id="order"
      aria-label="Contact"
      className="relative z-[1] overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 py-[12svh] md:px-[6vw] md:py-[16svh]">
        <div className="glass glass-panel glass-dark grid gap-10 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 md:p-10 lg:p-12">
          <div>
            <h2 className="font-display text-[clamp(2.2rem,5vw,4.2rem)] font-bold leading-[0.95] text-ink">
              Open to work.
            </h2>
            <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-ink/80 md:text-[16px]">
              Full-time or part-time, remote. If you are hiring or have a site
              that needs building, the email below reaches me directly.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                  className="glass glass-btn grid grid-cols-[1fr_auto] items-baseline gap-4 px-5 py-3.5 text-ink"
                >
                  <span className="text-[15px] md:text-[16px]">{l.label}</span>
                  <span className="hidden text-[13px] text-faint sm:inline">{l.note}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
