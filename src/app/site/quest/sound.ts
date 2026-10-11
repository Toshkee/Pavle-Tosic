/* A handful of synthesised blips and a little looping tune, no audio
   files: jump, pick-up, hurt, the hop of a goal that will not stay put, a
   chord at the end of a mission, and the music under it all. Off until the
   visitor turns it on (the choice is kept in localStorage). The
   AudioContext is only created and resumed inside a tap, click or key
   press (unlock), as browsers require; iOS also mutes Web Audio with the
   ring switch unless the page declares itself playback, which it does
   once the visitor has asked for sound. */

export type Sound = {
  enabled: () => boolean;
  toggle: () => boolean;
  play: (name: Blip) => void;
  // Call from every tap and key press: audio may only start inside one.
  unlock: () => void;
  destroy: () => void;
};

export type Blip = "jump" | "pick" | "hurt" | "hop" | "win" | "lose" | "slash" | "pop";

const KEY = "quest.sound";

const NOTES: Record<Blip, [number, number, OscillatorType, number][]> = {
  // [frequency, length, wave, start offset]
  jump: [[320, 0.09, "square", 0], [520, 0.08, "square", 0.05]],
  pick: [[660, 0.07, "sine", 0], [990, 0.1, "sine", 0.07]],
  hurt: [[220, 0.12, "sawtooth", 0], [140, 0.16, "sawtooth", 0.1]],
  hop: [[440, 0.05, "triangle", 0], [660, 0.05, "triangle", 0.06], [880, 0.07, "triangle", 0.12]],
  win: [[523, 0.12, "sine", 0], [659, 0.12, "sine", 0.12], [784, 0.2, "sine", 0.24]],
  lose: [[330, 0.14, "triangle", 0], [262, 0.14, "triangle", 0.15], [196, 0.3, "triangle", 0.3]],
  slash: [[900, 0.05, "sawtooth", 0], [500, 0.08, "sawtooth", 0.04]],
  pop: [[300, 0.06, "square", 0], [150, 0.08, "square", 0.05]],
};

/* The music: an original eight-bar loop in A minor at 120 bpm, eighth
   notes, a triangle bass under a square lead kept well below the blips.
   Scheduled 0.3 s ahead on the AudioContext clock, so a late timer never
   makes it stumble. */
const STEP = 0.25;
const LOOKAHEAD = 0.3;
// Bar roots as MIDI notes: Am F C G, then Am F G E.
const ROOTS = [45, 41, 48, 43, 45, 41, 43, 40];
// The bass in each bar, in semitones over the root; null rests.
const BASS: (number | null)[] = [0, null, 12, 0, null, 0, 12, 7];
// The lead, eight steps a bar; "-" rests.
const LEAD = [
  "E5 - C5 A4 C5 E5 D5 C5",
  "A4 - F4 A4 C5 - A4 F4",
  "G4 - E4 G4 C5 E5 D5 C5",
  "D5 - B4 G4 B4 D5 - -",
  "E5 - A5 G5 E5 - D5 C5",
  "C5 - A4 C5 F5 E5 C5 A4",
  "B4 - D5 G5 F5 D5 B4 G4",
  "G#4 - B4 E5 G#4 - E4 -",
]
  .join(" ")
  .split(" ");

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const midi = (note: string): number => {
  const sharp = note[1] === "#" ? 1 : 0;
  return 12 * (Number(note.slice(1 + sharp)) + 1) + SEMITONE[note[0]] + sharp;
};
const hz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

export function createSound(): Sound {
  let on = false;
  try {
    on = localStorage.getItem(KEY) === "on";
  } catch {}
  let ctx: AudioContext | null = null;
  let timer = 0;
  let step = 0;
  let next = 0;

  // Only ever called inside a gesture (unlock, toggle).
  const context = (): AudioContext => {
    if (!ctx) {
      const session = (navigator as AudioSessionNavigator).audioSession;
      if (session) session.type = "playback";
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const tone = (
    ac: AudioContext,
    freq: number,
    at: number,
    length: number,
    wave: OscillatorType,
    peak: number,
  ) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain).connect(ac.destination);
    osc.start(at);
    osc.stop(at + length + 0.02);
  };

  const play = (name: Blip) => {
    // Before the first gesture there is no context, and nothing could
    // sound anyway.
    if (!on || !ctx) return;
    const now = ctx.currentTime;
    for (const [freq, length, wave, at] of NOTES[name]) tone(ctx, freq, now + at, length, wave, 0.12);
  };

  const schedule = () => {
    if (!ctx) return;
    // After a stall (a busy main thread), pick up from now rather than
    // firing the missed notes all at once.
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
    while (next < ctx.currentTime + LOOKAHEAD) {
      const bass = BASS[step % 8];
      if (bass !== null) tone(ctx, hz(ROOTS[step >> 3] + bass), next, STEP * 0.9, "triangle", 0.1);
      if (LEAD[step] !== "-") tone(ctx, hz(midi(LEAD[step])), next, STEP * 0.8, "square", 0.035);
      step = (step + 1) % LEAD.length;
      next += STEP;
    }
  };

  const startMusic = () => {
    if (timer) return;
    step = 0;
    next = context().currentTime + 0.1;
    schedule();
    timer = window.setInterval(schedule, 100);
  };

  const stopMusic = () => {
    window.clearInterval(timer);
    timer = 0;
  };

  // No music from a background tab.
  const onVisibility = () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (on) void ctx.resume();
  };
  document.addEventListener("visibilitychange", onVisibility);

  return {
    enabled: () => on,
    toggle: () => {
      on = !on;
      try {
        localStorage.setItem(KEY, on ? "on" : "off");
      } catch {}
      if (on) {
        startMusic();
        play("pick");
      } else stopMusic();
      return on;
    },
    play,
    unlock: () => {
      if (!on || document.hidden) return;
      context();
      startMusic();
    },
    destroy: () => {
      stopMusic();
      document.removeEventListener("visibilitychange", onVisibility);
      void ctx?.close();
      ctx = null;
    },
  };
}
