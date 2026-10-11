# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Rules

- Think before coding.
- Prefer simple, maintainable solutions.
- Modify existing patterns instead of inventing new architecture.
- Keep files small and readable.
- Avoid unnecessary abstractions and dependencies.
- Preserve existing code style and structure.
- Write production-ready code, not prototypes.
- Prioritize clarity over cleverness.
- Avoid premature optimization.
- Fix root causes, not symptoms.
- Use strong typing; avoid `any`.
- Do not rewrite unrelated code.
- Minimize side effects and complexity.
- Make surgical, focused changes.
- Optimize for developer experience and long-term maintainability.
- Build fast, but keep the codebase clean.

## Commands

```bash
npm run dev          # Start dev server (Next.js, localhost:3000)
npm run build        # Production build
npm start            # Serve the production build locally
npm run lint         # ESLint (flat config via eslint-config-next)
npm run typecheck    # tsc --noEmit
npm run check:site   # Post-build smoke check against a running server (routes, canonicals, JSON-LD, security headers, internal links)
npm run check:metadata  # Fails if any image in public/ still carries EXIF/XMP metadata
npm run github       # Regenerate src/app/site/github.ts (the GitHub card's numbers) from the public API, then commit it
npm run cf-typegen   # Regenerate cloudflare-env.d.ts after changing wrangler.jsonc or .dev.vars
```

No test suite configured. CI (`.github/workflows/ci.yml`) runs audit, metadata check, lint, typecheck, build, the smoke check against `next start`, and a three-run Lighthouse budget (`scripts/lighthouse-budget.mjs`: accessibility, best-practices and SEO floors plus FCP/CLS/TBT ceilings; the performance score is printed, not gated).

## Deployment

Deployed to **Cloudflare Workers** via `@opennextjs/cloudflare` + `wrangler`. The worker name is `my-portofolio` (note the misspelling: kept intentionally; renaming requires updating Cloudflare config). Deploy flow:

```bash
npm run deploy    # opennextjs-cloudflare build && opennextjs-cloudflare deploy
npm run preview   # Same, but into a local Workers dev server
```

**Never deploy with plain `wrangler deploy`.** Next writes its prerendered pages
to `.open-next/cache`, and only the adapter's own `deploy`/`preview`/`upload`
commands run the `populateCache` step that ships them. Skipping it silently
breaks every prerendered dynamic route (`/work/[slug]` 404s) and makes every
other page re-render on each request instead of serving a cache HIT.

Requires **Node 22+** (wrangler refuses to run on 20).

**Keep `@opennextjs/cloudflare` at 1.20.9 or newer with Next 16.3.8+** (1.20.10
pulls a `glob` with a high advisory through `@opennextjs/aws`, so the lock
pins 1.20.9 until that clears `npm run audit:security`). Next
16.3.8 changed the incremental-cache keys (`/route-cache/APP_PAGE/<hash>/$/…`);
an older adapter still writes the old names, the Worker finds nothing, and
every prerendered `/work/[slug]` 404s in production while `next start` is
fine (seen live on 2026-10-09). Test the adapter build locally before a
dependency bump: `npx opennextjs-cloudflare build && npx opennextjs-cloudflare
populateCache local && npx wrangler dev`, then expect `x-nextjs-cache: HIT`
on a case-study URL.

Config lives in `open-next.config.ts` and `wrangler.jsonc`. The OpenNext config
sets `incrementalCache: staticAssetsIncrementalCache`, which serves that
prerendered output from the `ASSETS` binding under `cdn-cgi/_next_cache`. It is
read-only by design: nothing on this site revalidates. Everything under
`public/` ships as a static asset, so keep it to files the site references.
Static assets are served without running the Worker, so the `headers()` in
`next.config.ts` never touch them: their `Cache-Control` comes from
`public/_headers` (a year for the hashed `/_next/static/*`, a day for
`/images`, `/video` and the CV), which Cloudflare reads and does not serve.

The chat needs two things in production: the `ANTHROPIC_API_KEY` Worker secret,
and the `CHAT_LIMITER` rate-limit binding declared in `wrangler.jsonc`.

## Stack

