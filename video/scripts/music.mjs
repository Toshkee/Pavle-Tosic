/* The film's sound, synthesised here: no samples, no library, the way the
   Quest's chiptune is (src/app/site/quest/sound.ts). Writes src/music.wav
   (44.1 kHz stereo, 67 s). Run: npm run music

   SFX=1 writes src/sfx.wav instead: only the picture's own sounds (the
   clicks, the typing, the game), for laying under a score made elsewhere
   (src/score.wav, ElevenLabs Music). Run: npm run sfx

   120 bpm, so a beat is 30 frames and a bar 120: every scene of the film
   starts on a bar (src/lib/theme.ts SCENES), and every cue below is a frame
   number copied from the scene it belongs to. If a scene's timing changes,
   change its cue here. */
import { writeFileSync } from "node:fs";

const SR = 44100;
const FPS = 60;
const SECONDS = 67;
const SFX = Boolean(process.env.SFX);
const N = SR * SECONDS;
const BAR = 2;
const BEAT = 0.5;
const at = (frame) => frame / FPS;

// ---- cues, in film frames ----
const SCENE = { title: 210, site: 570, chat: 1020, work: 1560, numbers: 2400, fit: 2760, quest: 3240, end: 3600 };
const END_CLICK = SCENE.end + 240;
const CLICKS = [196, 210 + 356, 570 + 385, 1020 + 512, SCENE.fit + 150, END_CLICK];
const TYPING = [
  { text: "Who is Pavle Tošić?", start: 34, perChar: 4.6, gain: 1 },
  { text: "INTRODUCING", start: 210 + 26, perChar: 3, gain: 0.5 },
  { text: "Are you open to work?", start: SCENE.end + 150, perChar: 3.2, gain: 1 },
  { text: "pavletosic.com", start: END_CLICK + 40, perChar: 2.6, gain: 0.8 },
];
const NUMBER_ROWS = [30, 60, 90, 120, 160].map((f) => SCENE.numbers + f);
const FIT_DROP = SCENE.fit + 92;
const FIT_ROWS = [240, 276, 312, 348].map((f) => SCENE.fit + f);
const FIT_PUSH = SCENE.fit + 378;
const QUEST = { jump: SCENE.quest + 72, slash: SCENE.quest + 176, pick: SCENE.quest + 262 };
const END_ANSWER = END_CLICK + 16;

// ---- helpers ----
let seed = 20261109;
const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;
// The film's `hash` (src/lib/motion.ts), for the typing: a key is heard on
// the frame its letter appears.
const hash = (n) => {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};

const bus = () => [new Float32Array(N), new Float32Array(N)];
const drums = bus();
const bass = bus();
const pad = bus();
const pluck = bus();
const fx = bus();

/** Adds fn(t) for `len` seconds from t0, panned -1..1. */
const voice = (to, t0, len, pan, fn) => {
  const i0 = Math.round(t0 * SR);
  const n = Math.round(len * SR);
  const l = Math.cos(((pan + 1) * Math.PI) / 4);
  const r = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n; i++) {
    const k = i0 + i;
    if (k < 0 || k >= N) continue;
    const s = fn(i / SR, i);
    to[0][k] += s * l;
    to[1][k] += s * r;
  }
};

