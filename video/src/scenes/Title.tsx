import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import hero from "../clips/hero.mp4";
import { inOut, outExpo, p, track, typed } from "../lib/motion";
import { CircleReveal, Pointer, Stage, ThemeProvider, toScreen, Wake } from "../lib/stage";
import { DARK, MONO, SANS, STAGE_W } from "../lib/theme";
import { CvPill, OpenToWork, Shot, ThemeToggle } from "../lib/ui";
import { SEND } from "./Open";

/* The title card, the way a model is announced, for a developer: the
   statue in his guard, seen from below (the film's third shot, slowed to
   last the scene), his name down the left where the frame is dark, and
   what is new about the portfolio. It opens as a circle from the send
   button and closes on the theme toggle, whose click opens the light page
   (the site's own transition). */
export const TOGGLE = { x: STAGE_W - 16 - 20, y: 36 };
export const TITLE_CLICK = 356;

const NAME = ["Pavle", "Tošić"];
const LINES = ["Software developer.", "Now taking questions."];
const LEFT = 88;
// Darker on the left, under the type.
const SHADE =
  "linear-gradient(to right, rgba(10,10,10,.72), rgba(10,10,10,.3) 42%, transparent 62%), linear-gradient(to top, rgba(10,10,10,.6), transparent 16%)";
// Each letter is its own box, so the font's pair kerning is lost: these put
// the two pairs that show it back, in em.
const KERN: Record<string, number> = { To: -0.075, Pa: -0.02 };

export const titlePointer = track([
  { f: 0, x: SEND.x + 3, y: SEND.y + 2 },
  { f: 150, x: SEND.x + 3, y: SEND.y + 2 },
  { f: 208, x: 240, y: 600, bend: -0.22 },
  { f: 272, x: 1040, y: 590, bend: -0.06 },
  { f: 340, x: TOGGLE.x + 2, y: TOGGLE.y + 3, bend: 0.14 },
]);

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const open = p(frame, 0, 44, inOut);
  const bar = p(frame, 96, 50, outExpo);
  return (
    <ThemeProvider value={DARK}>
      <CircleReveal at={toScreen(SEND)} open={open}>
        <AbsoluteFill style={{ fontFamily: SANS, color: DARK.ink }}>
          {/* 387 frames for a 390-frame scene. */}
          <Shot src={hero} rate={0.98} shade={SHADE} />
          <Wake cursor={titlePointer} gain={1.5} />
          <Stage>
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                right: 16,
                display: "flex",
                justifyContent: "space-between",
                transform: `translateY(${(1 - bar) * -70}px)`,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <OpenToWork />
                <CvPill />
              </div>
              <ThemeToggle pressed={frame >= TITLE_CLICK && frame < TITLE_CLICK + 8} />
            </div>

            <div
              style={{
                position: "absolute",
                top: 176,
                left: LEFT + 6,
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: "0.46em",
                color: DARK.faint,
              }}
            >
              {typed("INTRODUCING", frame, 26, 3)}
            </div>

            {/* Each letter rises out of its own slot; the slot is taller
                than the line so the carons are not cut. */}
            {NAME.map((word, w) => (
              <div
                key={word}
                style={{
                  position: "absolute",
                  top: 196 + w * 142,
                  left: LEFT,
                  display: "flex",
                  fontSize: 150,
                  lineHeight: "176px",
                  fontWeight: 800,
                  letterSpacing: "-0.045em",
                }}
              >
                {[...word].map((ch, i) => {
                  const up = p(frame, 42 + (w * 5 + i) * 3.2, 58, outExpo);
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        // Above and below only: with the tight tracking a
                        // letter is wider than its box, and a box that clips
                        // its sides cut the e and the ć.
                        clipPath: "inset(0 -120px)",
                        height: 176,
                        marginLeft: `${KERN[word.slice(i - 1, i + 1)] ?? 0}em`,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          whiteSpace: "pre",
                          transform: `translateY(${(1 - up) * 105}%)`,
                        }}
                      >
                        {ch}
                      </span>
                    </span>
                  );
                })}
              </div>
            ))}

            {LINES.map((text, i) => (
              <div
                key={text}
                style={{
                  position: "absolute",
                  top: 520 + i * 38,
                  left: LEFT + 6,
                  clipPath: "inset(0 -120px)",
                  height: 38,
                }}
              >
                <div
                  style={{
                    fontSize: 27,
                    lineHeight: "38px",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    color: i ? DARK.faint : DARK.body,
                    transform: `translateY(${(1 - p(frame, 112 + i * 10, 54, outExpo)) * 110}%)`,
                  }}
                >
                  {text}
                </div>
              </div>
            ))}

            <Pointer cursor={titlePointer} clicks={[TITLE_CLICK]} />
          </Stage>
        </AbsoluteFill>
      </CircleReveal>
    </ThemeProvider>
  );
};
