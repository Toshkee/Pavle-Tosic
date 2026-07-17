"use client";

import { memo, useEffect, useRef } from "react";

/* Digital-rain background — faint columns of falling phosphor glyphs behind the
   section deck (replaces the old 3D "data-core"). The canvas is TRANSPARENT so
   it composites over the dot-grid; instead of the classic translucent-black
   fade we clearRect every frame and draw each column as a self-fading trail
   (bright head → dim tail).

   It REACTS to the active SECTION: changing sections fires a brief "surge"
   (columns speed up + brighten, then settle), so moving through the deck feels
   like the rain responds. The glyphs are blurred into soft streaks of light —
   with the aurora blobs gone, this is what tints the page green.

   Realism model (the rain is a VOLUME, not a wallpaper):
   - DEPTH TIERS: each column lives on one of three planes — far columns are
     smaller, dimmer and slower; near ones larger, brighter and faster. Scaling
     the pre-blurred sprite down doubles as depth-of-field (a shrunken blur
     reads as "farther out of focus"), so parallax costs nothing extra.
   - WHITE-HOT HEADS: the leading glyph is green-tinted white, so a trail
     reads as EMITTED by its head rather than painted with it.
   - ORGANIC COLUMNS: trail lengths vary per column (quantized to LEN_OPTS so
     alpha still batches) and a respawn sometimes idles a beat first — the
     density breathes instead of raining wall-to-wall.
   - GLITCHES: cells occasionally spawn dark (holes in the trail) and columns
     rarely stall for a beat mid-fall — an imperfect signal, not a metronome.
   - TERMINAL LINK: commands typed in the Terminal (window "pt:rain-cmd"
     event) surge the rain and stream the command's name down a few near
     columns — the background is wired to what the visitor does.
   - HIDDEN WORDS: once in a while a resetting column carries a real word
     vertically through the noise; its letters render from a sharper atlas row
     (the one in-focus thing in the bokeh) and hold a minimum brightness for
     the life of the trail — readable for a moment, then swallowed.

   Perf: the blur is BAKED into a pre-rendered glyph atlas (gaussian blur is
   linear, so pre-blurred sprites composite the same as blurring the frame).
   The old approach — sharp fillText + a CSS blur(4px) on the element — made
   the GPU re-blur the whole viewport on every repaint, and each of the ~2000
   glyphs per frame paid fillText + an rgba() string allocation. Now a frame is
   plain drawImage blits with globalAlpha set once per (tier × trail step), and
   there is no CSS filter at all (kept only as a fallback where ctx.filter is
   missing). And because the output is bokeh, the canvas renders at HALF
   resolution and the browser upscales it — the bilinear stretch is invisible
   inside the blur and quarters the pixels every blit touches (which is what
   keeps the sprite path cheap even under software rasterization). Redraw
   capped at ~30fps, the loop PAUSES while the tab is hidden, and under
   prefers-reduced-motion we paint one full frozen frame and never loop. */

const HOT = "225, 255, 234"; // white-hot leading glyph (green-tinted white)
const HEAD = "92, 240, 138"; // --color-accent-ink — word letters
const TRAIL = "34, 197, 94"; // --color-accent — dimmer trail
// Noise glyphs, then the word alphabet. Random cells only roll inside the
// noise range so Latin letters never appear except when a word streams by.
const NOISE_GLYPHS = "01ｱｶｻﾀﾅﾊﾏﾔﾗﾜｷｸｹｺｦﾉ<>[]{}=/\\+*01ﾂﾃﾄﾆﾇﾂ01";
const GLYPHS = NOISE_GLYPHS + "abcdefghijklmnopqrstuvwxyz";
const NOISE = NOISE_GLYPHS.length;
// Words that occasionally stream through a column (lowercase alphabet only).
const WORDS = ["pavle", "react", "deploy", "commit", "build", "typescript"];
const WORD_GLYPHS = WORDS.map((w) => [...w].map((ch) => GLYPHS.indexOf(ch)));
const FONT_SIZE = 15; // px (CSS)
// Per-column trail lengths, quantized so the draw loop can still batch
// globalAlpha per (tier × length-class × step) instead of per glyph.
const LEN_OPTS = [9, 13, 16, 22];
const FPS = 1000 / 30;
const BASE_ALPHA = 0.7; // global dimmer — the rain carries the page's ambient colour now
const BLUR_PX = 4; // baked into the glyph atlas — melts glyphs into soft light streaks (CSS px)
const HOLE = 0xffff; // grid sentinel: a cell that spawned dark (never drawn)