const kicks = [];
const kick = (t0, gain = 0.8) => {
  kicks.push(t0);
  let ph = 0;
  voice(drums, t0, 0.4, 0, (t) => {
    ph += (TAU * (46 + 120 * Math.exp(-t * 36))) / SR;
    return gain * (Math.sin(ph) * Math.exp(-t * 8.5) + noise() * 0.12 * Math.exp(-t * 500));
  });
};
const hat = (t0, level = 0.1, open = false, pan = 0.2) => {
  const gain = level * 1.6;
  let prev = 0;
  voice(drums, t0, open ? 0.22 : 0.05, pan, (t) => {
    const n = noise();
    const s = n - prev;
    prev = n;
    return gain * s * Math.exp(-t * (open ? 16 : 95));
  });
};
const clap = (t0, gain = 0.25) => {
  for (const to of [drums, fx]) {
    let lp = 0;
    let prev = 0;
    voice(to, t0, 0.28, 0, (t) => {
      const n = noise();
      lp += 0.35 * (n - lp);
      const s = lp - prev;
      prev = lp;
      const burst = Math.exp(-(t % 0.011) * 260) * (t < 0.03 ? 1 : 0) + Math.exp(-(t - 0.03) * 24) * (t >= 0.03 ? 1 : 0);
      return gain * (to === fx ? 0.5 : 1) * 2.2 * s * burst;
    });
  }
};
const snare = (t0, gain = 0.3) => {
  let ph = 0;
  voice(drums, t0, 0.2, 0, (t) => {
    ph += (TAU * 190) / SR;
    return gain * (noise() * Math.exp(-t * 26) * 0.8 + Math.sin(ph) * Math.exp(-t * 32) * 0.6);
  });
};
const bassNote = (t0, midi, len, gain = 0.34) => {
  const f = mtof(midi);
  voice(bass, t0, len + 0.06, 0, (t) => {
    const ph = TAU * f * t;
    const env = Math.min(1, t / 0.006) * Math.exp(-t * 4.2) * (t > len ? Math.max(0, 1 - (t - len) / 0.06) : 1);
    return gain * env * (Math.sin(ph) + 0.42 * Math.sin(2 * ph) + 0.16 * Math.sin(3 * ph));
  });
};
const padChord = (t0, notes, len, gain = 1, attack = 0.5) => {
  for (const midi of notes) {
    for (const [cents, pan] of [[-5, -0.6], [5, 0.6]]) {
      const f = mtof(midi + cents / 100);
      const drift = rnd() * TAU;
      voice(pad, t0, len + 1.4, pan, (t) => {
        const ph = TAU * f * t + drift;
        const env = Math.min(1, t / attack) * (t > len ? Math.max(0, 1 - (t - len) / 1.4) ** 2 : 1);
        let s = 0;
        for (let h = 1; h <= 5; h++) s += Math.sin(h * ph) / h ** 1.7;
        return gain * 0.034 * env * s * (0.85 + 0.15 * Math.sin(TAU * 0.23 * t + drift));
      });
    }
  }
};
const pluckNote = (t0, midi, gain = 0.15, pan = 0, decay = 7) => {
  const f = mtof(midi);
  voice(pluck, t0, 0.7, pan, (t) => {
    const ph = TAU * f * t;
    return gain * Math.min(1, t / 0.002) * Math.exp(-t * decay) * (Math.sin(ph) + 0.34 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph));
  });
};
const chip = (to, t0, midi, len, gain = 0.07, pan = 0) => {
  const f = mtof(midi);
  voice(to, t0, len, pan, (t) => {
    const ph = TAU * f * t;
    let s = 0;
    for (let h = 1; h <= 9; h += 2) s += Math.sin(h * ph) / h;
    return gain * s * Math.min(1, t / 0.004) * Math.min(1, (len - t) / 0.01);
  });
};
/** Filtered noise whose cutoff and level travel: a riser or a fall. */
const sweep = (t0, len, f0, f1, gain, rising) => {
  for (const ch of [0, 1]) {
    let lp = 0;
    const i0 = Math.round(t0 * SR);
    for (let i = 0; i < len * SR; i++) {
      const k = i0 + i;
      if (k < 0 || k >= N) continue;
      const u = i / (len * SR);
      const cut = f0 * (f1 / f0) ** u;
      lp += Math.min(1, (TAU * cut) / SR) * (noise() - lp);
      fx[ch][k] += gain * lp * (rising ? u * u : (1 - u) ** 2) * Math.min(1, i / 400);
    }
  }
};
const boom = (t0, gain = 0.7) => {
  let ph = 0;
  voice(drums, t0, 1.8, 0, (t) => {
    ph += (TAU * (33 + 34 * Math.exp(-t * 9))) / SR;
    return gain * (Math.sin(ph) * Math.exp(-t * 2.4) + noise() * 0.2 * Math.exp(-t * 60));
  });
};
const key = (t0, gain = 1) => {
  const f = 1700 + rnd() * 700;
  voice(fx, t0, 0.025, rnd() * 0.5 - 0.25, (t) =>
    gain * 0.1 * (noise() * Math.exp(-t * 900) + 0.5 * Math.sin(TAU * f * t) * Math.exp(-t * 420)),
  );
};
const click = (t0) => {
  let ph = 0;
  voice(fx, t0, 0.07, 0, (t) => {
    ph += (TAU * (700 + 900 * Math.exp(-t * 90))) / SR;
    return 0.3 * Math.sin(ph) * Math.exp(-t * 85) + 0.1 * noise() * Math.exp(-t * 700);
  });
};

