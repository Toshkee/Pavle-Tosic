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
npm run dev      # Start dev server (Next.js, localhost:3000)
npm run build    # Production build
npm start        # Serve the production build locally
npm run lint     # ESLint (flat config via eslint-config-next)
```

No test suite configured.

## Deployment

Deployed to **Cloudflare Workers** via `@opennextjs/cloudflare` + `wrangler`. The worker name is `my-portofolio` (note the misspelling — kept intentionally; renaming requires updating Cloudflare config). No deploy script exists in `package.json`. Deploy flow:

```bash
npx opennextjs-cloudflare build   # Build for Cloudflare Workers
npx wrangler deploy               # Deploy to Cloudflare
npx wrangler dev                  # Local Cloudflare Workers preview
```

Config lives in `open-next.config.ts` (uses `defineCloudflareConfig()`) and `wrangler.jsonc`.

## Stack

- **Next.js 16** + **React 19** (App Router) with TypeScript
- **Tailwind CSS v4** — configured via `postcss.config.mjs`, no `tailwind.config.*` needed
- **Framer Motion** — primary animation library
- **GSAP** — available but currently unused
- **Lenis** (`@studio-freight/lenis`) — smooth scroll, available but currently unused
- **react-icons** (Si* icons from `react-icons/si`)
- **Fonts** — Geist Sans + Geist Mono loaded via `next/font/google` in `layout.tsx`

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
- `src/app/layout.tsx` — root layout; sets `<html lang="en">`, metadata (OG, Twitter cards, `metadataBase: pavletosic.com`), font CSS variables
- `src/app/useActiveSection.ts` — `IntersectionObserver`-based hook to track which section is currently in view (used for nav highlighting)
- `src/app/globals.css` — global styles including custom CSS classes like `.poster-parchment`, `.spotlight`, `.particles` used heavily in `page.tsx`
- `public/images/` — One Piece character images (luffy.jpg, zoro.jpg, etc.) and profile photos referenced by name in `page.tsx`

## Design Theme

One Piece anime aesthetic throughout — sections are framed as "arcs" and "ports", the hero is a "wanted poster", experience entries use `VOYAGE` arc naming. All visual styling uses warm parchment/amber tones for the poster and deep ocean/night gradients for backgrounds.

## Notes

- `section` elements get `scroll-margin-top: 110px` globally (in `globals.css`) to account for sticky nav offset
- Section IDs are used by `useActiveSection` — keep them in sync if adding nav items
- This is a `"use client"` page; if you split components out, be deliberate about the client/server boundary (Next.js 16 App Router defaults to server)
