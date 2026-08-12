import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, CASES, DEMO_NOTES, projectBySlug } from "../../projects";

/* One crawlable case study per project. Deliberately a SERVER component with
   no client JS: the home page is a single "use client" deck that a crawler
   (or anyone you send a link to) can't deep-link into, so this is the version
   of a project that has its own URL, its own <title> and its own structured
   data. Content is the same data the kiosk renders, laid out in the order a
   reader wants it: problem → role → decisions → challenges → result. */

export const dynamicParams = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) return {};
  const url = `https://pavletosic.com/work/${p.slug}`;
  return {
    title: `${p.title} — case study | Pavle Tošić`,
    description: p.blurb,
    alternates: { canonical: url },
    openGraph: {
      title: `${p.title} — case study`,
      description: p.blurb,
      url,
      type: "article",
      images: [{ url: p.shot, alt: `${p.title} screenshot` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.title} — case study`,
      description: p.blurb,
      images: [p.shot],
    },
  };
}

// A monospace pane, matching the kiosk's arch/notes/code tabs. The source
// strings are hard-wrapped for a narrow frame, so <pre> is the honest
// renderer: reflowing them would break the ASCII trees.
function Pane({
  file,
  children,
}: {
  file: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-1.5 border-b border-line/70 bg-bg/50 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-faint/70" />
        <span className="h-2 w-2 rounded-full bg-accent/70" />
        <span className="h-2 w-2 rounded-full bg-accent-2/70" />
        <span className="ml-2 font-mono text-[11px] text-muted">{file}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-[1.6] text-body">
        {children}
      </pre>
    </div>
  );
}

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
      <p className="font-mono text-xs text-faint">
        <span className="text-accent-ink">$</span> {cmd}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li
          key={t}
          className="relative max-w-[75ch] pl-5 text-[15px] leading-[1.7] text-body before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-line-strong"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const p = projectBySlug(slug);
  if (!p) notFound();

  const caseFile = CASES[p.title];
  const demoNote = DEMO_NOTES[p.live];
  const url = `https://pavletosic.com/work/${p.slug}`;

  // SoftwareSourceCode rather than a generic Article: the subject of the page
  // is the project, and this is what ties the case study to its repo and demo.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: p.title,
    description: p.blurb,
    url,
    codeRepository: p.code,
    programmingLanguage: p.stack,
    author: { "@type": "Person", name: "Pavle Tošić", url: "https://pavletosic.com" },
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="font-mono text-xs text-faint">
        <Link href="/" className="transition-colors hover:text-accent-ink">
          cd ~
        </Link>
        <span aria-hidden> / </span>
        <span>work</span>
        <span aria-hidden> / </span>
        <span className="text-muted">{p.slug}</span>
      </nav>

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {p.title}
        </h1>
        <p className="mt-2 font-mono text-xs text-muted">
          {p.role} · {p.context}
        </p>
        <p className="mt-5 max-w-[70ch] text-[15px] leading-[1.7] text-body">
          {p.blurb}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline font-medium text-accent-ink"
          >
            Live demo <span aria-hidden>↗</span>
          </a>
          <a
            href={p.code}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-ink"
          >
            Source on GitHub <span aria-hidden>↗</span>
          </a>
        </div>
        {demoNote && (
          <p className="mt-2 font-mono text-xs text-faint">{demoNote}</p>
        )}

        <ul className="mt-5 flex flex-wrap gap-2">
          {p.stack.map((s) => (
            <li
              key={s}
              className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted"
            >
              {s}
            </li>
          ))}
        </ul>
      </header>

      <Image
        src={p.shot}
        alt={`${p.title} screenshot`}
        width={1280}
        height={720}
        priority
        className="mt-10 w-full rounded-xl border border-line"
      />

      {/* Numbers first: they are what a reader scanning the page stops on,
          and every one of them is counted out of the repo. */}
      <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {p.kpis.map((k) => (
          <div key={k.label} className="bg-surface p-4">
            <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
              {k.label}
            </dt>
            <dd className="mt-1 text-sm leading-snug text-ink">{k.value}</dd>
          </div>
        ))}
      </dl>

      <Section cmd="cat problem.md" title="The problem">
        <p className="max-w-[70ch] text-[15px] leading-[1.7] text-body">
          {p.problem}
        </p>
      </Section>

      <Section cmd="cat decisions.md" title="What I built, and why">
        <Bullets items={p.highlights} />
      </Section>

      {caseFile && (
        <Section cmd="cat arch.txt" title="Architecture">
          <Pane file="arch.txt">{caseFile.arch}</Pane>
        </Section>
      )}

      {caseFile && (
        <Section cmd="cat notes.md" title="What broke, and what I did about it">
          <Pane file="notes.md">{caseFile.notes}</Pane>
        </Section>
      )}

      <Section cmd="cat result.md" title="Result">
        <Bullets items={p.result} />
      </Section>

      {caseFile && (
        <Section cmd={`cat ${caseFile.codeFile}`} title="A slice of the code">
          <Pane file={caseFile.codeFile}>{caseFile.code}</Pane>
        </Section>
      )}

      <Section cmd="ls ../" title="Other projects">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {PROJECTS.filter((o) => o.slug !== p.slug).map((o) => (
            <li key={o.slug}>
              <Link
                href={`/work/${o.slug}`}
                className="link-underline text-accent-ink"
              >
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <p className="mt-12 border-t border-line pt-6 font-mono text-xs text-faint">
        <Link href="/" className="transition-colors hover:text-accent-ink">
          ← back to pavletosic.com
        </Link>
      </p>
    </main>
  );
}
