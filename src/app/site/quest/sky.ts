import { Dots, S, hash, ridge, type Orb, type Scene } from "./dots";

/* The sky of Toshkee's Quest: a low sun striped like an old arcade sunset
   (a crescent moon on the night mission), and now and then something
   crossing it: a shooting star, a rocket going up from behind the hills
   with its smoke hanging in the air, a few birds by day. All of it dots,
   like the rest of the world; the warm parts are `ember`, with only a
   shooting star's head and a rocket's flame in the full coral, for a
   moment. Nothing passes under reduced motion. */

// How fast each thing scrolls against the ground: the sun barely moves.
const P_ORB = 0.03;
const P_ROCKET = 0.15;
const P_BIRDS = 0.35;
const PUFF_LIFE = 3;

/* The sun sits low, behind the far ridge, so the hills walk across it. A
   long Ultra run would carry it off to the west, so it comes round again
   from the east. */
export function orbAt(w: number, groundY: number, cam: number, night: boolean): Orb {
  if (night) {
    const r = Math.round(Math.min(56, Math.max(34, w * 0.038)));
    return { x: w * 0.74 - cam * P_ORB, y: Math.max(r + 24, groundY - 330), r };
  }
  const r = Math.round(Math.min(110, Math.max(56, w * 0.08)));
  const span = w + 2 * r + 160;
  const x = ((((w * 0.78 - cam * P_ORB + r + 80) % span) + span) % span) - r - 80;
  return { x, y: groundY - 165 - r * 0.6, r };
}

/* The sun, in rows of ember dots that start going missing a little above
   its middle, every third row and then every other one: the old sunset
   stripes. What is behind the hills stays behind them. At night a
   crescent moon in grey. */
export function drawOrb(d: Dots, ember: Dots, s: Scene): void {
  const { x: cx, y: cy, r } = s.orb;
  const n = Math.ceil(r / S);
  for (let j = -n; j <= n; j++) {
    const k = j + n;
    if (!s.night && j > -n * 0.3 && (j > n * 0.3 ? k % 2 === 0 : k % 3 === 0)) continue;
    const y = cy + j * S;
    for (let i = -n; i <= n; i++) {
      const q = ((i * i + j * j) * S * S) / (r * r);
      if (q > 1) continue;
      const x = cx + i * S;
      if (y > ridge(x, s) - 3) continue;
      const h = hash(i + 400, j + 400);
      if (!s.night) {
        ember.add(x, y, 1.7 + h * 0.6, j < 0 ? 0.85 : 0.55);
        continue;
      }
      // The moon: the disc minus a second one up and to the east.
      const bx = (x - cx - r * 0.55) / (r * 0.8);
      const by = (y - cy + r * 0.2) / (r * 0.8);
      if (bx * bx + by * by < 1) continue;
      d.add(x, y, 1.7 + h * 0.5, 0.85);
    }
  }
}

type Streak = { x: number; y: number; dx: number; dy: number; speed: number; age: number; life: number };
type Rocket = { x: number; y: number; speed: number; lean: number; tilt: number; puff: number };
type Puff = { x: number; y: number; age: number };
type Bird = { dx: number; dy: number; ph: number };
type Flock = { x: number; y: number; vx: number; birds: Bird[] };

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/* The rocket, nose up, as dot offsets 3 px apart: a body, a window
   (the one warm dot), fins. The nozzle is at (0, 9). */
const ROCKET: [number, number, boolean][] = [
  [0, -12, false],
  [-3, -9, false],
  [0, -9, false],
  [3, -9, false],
  [-3, -6, false],
  [0, -6, true],
  [3, -6, false],
  [-3, -3, false],
  [0, -3, false],
  [3, -3, false],
  [-3, 0, false],
  [0, 0, false],
  [3, 0, false],
  [-3, 3, false],
  [0, 3, false],
  [3, 3, false],
  [-6, 6, false],
  [-3, 6, false],
  [0, 6, false],
  [3, 6, false],
  [6, 6, false],
  [-6, 9, false],
  [6, 9, false],
];

export class Sky {
  private streaks: Streak[] = [];
  private rockets: Rocket[] = [];
  private puffs: Puff[] = [];
  private flocks: Flock[] = [];
  // Seconds to the next of each; the first rocket comes early.
  private wait = { streak: rand(1, 3), rocket: rand(4, 8), flock: rand(2, 6) };

  constructor(private reduced: boolean) {}

  update(dt: number, s: Scene): void {
    if (this.reduced) return;
    const wait = this.wait;
    if ((wait.streak -= dt) <= 0) {
      wait.streak = s.night ? rand(2, 5) : rand(5, 11);
      this.streaks.push(shootingStar(s));
    }
    if ((wait.rocket -= dt) <= 0) {
      wait.rocket = rand(14, 26);
      this.rockets.push(launch(s));
    }
    if ((wait.flock -= dt) <= 0) {
      wait.flock = rand(9, 17);
      if (!s.night) this.flocks.push(flock(s));
    }
    // No birds out at night: any still crossing when it falls are gone.
    if (s.night) this.flocks = [];
    for (const st of this.streaks) {
      st.age += dt;
      st.x += st.dx * st.speed * dt;
      st.y += st.dy * st.speed * dt;
    }
    this.streaks = this.streaks.filter((st) => st.age < st.life);
    // Slow off the pad, then faster and faster, pitching over as it goes.
    for (const r of this.rockets) {
      r.speed += 80 * dt;
      r.tilt = Math.min(Math.abs(r.lean), Math.abs(r.tilt) + 0.07 * dt) * Math.sign(r.lean);
      r.x += Math.sin(r.tilt) * r.speed * dt;
      r.y -= Math.cos(r.tilt) * r.speed * dt;
      if ((r.puff -= dt) <= 0) {
        r.puff = 0.035;
        this.puffs.push({ x: r.x - Math.sin(r.tilt) * 12, y: r.y + Math.cos(r.tilt) * 12, age: 0 });
      }
    }
    this.rockets = this.rockets.filter((r) => r.y > -80);
    for (const p of this.puffs) {
      p.age += dt;
      p.x += 7 * dt;
      p.y -= 2 * dt;
    }
    this.puffs = this.puffs.filter((p) => p.age < PUFF_LIFE);
    for (const f of this.flocks) f.x += f.vx * dt;
    this.flocks = this.flocks.filter((f) => {
      const x = f.x - s.cam * P_BIRDS;
      return x > -260 && x < s.w + 260;
    });
  }

