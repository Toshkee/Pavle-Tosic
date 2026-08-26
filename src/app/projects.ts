/* Project data — the single source of truth for the Work kiosk on the home
   page AND the crawlable case-study routes under /work/[slug]. Plain data, no
   "use client": the client page and the server routes both import it.

   Every claim here is grounded in the actual repos (cloned and mined) — the
   arch trees, the "what broke" notes, the code excerpts and the `kpis` numbers
   all point at real files. Don't add claims that aren't in the code. */

export type Project = {
  /** URL segment for /work/[slug]. Never change one once it has been indexed. */
  slug: string;
  title: string;
  blurb: string;
  /** The case study's opening beat: what problem the build set out to solve. */
  problem: string;
  /** The decisions taken — what was built and why it was built that way. */
  highlights: string[];
  /** The outcome: what actually shipped and what verifies it. */
  result: string[];
  /** Numbers counted out of the repo, not estimated. Each one is checkable by
      cloning the repo and running the command in the trailing comment. */
  kpis: { label: string; value: string }[];
  role: string;
  context: string;
  stack: string[];
  live: string;
  code: string;
  shot: string;
  video: string | null;
  domain: string;
  gallery: { src: string; label: string }[];
};

export const PROJECTS: Project[] = [
  {
    slug: "cryptoflow",
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
    result: [
      "Shipped and live: spot and futures both settle against the server's own Binance price, so a tampered client can't mint balance.",
      "The double-spend and double-close races are covered by threaded tests that run against a real Postgres in CI, not asserted in a README.",
      "Survives its own hosting: the free-tier API sleeps, so the frontend degrades to a mark-price mirror instead of erroring.",
    ],
    kpis: [
      // backend/*/urls.py: accounts 9 + markets 10 + futures 5
      { label: "REST endpoints", value: "24 across 3 Django apps" },
      // find backend -name 'test*.py' -not -path '*/venv/*' | xargs grep -c '^\s*def test_'
      { label: "backend tests", value: "48, run against Postgres in CI" },
      { label: "leverage range", value: "1-125×, settled server-side" },
    ],
    role: "Solo build",
    context: "General Assembly, rebuilt 2026",
    stack: ["React 19", "TypeScript", "Django REST", "WebSockets", "PostgreSQL"],
    live: "https://cryptofloww.netlify.app/",
    code: "https://github.com/Toshkee/CryptoFlow",
    shot: "/images/projects/cryptoflow.webp",
    video: "/video/projects/cryptoflow.mp4",
    domain: "cryptofloww.netlify.app",
    gallery: [
      { src: "/images/projects/cryptoflow-terminal.webp", label: "Trading terminal" },
      { src: "/images/projects/cryptoflow-markets.webp", label: "Live markets" },
      { src: "/images/projects/cryptoflow-landing.webp", label: "Landing" },
    ],
  },
  {
    slug: "arc-anime-tracker",
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
    result: [
      "The rebuild closed a real IDOR: in v1 any signed-in user could edit another user's list by guessing an id, and every mutation is now scoped to the session's user id.",
      "v1 wiped and re-copied title data on every dashboard load; the rewrite caches one Title row per anime behind a 7-day TTL, so the AniList API is hit once per title instead of once per view.",
      "Typed end to end and gated in CI, including Playwright against a real Postgres service container.",
    ],
    kpis: [
      { label: "catalogue", value: "500,000+ live AniList titles" },
      // src/**/*.test.ts(x): 11 + 8 + 5 + 7 + 3
      { label: "unit tests", value: "34, plus a Playwright e2e suite" },
      // prisma/schema.prisma: grep -c '^model '
      { label: "data model", value: "6 Prisma models" },
    ],
    role: "Solo build",
    context: "General Assembly, rebuilt 2026",
    stack: ["Next.js 16", "TypeScript", "AniList API", "Prisma", "PostgreSQL"],
    live: "https://arc-anime.vercel.app",
    code: "https://github.com/Toshkee/anime-watchlist",
    shot: "/images/projects/anime-watchlist.webp",
    video: "/video/projects/anime-watchlist.mp4",
    domain: "arc-anime.vercel.app",
    gallery: [
      { src: "/images/projects/anime-watchlist-home.webp", label: "Search & trending" },
      { src: "/images/projects/anime-watchlist-browse.webp", label: "Browse catalogue" },
      { src: "/images/projects/anime-watchlist-detail.webp", label: "Title detail" },
    ],
  },
  {
    slug: "ronin-duel",
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
    result: [
      "Splitting the rules engine out of the renderer made the combat core testable in plain node: hit math, chip damage and round rules run without Phaser or a DOM.",
      "One swing used to damage on every overlapping frame; hitboxes now live only on the attack's active window, a latch caps each swing at one hit, and victims get 0.35 s of i-frames.",
      "Every push is gated on lint, tsc, tests and build before it deploys to GitHub Pages, so a red build never reaches the live demo.",
    ],
    kpis: [
      // tests/combat.test.ts: grep -c '^\s*(it|test)\('
      { label: "unit tests", value: "16 on the pure combat core" },
      { label: "AI tiers", value: "3, driving the same 5 inputs a player has" },
      { label: "audio files shipped", value: "0, all Web Audio synthesis" },
    ],
    role: "Solo build",
    context: "General Assembly, rebuilt 2026",
    stack: ["Phaser 4", "TypeScript", "Vite", "Vitest", "Playwright"],
    live: "https://toshkee.github.io/Ronin-Duel/",
    code: "https://github.com/Toshkee/Ronin-Duel",
    shot: "/images/projects/ronin-duel.webp",
    video: "/video/projects/ronin-duel.mp4",
    domain: "toshkee.github.io",
    gallery: [
      { src: "/images/projects/ronin-duel-menu.webp", label: "Title & mode select" },
      { src: "/images/projects/ronin-duel-fight.webp", label: "In-match combat" },
      { src: "/images/projects/ronin-duel-combo.webp", label: "Combos & hit effects" },
    ],
  },
  {
    slug: "meet2explore",
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
    result: [
      "Delivered inside a one-week team sprint with real git flow: feature branches, PRs and merge conflicts across two repos, and I merged the final PRs on both.",
      "My slice worked end to end: browse trips by city, join and leave with idempotent server checks, and a live room-per-trip chat that persists every message.",
      "The demo's Heroku backend has since lapsed, so sign-in and live trips are offline; the site says so plainly rather than linking a demo that silently fails.",
    ],
    kpis: [
      // git shortlog -sn --all across Meet2Explore + Meet2Explore-Frontend
      { label: "my commits", value: "24 of 69, across both repos" },
      { label: "team", value: "4 contributors, 2 repos" },
      { label: "sprint", value: "one week, 18-24 Nov 2025" },
    ],
    role: "Team of 4, full-stack slice",
    context: "General Assembly, 2025",
    stack: ["React", "Node.js", "Express"],
    live: "https://meet2explore.netlify.app/",
    code: "https://github.com/Toshkee/meet2explore",
    shot: "/images/projects/meet2explore.webp",
    video: "/video/projects/meet2explore.mp4",
    domain: "meet2explore.netlify.app",
    gallery: [
      { src: "/images/projects/meet2explore-hero.webp", label: "Discover destinations" },
      { src: "/images/projects/meet2explore-trips.webp", label: "Plan group trips" },
      { src: "/images/projects/meet2explore-meet.webp", label: "Meet new people" },
    ],
  },
];

