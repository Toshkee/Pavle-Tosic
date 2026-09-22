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

Config lives in `open-next.config.ts` and `wrangler.jsonc`. The OpenNext config
sets `incrementalCache: staticAssetsIncrementalCache`, which serves that
prerendered output from the `ASSETS` binding under `cdn-cgi/_next_cache`. It is
read-only by design: nothing on this site revalidates. Everything under
`public/` ships as a static asset, so keep it to files the site references.

## Stack

- **Next.js 16** + **React 19** (App Router) with TypeScript. Server components by default; only leaves that need the browser are `"use client"`.
- **Tailwind CSS v4** via `postcss.config.mjs`; design tokens live in the `@theme` block of `src/app/globals.css`, no `tailwind.config.*`.
- **framer-motion**: the one animation runtime (nav pill, hero parallax scrub, Work card scale, Log rail). GSAP and Lenis were removed; scroll is native with `scroll-behavior: smooth` and `section { scroll-margin-top }`.
- **@iconify/react** + **@iconify-json/logos** for the real brand marks in the Stack section (`src/app/site/icons.ts` registers the bundled set).
- **@number-flow/react** for the counting KPI numbers on the Work cards.
- **Fonts**: Nippo (display, self-hosted under the ITF Free Font License in `src/app/fonts/`, weights 500 and 700) via `next/font/local` in `layout.tsx`; body copy is the system font stack. The site's only webfont.
- `next.config.ts` sets the security headers and CSP (allowlisted origins for the Binance stream, the contributions API and Cloudflare analytics) and `images.unoptimized: true` (no image optimizer on Workers, so plain `<img>` is deliberate).

## Architecture

`src/app/page.tsx` is a thin server shell that composes the home page from `src/app/site/`, top to bottom:

| Section id | Component | Notes |
|---|---|---|
| `top` | `Hero.tsx` | Osmo parallax port: 120% stage, three planes (AI-generated anime gorge still, the name + pitch + CTAs, a foreground rock cut-out that rises over the name). Waterfall, mist and spray are CSS loops over `public/images/hero/gorge*.webp`, paused off screen. |
| `about` | `Spec.tsx` | Full-height portrait, the live site's copy, a checkable spec sheet. |
| `work` | `Features.tsx` | Every `kind: "build"` project as GitLab-style sticky stacking cards (pin + scale + dim at `lg` only; the cards are opaque on purpose, see `.stack-card` in globals.css); one demo `<video>` decodes at a time; `MarketStrip.tsx` streams three Binance spot pairs on the CryptoFlow card. |
| `clients` | `Field.tsx` | `kind: "client"` projects as a ruled index; the browser frame auto-scrolls a full-page capture of the live site (`*-full.webp`). |
| `stack` | `Inside.tsx` | `StackOrbit.tsx` (two counter-rotating CSS rings), `StackMarquee.tsx` (ONE CSS keyframe marquee for "By choice", then still rows for "On the job" and "Off the clock"; one marquee per page is the rule), `GitHubActivity.tsx` (contribution heatmap fetched once at build time, with a plain profile link as fallback). |
| `log` | `Log.tsx` | Experience, with a scroll-linked ember progress rail. |
| `contact` | `Order.tsx` | Closing scene, no card: poster-size heading over the sunset slide, email CTA, text links; the footer continues its scrim. |
| | `Footer.tsx`, `Nav.tsx` | Floating glass nav with an IntersectionObserver active pill and a phone menu. |
| | `MorphBackdrop.tsx` | Fixed full-viewport WebGL backdrop: one AI-generated Minecraft-style voxel scene per section (`public/images/morph/voxel-*.webp`), a noise burn-through morph on section change, a still between morphs, plus a per-scene weather layer (`Ambience.tsx`: square cherry petals, sea spray, fireflies, sunrise motes; CSS only, paused under the hero). `<img>` cross-fade fallback mounts only if WebGL fails. Keyed by the section ids above. |
| | `Island.tsx`, `VoxelMe.tsx` | A floating voxel island beside each section heading (`public/images/islands/`, chroma-keyed renders; bob, scroll drift, motes; the beacon in Contact draws its beam in CSS). `VoxelMe` is Pavle as a CSS-3D block figure (64x64 skin in `public/images/voxel/`), standing on the About island, waving on hover/focus. |

`Section.tsx` is the shared section frame and heading (`HeadingReveal.tsx` does the word-level mask reveal); headings are statements, with a numbered kicker (`01 About`) naming the section. Section ids are referenced by `Nav.tsx`, `Footer.tsx` and the `slides` list in `page.tsx`; keep all three in sync when adding or renaming a section.

**Data:**
- `src/app/projects.ts`: the seven projects, case-study text, KPIs and gallery, each tagged `kind: "build" | "client"` (which home section shows it). Single source of truth for the Work and Client work sections and for the crawlable case studies under `/work` and `/work/[slug]` (server components, prerendered via `generateStaticParams`).
- `src/app/site/content.ts`: name, role, links, About copy, spec sheet, stack marks and the experience log. Honesty rules are written into the comments there (a contribution is called a contribution, a prototype a prototype).
- `src/app/contact.ts`: the email address, shared with the JSON-LD in `layout.tsx`.

**Other routes:** `/privacy`, `robots.ts`, `sitemap.ts` (generated from `PROJECTS`), `not-found.tsx`. The old terminal, Ask AI API route and lab route no longer exist.

## Design

Near-black glass over an anime hero painting and Minecraft-style voxel scenes. Tokens in `globals.css`: near-black surfaces, white type, silver tonal accents and a single colour, ember (`--color-ember`), rationed to the primary CTA, the active nav pill, the Log rail and the GitHub heatmap ramp. Glass is `.glass` (material, no filter) plus `.glass-blur` (the real `backdrop-filter`), and `.glass-blur` is only on the nav and the About panel; everything else is unblurred glass on a deeper fill, because the backdrop is a live canvas under sticky cards.

`docs/slop.md` is the anti-slop design law this concept was built against, and `docs/research/new-concept-research.md` is the research brief behind it. 21st.dev components (Osmo parallax, Morph Gallery, Magic UI orbiting circles, logo marquee, text-reveal mask, liquid-glass recipe, footer-16) were ported by hand and are credited by URL in each component's top comment; nothing is installed from the registry.

Motion rules that every component follows: content is visible by default (no entrance gated on JS, no `opacity: 0` starts), transforms and opacity only, and every animation is gated on `prefers-reduced-motion`.

## Notes

- `section` elements get `scroll-margin-top: 88px` globally to clear the floating nav.
- Playful measurements live in the components' comments (bytes, contrast ratios, why a threshold is what it is). Update the comment when you change the number.
- `scripts/check-site.mjs` runs against a live server; point it at production with `BASE=https://pavletosic.com node scripts/check-site.mjs`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