// ---- the tune: A minor, one chord a bar ----
const AM = { root: 33, notes: [57, 60, 64, 67, 71] };
const F = { root: 29, notes: [53, 57, 60, 64, 69] };
const C = { root: 36, notes: [55, 59, 60, 64, 67] };
const G = { root: 31, notes: [55, 59, 62, 64, 69] };
const LOOP = [AM, F, C, G];
const END = { 30: F, 31: G, 32: C, 33: C };
const chord = (b) => END[b] ?? LOOP[b % 4];
const ARP = [0, 2, 1, 3, 2, 4, 3, 1];

// The tune is left out of the sound-effects track.
if (!SFX) {
  for (let b = 0; b < 34; b++) {
    const t = b * BAR;
    const ch = chord(b);
    const part =
      b < 2 ? "open" : b < 5 ? "title" : b < 13 ? "site" : b < 20 ? "work" : b < 23 ? "numbers" : b < 27 ? "fit" : b < 30 ? "quest" : "end";

    // Pad: everywhere but the game.
    if (part !== "quest") {
      const last = b >= 32;
      if (!(b === 33)) padChord(t, ch.notes, last ? 3.4 : BAR, part === "open" ? 0.55 : part === "work" ? 0.85 : 1, part === "open" ? 1.6 : 0.5);
    }

    for (let e = 0; e < 8; e++) {
      const te = t + e * (BEAT / 2);
      if (te >= SECONDS - 2.2) break;
      const note = ch.notes[ARP[e] % ch.notes.length];
      const pan = e % 2 ? 0.45 : -0.45;
      if (part === "title" && b >= 3) pluckNote(te, note + 12, 0.09, pan);
      if (part === "title" && e === 0) bassNote(te, ch.root + 12, 1.6, 0.2);
      if (part === "site") {
        pluckNote(te, note + 12, b < 6 ? 0.13 : 0.19, pan);
        bassNote(te, ch.root + (e % 4 === 3 ? 12 : 0), 0.2, b < 6 ? 0.22 : 0.32);
        if (e % 2 === 1) hat(te, 0.11);
        if (b >= 6 && e % 2 === 0 && !(b === 12 && e >= 4)) kick(te, 0.72);
        if (b >= 9 && (e === 2 || e === 6)) clap(te, 0.16);
      }
      if (part === "work") {
        pluckNote(te, note + 12, 0.17, pan);
        pluckNote(te + BEAT / 4, note + 24, 0.07, -pan);
        bassNote(te, ch.root + (e % 2 ? 12 : 0), 0.2, 0.36);
        if (e % 2 === 0) kick(te, 0.85);
        if (e === 2 || e === 6) clap(te, 0.3);
        hat(te, e % 2 ? 0.14 : 0.07, e % 2 === 1 && e % 4 === 3);
        hat(te + BEAT / 4, 0.05);
      }
      if (part === "numbers") {
        if (e % 2 === 0) pluckNote(te, note + 12, 0.1, pan, 5);
        if (e % 2 === 1) hat(te, 0.05);
      }
      if (part === "fit") {
        const quiet = te >= at(FIT_PUSH) - 0.3;
        pluckNote(te, note + 12, 0.13, pan);
        if (!quiet) {
          bassNote(te, ch.root + (e % 4 === 3 ? 12 : 0), 0.2, 0.3);
          if (e % 2 === 0) kick(te, 0.72);
          if (e % 2 === 1) hat(te, 0.1);
        }
      }
      if (part === "quest") {
        chip(pluck, te, note + 12, 0.11, 0.1, pan);
        chip(pluck, te + BEAT / 4, note + 24, 0.1, 0.06, -pan);
        chip(bass, te, ch.root + 12 + (e % 2 ? 12 : 0), 0.16, 0.15);
        if (e % 2 === 0) kick(te, 0.75);
        if (e === 2 || e === 6) snare(te, 0.3);
        hat(te, 0.07);
      }
      if (part === "end" && b < 33) {
        pluckNote(te, note + 12, b < 32 ? 0.11 : 0.07, pan, 5);
        if (b < 32 && e % 4 === 0) kick(te, 0.55);
        if (b < 32) bassNote(te, ch.root + (e % 4 === 3 ? 12 : 0), 0.2, 0.22);
      }
    }
    // The start of each project in the work scene: the chord, struck.
    if (part === "work") {
      ch.notes.forEach((n, i) => pluckNote(t, n + 12, 0.16, i / 2 - 1, 3.5));
      sweep(t, 0.5, 9000, 500, 0.16, false);
    }
  }
  // The last chord, left to ring.
  C.notes.forEach((n, i) => pluckNote(64 + i * 0.07, n + 12, 0.12, i / 2 - 1, 1.6));
  bassNote(64, C.root, 2.4, 0.26);
}