// PROJECTS[].live → a one-line honest status shown under the demo links.
export const DEMO_NOTES: Record<string, string> = {
  "https://cryptofloww.netlify.app/":
    "demo api runs on a free tier, so the first request may take a moment to wake",
  "https://meet2explore.netlify.app/":
    "the demo's backend host has lapsed, so sign-in and live trips are offline. the video shows the full app",
};

// Engineering "case files", shown as extra tabs on each project's kiosk
// frame. Every line is grounded in the actual repos (cloned + mined) — the
// arch trees, the "what broke" notes and the code excerpts all point at real
// files. Don't add claims that aren't in the code.
export const CRYPTOFLOW_CASE = {
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
export const RONIN_CASE = {
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
export const ARC_CASE = {
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
export const M2E_CASE = {
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

export type CaseFile = typeof CRYPTOFLOW_CASE;
export type CaseTab = "demo" | "arch" | "notes" | "code" | "live";
export const CASE_TABS: { key: CaseTab; file: string }[] = [
  { key: "demo", file: "demo.mp4" },
  { key: "arch", file: "arch.txt" },
  { key: "notes", file: "notes.md" },
  // the code tab's filename comes from each case file (codeFile)
  { key: "code", file: "" },
];

// Projects that expose a genuinely-live data tab (not a screenshot). Only
// CryptoFlow does: its "live" tab streams the real Binance feed the app runs.
export const LIVE_TABBED = new Set<string>(["CryptoFlow"]);
export const LIVE_TAB: { key: CaseTab; file: string } = { key: "live", file: "markets.live" };

export const CASES: Record<string, CaseFile> = {
  CryptoFlow: CRYPTOFLOW_CASE,
  "Ronin Duel": RONIN_CASE,
  "Arc: Anime Tracker": ARC_CASE,
  Meet2Explore: M2E_CASE,
};

// Every screenshot in public/images/projects ships as a full-width .webp for
// the lightbox and a 640px "-thumb.webp" twin. The rail renders into a ~15vw
// box, so it takes the twin; the lightbox keeps the full file.
export const thumbOf = (src: string) => src.replace(/\.webp$/, "-thumb.webp");

export const projectBySlug = (slug: string): Project | undefined =>
  PROJECTS.find((p) => p.slug === slug);
