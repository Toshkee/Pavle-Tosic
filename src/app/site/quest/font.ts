/* The title in dots: a 5x7 pixel alphabet, only the letters the game
   needs, each lit cell one dot. On the title screen the dots fly in from
   a scatter around their place and settle (font cells are world-free, so
   they are laid out in screen space). */

const GLYPHS: Record<string, string[]> = {
  T: ["11111", "..1..", "..1..", "..1..", "..1..", "..1..", "..1.."],
  O: [".111.", "1...1", "1...1", "1...1", "1...1", "1...1", ".111."],
  S: [".1111", "1....", "1....", ".111.", "....1", "....1", "1111."],
  H: ["1...1", "1...1", "1...1", "11111", "1...1", "1...1", "1...1"],
  K: ["1...1", "1..1.", "1.1..", "11...", "1.1..", "1..1.", "1...1"],
  E: ["11111", "1....", "1....", "1111.", "1....", "1....", "11111"],
  Q: [".111.", "1...1", "1...1", "1...1", "1.1.1", "1..1.", ".11.1"],
  U: ["1...1", "1...1", "1...1", "1...1", "1...1", "1...1", ".111."],
  "'": ["..1..", "..1..", ".1...", ".....", ".....", ".....", "....."],
};

export type TitleDot = {
  x: number;
  y: number;
  r: number;
  a: number;
  fromX: number;
  fromY: number;
  delay: number;
};

function rand(seed: number): number {
  const n = Math.sin(seed * 9301.7 + 49297) * 233280;
  return n - Math.floor(n);
}

/* Lays the lines out centred on cx, the first line's top at y. */
export function layoutTitle(
  lines: string[],
  cx: number,
  y: number,
  cell: number,
): TitleDot[] {
  const dots: TitleDot[] = [];
  let seed = 1;
  lines.forEach((line, li) => {
    const width = line.length * 6 * cell - cell;
    const x0 = cx - width / 2;
    const y0 = y + li * 9 * cell;
    [...line].forEach((ch, ci) => {
      const glyph = GLYPHS[ch];
      if (!glyph) return;
      glyph.forEach((row, ry) => {
        [...row].forEach((bit, rx) => {
          if (bit !== "1") return;
          seed++;
          const x = x0 + (ci * 6 + rx) * cell;
          const dy = y0 + ry * cell;
          dots.push({
            x,
            y: dy,
            r: 2.4 + rand(seed) * 1.2,
            a: 0.7 + rand(seed + 0.5) * 0.3,
            fromX: x + (rand(seed + 1) - 0.5) * 320,
            fromY: dy + (rand(seed + 2) - 0.5) * 220,
            delay: rand(seed + 3) * 0.5,
          });
        });
      });
    });
  });
  return dots;
}
