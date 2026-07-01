"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  memo,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Icon } from "@iconify/react";
import { SiGithub, SiWhatsapp, SiGmail } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { useActiveSection } from "./useActiveSection";
import SmoothScroll from "./SmoothScroll";
import Aurora from "./Aurora";
import SectionDivider from "./SectionDivider";
import GitHubGraph from "./GitHubGraph";
import BootIntro from "./BootIntro";
import Terminal from "./Terminal";
import AskPanel from "./AskPanel";
import { registerIcons } from "./iconData";

// Defer the always-on canvas and the hero typing panel past hydration — both
// are client-only and below the critical first paint, so this trims the
// initial JS without affecting layout (canvas is fixed; the panel reserves
// its height via the loading placeholder).
const InteractiveGrid = dynamic(() => import("./InteractiveGrid"), {
  ssr: false,
});
const HeroTerminal = dynamic(() => import("./HeroTerminal"), {
  ssr: false,
  loading: () => (
    <div className="mt-8 h-[202px] rounded-xl border border-line bg-[#0a0e0b]" />
  ),
});

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

// Downloadable CV (lives in public/).
const RESUME = "/pavle-tosic-cv.pdf";

const NAV = [
  { id: "about", label: "About", file: "about.md" },
  { id: "stack", label: "Stack", file: "stack.config" },
  { id: "work", label: "Work", file: "work/" },
  { id: "github", label: "GitHub", file: "github.log" },
  { id: "experience", label: "Experience", file: "experience.log" },
  { id: "contact", label: "Contact", file: "contact.sh" },
] as const;

const SECTION_IDS = NAV.map((s) => s.id);

