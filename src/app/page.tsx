"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import {
  memo,
  useCallback,
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
  useMotionValue,
} from "framer-motion";
import { Icon } from "@iconify/react";
import { SiGithub, SiGmail } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import GitHubGraph from "./GitHubGraph";
import { pageCtx } from "./characterBus";
import BootIntro from "./BootIntro";
import Terminal from "./Terminal";
import AskPanel from "./AskPanel";
import { registerIcons } from "./iconData";
import { useActiveSection } from "./useActiveSection";

// Digital-rain background — reacts to the active section. Client-only (canvas)
// and purely decorative, so it loads after hydration like the other canvases.
const MatrixRain = dynamic(() => import("./MatrixRain"), {
  ssr: false,
});
// Playful phosphor characters — a droid that rappels the right margin as you
// move through the deck, and a bug that roams the viewport greeting the cursor.
// Desktop-only, purely decorative, so they load after hydration like the
// canvases above.
// The ambient cast (droid, bug + cat/daemon/ghost/slime) — each spawns only on
// the section it hosts. Client-only + below the fold, so it loads post-hydration.
const AmbientCast = dynamic(() => import("./AmbientCast"), { ssr: false });
const HeroTerminal = dynamic(() => import("./HeroTerminal"), {
  ssr: false,
  loading: () => (
    <div className="h-[202px] rounded-xl border border-line bg-[#0a0e0b]" />
  ),
});
// Live Binance market feed for the CryptoFlow kiosk's "live" tab. Client-only
// (WebSocket) and only mounts when that tab is opened, so it stays out of the
// initial bundle like the canvases above.
const LiveTicker = dynamic(() => import("./LiveTicker"), { ssr: false });

// Make the bundled Devicon set available for synchronous SSR rendering.
registerIcons();

/* ─────────────────────────────────────────────────────────────
   DATA  (from CV)
───────────────────────────────────────────────────────────── */

const NAME = "Pavle Tošić";
const ROLE = "Software Developer";
const LOCATION = "Montenegro";
const TAGLINE =
  "I build web apps front to back. TypeScript and React by choice, Oracle APEX and SQL on the job.";

