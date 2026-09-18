# New concept research brief

## 1. Answer first

Build **UNIT 01, the Launch Plate**: a warm graphite-brown product-launch page where Pavle is the product, with one real glass slab as the signature and everything else built from real material (his portrait, three real demo videos, counted repo facts). Both judges scored it 41 out of 50, ahead of a printed-magazine concept (35.5 / 33) and a dark-room-with-refraction concept (33.5 / 31), because it is the only direction where the glass moment is visible in every browser rather than Chromium only. Graft in four fixes from the runners-up: the fixed nav loses its blur and becomes a solid plate, so the hero slab is the only real `backdrop-filter` on the page; the accessibility and reduced-transparency gates flip CSS custom properties instead of forking JSX; client work becomes a ruled index instead of a two-up screenshot grid; and the hero seam masks the image's own pixels instead of laying a colour gradient over them. Cut the decorative ember canvas entirely, which takes the whole site to zero canvas, zero rAF and zero particles. Ship on the existing stack with zero new runtime dependencies.

**R2 hero, can we have it?** Yes, ported, not installed. The 21st.dev registry is API-key gated (HTTP 403), but the author's own vanilla source is public and was read line by line at https://cdpn.io/osmosupply/debug/NWQevrB, and its four-layer mechanism maps 1:1 onto framer-motion `useScroll` + `useTransform`.

