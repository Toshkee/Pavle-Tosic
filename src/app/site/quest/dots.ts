/* The dot world of Toshkee's Quest, after Clawd's Quest on claude.dev: no
   images, every hill, cloud, tree and the ground is a field of grey dots
   on a fixed world grid (S px apart), so scrolling the camera moves the
   dots and never makes them shimmer. A dot's size and tone come from a
   hash of its grid cell, which is what gives the field its texture. Each
   colour is drawn as nine Path2D batches (three radii, three tones), one
   fill each: about 10,000 dots at 1440x800 in well under a frame. The warm
   light of the scenery (the low sun on the clouds and the ridge, autumn
   trees, flowers, ore) is coral too, but in the dimmer `ember` tones: the
   full coral stays for what hurts. */

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
  private tones: number[];

  constructor(rgb: string, tones = TONES) {
    this.rgb = rgb;
    this.tones = tones;
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
      ctx.fillStyle = `rgba(${this.rgb},${this.tones[i % 3]})`;
      ctx.fill(this.paths[i]);
      this.paths[i] = new Path2D();
    }
  }
}

export type Pit = { x: number; w: number };
/* A ledge in the air: top is its surface, an absolute y. */
export type Platform = { x: number; w: number; top: number };

/* The sun, or the moon on the night mission, in screen px. */
export type Orb = { x: number; y: number; r: number };

export type Scene = {
  w: number;
  h: number;
  groundY: number;
  cam: number;
  t: number;
  night: boolean;
  reduced: boolean;
  orb: Orb;
};

/* Stars: a sparse pick of sky cells, twinkling, thick on the night
   mission and a few by day (the sky is dark either way: call it dusk).
   One in eight burns warm. None in front of the sun or the moon. */
export function drawStars(d: Dots, ember: Dots, s: Scene): void {
  const p = 0.1;
  const density = s.night ? 0.014 : 0.005;
  const top = Math.floor((s.groundY - 260) / S);
  const { orb } = s;
  for (let sx = -S; sx < s.w + S; sx += S) {
    const ix = Math.round((sx + s.cam * p) / S);
    const x = ix * S - s.cam * p;
    for (let iy = 1; iy < top; iy++) {
      const h = hash(ix, iy);
      if (h > density) continue;
      const y = iy * S;
      if ((x - orb.x) ** 2 + (y - orb.y) ** 2 < (orb.r + 14) ** 2) continue;
      const tw = s.reduced ? 0.6 : 0.5 + 0.4 * Math.sin(s.t * 1.6 + h * 400);
      if (h < density / 8) ember.add(x, y, 1.6, tw + 0.3);
      else d.add(x, y, 0.9 + h * 30, s.night ? tw : tw * 0.75);
    }
  }
}

/* Clouds: three overlapping ellipses per cloud, dense along the rim and
   sparse inside, two clouds every 1,400 world px, drifting east. By day
   the low sun lights their undersides, the ones near it most. */
export function drawClouds(d: Dots, ember: Dots, s: Scene): void {
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
      blob(d, ember, s, cx - s.cam * p, cy, rx, ry, seed);
    }
  }
}

function blob(
  d: Dots,
  ember: Dots,
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
  const warmth = s.night ? 0 : 0.3 + 0.6 * Math.max(0, 1 - Math.abs(cx - s.orb.x) / s.w);
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
      if (h >= prob) continue;
      const lit = inside < 0.3 && y > cy + ry * 0.2 && hash(seed, Math.round(x / S)) < warmth;
      if (lit) ember.add(x, y, 1.6, 0.85);
      else d.add(x, y, 1 + h * 1.4, inside < 0.3 ? 0.6 : 0.4);
    }
  }
}

// How fast each range of hills scrolls against the ground.
const HILL_P = [0.5, 0.75] as const;

