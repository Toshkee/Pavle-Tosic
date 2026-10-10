/* A handful of synthesised blips, no audio files: jump, pick-up, hurt,
   the hop of a goal that will not stay put, and a little chord at the end
   of a mission. Off until the visitor turns it on (the choice is kept in
   localStorage), and the AudioContext is only created on that click, as
   browsers require. */

export type Sound = {
  enabled: () => boolean;
  toggle: () => boolean;
  play: (name: Blip) => void;
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

export function createSound(): Sound {
  let on = false;
  try {
    on = localStorage.getItem(KEY) === "on";
  } catch {}
  let ctx: AudioContext | null = null;

  const play = (name: Blip) => {
    if (!on) return;
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    for (const [freq, length, wave, at] of NOTES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + at);
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.12, now + at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + length + 0.02);
    }
  };

  return {
    enabled: () => on,
    toggle: () => {
      on = !on;
      try {
        localStorage.setItem(KEY, on ? "on" : "off");
      } catch {}
      if (on) play("pick");
      return on;
    },
    play,
  };
}
