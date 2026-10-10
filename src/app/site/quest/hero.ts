/* The hero: Pavle's PixelLab character (straw hat, white robe, a
   longsword slightly too big for them), exported from pixellab.ai as a
   124 px-cell sprite sheet, the East direction only, six rows:
   idle, death, walk, roll, hurt, attack. public/images/quest/hero.png is
   that export minus the rotations row, re-encoded without metadata.
   There is no jump animation (generations are scarce), so the single
   jump holds the leap pose of the roll and the double jump plays the
   roll's somersault frames. Drawn at 2x with smoothing off; he faces
   east and is flipped for west. */

export const HERO_SHEET = "/images/quest/hero.png";
export const CELL = 124;
// Where the character sits in a cell: feet on this row, body on this column.
export const FEET = 92;
export const CENTER = 64;
export const HERO_SCALE = 2;

export type HeroAnim = "idle" | "death" | "walk" | "roll" | "hurt" | "attack";

export const HERO: Record<HeroAnim, { row: number; frames: number; fps: number }> = {
  idle: { row: 0, frames: 4, fps: 6 },
  death: { row: 1, frames: 7, fps: 10 },
  walk: { row: 2, frames: 6, fps: 10 },
  roll: { row: 3, frames: 7, fps: 16 },
  hurt: { row: 4, frames: 6, fps: 12 },
  attack: { row: 5, frames: 7, fps: 14 },
};

// The roll frame that reads as a leap, for the single jump.
export const LEAP_FRAME = 2;
// The somersault frames of the roll, for the double jump.
export const FLIP_FRAMES = [3, 4, 5, 6];
