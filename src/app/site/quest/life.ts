import { Dots, S, hash, hillTop, type Scene } from "./dots";

/* What lives in the land beyond the trees: a windmill turning or a radio
   mast with a coral light blinking on top, here and there on the far
   ridge, and on the night mission fireflies over the grass. Dots, finer
   than the world grid where a thing is small and far. */

/* On the far ridge (it scrolls at half the ground's speed), one landmark
   in most of every 640 px, never two crowding; the seed puts a windmill
   in the first view. */
export function drawLandmarks(d: Dots, ember: Dots, warn: Dots, s: Scene): void {
  const p = 0.5;
  const period = 640;
  const first = Math.floor((s.cam * p - 200) / period);
  for (let k = first; k <= first + Math.ceil(s.w / period) + 1; k++) {
    const kind = hash(k, 74);
    if (kind < 0.3) continue;
    const wx = Math.round((k * period + hash(k, 63) * 300) / S) * S;
    const x = wx - s.cam * p;
    if (x < -80 || x > s.w + 80) continue;
    const base = hillTop(wx, s.groundY, 0) + 4;
    if (kind < 0.66) drawWindmill(d, s, x, base, k);
    else drawMast(d, ember, warn, s, x, base, k);
  }
}

/* A tapering tower and four sails turning slowly in the wind. */
function drawWindmill(d: Dots, s: Scene, x: number, base: number, k: number): void {
  const tall = 44 + hash(k, 61) * 16;
  for (let y = 0; y < tall; y += 5) {
    const half = 5 - (y / tall) * 3;
    d.add(x - half, base - y, 1.1, 0.55);
    d.add(x + half, base - y, 1.1, 0.55);
  }
  const hy = base - tall;
  const turn = (s.reduced ? 0 : s.t * 0.8) + hash(k, 62) * 6;
  for (let b = 0; b < 4; b++) {
    const a = turn + (b * Math.PI) / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    for (let i = 1; i <= 6; i++) {
      d.add(x + cos * i * 4.5, hy + sin * i * 4.5, 1.1, 0.85);
      // The sail: a second, fainter row along the outer part of the arm.
      if (i > 2) d.add(x + cos * i * 4.5 - sin * 3.5, hy + sin * i * 4.5 + cos * 3.5, 1.1, 0.4);
    }
  }
  d.add(x, hy, 1.6, 0.85);
}

/* A lattice mast with a warning light that blinks coral every couple of
   seconds (steady and dim under reduced motion). */
function drawMast(d: Dots, ember: Dots, warn: Dots, s: Scene, x: number, base: number, k: number): void {
  const tall = 70 + hash(k, 71) * 30;
  for (let y = 0, i = 0; y <= tall; y += 4, i++) {
    const half = 8 * (1 - y / tall) + 1;
    d.add(x - half, base - y, 1.1, 0.55);
    d.add(x + half, base - y, 1.1, 0.55);
    if (i % 3 === 1 && half > 2) d.add(x, base - y, 1.1, 0.4);
  }
  const on = !s.reduced && (s.t + hash(k, 72) * 3) % 2.4 < 0.3;
  if (on) warn.add(x, base - tall - 5, 2.2, 0.85);
  else ember.add(x, base - tall - 5, 1.6, 0.55);
}

/* Fireflies over the grass on the night mission, in front of the hills
   and behind Toshkee: one in most 110 px, wandering, glowing up and going
   dark again. */
export function drawFireflies(ember: Dots, warn: Dots, s: Scene): void {
  if (!s.night) return;
  const cell = 110;
  const move = s.reduced ? 0 : 1;
  const first = Math.floor((s.cam - 100) / cell);
  for (let k = first; k <= first + Math.ceil(s.w / cell) + 1; k++) {
    if (hash(k, 90) < 0.25) continue;
    const ph = hash(k, 91) * 50;
    const x = k * cell + hash(k, 92) * cell + Math.sin(s.t * 0.6 + ph) * 30 * move - s.cam;
    const y = s.groundY - 24 - hash(k, 93) * 110 + Math.sin(s.t * 0.9 + ph * 2) * 16 * move;
    const glow = s.reduced ? 0.5 : Math.sin(s.t * 1.4 + ph);
    if (glow < 0) continue;
    if (glow > 0.5) warn.add(x, y, 2.2, glow);
    else ember.add(x, y, 1.6, 0.85);
  }
}
