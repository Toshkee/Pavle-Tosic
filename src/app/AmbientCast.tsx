"use client";

import { type MotionValue } from "framer-motion";
import RappelDroid from "./RappelDroid";
import PeekCritter, { GuideBubble } from "./GuideCritter";
import {
  CritterKeyframes,
  TerminalCat,
  Daemon,
  Ghost,
  Blob,
  BeetleMk2,
} from "./critterSprites";

/* The ambient cast, recast as TOUR GUIDES. Each character spawns only on the
   section it hosts and POPS UP from behind the bottom terminal bar to speak
   (PeekCritter), sinking back down when its lines are done. The rappel droid
   is the one exception: it keeps its swing on the about section, with its
   commentary pinned to the stage beside the arc.

     about → droid (swings + greets) · stack → slime · work → bug ·
     github → daemon · experience → ghost · contact → cat

   Every line is grounded in this repo — don't add claims the code can't back.
   Mount is instant (the section's own entrance covers the change). Desktop-
   only, non-reduced-motion; the page gates the whole thing. */

/* One shared surfacing spot: inside the terminal bar's width at every
   desktop viewport (bar is centered max-w-6xl), left of the Ask AI dock. */
const RIGHT = 210;

const LINES: Record<string, string[]> = {
  about: [
    "hey, welcome in. let me show you around, I know how this place is wired.",
    "this right half is a section deck: one slide on stage at a time, your wheel flips it at the edges.",
    "the rain behind everything is a canvas-2d matrix. every glyph is a pre-blurred sprite, so the bokeh is free. it surges when you switch sections.",
    "me? I swing on two sine waves so I never look like a metronome. flick your scroll hard and I backflip.",
  ],
  stack: [
    "every logo on this slide is a devicon svg bundled at build time. no icon CDN, nothing to go down.",
    "the chips stagger in with framer motion variants. no blur on them, it stacks with backdrop-filter and janks.",
  ],
  work: [
    "one project on stage at a time. ← and → switch them, and the tabs in the window bar are a real case file.",
    "the arch trees, 'what broke' notes and code excerpts were mined from the actual repos, not written from memory.",
    "markets.live streams binance into your browser over one websocket. no backend, honestly live.",
    "I'm the only bug on this page. the double-spend and the IDOR are pinned in the notes tabs.",
  ],
  github: [
    "this card is live. fetched client-side while you watch, cached for five minutes between deck flips.",
    "weeks, not days: the strip aggregates by calendar week so the cadence reads honestly.",
    "I'm a background daemon. I only look like trouble.",
  ],
  experience: [
    "every hash in that log is a real FNV-1a of its entry, so server and client always render the same history.",
    "(HEAD → main) marks where he works now. I haunt the rest of the log.",
  ],
  contact: [
    "no contact form, no backend. a mailto, a clipboard button, and a human who answers within a day.",
    "the whole site ships to cloudflare workers via opennext. the terminal below is real too, try 'help'. purr.",
  ],
};

export default function AmbientCast({
  activeId,
  deckProgress,
}: {
  activeId: string;
  deckProgress: MotionValue<number>;
}) {
  return (
    <>
      <CritterKeyframes />
      {/* The droid swings from screen-centre, BEHIND the text (negative z);
          its bubble sits top-right of the stage, tail aimed at the arc. */}
      {activeId === "about" && (
        <>
          <RappelDroid progress={deckProgress} zIndex={-5} />
          <GuideBubble
            lines={LINES.about}
            style={{ right: 40, top: 96 }}
            tail="left"
          />
        </>
      )}
      {activeId === "stack" && (
        <PeekCritter lines={LINES.stack} right={RIGHT} w={64} h={58}>
          {(look, talking) => <Blob look={look} talking={talking} />}
        </PeekCritter>
      )}
      {activeId === "work" && (
        <PeekCritter lines={LINES.work} right={RIGHT} w={66} h={56}>
          {(_, talking) => (
            // top-down beetle: legs pause while risen, antennae keep sniffing
            <span className={talking ? undefined : "cr-still"}>
              <BeetleMk2 />
            </span>
          )}
        </PeekCritter>
      )}
      {activeId === "github" && (
        <PeekCritter lines={LINES.github} right={RIGHT} w={72} h={82}>
          {(look, talking) => <Daemon look={look} talking={talking} />}
        </PeekCritter>
      )}
      {/* The experience log runs text to the bottom edge, so there is no
          clear ground for an auto-opened bubble — the ghost lurks and only
          speaks when clicked. */}
      {activeId === "experience" && (
        <PeekCritter
          lines={LINES.experience}
          right={RIGHT}
          w={64}
          h={68}
          autoPlay={false}
        >
          {(look, talking) => <Ghost look={look} talking={talking} />}
        </PeekCritter>
      )}
      {activeId === "contact" && (
        <PeekCritter lines={LINES.contact} right={RIGHT} w={72} h={78}>
          {(look, talking) => <TerminalCat look={look} talking={talking} />}
        </PeekCritter>
      )}
    </>
  );
}