// Depth tiers, far → near. Far columns dominate the census so the bright near
// plane stays an accent, not a curtain.
const TIER_SCALE = [0.65, 0.85, 1.2];
const TIER_ALPHA = [0.6, 0.82, 1];
const TIER_SPEED = [0.55, 0.8, 1.15];

// Internal render scale: the layout stays in CSS px, but the canvas backing
// store (and the atlas) live at half size and the browser stretches it back up.
const RES = 0.5;
const STEP = FONT_SIZE * RES; // one grid cell, in device px
// Sprites need room for the baked blur to bleed (~2.5σ of the scaled blur).
const PAD = Math.ceil(BLUR_PX * RES * 2.5);
const CELL = Math.ceil(FONT_SIZE * RES + PAD * 2);
const FONT = `${FONT_SIZE * RES}px ui-monospace, Menlo, monospace`;
// Per-tier blit geometry: dest size and the offset that keeps a scaled sprite
// centred on its grid cell (folding in the atlas padding).
const TIER_CELL = TIER_SCALE.map((s) => CELL * s);
const TIER_OFF = TIER_SCALE.map((s) => (STEP * (1 - s)) / 2 - PAD * s);

const rand = (n: number) => Math.floor(Math.random() * n);
// 45% far / 35% mid / 20% near.
const randTier = () => {
  const r = Math.random();
  return r < 0.45 ? 0 : r < 0.8 ? 1 : 2;
};

// Glyph atlas: every glyph pre-drawn at full alpha, blurred once here instead
// of per frame (at the render scale, so the baked blur matches BLUR_PX after
// the upscale). Row 0 = white-hot head (the trail looks EMITTED by it), row 1
// = green trail — both at the full bokeh blur. Row 2 = word letters: accent
// green at a much lighter blur, so a streaming word is the one IN-FOCUS thing
// against the out-of-focus rain.
// Returns null where ctx.filter is unsupported (the caller then falls back to
// sharp fillText under the old CSS element blur).
const ROW_HEAD = 0;
const ROW_TRAIL = 1;
const ROW_WORD = 2;
const WORD_BLUR_PX = 1.25;

function buildAtlas(): HTMLCanvasElement | null {
  const atlas = document.createElement("canvas");
  atlas.width = GLYPHS.length * CELL;
  atlas.height = CELL * 3;
  const ctx = atlas.getContext("2d");
  if (!ctx || !("filter" in ctx)) return null;
  ctx.font = FONT;
  ctx.textBaseline = "top";
  for (let row = 0; row < 3; row++) {
    const blur = row === ROW_WORD ? WORD_BLUR_PX : BLUR_PX;
    ctx.filter = `blur(${blur * RES}px)`;
    ctx.fillStyle = `rgb(${row === ROW_HEAD ? HOT : row === ROW_WORD ? HEAD : TRAIL})`;
    for (let i = 0; i < GLYPHS.length; i++) {
      ctx.fillText(GLYPHS[i], i * CELL + PAD, row * CELL + PAD);
    }
  }
  return atlas;
}

