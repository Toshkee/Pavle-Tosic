import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import closing from "../clips/closing.mp4";
import turn from "../clips/turn.mp4";
import { inOut, outExpo, p, track, typed } from "../lib/motion";
import { Pointer, Stage, ThemeProvider, Wake } from "../lib/stage";
import { BAR, CLAY, LIGHT, MONO, SANS } from "../lib/theme";
import { AskBar, pill, Shot } from "../lib/ui";

/* The end card. For its first bar the statue turns from obsidian to marble
   (the site's dark still to its light one, played at 2.5x), then he stands
   at rest and the page is light: one last question down the left, and its
   answer is the site's own "Open to work" (the availability is content.ts
   SPEC, word for word), then where to ask the rest. No Memoji here: a
   second face beside the statue's read badly. */
const ASK = "Are you open to work?";
const URL = "pavletosic.com";
const LINES = ["Ask him", "anything."];
// The click lands on the film's last chord (scripts/music.mjs).
const CLICK = 2 * BAR;
const LEFT = 88;
const BAR_AT = { left: LEFT, top: 400, width: 440 };
const SEND = { x: BAR_AT.left + BAR_AT.width - 28, y: BAR_AT.top + 29 };
// Paler on the left, under the type.
const SHADE =
  "linear-gradient(to right, rgba(255,255,255,.62), rgba(255,255,255,.28) 40%, transparent 58%)";

const pointer = track([
  { f: BAR + 26, x: 250, y: 700 },
  { f: CLICK - 10, x: SEND.x + 3, y: SEND.y + 2, bend: 0.16 },
  { f: CLICK + 28, x: SEND.x + 3, y: SEND.y + 2 },
  { f: CLICK + 92, x: 470, y: 640, bend: -0.2 },
]);

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeIn = p(frame, 0, 10);
  const fadeOut = p(frame, 384, 36, inOut);
  const bar = p(frame, BAR + 18, 50, outExpo);
  const press = p(frame, CLICK, 4) - p(frame, CLICK + 5, 9);
  const answer = p(frame, CLICK + 16, 40, outExpo);
  const url = typed(URL, frame, CLICK + 40, 2.6);
  const rule = p(frame, CLICK + 80, 44, outExpo);
  return (
    <ThemeProvider value={LIGHT}>
      <AbsoluteFill style={{ fontFamily: SANS, color: LIGHT.ink, background: "#0a0a0a" }}>
        <Shot src={turn} />
        {/* The standing statue comes up through the last of the turn: both
            frames are pale by then, so the change of pose reads as a dissolve. */}
        <Sequence from={BAR - 14} layout="none">
          <Shot src={closing} rate={0.94} shade={SHADE} style={{ opacity: p(frame, BAR - 14, 18) }} />
        </Sequence>
        <Wake cursor={pointer} gain={1.3} />
        <Stage>
          {LINES.map((text, i) => (
            <div
              key={text}
              style={{
                position: "absolute",
                top: 150 + i * 104,
                left: LEFT,
                clipPath: "inset(0 -120px)",
                height: 118,
              }}
            >
              <div
                style={{
                  fontSize: 104,
                  lineHeight: "118px",
                  fontWeight: 800,
                  letterSpacing: "-0.045em",
                  transform: `translateY(${(1 - p(frame, BAR + 2 + i * 8, 56, outExpo)) * 105}%)`,
                }}
              >
                {text}
              </div>
            </div>
          ))}

          <AskBar
            width={BAR_AT.width}
            text={typed(ASK, frame, BAR + 30, 3.2)}
            caret={frame < CLICK}
            press={press}
            style={{
              position: "absolute",
              left: BAR_AT.left,
              top: BAR_AT.top,
              opacity: bar,
              transform: `translateY(${(1 - bar) * 30}px)`,
            }}
          />

          {/* The answer. */}
          <div
            style={{
              position: "absolute",
              left: LEFT,
              top: 484,
              transformOrigin: "0 50%",
              opacity: p(frame, CLICK + 16, 8),
              transform: `translateY(${(1 - answer) * 14}px) scale(${0.94 + 0.06 * answer})`,
            }}
          >
            <div style={{ ...pill(LIGHT), padding: "10px 18px", fontSize: 16 }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: "#10b981", boxShadow: "0 0 12px #10b981" }} />
              Open to work
              <span style={{ fontWeight: 400 }}>· remote roles, mostly part-time</span>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: LEFT + 2,
              top: 556,
              fontFamily: MONO,
              fontSize: 40,
              lineHeight: "52px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            <span style={{ position: "relative", display: "inline-block", minHeight: 52 }}>
              {url}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: -6,
                  height: 3,
                  width: `${rule * 100}%`,
                  background: CLAY,
                  opacity: url.length === URL.length ? 1 : 0,
                }}
              />
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: LEFT + 2,
              bottom: 30,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.04em",
              opacity: p(frame, CLICK + 96, 30),
            }}
          >
            The chat runs on Claude Haiku 5.5 and answers from what he wrote down.
          </div>

          <Pointer cursor={pointer} clicks={[CLICK]} />
        </Stage>
        <AbsoluteFill style={{ background: "#0a0a0a", opacity: 1 - fadeIn + fadeOut }} />
      </AbsoluteFill>
    </ThemeProvider>
  );
};
