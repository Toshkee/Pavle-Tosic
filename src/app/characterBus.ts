/* Tiny shared blackboard the ambient characters read to feel "aware" of the
   site. Plain mutable fields — written by their owners each frame/tick and
   read elsewhere; never touches React state, so no re-renders.

   - section:    the active deck section id (updated by the page shell). The
                 droid keeps waving while its home section is up.
   - marketMood: −1..1, written by the live Binance ticker while it's on screen
                 (mean direction of the 24h moves). 0 when the ticker is closed.
                 The droid cheers on green, sags on red. */
export const pageCtx = {
  section: "",
  marketMood: 0,
};