export function hillTop(wx: number, groundY: number, layer: 0 | 1): number {
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

/* The skyline at screen x: the higher of the two ranges there. Whatever
   is below it is behind the hills (the sun going down, a rocket on its
   pad). */
export function ridge(x: number, s: Scene): number {
  return Math.min(
    hillTop(x + s.cam * HILL_P[0], s.groundY, 0),
    hillTop(x + s.cam * HILL_P[1], s.groundY, 1),
  );
}

/* Two ranges of hills: a dense band along the ridge, a sparse fill below
   it, the far one lighter and slower. By day the skyline catches the sun
   going down behind it, warmest right under it. */
export function drawHills(d: Dots, ember: Dots, s: Scene, layer: 0 | 1): void {
  const p = HILL_P[layer];
  const tone = layer === 0 ? 0.35 : 0.5;
  const reach = s.orb.r * 3.5;
  for (let sx = -S; sx < s.w + S; sx += S) {
    const ix = Math.round((sx + s.cam * p) / S);
    const x = ix * S - s.cam * p;
    const top = hillTop(ix * S, s.groundY, layer);
    const iy0 = Math.ceil(top / S);
    const iy1 = Math.floor((s.groundY - 6) / S);
    const skyline = top <= ridge(x, s) + 1;
    const lit = skyline && !s.night ? Math.max(0, 1 - Math.abs(x - s.orb.x) / reach) : 0;
    for (let iy = iy0; iy <= iy1; iy++) {
      const y = iy * S;
      const depth = y - top;
      const h = hash(ix + layer * 1000, iy);
      const prob = depth < 20 ? 0.9 : 0.2;
      if (h >= prob) continue;
      if (depth < 2 * S && hash(ix + 5000, iy) < (depth < S ? lit : lit * 0.5)) {
        ember.add(x, y, 1.6, depth < S ? 0.85 : 0.55);
      } else d.add(x, y, 1 + h * 1.5, depth < 20 ? tone + 0.2 : tone);
    }
  }
}

/* Trees stand on the ground among the near hills, one every 520 px or so,
   a two-dot trunk under a round crown, a pine, or an autumn crown in ember
   that lets a leaf go now and then. A bush between them, some with
   berries. */
export function drawTrees(d: Dots, ember: Dots, s: Scene): void {
  const p = HILL_P[1];
  const period = 520;
  const first = Math.floor((s.cam * p - 200) / period);
  for (let k = first; k <= first + Math.ceil(s.w / period) + 1; k++) {
    drawBush(d, ember, s, k * period + 360, k);
    if (hash(k, 11) < 0.25) continue;
    const tx = Math.round((k * period + hash(k, 13) * 300) / S) * S;
    const x = tx - s.cam * p;
    const height = 70 + hash(k, 17) * 50;
    const r = 24 + hash(k, 19) * 14;
    const kind = hash(k, 23);
    const trunk = kind < 0.3 ? height * 0.4 : height;
    for (let y = s.groundY - 4; y > s.groundY - trunk; y -= S) {
      d.add(x, y, 1.6, 0.55);
      d.add(x + S, y, 1.4, 0.45);
    }
    if (kind < 0.3) {
      drawPine(d, x + S / 2, s.groundY - trunk + S, r, tx);
      continue;
    }
    const autumn = kind < 0.55;
    const cy = s.groundY - height - r * 0.6;
    const cx = x + S / 2;
    for (let dx = -r - S; dx <= r + S; dx += S) {
      for (let dy = -r - S; dy <= r + S; dy += S) {
        const q = (dx * dx + dy * dy) / (r * r);
        if (q > 1) continue;
        const h = hash(Math.round((tx + dx) / S), Math.round((cy + dy) / S));
        if (h >= (q > 0.6 ? 0.9 : autumn ? 0.7 : 0.5)) continue;
        if (autumn) ember.add(cx + dx, cy + dy, 1.4 + h, q > 0.6 ? 0.85 : 0.55);
        else d.add(cx + dx, cy + dy, 1 + h * 1.4, 0.55);
      }
    }
    if (!autumn || s.reduced) continue;
    // Three leaves on their way down, each on its own slow loop, drifting.
    for (let i = 0; i < 3; i++) {
      const q = (s.t * 0.11 + hash(k, 40 + i)) % 1;
      const top = cy + r * 0.5;
      const y = top + q * (s.groundY - 6 - top);
      const lx = cx + (hash(k, 50 + i) - 0.5) * r * 1.4 + Math.sin(q * 11 + i * 2) * 7 + q * 24;
      ember.add(lx, y, 1.1, q > 0.85 ? 0.3 : 0.85);
    }
  }
}

/* A pine: three stacked triangles, each wider than the one above, the
   bottom one resting on the trunk at y. */
function drawPine(d: Dots, cx: number, y: number, r: number, tx: number): void {
  const tall = r * 2.6;
  const th = tall * 0.45;
  for (let dy = 0; dy <= tall; dy += S) {
    const py = y - tall + dy;
    for (let dx = -r; dx <= r; dx += S) {
      let edge = -1;
      for (let i = 0; i < 3; i++) {
        const apex = y - tall + i * tall * 0.28;
        if (py < apex || py > apex + th) continue;
        const half = r * (0.45 + 0.27 * i) * ((py - apex) / th);
        if (Math.abs(dx) <= half) edge = Math.max(edge, half - Math.abs(dx) < S ? 1 : 0);
      }
      if (edge < 0) continue;
      const h = hash(Math.round((tx + dx) / S), Math.round(py / S) + 300);
      if (h < (edge ? 0.9 : 0.5)) d.add(cx + dx, py, 1 + h * 1.4, 0.55);
    }
  }
}

/* A low dome of dots at world px bx (in the near hills' layer), a few
   warm berries in some. Not every gap between trees gets one. */
function drawBush(d: Dots, ember: Dots, s: Scene, bx: number, k: number): void {
  if (hash(k, 30) > 0.6) return;
  const ix0 = Math.round((bx + hash(k, 31) * 110) / S);
  const x = ix0 * S - s.cam * HILL_P[1];
  if (x < -60 || x > s.w + 60) return;
  const rx = 16 + hash(k, 32) * 12;
  const ry = 10 + hash(k, 33) * 9;
  const berries = hash(k, 34) < 0.45;
  for (let i = -Math.floor(rx / S); i <= Math.floor(rx / S); i++) {
    for (let j = 0; j <= Math.floor(ry / S); j++) {
      const q = ((i * S) / rx) ** 2 + ((j * S) / ry) ** 2;
      if (q > 1) continue;
      const h = hash(ix0 + i, j + 70);
      const y = s.groundY - 4 - j * S;
      if (berries && h > 0.86) ember.add(x + i * S, y, 1.6, 0.85);
      else if (h < (q > 0.5 ? 0.9 : 0.55)) d.add(x + i * S, y, 1 + h, 0.55);
    }
  }
}

/* The ground: a bright top row, then rows of slightly jittered dots to the
   bottom of the screen, missing where there is a pit, with a column of
   warm dots down each pit wall (the `warn` batch), so a drop reads as a
   drop. Grass on top, now and then a flower or a stone, and deep down a
   seam of ore. */
export function drawGround(d: Dots, warn: Dots, ember: Dots, s: Scene, pits: Pit[]): void {
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
      else if (row > 3 && hash(ix + 31, iy) < 0.02) ember.add(x + jx, y + jy, 1.6, 0.85);
      else d.add(x + jx, y + jy, 1 + h * 1.2, 0.35 + h * 0.4);
    }
    const nearPit = pits.some((q) => wx > q.x - 40 && wx < q.x + q.w + 40);
    drawGrowth(d, ember, s, ix, x, nearPit);
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

/* What grows on one column of ground: a tuft of grass leaning in the
   wind, or a flower, or a stone. No flower or stone by a pit, where the
   coral wall has to read on its own. */
function drawGrowth(d: Dots, ember: Dots, s: Scene, ix: number, x: number, nearPit: boolean): void {
  const y = s.groundY;
  const lean = s.reduced ? 0 : Math.sin(s.t * 1.7 + ix * 0.45) * 1.5;
  // A tuft: a blade straight up and one fanning out to each side, close
  // enough together to read as grass against the dots of the hills.
  const g = hash(ix, 501);
  if (g < 0.2) {
    const tall = g < 0.08 ? 3 : 2;
    for (let k = 1; k <= tall; k++) d.add(x + (lean * (k - 1)) / 2, y - k * 5.5, 1.1, 0.85);
    d.add(x - 3, y - 5, 1.1, 0.85);
    d.add(x - 6 + lean / 2, y - 9, 1.1, 0.55);
    d.add(x + 3, y - 5, 1.1, 0.85);
    d.add(x + 6 + lean / 2, y - 9, 1.1, 0.55);
  }
  const f = hash(ix, 503);
  if (nearPit || f > 0.06) return;
  if (f < 0.04) {
    for (let k = 1; k <= 3; k++) d.add(x + (lean * k) / 4, y - k * 6, 1.1, 0.55);
    // A blossom: five dots close enough to run together into one bloom.
    const hx = x + lean;
    const hy = y - 25;
    ember.add(hx, hy, 2.2, 0.85);
    for (const [dx, dy] of [[-3, -1], [3, -1], [-2, -4], [2, -4]]) ember.add(hx + dx, hy + dy, 2.2, 0.85);
  } else {
    d.add(x - 3, y - 4, 1.6, 0.55);
    d.add(x + 3, y - 4, 1.6, 0.55);
    d.add(x, y - 8, 1.6, 0.85);
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
