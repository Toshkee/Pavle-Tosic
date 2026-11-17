/* The site's own tokens (src/app/globals.css), so the film is drawn in the
   same ink as the pages it advertises. */

export const FPS = 60;
export const W = 1920;
export const H = 1080;
// The scenes that rebuild a page lay it out in the site's own px, on a
// 1280x720 stage, and the camera shows it at 1.5x.
export const STAGE_W = 1280;
export const STAGE_H = 720;
export const STAGE_SCALE = W / STAGE_W;

export const SANS =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Claude's orange: the cursor trail, and the Quest's bugs.
export const CLAY = "#d97757";

export type Theme = {
  dark: boolean;
  bg: string;
  surface: string;
  plate: string;
  ink: string;
  body: string;
  faint: string;
  line: string;
  lineStrong: string;
  send: string;
};

export const LIGHT: Theme = {
  dark: false,
  bg: "#ffffff",
  surface: "#f7f7f8",
  plate: "#f4f4f5",
  ink: "#0a0a0a",
  body: "#0a0a0a",
  faint: "#0a0a0a",
  line: "#e4e4e7",
  lineStrong: "#d4d4d8",
  send: "#0a0a0a",
};

export const DARK: Theme = {
  dark: true,
  bg: "#0a0a0a",
  surface: "#161618",
  plate: "#1c1c1f",
  ink: "#fafafa",
  body: "#e4e4e7",
  faint: "#c4c4cc",
  line: "#27272a",
  lineStrong: "#3f3f46",
  send: "#2563eb",
};

/* The film's clock: 120 beats a minute, so a beat is 30 frames and a bar
   is two seconds. Every scene starts on a bar. */
export const BEAT = 30;
export const BAR = 120;

export const SCENES = {
  open: { from: 0, to: 240 },
  title: { from: 210, to: 600 },
  site: { from: 570, to: 1584 },
  work: { from: 1560, to: 2400 },
  numbers: { from: 2400, to: 2760 },
  fit: { from: 2760, to: 3240 },
  quest: { from: 3240, to: 3600 },
  end: { from: 3600, to: 4020 },
} as const;
export const DURATION = 4020;