// ---- the picture's own sounds ----
// Risers and booms belong to the score: a score made elsewhere brings its own.
if (!SFX) {
  sweep(at(150), at(SCENE.title + 30) - at(150), 300, 7000, 0.3, true);
  boom(at(SCENE.title + 30), 0.75);
  sweep(at(SCENE.title + 356), 0.57, 500, 8000, 0.22, true);
  boom(at(600), 0.45);
  sweep(at(SCENE.work) - 1.2, 1.2, 400, 9000, 0.3, true);
  boom(at(SCENE.work), 0.8);
  sweep(at(SCENE.numbers), 0.9, 8000, 300, 0.2, false);
  sweep(at(SCENE.fit) - 0.9, 0.9, 500, 6000, 0.16, true);
  sweep(at(FIT_PUSH), 1.4, 6000, 250, 0.16, false);
  boom(at(SCENE.quest), 0.5);
  sweep(at(SCENE.end) - 0.5, 0.5, 5000, 300, 0.14, false);
  boom(at(SCENE.end) + 0.25, 0.4);
}

for (const frame of CLICKS) click(at(frame));
for (const { text, start, perChar, gain } of TYPING) {
  let frame = start;
  for (let n = 0; n < text.length; n++) {
    frame += perChar * (0.6 + 0.9 * hash(n * 31 + text.length));
    if (text[n] === " ") frame += perChar * 0.4;
    key(at(frame), gain);
  }
}
if (!SFX) NUMBER_ROWS.forEach((frame, i) => pluckNote(at(frame), [69, 72, 76, 79, 84][i], 0.2, i < 4 ? -0.3 : 0.4, 5));
voice(drums, at(FIT_DROP), 0.3, 0, (t) => 0.5 * Math.sin(TAU * (70 + 60 * Math.exp(-t * 30)) * t) * Math.exp(-t * 16));
if (!SFX) FIT_ROWS.forEach((frame, i) => pluckNote(at(frame), [76, 79, 81, 69][i], 0.22, 0, i === 3 ? 3 : 6));
// The game: a jump, the sword and the bug, a page picked up.
voice(fx, at(QUEST.jump), 0.14, 0, (t) => 0.16 * Math.sign(Math.sin(TAU * (300 + 2600 * t) * t)) * (1 - t / 0.14));
sweep(at(QUEST.slash), 0.16, 9000, 1500, 0.5, false);
voice(fx, at(QUEST.slash) + 0.07, 0.2, 0, (t) => 0.2 * Math.sign(Math.sin(TAU * (520 - 1900 * t) * t)) * Math.exp(-t * 14));
chip(fx, at(QUEST.pick), 88, 0.07, 0.16);
chip(fx, at(QUEST.pick) + 0.07, 93, 0.16, 0.16);
// The answer on the end card: C major, upward.
if (!SFX) [72, 76, 79, 84].forEach((n, i) => pluckNote(at(END_ANSWER) + i * 0.06, n, 0.2, i / 2 - 0.75, 4));

