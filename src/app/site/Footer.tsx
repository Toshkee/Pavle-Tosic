import Link from "next/link";

/* After 21st.dev/@ln-dev7/components/footer-16: wordmark, one row of site
   links, then legal and credits. No longer a glass card: it is the last
   strip of the Contact scene, on the same rgb(10 10 12 / .88) that
   section's scrim ends on, so the sunset runs behind both unbroken. No
   contact links here, those live in Order, directly above. */
const SITE_LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#log", label: "Log" },
  { href: "/work", label: "Case studies" },
];

export default function Footer() {
  return (
    <footer className="relative z-[1] bg-[rgb(10_10_12/0.88)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 border-t border-line px-6 py-8 md:flex-row md:items-center md:justify-between md:px-[6vw]">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <p className="font-display text-[16px] font-bold text-ink">Pavle Tošić</p>
          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px]">
            {SITE_LINKS.map((l) => {
              const A = l.href.startsWith("/") ? Link : "a";
              return (
                <A key={l.href} href={l.href} className="text-ink/80 transition-colors hover:text-ink">
                  {l.label}
                </A>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-faint">
          <span>© 2026 Pavle Tošić</span>
          <span>Hero and section art: AI-generated, Higgsfield</span>
          <Link href="/privacy" className="hover:text-body">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
