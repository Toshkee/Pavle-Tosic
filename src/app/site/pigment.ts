/* The pigment behind a row of the experience ledger: a wash of watercolour
   painted pixel by pixel on a small canvas (no WebGL, no images). Cut down
   from Pigment Experience Ledger by kedhareswer
   (https://21st.dev/@kedhareswer/components/pigment-experience-ledger):
   the preset palettes, the tenure-and-age painting and the dried residue
   are gone, what is left is one wash that blooms where the pointer comes in
   and drifts after it. */

// The canvas reaches this far above and below its row, so the wash fades out
// on its own instead of being cut by the row box.
export const BLEED = 64;
const MAX_BUFFER_W = 600;

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function hexToRgb(hex: string): number[] {
  const v = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Pigment colour at t: 0 is the thin edge, 1 the dense core. */
function rampAt(edge: number[], body: number[], core: number[], t: number) {
  const u = clamp(t, 0, 1);
  const a = u < 0.5 ? edge : body;
  const b = u < 0.5 ? body : core;
  const k = u < 0.5 ? u * 2 : (u - 0.5) * 2;
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
}

/** Deterministic 0..1 hash of an integer lattice point. */
function hash2(x: number, y: number, seed: number) {
  let h =
    (Math.imul(x | 0, 374761393) +
      Math.imul(y | 0, 668265263) +
      Math.imul(seed | 0, 2246822519)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth value noise, 0..1, stable for a given seed at any canvas size. */
function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

type Blob = { ox: number; oy: number; r: number; w: number; ph: number; sp: number };

export type Wash = {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  img: ImageData | null;
  noise: Float32Array;
  hue: Float32Array;
  low: Float32Array;
  grain: Float32Array;
  bw: number;
  bh: number;
  cssW: number;
  cssH: number;
  headH: number;
  /** The wordmark's box inside the row, which is where the wash rests. */
  nameTop: number;
  nameH: number;
  nameW: number;
  homeX: number;
  homeY: number;
  /** 0 bare, 1 fully bloomed; eased toward `target`. */
  level: number;
  target: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  pointer: boolean;
  lastActive: number;
  /** Edge, body, core, as rgb. */
  ramp: number[][];
  blobs: Blob[];
  seed: number;
  painted: boolean;
};

// Seven masses strung along a horizontal band, each with its own size,
// weight and slow drift.
function makeBlobs(seed: number): Blob[] {
  const r = (i: number) => hash2(i, 7, seed);
  return Array.from({ length: 7 }, (_, i) => ({
    ox: -1 + (2 * i) / 6 + (r(i) - 0.5) * 0.22,
    oy: (r(i + 20) - 0.5) * 0.9,
    r: 0.72 + r(i + 40) * 0.36 - Math.abs(i - 3) * 0.05,
    w: 0.8 + r(i + 60) * 0.45 + (i === 3 ? 0.25 : 0),
    ph: r(i + 80) * 6.28,
    sp: 0.18 + r(i + 100) * 0.34,
  }));
}

export function newWash(seed: number): Wash {
  return {
    canvas: null,
    ctx: null,
    img: null,
    noise: new Float32Array(0),
    hue: new Float32Array(0),
    low: new Float32Array(0),
    grain: new Float32Array(0),
    bw: 0,
    bh: 0,
    cssW: 0,
    cssH: 0,
    headH: 0,
    nameTop: 0,
    nameH: 0,
    nameW: 0,
    homeX: 0,
    homeY: 0,
    level: 0,
    target: 0,
    cx: 0,
    cy: 0,
    tx: 0,
    ty: 0,
    pointer: false,
    lastActive: 0,
    ramp: [],
    blobs: makeBlobs(seed),
    seed,
    painted: false,
  };
}

/** Where the wash rests when nothing points at it: centred on the wordmark. */
export const homeOf = (w: Wash): [number, number] => [
  w.homeX || w.cssW * 0.6,
  BLEED + (w.homeY || w.headH * 0.5),
];

// Size the pigment buffer to the row's header. Noise is hashed from buffer
// coordinates, so the paper texture stays put when the row resizes.
export function sizeWash(w: Wash, width: number, headH: number) {
  w.cssW = width;
  w.cssH = headH + BLEED * 2;
  w.headH = headH;
  if (!w.canvas) return;
  const scale = clamp(w.cssW / MAX_BUFFER_W, 1.5, 3);
  const bw = Math.max(8, Math.round(w.cssW / scale));
  const bh = Math.max(8, Math.round((w.cssH / w.cssW) * bw));
  if (bw === w.bw && bh === w.bh && w.img) return;
  w.bw = bw;
  w.bh = bh;
  w.canvas.width = bw;
  w.canvas.height = bh;
  w.ctx = w.canvas.getContext("2d");
  w.img = w.ctx ? w.ctx.createImageData(bw, bh) : null;
  const n = bw * bh;
  w.noise = new Float32Array(n);
  w.hue = new Float32Array(n);
  w.low = new Float32Array(n);
  w.grain = new Float32Array(n);
  const u = scale / 3; // the texture stays the same size in css px at any scale
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const i = y * bw + x;
      const X = x * u;
      const Y = y * u;
      w.noise[i] =
        0.55 * valueNoise(X / 11, Y / 8, w.seed) +
        0.3 * valueNoise(X / 4, Y / 4, w.seed + 11) +
        0.15 * valueNoise(X / 1.6, Y / 1.6, w.seed + 17);
      // A rotated, isotropic lattice: an axis-stretched one shows as scanlines.
      w.hue[i] = valueNoise((0.8 * X + 0.6 * Y) / 20, (0.8 * Y - 0.6 * X) / 20, w.seed + 31);
      w.low[i] = valueNoise(X / 40, Y / 40, w.seed + 41);
      w.grain[i] = hash2(x, y, w.seed + 23);
    }
  }
  w.painted = false;
}

export function paintWash(w: Wash, time: number, strength: number, dark: boolean) {
  const { ctx, img, ramp } = w;
  if (!ctx || !img || ramp.length < 3) return;
  const data = img.data;
  data.fill(0);
  if (w.level > 0.002) {
    const { bw, bh } = w;
    const sc = w.cssW / bw;
    const grow = 1 - Math.pow(1 - clamp(w.level, 0, 1), 3);
    // The masses spread across the wordmark and always overlap, so the wash
    // stays one body of pigment instead of splitting into islands.
    const span = clamp((w.nameW || w.cssW * 0.3) * 0.55, 60, 320) * (0.5 + 0.5 * grow);
    const R = clamp(w.headH * (w.cssW < 560 ? 0.95 : 1.12), 70, 200) * (0.55 + 0.45 * grow);
    const fade = smoothstep(0, 0.35, w.level) * strength;
    const tooth = 0.76; // paper tooth: how much the edge breaks up
    const [edge, body, core] = ramp;
    const n = w.blobs.length;
    const bx = new Float32Array(n);
    const by = new Float32Array(n);
    const br = new Float32Array(n);
    let x0 = bw;
    let x1 = 0;
    let y0 = bh;
    let y1 = 0;
    const SQ = 1.65; // vertical squash: the wash runs along the row
    for (let k = 0; k < n; k++) {
      const b = w.blobs[k];
      const px = w.cx + b.ox * span + Math.sin(time * b.sp + b.ph) * R * 0.12;
      const py = w.cy + b.oy * R * 0.4 + Math.cos(time * b.sp * 0.8 + b.ph) * R * 0.06;
      const rr = (b.r * R) / sc;
      bx[k] = px / sc;
      by[k] = py / sc;
      br[k] = rr * rr;
      x0 = Math.min(x0, bx[k] - rr);
      x1 = Math.max(x1, bx[k] + rr);
      y0 = Math.min(y0, by[k] - rr / SQ);
      y1 = Math.max(y1, by[k] + rr / SQ);
    }
    const xs = Math.max(0, Math.floor(x0));
    const xe = Math.min(bw - 1, Math.ceil(x1));
    const ys = Math.max(0, Math.floor(y0));
    const ye = Math.min(bh - 1, Math.ceil(y1));
    // The wash is held to the wordmark's band, so the small type around it
    // sits on plain surface. The envelope thins the field itself, so that
    // boundary gets the same ragged paper edge as the rest.
    const bandTop = w.nameH ? w.nameTop - w.nameH * 0.3 : 0;
    const bandBottom = w.nameH ? w.nameTop + w.nameH * 1.02 : w.headH - 6;
    const top = (BLEED + Math.max(0, bandTop)) / sc;
    const bottom = (BLEED + bandBottom) / sc;
    const feather = Math.min(36, (bandBottom - bandTop) * 0.4) / sc;
    const side = 28 / sc;
    for (let y = ys; y <= ye; y++) {
      const env =
        smoothstep(top, top + feather, y) * (1 - smoothstep(bottom - feather, bottom, y));
      if (env <= 0) continue;
      for (let x = xs; x <= xe; x++) {
        let f = 0;
        for (let k = 0; k < n; k++) {
          const dx = x - bx[k];
          const dy = (y - by[k]) * SQ;
          const d2 = dx * dx + dy * dy;
          if (d2 < br[k]) {
            const q = 1 - d2 / br[k];
            f += q * q * w.blobs[k].w;
          }
        }
        f *= env * smoothstep(0, side, x) * (1 - smoothstep(bw - 1 - side, bw - 1, x));
        if (f < 0.04) continue;
        const i = y * bw + x;
        // Paper tooth breaks the edge up; a slower noise varies how thick it is.
        const fe = f * (1 - tooth / 2 + tooth * w.noise[i]) + (w.low[i] - 0.5) * 0.24;
        // On a dark surface a soft fringe of warm colour at low alpha reads
        // as brown, so the edge is kept crisp there.
        const wash = dark ? smoothstep(0.2, 0.34, fe) : smoothstep(0.2, 0.6, fe);
        // Pigment collects at the drying edge: a denser, warmer tide line.
        const rim = smoothstep(0.2, 0.3, fe) * (1 - smoothstep(0.3, 0.5, fe));
        const depth = clamp(
          smoothstep(0.3, 1.55, fe) + (w.hue[i] - 0.5) * 0.6 + rim * 0.55,
          0,
          1,
        );
        const c = rampAt(edge, body, core, depth);
        const g = w.grain[i];
        const shade = 1 - rim * 0.07 + (g - 0.5) * 0.05;
        const a = (wash * (0.86 + 0.14 * depth) + rim * 0.1) * (0.9 + 0.1 * g) * fade;
        const j = i * 4;
        data[j] = c[0] * shade;
        data[j + 1] = c[1] * shade;
        data[j + 2] = c[2] * shade;
        data[j + 3] = a > 1 ? 255 : a * 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  w.painted = w.level > 0.002;
}
