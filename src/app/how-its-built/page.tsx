import type { Metadata } from "next";
import Link from "next/link";
import Crumbs from "../site/Crumbs";
import Pane from "../site/Pane";
import { SOCIAL } from "../site/content";

/* How this site is built, for the reader who wants to see how I work, not
   just what I made. Every line is checkable against this repo: the chat in
   api/chat/route.ts and chat-protocol.ts, the gates in .github/workflows/
   ci.yml and scripts/, the headers in next.config.ts. Keep it true when any
   of those change, as with /privacy. */

const REPO = `${SOCIAL.github}/Pavle-Tosic`;

export const metadata: Metadata = {
  title: "How this site is built — Pavle Tošić",
  description:
    "The engineering behind pavletosic.com: a Claude-powered chat that answers as me and shows cards, on Next.js 16 and Cloudflare Workers, with CI gates for security headers, accessibility and performance.",
  alternates: { canonical: "https://pavletosic.com/how-its-built" },
};

// Lines are kept ≤ ~42 chars so the pane never scrolls sideways on a phone.
const CHAT_ARCH = `browser ── POST /api/chat
 │  same origin only · json only
 │  4,000 chars a message · 12 turns
 │
 └─ cloudflare worker (next 16, opennext)
     ├ rate limit: 10 a minute per IP
     ├ system prompt built from
     │   content.ts + projects.ts
     │   prompt and tools cached
     ├ round 1: claude-haiku-5-5
     │   may call one of 9 tools
     │   (a starter question or a
     │   pasted job ad must)
     │   a tool call = "show this card"
     ├ round 2: tools off, text only
     └ NDJSON stream back to the page
         text deltas · cards, in order`;

const BROKE = `## what broke, what I did about it

- every case study 404'd in
  production the night it went live,
  while next start served them fine.
  Next 16.3.8 had changed its cache
  keys and the Workers adapter still
  wrote the old ones. upgraded the
  adapter, then made "build it the
  Workers way and expect a cache HIT"
  the rule before any dependency bump.

- at low effort the model answered a
  question in Montenegrin with "see
  the card below" and never called
  the tool. medium effort calls it.

- given a second round, a turn that
  had already answered and then shown
  a card said it all again. a turn
  that spoke before its tool call now
  ends there.

- the Memoji started as a recorded
  loop, but a video can't look at
  your cursor. the irises are now cut
  out of one frame and move inside
  masks for the eye openings.`;

function Section({
  cmd,
  title,
  children,
}: {
  cmd: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <p className="text-[12px] uppercase tracking-[0.18em] text-faint">
        <span className="text-accent-ink">$</span> {cmd}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-4 max-w-[70ch] space-y-3 text-[15px] leading-[1.7] text-body">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li
          key={t}
          className="relative pl-5 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-line-strong"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

export default function HowItsBuilt() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <Crumbs trail={[{ label: "How this site is built" }]} />

      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        How this site is built
      </h1>
      <p className="mt-4 max-w-[70ch] text-[15px] leading-[1.7] text-body">
        The front page is one question box. Behind it, a model answers as me
        and puts cards on screen: my projects, my stack, my work history. This
        page is the engineering behind that, and the source is{" "}
        <a
          href={REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline text-accent-ink"
        >
          public on GitHub
        </a>
        .
      </p>

      <Section cmd="cat stack.txt" title="The stack">
        <Bullets
          items={[
            "Next.js 16 and React 19 on the App Router, in strict TypeScript. Server components by default; only the parts that need the browser ship JavaScript.",
            "Tailwind CSS v4, with the colours as CSS variables, so light and dark are one set of names with two sets of values.",
            "Deployed to Cloudflare Workers through OpenNext. Every page except the chat is prerendered and served from the edge cache.",
            "No webfont and no animation library: the system font stack, and CSS keyframes for the few entrances.",
          ]}
        />
      </Section>

      <Section cmd="cat chat.txt" title="The chat">
        <Pane file="chat.txt">{CHAT_ARCH}</Pane>
        <p>
          The model is Claude Haiku 5.5, called from the Worker, never from
          the browser, so the API key never leaves the server. The answer
          streams back as newline-delimited JSON: text as it is written, and
          a card the moment the model asks for one. The model never fetches
          anything; a tool call only picks which card to draw.
        </p>
        <p>
          The system prompt is built from the same two data files the cards
          render from, so the chat and the cards cannot disagree. A fact that
          is not in those files does not exist for the model: it is told not
          to invent opinions or habits, to call a prototype a prototype, and
          to say it is an AI when asked.
        </p>
        <p>
          One card is written by the model: paste a job ad and it lists the
          key requirements, each marked yes, partly or no from those same
          facts, with the project that backs it. A missing skill is a plain
          no. The server checks every field before the card is drawn: a
          match outside the three, a project not on the list or an overlong
          line is dropped.
        </p>
        <p>
          The same facts, with a link to every page, are published as plain
          text at{" "}
          <a href="/llms.txt" className="link-underline text-accent-ink">
            /llms.txt
          </a>
          , for the AI assistants that read this site when someone asks them
          about me.
        </p>
      </Section>

      <Section cmd="cat notes.md" title="What broke, and what I did about it">
        <Pane file="notes.md">{BROKE}</Pane>
      </Section>

      <Section cmd="cat ci.yml" title="What every push has to pass">
        <Bullets
          items={[
            "An npm audit, and a check that no image in public/ still carries EXIF or XMP metadata.",
            "Lint, typecheck and a production build.",
            "A smoke test against the running build: every route answers 200, every page has its canonical, the JSON-LD parses, the security headers are present and no internal link points at nothing.",
            "Lighthouse, three runs, judged on the median: accessibility at least 95, best practices at least 90, SEO 100, plus ceilings on first paint, layout shift and blocking time.",
          ]}
        />
      </Section>

      <Section cmd="cat headers.txt" title="Security">
        <Bullets
          items={[
            "An enforced Content Security Policy: scripts, images, media and connections from this origin only (plus Cloudflare's analytics beacon), no frames, no plugins, no inline event handlers.",
            "HSTS with preload, and same-origin opener and resource policies, on every page.",
            "The chat endpoint takes same-origin JSON only, caps the size of every message and the length of the history, and limits each IP to ten questions a minute.",
          ]}
        />
      </Section>

      <Section cmd="cat details.md" title="The details">
        <Bullets
          items={[
            "The cursor trail is one canvas behind every page: dots on a 14px grid that turn into ASCII characters and fade. Its animation loop sleeps once the trail has faded, and it is off for touch and for reduced motion.",
            "The Memoji's eyes follow your cursor; on a phone it glances around on its own.",
            "Content is visible without JavaScript: the front page is links and a plain form, and every animation respects prefers-reduced-motion.",
          ]}
        />
        <p>
          And there is a{" "}
          <Link href="/play" className="link-underline text-accent-ink">
            small game
          </Link>
          , written from scratch on one canvas.
        </p>
      </Section>

      <p className="mt-12 flex flex-wrap gap-5 border-t border-line pt-6 text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Back to the front page
        </Link>
        <Link href="/work" className="transition-colors hover:text-ink">
          Case studies
        </Link>
        <a href={REPO} className="transition-colors hover:text-ink">
          Source on GitHub
        </a>
      </p>
    </main>
  );
}
