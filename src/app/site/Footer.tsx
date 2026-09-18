import Link from "next/link";
import { SOCIAL, RESUME } from "./content";

/* After 21st.dev/@ln-dev7/components/footer-17: brand and tagline on the
   left, a compact vertical link list on the right, a copyright line under
   a rule. On the same glass as the rest of the page. */
const COLUMNS = [
  {
    title: "Site",
    links: [
      { href: "#features", label: "Work" },
      { href: "#spec", label: "About" },
      { href: "#log", label: "Log" },
      { href: "/work", label: "Case studies" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { href: SOCIAL.github, label: "GitHub" },
      { href: SOCIAL.linkedin, label: "LinkedIn" },
      { href: `mailto:${SOCIAL.email}`, label: "Email" },
      { href: RESUME, label: "CV (PDF)" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] mx-auto w-full max-w-[1440px] px-6 pb-8 pt-4 md:px-[6vw]">
      <div className="glass glass-panel glass-dark p-6 md:p-10">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))] md:gap-12">
          <div>
            <p className="font-display text-[22px] font-bold text-ink">Pavle Tošić</p>
            <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-body">
              Software developer in Montenegro. Next.js and React by choice,
              Angular and Oracle APEX on the job, client sites on the side.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <p className="text-[12px] uppercase tracking-[0.18em] text-faint">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {c.links.map((l) => {
                  const ext = l.href.startsWith("http");
                  const A = l.href.startsWith("/") ? Link : "a";
                  return (
                    <li key={l.href}>
                      <A
                        href={l.href}
                        target={ext ? "_blank" : undefined}
                        rel={ext ? "noreferrer" : undefined}
                        className="text-ink/85 transition-colors hover:text-ink"
                      >
                        {l.label}
                      </A>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[12px] text-faint">
          <span>© 2026 Pavle Tošić</span>
          <span className="flex gap-5">
            <a
              href="https://unsplash.com/photos/kKvQJ6rK6S4"
              target="_blank"
              rel="noreferrer"
              className="hover:text-body"
            >
              Hero photo: Shur Shu, Unsplash
            </a>
            <Link href="/privacy" className="hover:text-body">
              Privacy
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
