/* Pixel art as text, one character per pixel: the bugs and the things to
   pick up. (The hero is a PixelLab sprite sheet, see hero.ts.) The bugs
   are coral, Clawd's colour: in a grey world the one warm tone means
   danger (pit walls and ledge tops share it, in dots.ts), and the blue
   glow means something to collect. Each frame is rendered once per scale
   to an offscreen canvas and then blitted. */

export type Frame = { rows: string[]; pal: Record<string, string> };

const BUG_PAL = { d: "#d97757", w: "#ffffff", e: "#7a3620" };
export const BUG: Frame[] = [
  {
    pal: BUG_PAL,
    rows: ["..d..d..", ".dddddd.", "dwddddwd", "dddddddd", ".d.dd.d.", "d..dd..d"],
  },
  {
    pal: BUG_PAL,
    rows: ["..d..d..", ".dddddd.", "dwddddwd", "dddddddd", "d.dddd.d", ".d.dd.d."],
  },
];

/* The big one: the same shape with a dark stripe, drawn at a larger scale. */
export const BIG_BUG: Frame[] = [
  {
    pal: BUG_PAL,
    rows: ["..d..d..", ".dddddd.", "dwddddwd", "ddeddedd", ".d.dd.d.", "d..dd..d"],
  },
  {
    pal: BUG_PAL,
    rows: ["..d..d..", ".dddddd.", "dwddddwd", "ddeddedd", "d.dddd.d", ".d.dd.d."],
  },
];

export type PickupKind = "page" | "crate" | "checkin" | "flag" | "bell";

const ITEM_PAL = {
  w: "#f4f1e8",
  l: "#9a9a9a",
  c: "#a8865a",
  C: "#6e5436",
  t: "#2f7cf6",
  g: "#d8b45a",
  G: "#a8843a",
};

export const PICKUPS: Record<PickupKind, Frame[]> = {
  page: [
    {
      pal: ITEM_PAL,
      rows: [
        "wwwwww..",
        "wwwwwww.",
        "wllllwww",
        "wwwwwwww",
        "wllllllw",
        "wwwwwwww",
        "wlllllww",
        "wwwwwwww",
        "wllllllw",
        "wwwwwwww",
      ],
    },
  ],
  crate: [
    {
      pal: ITEM_PAL,
      rows: [
        "CCCCCCCCCC",
        "CCccccccCC",
        "CcCccccCcC",
        "CccCccCccC",
        "CcccCCcccC",
        "CcccCCcccC",
        "CccCccCccC",
        "CcCccccCcC",
        "CCccccccCC",
        "CCCCCCCCCC",
      ],
    },
  ],
  checkin: [
    {
      pal: ITEM_PAL,
      rows: [
        "..tttt..",
        ".tttttt.",
        "tttttttt",
        "ttttttwt",
        "twtttwtt",
        "ttwtwttt",
        ".tttwtt.",
        "..tttt..",
      ],
    },
  ],
  flag: [
    {
      pal: ITEM_PAL,
      rows: [
        "ltttttt...",
        "ltttttttt.",
        "ltttttttt.",
        "lttttttt..",
        "ltttt.....",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
      ],
    },
    {
      pal: ITEM_PAL,
      rows: [
        "lttttt....",
        "lttttttt..",
        "ltttttttt.",
        "ltttttttt.",
        "ltttt.....",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
        "l.........",
      ],
    },
  ],
  bell: [
    {
      pal: ITEM_PAL,
      rows: [
        "....ll....",
        "...gggg...",
        "..gggggg..",
        "..gggggg..",
        "..ggggGg..",
        ".ggggggGg.",
        "GGGGGGGGGG",
        "....gg....",
      ],
    },
  ],
};

const cache = new Map<Frame, Map<number, HTMLCanvasElement>>();

function rendered(f: Frame, scale: number): HTMLCanvasElement {
  let byScale = cache.get(f);
  if (!byScale) cache.set(f, (byScale = new Map()));
  let canvas = byScale.get(scale);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  canvas.width = f.rows[0].length * scale;
  canvas.height = f.rows.length * scale;
  const ctx = canvas.getContext("2d")!;
  f.rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = f.pal[ch];
      if (!fill) return;
      ctx.fillStyle = fill;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  byScale.set(scale, canvas);
  return canvas;
}

/* Draws a frame with its bottom centre at (x, y). */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  f: Frame,
  x: number,
  y: number,
  scale: number,
  flip = false,
): void {
  const img = rendered(f, scale);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -img.width / 2, -img.height);
  ctx.restore();
}
