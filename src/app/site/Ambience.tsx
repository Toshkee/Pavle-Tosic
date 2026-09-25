/* The backdrop's weather: one particle set per scene, all small soft
   points of light over the paintings. MorphBackdrop mounts this inside its
   fixed layer and sets data-scene (the section id owning the viewport) and
   data-paused (hero covering the screen, or tab hidden) on the wrapper, so
   switching scene is an attribute flip: no state, no re-render. Only the
   active set is displayed (globals.css, AMBIENCE), so the other sets'
   animations never run.

   - fireflies: slow wanderers that blink (about: the countryside at dusk)
   - motes: warm dust rising through the sunset glow (work, clients: the
     sky islands)
   - twinkle: stars that swell and fade in place (stack: the moonlit sky)
   - spray: mist lifting off the water at the bottom edge (log, contact:
     the night train over the sea)

   Positions, sizes and timings come from a fixed hash of the index, not
   Math.random, so the server and client markup match. Transform and
   opacity only; nothing renders under reduced motion. */

type AmbSet = { kind: "spray" | "fireflies" | "motes" | "twinkle"; count: number };

const SETS: AmbSet[] = [
  { kind: "spray", count: 18 },
  { kind: "fireflies", count: 22 },
  { kind: "motes", count: 18 },
  { kind: "twinkle", count: 16 },
];

// 0..1, stable per (i, salt). Integer-only 32-bit mixing (Math.imul and
// shifts), so every JS engine produces the same markup: Math.sin can differ
// in its last bits between V8 and JavaScriptCore, a hydration mismatch.
const hash = (i: number, salt: number) => {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(salt, 0x5f356495);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
};

export default function Ambience() {
  return (
    <>
      {SETS.map(({ kind, count }) => (
        <div key={kind} className={`amb amb--${kind}`}>
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              style={
                {
                  "--x": `${(hash(i, 1) * 100).toFixed(2)}vw`,
                  "--y": `${(hash(i, 2) * 100).toFixed(2)}vh`,
                  "--s": (0.6 + hash(i, 3) * 0.8).toFixed(2),
                  "--dur": `${(0.8 + hash(i, 4) * 0.6).toFixed(2)}`,
                  "--delay": `${(-hash(i, 5) * 20).toFixed(2)}s`,
                  "--sway": `${((hash(i, 6) - 0.5) * 16).toFixed(2)}vw`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </>
  );
}
