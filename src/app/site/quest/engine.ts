import {
  Dots,
  drawClouds,
  drawGround,
  drawHills,
  drawPlatforms,
  drawStars,
  drawTrees,
  hash,
  type Pit,
  type Platform,
  type Scene,
} from "./dots";
import { layoutTitle, type TitleDot } from "./font";
import {
  CELL,
  CENTER,
  FEET,
  FLIP_FRAMES,
  HERO,
  HERO_SCALE,
  HERO_SHEET,
  LEAP_FRAME,
  type HeroAnim,
} from "./hero";
import { MISSIONS, ULTRA, type Mission } from "./missions";
import type { Sound } from "./sound";
import { BIG_BUG, BUG, PICKUPS, drawFrame, type PickupKind } from "./sprites";

/* The game itself: one canvas, a rAF loop, arcade physics (instant-ish
   velocity, coyote time, a jump that cuts short when the key is let go, a
   second jump in the air, one-way ledges), and a small phase machine. The
   chrome around it (chips, paper slips, buttons) is React: the engine
   only reports a QuestUi snapshot whenever it changes, so React never
   renders per frame. */

export type Phase = "title" | "intro" | "play" | "outro" | "paused" | "dead" | "end";
export type Mode = "title" | "quest" | "ultra";
export type Action = "left" | "right" | "sprint" | "jump" | "confirm" | "attack" | "roll";

export type QuestUi = {
  phase: Phase;
  mode: Mode;
  hearts: number;
  hud: { label: string; value: string } | null;
  slip: { text: string; sub: string } | null;
  toast: string | null;
  best: number;
  sound: boolean;
  touch: boolean;
};

/* What `window.__quest.state()` reports on `next dev`: enough for a script
   to play the game (see the testing note in CLAUDE.md). Not in production. */
export type QuestDebug = {
  phase: Phase;
  mode: Mode;
  x: number;
  y: number;
  vy: number;
  grounded: boolean;
  hearts: number;
  groundY: number;
  length: number;
  pits: Pit[];
  platforms: Platform[];
  pickups: { x: number; y: number }[];
  bugs: { x: number; big: boolean; hp: number }[];
  flag: number | null;
  goal: number | null;
};

declare global {
  interface Window {
    __quest?: { state(): QuestDebug };
  }
}

export type Quest = {
  resize(w: number, h: number, dpr: number): void;
  press(action: Action): void;
  release(action: Action): void;
  startQuest(): void;
  startUltra(): void;
  pause(): void;
  toTitle(): void;
  destroy(): void;
};

type Options = {
  sound: Sound;
  reduced: boolean;
  touch: boolean;
  onUi: (ui: QuestUi) => void;
};

type Pickup = { kind: PickupKind; x: number; y: number; taken: boolean };
type Bug = {
  x: number;
  // The beat it walks, and the hard bounds a chase may stretch it to:
  // never over a pit.
  min: number;
  max: number;
  lo: number;
  hi: number;
  dir: 1 | -1;
  speed: number;
  chase: boolean;
  big: boolean;
  hp: number;
};
type Flag = {
  x: number;
  y: number;
  stops: number[];
  stop: number;
  tween: { from: number; to: number; t: number } | null;
};
type Level = {
  length: number;
  pits: Pit[];
  platforms: Platform[];
  pickups: Pickup[];
  bugs: Bug[];
  flag: Flag | null;
  goal: number | null;
  count: number;
  generated: number;
};

const WALK = 240;
const RUN = 400;
// A full jump reaches 144 px, the second one 101 px more: enough for the
// low ledges with one, the high ones with two.
const JUMP = 740;
const JUMP2 = 620;
const GRAVITY = 1900;
const MAX_FALL = 1200;
const LEDGE_LOW = 110;
const LEDGE_HIGH = 205;
const ROLL_SPEED = 430;
const ROLL_TIME = 0.44;
const ATTACK_TIME = 0.5;
const ATTACK_REACH = 100;
// No bug within this of a pit's edge: a hit knocks him back about 110 px.
const PIT_ROOM = 150;
// The hero's body (not the sword) at 2x: 40 px wide, 116 px tall.
const HALF_W = 20;
const BODY_H = 116;
const START_X = 140;
// Things to pick up sit this far above the ground, or above a ledge.
const LOW = 56;
const ON_LEDGE = 50;
const BG = "#171717";
const DOT_RGB = "150,150,150";
// Clawd's coral: pit walls, ledge tops and the bugs, the things to mind.
const WARN_RGB = "217,119,87";
const ACCENT_RGB = "47,124,246";
const BEST_KEY = "quest.best";
const CONTINUE = "Press space to continue";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const easeOut = (q: number) => 1 - Math.pow(1 - q, 3);

