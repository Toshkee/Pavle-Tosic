import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EMAIL } from "../contact";
import { Timeline } from "../site/cards/ExperienceCard";
import {
  ABOUT,
  ABOUT_HEADING,
  EDUCATION,
  EXPERIENCE,
  LOCATION,
  MARKS,
  NAME,
  PHOTO,
  RESUME,
  ROLE,
  SOCIAL,
  SPEC,
} from "../site/content";
import Crumbs from "../site/Crumbs";

/* The CV as a page: the same facts the chat's cards show, from content.ts,
   but server-rendered, so a search engine, a link preview or an AI crawler
   learns who I am without asking the chat. The front page says little by
   design and the cards only exist once the model calls for them; this is
   the page that answers "who is Pavle Tošić" to a crawler. Nothing here
   that is not on the CV. */

export const metadata: Metadata = {
  title: "About Pavle Tošić, Software Developer",
  description:
    "Who I am, what I build with, where I have worked and what I studied: my CV as a page. Software developer in Montenegro, TypeScript and React by choice, Oracle APEX, Oracle Database and .NET at work.",
  alternates: { canonical: "https://pavletosic.com/about" },
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
      <div className="mt-3 max-w-[70ch] text-[15px] leading-[1.7] text-body">
        {children}
      </div>
    </section>
  );
}

export default function About() {
  const links = [
    { label: "GitHub", href: SOCIAL.github },
    { label: "LinkedIn", href: SOCIAL.linkedin },
    { label: "CV (PDF)", href: RESUME },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <Crumbs trail={[{ label: "About" }]} />

      <header className="mt-6 flex items-center gap-5">
        <Image
          src={PHOTO.src}
          alt={PHOTO.alt}
          width={480}
          height={480}
          priority
          className="size-24 shrink-0 rounded-2xl object-cover sm:size-28"
        />
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {NAME}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {ROLE} · {LOCATION}
          </p>
        </div>
      </header>

      <p className="mt-8 text-lg font-semibold text-ink">{ABOUT_HEADING}</p>
      {ABOUT.map((paragraph) => (
        <p
          key={paragraph}
          className="mt-3 max-w-[70ch] text-[15px] leading-[1.7] text-body"
        >
          {paragraph}
        </p>
      ))}

      <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
        {SPEC.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-6 py-2.5">
            <dt className="shrink-0 text-faint">{label}</dt>
            <dd className="text-right text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <Section title="What I build with">
        <dl className="space-y-2">
          {MARKS.map((group) => (
            <div key={group.heading} className="sm:flex sm:gap-4">
              <dt className="shrink-0 text-faint sm:w-40">{group.heading}</dt>
              <dd>{group.marks.map((mark) => mark.name).join(", ")}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Work">
        <Timeline entries={EXPERIENCE} />
      </Section>

      <Section title="Education">
        <Timeline entries={EDUCATION} />
      </Section>

      <Section title="Contact">
        <p>
          <a
            href={`mailto:${EMAIL}`}
            className="link-underline font-medium text-accent-ink"
          >
            {EMAIL}
          </a>
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {links.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-ink"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          Or{" "}
          <Link
            href={{
              pathname: "/chat",
              query: { q: "Are you open to work? How can I reach you?" },
            }}
            className="link-underline text-ink"
          >
            ask me in the chat
          </Link>
          .
        </p>
      </Section>

      <p className="mt-12 flex gap-5 border-t border-line pt-6 text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Back to the front page
        </Link>
        <Link href="/work" className="transition-colors hover:text-ink">
          Case studies
        </Link>
      </p>
    </main>
  );
}
