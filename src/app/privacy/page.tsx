import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL } from "../contact";

/* Privacy notice. Everything stated here is checkable against the code: the
   chat is the only feature that sends what a visitor types anywhere
   (src/app/api/chat/route.ts, which logs status codes, never message text),
   and the theme toggle (src/app/site/ThemeToggle.tsx) is the only thing
   written to local storage. */

export const metadata: Metadata = {
  title: "Privacy — Pavle Tošić",
  description:
    "How this site handles analytics, the questions you ask the chat, and the one setting it stores.",
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
          load timings. I use it to see which pages people read. It does not
          identify you, and I cannot single out an individual visit from it.
        </p>
      </Section>

      <Section title="The chat">
        <p>
          The answers on this site are written by an AI model speaking for me.
          When you ask a question, it goes to this site&apos;s server, which
          sends it, together with the earlier questions and answers from the
          same page visit, to Anthropic&apos;s Claude API to write the reply. I do
          not store the conversation: it lives in your browser tab and is gone
          when you close it or reload.
        </p>
        <p>
          Anthropic processes the messages under its commercial terms, which
          do not allow using them to train its models; Anthropic may keep them
          for a limited time to detect abuse.
          Please don&apos;t type anything personal or sensitive into the chat.
          To limit abuse, the server counts requests per IP address for one
          minute; the count is not stored beyond that.
        </p>
      </Section>

      <Section title="Storage on your device">
        <p>
          The site sets no cookies. If you switch between light and dark with
          the toggle, that one choice is saved in your browser&apos;s local
          storage under the key <code>theme</code>, so the next page opens the
          same way. Nothing else is written.
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
