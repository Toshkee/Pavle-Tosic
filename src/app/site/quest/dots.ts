/* The dot world of Toshkee's Quest, after Clawd's Quest on claude.dev: no
   images, every hill, cloud, tree and the ground is a field of grey dots
   on a fixed world grid (S px apart), so scrolling the camera moves the
   dots and never makes them shimmer. A dot's size and tone come from a
   hash of its grid cell, which is what gives the field its texture. The
   whole frame is drawn as nine Path2D batches (three radii, three tones),
   one fill each: about 8,000 dots at 1440x800 in well under a frame. */

export const S = 8;
const TAU = Math.PI * 2;

export function hash(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const RADII = [1.1, 1.6, 2.2];
const TONES = [0.3, 0.55, 0.85];

export class Dots {
  private paths: Path2D[] = [];
  private rgb: string;

  constructor(rgb: string) {
    this.rgb = rgb;
    for (let i = 0; i < 9; i++) this.paths.push(new Path2D());
  }

  /* r and a are free values; they land in the nearest bucket. */
  add(x: number, y: number, r: number, a: number): void {
    const ri = r < 1.35 ? 0 : r < 1.9 ? 1 : 2;
    const ai = a < 0.42 ? 0 : a < 0.7 ? 1 : 2;
    const path = this.paths[ri * 3 + ai];
    path.moveTo(x + RADII[ri], y);
    path.arc(x, y, RADII[ri], 0, TAU);
  }

  flush(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(${this.rgb},${TONES[i % 3]})`;
      ctx.fill(this.paths[i]);
      this.paths[i] = new Path2D();
    }
  }
}

export type Pit = { x: number; w: number };
/* A ledge in the air: top is its surface, an absolute y. */
export type Platform = { x: number; w: number; top: number };

export type Scene = {
  w: number;
  h: number;
  groundY: number;
  cam: number;
  t: number;
  night: boolean;
  reduced: boolean;
};

/* Stars, only at night: a sparse pick of sky cells, twinkling. */
export function drawStars(d: Dots, s: Scene): void {
  const p = 0.1;
  const top = Math.floor((s.groundY - 260) / S);
  for (let sx = -S; sx < s.w + S; sx += S) {
    const ix = Math.round((sx + s.cam * p) / S);
    const x = ix * S - s.cam * p;
    for (let iy = 1; iy < top; iy++) {
      const h = hash(ix, iy);
      if (h > 0.014) continue;
      const tw = s.reduced ? 0.6 : 0.5 + 0.4 * Math.sin(s.t * 1.6 + h * 400);
      d.add(x, iy * S, 0.9 + h * 30, tw);
    }
  }
}

/* Clouds: three overlapping ellipses per cloud, dense along the rim and
   sparse inside, two clouds every 1,400 world px, drifting east. */
export function drawClouds(d: Dots, s: Scene): void {
  const p = 0.3;
  const drift = s.reduced ? 0 : s.t * 7;
  const period = 1400;
  const first = Math.floor((s.cam * p - drift - 300) / period);
  for (let k = first; k <= first + Math.ceil(s.w / period) + 1; k++) {
    for (let c = 0; c < 2; c++) {
      const seed = k * 2 + c;
      const cx = k * period + c * 700 + hash(seed, 3) * 400 + drift;
      const cy = 50 + hash(seed, 5) * Math.max(60, s.groundY - 340);
      const rx = 55 + hash(seed, 7) * 60;
      const ry = 18 + hash(seed, 9) * 16;
      blob(d, s, cx - s.cam * p, cy, rx, ry, seed);
    }
  }
}

function blob(
  d: Dots,
  s: Scene,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
): void {
  const parts = [
    [0, 0, rx, ry],
    [-rx * 0.55, ry * 0.25, rx * 0.6, ry * 0.8],
    [rx * 0.5, ry * 0.2, rx * 0.65, ry * 0.85],
  ];
  const x0 = Math.floor((cx - rx * 1.3) / S) * S;
  const x1 = cx + rx * 1.3;
  const y0 = Math.floor((cy - ry * 1.4) / S) * S;
  const y1 = cy + ry * 1.4;
  for (let x = x0; x <= x1; x += S) {
    for (let y = y0; y <= y1; y += S) {
      let inside = 0;
      for (const [ox, oy, prx, pry] of parts) {
        const dx = (x - cx - ox) / prx;
        const dy = (y - cy - oy) / pry;
        const q = dx * dx + dy * dy;
        if (q < 1) inside = Math.max(inside, 1 - q);
      }
      if (inside === 0) continue;
      const h = hash(Math.round(x / S) + seed * 97, Math.round(y / S));
      const prob = inside < 0.3 ? 0.9 : 0.3;
      if (h < prob) d.add(x, y, 1 + h * 1.4, inside < 0.3 ? 0.6 : 0.4);
    }
  }
}

function hillTop(wx: number, groundY: number, layer: 0 | 1): number {
  if (layer === 0) {
    return (
      groundY -
      165 -
      60 * Math.sin(wx / 310) -
      35 * Math.sin(wx / 121 + 1.7) -
      18 * Math.sin(wx / 47 + 0.4)
    );
  }
  return (
    groundY -
    85 -
    50 * Math.sin(wx / 230 + 2) -
    30 * Math.sin(wx / 97 + 0.9) -
    12 * Math.sin(wx / 41)
  );
}

/* Two ranges of hills: a dense band along the ridge, a sparse fill below
   it, the far one lighter and slower. */
export function drawHills(d: Dots, s: Scene, layer: 0 | 1): void {
  const p = layer === 0 ? 0.5 : 0.75;
  const tone = layer === 0 ? 0.35 : 0.5;
  for (let sx = -S; sx < s.w + S; sx += S) {
    const ix = Math.round((sx + s.cam * p) / S);
    const x = ix * S - s.cam * p;
    const top = hillTop(ix * S, s.groundY, layer);
    const iy0 = Math.ceil(top / S);
    const iy1 = Math.floor((s.groundY - 6) / S);
    for (let iy = iy0; iy <= iy1; iy++) {
      const y = iy * S;
      const depth = y - top;
      const h = hash(ix + layer * 1000, iy);
      const prob = depth < 20 ? 0.9 : 0.2;
      if (h < prob) d.add(x, y, 1 + h * 1.5, depth < 20 ? tone + 0.2 : tone);
    }
  }
}

/* Trees stand on the ground among the near hills: a two-dot trunk and a
   round crown, one every 520 px or so. */
export function drawTrees(d: Dots, s: Scene): void {
  const p = 0.75;
  const period = 520;
  const first = Math.floor((s.cam * p - 200) / period);
  for (let k = first; k <= first + Math.ceil(s.w / period) + 1; k++) {
    if (hash(k, 11) < 0.25) continue;
    const tx = Math.round((k * period + hash(k, 13) * 300) / S) * S;
    const x = tx - s.cam * p;
    const height = 70 + hash(k, 17) * 50;
    const r = 24 + hash(k, 19) * 14;
    for (let y = s.groundY - 4; y > s.groundY - height; y -= S) {
      d.add(x, y, 1.6, 0.55);
      d.add(x + S, y, 1.4, 0.45);
    }
    const cy = s.groundY - height - r * 0.6;
    const cx = x + S / 2;
    for (let dx = -r - S; dx <= r + S; dx += S) {
      for (let dy = -r - S; dy <= r + S; dy += S) {
        const q = (dx * dx + dy * dy) / (r * r);
        if (q > 1) continue;
        const h = hash(Math.round((tx + dx) / S), Math.round((cy + dy) / S));
        if (h < (q > 0.6 ? 0.9 : 0.5)) d.add(cx + dx, cy + dy, 1 + h * 1.4, 0.55);
      }
    }
  }
}

/* The ground: a bright top row, then rows of slightly jittered dots to the
   bottom of the screen, missing where there is a pit, with a column of
   warm dots down each pit wall (the `warn` batch), so a drop reads as a
   drop. */
export function drawGround(d: Dots, warn: Dots, s: Scene, pits: Pit[]): void {
  const rows = Math.ceil((s.h - s.groundY) / S) + 1;
  for (let sx = -S; sx < s.w + S; sx += S) {
    const ix = Math.round((sx + s.cam) / S);
    const wx = ix * S;
    const x = wx - s.cam;
    const pit = pits.find((q) => wx >= q.x && wx <= q.x + q.w);
    if (pit) continue;
    for (let row = 0; row < rows; row++) {
      const iy = Math.round(s.groundY / S) + row;
      const h = hash(ix, iy);
      if (row > 0 && h > 0.92) continue;
      const jx = (hash(ix, iy + 1) - 0.5) * 2.5;
      const jy = row === 0 ? 0 : (hash(ix + 1, iy) - 0.5) * 2.5;
      const y = s.groundY + row * S;
      if (row === 0) d.add(x + jx, y, 1.9, 0.85);
      else d.add(x + jx, y + jy, 1 + h * 1.2, 0.35 + h * 0.4);
    }
  }
  for (const pit of pits) {
    for (const wx of [pit.x - 4, pit.x + pit.w + 4]) {
      const x = wx - s.cam;
      if (x < -S || x > s.w + S) continue;
      warn.add(x, s.groundY, 2.2, 0.9);
      for (let row = 1; row < rows; row++) {
        warn.add(x, s.groundY + row * S, 1.6, row < 4 ? 0.8 : 0.45);
      }
    }
  }
}

/* Ledges: a solid warm top row you can see from across the screen, two
   thinning grey rows under it. */
export function drawPlatforms(d: Dots, warn: Dots, s: Scene, platforms: Platform[]): void {
  for (const pl of platforms) {
    if (pl.x + pl.w < s.cam - S || pl.x > s.cam + s.w + S) continue;
    const iy = Math.round(pl.top / S);
    for (let wx = Math.ceil(pl.x / S) * S; wx <= pl.x + pl.w; wx += S) {
      const ix = wx / S;
      const x = wx - s.cam;
      warn.add(x, pl.top, 2.2, 0.95);
      warn.add(x + S / 2, pl.top, 1.4, 0.7);
      const h = hash(ix, iy + 1);
      if (h < 0.85) d.add(x + (h - 0.5) * 2, pl.top + S, 1.3, 0.5);
      const h2 = hash(ix + 7, iy + 2);
      if (h2 < 0.5) d.add(x, pl.top + 2 * S, 1 + h2, 0.35);
    }
  }
}
