import { Easing, interpolate } from "remotion";

// The site's entrance curve (`rise` in globals.css), a longer tail, and an
// ease in and out for anything that travels.
export const rise = Easing.bezier(0.22, 1, 0.36, 1);
export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const linear = (t: number) => t;

/** 0 to 1 over `dur` frames from `from`, clamped. */
export const p = (
  frame: number,
  from: number,
  dur: number,
  easing: (t: number) => number = rise,
) =>
  interpolate(frame, [from, from + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** A number in [0, 1) from an integer: the same on every render. */
export const hash = (n: number) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

export type Pt = { x: number; y: number };
/** Where the pointer is at frame `f`; `bend` bows the way there. */
export type Key = { f: number; x: number; y: number; bend?: number };

/* A pointer path through keyframes: eased between each pair, bowed a little
   to one side so it never travels like a ruler. Before the first key it is
   nowhere (null), after the last it rests. */
export const track =
  (keys: Key[]) =>
  (f: number): Pt | null => {
    if (f < keys[0].f) return null;
    const last = keys[keys.length - 1];
    if (f >= last.f) return { x: last.x, y: last.y };
    let i = 0;
    while (f >= keys[i + 1].f) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const t = inOut((f - a.f) / (b.f - a.f));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const bow = Math.sin(Math.PI * t) * (b.bend ?? 0.08);
    return { x: a.x + dx * t - dy * bow, y: a.y + dy * t + dx * bow };
  };

/** How much of `text` has been typed by `frame`: uneven, like a hand. */
export const typed = (text: string, frame: number, start: number, perChar = 5) => {
  let at = start;
  let n = 0;
  while (n < text.length) {
    at += perChar * (0.6 + 0.9 * hash(n * 31 + text.length));
    if (text[n] === " ") at += perChar * 0.4;
    if (at > frame) break;
    n++;
  }
  return text.slice(0, n);
};
/** The frame at which `typed` has finished. */
export const typedEnd = (text: string, start: number, perChar = 5) => {
  let at = start;
  for (let n = 0; n < text.length; n++) {
    at += perChar * (0.6 + 0.9 * hash(n * 31 + text.length));
    if (text[n] === " ") at += perChar * 0.4;
  }
  return Math.ceil(at);
};
