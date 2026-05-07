# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js, localhost:3000)
npm run build    # Production build
npm start        # Serve the production build locally
npm run lint     # ESLint (flat config via eslint-config-next)
```

No test suite configured.

## Deployment

Deployed to **Cloudflare Workers** via `@opennextjs/cloudflare` + `wrangler`. The worker name is `my-portofolio` (note the misspelling — kept intentionally; renaming requires updating Cloudflare config). No deploy script exists in `package.json`; use the standard `opennextjs-cloudflare` build + `wrangler deploy` flow.

## Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** — configured via `postcss.config.mjs`, no `tailwind.config.*` needed
- **Framer Motion** — primary animation library
- **GSAP** — available but currently unused
- **Lenis** (`@studio-freight/lenis`) — smooth scroll, available but currently unused
- **react-icons** (Si* icons from `react-icons/si`)

## Architecture

This is a single-page portfolio. All content lives in `src/app/page.tsx` as one large `"use client"` file — data arrays (`TECH`, `PROJECTS`, `VOYAGE`) are defined at the top, followed by small component functions, then the default export assembles them into sections.

**Sections (rendered top to bottom)** — each is identified by a DOM `id` used for nav and `useActiveSection`:
1. `#wanted` — hero with One Piece wanted-poster aesthetic, cinematic sky/dawn animation
2. `#journey-transition` — transition scene leading into the journey
3. `#journey` — "first island" / About section with parchment poster and tech stack grid
4. `#voyage` — experience timeline (uses the `VOYAGE` data array)
5. `#crew` — projects/tech showcase (includes inline gameplay videos: `cs2.mp4`, `gaming.mp4`)
6. `#contact` — contact section

`page.tsx` is ~3000 lines and contains many inline SVG scenes (gradients, patterns, island/mountain shapes). When editing visuals, expect dense SVG markup mixed with Framer Motion animations.

**Supporting files:**
- `src/app/components/CinematicBackground.tsx` — wraps content with a fixed video background (`/video/ocean.mp4`) that parallax-scales on scroll via Framer Motion
- `src/app/useActiveSection.ts` — `IntersectionObserver`-based hook to track which section is currently in view (used for nav highlighting)
- `src/app/globals.css` — global styles including custom CSS classes like `.poster-parchment`, `.spotlight`, `.particles` used heavily in `page.tsx`
- `src/app/styles/cinematic.css` — currently empty

## Design Theme

One Piece anime aesthetic throughout — sections are framed as "arcs" and "ports", the hero is a "wanted poster", experience entries use `VOYAGE` arc naming. All visual styling uses warm parchment/amber tones for the poster and deep ocean/night gradients for backgrounds.

## Notes

- `CinematicBackground` references `/video/ocean.mp4`, but only `cs2.mp4` and `gaming.mp4` exist in `public/video/`. The ocean video is currently missing — if the hero background looks broken, that's why. Either add the file or change the `src` in `CinematicBackground.tsx`.
- `section` elements get `scroll-margin-top: 110px` globally (in `globals.css`) to account for sticky nav offset
- Section IDs are used by `useActiveSection` — keep them in sync if adding nav items
- This is a `"use client"` page; if you split components out, be deliberate about the client/server boundary (Next.js 16 App Router defaults to server)
