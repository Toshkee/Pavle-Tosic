# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js, localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test suite configured.

## Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** — configured via `postcss.config.mjs`, no `tailwind.config.*` needed
- **Framer Motion** — primary animation library
- **GSAP** — available but currently unused
- **Lenis** (`@studio-freight/lenis`) — smooth scroll, available but currently unused
- **react-icons** (Si* icons from `react-icons/si`)

## Architecture

This is a single-page portfolio. All content lives in `src/app/page.tsx` as one large `"use client"` file — data arrays (`TECH`, `PROJECTS`, `VOYAGE`) are defined at the top, followed by small component functions, then the default export assembles them into sections.

**Sections (rendered top to bottom):**
1. `WantedPosterScene` — hero section with One Piece wanted-poster aesthetic, cinematic sky/dawn animation
2. `FirstIslandSection` — "first island" / About section with parchment poster and tech stack grid

**Supporting files:**
- `src/app/components/CinematicBackground.tsx` — wraps content with a fixed video background (`/video/ocean.mp4`) that parallax-scales on scroll via Framer Motion
- `src/app/useActiveSection.ts` — `IntersectionObserver`-based hook to track which section is currently in view (used for nav highlighting)
- `src/app/globals.css` — global styles including custom CSS classes like `.poster-parchment`, `.spotlight`, `.particles` used heavily in `page.tsx`
- `src/app/styles/cinematic.css` — currently empty

## Design Theme

One Piece anime aesthetic throughout — sections are framed as "arcs" and "ports", the hero is a "wanted poster", experience entries use `VOYAGE` arc naming. All visual styling uses warm parchment/amber tones for the poster and deep ocean/night gradients for backgrounds.

## Notes

- The `public/video/ocean.mp4` file is required for `CinematicBackground` — missing video will break the hero visually
- `section` elements get `scroll-margin-top: 110px` globally (in `globals.css`) to account for sticky nav offset
- Section IDs (`"wanted"`, `"island"`, etc.) are used by `useActiveSection` — keep them in sync if adding nav items