/* A bug's size on screen and in collisions. */
const bugHalf = (b: Bug) => (b.big ? 32 : 20);
const bugHeight = (b: Bug) => (b.big ? 48 : 30);

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

/* Pits and bugs are in ascending order, so one pass moving right clears
   them all. */
function clearPits(L: Level, x: number, margin: number): number {
  for (const p of L.pits) {
    if (x > p.x - margin && x < p.x + p.w + margin) x = p.x + p.w + margin;
  }
  return x;
}

/* Somewhere to put a thing to pick up: not over a pit, and not inside a
   bug's beat, where taking it would mean taking a hit. */
function clearOf(L: Level, x: number): number {
  x = clearPits(L, x, 70);
  for (const b of L.bugs) {
    if (x > b.min - 60 && x < b.max + 60) x = clearPits(L, b.max + 60, 70);
  }
  return x;
}

function emptyLevel(): Level {
  return {
    length: 1e9,
    pits: [],
    platforms: [],
    pickups: [],
    bugs: [],
    flag: null,
    goal: null,
    count: 0,
    generated: 0,
  };
}

export function createQuest(canvas: HTMLCanvasElement, opts: Options): Quest {
  const ctx = canvas.getContext("2d")!;
  const { sound, reduced } = opts;
  const dots = new Dots(DOT_RGB);
  const warn = new Dots(WARN_RGB);
  const hero = new Image();
  hero.src = HERO_SHEET;

  let w = 1;
  let h = 1;
  let dpr = 1;
  let groundY = 1;
  let t = 0;
  let last = performance.now();
  let raf = 0;
  let cam = 0;

  let phase: Phase = "title";
  let mode: Mode = "title";
  let missionIx = 0;
  let mission: Mission = MISSIONS[0];
  let level = emptyLevel();
  let hearts = 3;
  let slips: string[] = [];
  let slipIx = 0;
  let slipSub = CONTINUE;
  let toast: string | null = null;
  let toastT = 0;
  let doneT: number | null = null;
  let deadT: number | null = null;
  let deathAnimT = 0;
  let titleT = 0;
  let leaveT: number | null = null;
  let title: TitleDot[] = [];
  // The two blue sparks either side of the second line of the title.
  let sparks = { left: 0, right: 0, y: 0 };
  let best = readBest();
  let lastUi = "";
  const held = new Set<Action>();

  const player = {
    x: START_X,
    y: 0,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1 as 1 | -1,
    animT: 0,
    inv: 0,
    hurtT: 0,
    rollT: 0,
    attackT: 0,
    swung: false,
    flipT: 0,
    jumps: 0,
    coyote: 0,
    buffer: 0,
    safeX: START_X,
  };

  /* ---------- state changes ---------- */

  function resetPlayer(x: number): void {
    Object.assign(player, {
      x,
      y: groundY,
      vx: 0,
      vy: 0,
      grounded: true,
      facing: 1,
      animT: 0,
      inv: 0,
      hurtT: 0,
      rollT: 0,
      attackT: 0,
      swung: false,
      flipT: 0,
      jumps: 0,
      coyote: 0,
      buffer: 0,
      safeX: x,
    });
  }

  function showSlips(lines: string[], next: Phase): void {
    slips = lines;
    slipIx = 0;
    slipSub = CONTINUE;
    phase = next;
  }

  function beginMission(ix: number): void {
    missionIx = ix;
    mission = MISSIONS[ix];
    level = build(mission, ix + 1);
    hearts = 3;
    resetPlayer(START_X);
    cam = 0;
    toast = null;
    doneT = null;
    showSlips(mission.intro, "intro");
  }

  function startOutro(): void {
    sound.play("win");
    showSlips(mission.outro, "outro");
  }

  function advance(): void {
    if (phase === "title") {
      if (leaveT === null) leaveTitle();
      return;
    }
    if (phase === "intro" || phase === "outro") {
      slipIx++;
      if (slipIx < slips.length) return;
      if (phase === "intro") phase = "play";
      else if (missionIx + 1 < MISSIONS.length) beginMission(missionIx + 1);
      else phase = "end";
      return;
    }
    if (phase === "paused") phase = "play";
    else if (phase === "dead" && mode === "ultra") startUltra(true);
  }

  /* The title dots scatter for 0.45 s, then the first mission begins. */
  function leaveTitle(): void {
    leaveT = 0;
  }

  function startUltra(again = false): void {
    mode = "ultra";
    level = emptyLevel();
    level.generated = 900;
    hearts = 3;
    resetPlayer(START_X);
    cam = 0;
    toast = null;
    deadT = null;
    if (again) phase = "play";
    else showSlips([ULTRA.intro], "intro");
  }

  function toTitle(): void {
    mode = "title";
    phase = "title";
    titleT = 0;
    leaveT = null;
    level = emptyLevel();
    resetPlayer(w * 0.3);
    cam = 0;
    toast = null;
  }

  function die(): void {
    phase = "dead";
    deathAnimT = 0;
    player.vx = 0;
    sound.play("lose");
    if (mode === "ultra") {
      best = Math.max(best, metres());
      try {
        localStorage.setItem(BEST_KEY, String(best));
      } catch {}
      deadT = null;
    } else {
      deadT = 2.2;
    }
  }

  function loseHeart(): void {
    hearts--;
    sound.play("hurt");
    if (hearts <= 0) die();
  }

  function showToast(line: string | undefined): void {
    if (!line) return;
    toast = line;
    toastT = 2.6;
  }

  function metres(): number {
    return Math.max(0, Math.floor((player.x - START_X) / 10));
  }

  /* ---------- levels ---------- */

  function ledge(x: number, high = false, width = 140): Platform {
    return { x: x - width / 2, w: width, top: groundY - (high ? LEDGE_HIGH : LEDGE_LOW) };
  }

  function build(m: Mission, seed: number): Level {
    const L = emptyLevel();
    L.length = m.length;
    const span = m.length - 1300;
    for (let i = 0; i < m.pits; i++) {
      const x = Math.round(800 + ((i + 0.5) * span) / m.pits + (hash(i, seed) - 0.5) * 240);
      let width = Math.round(96 + hash(i + 9, seed) * 44);
      // Every second pit is too wide for a walking jump: a ledge hangs over
      // its middle, or you sprint, or you jump twice.
      if (i % 2 === 1) {
        width += 130;
        L.platforms.push({ x: x + width / 2 - 55, w: 110, top: groundY - 95 });
      }
      L.pits.push({ x, w: width });
    }
    // Bugs first, so everything to pick up can then keep clear of them.
    // Spread along the level, never on top of the bug before it, never
    // past the end, and walled in by the pits either side with room to
    // spare: a knock-back must not throw him into a pit.
    const bugSpan = m.length - 1700;
    let lastBug = 0;
    for (let i = 0; i < m.bugs; i++) {
      const x = clearPits(
        L,
        Math.max(lastBug + 200, 1100 + ((i + 0.5) * bugSpan) / m.bugs + (hash(i + 21, seed) - 0.5) * 160),
        PIT_ROOM,
      );
      if (x > m.length - 450) break;
      lastBug = x;
      L.bugs.push(bug(L, x, seed > 1 && i % 3 === 2, m.kind === "dodge" && i % 2 === 1, hash(i + 2, seed)));
    }
    if (m.kind === "collect") {
      const gap = span / m.total;
      for (let i = 0; i < m.total; i++) {
        const x = clearOf(L, 700 + i * gap + hash(i + 3, seed) * gap * 0.4);
        // Every third one on a low ledge; one high up, with a step to it.
        if (i % 3 === 1) {
          const pl = ledge(x);
          L.platforms.push(pl);
          L.pickups.push({ kind: m.item, x, y: pl.top - ON_LEDGE, taken: false });
        } else if (i === 3) {
          const pl = ledge(x, true, 120);
          L.platforms.push(ledge(x - 170), pl);
          L.pickups.push({ kind: m.item, x, y: pl.top - ON_LEDGE, taken: false });
        } else {
          L.pickups.push({ kind: m.item, x, y: groundY - LOW, taken: false });
        }
      }
    } else if (m.kind === "spawn") {
      L.pickups.push({ kind: m.item, x: clearOf(L, 760), y: groundY - LOW, taken: false });
    } else if (m.kind === "flee") {
      const stops: number[] = [];
      for (let i = 0; i <= m.total; i++) {
        stops.push(clearOf(L, 1000 + (i * (m.length - 1400)) / m.total));
      }
      L.flag = { x: stops[0], y: groundY, stops, stop: 0, tween: null };
      // A ledge between stops, somewhere to watch the deadline move from.
      for (let i = 1; i < stops.length; i++) {
        L.platforms.push(ledge(clearPits(L, (stops[i - 1] + stops[i]) / 2, 90), i % 2 === 0));
      }
    } else {
      L.goal = m.length - 260;
      // Refuges above the bugs.
      for (let i = 0; i < 3; i++) L.platforms.push(ledge(clearPits(L, 1500 + i * 900, 90), i === 1));
    }
    L.platforms.sort((a, b) => a.x - b.x);
    return L;
  }

  /* A bug at x with its beat (80 px either way) and the bounds a chase may
     stretch to (120 more), both kept PIT_ROOM short of the nearest pit. */
  function bug(L: Level, x: number, big: boolean, chase: boolean, r: number): Bug {
    let lo = 24;
    let hi = L.length - 24;
    for (const p of L.pits) {
      if (p.x + p.w < x) lo = Math.max(lo, p.x + p.w + PIT_ROOM);
      else if (p.x > x) hi = Math.min(hi, p.x - PIT_ROOM);
    }
    return {
      x,
      min: Math.max(lo, x - 80),
      max: Math.min(hi, x + 80),
      lo: Math.max(lo, x - 200),
      hi: Math.min(hi, x + 200),
      dir: r < 0.5 ? 1 : -1,
      speed: (big ? 50 : 80) + r * 70,
      chase,
      big,
      hp: big ? 2 : 1,
    };
  }

  /* Ultra: the world is made 600 px at a time, just ahead of the camera,
     and forgotten behind it. */
  function extend(upTo: number): void {
    while (level.generated < upTo) {
      const k = level.generated / 600;
      const base = level.generated;
      const difficulty = Math.min(1, base / 14000);
      const r = hash(k, 77);
      if (r < 0.4) {
        level.pits.push({
          x: Math.round(base + 200 + hash(k, 78) * 150),
          w: Math.round(90 + difficulty * 70 + hash(k, 79) * 30),
        });
      } else if (r < 0.55) {
        const x = Math.round(base + 150 + hash(k, 78) * 100);
        const width = Math.round(230 + difficulty * 60);
        level.pits.push({ x, w: width });
        level.platforms.push({ x: x + width / 2 - 55, w: 110, top: groundY - 95 });
      } else if (r < 0.85) {
        const x = base + 250 + hash(k, 80) * 200;
        const b = bug(level, x, difficulty > 0.4 && hash(k, 81) < 0.4, false, hash(k, 83));
        b.speed = 60 + difficulty * 120;
        level.bugs.push(b);
      } else if (r < 0.95) {
        level.platforms.push(ledge(base + 300, hash(k, 82) < 0.3));
      }
      level.generated += 600;
    }
    level.pits = level.pits.filter((p) => p.x + p.w > cam - 400);
    level.bugs = level.bugs.filter((b) => b.x > cam - 400);
    level.platforms = level.platforms.filter((p) => p.x + p.w > cam - 400);
  }

  const pitAt = (x: number): Pit | undefined =>
    level.pits.find((p) => x > p.x + 8 && x < p.x + p.w - 8);
  const nearPit = (x: number): boolean =>
    level.pits.some((p) => x > p.x - 60 && x < p.x + p.w + 60);
  const onLedge = (x: number, y: number): Platform | undefined =>
    level.platforms.find((p) => Math.abs(y - p.top) < 3 && x > p.x - 4 && x < p.x + p.w + 4);
  const supported = (x: number, y: number): boolean =>
    (Math.abs(y - groundY) < 3 && !pitAt(x)) || onLedge(x, y) !== undefined;

  /* ---------- update ---------- */

  function update(dt: number): void {
    t += dt;
    if (toast && (toastT -= dt) <= 0) toast = null;
    if (mode === "title") {
      titleT += dt;
      if (leaveT !== null && (leaveT += dt) >= 0.45) {
        mode = "quest";
        leaveT = null;
        beginMission(0);
      }
    }
    if (phase === "play") updatePlay(dt);
    else if (phase !== "paused") updateIdle(dt);
    if (deadT !== null && (deadT -= dt) <= 0) {
      deadT = null;
      level = build(mission, missionIx + 1);
      hearts = 3;
      resetPlayer(START_X);
      phase = "play";
    }
    if (doneT !== null && (doneT -= dt) <= 0) {
      doneT = null;
      startOutro();
    }
    const target = clamp(player.x - w * 0.38, 0, Math.max(0, level.length - w));
    cam += (target - cam) * (1 - Math.exp(-dt * 8));
  }

  /* Between missions and on a slip: no input, but a jump in progress
     still lands (a mission can end mid-air), a swing finishes, and the
     bugs keep walking. */
  function updateIdle(dt: number): void {
    const p = player;
    p.attackT = Math.max(0, p.attackT - dt);
    p.rollT = Math.max(0, p.rollT - dt);
    if (phase === "dead") deathAnimT += dt;
    if (!p.grounded) {
      p.vx *= Math.pow(0.02, dt);
      p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!pitAt(p.x) && p.y >= groundY) {
        p.y = groundY;
        p.vx = 0;
        p.vy = 0;
        p.grounded = true;
      } else if (p.y > h + 80) resetPlayer(p.safeX);
    }
    if (phase !== "title") {
      for (const b of level.bugs) patrol(b, dt);
    }
  }

  function updatePlay(dt: number): void {
    const p = player;
    const sprint = held.has("sprint");
    let dir = (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
    if (mode === "ultra") dir = 1;
    const ultraSpeed = 300 + Math.min(1, p.x / 14000) * 240;
    const speed = mode === "ultra" ? ultraSpeed + (sprint ? 90 : 0) : sprint ? RUN : WALK;
    const swinging = p.attackT > 0 && p.grounded;
    if (p.rollT > 0) p.vx = p.facing * ROLL_SPEED;
    else if (p.hurtT > 0 || swinging) p.vx *= Math.pow(0.02, dt);
    else p.vx += (dir * speed - p.vx) * Math.min(1, dt * 14);
    if (dir !== 0 && p.hurtT <= 0 && p.rollT <= 0 && !swinging) p.facing = dir as 1 | -1;

    p.coyote = p.grounded ? 0.08 : p.coyote - dt;
    p.buffer -= dt;
    if (p.buffer > 0 && p.coyote > 0 && p.rollT <= 0) {
      p.vy = -JUMP;
      p.grounded = false;
      p.coyote = 0;
      p.buffer = 0;
      p.jumps = 1;
      sound.play("jump");
    }
    if (!opts.touch && !held.has("jump") && p.vy < -220 && p.flipT <= 0) p.vy = -220;

    const prevY = p.y;
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
    p.x = clamp(p.x + p.vx * dt, 24, level.length - 24);
    p.y += p.vy * dt;

    // Land on whatever surface the feet crossed on the way down: the
    // ground, or a ledge (one-way: from below he passes through).
    let land: number | null = null;
    const pit = pitAt(p.x);
    if (p.vy >= 0) {
      if (!pit && prevY <= groundY + 2 && p.y >= groundY) land = groundY;
      for (const pl of level.platforms) {
        if (p.x > pl.x - 4 && p.x < pl.x + pl.w + 4 && prevY <= pl.top + 2 && p.y >= pl.top) {
          land = land === null ? pl.top : Math.min(land, pl.top);
        }
      }
    }
    if (land !== null) {
      p.y = land;
      p.vy = 0;
      p.grounded = true;
      p.jumps = 0;
      p.flipT = 0;
    } else if (p.grounded && !supported(p.x, p.y)) {
      p.grounded = false;
    }
    if (!p.grounded && pit && p.y > groundY + 4) {
      p.x = clamp(p.x, pit.x + HALF_W, pit.x + pit.w - HALF_W);
    }
    if (p.grounded && Math.abs(p.y - groundY) < 3 && !nearPit(p.x)) p.safeX = p.x;
    if (p.y > h + 80) {
      loseHeart();
      resetPlayer(p.safeX);
      // A moment with no control, so a held key does not walk him straight
      // back into the same pit.
      p.inv = 1.4;
      p.hurtT = 0.5;
    }

    p.animT += dt;
    p.inv = Math.max(0, p.inv - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.rollT = Math.max(0, p.rollT - dt);
    p.flipT = Math.max(0, p.flipT - dt);
    if (p.attackT > 0) {
      p.attackT = Math.max(0, p.attackT - dt);
      // The blade comes round on the fourth frame.
      if (!p.swung && p.attackT < ATTACK_TIME - 0.22) {
        p.swung = true;
        swing();
      }
    }

    if (mode === "ultra") extend(cam + w + 1500);
    for (const b of level.bugs) {
      if (b.chase && Math.abs(b.x - p.x) < 420) {
        b.dir = p.x < b.x ? -1 : 1;
        b.x = clamp(b.x + b.dir * (b.speed + 60) * dt, b.lo, b.hi);
      } else patrol(b, dt);
      const hit =
        p.inv <= 0 &&
        Math.abs(b.x - p.x) < HALF_W + bugHalf(b) &&
        p.y > groundY - bugHeight(b) &&
        p.y - BODY_H < groundY;
      if (hit) {
        p.inv = 1.4;
        p.hurtT = 0.45;
        p.attackT = 0;
        p.vx = (p.x < b.x ? -1 : 1) * 320;
        p.vy = -330;
        p.grounded = false;
        loseHeart();
      }
    }
    if (phase !== "play") return;

    for (const k of level.pickups) {
      if (k.taken) continue;
      const dx = k.x - p.x;
      const dy = k.y - (p.y - 50);
      if (dx * dx + dy * dy < 52 * 52) take(k);
    }
    // At the end of the road with something missed: say where it is, or
    // he just stands at the wall wondering why the mission will not end.
    const missing = mission.total - level.count;
    if (
      mode === "quest" &&
      (mission.kind === "collect" || mission.kind === "spawn") &&
      missing > 0 &&
      toast === null &&
      p.x > level.length - 120
    ) {
      showToast(`${missing} still to find, back to the west.`);
    }
    const f = level.flag;
    if (f) {
      if (f.tween) {
        f.tween.t += dt / 0.7;
        if (f.tween.t >= 1) {
          f.x = f.tween.to;
          f.y = groundY;
          f.tween = null;
        } else {
          const q = easeOut(f.tween.t);
          f.x = lerp(f.tween.from, f.tween.to, q);
          f.y = groundY - Math.sin(q * Math.PI) * 140;
        }
      } else if (f.stop < f.stops.length - 1 && f.x - p.x < 150 && f.x - p.x > -40) {
        f.stop++;
        f.tween = { from: f.x, to: f.stops[f.stop], t: 0 };
        showToast(mission.lines[f.stop - 1]);
        sound.play("hop");
      } else if (doneT === null && f.stop === f.stops.length - 1 && Math.abs(f.x - p.x) < 40) {
        sound.play("pick");
        doneT = 0.6;
      }
    }
    if (level.goal !== null && doneT === null && p.x >= level.goal) {
      sound.play("pick");
      doneT = 0.8;
    }
  }

  function patrol(b: Bug, dt: number): void {
    b.x += b.dir * b.speed * dt;
    if (b.x < b.min) {
      b.x = b.min;
      b.dir = 1;
    } else if (b.x > b.max) {
      b.x = b.max;
      b.dir = -1;
    }
  }

  /* The sword lands on every bug in reach in front of him, if he is down
     at their level. A big one takes two swings. */
  function swing(): void {
    const p = player;
    if (Math.abs(p.y - groundY) > 60) return;
    let popped = false;
    level.bugs = level.bugs.filter((b) => {
      const ahead = (b.x - p.x) * p.facing;
      if (ahead < -bugHalf(b) || ahead > ATTACK_REACH + bugHalf(b)) return true;
      b.hp--;
      if (b.hp > 0) {
        b.x += p.facing * 40;
        return true;
      }
      popped = true;
      return false;
    });
    if (popped) sound.play("pop");
  }

  function take(k: Pickup): void {
    k.taken = true;
    level.count++;
    sound.play("pick");
    showToast(mission.lines[level.count - 1]);
    if (mission.kind === "spawn" && level.pickups.length < mission.total) {
      // Two more, ahead of the furthest crate: one low, one on a ledge.
      let far = Math.max(...level.pickups.map((q) => q.x));
      for (const [dx, up] of [
        [260, false],
        [220, true],
      ] as const) {
        if (level.pickups.length >= mission.total) break;
        const x = clearOf(level, far + dx);
        far = x;
        let y = groundY - LOW;
        if (up) {
          const pl = ledge(x);
          level.platforms.push(pl);
          y = pl.top - ON_LEDGE;
        }
        level.pickups.push({ kind: mission.item, x, y, taken: false });
      }
    }
    if (level.count >= mission.total && doneT === null) doneT = 1.2;
  }

  /* ---------- render ---------- */

  /* Which cell of the sheet shows him right now. */
  function heroFrame(): { anim: HeroAnim; frame: number } {
    const p = player;
    const once = (anim: HeroAnim, elapsed: number) => ({
      anim,
      frame: Math.min(HERO[anim].frames - 1, Math.floor(elapsed * HERO[anim].fps)),
    });
    if (phase === "dead" && mode === "quest") return once("death", deathAnimT);
    if (p.hurtT > 0) return once("hurt", 0.45 - p.hurtT);
    if (p.attackT > 0) return once("attack", ATTACK_TIME - p.attackT);
    if (p.rollT > 0) return once("roll", ROLL_TIME - p.rollT);
    if (!p.grounded) {
      if (p.flipT > 0) {
        const q = 1 - p.flipT / 0.45;
        return { anim: "roll", frame: FLIP_FRAMES[Math.min(3, Math.floor(q * 4))] };
      }
      return { anim: "roll", frame: LEAP_FRAME };
    }
    if (Math.abs(p.vx) > 30) {
      const fps = Math.abs(p.vx) > WALK + 40 ? 16 : HERO.walk.fps;
      return { anim: "walk", frame: Math.floor(p.animT * fps) % HERO.walk.frames };
    }
    return { anim: "idle", frame: Math.floor(t * HERO.idle.fps) % HERO.idle.frames };
  }

  function drawHero(): void {
    if (!hero.complete || hero.naturalWidth === 0) return;
    const p = player;
    if (p.inv > 0 && p.rollT <= 0 && Math.floor(t * 14) % 2 === 0) return;
    const { anim, frame } = heroFrame();
    const s = HERO_SCALE;
    ctx.save();
    ctx.translate(Math.round(p.x - cam), Math.round(p.y));
    if (p.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(
      hero,
      frame * CELL,
      HERO[anim].row * CELL,
      CELL,
      CELL,
      -CENTER * s,
      -FEET * s,
      CELL * s,
      CELL * s,
    );
    ctx.restore();
  }

  function glow(x: number, y: number, r: number): void {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${ACCENT_RGB},0.32)`);
    g.addColorStop(1, `rgba(${ACCENT_RGB},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function render(): void {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    const scene: Scene = {
      w,
      h,
      groundY,
      cam,
      t,
      night: mode === "quest" && mission.night,
      reduced,
    };
    if (scene.night) drawStars(dots, scene);
    drawClouds(dots, scene);
    drawHills(dots, scene, 0);
    drawHills(dots, scene, 1);
    drawTrees(dots, scene);
    drawGround(dots, warn, scene, level.pits);
    drawPlatforms(dots, warn, scene, level.platforms);
    dots.flush(ctx);
    warn.flush(ctx);

    const pulse = reduced ? 0 : Math.sin(t * 3);
    for (const k of level.pickups) {
      if (k.taken) continue;
      const x = k.x - cam;
      if (x < -60 || x > w + 60) continue;
      const y = k.y + pulse * 4;
      glow(x, y, 30 + pulse * 3);
      drawFrame(ctx, PICKUPS[k.kind][0], x, y + 16, 3);
    }
    if (level.goal !== null) {
      const x = level.goal - cam;
      glow(x, groundY - 20, 40);
      drawFrame(ctx, PICKUPS.bell[0], x, groundY, 4);
    }
    const f = level.flag;
    if (f) {
      const x = f.x - cam;
      glow(x, f.y - 30, 36);
      drawFrame(ctx, PICKUPS.flag[Math.floor(t * 4) % 2], x + 16, f.y, 4);
    }
    const bugFrame = Math.floor(t * 8) % 2;
    for (const b of level.bugs) {
      const x = b.x - cam;
      if (x < -80 || x > w + 80) continue;
      if (b.big) drawFrame(ctx, BIG_BUG[bugFrame], x, groundY, 8);
      else drawFrame(ctx, BUG[bugFrame], x, groundY, 5);
    }
    drawHero();
    if (mode === "title") drawTitle();
  }

  function drawTitle(): void {
    const leave = leaveT === null ? 0 : clamp(leaveT / 0.45, 0, 1);
    for (const d of title) {
      const q = reduced ? 1 : clamp((titleT - d.delay) / 1.1, 0, 1);
      let x = lerp(d.fromX, d.x, easeOut(q));
      let y = lerp(d.fromY, d.y, easeOut(q));
      if (leave > 0) {
        x = lerp(d.x, d.fromX, leave * leave);
        y = lerp(d.y, d.fromY, leave * leave);
      }
      // The title in coral too, his call: the warm tone is the game's own.
      ctx.fillStyle = `rgba(${WARN_RGB},${d.a * (1 - leave)})`;
      ctx.beginPath();
      ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (leave > 0) return;
    const spark = reduced ? 0.8 : 0.6 + 0.4 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(${ACCENT_RGB},${spark})`;
    for (const x of [sparks.left, sparks.right]) {
      ctx.beginPath();
      ctx.arc(x, sparks.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- ui snapshot ---------- */

  function hud(): QuestUi["hud"] {
    if (mode === "ultra") return { label: "RUN", value: `${metres()} m` };
    if (mode !== "quest" || phase === "intro" || phase === "end") return null;
    const total = mission.total;
    let value: string;
    if (mission.kind === "flee") value = `${Math.min(level.flag?.stop ?? 0, total)} / ${total}`;
    else if (mission.kind === "dodge") {
      value = `${Math.round(clamp((player.x - START_X) / ((level.goal ?? 1) - START_X), 0, 1) * 100)}%`;
    } else value = `${level.count} / ${total}`;
    return { label: mission.hud, value };
  }

  function slip(): QuestUi["slip"] {
    if (phase === "intro" || phase === "outro") return { text: slips[slipIx], sub: slipSub };
    if (phase === "paused") return { text: "Paused", sub: "Press Enter to resume" };
    if (phase === "dead") {
      return mode === "ultra"
        ? { text: ULTRA.over(metres()), sub: "Press Enter to run again" }
        : { text: "Out of lives", sub: "Toshkee gets back up." };
    }
    return null;
  }

  function pushUi(): void {
    const next: QuestUi = {
      phase,
      mode,
      hearts,
      hud: hud(),
      slip: slip(),
      toast,
      best,
      sound: sound.enabled(),
      touch: opts.touch,
    };
    const key = JSON.stringify(next);
    if (key === lastUi) return;
    lastUi = key;
    opts.onUi(next);
  }

  function tick(now: number): void {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    pushUi();
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  if (process.env.NODE_ENV === "development") {
    window.__quest = {
      state: () => ({
        phase,
        mode,
        x: player.x,
        y: player.y,
        vy: player.vy,
        grounded: player.grounded,
        hearts,
        groundY,
        length: level.length,
        pits: level.pits,
        platforms: level.platforms,
        pickups: level.pickups.filter((k) => !k.taken).map((k) => ({ x: k.x, y: k.y })),
        bugs: level.bugs.map((b) => ({ x: b.x, big: b.big, hp: b.hp })),
        flag: level.flag?.x ?? null,
        goal: level.goal,
      }),
    };
  }

  return {
    resize(nw, nh, ndpr) {
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const oldGround = groundY;
      groundY = Math.round(h * 0.72);
      const cell = clamp(w / 120, 6, 11);
      const top = h * 0.16;
      title = layoutTitle(["TOSHKEE'S", "QUEST"], w / 2, top, cell);
      const line2 = title.filter((d) => d.y >= top + 9 * cell - 1);
      sparks = {
        left: Math.min(...line2.map((d) => d.x)) - 4 * cell,
        right: Math.max(...line2.map((d) => d.x)) + 4 * cell,
        y: top + 12.5 * cell,
      };
      if (mode === "title") resetPlayer(w * 0.3);
      else {
        // Everything stands on the ground; move it with the ground.
        const dy = groundY - oldGround;
        player.y += dy;
        for (const k of level.pickups) k.y += dy;
        for (const pl of level.platforms) pl.top += dy;
        if (level.flag) level.flag.y += dy;
      }
    },
    press(action) {
      const p = player;
      if (action === "confirm") {
        if (phase === "play") phase = "paused";
        else advance();
        return;
      }
      if (action === "jump") {
        if (phase !== "play") {
          advance();
          return;
        }
        held.add("jump");
        if (p.grounded || p.coyote > 0) p.buffer = 0.12;
        else if (p.jumps < 2 && p.rollT <= 0 && p.hurtT <= 0) {
          // The second jump, a somersault.
          p.vy = -JUMP2;
          p.jumps = 2;
          p.flipT = 0.45;
          sound.play("jump");
        }
        return;
      }
      const free = p.rollT <= 0 && p.attackT <= 0 && p.hurtT <= 0;
      if (action === "attack") {
        if ((phase === "play" || phase === "title") && free) {
          p.attackT = ATTACK_TIME;
          p.swung = false;
          sound.play("slash");
        }
        return;
      }
      if (action === "roll") {
        if ((phase === "play" || phase === "title") && free && p.grounded) {
          p.rollT = ROLL_TIME;
          p.inv = Math.max(p.inv, ROLL_TIME);
          sound.play("hop");
        }
        return;
      }
      held.add(action);
    },
    release(action) {
      held.delete(action);
    },
    startQuest() {
      if (phase === "title" && leaveT === null) leaveTitle();
      else if (phase === "end" || phase === "dead") {
        mode = "quest";
        beginMission(0);
      }
    },
    startUltra() {
      startUltra();
    },
    pause() {
      if (phase === "play") phase = "paused";
    },
    toTitle,
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