- **Next.js 16** + **React 19** (App Router) with TypeScript. Server components by default; only leaves that need the browser are `"use client"`.
- **Tailwind CSS v4** via `postcss.config.mjs`; colour tokens are CSS variables on `:root` (light) with dark overrides, mapped into Tailwind by the `@theme inline` block of `src/app/globals.css`. No `tailwind.config.*`.
- **@anthropic-ai/sdk**: the official Anthropic SDK, used only on the server by `/api/chat`. Model `claude-haiku-5-5` at effort `medium` (at `low` it skipped tool calls on questions in Montenegrin), with the system prompt and tools cached (`cache_control`). The prompt makes it admit it is an AI when asked, and the chat says so under the input. Billed to the Claude Console organisation's credits. The key is `ANTHROPIC_API_KEY`: `.env.local` for `next dev`, `.dev.vars` for `npm run preview`, a Worker secret in production (`npx wrangler secret put ANTHROPIC_API_KEY`).
- **react-markdown** renders the model's answers, restricted to a handful of inline elements (`site/Markdown.tsx`).
- **react-icons** (its Lucide set, `react-icons/lu`) for UI icons; **@iconify/react** for the brand marks in the skills card. `src/app/site/icons.ts` registers four cut-down sets (logos from `@iconify-json/logos`, plus simple-icons, vscode-icons and lucide fetched from api.iconify.design) and is generated by `node scripts/icons.mjs`: edit the id lists there when a mark changes in `content.ts`. Every mark has an icon (the `Mark` type requires it); the Iconify API is not CSP-allowed at runtime.
- **Fonts**: the system stack only, no webfont.
- **No animation library**: entrances and loaders are CSS keyframes in `globals.css`. The one client effect is `site/trail.ts`, the cursor trail on every page (`CursorTrail.tsx` is mounted once in `layout.tsx` as a fixed canvas at z-index -1, which is why `<body>` has no background of its own): where the mouse passes, dots come up on a 14px grid, turn into ASCII characters mid-wake and fade out, after 21st.dev's Dotted Trail Cursor and Background ASCII Wake: grey at the edges, Claude's orange (#d97757) in the middle on both themes, at most 75% opaque so text over it stays readable. 70px wake radius at full speed, picked by Pavle in a cursor lab over the WebGL fluid smoke it replaced (2026-10-11); a resting dot grid under every page and a wake in ink (it swallowed the text) were both tried that day and dropped. The trail is mouse-only, off under reduced motion, and its rAF loop sleeps once the wake has faded (about 4.4 s). The landing Memoji's eyes follow the cursor (`site/MemojiGaze.tsx`; without a mouse the face glances around every few seconds instead; off under reduced motion): `public/images/memoji-still.webp` is a frame of Pavle's Messages recording with the irises painted out, and each eye has an iris cutout and an eye-opening mask (`memoji-iris-*.webp`, `memoji-eye-*-mask.webp`), cut by `scripts/memoji-gaze.py` from the 448px RGBA frame; the eye windows and iris circles are measured on that frame and live in `MEMOJI.gaze` (content.ts) and the script. A recorded Memoji loop was tried and dropped: a video cannot react to the cursor. (To decode a Messages recording with its alpha, go through AVFoundation: ffmpeg's HEVC decoder drops Apple's alpha layer.)
- `next.config.ts` sets the security headers and CSP (`connect-src` is this origin plus Cloudflare analytics: the model is called from the Worker, never the browser), `images.unoptimized: true` (no image optimizer on Workers), and calls `initOpenNextCloudflareForDev()` so `next dev` gets the Worker bindings.

## Architecture

An AI portfolio after aaabadcode.com / toukoum.fr: one landing screen, and a chat where a model answers as me and puts cards on screen.

| Route | File | Notes |
|---|---|---|
| `/` | `site/Landing.tsx` | Greeting, title, the Memoji (eyes follow the cursor), a GET `<Form action="/chat">` and the starter-question tiles (links to `/chat?q=...`), over a giant faded handle. Works before hydration. Static. |
| `/chat` | `chat/page.tsx` → `site/Chat.tsx` | Reads `?q=` on the server and asks it on mount. Shows only the latest exchange (question, then text and cards in the order they streamed); earlier turns are not shown but are sent along as history. (Keeping them all on screen, dimmed above the latest, was tried and dropped at Pavle's call: a card reads best alone.) After a card, two or three static follow-up pills (`FOLLOW_UPS` in `QuickQuestions.tsx`). Quick-question pills and `AskBar.tsx` (send / stop) at the bottom. `noindex`. |
| `/api/chat` | `api/chat/route.ts` | POST, same-origin only, per-IP rate limit (`CHAT_LIMITER` binding, 10 a minute), body and turn caps from `chat-protocol.ts`. Streams NDJSON `ChatEvent`s: text deltas and cards. Two rounds at most: round one may call a tool, round two has tools off and must answer in text. |
| `/about` | `about/page.tsx` | The CV as a crawlable page from `content.ts` (About, spec sheet, stack, work, education, contact): the landing says little on purpose and the cards only exist once the model calls for them. Static. |
| `/play` | `play/page.tsx` → `site/quest/Quest.tsx` | Toshkee's Quest, a tiny arcade platformer after Clawd's Quest on claude.dev (written from scratch, nothing copied): a dot-matrix world on one canvas (`quest/dots.ts`: hills, trees, clouds, ground with pits, one-way ledges), the hero from Pavle's PixelLab character (`public/images/quest/hero.png`, the East-direction sprite sheet of that export minus its rotations row, re-encoded without metadata; `quest/hero.ts` maps its rows: idle, death, walk, roll, hurt, attack; no jump was generated, so the single jump holds the roll's leap frame and the double jump plays its somersault), bugs and pick-ups as text pixel art (`quest/sprites.ts`; the bugs, pit walls and ledge tops are coral, Clawd's colour, the one warm tone in the grey world so what hurts stands out, while a blue glow marks what to collect), five missions from his own stories (`quest/missions.ts`: the bad deploy, the moving tender deadline, kickboxing, an in-range update, a full class at Reform), plus Ultra mode (endless run, best in `localStorage.quest.best`). Moves: walk, sprint, jump, a second jump in the air, roll (R, invulnerable, slips through bugs), sword (K, a big bug takes two). The engine (`quest/engine.ts`) owns the loop, physics and level generation (bugs are placed first and kept 150 px from pit edges so a knock-back never ends in a pit; everything to pick up keeps clear of their beats) and reports a `QuestUi` snapshot; React draws the chips, paper slips, controls panel and the touch pads (on a phone: ← → to walk, a double tap held on one to run, Roll, Sword, Jump, and a tap on the stage jumps; in Ultra, where he runs on his own, Sprint replaces the arrows). Reaching the end of a collect or crate mission with something missed says how many are left, back to the west. Dark on purpose, ignores the theme toggle. Synthesised blips and an original eight-bar chiptune loop (`quest/sound.ts`), off until clicked; the AudioContext is only made and resumed inside a tap or key press (Quest.tsx listens for them), and `navigator.audioSession.type = "playback"` keeps an iPhone's silent switch from muting it. A Quest tile on the landing page and a Quest pill in the chat open it (`QuickQuestions.tsx`), and it is linked from the 404 page and llms.txt; the finale sends the visitor to the chat for the Godot games. Static. **Testing:** on `next dev` the engine exposes `window.__quest.state()`; paste `scripts/quest-bot.js` into the console on /play and `__bot.start(240000)` plays every mission and Ultra by itself (it must reach the finale with hearts to spare). |
| `/llms.txt` | `llms.txt/route.ts` | The site for AI crawlers: the page list plus the same `facts()` the system prompt is built from (`api/chat/prompt.ts`), with absolute links. Static. |

- `api/chat/prompt.ts` builds the system prompt from the data files below, so the model and the cards can never disagree. Honesty rules are in the prompt, including: a card is the answer and the text around it never restates it, the two parked games come up only when a visitor asks about games, a website or pricing enquiry is pointed to vaky.me without naming a price, and the GitHub numbers are quoted as of the date they were counted.
- `api/chat/tools.ts`: the eight tools (`show_me`, `show_projects`, `show_project` with a slug enum, `show_skills`, `show_experience`, `show_contact`, `show_fun`, `show_github`). A tool call only means "show this card"; nothing is fetched. `show_fun` and the Fun tile hide while `FUN` is empty.
- `site/cards/`: `CardView.tsx` switches on the card kind; `ProjectsCard.tsx` is a snapping photo rail after Aceternity's Apple Cards Carousel, opening `ProjectDetail.tsx` in a native `<dialog>`, with the in-progress games under it.
- `site/Zoomable.tsx`: any photo or clip that opens full size on click (native `<dialog>`, mounted only while open, so a clip loads nothing until played). Used by the Me photo, the Fun media and every project gallery still.
- `chat-protocol.ts`: the wire types (`Card`, `ChatEvent`, `Turn`), the limits and the failure message, shared by route and client.

**Data:**
- `src/app/projects.ts`: the nine projects, newest first (Reform Fitness, then the Infostream company site), case-study text, KPIs and gallery. `live`/`code` are null for a private app or repo (Reform: no link anywhere, as on vaky.me), `note` is the one-line honest status, `phone` marks portrait screens. Single source of truth for the chat's project cards, the prompt's facts and the crawlable case studies under `/work` and `/work/[slug]` (server components, prerendered via `generateStaticParams`).
- **Pavle's CV (`public/pavle-tosic-cv.pdf`) is the source of truth** for About, skills, work experience and education: `content.ts` follows it in its wording, and nothing goes in that is not on it or in a project repo.
- `src/app/site/content.ts`: name, role, links, the Memoji (`MEMOJI`: the face sticker on the chat header, the laptop one shown while an answer is on its way, the "call me" one on the contact card, and the `gaze` layers for the landing page) and the real photo (`PHOTO`, the Me card), About copy, spec sheet, stack marks, `EXPERIENCE` and `EDUCATION`, `IN_PROGRESS` (the two Godot games, parked: a line under the project rail, never volunteered by the chat) and `FUN` (hobbies, in Pavle's own words; photos in `public/images/fun/`, his gameplay clips in `public/video/fun/` as H.264 at 540px with metadata stripped). Honesty rules are written into the comments there (a contribution is called a contribution, a prototype a prototype). A fact not in this file or `projects.ts` does not exist for the chat.
- `src/app/contact.ts`: the email address, shared with the JSON-LD in `layout.tsx`.
- `src/app/site/github.ts`: generated by `npm run github` (`scripts/github.mjs`) from the public GitHub API and committed: public repo count, pushes in the last 30 days, and the last push to each repo that is a project in `projects.ts` (plus this site's). Only those repos are listed, so the chat never meets a repo name it has no facts for. The card and the prompt say the date it was counted; rerun it now and then.

**Other routes:** `/work` (index, with a link into the chat), `/work/[slug]` (each with "Ask me about it in the chat"), `/privacy` (describes the chat's data flow: keep it true when the chat changes), `robots.ts`, `sitemap.ts` (generated from `PROJECTS`), `not-found.tsx`. The pages outside the chat share `site/Crumbs.tsx` (breadcrumb plus the theme toggle).

## Design

After the reference: white page, black type, grey watermark, and one colour, the blue send button (`--send`). Light by default (the OS setting is ignored); dark only when the visitor picks it with `ThemeToggle.tsx`, which writes `data-theme` on `<html>` and `localStorage.theme`; an inline script in `layout.tsx` restores it before first paint. The `dark:` variant is a custom one keyed on that attribute. Token names (`bg`, `surface`, `plate`, `ink`, `body`, `muted`, `faint`, `line`, `line-strong`) are shared with `/about`, `/work` and `/privacy`; change values, not names.

`docs/slop.md` is the anti-slop design law. Components ported from 21st.dev are credited by URL in their top comment; nothing is installed from the registry.

Motion rules that every component follows: content is visible by default (no entrance gated on JS, no `opacity: 0` starts), transforms only for entrances, and every animation is gated on `prefers-reduced-motion`.

## Notes

- Playful measurements live in the components' comments (bytes, contrast ratios, why a threshold is what it is). Update the comment when you change the number.
- `scripts/check-site.mjs` runs against a live server; point it at production with `BASE=https://pavletosic.com node scripts/check-site.mjs`.
- After changing `wrangler.jsonc` or `.dev.vars`, run `npm run cf-typegen` to regenerate `cloudflare-env.d.ts` (typed `CloudflareEnv` for `getCloudflareContext()`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