// Programming languages & tools with real logos (Devicon, bundled offline).
// `tint` icons are recoloured to stay legible / avoid purple brand colours.
type Tech = {
  name: string;
  icon: string;
  tint?: "amber" | "cream" | "stroke";
  learning?: boolean;
};
// Grouped by what it IS, not how often I reach for it — the tools I actually
// build with. `learning` flags the ones I'm still growing into.
const STACK: { group: string; note: string; items: Tech[] }[] = [
  {
    group: "languages",
    note: "typed, front to back",
    items: [
      { name: "TypeScript", icon: "devicon:typescript" },
      { name: "JavaScript", icon: "devicon:javascript" },
      { name: "SQL", icon: "tabler:sql", tint: "stroke" },
      { name: "C#", icon: "devicon-plain:csharp", tint: "amber", learning: true },
    ],
  },
  {
    group: "frontend",
    note: "what I build & animate in",
    items: [
      { name: "React", icon: "devicon:react" },
      { name: "Next.js", icon: "simple-icons:nextdotjs", tint: "cream" },
      { name: "Tailwind CSS", icon: "simple-icons:tailwindcss", tint: "cream" },
      { name: "GSAP", icon: "simple-icons:greensock", tint: "cream" },
      { name: "Three.js", icon: "simple-icons:threedotjs", tint: "cream" },
      { name: "Framer Motion", icon: "simple-icons:framer", tint: "cream" },
    ],
  },
  {
    group: "backend & tools",
    note: "ship it, store it, ship it again",
    items: [
      { name: "Node.js", icon: "devicon:nodejs" },
      { name: "Oracle APEX", icon: "devicon:oracle" },
      { name: "PostgreSQL", icon: "devicon:postgresql" },
      { name: ".NET", icon: "devicon-plain:dotnetcore", tint: "amber", learning: true },
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
      "A real-time crypto futures & spot trading terminal — it streams live Binance market data over WebSockets into candlestick charts, a depth order book and a live trades tape, then settles every position server-side with paper money. React 19 and TypeScript on a Django REST engine.",
    problem:
      "Practise leveraged futures trading with the feel of a real exchange — live prices and real settlement math — and none of the real-money risk.",
    highlights: [
      "Direct Binance WebSocket feeds — mark price, depth, live candles and the trades tape over one multiplexed socket, with auto-reconnect and a staleness watchdog",
      "Server-authoritative engine — 1–125× leverage with long/short PnL and liquidation math computed server-side; client-supplied prices are ignored by design",
      "Concurrency-safe wallet — every balance change runs under a row lock and an atomic transaction with DB constraints, so money can't be double-spent",
    ],
    role: "Solo build",
    context: "General Assembly · rebuilt 2026",
    stack: ["React 19", "TypeScript", "Django REST", "WebSockets", "PostgreSQL"],
    live: "https://cryptofloww.netlify.app/",
    code: "https://github.com/Toshkee/CryptoFlow",
    shot: "/images/projects/cryptoflow.jpg",
    video: "/video/projects/cryptoflow.mp4" as string | null,
    domain: "cryptofloww.netlify.app",
    gallery: [
      { src: "/images/projects/cryptoflow-terminal.jpg", label: "Trading terminal" },
      { src: "/images/projects/cryptoflow-markets.jpg", label: "Live markets" },
      { src: "/images/projects/cryptoflow-landing.jpg", label: "Landing" },
    ] as { src: string; label: string }[],
  },
  {
    title: "Meet2Explore",
    blurb:
      "Full-stack React travel app to discover destinations and find companions — built collaboratively with a team of four.",
    problem:
      "Help travellers pick a destination and find people to explore it with.",
    highlights: [
      "Built in a team of four — owned the React front end",
      "Destination discovery with travel-companion matching",
      "React SPA talking to a Node/Express API",
    ],
    role: "Team of 4 · front end",
    context: "General Assembly · 2025",
    stack: ["React", "Node.js", "Express"],
    live: "https://meet2explore.netlify.app/",
    code: "https://github.com/Toshkee/meet2explore",
    shot: "/images/projects/meet2explore.jpg",
    video: "/video/projects/meet2explore.mp4",
    domain: "meet2explore.netlify.app",
    gallery: [
      { src: "/images/projects/meet2explore-hero.jpg", label: "Discover destinations" },
      { src: "/images/projects/meet2explore-trips.jpg", label: "Plan group trips" },
    ] as { src: string; label: string }[],
  },
  {
    title: "Ronin Duel",
    blurb:
      "A juice-driven 2D fighting game that runs in the browser — two dueling ronin, frame-accurate combat and an AI opponent, built on Phaser 4 and TypeScript. A full rebuild of a vanilla-JS bootcamp prototype into a tested, CI-deployed game.",
    problem:
      "Make browser combat actually feel good — weighty hits, a real AI opponent and game-feel polish — on top of a tested, production-grade codebase.",
    highlights: [
      "Frame-accurate combat — attacks expose a hitbox only on their active frames against the opponent's hurtbox, with a pure, unit-tested damage core",
      "Play single-player against a finite-state-machine AI (Easy / Normal / Hard) or 2-player local, over best-of-three rounds",
      "A game-feel layer on every hit — hitstop, screen shake, knockback, particles and a slow-mo KO; all sound synthesised at runtime with the Web Audio API",
    ],
    role: "Solo build",
    context: "General Assembly · rebuilt 2026",
    stack: ["Phaser 4", "TypeScript", "Vite", "Vitest", "Playwright"],
    live: "https://toshkee.github.io/Ronin-Duel/",
    code: "https://github.com/Toshkee/Ronin-Duel",
    shot: "/images/projects/ronin-duel.jpg",
    video: "/video/projects/ronin-duel.mp4",
    domain: "toshkee.github.io",
    gallery: [
      { src: "/images/projects/ronin-duel-menu.jpg", label: "Title & mode select" },
      { src: "/images/projects/ronin-duel-fight.jpg", label: "In-match combat" },
    ] as { src: string; label: string }[],
  },
  {
    title: "Arc — Anime Tracker",
    blurb:
      "A modern anime tracker — search 500,000+ titles from the live AniList GraphQL API, build a watchlist, track episode progress and ratings, then turn your taste into stats. A full rebuild of a bootcamp Express and MongoDB app on Next.js 16 and TypeScript.",
    problem:
      "Track what you're watching against a live, half-million-title catalogue — and rebuild a fragile bootcamp CRUD app into a typed, tested, server-rendered product.",
    highlights: [
      "Live AniList GraphQL catalogue of 500k+ titles, proxied and cached server-side, with URL-driven filters and Suspense-streamed browse rows",
      "Auth.js sign-in and an owner-scoped watchlist with a full status workflow and optimistic UI, backed by Prisma and PostgreSQL",
      "Personal stats dashboard — episodes and hours watched, completion rate, score distribution and genre mix, charted with Recharts",
    ],
    role: "Solo build",
    context: "General Assembly · rebuilt 2026",
    stack: ["Next.js 16", "TypeScript", "AniList API", "Prisma", "PostgreSQL"],
    live: "https://arc-anime.vercel.app",
    code: "https://github.com/Toshkee/anime-watchlist",
    shot: "/images/projects/anime-watchlist.jpg",
    video: "/video/projects/anime-watchlist.mp4",
    domain: "arc-anime.vercel.app",
    gallery: [
      { src: "/images/projects/anime-watchlist-home.jpg", label: "Search & trending" },
      { src: "/images/projects/anime-watchlist-browse.jpg", label: "Browse catalogue" },
      { src: "/images/projects/anime-watchlist-detail.jpg", label: "Title detail" },
    ] as { src: string; label: string }[],
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

// One shared, lazily-created MediaQueryList. Without this, every render of the
// 30+ components that read reduced-motion allocated a fresh MediaQueryList (and
// each subscribe added its own listener). getSnapshot now just reads `.matches`
// — a cheap property read with no allocation.
let reduceMql: MediaQueryList | null = null;
function getReduceMql() {
  if (!reduceMql && typeof window !== "undefined") {
    reduceMql = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return reduceMql;
}
function subscribeReduce(onChange: () => void) {
  const mq = getReduceMql();
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function getReduceSnapshot() {
  return getReduceMql()?.matches ?? false;
}

// Hydration-safe prefers-reduced-motion (server snapshot = false).
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReduce, getReduceSnapshot, () => false);
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
  id,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
  trigger?: "view" | "mount";
  delay?: number;
  id?: string;
}) {
  const reduce = usePrefersReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return as === "h1" ? (
      <h1 id={id} className={className}>
        {text}
      </h1>
    ) : (
      <h2 id={id} className={className}>
        {text}
      </h2>
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
      id={id}
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
            className="inline-block"
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

// Thin progress bar that fills as the page scrolls. Bound straight to
// scrollYProgress (no useSpring): the spring re-eased a value the scroller had
// already smoothed, so the bar visibly lagged the page; 1:1 reads crisper and
// stays a compositor-only transform. memo: it takes no props, so it no longer
// re-renders every time the active-section state changes in Home.
const ScrollProgress = memo(function ScrollProgress() {
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent"
      style={{ scaleX: scrollYProgress }}
    />
  );
});

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
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
    <div className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-bg/70 backdrop-blur-md lg:hidden">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"
        aria-label="Primary"
      >
        <a
          href="#home"
          className="group flex items-center gap-2 text-ink"
          aria-label="Back to top"
        >
          <span
            className="h-2.5 w-2.5 rounded-full bg-accent transition-transform group-hover:scale-125"
            aria-hidden
          />
          <span className="font-display font-semibold">
            Pavle Tošić
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
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
            className="overflow-hidden border-t border-line bg-bg/95 backdrop-blur-md md:hidden"
          >
            {NAV.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === item.id ? "true" : undefined}
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
  const reduce = usePrefersReducedMotion();
  return (
    <nav
      className="mt-10 hidden font-mono lg:block"
      aria-label="In-page navigation"
    >
      <p aria-hidden className="mb-2 select-none text-[11px] text-faint">
        ~/pavle
      </p>
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const on = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-label={item.label}
                aria-current={on ? "true" : undefined}
                className="group flex items-center gap-1.5 py-1 text-sm"
              >
                {/* a phosphor cursor marks the "open" file and glides between
                    entries as the section changes — terminal-native, not the
                    ubiquitous sliding nav-dash. */}
                <span
                  aria-hidden
                  className="relative flex h-4 w-3 items-center justify-center"
                >
                  {on ? (
                    reduce ? (
                      <span className="text-accent-ink">▸</span>
                    ) : (
                      <motion.span
                        layoutId="nav-caret"
                        className="text-accent-ink"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      >
                        ▸
                      </motion.span>
                    )
                  ) : (
                    <span className="text-faint/60 transition-colors group-hover:text-accent-ink/70">
                      ·
                    </span>
                  )}
                </span>
                <span
                  className={`transition-colors ${
                    on
                      ? "font-semibold text-accent-ink"
                      : "text-muted group-hover:text-ink"
                  }`}
                >
                  {item.file}
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
          whileHover={
            reduce
              ? undefined
              : {
                  scale: 1.03,
                  boxShadow: "0 0 22px -2px rgba(34, 197, 94, 0.45)",
                }
          }
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="relative mb-6 h-24 w-24 overflow-hidden rounded-2xl border border-line-strong transition-colors hover:border-accent/50"
        >
          <Image
            src="/images/me-avatar.jpg"
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
          className="text-4xl font-bold leading-[1.06] text-ink sm:text-5xl"
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
          className="mt-5 flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-xs text-accent-ink"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          open to full-time / part-time · remote
        </motion.div>
        <motion.div
          variants={ITEM_VARIANTS}
          className="mt-7 flex flex-wrap items-center gap-3"
        >
          <Magnetic strength={0.3}>
            <a
              href="#work"
              className="glow-hover block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-hover"
            >
              View work
            </a>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a
              href="#contact"
              className="glow-hover block rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent-ink"
            >
              Get in touch
            </a>
          </Magnetic>
          <a
            href={RESUME}
            download
            className="link-underline ml-1 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent-ink"
          >
            Résumé <span aria-hidden>↓</span>
          </a>
        </motion.div>
        <VerticalNav active={active} />
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="mt-10 flex items-center gap-1 lg:mt-0 lg:border-t lg:border-line/60 lg:pt-8"
      >
        <IconLink href={SOCIAL.github} label="GitHub">
          <SiGithub />
        </IconLink>
        <IconLink href={SOCIAL.linkedin} label="LinkedIn">
          <FaLinkedin />
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

const About = memo(function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="py-14 lg:py-20"
    >
      <RevealHeading
        id="about-heading"
        text="About"
        className="mb-10 text-3xl font-bold text-ink sm:text-4xl"
      />
      <Reveal>
        <div className="glass rounded-2xl p-7 sm:p-9">
          <h3 className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">
            I turn ideas into{" "}
            <span className="text-gradient">shipped, working software</span>.
          </h3>
          <div className="mt-6 max-w-[68ch] space-y-4 text-[15px] leading-relaxed text-body sm:text-base">
            <p>
              Software developer at{" "}
              <span className="font-medium text-ink">Infostream</span>, working
              mostly with{" "}
              <span className="font-medium text-ink">Oracle APEX</span>,{" "}
              <span className="font-medium text-ink">.NET</span>, and{" "}
              <span className="font-medium text-ink">C#</span>.{" "}
              <span className="font-medium text-ink">JavaScript</span> and{" "}
              <span className="font-medium text-ink">TypeScript</span>{" "}
              are my strongest area, and I&apos;m happy to pick up whatever
              framework or library a project needs instead of sticking to one.
            </p>
            <p>
              I build web apps front to back — database and API through to the
              UI — and with{" "}
              <span className="font-medium text-ink">AI tools</span> and{" "}
              <span className="font-medium text-ink">MCPs</span>{" "}
              in my workflow I move fast and cover the design and UX side too,
              not just the code. Right now I&apos;m building a few side projects
              of my own — I&apos;ll be adding them here as they ship. Open to
              full-time or part-time, remote work.
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
          <HeroTerminal />
        </div>
      </Reveal>
    </section>
  );
});

/* ─────────────────────────────────────────────────────────────
   STACK — language icons with names
───────────────────────────────────────────────────────────── */

function TechChip({ t }: { t: Tech }) {
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
    <motion.span
      variants={reduce ? undefined : ITEM_VARIANTS}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="glow-hover group inline-flex items-center gap-2 rounded-lg border border-line bg-bg/40 px-3 py-2 hover:border-accent/60"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center text-[18px] opacity-90 transition-transform duration-300 group-hover:scale-110 ${
          t.tint ? `${isStroke ? "" : "icon-fill-current "}${tintClass}` : ""
        }`}
      >
        <Icon icon={t.icon} aria-hidden />
      </span>
      <span className="font-mono text-sm font-medium text-ink">{t.name}</span>
      {t.learning && (
        <span className="rounded border border-line px-1 py-px font-mono text-[9px] uppercase tracking-wide text-faint">
          learning
        </span>
      )}
    </motion.span>
  );
}

const Stack = memo(function Stack() {
  return (
    <section
      id="stack"
      aria-labelledby="stack-heading"
      className="py-14 lg:py-20"
    >
      <RevealHeading
        id="stack-heading"
        text="The stack"
        className="text-3xl font-bold text-ink sm:text-4xl"
      />
      <Reveal delay={0.1}>
        <p className="mt-3 max-w-xl text-body">
          What I actually build with — a JavaScript/TypeScript core, the frontend
          I design and animate in, and the backend that ships and stores it.
        </p>
      </Reveal>

      {/* One manifest panel (window-chromed like the project frames & hero
          terminal) instead of four separate card grids — each category is a
          row of inline logo chips, divided by faint rules. */}
      <Reveal delay={0.15}>
        <div className="mt-10 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-line/70 bg-bg/50 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-faint/70" />
            <span className="h-2 w-2 rounded-full bg-accent/70" />
            <span className="h-2 w-2 rounded-full bg-accent-2/70" />
            <span className="ml-2 font-mono text-[11px] text-muted">
              stack.config
            </span>
          </div>
          <div className="divide-y divide-line/60">
            {STACK.map((group) => (
              <div
                key={group.group}
                className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6"
              >
                <div className="flex shrink-0 flex-col gap-0.5 font-mono text-sm sm:min-w-[10rem]">
                  <span className="whitespace-nowrap font-semibold text-accent-ink">
                    {group.group}
                  </span>
                  <span className="whitespace-nowrap text-[11px] text-faint">
                    {"// "}
                    {group.note}
                  </span>
                </div>
                <StaggerGroup className="flex flex-1 flex-wrap gap-2.5">
                  {group.items.map((t) => (
                    <TechChip key={t.name} t={t} />
                  ))}
                </StaggerGroup>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
});

/* ─────────────────────────────────────────────────────────────
   WORK
───────────────────────────────────────────────────────────── */

// Full-screen image viewer for a project's screenshot gallery. Rendered through
// a portal to document.body so it escapes the transformed <article> ancestors
// (framer-motion writes `transform`, which would otherwise trap position:fixed).
function Lightbox({
  items,
  title,
  index,
  setIndex,
}: {
  items: { src: string; label: string }[];
  title: string;
  index: number | null;
  setIndex: Dispatch<SetStateAction<number | null>>;
}) {
  const reduce = usePrefersReducedMotion();
  const open = index !== null;
  const count = items.length;
  const go = (dir: number) =>
    setIndex((i) => (i === null ? i : (i + dir + count) % count));

  // While open: Esc closes, arrows navigate, and body scroll is locked.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, count]);

  if (typeof document === "undefined") return null;
  const cur = index !== null ? items[index] : null;

  return createPortal(
    <AnimatePresence>
      {open && cur && (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-4 bg-black/85 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.22 }}
          onClick={() => setIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} screenshots`}
        >
          <button
            type="button"
            onClick={() => setIndex(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/80 font-mono text-muted transition-colors hover:border-accent/60 hover:text-ink"
          >
            ✕
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous screenshot"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/80 text-xl text-muted transition-colors hover:border-accent/60 hover:text-ink sm:left-5"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next screenshot"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/80 text-xl text-muted transition-colors hover:border-accent/60 hover:text-ink sm:right-5"
              >
                ›
              </button>
            </>
          )}

          <div
            className="w-[min(94vw,1200px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line bg-bg shadow-2xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.2 }}
                >
                  <Image
                    src={cur.src}
                    alt={`${title} — ${cur.label}`}
                    fill
                    sizes="94vw"
                    className="object-contain"
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-xs text-muted">
              <span className="truncate text-body">{cur.label}</span>
              <span className="shrink-0 pl-3">
                {(index ?? 0) + 1} / {count}
              </span>
            </div>
          </div>

          {count > 1 && (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((g, i) => (
                <button
                  key={g.src}
                  type="button"
                  aria-label={`Go to ${g.label}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-6 bg-accent"
                      : "w-2.5 bg-faint/60 hover:bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ProjectShowcase({
  p,
  index,
}: {
  p: (typeof PROJECTS)[number];
  index: number;
}) {
  const reduce = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lb, setLb] = useState<number | null>(null);
  const even = index % 2 === 0;
  // On lg, alternate which side the screenshot sits on. Mobile always stacks
  // screenshot-on-top (natural DOM order).
  const imgOrder = even ? "lg:order-1" : "lg:order-2";
  const txtOrder = even ? "lg:order-2" : "lg:order-1";

  // Only play a demo while it is actually on screen — keeps 3 off-screen
  // clips from decoding/looping. Under reduced motion we never autoplay and
  // expose native controls instead so the demo stays reachable.
  useEffect(() => {
    if (reduce) return;
    const v = videoRef.current;
    if (!v) return;
    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25, rootMargin: "200px 0px" }
    );
    io.observe(v);
    // A looping muted video keeps decoding frames in a backgrounded tab; pause
    // it while hidden and resume only if it's still on screen.
    const onVisibility = () => {
      if (document.hidden) v.pause();
      else if (inView) v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return (
    <Reveal>
      <article className="group grid items-center gap-6 lg:grid-cols-2 lg:gap-9">
        {/* Screenshot column — framed demo on top, then a thumbnail gallery
            that opens a lightbox. On lg the gallery fills the space next to the
            taller text column so the row never reads as empty. */}
        <div className={`${imgOrder} flex flex-col gap-4`}>
          {/* Browser-framed demo preview (decorative — the live site opens from
              the "Live demo" button, not by clicking the frame). */}
          <motion.div
            whileHover={
              reduce
                ? undefined
                : {
                    y: -6,
                    boxShadow:
                      "0 0 0 1px rgba(34,197,94,0.32), 0 16px 42px -14px rgba(34,197,94,0.45)",
                  }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-colors hover:border-accent/50"
          >
            <div className="flex items-center gap-1.5 border-b border-line/70 bg-bg/50 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-faint/70" />
              <span className="h-2 w-2 rounded-full bg-accent/70" />
              <span className="h-2 w-2 rounded-full bg-accent-2/70" />
              <span className="ml-2 truncate font-mono text-[11px] text-muted">
                {p.domain}
              </span>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden bg-bg">
              {p.video ? (
                <video
                  ref={videoRef}
                  src={p.video}
                  poster={p.shot}
                  muted
                  loop
                  playsInline
                  preload="none"
                  controls={reduce}
                  aria-label={`${p.title} demo`}
                  className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <Image
                  src={p.shot}
                  alt={`${p.title} live preview`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              )}
            </div>
          </motion.div>

          {/* Thumbnail gallery — click any shot to open the lightbox */}
          {p.gallery.length > 0 && (
            <ul
              className={`grid gap-3 ${
                p.gallery.length === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {p.gallery.map((g, i) => (
                <li key={g.src}>
                  <button
                    type="button"
                    onClick={() => setLb(i)}
                    aria-label={`View screenshot: ${g.label}`}
                    className="group/thumb relative block aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-bg transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <Image
                      src={g.src}
                      alt={`${p.title} — ${g.label}`}
                      fill
                      sizes="(max-width: 1024px) 32vw, 15vw"
                      className="object-cover object-top transition-transform duration-500 ease-out group-hover/thumb:scale-[1.06]"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/5 to-transparent p-2 opacity-0 transition-opacity duration-300 group-hover/thumb:opacity-100">
                      <span className="truncate font-mono text-[10px] text-white/90">
                        {g.label}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Project detail */}
        <div className={txtOrder}>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-bold text-ink transition-colors group-hover:text-accent-ink">
              {p.title}
            </h3>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-body">{p.blurb}</p>
          {p.problem && (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              <span className="font-medium text-accent-ink">Challenge — </span>
              {p.problem}
            </p>
          )}
          {p.highlights && (
            <ul className="mt-3 space-y-1.5">
              {p.highlights.map((h) => (
                <li
                  key={h}
                  className="relative pl-5 text-sm leading-relaxed text-body before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/70"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="font-mono text-xs text-muted">role</dt>
              <dd className="text-sm text-body">{p.role}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs text-muted">built</dt>
              <dd className="text-sm text-body">{p.context}</dd>
            </div>
          </dl>
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
          <div className="mt-6 flex items-center gap-5 text-sm">
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
        </div>

        <Lightbox
          items={p.gallery}
          title={p.title}
          index={lb}
          setIndex={setLb}
        />
      </article>
    </Reveal>
  );
}

const Work = memo(function Work() {
  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="py-16 lg:py-28"
    >
      <RevealHeading
        id="work-heading"
        text="Things I've built"
        className="mb-10 text-3xl font-bold text-ink sm:text-4xl"
      />
      <div className="space-y-16 lg:space-y-24">
        {PROJECTS.map((p, i) => (
          <ProjectShowcase key={p.title} p={p} index={i} />
        ))}
      </div>
    </section>
  );
});

/* ─────────────────────────────────────────────────────────────
   GITHUB
───────────────────────────────────────────────────────────── */

const GitHub = memo(function GitHub() {
  return (
    <section
      id="github"
      aria-labelledby="github-heading"
      className="py-16 lg:py-28"
    >
      <RevealHeading
        id="github-heading"
        text="On GitHub"
        className="mb-3 text-3xl font-bold text-ink sm:text-4xl"
      />
      <Reveal>
        <p className="mb-8 max-w-xl text-body">
          Where I build in the open — commits across personal projects, games
          and experiments.
        </p>
        <GitHubGraph />
      </Reveal>
    </section>
  );
});

/* ─────────────────────────────────────────────────────────────
   EXPERIENCE
───────────────────────────────────────────────────────────── */

const Experience = memo(function Experience() {
  const reduce = usePrefersReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="py-14 lg:py-20"
    >
      <RevealHeading
        id="experience-heading"
        text="Where I've been"
        className="mb-10 text-3xl font-bold text-ink sm:text-4xl"
      />
      <ol ref={ref} className="relative ml-2 pl-0">
        <motion.span
          aria-hidden
          className="absolute left-0 top-0 h-full w-px origin-top bg-line-strong"
          style={{ scaleY: reduce ? 1 : scrollYProgress }}
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
});

/* ─────────────────────────────────────────────────────────────
   CONTACT
───────────────────────────────────────────────────────────── */

const Contact = memo(function Contact() {
  const reduce = usePrefersReducedMotion();
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SOCIAL.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the mailto link still works */
    }
  };

  const channels = [
    {
      Icon: SiGithub,
      label: "GitHub",
      value: "github.com/Toshkee",
      href: SOCIAL.github,
    },
    {
      Icon: FaLinkedin,
      label: "LinkedIn",
      value: "in/tosiicp",
      href: SOCIAL.linkedin,
    },
    {
      Icon: SiWhatsapp,
      label: "WhatsApp",
      value: "+382 67 474 438",
      href: SOCIAL.whatsapp,
    },
  ];

  const copyGlyph = (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
  const checkGlyph = (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="py-16 lg:py-24"
    >
      <RevealHeading
        id="contact-heading"
        text="Let's build something."
        className="text-3xl font-bold text-ink sm:text-4xl lg:text-5xl"
      />
      <Reveal delay={0.1}>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-body">
          Open to full-time or part-time, remote. The fastest way to reach me is
          email — I usually reply within a day.
        </p>
      </Reveal>

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Primary: the email, copyable, with one clear send CTA. */}
        <Reveal delay={0.15}>
          <div className="glass rounded-2xl p-6 sm:p-8">
            <div className="font-mono text-xs text-muted">drop me a line</div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={`mailto:${SOCIAL.email}`}
                className="link-underline break-all font-mono text-lg font-medium text-accent-ink sm:text-xl"
              >
                {SOCIAL.email}
              </a>
              <motion.button
                type="button"
                onClick={copyEmail}
                aria-label="Copy email address"
                whileTap={reduce ? undefined : { scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="glow-hover inline-flex w-[5.4rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-bg/40 px-3 py-1.5 font-mono text-xs font-medium text-muted hover:border-accent/60 hover:text-ink"
              >
                {reduce ? (
                  <span
                    className={`inline-flex items-center gap-1.5 ${copied ? "text-accent-ink" : ""}`}
                  >
                    {copied ? checkGlyph : copyGlyph}
                    {copied ? "copied" : "copy"}
                  </span>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied ? "done" : "idle"}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: EASE }}
                      className={`inline-flex items-center gap-1.5 ${copied ? "text-accent-ink" : ""}`}
                    >
                      {copied ? checkGlyph : copyGlyph}
                      {copied ? "copied" : "copy"}
                    </motion.span>
                  </AnimatePresence>
                )}
              </motion.button>
            </div>
            <span aria-live="polite" className="sr-only">
              {copied ? "Email address copied to clipboard" : ""}
            </span>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Magnetic strength={0.3}>
                <a
                  href={`mailto:${SOCIAL.email}`}
                  className="glow-hover inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-bg hover:bg-accent-hover"
                >
                  <SiGmail aria-hidden /> Email me
                </a>
              </Magnetic>
              <a
                href={RESUME}
                download
                className="link-underline inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent-ink"
              >
                Download CV <span aria-hidden>↓</span>
              </a>
            </div>
          </div>
        </Reveal>

        {/* Channels as a divided list — not a card grid. */}
        <Reveal delay={0.2}>
          <ul className="glass divide-y divide-line/60 rounded-2xl p-2 sm:p-3">
            {channels.map(({ Icon: I, label, value, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-accent-soft"
                >
                  <I
                    className="shrink-0 text-xl text-muted transition-colors group-hover:text-accent-ink"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{label}</div>
                    <div className="truncate font-mono text-xs text-muted">
                      {value}
                    </div>
                  </div>
                  <span
                    className="ml-auto text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent-ink"
                    aria-hidden
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
});

const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-line px-5 sm:px-8">
      {/* extra bottom padding clears the fixed Terminal command bar */}
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 pt-8 pb-24 sm:flex-row">
        <p className="text-sm text-muted">
          © 2026 {NAME} — {SUMMARY_SHORT}
        </p>
      </div>
    </footer>
  );
});

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function Home() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <>
      <BootIntro />
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <Aurora />
      <InteractiveGrid />
      <SmoothScroll />
      <ScrollProgress />
      <NavBar active={active} />

      <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:flex lg:gap-14 lg:px-10">
        <LeftRail active={active} />
        <main id="content" tabIndex={-1} className="pb-16 outline-none lg:flex-1 lg:py-28">
          <About />
          <SectionDivider dur={7} />
          <Stack />
          <SectionDivider dur={8.5} reverse />
          <Work />
          <SectionDivider dur={6.5} />
          <GitHub />
          <SectionDivider dur={9} reverse />
          <Experience />
          <SectionDivider dur={7.5} />
          <Contact />
        </main>
      </div>
      <Footer />
      <Terminal
        name={NAME}
        role={ROLE}
        location={LOCATION}
        social={SOCIAL}
        resume={RESUME}
        projects={PROJECTS}
      />
      <AskPanel />
    </>
  );
}
