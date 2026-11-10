"use client";

import { LuMoon, LuSun } from "react-icons/lu";

/* Flips light/dark and remembers the choice; layout.tsx reads it back before
   first paint. No React state: the `dark:` variant in globals.css already
   knows the effective theme, so CSS picks the icon and server and client
   markup always match.

   The switch is a fade, the page and the film on one clock: the statue
   turns to the other stone where he stands (FilmBackdrop.tsx) while the
   colour tokens glide from one theme to the other. This script moves
   them, a frame at a time, as inline values on <html>: a CSS transition
   of the tokens did it in Chromium, but Safari paints the end values at
   once, and the pills and sheets stood as dark frames on the light page
   (globals.css, .theme-fade). Under reduced motion the theme flips at
   once. A circle opening the new theme from the button (View
   Transitions, after dyeansee's Circular Theme Reveal on 21st.dev) ran
   here from 2026-11-09 to 11-10 and was dropped: its edge crossing the
   chat read as a line. */
const FADE_MS = 1400; // --theme-fade-time in globals.css

// Every token the themes set differently (globals.css, :root and its
// dark twin). A new one goes here too, or it jumps at the click.
const COLOURS = [
  "--bg",
  "--surface",
  "--plate",
  "--ink",
  "--body",
  "--muted",
  "--faint",
  "--line",
  "--line-strong",
  "--send",
  "--send-hover",
  "--film-top",
  "--film-bottom",
];
const NUMBERS = ["--dark"];

type Rgba = [number, number, number, number];

// A token reads back as it was written, and the build's minifier may
// rewrite it (#ffffff becomes #fff, and --bg alone jumped while the rest
// faded); a fade cut short leaves rgb() inline. A canvas reads any of
// them back as #rrggbb, or rgba() when it is see-through.
let pen: CanvasRenderingContext2D | null = null;
const parse = (value: string): Rgba | null => {
  pen ??= document.createElement("canvas").getContext("2d");
  if (!pen || !value.trim()) return null;
  pen.fillStyle = "#000";
  pen.fillStyle = value.trim();
  const v = String(pen.fillStyle);
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(v);
  if (!rgb) return null;
  const [r, g, b, a = 1] = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [r, g, b, a];
};

// cubic-bezier(0.45, 0, 0.55, 1), --theme-fade-ease, so the page keeps
// time with the film's own CSS fade.
const EASE = [0.45, 0, 0.55, 1] as const;
const ease = (t: number) => {
  const [x1, y1, x2, y2] = EASE;
  const at = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (at(x1, x2, mid) < t) lo = mid;
    else hi = mid;
  }
  return at(y1, y2, (lo + hi) / 2);
};

let frame = 0;

function fadeTo(root: HTMLElement, apply: () => void) {
  const style = root.style;
  const read = () => {
    const computed = getComputedStyle(root);
    return [...COLOURS, ...NUMBERS].map((name) => computed.getPropertyValue(name));
  };
  // Where the page is now: the old theme, or a fade cut short by a
  // second click, which carries on from there.
  const from = read();
  cancelAnimationFrame(frame);
  [...COLOURS, ...NUMBERS, "--line-show"].forEach((name) => style.removeProperty(name));
  apply();
  const to = read();

  const colours = COLOURS.map((name, i) => [name, parse(from[i]), parse(to[i])] as const);
  const numbers = NUMBERS.map(
    (name, i) => [name, Number(from[COLOURS.length + i]), Number(to[COLOURS.length + i])] as const,
  );
  const paint = (e: number) => {
    for (const [name, a, b] of colours) {
      if (!a || !b) continue;
      const [r, g, bl, al] = a.map((c, j) => c + (b[j] - c) * e);
      style.setProperty(name, `rgb(${r} ${g} ${bl} / ${al})`);
    }
    for (const [name, a, b] of numbers) style.setProperty(name, String(a + (b - a) * e));
    style.setProperty("--line-show", `${Math.abs(1 - 2 * e) * 100}%`);
  };

  root.classList.add("theme-fade");
  paint(0); // before the browser paints the new theme
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / FADE_MS);
    if (t < 1) {
      paint(ease(t));
      frame = requestAnimationFrame(step);
      return;
    }
    // Done: the stylesheet's values for the new theme take over.
    [...COLOURS, ...NUMBERS, "--line-show"].forEach((name) => style.removeProperty(name));
    root.classList.remove("theme-fade");
  };
  frame = requestAnimationFrame(step);
}

export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Storage blocked (private mode): the choice lasts for this page view.
      }
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) apply();
    else fadeTo(root, apply);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark"
      className="grid size-10 place-items-center rounded-full border border-line bg-bg/70 text-ink backdrop-blur transition-colors hover:bg-surface"
    >
      <LuMoon aria-hidden className="size-[18px] dark:hidden" />
      <LuSun aria-hidden className="hidden size-[18px] dark:block" />
    </button>
  );
}
