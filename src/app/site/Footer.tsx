import Link from "next/link";

/* After 21st.dev/@ln-dev7/components/footer-16: a quiet centered strip,
   wordmark, one row of site links, a rule, then legal and copyright. No
   contact links here, those live in Order, one scroll up. */
const SITE_LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#log", label: "Log" },
  { href: "/work", label: "Case studies" },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] mx-auto w-full max-w-[1440px] px-6 pb-8 pt-4 md:px-[6vw]">
      <div className="glass glass-panel glass-dark flex flex-col items-center gap-6 p-8 text-center md:p-12">
        <p className="font-display text-[20px] font-bold text-ink">Pavle Tošić</p>

        <nav
          aria-label="Site"
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[14px]"
        >
          {SITE_LINKS.map((l) => {
            const A = l.href.startsWith("/") ? Link : "a";
            return (
              <A
                key={l.href}
                href={l.href}
                className="text-ink/85 transition-colors hover:text-ink"
              >
                {l.label}
              </A>
            );
          })}
        </nav>

        <div className="flex w-full max-w-[440px] flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-line pt-5 text-[12px] text-faint">
          <span>© 2026 Pavle Tošić</span>
          <a
            href="https://www.pexels.com/video/stunning-night-timelapse-of-the-alps-35047335/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-body"
          >
            Hero video: Ivan Chumak, Pexels
          </a>
          <a
            href="https://unsplash.com/license"
            target="_blank"
            rel="noreferrer"
            className="hover:text-body"
          >
            Backdrop photos: Unsplash
          </a>
          <Link href="/privacy" className="hover:text-body">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