const SOCIAL = {
  email: "tosiicsftw@gmail.com",
  github: "https://github.com/Toshkee",
  linkedin: "https://www.linkedin.com/in/tosiicp/",
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

// Module-level constant so useActiveSection's effect never re-subscribes.
const SECTION_IDS: string[] = NAV.map((n) => n.id);

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
const STACK: { group: string; items: Tech[] }[] = [
  {
    group: "languages",
    items: [
      { name: "TypeScript", icon: "devicon:typescript" },
      { name: "JavaScript", icon: "devicon:javascript" },
      { name: "SQL", icon: "tabler:sql", tint: "stroke" },
      { name: "C#", icon: "devicon-plain:csharp", tint: "amber", learning: true },
    ],
  },
  {
    group: "frontend",
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
      "A real-time crypto futures & spot trading terminal: live Binance data streamed over WebSockets into candle charts, a depth order book and a trades tape; every position settles server-side with paper money.",
    problem:
      "Practise leveraged futures trading with the feel of a real exchange, live prices and real settlement math included, and none of the real-money risk.",
    highlights: [
      "Live Binance WebSocket feeds: candles, depth and trades on one socket",
      "Server-authoritative engine: 1-125× leverage, client prices ignored",
      "Concurrency-safe wallet: row locks and atomic transactions",
    ],
    role: "Solo build",
    context: "General Assembly, rebuilt 2026",
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
    title: "Arc: Anime Tracker",
    blurb:
      "A modern anime tracker: search 500,000+ live AniList titles, build a watchlist, track episodes and ratings, then turn your taste into stats. A bootcamp CRUD app rebuilt on Next.js 16 and TypeScript.",
    problem:
      "Track what you're watching against a live, half-million-title catalogue, and rebuild a fragile bootcamp CRUD app into a typed, tested, server-rendered product.",
    highlights: [
      "Live AniList GraphQL catalogue, proxied and cached server-side",
      "Auth.js sign-in, owner-scoped watchlist on Prisma + PostgreSQL",
      "Stats dashboard: episodes, hours, completion, score and genre mix",
    ],
    role: "Solo build",
    context: "General Assembly, rebuilt 2026",
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
  {
    title: "Ronin Duel",
    blurb:
      "A juice-driven 2D fighting game in the browser: two dueling ronin, frame-accurate combat and an AI opponent. A vanilla-JS bootcamp prototype rebuilt into a tested, CI-deployed Phaser 4 game.",
    problem:
      "Make browser combat actually feel good, with weighty hits, a real AI opponent and game-feel polish, on top of a tested, production-grade codebase.",
    highlights: [
      "Hitboxes live only on active frames, backed by a unit-tested damage core",
      "State-machine AI (Easy / Normal / Hard) or 2-player local",
      "Hitstop, screen shake, knockback, slow-mo KO and Web Audio sound",
    ],
    role: "Solo build",
    context: "General Assembly, rebuilt 2026",
    stack: ["Phaser 4", "TypeScript", "Vite", "Vitest", "Playwright"],
    live: "https://toshkee.github.io/Ronin-Duel/",
    code: "https://github.com/Toshkee/Ronin-Duel",
    shot: "/images/projects/ronin-duel.jpg",
    video: "/video/projects/ronin-duel.mp4",
    domain: "toshkee.github.io",
    gallery: [
      { src: "/images/projects/ronin-duel-menu.jpg", label: "Title & mode select" },
      { src: "/images/projects/ronin-duel-fight.jpg", label: "In-match combat" },
      { src: "/images/projects/ronin-duel-combo.jpg", label: "Combos & hit effects" },
    ] as { src: string; label: string }[],
  },
  {
    title: "Meet2Explore",
    blurb:
      "Full-stack React travel app to discover destinations and find companions, built collaboratively with a team of four.",
    problem:
      "Help travellers pick a destination and find people to explore it with.",
    highlights: [
      "Team of four with real git flow: branches, PRs, merged final releases",
      "Owned a full-stack slice: city discovery, trip join/leave, live chat",
      "Socket.IO room-per-trip chat persisting history to MongoDB",
    ],
    role: "Team of 4, full-stack slice",
    context: "General Assembly, 2025",
    stack: ["React", "Node.js", "Express"],
    live: "https://meet2explore.netlify.app/",
    code: "https://github.com/Toshkee/meet2explore",
    shot: "/images/projects/meet2explore.jpg",
    video: "/video/projects/meet2explore.mp4",
    domain: "meet2explore.netlify.app",
    gallery: [
      { src: "/images/projects/meet2explore-hero.jpg", label: "Discover destinations" },
      { src: "/images/projects/meet2explore-trips.jpg", label: "Plan group trips" },
      { src: "/images/projects/meet2explore-meet.jpg", label: "Meet new people" },
    ] as { src: string; label: string }[],
  },
];

// PROJECTS[].live → its backend API, hosted on a free tier that sleeps when
// idle (CryptoFlow: Render spins down after ~15 min, cold start ~30-60s).
// Pinged awake on page load (see Home) so a "Live demo" click later hits a
// warm backend instead of hanging. Meet2Explore's Heroku backend is gone
// (404s), so it is NOT pinged — its state is disclosed via DEMO_NOTES instead.
const COLD_APIS: Record<string, string> = {
  "https://cryptofloww.netlify.app/": "https://cryptoflow-api-cx07.onrender.com/",
};

// PROJECTS[].live → a one-line honest status shown under the demo links.
const DEMO_NOTES: Record<string, string> = {
  "https://cryptofloww.netlify.app/":
    "demo api runs on a free tier, so the first request may take a moment to wake",
  "https://meet2explore.netlify.app/":
    "the demo's backend host has lapsed, so sign-in and live trips are offline. the video shows the full app",
};

// Engineering "case files", shown as extra tabs on each project's kiosk
// frame. Every line is grounded in the actual repos (cloned + mined) — the
// arch trees, the "what broke" notes and the code excerpts all point at real
// files. Don't add claims that aren't in the code.
const CRYPTOFLOW_CASE = {
  // Lines are kept ≤ ~42 chars so nothing clips at the kiosk frame width.
  codeFile: "close.py",
  arch: `browser ── react 19 + vite SPA
 │  wss → binance
 │   ticker · depth20 · kline · aggTrade
 │   one multiplexed socket
 │   auto-reconnect · 8s watchdog
 └─ REST + JWT
     django rest framework
      ├ accounts/ auth · throttles
      ├ markets/  spot · price authority
      │    ~3s price cache · fail-fast 503
      └ futures/  1–125× perps
           margin + liquidation math
           postgres · row locks
           CHECK (balance >= 0)`,
  notes: `## what broke, what I did about it

- client prices meant infinite money.
  every fill now uses the server's own
  Binance price; the client's number
  is ignored by design.

- double-spend race on the wallet.
  every balance change runs in
  transaction.atomic() +
  select_for_update(), with a DB
  CHECK (balance >= 0) behind it.

- transfers lock both wallets in a
  fixed order — no deadlocks.

- proven, not assumed: threaded
  double-close / double-spend tests
  race a real Postgres in CI.`,
  code: `# futures/views.py — close a position
pnl = calculate_pnl(
    pos.entry_price, current_price,
    pos.side, pos.amount,
)

# credit is floored at 0: a blown-up
# position loses at most its margin,
# so the wallet never goes negative.
credited = max(
    Decimal("0"),
    pos.initial_margin + pnl,
)

pos.status = "CLOSED"
pos.closed_at = timezone.now()
pos.pnl = pnl
pos.save()

wallet.balance += credited
wallet.save()`,
};

// Ronin Duel — grounded in github.com/Toshkee/Ronin-Duel (src/core, the
// vitest suite and .github/workflows/deploy.yml).
const RONIN_CASE = {
  codeFile: "Fighter.ts",
  arch: `browser ── phaser 4 + vite, strict TS
 │  scenes: boot → menu → fight → result
 │
 ├ core/ — zero phaser imports
 │   combat.ts  pure rules engine
 │    AABB hits · chip damage · rounds
 │    16 unit tests, run in plain node
 │   input.ts  one seam, 5 actions
 │    keyboard · touch · AI all write
 │    {left,right,jump,attack,block}
 │   Fighter.ts  explicit FSM
 │    idle/run/jump/attack/hurt/dead
 │
 ├ AIController — reactive policy
 │   distance bands · cooldowns
 │   easy / normal / hard tiers
 └ audio — 100% synthesized web audio
     zero sound files shipped`,
  notes: `## what broke, what I did about it

- game logic tangled with the
  renderer can't be tested. the
  combat core is pure TS — no
  phaser, no DOM — so hit math,
  chip damage and round rules run
  as 16 vitest cases in node.

- one swing dealt damage on every
  overlapping frame. hitboxes now
  live only on the active window
  of the attack anim, a hasHit
  latch caps each swing at one
  hit, and victims get 0.35s of
  i-frames.

- the CPU can't cheat: the AI
  writes the same five input
  actions a keyboard would — the
  fighter can't tell them apart.

- CI gates every push: lint,
  tsc --noEmit, vitest, build —
  then deploys to github pages.`,
  code: `// core/Fighter.ts — one hit per swing
/** True only on the active frames
 *  of a swing that hasn't
 *  connected yet. */
isHitActive(): boolean {
  if (this.state !== 'attack'
      || this.hasHit) return false;
  const p = this.attackDuration > 0
    ? this.attackElapsed
        / this.attackDuration
    : 0;
  return p >= this.config
               .attack.activeStart
      && p <= this.config
               .attack.activeEnd;
}

markConnected(): void {
  this.hasHit = true;
}`,
};

// Arc — grounded in github.com/Toshkee/anime-watchlist (lib/anilist, the
// server actions, prisma/schema.prisma; v1 preserved on legacy-express).
const ARC_CASE = {
  codeFile: "watchlist.ts",
  arch: `browser ── next 16 app router (RSC)
 │  no client → AniList calls, ever
 │
 ├ lib/anilist/
 │   client.ts  fetch + data cache
 │    per-query TTLs · cache tags
 │    429 retry-after · backoff
 │   normalize.ts  raw → UI contract
 │
 ├ server actions ("use server")
 │   session → requireUserId()
 │   zod-parsed input · revalidate
 │
 ├ auth — edge/node split
 │   proxy.ts guards /library /stats
 │   prisma adapter + bcrypt (node)
 │
 └ postgres (neon) · prisma
     Title cache · 7-day TTL
     entries @@unique(user, title)`,
  notes: `## what broke, what I did about it

- v1 (express/mongo) had an IDOR:
  any signed-in user could edit
  anyone's list by guessing an id.
  every mutation is now scoped —
  updateMany({ userId, titleId })
  with the id read from the
  session, never from the client.

- v1 wiped the DB on every
  dashboard load and copied title
  data per user. now: one cached
  Title row per anime, a unique
  (user, title) watchlist entry.

- ongoing shows (one piece) have
  no episode total, so progress
  couldn't be clamped. the server
  re-derives the real ceiling
  from nextAiringEpisode - 1.

- CI runs lint, tsc and vitest,
  then playwright against a real
  postgres service container.`,
  code: `// actions/watchlist.ts — save progress
export async function
updateEntryAction(input: unknown) {
  const userId = await requireUserId();
  const { titleId, ...patch } =
    watchlistUpdateSchema.parse(input);

  // ongoing shows report no fixed
  // total — re-derive the ceiling.
  if (patch.progress != null) {
    const title =
      await ensureTitleCached(titleId);
    const cap = title?.episodes ?? null;
    patch.progress = cap != null
      ? Math.min(patch.progress, cap)
      : Math.max(0, patch.progress);
  }

  await updateEntry(
    userId, titleId, patch);
  revalidateFor(titleId);
  return { ok: true as const };
}`,
};

// Meet2Explore — grounded in Toshkee/Meet2Explore-{Backend,Frontend}; the
// team-of-4 split is from git blame, so nothing here claims teammates' work.
const M2E_CASE = {
  codeFile: "trips.js",
  arch: `netlify ── react 19 SPA (vite)
 │  services/ per-domain axios
 │   clients · bearer JWT per call
 │  sockets/ one io() singleton
 │   dev/prod url switch
 │
 └─ heroku ── express 5 + mongoose
     ├ auth  bcrypt + jwt (30d)
     │   protect → req.user
     ├ trips  join / leave / byCity
     │   idempotent participants[]
     ├ messages  history REST
     └ socket.io  room per trip
         activity_\${id} · persisted
         to mongo · system msgs

team of 4 · feature branches + PRs
my slice: discovery → join → chat`,
  notes: `## built with a team of four

- nine days, real git flow:
  feature branches, PRs, merge
  conflicts and all. I merged the
  final PRs on both repos and
  wired the prod URLs + heroku
  Procfile.

- my vertical slice, client and
  server: browse trips by city,
  join/leave with idempotent
  server checks, and a live
  room-per-trip chat persisting
  every message to mongo.

- own-message alignment broke:
  mongo ObjectId !== string. both
  tiers now normalize userId with
  String() before comparing.

- socket listeners leaked across
  route changes — named handlers
  + socket.off cleanup in the
  effect fixed it.`,
  code: `// tripController.js — join a trip
export async function joinTrip(req, res) {
  try {
    const trip =
      await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // idempotent: joining twice
    // doesn't duplicate you
    if (trip.participants
        .includes(req.user._id)) {
      return res.json(
        { message: "Already joined" });
    }

    trip.participants.push(req.user._id);
    await trip.save();

    res.json({ success: true, trip });
  } catch (err) {
    res.status(500)
      .json({ message: err.message });
  }
}`,
};

type CaseFile = typeof CRYPTOFLOW_CASE;
type CaseTab = "demo" | "arch" | "notes" | "code" | "live";
const CASE_TABS: { key: CaseTab; file: string }[] = [
  { key: "demo", file: "demo.mp4" },
  { key: "arch", file: "arch.txt" },
  { key: "notes", file: "notes.md" },
  // the code tab's filename comes from each case file (codeFile)
  { key: "code", file: "" },
];

// Projects that expose a genuinely-live data tab (not a screenshot). Only
// CryptoFlow does: its "live" tab streams the real Binance feed the app runs.
const LIVE_TABBED = new Set<string>(["CryptoFlow"]);
const LIVE_TAB: { key: CaseTab; file: string } = { key: "live", file: "markets.live" };

const CASES: Record<string, CaseFile> = {
  CryptoFlow: CRYPTOFLOW_CASE,
  "Ronin Duel": RONIN_CASE,
  "Arc: Anime Tracker": ARC_CASE,
  Meet2Explore: M2E_CASE,
};

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
    period: "2025..present",
    current: true,
    points: [
      "NGO Register Portal (Government of Montenegro): produced the official user-guide video tutorials for the e-signature client, document signing, online registration, and registry search.",
    ],
    link: {
      href: "https://ngo.gov.me/Uputstva/PreuzmiteSoftwareIUputstva",
      label: "ngo.gov.me ↗",
    },
  },
  {
    role: "Fullstack Software Engineering",
    org: "General Assembly",
    period: "Sep 2025..Dec 2025",
    current: false,
    points: [
      "420+ hours of intensive training in frontend: JavaScript, React, HTML & CSS.",
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
      "Kosta Cukić Private High School, Belgrade (final two years).",
      "Mirko Vešović Economics High School, Podgorica (first two years).",
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
// Hydration-safe prefers-reduced-motion. Deliberately NOT useSyncExternalStore:
// uSES returns the CLIENT value during the hydration render, so under reduced
// motion the client tree (static branches) diverged from the server HTML
// (motion styles) and React logged a hydration mismatch on every load. State +
// effect keeps the first client render identical to the server (false), then
// flips right after hydration.
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = getReduceMql();
    if (!mq) return;
    // Client-only media-query state, unknowable during SSR — syncing it here
    // is the whole point of the hook (see comment above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

// Desktop (lg+) runs the fixed section deck; below that the page falls back to
// a normal scrolling document (the profile rail stacks on TOP of the deck on
// mobile, so a fixed stage would pin it over the content forever). Same shared
// MediaQueryList pattern as reduced-motion. Server snapshot = desktop; a
// mobile client corrects itself right after hydration, behind the boot overlay.
let deskMql: MediaQueryList | null = null;
function getDeskMql() {
  if (!deskMql && typeof window !== "undefined") {
    deskMql = window.matchMedia("(min-width: 1024px)");
  }
  return deskMql;
}
function subscribeDesk(onChange: () => void) {
  const mq = getDeskMql();
  if (!mq) return () => {};
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesk,
    () => getDeskMql()?.matches ?? true,
    () => true
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;

// Single element that slides into place when scrolled into view. Transform
// only — never opacity: if the in-view trigger doesn't fire (throttled tab,
// hydration hiccup, screenshot pass) the content must still be readable.
function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  from = "up",
  scale = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  // Direction the block travels in from. `y` doubles as the offset magnitude
  // for horizontal slides so callers keep a single knob.
  from?: "up" | "down" | "left" | "right";
  scale?: boolean;
}) {
  const reduce = usePrefersReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const offset =
    from === "left"
      ? { x: -y, y: 0 }
      : from === "right"
        ? { x: y, y: 0 }
        : from === "down"
          ? { x: 0, y: -y }
          : { x: 0, y };
  return (
    <motion.div
      className={className}
      initial={{ ...offset, scale: scale ? 0.94 : 1 }}
      whileInView={{ x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Per-item variant for staggered groups (lists, grids). Slide only, never
// opacity: content stays readable even if the reveal never fires, and the
// fully-opaque first SSR paint keeps the rail tagline counting as LCP.
const ITEM_VARIANTS = {
  hidden: { y: 22 },
  visible: { y: 0, transition: { duration: 0.6, ease: EASE } },
};
const LCP_ITEM_VARIANTS = ITEM_VARIANTS;

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

// Heading whose words settle up into place with a stagger (smooth, not
// per-character). Transform only — no mask, no opacity — so the text reads
// fine even when the reveal never fires.
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
          className="mr-[0.28em] inline-block align-bottom last:mr-0"
        >
          {/* Unmasked slide — the word must stay readable even if the
              in-view trigger never fires (throttled tab, hydration stall). */}
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "0.45em" }, visible: { y: 0 } }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

// Element that eases toward the cursor on hover.
// Press-scale feedback only. This replaced the magnetic cursor-pull, which
// slid buttons out of their own tonal-hover ring mid-spring — and cursor-
// reactive motion is out anyway (same call as the spotlight grid / hover
// zooms). Don't reintroduce the pull.
function Tap({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = usePrefersReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      className={`inline-block ${className}`}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 2xl:max-w-7xl"
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
      <ul className="max-w-[15rem] space-y-0.5">
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
                {/* plain-English column, `ls`-style — the filenames stay the
                    star, this keeps them scannable for non-terminal visitors */}
                <span
                  aria-hidden
                  className={`ml-auto text-[11px] transition-colors ${
                    on ? "text-accent-ink/80" : "text-faint/70 group-hover:text-faint"
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
      className="pt-24 pb-10 lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-[40%] lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:py-16"
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
          className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl"
        />
        <motion.p
          variants={ITEM_VARIANTS}
          className="mt-3 text-lg font-medium text-ink"
        >
          {ROLE} <span className="text-faint">·</span>{" "}
          <span className="text-muted">{LOCATION}</span>
        </motion.p>
        <motion.p
          variants={LCP_ITEM_VARIANTS}
          className="mt-5 max-w-sm text-[15px] leading-relaxed text-body"
        >
          {TAGLINE}
        </motion.p>
        <motion.div
          variants={ITEM_VARIANTS}
          className="mt-5 flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-surface px-3 py-1 font-mono text-xs text-accent-ink"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="relative inline-flex h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
          </span>
          open to full-time / part-time · remote
        </motion.div>
        <motion.div
          variants={ITEM_VARIANTS}
          className="mt-7 flex flex-wrap items-center gap-3"
        >
          {/* THE primary action — the one solid fill on the page; everything
              else stays ghost so the hierarchy reads in one glance. */}
          <Tap>
            <a
              href="#work"
              className="tonal-hover block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover"
            >
              View work
            </a>
          </Tap>
          {/* Secondary actions read as quiet links, not a ghost twin of the
              primary — one fill, everything else typographic. */}
          <a
            href="#contact"
            className="link-underline ml-2 inline-flex items-center text-sm font-medium text-body transition-colors hover:text-accent-ink"
          >
            Get in touch
          </a>
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
        className="mt-10 flex items-center gap-1 lg:mt-auto lg:border-t lg:border-line/60 lg:pt-8"
      >
        <IconLink href={SOCIAL.github} label="GitHub">
          <SiGithub aria-hidden />
        </IconLink>
        <IconLink href={SOCIAL.linkedin} label="LinkedIn">
          <FaLinkedin aria-hidden />
        </IconLink>
        <IconLink href={`mailto:${SOCIAL.email}`} label="Email">
          <SiGmail aria-hidden />
        </IconLink>
      </motion.div>

      <p className="mt-6 hidden font-mono text-[11px] text-faint lg:block">
        © 2026 {NAME}
      </p>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
   ABOUT
───────────────────────────────────────────────────────────── */

// Terminal-style section kicker — ties every deck slide back to the file-tree
// nav (`$ cat about.md`, `$ git log`, …). Lowercase mono, not an eyebrow label.
function Kicker({ cmd }: { cmd: string }) {
  return (
    <div className="font-mono text-xs text-faint">
      <span className="text-accent">$</span> {cmd}
    </div>
  );
}

const About = memo(function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative py-14 lg:py-10"
    >
      <div className="stage-pool" aria-hidden />
      <Reveal>
        <h2
          id="about-heading"
          className="max-w-[22ch] font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl"
        >
          I turn ideas into{" "}
          <span className="text-accent-ink">shipped, working software</span>.
        </h2>
      </Reveal>
      <Reveal delay={0.12}>
        <div className="mt-6 max-w-[62ch] space-y-4 text-[15px] leading-[1.75] text-body sm:text-base">
          <p>
            Software developer at{" "}
            <span className="font-medium text-ink">Infostream</span>, building
            enterprise software on{" "}
            <span className="font-medium text-ink">Oracle APEX</span> and{" "}
            <span className="font-medium text-ink">SQL</span>.{" "}
            <span className="font-medium text-ink">TypeScript</span> and{" "}
            <span className="font-medium text-ink">React</span>{" "}
            are where I&apos;m strongest: every project on this site runs on
            them, front to back. New stack? I&apos;ll pick it up.
          </p>
          <p>
            I build web apps front to back, database and API through to the
            UI, with{" "}
            <span className="font-medium text-ink">AI tools</span> and{" "}
            <span className="font-medium text-ink">MCPs</span>{" "}
            in my workflow. Open to full-time or part-time, remote.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-8">
          {LANGUAGES.map((l) => (
            <div key={l.label}>
              <div className="text-sm font-medium text-ink">{l.label}</div>
              <div className="text-xs text-muted">{l.level}</div>
            </div>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.18} className="mt-7">
        <HeroTerminal />
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
      className="tonal-hover group inline-flex items-center gap-2 rounded-lg border border-line bg-bg/40 px-3 py-2 hover:border-accent/60"
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
      className="relative py-14 lg:py-20"
    >
      <div className="stage-pool" aria-hidden />
      <RevealHeading
        id="stack-heading"
        text="The stack"
        className="font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl"
      />
      <Reveal delay={0.1}>
        <p className="mt-4 max-w-[60ch] leading-[1.7] text-body">
          What I actually build with: a JavaScript/TypeScript core, the frontend
          I design and animate in, and the backend that ships and stores it.
        </p>
      </Reveal>

      {/* Rows straight on the stage — group label left, logo chips right. */}
      <div className="mt-12 space-y-10">
        {STACK.map((group, gi) => (
          <div
            key={group.group}
            className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-8"
          >
            <Reveal
              delay={0.1 + gi * 0.06}
              className="shrink-0 font-mono text-sm sm:min-w-[10.5rem]"
            >
              <span className="whitespace-nowrap font-semibold text-accent-ink">
                {group.group}
              </span>
            </Reveal>
            <StaggerGroup className="flex flex-1 flex-wrap gap-2.5">
              {group.items.map((t) => (
                <TechChip key={t.name} t={t} />
              ))}
            </StaggerGroup>
          </div>
        ))}
      </div>
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
  items: { src: string; label: string; video?: boolean; poster?: string }[];
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
      // Arrows on a focused <video> seek it — don't also switch items.
      const onVideo =
        (e.target as HTMLElement | null)?.tagName === "VIDEO";
      if (e.key === "Escape") setIndex(null);
      else if (e.key === "ArrowRight" && !onVideo) go(1);
      else if (e.key === "ArrowLeft" && !onVideo) go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Modal flag: page-level key handlers (kiosk ←/→, deck PageUp/Down)
    // check this so they don't switch content under the open lightbox.
    document.body.dataset.lightbox = "1";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      delete document.body.dataset.lightbox;
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
          aria-label={`${title} media`}
          data-deck-ignore
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
                aria-label="Previous media"
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
                aria-label="Next media"
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
                  {cur.video ? (
                    // Muted autoplay so it starts without a gesture; native
                    // controls for scrubbing/pausing (demos have no audio).
                    <video
                      src={cur.src}
                      poster={cur.poster}
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label={`${title} — ${cur.label}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Image
                      src={cur.src}
                      alt={`${title} — ${cur.label}`}
                      fill
                      sizes="94vw"
                      className="object-contain"
                      priority
                    />
                  )}
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
  caseFile,
}: {
  p: (typeof PROJECTS)[number];
  caseFile?: CaseFile;
}) {
  const reduce = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [lb, setLb] = useState<number | null>(null);
  const [tab, setTab] = useState<CaseTab>("demo");

  // The demo video leads the lightbox reel (index 0) with the screenshots
  // after it — thumbnail clicks offset accordingly.
  const lbItems = p.video
    ? [
        { src: p.video, label: "demo.mp4", video: true, poster: p.shot },
        ...p.gallery,
      ]
    : p.gallery;

  // CryptoFlow gets an extra "live" tab that streams the real Binance feed.
  const caseTabs =
    caseFile && LIVE_TABBED.has(p.title) ? [...CASE_TABS, LIVE_TAB] : CASE_TABS;

  // Only play the demo while it is actually on screen. Under reduced motion we
  // never autoplay and expose native controls instead so it stays reachable.
  // `tab` is a dep: switching back to the demo tab mounts a NEW video element
  // that needs a fresh observer.
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
  }, [reduce, tab]);

  // While the lightbox is open its copy of the video plays — pause the inline
  // one behind the overlay (two decoders otherwise), resume on close.
  const lbWasOpen = useRef(false);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (lb !== null) {
      lbWasOpen.current = true;
      v.pause();
    } else if (lbWasOpen.current) {
      lbWasOpen.current = false;
      if (!reduce && !document.hidden) v.play().catch(() => {});
    }
  }, [lb, reduce]);

  const caseText =
    tab === "arch" ? caseFile?.arch : tab === "notes" ? caseFile?.notes : null;

  return (
    <article>
        {/* Media row — the framed demo (with case-file tabs for the featured
            project) beside a thumbnail strip; the strip drops under the frame
            on small screens. Clicking a thumb opens the lightbox. */}
        <div className="grid items-start gap-3 lg:grid-cols-[1.55fr_0.6fr]">
          {/* Browser-framed demo preview — clicking the video pops it into the
              lightbox (the live site still opens from the "Live demo" button). */}
          {/* Hover feedback is colour-only (border + glow): no scale/lift, so
              nothing zooms or bobs while content scrolls under the cursor. */}
          <motion.div
            ref={frameRef}
            whileHover={
              reduce
                ? undefined
                : {
                    boxShadow:
                      "0 0 0 1px rgba(34,197,94,0.32), 0 16px 42px -14px rgba(34,197,94,0.45)",
                  }
            }
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-colors hover:border-accent/50"
          >
            <div className="flex items-center gap-1.5 border-b border-line/70 bg-bg/50 px-3 py-2">
              {caseFile ? (
                // Case-file tabs, styled as open files in the window chrome.
                // The window dots are dropped here — four filenames need the
                // full bar width at this frame size.
                <span className="flex min-w-0 items-center gap-1 overflow-x-auto">
                  {caseTabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      aria-pressed={tab === t.key}
                      className={`whitespace-nowrap rounded px-1 py-0.5 font-mono text-[10px] transition-colors sm:px-1.5 ${
                        tab === t.key
                          ? "bg-accent-soft text-accent-ink"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {t.key === "code" ? caseFile.codeFile : t.file}
                    </button>
                  ))}
                </span>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-faint/70" />
                  <span className="h-2 w-2 rounded-full bg-accent/70" />
                  <span className="h-2 w-2 rounded-full bg-accent-2/70" />
                  <span className="ml-2 truncate font-mono text-[11px] text-muted">
                    {p.domain}
                  </span>
                </>
              )}
            </div>
            <div
              className={`relative overflow-hidden bg-bg ${
                tab === "demo" || tab === "live" || !caseFile
                  ? "aspect-[16/10]"
                  : ""
              }`}
            >
              {tab === "live" && caseFile ? (
                <LiveTicker />
              ) : tab !== "demo" && caseFile ? (
                // Natural height (no aspect lock) so the whole file is
                // readable without an inner scrollbar.
                <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-[1.6] text-body">
                  {tab === "code"
                    ? caseFile.code.split("\n").map((ln, i) => (
                        <div
                          key={i}
                          className={
                            ln.trimStart().startsWith("#") ||
                            ln.trimStart().startsWith("//") ||
                            ln.trimStart().startsWith("*")
                              ? "italic text-faint"
                              : undefined
                          }
                        >
                          {ln || " "}
                        </div>
                      ))
                    : caseText}
                </pre>
              ) : p.video ? (
                <>
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
                    className="h-full w-full object-cover object-top"
                  />
                  {/* Click to pop the demo into the lightbox — same as the
                      screenshot thumbs. Under reduced motion the video shows
                      native controls, so only a corner button is overlaid
                      (a full-surface one would block them). */}
                  {reduce ? (
                    <button
                      type="button"
                      onClick={() => setLb(0)}
                      aria-label={`Expand ${p.title} demo video`}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-bg/80 font-mono text-sm text-muted transition-colors hover:border-accent/60 hover:text-ink"
                    >
                      ⤢
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLb(0)}
                      aria-label={`Expand ${p.title} demo video`}
                      className="group/expand absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                    >
                      <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-bg/80 font-mono text-sm text-ink opacity-0 transition-opacity duration-300 group-hover/expand:opacity-100">
                        ⤢
                      </span>
                    </button>
                  )}
                </>
              ) : (
                <Image
                  src={p.shot}
                  alt={`${p.title} live preview`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top"
                />
              )}
            </div>
          </motion.div>

          {/* Thumbnail strip — a vertical rail next to the frame on lg
              (heights roughly match the demo), a row underneath on mobile. */}
          {p.gallery.length > 0 && (
            <ul
              className={`grid gap-3 lg:grid-cols-1 ${
                p.gallery.length === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {p.gallery.map((g, i) => (
                <li key={g.src}>
                  <button
                    type="button"
                    onClick={() => setLb(p.video ? i + 1 : i)}
                    aria-label={`View screenshot: ${g.label}`}
                    className="group/thumb relative block aspect-video w-full overflow-hidden rounded-lg border border-line bg-bg transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <Image
                      src={g.src}
                      alt={`${p.title} — ${g.label}`}
                      fill
                      sizes="(max-width: 1024px) 32vw, 15vw"
                      className="object-cover object-top"
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

        {/* Detail — full width below the media, so nothing reads as a
            squeezed side column. Role/context and the links live on the
            title line. */}
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h3 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {p.title}
            </h3>
            <span className="font-mono text-xs text-muted">
              {p.role} · {p.context}
            </span>
            <span className="flex items-center gap-5 text-sm sm:ml-auto">
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
                className="flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
              >
                <SiGithub aria-hidden /> Code
              </a>
            </span>
          </div>
          {DEMO_NOTES[p.live] && (
            <p className="mt-2 font-mono text-xs text-faint">
              {DEMO_NOTES[p.live]}
            </p>
          )}
          <p className="mt-3 max-w-[70ch] text-[15px] leading-[1.7] text-body">
            {p.blurb}
          </p>
          {p.highlights && (
            <ul className="mt-3 space-y-1">
              {p.highlights.map((h) => (
                <li
                  key={h}
                  className="relative max-w-[80ch] pl-5 text-sm leading-relaxed text-body before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-line-strong"
                >
                  {h}
                </li>
              ))}
            </ul>
          )}
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
        </div>

        <Lightbox
          items={lbItems}
          title={p.title}
          index={lb}
          setIndex={setLb}
        />
    </article>
  );
}

// Work is a kiosk: ONE project fills the stage at a time and slides
// horizontally between projects (the deck moves vertically between sections —
// two axes, two meanings). ←/→ only bind while Work is mounted, i.e. while
// it's the active deck section.
const Work = memo(function Work() {
  const reduce = usePrefersReducedMotion();
  const [pi, setPi] = useState(0);
  const [pdir, setPdir] = useState(1);

  const goProject = useCallback((d: number) => {
    setPi((prev) => {
      const next = prev + d;
      if (next < 0 || next >= PROJECTS.length) return prev;
      setPdir(d);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (document.body.dataset.lightbox) return; // arrows belong to the modal
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goProject(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goProject(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goProject]);

  const p = PROJECTS[pi];

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="relative py-14 lg:py-6"
    >
      <div className="stage-pool" aria-hidden />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <RevealHeading
            id="work-heading"
            text="Things I've built"
            className="font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl"
          />
        </div>
        <Reveal delay={0.1} className="flex items-center gap-3 font-mono text-sm">
          <button
            type="button"
            onClick={() => goProject(-1)}
            disabled={pi === 0}
            aria-label="Previous project"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg text-muted transition-colors hover:border-accent/60 hover:text-accent-ink disabled:opacity-25 disabled:hover:border-line disabled:hover:text-muted"
          >
            ‹
          </button>
          <span className="select-none tabular-nums text-muted">
            {pi + 1} / {PROJECTS.length}
          </span>
          <button
            type="button"
            onClick={() => goProject(1)}
            disabled={pi === PROJECTS.length - 1}
            aria-label="Next project"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg text-muted transition-colors hover:border-accent/60 hover:text-accent-ink disabled:opacity-25 disabled:hover:border-line disabled:hover:text-muted"
          >
            ›
          </button>
        </Reveal>
      </div>

      {/* Keyed remount per project — same pattern as the deck itself.
          Transform/blur only, never opacity: 0 — a stalled animation must
          leave the project fully readable (same rule as Reveal). */}
      <motion.div
        key={pi}
        initial={
          reduce
            ? false
            : { x: pdir * 90, filter: "blur(6px)" }
        }
        animate={{ x: 0, filter: "blur(0px)" }}
        transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
        className="mt-4"
      >
        <ProjectShowcase
          p={p}
          caseFile={CASES[p.title]}
        />
      </motion.div>

      <div className="mt-2 hidden font-mono text-[11px] text-faint lg:block">
        ← / → switch project
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
      className="relative py-14 lg:py-20"
    >
      <div className="stage-pool" aria-hidden />
      <Reveal>
        <Kicker cmd="tail -f github.log" />
      </Reveal>
      <RevealHeading
        id="github-heading"
        text="On GitHub"
        className="mt-5 mb-4 font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl"
      />
      <Reveal>
        <p className="mb-8 max-w-[60ch] leading-[1.7] text-body">
          Where I build in the open: commits across personal projects, games
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

// Deterministic 7-hex "commit id" per entry — stable across SSR/renders (no
// Math.random), so the fake git history never flickers or mismatches.
function commitHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}

const Experience = memo(function Experience() {
  const reduce = usePrefersReducedMotion();

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="relative py-14 lg:py-10"
    >
      <div className="stage-pool" aria-hidden />
      <Reveal>
        <Kicker cmd="git log --graph experience" />
      </Reveal>
      <RevealHeading
        id="experience-heading"
        text="Where I've been"
        className="mt-3 mb-6 font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-6xl"
      />
      <ol className="relative ml-2 pl-0">
        <motion.span
          aria-hidden
          className="absolute left-0 top-0 h-full w-px origin-top bg-line-strong"
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.9, ease: EASE }}
        />
        {EXPERIENCE.map((e, i) => (
          <li key={e.role} className="relative pb-6 pl-8 last:pb-0">
            <span
              className={`absolute -left-[6.5px] top-1.5 h-3 w-3 rounded-full ring-4 ring-bg ${
                e.current ? "bg-accent" : "bg-line-strong"
              }`}
              aria-hidden
            />
            <Reveal delay={i * 0.05} from="left" y={36}>
              {/* commit line: hash · decoration · date */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[13px]">
                <span className="text-accent">{commitHash(e.role + e.org)}</span>
                {e.current && (
                  <span className="text-accent-ink">(HEAD → main)</span>
                )}
                {e.period && <span className="text-faint">{e.period}</span>}
              </div>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                  {e.role}
                </h3>
                <span className="text-sm text-muted">{e.org}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {e.points.map((pt) => (
                  <li
                    key={pt}
                    className="relative pl-5 text-[15px] leading-relaxed text-body before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-line-strong"
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
      className="relative py-16 lg:py-24"
    >
      <div className="stage-pool" aria-hidden />
      <Reveal>
        <Kicker cmd="./contact.sh" />
      </Reveal>
      <RevealHeading
        id="contact-heading"
        text="Let's build something."
        className="mt-5 font-display text-4xl font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-7xl"
      />
      {/* The payoff of the `./contact.sh` kicker: the section reads as the
          script's OUTPUT — one keyed line per channel, straight on the stage.
          Lines reveal in sequence (no per-char typing — that's banned on page
          text; the stagger alone reads as a script printing). */}
      <div className="mt-10 max-w-2xl">
        <ul className="divide-y divide-line/50">
          <li>
            <Reveal delay={0.12}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-2 py-4 sm:px-3">
                <span className="w-20 shrink-0 font-mono text-xs text-faint">
                  email
                </span>
                <a
                  href={`mailto:${SOCIAL.email}`}
                  className="link-underline font-mono text-base font-medium text-accent-ink sm:text-lg"
                >
                  {SOCIAL.email}
                </a>
                <motion.button
                  type="button"
                  onClick={copyEmail}
                  aria-label="Copy email address"
                  whileTap={reduce ? undefined : { scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="tonal-hover inline-flex w-[5.4rem] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-bg/40 px-3 py-1.5 font-mono text-xs font-medium text-muted hover:border-accent/60 hover:text-ink"
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
            </Reveal>
            <span aria-live="polite" className="sr-only">
              {copied ? "Email address copied to clipboard" : ""}
            </span>
          </li>
          <li>
            <Reveal delay={0.17}>
              <a
                href={SOCIAL.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-wrap items-center gap-x-4 px-2 py-4 transition-colors hover:bg-surface sm:px-3"
              >
                <span className="w-20 shrink-0 font-mono text-xs text-faint">
                  github
                </span>
                <span className="font-mono text-sm text-body transition-colors group-hover:text-ink">
                  github.com/Toshkee
                </span>
                <span
                  className="ml-auto text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent-ink"
                  aria-hidden
                >
                  ↗
                </span>
              </a>
            </Reveal>
          </li>
          <li>
            <Reveal delay={0.22}>
              <a
                href={SOCIAL.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-wrap items-center gap-x-4 px-2 py-4 transition-colors hover:bg-surface sm:px-3"
              >
                <span className="w-20 shrink-0 font-mono text-xs text-faint">
                  linkedin
                </span>
                <span className="font-mono text-sm text-body transition-colors group-hover:text-ink">
                  in/tosiicp
                </span>
                <span
                  className="ml-auto text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent-ink"
                  aria-hidden
                >
                  ↗
                </span>
              </a>
            </Reveal>
          </li>
          <li>
            <Reveal delay={0.27}>
              <a
                href={RESUME}
                download
                className="group flex flex-wrap items-center gap-x-4 px-2 py-4 transition-colors hover:bg-surface sm:px-3"
              >
                <span className="w-20 shrink-0 font-mono text-xs text-faint">
                  cv
                </span>
                <span className="font-mono text-sm text-body transition-colors group-hover:text-ink">
                  pavle-tosic-cv.pdf
                </span>
                <span
                  className="ml-auto text-muted transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-accent-ink"
                  aria-hidden
                >
                  ↓
                </span>
              </a>
            </Reveal>
          </li>
          <li>
            <Reveal delay={0.32}>
              <div className="flex flex-wrap items-center gap-x-4 px-2 py-4 sm:px-3">
                <span className="w-20 shrink-0 font-mono text-xs text-faint">
                  reply
                </span>
                <span className="font-mono text-sm text-body">
                  usually within 24h
                </span>
              </div>
            </Reveal>
          </li>
        </ul>

        <Reveal delay={0.4}>
          <div className="mt-5 px-2 font-mono text-xs text-faint sm:px-3">
            <span className="text-accent">✓</span> exit 0
          </div>
        </Reveal>

        <Reveal delay={0.46} className="mt-10">
          <Tap>
            <a
              href={`mailto:${SOCIAL.email}`}
              className="tonal-hover inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent-ink"
            >
              <SiGmail aria-hidden /> Email me
            </a>
          </Tap>
        </Reveal>
      </div>
    </section>
  );
});

/* ─────────────────────────────────────────────────────────────
   SECTION DECK — one section on a fixed stage. A tall section scrolls
   internally; at its edge the next scroll / swipe / arrow / nav-click
   flips to the next section (fullPage-style). No page scroll.
───────────────────────────────────────────────────────────── */

const DECK_SECTIONS = [About, Stack, Work, GitHub, Experience, Contact];

declare global {
  interface Window {
    // Set by the deck so the Terminal's in-page nav switches sections
    // instead of scrolling. Returns false if the id isn't a section.
    __deckGo?: (id: string) => boolean;
  }
}

function SectionDeck({
  index,
  setIndex,
}: {
  index: number;
  setIndex: Dispatch<SetStateAction<number>>;
}) {
  const reduce = usePrefersReducedMotion();
  const desktop = useIsDesktop();
  const [dir, setDir] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const lockRef = useRef(false); // true during a transition (prevents skips)
  const accRef = useRef(0); // accumulated wheel intent at a boundary
  // Momentum guard: one flick must flip ONE section. macOS inertial wheel
  // events keep arriving for ~1-2s — longer than the 650ms lock — so after a
  // flip the wheel is DISARMED and the tail swallowed. Re-arming can't use
  // per-event delta/gap checks: the entrance animation janks the main thread
  // and Chrome then delivers the tail COALESCED — few events carrying summed
  // deltas and ~200ms timestamp gaps that mimic a fresh flick (this was the
  // double-flip bug). Velocity is coalesce-proof (summed delta over a summed
  // window ≈ true tail speed) and a momentum tail only ever slows down — so
  // only clear evidence of NEW input re-arms: a speed jump past the decaying
  // envelope, silence longer than any jank hiccup, or the tail aging out.
  const armedRef = useRef(true);
  const lastWheelT = useRef(0); // e.timeStamp of the previous wheel event
  const envRef = useRef(0); // decaying envelope of recent wheel speed (px/ms)
  const disarmAt = useRef(0); // timeStamp of the last disarm (flip or edge-hit)
  const lastConsumeT = useRef(0); // timeStamp of the last wheel spent on inner scroll
  const stallEnd = useRef(0); // heartbeat: when the last main-thread stall ended
  const lastFrameT = useRef(0); // heartbeat: when the last frame rendered

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const change = useCallback(
    (target: number) => {
      const cur = indexRef.current;
      if (
        target === cur ||
        target < 0 ||
        target >= DECK_SECTIONS.length ||
        lockRef.current
      )
        return;
      setDir(target > cur ? 1 : -1);
      // Phosphor persistence: clone the outgoing section into an inert ghost
      // that decays over the incoming one (CRT afterglow). Imperative and
      // outside React on purpose — the keyed remount unmounts the original in
      // this same commit. One-shot cost per flip; skipped under reduced motion.
      const from = scrollerRef.current;
      const stage = stageRef.current;
      if (!reduce && from && stage) {
        const ghost = from.cloneNode(true) as HTMLElement;
        ghost.setAttribute("aria-hidden", "true");
        // strip ids so anchors/scroll-spy never see duplicates for the beat
        // it exists; hide media clones (a paused <video> renders as a black
        // slab — the rain behind reads better than a dead rectangle).
        ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        ghost.querySelectorAll("video").forEach((v) => {
          v.removeAttribute("autoplay");
          v.style.visibility = "hidden";
        });
        // The clone carries the scroller's entrance class — drop it so the
        // ghost plays phosphor-decay, not a second entrance.
        ghost.classList.remove("deck-enter-up", "deck-enter-down");
        ghost.classList.add("phosphor-ghost");
        stage.appendChild(ghost);
        ghost.scrollTop = from.scrollTop;
        window.setTimeout(() => ghost.remove(), 460);
      }
      lockRef.current = true;
      accRef.current = 0;
      armedRef.current = false; // swallow the rest of the current gesture
      disarmAt.current = performance.now();
      // Matches the enter-transition duration so one gesture advances one section.
      window.setTimeout(() => {
        lockRef.current = false;
      }, 650);
      setIndex(target);
    },
    [setIndex, reduce]
  );

  const go = useCallback(
    (delta: number) => change(indexRef.current + delta),
    [change]
  );

  // Expose section nav to the Terminal ("cd work", nav commands, etc.).
  // Mobile has no deck — leaving __deckGo unset makes the Terminal fall back
  // to its native scrollIntoView path.
  useEffect(() => {
    if (!desktop) return;
    window.__deckGo = (id: string) => {
      const t = id === "home" ? 0 : NAV.findIndex((n) => n.id === id);
      if (t < 0) return false;
      change(t);
      return true;
    };
    return () => {
      delete window.__deckGo;
    };
  }, [change, desktop]);

  // Intercept in-page anchor clicks (rail nav, mobile nav, CTAs) → jump section.
  // (Desktop only — on mobile the anchors scroll the document natively.)
  useEffect(() => {
    if (!desktop) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      const href = a?.getAttribute("href");
      if (!href || href === "#") return;
      const id = href.slice(1);
      const t = id === "home" ? 0 : NAV.findIndex((n) => n.id === id);
      if (t < 0) return;
      e.preventDefault();
      change(t);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [change, desktop]);

  // Stall heartbeat. A section entrance mounts the whole section in one long
  // task; wheel events queued behind it are delivered coalesced, with gaps and
  // speeds that mimic a lifted finger or a fresh flick. The re-arm logic below
  // must know "that silence was a stall" — so record when long frames end.
  useEffect(() => {
    if (!desktop) return;
    let raf = 0;
    lastFrameT.current = performance.now();
    const tick = (t: number) => {
      if (t - lastFrameT.current > 120) stallEnd.current = t;
      lastFrameT.current = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [desktop]);

  // Wheel anywhere on the page drives the deck — not just over the stage, so
  // scrolling over the left rail works too. If anything under the cursor can
  // still scroll (the section itself, the rail on short viewports, or a panel
  // marked data-deck-ignore like the Terminal/Ask), let it consume the wheel;
  // only when nothing can, accumulate intent and flip.
  useEffect(() => {
    if (!desktop) return;
    // The section scroller's pb-28 padding is dead space: a section whose
    // CONTENT fits still "overflows" by up to ~112px, and scrolling that
    // invisible remainder makes a flick feel dead. Within EDGE_SLACK of an
    // edge the scroller counts as AT it (< the padding, so no content is
    // ever cut off). Real inner panels keep the exact 1px edge.
    const EDGE_SLACK = 80;
    const canConsume = (target: EventTarget | null, down: boolean) => {
      let el = target instanceof Element ? target : null;
      for (; el; el = el.parentElement) {
        if (el.hasAttribute("data-deck-ignore")) return true;
        if (el.scrollHeight <= el.clientHeight + 1) continue;
        const { overflowY } = getComputedStyle(el);
        if (overflowY !== "auto" && overflowY !== "scroll") continue;
        const slack = el === scrollerRef.current ? EDGE_SLACK : 1;
        const atTop = el.scrollTop <= slack - 1;
        const atBottom =
          el.scrollTop + el.clientHeight >= el.scrollHeight - slack;
        if (down ? !atBottom : !atTop) return true;
      }
      return false;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch / ctrl+wheel zoom, not navigation
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // horizontal pan
      const gap = e.timeStamp - lastWheelT.current;
      lastWheelT.current = e.timeStamp;
      const speed = Math.abs(e.deltaY) / Math.max(gap, 8); // px/ms
      // A stall (a section-entrance mount is one long task) starves frames and
      // delivers the queued tail coalesced — gaps and speeds that mimic fresh
      // input. While one is in flight, gap/speed signals are artifacts: don't
      // decay the envelope across the stall and don't re-arm from them.
      // (Queued input fires BEFORE the heartbeat's next tick, so "no frame
      // rendered for >120ms as of now" counts as a stall too.)
      const stalled =
        performance.now() - lastFrameT.current > 120 ||
        (stallEnd.current > 0 && e.timeStamp - stallEnd.current < 250);
      const env = envRef.current * (stalled ? 1 : Math.exp(-gap / 350));
      envRef.current = Math.max(env, speed);
      // Post-flip momentum: fully inert. It must not flip again OR nudge any
      // inner scroll (one gesture = one action) — see armedRef above.
      if (!armedRef.current) {
        const sinceDisarm = e.timeStamp - disarmAt.current;
        const newGesture =
          sinceDisarm > 1700 || // any tail is long dead
          (!stalled &&
            // A flip fires ~60px INTO a flick — the same gesture is still
            // accelerating on the pad, so for a beat no speed-up is trustable:
            // a human can't lift and re-flick this fast.
            sinceDisarm > 350 &&
            (gap > 400 || // real silence — the finger lifted
              speed > Math.max(0.3, env * 1.7))); // sharp speed-up = fresh flick
        if (!newGesture) {
          e.preventDefault();
          return;
        }
        armedRef.current = true;
        accRef.current = 0;
        if (gap > 400 && Math.abs(e.deltaY) < 80) {
          // sub-notch first delta after a real pause is a gesture-start
          // crumb — count from the next event (mouse notches pass through)
          e.preventDefault();
          return;
        }
      }
      const down = e.deltaY > 0;
      if (canConsume(e.target, down)) {
        accRef.current = 0;
        lastConsumeT.current = e.timeStamp;
        return; // room to scroll under the cursor — let it
      }
      e.preventDefault();
      // Cursor away from the stage (rail, nav, margins): drive the active
      // section's own scroll first, so a tall section behaves the same
      // no matter where the wheel happens; flip only at its edge.
      const el = scrollerRef.current;
      if (el) {
        const atEdge = down
          ? el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_SLACK
          : el.scrollTop <= EDGE_SLACK - 1;
        if (!atEdge) {
          el.scrollTop += e.deltaY;
          accRef.current = 0;
          lastConsumeT.current = e.timeStamp;
          return;
        }
      }
      if (lockRef.current) return;
      // One gesture = one action extends to inner scroll: a flick that just
      // scrolled content into its edge must not ALSO flip — swallow the rest
      // of its momentum; a fresh gesture (pause or sharp flick) advances.
      if (e.timeStamp - lastConsumeT.current < 300) {
        armedRef.current = false;
        disarmAt.current = e.timeStamp;
        accRef.current = 0;
        return;
      }
      accRef.current += e.deltaY;
      if (Math.abs(accRef.current) > 60) go(down ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, desktop]);

  // Touch swipe past a section edge to flip (native inner scroll otherwise).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onEnd = (e: TouchEvent) => {
      const el = scrollerRef.current;
      if (!el) return;
      const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
      if (Math.abs(dy) < 64) return;
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if (dy < 0 && atBottom) go(1);
      else if (dy > 0 && atTop) go(-1);
    };
    stage.addEventListener("touchstart", onStart, { passive: true });
    stage.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      stage.removeEventListener("touchstart", onStart);
      stage.removeEventListener("touchend", onEnd);
    };
  }, [go, desktop]);

  // Keyboard: Page/Arrow keys move between sections (never while typing).
  useEffect(() => {
    if (!desktop) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (document.body.dataset.lightbox) return; // modal owns the keyboard
      // ←/→ belong to the Work kiosk (project switching) — sections advance
      // via wheel, PageUp/Down, nav and the terminal.
      if (e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, desktop]);

  const Active = DECK_SECTIONS[index];

  // Mobile: no fixed stage — every section stacks into one normally-scrolling
  // document, so the profile header scrolls away like any other page.
  if (!desktop) {
    return (
      <div className="pb-24">
        {DECK_SECTIONS.map((S, i) => (
          <S key={NAV[i].id} />
        ))}
      </div>
    );
  }

  return (
    <div ref={stageRef} className="relative h-full min-h-0 flex-1">
      {/* Keyed remount per section: the old section is removed instantly
          (revealing the rain behind), and the new one flies in with a focus-pull
          (slide + de-blur). Simpler and more robust than AnimatePresence
          exit orchestration, which stalls when the index change fires from a
          native listener (wheel / keys / nav-click) rather than a React onClick.
          The entrance itself is a CSS animation, not a JS tween: a rAF stall
          (occluded window, the section-mount long task) freezes a JS-driven
          tween mid-flight until the next heartbeat, but the style system
          resolves a CSS animation from wall-clock time, so it always completes
          on its own (same pattern as .gh-cell). */}
      <div
        key={index}
        ref={scrollerRef}
        className={`absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-none pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          reduce ? "" : dir > 0 ? "deck-enter-up" : "deck-enter-down"
        }`}
      >
        <Active />
      </div>

      {/* Cinematic cue: a soft phosphor band sweeps the stage in the travel
          direction each time the section changes (keyed to index). CSS for the
          same stall-proofing as the entrance above. */}
      {!reduce && (
        <div
          key={`scan-${index}`}
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-transparent via-accent/20 to-transparent blur-md ${
            dir > 0 ? "deck-scan-down" : "deck-scan-up"
          }`}
        />
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

// Once per page load, not per Home mount (StrictMode double-invokes effects).
let apisWarmed = false;

export default function Home() {
  const [index, setIndex] = useState(0);
  const isDesktopLayout = useIsDesktop();
  // Desktop: the deck's index IS the active section. Mobile: sections stack
  // into a normal scroll, so the centre-band observer decides — this drives
  // the nav highlight AND the rain surge on section change, which previously
  // never fired on mobile (index only changes via the desktop deck).
  const scrollActive = useActiveSection(SECTION_IDS, isDesktopLayout);
  const activeId = isDesktopLayout ? NAV[index].id : scrollActive;
  const activeIndex = isDesktopLayout
    ? index
    : Math.max(0, SECTION_IDS.indexOf(scrollActive));

  // Playful characters are a desktop-only, non-reduced-motion garnish. The
  // deck has no window scroll, so the droid rappels off active-section progress
  // instead: a MotionValue that steps 0→1 as you advance sections (each jump
  // spikes its velocity → triggers a backflip).
  const reduced = usePrefersReducedMotion();
  const showChars = isDesktopLayout && !reduced;
  const deckProgress = useMotionValue(0);
  useEffect(() => {
    deckProgress.set(NAV.length > 1 ? index / (NAV.length - 1) : 0);
  }, [index, deckProgress]);

  // Publish the active section to the character bus so the ambient droid/bug
  // can react to where the visitor is (a change cues a flip / spin).
  useEffect(() => {
    pageCtx.section = activeId;
  }, [activeId]);

  const mainRef = useRef<HTMLElement>(null);

  // Wake the sleeping free-tier demo APIs as soon as anyone lands: by the time
  // a visitor reaches Work and clicks a live demo, the backend is already up
  // instead of eating its cold start in front of them. no-cors — the response
  // is opaque and irrelevant, only the hit matters.
  useEffect(() => {
    if (apisWarmed) return;
    apisWarmed = true;
    for (const url of Object.values(COLD_APIS)) {
      fetch(url, { mode: "no-cors", cache: "no-store" }).catch(() => {});
    }
  }, []);

  return (
    <>
      <BootIntro />
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <MatrixRain sectionIndex={activeIndex} />
      <NavBar active={activeId} />

      {/* Mobile scrolls as a normal document; the fixed 100dvh deck stage is
          a desktop (lg+) layout — see SectionDeck's mobile branch. */}
      <div className="mx-auto flex max-w-6xl flex-col px-5 sm:px-8 lg:h-[100dvh] lg:flex-row lg:gap-14 lg:overflow-hidden lg:px-10 2xl:max-w-7xl 2xl:gap-20">
        <LeftRail active={activeId} />
        <main
          id="content"
          ref={mainRef}
          tabIndex={-1}
          className="relative min-h-0 flex-1 outline-none"
        >
          <SectionDeck index={index} setIndex={setIndex} />
        </main>
      </div>

      <Terminal
        name={NAME}
        role={ROLE}
        location={LOCATION}
        social={SOCIAL}
        resume={RESUME}
        projects={PROJECTS}
      />
      <AskPanel />

      {/* Ambient characters: one host per section, spawning in as you arrive
          and fading out as you leave (z-30 over content / z-6 under it, above
          the matrix-rain bg; all below the terminal/ask/nav/boot). */}
      {showChars && (
        <AmbientCast activeId={activeId} deckProgress={deckProgress} />
      )}
    </>
  );
}
