/* Tiny shared blackboard so the two ambient characters can notice each other
   (the bug strolls over to the droid; the droid looks down and waves back) and
   react to what's happening on the page. Plain mutable fields — written by
   their owners each frame/tick and read by the other side; never touches React
   state, so no re-renders. */

export const bugPos = { x: -9999, y: -9999, active: false };
export const droidPos = { x: -9999, y: -9999, active: false };

/* Page context the characters read to feel "aware" of the site (see #3):
   - section:    the active deck section id (updated by the page shell). A
                 change is a cue — the droid flips, the bug spins.
   - marketMood: −1..1, written by the live Binance ticker while it's on screen
                 (mean direction of the 24h moves). 0 when the ticker is closed.
                 The droid cheers on green, sags on red.
   - project:    screen-space centre of the active Work project card, published
                 while the Work section is mounted — the bug crawls onto it.
   - content:    screen-space centre of the deck content column — the anchor an
                 "on-duty" critter posts up beside on its home section. */
export const pageCtx = {
  section: "",
  marketMood: 0,
  project: { x: -9999, y: -9999, active: false },
  content: { x: -9999, y: -9999, active: false },
};