  draw(d: Dots, ember: Dots, warn: Dots, s: Scene): void {
    for (const st of this.streaks) {
      const fade = Math.sin((st.age / st.life) * Math.PI);
      warn.add(st.x, st.y, 1.6, fade);
      for (let k = 1; k < 10; k++) {
        ember.add(st.x - st.dx * k * 6, st.y - st.dy * k * 6, 2.2 - k * 0.13, fade * (1 - k / 10));
      }
    }
    // The smoke spreads as it ages and thins out, hot for its first moment.
    for (const p of this.puffs) {
      const q = p.age / PUFF_LIFE;
      const x = p.x - s.cam * P_ROCKET;
      if (p.y > ridge(x, s) - 2) continue;
      const a = 0.8 * (1 - q);
      if (q < 0.04) ember.add(x, p.y, 1.6, 0.85);
      else d.add(x, p.y, 1.1 + q * 1.2, a);
      if (q < 0.12) continue;
      const spread = q * 12;
      d.add(x - spread, p.y + spread * 0.3, 1.1, a * 0.8);
      d.add(x + spread, p.y - spread * 0.2, 1.1, a * 0.8);
    }
    for (const r of this.rockets) {
      const cx = r.x - s.cam * P_ROCKET;
      const cos = Math.cos(r.tilt);
      const sin = Math.sin(r.tilt);
      const at = (dx: number, dy: number): [number, number] => [cx + dx * cos - dy * sin, r.y + dx * sin + dy * cos];
      for (const [dx, dy, warm] of ROCKET) {
        const [x, y] = at(dx, dy);
        if (y > ridge(x, s) - 2) continue;
        if (warm) ember.add(x, y, 1.6, 0.85);
        else d.add(x, y, 1.6, 0.85);
      }
      // The flame flickers: two to four dots out of the nozzle.
      const flame = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < flame; k++) {
        const [x, y] = at(0, 13 + k * 3.5);
        if (y > ridge(x, s) - 2) continue;
        if (k < 2) warn.add(x, y, k === 0 ? 2.2 : 1.6, k === 0 ? 0.85 : 0.55);
        else ember.add(x, y, 1.1, 0.85);
      }
    }
    for (const f of this.flocks) {
      const fx = f.x - s.cam * P_BIRDS;
      for (const b of f.birds) {
        const x = fx + b.dx;
        const y = f.y + b.dy + Math.sin(s.t * 1.3 + b.ph) * 3;
        const flap = Math.sin(s.t * 9 + b.ph * 5) * 2.4;
        d.add(x, y, 1.6, 0.55);
        d.add(x - 3.5, y - flap * 0.5, 1.1, 0.55);
        d.add(x + 3.5, y - flap * 0.5, 1.1, 0.55);
        d.add(x - 7, y - flap, 1.1, 0.4);
        d.add(x + 7, y - flap, 1.1, 0.4);
      }
    }
  }
}

/* Mostly falling west, high in the sky, gone in under a second. */
function shootingStar(s: Scene): Streak {
  const west = Math.random() < 0.7;
  const a = rand(0.22, 0.5);
  return {
    x: west ? rand(0.3, 1) * s.w : rand(0, 0.7) * s.w,
    y: rand(20, Math.max(60, (s.groundY - 260) * 0.7)),
    dx: (west ? -1 : 1) * Math.cos(a),
    dy: Math.sin(a),
    speed: rand(650, 950),
    age: 0,
    life: rand(0.5, 0.85),
  };
}

/* From somewhere behind the hills in view, leaning a little east or west. */
function launch(s: Scene): Rocket {
  const sx = rand(0.12, 0.88) * s.w;
  return {
    x: s.cam * P_ROCKET + sx,
    y: ridge(sx, s) + 24,
    speed: 25,
    lean: (Math.random() < 0.5 ? -1 : 1) * rand(0.2, 0.45),
    tilt: 0,
    puff: 0,
  };
}

/* Three to six birds in a loose V, coming in from one side. */
function flock(s: Scene): Flock {
  const east = Math.random() < 0.5;
  const birds: Bird[] = [];
  const n = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    birds.push({
      dx: (east ? -1 : 1) * i * rand(14, 20),
      dy: (i % 2 ? -1 : 1) * Math.ceil(i / 2) * rand(5, 8),
      ph: Math.random() * 6,
    });
  }
  return {
    x: s.cam * P_BIRDS + (east ? -100 : s.w + 100),
    y: rand(70, Math.max(90, s.groundY - 300)),
    vx: (east ? 1 : -1) * rand(45, 70),
    birds,
  };
}
