"use client";

import Image from "next/image";
import {
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Icon } from "@iconify/react";
import { SiGithub, SiLinkedin, SiWhatsapp, SiGmail } from "react-icons/si";
import { useActiveSection } from "./useActiveSection";
import SmoothScroll from "./SmoothScroll";
import Aurora from "./Aurora";
import InteractiveGrid from "./InteractiveGrid";
import GitHubGraph from "./GitHubGraph";
import { registerIcons } from "./iconData";

// Make the bundled Devicon set available for synchronous SSR rendering.
registerIcons();

/* ─────────────────────────────────────────────────────────────
   DATA  (from CV)
───────────────────────────────────────────────────────────── */

const NAME = "Pavle Tošić";
const ROLE = "Software Developer";
const LOCATION = "Montenegro";
const TAGLINE =
  "I build web apps front to back — from Oracle APEX, .NET and C# to React and TypeScript.";
const SUMMARY_SHORT =
  "Software developer at Infostream, building web & enterprise applications.";

const SOCIAL = {
  email: "tosiicp@gmail.com",
  github: "https://github.com/Toshkee",
  linkedin: "https://www.linkedin.com/in/tosiicp/",
  whatsapp: "https://wa.me/38267474438",
};

const NAV = [
  { id: "about", label: "About" },
  { id: "stack", label: "Stack" },
  { id: "work", label: "Work" },
  { id: "github", label: "GitHub" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

const SECTION_IDS = NAV.map((s) => s.id);

// Programming languages & tools with real logos (Devicon, bundled offline).
// `tint` icons are recoloured to stay legible / avoid purple brand colours.
type Tech = { name: string; icon: string; tint?: "amber" | "cream" | "stroke" };
const STACK: { group: string; items: Tech[] }[] = [
  {
    group: "Languages",
    items: [
      { name: "JavaScript", icon: "devicon:javascript" },
      { name: "TypeScript", icon: "devicon:typescript" },
      { name: "C#", icon: "devicon-plain:csharp", tint: "amber" },
      { name: "Python", icon: "devicon:python" },
      { name: "SQL", icon: "tabler:sql", tint: "stroke" },
    ],
  },
  {
    group: "Frontend",
    items: [
      { name: "React", icon: "devicon:react" },
      { name: "HTML5", icon: "devicon:html5" },
      { name: "CSS3", icon: "devicon:css3" },
    ],
  },
  {
    group: "Backend & runtime",
    items: [
      { name: "Node.js", icon: "devicon:nodejs" },
      { name: "Express", icon: "devicon:express", tint: "cream" },
      { name: ".NET", icon: "devicon-plain:dotnetcore", tint: "amber" },
    ],
  },
  {
    group: "Platforms & tooling",
    items: [
      { name: "Oracle APEX", icon: "devicon:oracle" },
      { name: "PostgreSQL", icon: "devicon:postgresql" },
      { name: "Git", icon: "devicon:git" },
    ],
  },
];

const LANGUAGES = [
  { label: "English", level: "Professional" },
  { label: "Montenegrin", level: "Native" },
];

const PROJECTS = [
  {
    title: "CryptoFlow",
    blurb:
      "Full-stack simulated crypto-futures trading platform — React + Vite front end, a Django REST API with JWT auth, a virtual wallet, and live market data with interactive charts.",
    stack: ["React", "Django", "Python", "PostgreSQL"],
    live: "https://cryptofloww.netlify.app/",
    code: "https://github.com/Toshkee/CryptoFlow",
    tag: null as string | null,
  },
  {
    title: "Meet2Explore",
    blurb:
      "Full-stack React travel app to discover destinations and find companions — built collaboratively with a team of four.",
    stack: ["React", "Node.js", "Express"],
    live: "https://meet2explore.netlify.app/",
    code: "https://github.com/Toshkee/meet2explore",
    tag: "Team · 4 devs",
  },
  {
    title: "One Piece Sword Duel",
    blurb:
      "Browser fighting game in vanilla JavaScript — hand-built game loop, state management, and DOM-driven combat. No frameworks.",
    stack: ["JavaScript", "HTML", "CSS"],
    live: "https://toshkee.github.io/One-Piece-Sword-Duel/",
    code: "https://github.com/Toshkee/One-Piece-Sword-Duel",
    tag: null,
  },
  {
    title: "Anime Watchlist",
    blurb:
      "Full-stack app to browse anime and manage a personal watchlist — search, filter, and track what you're watching.",
    stack: ["Node.js", "Express", "REST API"],
    live: "https://animee-watchlist-app-724b6a827c81.herokuapp.com/",
    code: "https://github.com/Toshkee/anime-watchlist",
    tag: null,
  },
];

type Job = {
  role: string;
  org: string;
  period: string;
  current: boolean;
  points: string[];
  link?: { href: string; label: string };
};

const EXPERIENCE: Job[] = [
  {
    role: "Software Developer",
    org: "Infostream",
    period: "2025 — Present",
    current: true,
    points: [
      "Build & maintain web and enterprise applications with Oracle APEX, .NET and C#, alongside JavaScript/TypeScript and React.",
      "NGO Register Portal (Government of Montenegro) — produced the official user-guide video tutorials: e-signature client, document signing, online registration, and registry search.",
    ],
    link: {
      href: "https://ngo.gov.me/Uputstva/PreuzmiteSoftwareIUputstva",
      label: "ngo.gov.me ↗",
    },
  },
  {
    role: "Fullstack Software Engineering",
    org: "General Assembly",
    period: "Sep 2025 — Dec 2025",
    current: false,
    points: [
      "420+ hours of intensive training in frontend — JavaScript, React, HTML & CSS.",
      "Backend fundamentals, APIs, databases & security basics; team-based real-world projects.",
    ],
  },
  {
    role: "Ethical Hacking",
    org: "Z-Security · Udemy",
    period: "2023",
    current: false,
    points: ["Completed a six-month, hands-on ethical-hacking course."],
  },
  {
    role: "Secondary Education",
    org: "Belgrade, RS · Podgorica, ME",
    period: "",
    current: false,
    points: [
      "Kosta Cukić Private High School, Belgrade — final two years.",
      "Mirko Vešović Economics High School, Podgorica — first two years.",
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   MOTION PRIMITIVES
───────────────────────────────────────────────────────────── */

// Hydration-safe prefers-reduced-motion (server snapshot = false).
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;

// Single element that focuses in (blur + slide) when scrolled into view.
function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = usePrefersReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Per-item variant for staggered groups (lists, grids). Opacity + slide only
// (no filter:blur — it would stack on the .glass backdrop-filter and jank).
const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

// Container that staggers its <StaggerItem> children in as it enters view.
function StaggerGroup({
  children,
  className = "",
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const reduce = usePrefersReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

// Heading whose words slide up from behind a mask (smooth, not per-character).
function RevealHeading({
  text,
  className = "",
  as = "h2",
  trigger = "view",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
  trigger?: "view" | "mount";
  delay?: number;
}) {
  const reduce = usePrefersReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return as === "h1" ? (
      <h1 className={className}>{text}</h1>
    ) : (
      <h2 className={className}>{text}</h2>
    );
  }

  const Tag = as === "h1" ? motion.h1 : motion.h2;
  const play =
    trigger === "mount"
      ? { animate: "visible" as const }
      : {
          whileInView: "visible" as const,
          // "some" (fires when any part enters) so a heading taller than the
          // viewport (small/zoomed screens) can never stay clipped/hidden.
          viewport: { once: true, amount: "some" as const },
        };

  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      {...play}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: delay } },
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          aria-hidden
          className="mr-[0.28em] inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em] last:mr-0"
        >
          <motion.span
            className="inline-block will-change-transform"
            variants={{ hidden: { y: "115%" }, visible: { y: 0 } }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

// Thin progress bar that fills as the page scrolls.
function ScrollProgress() {
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent"
      style={{ scaleX }}
    />
  );
}

// Element that eases toward the cursor on hover.
function Magnetic({
  children,
  className = "",
  strength = 0.35,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = usePrefersReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 14, mass: 0.4 });

  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* ─────────────────────────────────────────────────────────────
   NAV + depth rail
───────────────────────────────────────────────────────────── */

function NavBar({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const reduce = usePrefersReducedMotion();

  return (
    <div className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-bg/70 backdrop-blur-xl lg:hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <a
          href="#home"
          className="group flex items-center gap-2 text-ink"
          aria-label="Back to top"
        >
          <span
            className="h-2.5 w-2.5 rounded-full bg-accent transition-transform group-hover:scale-125"
            aria-hidden
          />
          <span className="font-display font-semibold tracking-tight">
            Pavle Tošić
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`link-underline block px-3.5 py-2 text-sm transition-colors ${
                  active === item.id
                    ? "text-accent-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-line-strong px-4 py-1.5 text-sm text-muted md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            className="overflow-hidden border-t border-line bg-bg/95 backdrop-blur-xl md:hidden"
          >
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={`block px-6 py-3.5 ${
                    active === item.id ? "text-accent-ink" : "text-body"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LEFT RAIL — pinned profile + vertical nav
───────────────────────────────────────────────────────────── */

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full text-lg text-muted transition-colors hover:bg-surface hover:text-ink"
    >
      {children}
    </a>
  );
}

function VerticalNav({ active }: { active: string }) {
  return (
    <nav className="mt-10 hidden lg:block" aria-label="In-page navigation">
      <ul className="space-y-1">
        {NAV.map((item) => {
          const on = active === item.id;
          return (
            <li key={item.id}>
              <a href={`#${item.id}`} className="group flex items-center py-2">
                <span
                  aria-hidden
                  className={`mr-4 h-px transition-all duration-300 ${
                    on
                      ? "w-14 bg-ink"
                      : "w-7 bg-faint group-hover:w-14 group-hover:bg-ink"
                  }`}
                />
                <span
                  className={`text-sm transition-colors ${
                    on
                      ? "font-semibold text-ink"
                      : "text-muted group-hover:text-ink"
                  }`}
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LeftRail({ active }: { active: string }) {
  const reduce = usePrefersReducedMotion();
  return (
    <header
      id="home"
      className="pt-24 pb-10 lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-[40%] lg:shrink-0 lg:flex-col lg:justify-between lg:overflow-y-auto lg:py-20"
    >
      <motion.div
        initial={reduce ? false : "hidden"}
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
        }}
      >
        <motion.div
          variants={ITEM_VARIANTS}
          className="relative mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-line-strong"
        >
          <Image
            src="/images/me.jpg"
            alt={NAME}
            fill
            sizes="96px"
            className="scale-150 object-cover object-[50%_-30%]"
            priority
          />
        </motion.div>
        <RevealHeading
          as="h1"
          trigger="mount"
          text={NAME}
          delay={0.2}
          className="text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl"
        />
        <motion.p
          variants={ITEM_VARIANTS}
          className="mt-3 text-lg font-medium text-ink"
        >
          {ROLE} <span className="text-faint">·</span>{" "}
          <span className="text-muted">{LOCATION}</span>
        </motion.p>
        <motion.p
          variants={ITEM_VARIANTS}
          className="mt-5 max-w-sm text-[15px] leading-relaxed text-body"
        >
          {TAGLINE}
        </motion.p>
        <motion.div
          variants={ITEM_VARIANTS}
          className="mt-7 flex flex-wrap items-center gap-3"
        >
          <Magnetic strength={0.3}>
            <a
              href="#work"
              className="block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent-hover"
            >
              View work
            </a>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a
              href="#contact"
              className="block rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent-ink"
            >
              Get in touch
            </a>
          </Magnetic>
        </motion.div>
        <VerticalNav active={active} />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-10 flex items-center gap-1 lg:mt-0"
      >
        <IconLink href={SOCIAL.github} label="GitHub">
          <SiGithub />
        </IconLink>
        <IconLink href={SOCIAL.linkedin} label="LinkedIn">
          <SiLinkedin />
        </IconLink>
        <IconLink href={`mailto:${SOCIAL.email}`} label="Email">
          <SiGmail />
        </IconLink>
        <IconLink href={SOCIAL.whatsapp} label="WhatsApp">
          <SiWhatsapp />
        </IconLink>
      </motion.div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
   ABOUT
───────────────────────────────────────────────────────────── */

function About() {
  return (
    <section id="about" className="scroll-mt-24 py-12 lg:py-16">
      <RevealHeading
        text="About"
        className="mb-8 text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      />
      <Reveal>
        <div className="glass rounded-2xl p-7 sm:p-9">
          <h3 className="font-display text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
            I turn ideas into{" "}
            <span className="text-gradient">shipped, working software</span>.
          </h3>
          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-body sm:text-base">
            <p>
              Software developer at{" "}
              <span className="font-medium text-ink">Infostream</span>, working
              mostly with{" "}
              <span className="font-medium text-ink">Oracle APEX</span>,{" "}
              <span className="font-medium text-ink">.NET</span>, and{" "}
              <span className="font-medium text-ink">C#</span>.{" "}
              <span className="font-medium text-ink">JavaScript</span> and{" "}
              <span className="font-medium text-ink">TypeScript</span> are my
              strongest area, and I&apos;m happy to pick up whatever framework
              or library a project needs instead of sticking to one.
            </p>
            <p>
              I build web apps front to back, and with AI tools and MCPs I move
              fast and cover the design and UX side too, not just the
              programming. Open to full-time or part-time, remote work.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-8">
            {LANGUAGES.map((l) => (
              <div key={l.label}>
                <div className="text-sm font-medium text-ink">{l.label}</div>
                <div className="text-xs text-muted">{l.level}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   STACK — language icons with names
───────────────────────────────────────────────────────────── */

function TechTile({ t }: { t: Tech }) {
  const reduce = usePrefersReducedMotion();
  const tintClass =
    t.tint === "amber"
      ? "text-accent"
      : t.tint === "cream"
        ? "text-ink"
        : t.tint === "stroke"
          ? "text-accent"
          : "";
  // Devicon logos are filled paths (tint via fill); tabler line icons are
  // strokes (tint via text colour only — filling would blob them).
  const isStroke = t.tint === "stroke";
  return (
    <motion.div
      variants={reduce ? undefined : ITEM_VARIANTS}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glass group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:border-accent/60"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center text-[26px] opacity-90 transition-transform duration-300 group-hover:scale-110 ${
          t.tint ? `${isStroke ? "" : "icon-fill-current "}${tintClass}` : ""
        }`}
      >
        <Icon icon={t.icon} aria-hidden />
      </span>
      <span className="text-sm font-medium text-ink">{t.name}</span>
    </motion.div>
  );
}

function Stack() {
  return (
    <section id="stack" className="scroll-mt-24 py-12 lg:py-16">
      <RevealHeading
        text="The stack"
        className="text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      />
      <Reveal delay={0.1}>
        <p className="mt-3 max-w-xl text-body">
          The languages and tools I reach for — across the front end, the back
          end, and the database.
        </p>
      </Reveal>

      <div className="mt-12 space-y-10">
        {STACK.map((group) => (
          <div key={group.group}>
            <Reveal>
              <h3 className="mb-4 text-sm font-medium text-muted">
                {group.group}
              </h3>
            </Reveal>
            <StaggerGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {group.items.map((t) => (
                <TechTile key={t.name} t={t} />
              ))}
            </StaggerGroup>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   WORK
───────────────────────────────────────────────────────────── */

function ProjectCard({ p }: { p: (typeof PROJECTS)[number] }) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.div
      variants={reduce ? undefined : ITEM_VARIANTS}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass group flex h-full flex-col rounded-2xl p-6 transition-colors hover:border-accent/50 sm:p-7"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-2xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent-ink">
          {p.title}
        </h3>
        {p.tag && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-ink">
            {p.tag}
          </span>
        )}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-body">{p.blurb}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {p.stack.map((s) => (
          <li
            key={s}
            className="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted"
          >
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-5 pt-2 text-sm">
        <a
          href={p.live}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline font-medium text-accent-ink"
        >
          Live demo{" "}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            ↗
          </span>
        </a>
        <a
          href={p.code}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
        >
          <SiGithub aria-hidden /> Code
        </a>
      </div>
    </motion.div>
  );
}

function Work() {
  return (
    <section id="work" className="scroll-mt-24 py-12 lg:py-16">
      <RevealHeading
        text="Things I've built"
        className="mb-10 text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      />
      <StaggerGroup className="grid gap-5 sm:grid-cols-2">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.title} p={p} />
        ))}
      </StaggerGroup>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   GITHUB
───────────────────────────────────────────────────────────── */

function GitHub() {
  return (
    <section id="github" className="scroll-mt-24 py-12 lg:py-16">
      <RevealHeading
        text="On GitHub"
        className="mb-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      />
      <Reveal>
        <p className="mb-8 max-w-xl text-body">
          Where I build in the open — a year of commits across personal
          projects, games and experiments.
        </p>
        <GitHubGraph />
      </Reveal>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   EXPERIENCE
───────────────────────────────────────────────────────────── */

function Experience() {
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });
  const lineScaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <section id="experience" className="scroll-mt-24 py-12 lg:py-16">
      <RevealHeading
        text="Where I've been"
        className="mb-10 text-3xl font-bold tracking-tight text-ink sm:text-4xl"
      />
      <ol ref={ref} className="relative ml-2 pl-0">
        <motion.span
          aria-hidden
          className="absolute left-0 top-0 h-full w-px origin-top bg-line-strong"
          style={{ scaleY: reduce ? 1 : lineScaleY }}
        />
        {EXPERIENCE.map((e, i) => (
          <li key={e.role} className="relative pb-12 pl-8 last:pb-0">
            <span
              className={`absolute -left-[6.5px] top-1.5 h-3 w-3 rounded-full ring-4 ring-bg ${
                e.current ? "bg-accent" : "bg-line-strong"
              }`}
              aria-hidden
            />
            <Reveal delay={i * 0.05}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-ink">{e.role}</h3>
                {e.current && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink">
                    Current
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-sm text-muted">
                {e.org}
                {e.period && <> · {e.period}</>}
              </div>
              <ul className="mt-3 space-y-2">
                {e.points.map((pt) => (
                  <li
                    key={pt}
                    className="relative pl-5 text-[15px] leading-relaxed text-body before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/70"
                  >
                    {pt}
                  </li>
                ))}
              </ul>
              {e.link && (
                <a
                  href={e.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-3 inline-block text-sm font-medium text-accent-ink"
                >
                  {e.link.label}
                </a>
              )}
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONTACT
───────────────────────────────────────────────────────────── */

function Contact() {
  const items = [
    {
      Icon: SiGmail,
      label: "Email",
      value: SOCIAL.email,
      href: `mailto:${SOCIAL.email}`,
    },
    {
      Icon: SiGithub,
      label: "GitHub",
      value: "github.com/Toshkee",
      href: SOCIAL.github,
    },
    {
      Icon: SiLinkedin,
      label: "LinkedIn",
      value: "in/tosiicp",
      href: SOCIAL.linkedin,
    },
    {
      Icon: SiWhatsapp,
      label: "WhatsApp",
      value: "Message me",
      href: SOCIAL.whatsapp,
    },
  ];

  return (
    <section id="contact" className="scroll-mt-24 py-16 lg:py-24">
      <div className="relative mx-auto max-w-2xl text-center">
        <RevealHeading
          text="Let's build something."
          className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl"
        />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-body">
            Open to full-time or part-time, remote. The fastest way to reach me
            is email — I usually reply within a day.
          </p>
          <div className="mt-8 flex justify-center">
            <Magnetic strength={0.3}>
              <a
                href={`mailto:${SOCIAL.email}`}
                className="block rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-accent-hover"
              >
                {SOCIAL.email}
              </a>
            </Magnetic>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {items.map(({ Icon: I, label, value, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="glass group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:border-accent/60"
              >
                <I
                  className="text-lg text-muted transition-colors group-hover:text-accent-ink"
                  aria-hidden
                />
                <span className="text-sm font-medium text-ink">{label}</span>
                <span className="ml-auto truncate text-sm text-muted">
                  {value}
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line px-5 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 py-8 sm:flex-row">
        <p className="text-sm text-muted">
          © 2026 {NAME} — {SUMMARY_SHORT}
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function Home() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <>
      <Aurora />
      <InteractiveGrid />
      <SmoothScroll />
      <ScrollProgress />
      <NavBar active={active} />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:flex lg:gap-14 lg:px-10">
        <LeftRail active={active} />
        <main id="content" className="pb-16 lg:flex-1 lg:py-28">
          <About />
          <Stack />
          <Work />
          <GitHub />
          <Experience />
          <Contact />
        </main>
      </div>
      <Footer />
    </>
  );
}
