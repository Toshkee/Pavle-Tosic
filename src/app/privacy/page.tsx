import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL } from "../contact";

/* Privacy notice. Everything stated here is checkable against the code:
   src/app/api/ask/route.ts for the assistant, GitHubGraph/LiveTicker for public
   third-party data, and BootIntro.tsx for the one sessionStorage key. */

export const metadata: Metadata = {
  title: "Privacy — Pavle Tošić",
  description:
    "How this site handles analytics, public live data, and questions sent through the Ask AI widget.",
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
      <nav className="font-mono text-xs text-faint">
        <Link href="/" className="transition-colors hover:text-accent-ink">
          cd ~
        </Link>
        <span aria-hidden> / </span>
        <span className="text-muted">privacy</span>
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
          The contribution panel requests public GitHub contribution data from
          github-contributions-api.jogruber.de when it appears. Like any web
          server, that provider can receive your IP address, browser information,
          and this site&apos;s origin. No chat text or other site data is sent.
        </p>
        <p>
          If you open the CryptoFlow live-market tab, your browser connects to
          Binance&apos;s public REST and WebSocket services for market prices. That
          connection is only made after you open the live tab. Binance can
          receive the ordinary network details that accompany the request.
        </p>
      </Section>

      <Section title="The Ask AI widget">
        <p>
          The chat widget answers questions about my background. When you send a
          message, the text of that message and the earlier turns in the same
          chat are forwarded to Google&apos;s Gemini API, which generates the
          reply. Google processes that text under its own terms; treat anything
          you type there as leaving this site.
        </p>
        <p>
          Conversations are not written to any database and are not stored after
          the reply is returned. Your IP address is held in memory for up to one
          minute purely to rate-limit the endpoint, and is never written to disk
          or logged alongside your messages.
        </p>
        <p>
          Please do not put personal or confidential information into the chat.
          If you want to reach me privately, email me instead.
        </p>
      </Section>

      <Section title="Storage on your device">
        <p>
          The site sets one <code className="font-mono text-sm">sessionStorage</code>{" "}
          key, <code className="font-mono text-sm">pt_booted</code>, so the
          intro animation only plays once per browser session. It contains no
          personal data, never leaves your browser, and is cleared when you
          close the tab.
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

      <p className="mt-12 border-t border-line pt-6 font-mono text-xs text-faint">
        <Link href="/" className="transition-colors hover:text-accent-ink">
          ← back to pavletosic.com
        </Link>
      </p>
    </main>
  );
}