**R3-like ambience, what instead?** Not R3 itself: its compiled source is confirmed purple (`rgba(191,128,255,0.8)` particles on a hardcoded black fill) with real perf bugs. The closest non-purple, perf-honest live option is React Bits Threads (https://reactbits.dev/backgrounds/threads), neutral white by default and the only one of its family that ships its own IntersectionObserver plus `document.hidden` pause. The recommendation is still to skip it and author the atmosphere into the hero plate instead.

**R1 projects section, how?** A pinned media rail: three text blocks scrolling in the left column, one sticky `<video>` in the right column, swapped by IntersectionObserver state, with a permanent poster image underneath so nothing can render blank.

## 2. The three references, deconstructed

### R1, GitLab "Built for how you work" (fetched, https://about.gitlab.com/)

**What it actually is:** not the pattern the brief assumed. The section is `.stacking-cards`, a deck of four text-plus-image cards, each `position: sticky; top: calc(120px + var(--index)*20px); margin-bottom: 32px`, entering via native CSS scroll-driven animation (`animation-timeline: --card-view; view-timeline: --card-view block; animation-range: entry 0 cover 30%`) with a transform-only keyframe. Zero JS motion: the compiled component chunk has no scroll listener, no IntersectionObserver, no animation library. The whole homepage contains **zero `<video>` tags**; the right side is a lazy `<img>`.

**GitLab's real text-left/video-right component** is `text-and-video-col`, live at https://about.gitlab.com/gitlab-duo/duo-amazon-q/. It is plain alternating flex rows with no scroll animation at all, and it autoplays five videos with no visibility gating, which is an anti-pattern to avoid.

**Palette problem:** purple is baked in (`#e1d8f9` / `#5943b6` pills, a `#a989f5` to `#fca326` gradient badge). Take the structure, none of the colour.

**How we adapt it:** take the intent (one project at a time, text beside moving media) and build the pinned variant, which suits three demo videos far better than a card deck. Stacked sticky cards each carrying glass would mean N overlapping blur passes over an area that is scrolling and playing video, which is the exact shape of this repo's recorded Windows wheel jank.

### R2, Osmo Parallax Scrolling (page fetched; source read from the author's CodePen)

**What it is:** a 100svh hero holding a 120svh `overflow: hidden` stage with four absolutely positioned layers in DOM order, no z-index. Each image is `height: 117.5%; top: -17.5%; object-fit: cover` so translation never reveals an edge. GSAP ScrollTrigger scrubs one timeline over the stage: `yPercent` 70 / 55 / 40 / 10, `ease: "none"`, backmost travels farthest. Lenis provides the smoothing, synced through GSAP's ticker.

**Deps:** gsap 3.12.5 + ScrollTrigger + lenis 1.1.14. Not needed: four `useTransform` calls reproduce it exactly.

**Four corrections that matter for the port:**
1. The scroll target is the **120svh stage**, not the 100svh section. Targeting the section runs the motion about 17 percent fast and ends it early.
2. The bottom fade is a **13-stop eased gradient** (alphas 1 / .738 / .541 / .382 / .278 / .194 / .126 / .075 / .042 / .021 / .008 / .002 / 0). A naive two-stop gradient bands visibly against a large flat field.
3. `yPercent` is relative to each element's own height, and the heights differ. Preserve them or the depth ratios change silently.
4. The source photos are near square (2000x1906). Project screenshots are 16:9 and would crop to a vertical sliver. `public/images/me.jpg` at 1634x2219 is the only asset in the repo with the right aspect.

**Palette problem:** the reference's mood is cold blue moonlit mountains. The brief wants warm. Keep the mechanism, replace the imagery.

### R3, Aether Flow Hero (page fetched; compiled source pulled from the public CDN bundle)

**What it is:** roughly 70 lines of classic particles.js constellation. `numberOfParticles = canvas.height * canvas.width / 9000`, about 230 particles at 1080p scaling with viewport **area**. `connect()` is an O(n²) all-pairs loop issuing a separate `beginPath` / `stroke` per line. Particles are flat `ctx.arc` circles, no glow. Cursor interaction is pure repulsion with no restoring force, so hovering permanently thins the field. There is no devicePixelRatio scaling, no `visibilitychange` pause, no IntersectionObserver, no reduced-motion check, and a line-opacity bug makes alpha go negative past about 141px, so the far half of the web inherits the previous pair's colour.

**Palette problem:** particles `rgba(191,128,255,0.8)`, lines `rgba(200,150,255,a)`, background hardcoded `"black"`, chrome in `bg-purple-500/10` with a `text-purple-400` icon. The entrance is a staggered `opacity: 0` reveal, which this repo's own law bans outright. License field is empty.

**How we adapt it:** we do not. Take the mood (sparse, slow, depth on dark ground) and deliver it with authored light in the hero plate. This is a deliberate decline of a reference the user named, so put it to him in the first conversation, with the reason.

## 3. Hero: candidates ranked

| Name | URL | Closeness | Deps | Perf note |
|---|---|---|---|---|
| Osmo Parallax Scrolling (R2), ported to framer-motion | https://cdpn.io/osmosupply/debug/NWQevrB | 10 | none (framer-motion already installed) | Transform-only, compositor cheap. Needs a `useSpring` damper, see section 10 |
| Osmo listing page (deps + install only, source gated) | https://21st.dev/@osmosupply/components/parallax-scrolling | 10 | gsap + lenis | Registry JSON returns 403, not installable without a key |
| Aceternity Hero Parallax | https://ui.aceternity.com/components/hero-parallax | 8 | framer-motion | Cheap, but the default product-thumbnail grid reads templated |
| Smooth Scroll Hero | https://21st.dev/@ishamsu/components/smooth-scroll-hero | 7 | framer-motion | Calm background parallax, gated source |
| Aceternity Parallax Hero Images | https://ui.aceternity.com/components/parallax-hero-images | 6 | framer-motion | Mouse-driven, does nothing on touch |
| Halide Topo Hero | https://21st.dev/community/components/shivendra9795kumar/halide-topo-hero/default | 6 | unstated | Monochrome topo layers, render cost unverified |
| Scroll Expansion Hero | https://21st.dev/@arunachalam/components/scroll-expansion-hero | 5 | unstated | Scroll-scrubbed media scaling, expensive if it scales layout |
| Shape Landing Hero (Kokonut) | https://21st.dev/@kokonutd/components/shape-landing-hero | 3 | framer-motion | Listed to rule out: dark gradient plus floating blurred glow shapes is the generic 2026 hero |

## 4. Section ambience: candidates ranked

| Name | URL | Closeness to R3 | Deps | Recolour | Perf note |
|---|---|---|---|---|---|
| Aether Flow Hero (R3 itself) | https://21st.dev/@dhileepkumargm/components/aether-flow-hero | 10 | framer-motion, lucide-react | Hardcoded purple plus black fill, needs a rewrite not a prop | ~230 particles at 1080p, O(n²), no pause. Reject |
| React Bits Threads | https://reactbits.dev/backgrounds/threads | 7 | ogl | `color` prop, default `[1,1,1]`, trivial | The only one with a built-in IntersectionObserver + `document.hidden` guard |
| React Bits Iridescence | https://reactbits.dev/backgrounds/iridescence | 6 | ogl | White default, trivial | `mouseReact` true by default, no pause, add your own |
| Paper Shaders (God Rays, Neuro Noise) | https://shaders.paper.design/ | 7 | @paper-design/shaders-react | Warm presets exist (Sunset, Sepia, Noir) | Real WebGL per instance, no pause, cap to one section |
| React Bits Aurora | https://reactbits.dev/backgrounds/aurora | 5 | ogl | `colorStops` defaults to `#5227FF` purple, one array to change | Raw rAF loop, no pause |
| React Bits Silk | https://reactbits.dev/backgrounds/silk | 6 | three + @react-three/fiber | `color` default `#7B7481` purple-grey, one prop | `frameloop="always"`, heaviest deps, skip |
| Aceternity Aurora Background | https://ui.aceternity.com/components/aurora-background | 3 | none (CSS) | Composes from your own classes | Pure CSS `background-position` over 60s, cheapest live option |
| Hand-authored WebGL gradient (technique) | https://alexharri.com/blog/webgl-gradients | 6 | none, build it | Yours from the start | Good SDF-blur trick, but it is a build-it-yourself GLSL job |

**Recommendation:** none as a live layer. `slop.md` bans drifting soft-blend blobs, radial glow halos and faint grid backgrounds by name, and the premium alternative it names is "directional light with real falloff". Bake a single authored warm light-field plate (AVIF, roughly 70KB, perlin grain at 3 percent baked in) as the hero's back plane and reuse the same rake in the closing frame. If the user insists on a live ambient layer after seeing it, Threads is the one to reach for, recoloured warm and confined to one bounded section.

## 5. Projects section, the GitLab pattern

Chosen implementation: **pinned media rail, IntersectionObserver state, one decoder, poster always underneath.**

```tsx
"use client";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function Features({ items }: { items: Project[] }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  return (
    <section id="features" className="grid gap-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div>
        {items.map((p, i) => (
          <Block key={p.slug} project={p} index={i} onEnter={() => setActive(i)} />
        ))}
      </div>

      {/* sticky rail: pure CSS, no pinning library, no preventDefault */}
      <div className="hidden lg:block">
        <div className="sticky top-[14svh] h-[72svh] plate">
          {/* permanent base layer: if a crossfade is ever stranded, a real image is still here */}
          <img src={items[active].poster} alt="" className="absolute inset-0 h-full w-full object-cover rounded-[8px]" />
          {!reduced && (
            <motion.video
              key={items[active].slug}
              src={items[active].video}
              poster={items[active].poster}
              muted loop playsInline preload="metadata" autoPlay
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.26, ease: [0.2, 0.7, 0.3, 1] }}
              className="absolute inset-0 h-full w-full object-cover rounded-[8px]"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Block({ project, index, onEnter }: BlockProps) {
  const ref = useRef<HTMLElement>(null);
  // one band across the vertical middle is more robust than three independent amount thresholds,
  // which can all read false in the gap between blocks and strand activeIndex
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  if (inView) onEnter();
  return <article ref={ref} className="min-h-[78svh] flex flex-col justify-center">{/* ... */}</article>;
}
```

Notes that are load-bearing:

- `border-radius` goes on the `<video>` element itself. A rounded `overflow: hidden` ancestor can knock a playing video off the composited fast path in Chrome and Safari.
- Do not use `<AnimatePresence mode="wait">` here. It unmounts before it mounts and you get a visible blank frame.
- Exactly one `<video>` is mounted at a time. Pause on `visibilitychange` and when the rail leaves the viewport.
- The entrance motion, if any, is `y` and `scale` only, scrubbed from `useScroll`. Never scrub `filter` or `box-shadow`, which is what keeps the work on the compositor.

**Mobile stacking:** below 1024px the rail un-sticks and each article gets its own inline media plate directly under its own text, still one decoder at a time, `preload="none"`, poster visible, tap to play. GitLab deletes its media below 1024px; do not copy that, the demos are the point.

## 6. Glass recipe

**Where glass is allowed:** exactly one surface with a real `backdrop-filter`, the **launch slab** in the hero, `min(680px, 90vw)` by 96px, sitting over the portrait and the lower third of the wordmark. Everything else that looks like glass (the media plate's control strip, the spec plate, the footer link row) uses the same material language with **no filter at all**, sitting on a solid plate. The fixed nav is solid, not glass.

```css
:root {
  --glass-fill: rgba(236, 222, 205, 0.055);
  --glass-blur: 14px;
  --glass-lip: rgba(255, 246, 235, 0.22);   /* top edge, warm bone */
  --glass-under: rgba(196, 116, 76, 0.14);  /* bottom edge, copper tint */
}

.slab {
  background: var(--glass-fill);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  box-shadow:
    inset 0 1px 0 rgba(255, 246, 235, 0.20),      /* specular lip */
    inset 0 1px 32px rgba(255, 246, 235, 0.10),   /* inner frost highlight */
    inset 0 1px 0 0 var(--glass-lip),
    inset 0 -1px 0 0 var(--glass-under),
    0 3px 4px rgba(16, 12, 10, 0.38);             /* tight, tinted, directional */
  contain: paint;
}

@supports not (backdrop-filter: blur(1px)) {
  .slab { background: #1E1614F2; backdrop-filter: none; }
}
@media (prefers-reduced-transparency: reduce) {
  :root { --glass-fill: rgba(30, 22, 20, 0.92); --glass-blur: 0px; }
}
```

Fake the chromatic dispersion with a 1px conic edge gradient running warm amber to bone to faint rose at 8 percent. No cyan.

**Declined, with reasons:** SVG `feDisplacementMap` refraction (the kube.io and LogRocket recipes are real and both confirm it is Chromium-only as a `backdrop-filter` input and roughly doubles compositing cost), and WebGL glass via `MeshTransmissionMaterial` (a documented extra render pass, and this repo already uninstalled three.js once). A material that is two different materials depending on the browser fails `slop.md`'s "glass is premium only when it is flawless".

**Fallbacks:** Firefox and Safari get the plain blur recipe above, which is what they support; only the SVG refraction path would have degraded, and we are not shipping it. `@supports not (backdrop-filter: blur(1px))` swaps to a solid plate. `prefers-reduced-transparency: reduce` raises fill alpha to 0.92 and drops the blur, flipped through the custom properties so there is one definition of glass rather than a branch in every component.

**Perf budget:** one blurred surface, 680 x 96, about 65k CSS px. Blur capped at 14px, because past roughly 20px nobody can tell. `contain: paint`. Never `will-change: backdrop-filter` (documented artifacts and dropped frames on iOS Safari). Never a `backdrop-filter` over a playing video. Never glass over glass, verified at every breakpoint, because a fixed toolbar and a bottom-anchored slab will collide on short and landscape viewports.

**Contrast:** check text on the slab at 4.5:1 against a screenshot of the actual blurred backdrop, not a flat swatch. This is the single most skipped step in glass work.

## 7. Design language

**Palette.** Base ink `#100C0A` (warm brown-black, deliberately not the `#0c0e15` cool blue-charcoal `slop.md` names, and not cream). Raised surface `#171110`. Plate `#1E1614`. Primary type `#EDE3D6` warm bone, never pure white. Body `#A2938A`. Tertiary `#6E625C`. One accent family, copper, used **tonally**: `#C4744C` for the active tick, the availability dot and the chamfer marker on hover, `#8A5637` dim. The copper never appears as a button fill or a poster-bright pop, because `slop.md` calls a saturated accent on type, dots and buttons a template whatever the hue. Zero purple, zero indigo, zero cyan.

**Typography.** Display: **Nippo** (Fontshare, free FFL, self-hosted via `next/font/local`). It is off the rejected Google rotation, off this repo's existing Tanker plus Mononoki pairing, and its glyph coverage was verified with fontTools for Š U+0160, Ć U+0106, Č U+010C and đ U+0111, so "TOŠIĆ" sets correctly. Ship weights 500 and 700 only, with the FFL licence file saved beside the existing `TANKER-LICENSE-FFL.txt`. Body: **system-ui stack**, which `slop.md` explicitly sanctions as genuinely neutral, and which costs zero webfont bytes on a page whose mobile LCP is already flagged. If the body needs more character in a side-by-side test, Switzer or Supreme from the same foundry is one more 20KB. Nippo has no `tnum` feature, so every numeric column is grid-aligned and right-set rather than relying on figure width.

**Spacing and radius.** Measure: 58-62ch body, 46ch lead, and state it for the spec plate columns too. Outer gutter 24px at phone width, 6-8vw on desktop, never edge-to-edge text. Concentric radii as a rule: outer frame 24px with 16px padding, inner media 8px. One bespoke geometry signs every container: a 28px chamfer on one corner, with content padded 44px clear of the cut and checked at zoom.

**Motion vocabulary.** Scroll-driven parallax on the hero (transform only, damped through one `useSpring`), scroll-derived state for the project swap, authored hovers that change tone rather than lift. No entrance reveals anywhere. Nav enters by animating `y`, never opacity-to-0.

**The ten anti-slop rules most relevant here:**
1. Content is visible by default. Never gate text or a control on an animation completing.
2. No purple, no blue-to-purple, no cool blue-charcoal dark, no cream editorial background.
3. Accent is tonal, not a saturated pop on type, dots and buttons.
4. Do not animate underlines at all. No hover lift, no boop.
5. Glass is flawless or absent. No banding, no leak, no pop on hover.
6. Shadows are tight, directional and tinted to the surface. Never a symmetric bloom.
7. No faint grid background, no drifting gradient blobs, no radial glow halo behind an object.
8. The signature face cannot come off the Google shelf. Self-host something with character.
9. One label treatment everywhere is a costume. Give different roles different treatments.
10. Clear the cut. Every clip-path, notch or fixed height gets its content padded clear and checked pixel for pixel.

Plus the two that bound the whole page: dead-looking is a fail on its own, and grain belongs in the substrate, never laid over content.

## 8. The concept directions

| Concept | Judge A | Judge B | Verdict |
|---|---|---|---|
| **UNIT 01, Launch Plate** (warm graphite launch page, one real glass slab, three demo videos as product features) | 41 | 41 | **Winner.** Only concept where the glass payoff works in every browser |
| **RECTO** (portfolio as a printed magazine issue, warm paper stock, ink plate section) | 35.5 | 33 | Best engineered, cheapest to build, but the ground is `#F4EFE6` cream, which `slop.md` names outright, and it argues the glass away into painted fills |
| **VITRINE** (warm dark room you descend through, refracting lens) | 33.5 | 31 | Best single idea (the name sliding up through the lens), worst engineering: a full-width 34vh blur that translates every frame, plus a Chromium-only feDisplacementMap |

### The chosen direction, section by section

1. **`#reveal`** Four-plane parallax hero. Back: an authored warm light-field plate with a directional rake, grain baked in. Mid: his real portrait, duotoned `#17120E` to `#EFE1CE`. Front of that: the wordmark, PAVLE small in tracked caps over TOŠIĆ at `clamp(3.6rem, 14.5vw, 13.5rem)`. Frontmost: the glass launch slab crossing the lower third of the type and the face, so both visibly frost and shift through it.
2. **`#spec`** A quiet two-column technical sheet of checkable facts: stack, years, location, languages, availability, counted repo numbers. Four corner crop marks. No cards, no pills, no stat row.
3. **`#features`** The R1 section: three text blocks left, one sticky demo video right. CryptoFlow, Ronin Duel, Arc. The CryptoFlow block carries the existing live Binance ticker re-skinned as a single warm data strip on the plate's solid surface, so the claim proves itself rather than being described.
4. **`#field`** Client work as a ruled index: year, name, one line of scope, live link, with the screenshot revealed on hover at desktop width. Villa Vučje and Mandarina have no video and should not be padded out to look like they do.
5. **`#inside`** One monochrome row of real brand marks at even size, bare, no tiles, plus two lines on how he actually works.
6. **`#log`** Release history, scoped honestly: PEL is two features contributed to a colleagues' system, the ASK portal was a tender proof of concept, he produced the NGO Register tutorials.
7. **`#order`** Availability, direct email, GitHub, LinkedIn, CV, with the oversized TOŠIĆ anchored flush to the bottom edge, bleeding slightly off it, on the layer above everything.

## 9. Recommended stack

**Add nothing.** Everything ships on what `package.json` already pins: `next` 16.3.3, `react` 19.2.8, `framer-motion` ^12.43.0, `lenis` 1.3.26, `tailwindcss` ^4, `@iconify/react` ^6.0.2. The only new files are two self-hosted woff2 faces.

**Do not add, with reasons:**

- **gsap + ScrollTrigger** (now genuinely free including ScrollTrigger, confirmed at https://gsap.com/pricing/, currently 3.15.0). The Osmo hero is about twelve lines of `useScroll` / `useTransform`. Adding GSAP means bridging its ticker to Lenis, which reintroduces the double-rAF pattern behind this repo's documented Windows jank, and GSAP's own docs steer toward ScrollSmoother over Lenis.
- **@react-three/fiber / three / ogl / paper-shaders.** R3F 9.7.0 pins `react >=19 <19.3` against this repo's 19.2.8, a narrow ceiling, and this repo already paid down WebGL idle-GPU cost once.
- **Any liquid-glass package** (`liquid-glass-react`, `liquid-glass-web-react`, `glasscn`, `nikdelvin/liquid-glass`). All real, all wrapping the same feDisplacementMap pipeline we are not shipping. Read nikdelvin's fallback branch as a reference, do not install it.
- **Native CSS scroll-driven animation as a mechanism.** `animation-timeline` is at 87.22 percent, Chrome and Edge 115+, Safari 26+, Firefox not until 159. More importantly, gating content on a timeline that may never fire is the invisible-content trap. Use it only behind `@supports` for something decorative whose absence changes nothing.

**Next 16 boundary notes.** `ssr: false` with `next/dynamic` is not allowed in a Server Component and throws; it must be called from inside another Client Component (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, line 95). A crawler that runs no JavaScript sees only the server-rendered HTML, which is another reason nothing may start at `opacity: 0`. Keep `page.tsx` a thin server shell with one `"use client"` component per section.

## 10. Performance guardrails

1. **One scroll system.** Lenis stays exactly as pinned: `new Lenis({ lerp: 0.1, smoothWheel: false })` at `src/app/SmoothScroll.tsx:31`, early-returning under reduced motion. Do not re-enable `smoothWheel` to get the R2 glide. The Osmo demo's silkiness comes from stock Lenis `smoothWheel: true`, which this repo deliberately removed to kill Windows mouse-wheel jank.
2. **Damp inside framer instead.** `const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.35 })`, then feed `p` to all four `useTransform` calls. One spring, four consumers. This is a hypothesis until measured on a real Windows mouse; if it still steps, degrade to three planes, then pin the shelf plane, then parallax the back plane alone.
3. **Compositor only.** Every scroll-linked property is `transform` or `opacity`. Nothing scrubs `filter`, `box-shadow`, `width`, `height` or `backdrop-filter`. The slab translates but never scales, because scaling a blurred surface forces a re-sample.
4. **Glass budget.** One real blur, capped at 14px, `contain: paint`, never on a `position: fixed` element, never over video, never stacked.
5. **Video.** One decoder alive at a time, `preload="metadata"` on desktop and `"none"` on mobile, poster always set from the existing thumbs, paused on `visibilitychange` and on rail exit. Re-encode `public/video/projects/anime-watchlist.mp4`: it is 2.26MB against cryptoflow's 291KB and ronin-duel's 260KB.
6. **Zero canvas, zero rAF, zero particles, zero SVG filters over large areas.** Grain is a baked PNG or baked into the plate, never `feTurbulence` over the page.
7. **Images.** Hero planes as AVIF with WebP fallback, explicit width and height, `fetchpriority="high"` on the portrait. `content-visibility: auto` with `contain-intrinsic-size` on `#inside`, `#log` and `#order`.
8. **Verify before merge**, in order: a real Windows machine with a notched wheel through the hero and the rail; Safari and Firefox confirming the slab degrades cleanly; JavaScript disabled, confirming every word still renders; Lighthouse mobile against the current baseline; a zoom pass on every clipped edge; a point-by-point re-read of `docs/slop.md`.

## 11. Risks and open questions for the user

1. **Light or warm dark?** The recommendation is warm dark (`#100C0A`), because the brief says dark is fine if warm and never asks for light, and because `slop.md` names cream as a default. If Pavle wants light, the whole system is tokenised and can invert, but say so before build.
2. **The portrait.** The hero rests on `public/images/me.jpg` (1634x2219, the only portrait-aspect asset in the repo). Does he want his own face on it? If yes, is this frame good enough or does he want one warm portrait-orientation shoot? If no, the hero loses its only real imagery and the fallback is weaker. This is the first question.
3. **The R3 decline.** He named Aether Flow for the post-hero sections and we are rejecting its implementation on inspection. Show him the reasons early, and ask whether what he liked was the linked-web look specifically or the slow luminous drift, because those are different builds.
4. **Which projects lead, and how many?** Three demo videos plus two client sites is proposed. Three in `#features` and two in the `#field` index. Confirm the order (CryptoFlow first is assumed) and whether the anime watchlist or Arc leads the third slot.
5. **Assets to produce before build:** the authored light-field plate (one AVIF), the duotone portrait crop, a re-encode of anime-watchlist.mp4 to roughly 600KB, and the counted repo numbers for the spec plate.
6. **Type sign-off.** Nippo is licence-checked and glyph-checked but has not been rendered at 13rem. Set "TOŠIĆ" in it first and look at it. Alternates from the same foundry: Gambarino, Sentient. Repeat the Š and Ć check for whichever wins.
7. **21st.dev key.** Neither reference component's shipped TSX was obtainable (403, and the `magic` MCP failed to authenticate). If he has a key, pulling the real `parallax-scrolling` source is ten minutes well spent before build.
8. **Copy honesty.** A launch-page voice makes overclaiming easy. PEL is a contribution, the ASK portal was a POC, the CV is stale, Kalipè is not live. One inflated line undoes the "real specificity" argument the whole design rests on.

## 12. Sources

All URLs below were fetched successfully during research.

- https://about.gitlab.com/ R1, the live stacking-cards section, CSS read from inline SSR style
- https://about.gitlab.com/gitlab-duo/duo-amazon-q/ GitLab's real text-left/video-right component
- https://21st.dev/@osmosupply/components/parallax-scrolling R2 listing, deps only, registry JSON 403
- https://cdpn.io/osmosupply/debug/NWQevrB R2's actual source, the author's own CodePen
- https://21st.dev/@dhileepkumargm/components/aether-flow-hero R3 listing, deps and description
- https://cdn.21st.dev/dhileepkumargm/aether-flow-hero/default/bundle.1756114512155.html R3's compiled source
- https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ Apple's own Liquid Glass definition
- https://wwdcnotes.com/documentation/wwdc25-219-meet-liquid-glass/ the "avoid stacking glass on glass" and tint rules
- https://www.createwithswift.com/liquid-glass-redefining-design-through-hierarchy-harmony-and-consistency/ concentric radii
- https://www.nngroup.com/articles/liquid-glass/ the legibility failure modes
- https://designedforhumans.tech/blog/liquid-glass-smart-or-bad-for-accessibility numeric thresholds, 4.5:1 after blur, 6px specular cap
- https://therobbiedavis.com/how-to-recreate-the-ios-26-glassy-effect-with-css/ the cross-browser CSS base recipe
- https://www.joshwcomeau.com/css/backdrop-filter/ the mask-not-overflow trick
- https://blog.logrocket.com/how-create-liquid-glass-effects-css-and-svg/ the SVG refraction pipeline, Chromium-only
- https://kube.io/blog/liquid-glass-css-svg/ Snell's law displacement maps, and their cost
- https://21st.dev/blog/liquid-glass-react-components the blur budget, area over count, cap at 20px
- https://github.com/nikdelvin/liquid-glass a documented Safari fallback branch worth reading
- https://drei.docs.pmnd.rs/shaders/mesh-transmission-material WebGL glass, rejected on cost
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency support and OS settings
- https://motion.dev/docs/react-use-scroll useScroll target and offset, GPU-safe property list
- https://github.com/darkroomengineering/lenis/blob/main/README.md version 1.3.26, smoothWheel default
- https://gsap.com/pricing/ GSAP 3.15.0 now free including ScrollTrigger
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/ pinning caveats, ScrollSmoother over Lenis
- https://caniuse.com/mdn-css_properties_animation-timeline 87.22 percent, Firefox 159 unreleased
- https://developer.chrome.com/docs/css-ui/scroll-driven-animations Chrome 115+, Safari 26+
- https://caniuse.com/view-transitions 91.75 percent, Firefox 144+
- https://ui.aceternity.com/components/hero-parallax framer-motion-only parallax hero
- https://ui.aceternity.com/components/sticky-scroll-reveal the pinned-panel pattern, read for shape
- https://reactbits.dev/backgrounds/threads the one ambient shader with a built-in visibility pause
- https://reactbits.dev/backgrounds/aurora purple by default, one array to recolour
- https://shaders.paper.design/ Paper Shaders, Apache 2.0, warm presets exist
- https://alexharri.com/blog/webgl-gradients hand-rolled flowing gradient technique
- https://www.fontshare.com/fonts/nippo the display face, FFL, glyph coverage verified locally

Not obtainable, stated plainly: the shipped TSX of either 21st.dev component (registry returns HTTP 403 "Authentication required", and the `magic` MCP server failed to authenticate this session), and Apple's own HIG "Materials" page (client-rendered shell, body never retrievable). The Apple guidance above comes from the Newsroom release and third-party WWDC session notes.