function MatrixRain({ sectionIndex = 0 }: { sectionIndex?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surgeRef = useRef(0); // 0→1 burst on section change, decays each frame
  const firstRef = useRef(true);

  // Section change → surge (skip the initial mount so it doesn't fire on load).
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    surgeRef.current = 1;
  }, [sectionIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const atlas = buildAtlas();
    // No ctx.filter support (old Safari): draw sharp and blur the element the
    // old way. Everyone else gets pre-blurred sprites and no CSS filter.
    canvas.style.filter = atlas ? "" : `blur(${BLUR_PX}px)`;

    let dw = 0; // canvas backing size, device px (RES × CSS px)
    let dh = 0;
    let cols = 0;
    let rows = 0;
    let heads = new Float32Array(0); // head row per column (float)
    let speeds = new Float32Array(0); // rows/sec per column
    let grid = new Uint16Array(0); // glyph index per cell [col * rows + row]
    let tiers = new Uint8Array(0); // depth tier per column (0 far … 2 near)
    let lens = new Uint8Array(0); // trail length CLASS per column (LEN_OPTS idx)
    let stalls = new Float32Array(0); // seconds a column stays frozen mid-fall
    let wordAt = new Int16Array(0); // word start row per column (-1 = none)
    let colWords: (number[] | null)[] = []; // glyph indices (set iff wordAt >= 0)

    // A command typed in the Terminal, queued to stream down the next few
    // resetting columns (see the "pt:rain-cmd" listener below).
    let inject: { glyphs: number[]; left: number } | null = null;

    // Re-roll a column for a fresh fall: new depth plane, speed and trail
    // length matched to it, sometimes a pause before falling again (so the
    // density breathes), and a rare chance to carry a word — words ride the
    // near planes with the longest trails so they can actually be read.
    const resetCol = (c: number) => {
      heads[c] = -rand(10);
      tiers[c] = randTier();
      lens[c] = rand(LEN_OPTS.length);
      stalls[c] = Math.random() < 0.5 ? Math.random() * 2.2 : 0;
      wordAt[c] = -1;
      colWords[c] = null;
      let glyphs: number[] | null = null;
      if (inject) {
        glyphs = inject.glyphs;
        tiers[c] = 2; // typed commands stream on the near plane, readable
        stalls[c] = 0; // and immediately — it's a response, not weather
        if (--inject.left <= 0) inject = null;
      } else if (tiers[c] > 0 && Math.random() < 0.06) {
        glyphs = WORD_GLYPHS[rand(WORDS.length)];
      }
      if (glyphs && rows > glyphs.length + 12) {
        colWords[c] = glyphs;
        wordAt[c] = 3 + rand(rows - glyphs.length - 8);
        lens[c] = LEN_OPTS.length - 1; // longest trail — keep the word lit
      }
      speeds[c] = (6 + Math.random() * 10) * TIER_SPEED[tiers[c]];
    };

    const setup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dw = Math.ceil(w * RES);
      dh = Math.ceil(h * RES);
      canvas.width = dw;
      canvas.height = dh;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.textBaseline = "top";
      ctx.font = FONT;
      cols = Math.ceil(w / FONT_SIZE);
      rows = Math.ceil(h / FONT_SIZE) + 2;
      heads = new Float32Array(cols);
      speeds = new Float32Array(cols);
      grid = new Uint16Array(cols * rows);
      tiers = new Uint8Array(cols);
      lens = new Uint8Array(cols);
      stalls = new Float32Array(cols);
      wordAt = new Int16Array(cols);
      colWords = new Array(cols).fill(null);
      for (let c = 0; c < cols; c++) {
        resetCol(c);
        heads[c] = -rand(rows); // stagger starts above the top
      }
      for (let i = 0; i < grid.length; i++) grid[i] = rand(NOISE);
    };
    setup();

    // One sprite blit. With the atlas the blur is already in the pixels and
    // the tier scales the sprite (smaller blur = farther plane); the fallback
    // draws sharp unscaled text (the element's CSS blur softens it instead).
    const blit = (
      glyphIdx: number,
      atlasRow: number,
      x: number,
      y: number,
      t: number
    ) => {
      if (atlas) {
        ctx.drawImage(
          atlas,
          glyphIdx * CELL,
          atlasRow * CELL,
          CELL,
          CELL,
          x + TIER_OFF[t],
          y + TIER_OFF[t],
          TIER_CELL[t],
          TIER_CELL[t]
        );
      } else {
        ctx.fillStyle = `rgb(${
          atlasRow === ROW_HEAD ? HOT : atlasRow === ROW_WORD ? HEAD : TRAIL
        })`;
        ctx.fillText(GLYPHS[glyphIdx], x, y);
      }
    };

    // Is this cell inside the column's streaming word?
    const inWord = (c: number, row: number) =>
      wordAt[c] >= 0 &&
      row >= wordAt[c] &&
      row < wordAt[c] + (colWords[c] as number[]).length;

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, dw, dh);
      const surge = surgeRef.current;
      const speedMul = 1 + surge * 2.2;
      // Painter's order: far plane first so near columns pass in front of it.
      // Alpha is shared per (tier, length class, trail step), so globalAlpha
      // is set a few hundred times per frame instead of per glyph.
      for (let t = 0; t < 3; t++) {
        for (let li = 0; li < LEN_OPTS.length; li++) {
          const len = LEN_OPTS[li];
          for (let k = 0; k < len; k++) {
            if (k === 0) {
              ctx.globalAlpha = Math.min(
                (0.85 + 0.15 * surge) * BASE_ALPHA * TIER_ALPHA[t],
                0.95
              );
            } else {
              const fade = 1 - k / len;
              ctx.globalAlpha =
                fade * fade * (0.55 + 0.3 * surge) * BASE_ALPHA * TIER_ALPHA[t];
            }
            const groupAlpha = ctx.globalAlpha;
            for (let c = 0; c < cols; c++) {
              if (tiers[c] !== t || lens[c] !== li) continue;
              const row = Math.floor(heads[c]) - k;
              if (row < 0 || row >= rows) continue;
              const g = grid[c * rows + row];
              if (g === HOLE) continue; // a glitched-dark cell
              if (k > 0 && inWord(c, row)) {
                // Word letters use the sharp in-focus atlas row and an alpha
                // floor, so the word stays readable while the noise around it
                // fades down the tail.
                ctx.globalAlpha = Math.max(
                  groupAlpha,
                  0.5 * BASE_ALPHA * TIER_ALPHA[t]
                );
                blit(g, ROW_WORD, c * STEP, row * STEP, t);
                ctx.globalAlpha = groupAlpha;
              } else {
                blit(
                  g,
                  k === 0 ? ROW_HEAD : ROW_TRAIL,
                  c * STEP,
                  row * STEP,
                  t
                );
              }
            }
          }
        }
      }
      ctx.globalAlpha = 1;
      for (let c = 0; c < cols; c++) {
        // A stalled column holds its frame — a hiccup in the signal.
        if (stalls[c] > 0) {
          stalls[c] -= dt;
          continue;
        }
        const prev = Math.floor(heads[c]);
        heads[c] += speeds[c] * speedMul * dt;
        const cur = Math.floor(heads[c]);
        // Write every freshly entered row: a word letter inside the word
        // band, otherwise noise with a small chance of spawning dark.
        for (let r = prev + 1; r <= cur; r++) {
          if (r < 0 || r >= rows) continue;
          grid[c * rows + r] = inWord(c, r)
            ? (colWords[c] as number[])[r - wordAt[c]]
            : Math.random() < 0.06
              ? HOLE
              : rand(NOISE);
        }
        // The classic head flicker (never on word letters or holes).
        if (
          cur >= 0 &&
          cur < rows &&
          Math.random() < 0.4 &&
          !inWord(c, cur) &&
          grid[c * rows + cur] !== HOLE
        ) {
          grid[c * rows + cur] = rand(NOISE);
        }
        // Rare mid-fall stall (suppressed during a surge — surges are urgent).
        if (surge < 0.1 && Math.random() < 0.003) {
          stalls[c] = 0.12 + Math.random() * 0.4;
        }
        // Reset once the whole trail has fallen past the bottom.
        if ((heads[c] - LEN_OPTS[lens[c]]) * STEP > dh) resetCol(c);
      }
      surgeRef.current = surge < 0.002 ? 0 : surge * 0.94; // ~0.5s decay
    };

    // Reduced motion: one FROZEN frame of the same rain — full trails at the
    // animated alphas, just never moving. (The old version drew a single dim
    // glyph per column, which read as "the background is broken" on Windows
    // desktops where the OS animation toggle flips this media query.)
    const staticFrame = () => {
      ctx.clearRect(0, 0, dw, dh);
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.25) continue; // leave gaps so the frame breathes
        const t = tiers[c];
        const len = LEN_OPTS[lens[c]];
        const head = len + rand(Math.max(rows - len, 1));
        for (let k = 0; k < len; k++) {
          const row = head - k;
          if (row < 0 || row >= rows) continue;
          const g = grid[c * rows + row];
          if (g === HOLE) continue;
          const fade = 1 - k / len;
          ctx.globalAlpha =
            (k === 0 ? 0.85 : fade * fade * 0.55) *
            BASE_ALPHA *
            TIER_ALPHA[t];
          blit(g, k === 0 ? ROW_HEAD : ROW_TRAIL, c * STEP, row * STEP, t);
        }
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!last) last = t;
      const elapsed = t - last;
      if (elapsed < FPS) return;
      last = t;
      draw(Math.min(elapsed, 100) / 1000); // seconds; clamp tab-switch jumps
    };

    const onResize = () => {
      setup();
      if (reduce) staticFrame();
    };
    // A command typed in the Terminal streams down the rain: its glyphs are
    // queued for the next few column resets (plus a few columns re-rolled on
    // the spot so the response is immediate) and the rain surges briefly —
    // the background visibly reacts to input, like the deck flips do.
    const onCmd = (e: Event) => {
      if (reduce) return;
      const text = String((e as CustomEvent).detail ?? "").toLowerCase();
      const glyphs: number[] = [];
      for (const ch of text) {
        const i = GLYPHS.indexOf(ch);
        if (i >= 0) glyphs.push(i);
        if (glyphs.length >= 12) break;
      }
      if (glyphs.length < 2 || cols === 0) return;
      inject = { glyphs, left: 3 };
      for (let n = 0; n < 3 && inject; n++) resetCol(rand(cols));
      surgeRef.current = Math.max(surgeRef.current, 0.6);
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pt:rain-cmd", onCmd);
    if (reduce) {
      staticFrame();
    } else {
      document.addEventListener("visibilitychange", onVisibility);
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pt:rain-cmd", onCmd);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: -8 }}
    />
  );
}

export default memo(MatrixRain);
