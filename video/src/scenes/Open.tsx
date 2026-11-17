import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import fists from "../clips/fists.mp4";
import opening from "../clips/opening.mp4";
import { p, track, typed, outExpo } from "../lib/motion";
import { Pointer, Stage, ThemeProvider, Wake } from "../lib/stage";
import { BAR, DARK, SANS } from "../lib/theme";
import { AskBar, Shot } from "../lib/ui";

/* Cold open: the site's question box and the one question a recruiter
   arrives with, over the film's first two shots: a hand wrap drifting
   through the dark for a bar, then the statue's wrapped fists for the
   next. The click on the send button opens the title. */
// Darker behind the question box, so it reads over either shot.
const SHADE =
  "radial-gradient(ellipse 46% 26% at 50% 50%, rgba(10,10,10,.55), rgba(10,10,10,.12) 70%)";
export const QUESTION = "Who is Pavle Tošić?";
// The send button's middle, on the stage: where the pointer lands and
// where the title opens from.
export const SEND = { x: 922, y: 360 };
export const OPEN_CLICK = 196;

export const openPointer = track([
  { f: 92, x: 1150, y: 730 },
  { f: 178, x: SEND.x + 3, y: SEND.y + 2, bend: -0.16 },
]);

export const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const arrive = p(frame, 4, 40, outExpo);
  const press = p(frame, OPEN_CLICK, 4) - p(frame, OPEN_CLICK + 5, 9);
  const text = typed(QUESTION, frame, 34, 4.6);
  return (
    <ThemeProvider value={DARK}>
      <AbsoluteFill style={{ background: "#0a0a0a", fontFamily: SANS }}>
        <Shot src={opening} shade={SHADE} style={{ opacity: p(frame, 0, 24) }} />
        <Sequence from={BAR} layout="none">
          <Shot src={fists} shade={SHADE} />
        </Sequence>
        <Wake cursor={openPointer} gain={1.2} />
        <Stage>
          <AskBar
            width={620}
            text={text}
            caret
            press={press}
            style={{
              position: "absolute",
              left: 330,
              top: 331,
              opacity: arrive,
              transform: `translateY(${(1 - arrive) * 18}px)`,
            }}
          />
          <Pointer cursor={openPointer} clicks={[OPEN_CLICK]} />
        </Stage>
      </AbsoluteFill>
    </ThemeProvider>
  );
};
