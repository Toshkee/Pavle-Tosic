import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL } from "../contact";

/* Privacy notice. Everything stated here is checkable against the code:
   src/app/site/MarketStrip.tsx is the only third-party data connection the
   site makes from the browser, and nothing is written to local storage. */

export const metadata: Metadata = {
  title: "Privacy — Pavle Tošić",
  description:
    "How this site handles analytics and the one public live-data connection it makes.",
  alternates: { canonical: "https://pavletosic.com/privacy" },
  robots: { index: true, follow: true },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-3 max-w-[70ch] space-y-3 text-[15px] leading-[1.7] text-body">
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <nav className="text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Pavle Tošić
        </Link>
        <span aria-hidden> / </span>
        <span className="text-muted">Privacy</span>
      </nav>

      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        Privacy
      </h1>
      <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.7] text-body">
        This is a personal portfolio. There are no accounts, no sign-in, no ads
        and no advertising or tracking cookies. The network services used by
        the site are described below.
      </p>

      <Section title="Analytics">
        <p>
          The site uses Cloudflare Web Analytics, injected at the edge. It is
          cookieless and does not fingerprint visitors or track them across
          sites. It records aggregate page views along with the page URL, the
          referrer, coarse device and browser information, country, and page
          load timings. I use it to see which sections people read. It does not
          identify you, and I cannot single out an individual visit from it.
        </p>
      </Section>

      <Section title="Public live data">
        <p>
          The CryptoFlow entry in the Work section shows three live Binance
          spot prices. While that block is on screen, your browser opens a
          connection to Binance&apos;s public WebSocket service, which can
          receive the ordinary network details that accompany any request:
          your IP address, browser information and this site&apos;s origin.
          The connection closes when you scroll past. Nothing about you is
          sent, and no other third-party data is loaded by the page.
        </p>
      </Section>

      <Section title="Storage on your device">
        <p>
          The site sets no cookies and writes nothing to local or session
          storage.
        </p>
      </Section>

      <Section title="Hosting">
        <p>
          The site is hosted on Cloudflare, which processes requests (including
          IP addresses) to serve pages and to protect against abuse, as any web
          host does. Links out to project demos are hosted elsewhere (Netlify,
          Vercel, GitHub Pages, Render) and have their own policies.
        </p>
      </Section>

      <Section title="Your data, and getting in touch">
        <p>
          Because nothing here is stored against your identity, there is no
          account to delete and no profile to export. If you have a question
          about any of this, or want something looked into, email{" "}
          <a
            href={`mailto:${EMAIL}`}
            className="link-underline text-accent-ink"
          >
            {EMAIL}
          </a>
          .
        </p>
      </Section>

      <p className="mt-12 border-t border-line pt-6 text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Back to the front page
        </Link>
      </p>
    </main>
  );
}