// ---- mix ----
// The kick ducks the bass and the pad, so it is felt without being loud.
const duck = new Float32Array(N).fill(1);
for (const t0 of kicks) {
  const i0 = Math.round(t0 * SR);
  for (let i = 0; i < 0.3 * SR && i0 + i < N; i++) {
    duck[i0 + i] = Math.min(duck[i0 + i], 1 - 0.6 * Math.exp(-(i / SR) * 11));
  }
}
// Plucks echo across the stereo field, a dotted eighth apart.
const D = Math.round(0.375 * SR);
const echo = bus();
for (let i = D; i < N; i++) {
  echo[0][i] = 0.42 * pluck[1][i - D] + 0.4 * echo[1][i - D];
  echo[1][i] = 0.42 * pluck[0][i - D] + 0.4 * echo[0][i - D];
}
// One small room for everything that is not drums or bass.
const room = bus();
[0, 1].forEach((c) => {
  const send = new Float32Array(N);
  for (let i = 0; i < N; i++) send[i] = 0.5 * pad[c][i] + 0.4 * (pluck[c][i] + echo[c][i]) + 0.35 * fx[c][i];
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => d + c * 23);
  const acc = new Float32Array(N);
  for (const d of combs) {
    const buf = new Float32Array(N);
    let damp = 0;
    for (let i = 0; i < N; i++) {
      const back = i >= d ? buf[i - d] : 0;
      damp += 0.35 * (back - damp);
      buf[i] = send[i] + 0.82 * damp;
      acc[i] += back;
    }
  }
  let out = acc;
  for (const d of [225 + c * 7, 556 + c * 11]) {
    const next = new Float32Array(N);
    const mem = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const back = i >= d ? mem[i - d] : 0;
      mem[i] = out[i] + 0.5 * back;
      next[i] = back - 0.5 * mem[i];
    }
    out = next;
  }
  room[c] = out;
});

// LEVELS=1 prints each bus's level in the loud bars, for balancing by number.
if (process.env.LEVELS) {
  const db = (b, from, to) => {
    let sum = 0;
    for (let i = from * SR; i < to * SR; i++) sum += b[0][i] ** 2 + b[1][i] ** 2;
    return (10 * Math.log10(sum / ((to - from) * SR * 2) + 1e-12)).toFixed(1);
  };
  for (const [name, b] of Object.entries({ drums, bass, pad, pluck, echo, fx, room }))
    console.log(name.padEnd(6), "work", db(b, 26, 38), "site", db(b, 14, 24), "title", db(b, 5, 10), "quest", db(b, 54, 60));
}

const mixed = bus();
let peak = 0;
let raw = 0;
for (const c of [0, 1]) {
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const s =
      0.85 * drums[c][i] +
      0.8 * bass[c][i] * duck[i] +
      1.9 * pad[c][i] * (0.55 + 0.45 * duck[i]) +
      1.35 * pluck[c][i] +
      0.95 * echo[c][i] +
      1.2 * fx[c][i] +
      0.2 * room[c][i];
    // In from silence, out over the last second and a half.
    const fade = Math.min(1, t / 0.05) * Math.min(1, Math.max(0, (SECONDS - t) / 1.5));
    raw = Math.max(raw, Math.abs(s));
    // A soft ceiling: the loudest bars lean on it, nothing clips.
    mixed[c][i] = Math.tanh(0.65 * s) * fade;
    peak = Math.max(peak, Math.abs(mixed[c][i]));
  }
}

const data = Buffer.alloc(44 + N * 4);
data.write("RIFF", 0);
data.writeUInt32LE(36 + N * 4, 4);
data.write("WAVEfmt ", 8);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22);
data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write("data", 36);
data.writeUInt32LE(N * 4, 40);
const norm = 0.89 / peak;
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(mixed[0][i] * norm * 32767), 44 + i * 4);
  data.writeInt16LE(Math.round(mixed[1][i] * norm * 32767), 46 + i * 4);
}
const OUT = SFX ? "sfx.wav" : "music.wav";
writeFileSync(new URL(`../src/${OUT}`, import.meta.url), data);
console.log(`src/${OUT}: ${SECONDS} s, raw peak ${raw.toFixed(2)}, after the ceiling ${peak.toFixed(3)}`);
