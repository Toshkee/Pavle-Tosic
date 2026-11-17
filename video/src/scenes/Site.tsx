import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Memoji } from "../lib/Memoji";
import { inOut, mix, outExpo, p, rise, track, type Pt } from "../lib/motion";
import { CircleReveal, Pointer, Stage, ThemeProvider, toScreen, Wake, type Camera } from "../lib/stage";
import { LIGHT, SANS } from "../lib/theme";
import { AskBar, CvPill, Film, glass, OpenToWork, pill, ThemeToggle, Thinking, Tile, TILES } from "../lib/ui";
import { TOGGLE } from "./Title";

/* The site itself, rebuilt in its own px (Landing.tsx, Chat.tsx,
   ProjectsCard.tsx) so every part can move. First the landing page, close
   on the Memoji while its eyes follow the pointer, then the whole page;
   the Projects tile is clicked and the page becomes the chat, answering
   the way the site does: the question, the Memoji over its laptop and
   "Thinking…", the card, a line of text streaming in under it, and the
   follow-up questions. */

// The landing's centred column, top to bottom.
const GREETING_Y = 93;
const FACE = { x: 528, y: 241, size: 224 };
const BAR_Y = 497;
const TILE_Y = 571;
const TILE_X = 174;
const tileMid = (i: number): Pt => ({ x: TILE_X + i * 118 + 53, y: TILE_Y + 36 });

/* The close shot is 4/3 and no closer: the Memoji is a 448 px frame of a
   Messages recording, shown 224 px wide on the 1.5x stage, so at 4/3 one
   pixel of it is one pixel of the film. Closer, it was enlarged and soft. */
const CLOSE = 4 / 3;

export const SITE_CLICK = 385;
// The chat page takes over here (the scene's own frames).
const CHAT = 450;
const ANSWER = CHAT + 96;
const TEXT = CHAT + 168;
export const CARD_CLICK = CHAT + 512;

const pointer = track([
  { f: 0, x: TOGGLE.x + 2, y: TOGGLE.y + 3 },
  { f: 58, x: 900, y: 280, bend: 0.1 },
  { f: 98, x: 730, y: 540, bend: 0.25 },
  { f: 138, x: 400, y: 410, bend: 0.25 },
  { f: 176, x: 540, y: 170, bend: 0.25 },
  { f: 214, x: 830, y: 250, bend: 0.25 },
  { f: 292, x: tileMid(5).x + 8, y: TILE_Y + 42, bend: -0.1 },
  { f: 366, x: tileMid(1).x + 6, y: TILE_Y + 41, bend: 0.03 },
  { f: CHAT + 120, x: tileMid(1).x + 6, y: TILE_Y + 41 },
  { f: CHAT + 176, x: 930, y: 330, bend: 0.14 },
  { f: CHAT + 452, x: 930, y: 330 },
  { f: CHAT + 498, x: 800, y: 290, bend: -0.1 },
]);

const PROJECTS = [
  { title: "Reform Fitness", context: "Vaky, October 2026", shot: "reform-fitness-home" },
  { title: "Distinct", context: "Vaky, October 2026", shot: "distinct" },
  { title: "Infostream", context: "Infostream, May to October 2026", shot: "infostream" },
  { title: "Vaky.me", context: "Vaky, since August 2026", shot: "vaky" },
  { title: "CryptoFlow", context: "General Assembly, rebuilt 2026", shot: "cryptoflow-landing" },
  { title: "Ronin Duel", context: "General Assembly, rebuilt 2026", shot: "ronin-duel" },
  { title: "Arc: Anime Tracker", context: "General Assembly, rebuilt 2026", shot: "anime-watchlist" },
  { title: "Meet2Explore", context: "General Assembly, 2025", shot: "meet2explore" },
  { title: "Villa Vučje", context: "Freelance, September 2026", shot: "villavucje-hero" },
  { title: "Mandarina, Petrovac", context: "Freelance, September 2026", shot: "mandarina-hero" },
];

const FOOT = ["About", "Case studies", "How it's built", "GitHub", "LinkedIn", "Privacy"];

/* The text under the card, a word at a time as the stream brings it. Not
   a quote of the model: a line written for the film from the same facts
   (the projects' `context` in projects.ts), saying nothing the card says. */
const REPLY =
  "Ten so far: client work, the Infostream site and my own builds. Open a card for more.".split(" ");
const WORD = 2.6; // frames a word
// QuickQuestions.tsx FOLLOW_UPS.projects, as the site shows them.
const FOLLOW_UPS = ["Which project are you proudest of?", "Tell me about Reform Fitness", "What do you build with?"];

export const Site: React.FC = () => {
  const frame = useCurrentFrame();
  const open = p(frame, 0, 44, inOut);

  // Close on the face, then the whole page.
  const pull = p(frame, 188, 92, inOut);
  const camera: Camera = { zoom: mix(CLOSE, 1, pull), cx: 640, cy: mix(354, 360, pull) };

  const headerIn = p(frame, 196, 84, rise);
  const bottomIn = p(frame, 208, 84, rise);
  // Landing out, chat in.
  const leave = p(frame, SITE_CLICK + 7, 52, inOut);
  const footIn = p(frame, SITE_CLICK + 16, 60, rise);
  const busy = frame >= CHAT + 28 && frame < ANSWER;
  const card = p(frame, ANSWER, 36, inOut);
  // The conversation scrolls up as the answer grows, as the chat does.
  // (The card's rail is 16:10 windows since c1c45dd, 58 px shorter than the
  // tall cards, so the text sits 56 px higher and the page scrolls less.)
  const scrollY = -32 * card - 30 * p(frame, TEXT - 14, 44, inOut);

  const face = {
    x: mix(mix(FACE.x, 592, leave), 608, card),
    y: mix(FACE.y, 20, leave) - 4 * card,
    size: mix(mix(FACE.size, 96, leave), 64, card),
  };
  const laptop = p(frame, CHAT + 28, 10, outExpo) - p(frame, ANSWER - 4, 10);

  const at = pointer(frame);
  // One card and its gap a step (ProjectsCard.tsx: w-96 and gap-4).
  const scroll =
    400 *
    (p(frame, CHAT + 270, 46, outExpo) +
      p(frame, CHAT + 340, 46, outExpo) +
      p(frame, CHAT + 410, 46, outExpo));
  const words = Math.max(1, Math.floor((frame - TEXT) / WORD));

  return (
    <ThemeProvider value={LIGHT}>
      <CircleReveal at={toScreen(TOGGLE)} open={open}>
        <AbsoluteFill style={{ fontFamily: SANS, color: LIGHT.ink }}>
          <Film theme={LIGHT} zoom={mix(1.06, 1, pull)} />
          <Wake cursor={pointer} camera={camera} />
          <Stage camera={camera}>
            {/* The giant handle behind the landing page. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -40,
                textAlign: "center",
                fontSize: 240,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.025em",
                backgroundImage:
                  "linear-gradient(to bottom, rgba(10,10,10,.3), rgba(10,10,10,0) 92%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                opacity: 1 - leave,
              }}
            >
              Toshkee
            </div>

            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                right: 16,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", gap: 8, transform: `translateY(${leave * -70}px)` }}>
                <OpenToWork />
                <CvPill />
              </div>
              <ThemeToggle />
            </div>

            {/* The header drops in from above, as `.rise` does on the site. */}
            <div
              style={{
                position: "absolute",
                top: GREETING_Y,
                width: "100%",
                textAlign: "center",
                transform: `translateY(${(1 - headerIn) * -330 + leave * -300}px)`,
              }}
            >
              <div style={{ fontSize: 24, lineHeight: "32px", fontWeight: 600 }}>Hey, I'm Pavle</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 72,
                  lineHeight: "72px",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                }}
              >
                Software developer
              </div>
            </div>

            {/* The question box, the tiles and the footer links rise from below. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateY(${(1 - bottomIn) * 380 + leave * 300}px)`,
              }}
            >
              <AskBar style={{ position: "absolute", left: 384, top: BAR_Y }} text="" />
              {TILES.map((tile, i) => {
                const pop = p(frame, 214 + i * 4, 60, outExpo);
                const mid = tileMid(i);
                const over =
                  at && Math.abs(at.x - mid.x) < 53 && Math.abs(at.y - mid.y) < 36 ? 1 : 0;
                const down = i === 1 && frame >= SITE_CLICK && frame < SITE_CLICK + 8;
                return (
                  <Tile
                    key={tile.label}
                    {...tile}
                    hover={over}
                    style={{
                      position: "absolute",
                      left: TILE_X + i * 118,
                      top: TILE_Y,
                      transform: `translateY(${(1 - pop) * 60}px) scale(${down ? 0.95 : 1})`,
                    }}
                  />
                );
              })}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 16,
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {FOOT.map((label) => (
                  <div key={label} style={{ ...pill(LIGHT), padding: "4px 12px", fontSize: 13, fontWeight: 400 }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* ---- the chat ----
                Its scroll area, fading out under the Memoji as the site's
                does (the mask on <main> in Chat.tsx). */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 92,
                width: 1280,
                height: 524,
                overflow: "hidden",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20px)",
                maskImage: "linear-gradient(to bottom, transparent, black 20px)",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: -92, width: 1280, transform: `translateY(${scrollY}px)` }}>
                {frame >= CHAT + 8 && (
                  <div
                    style={{
                      position: "absolute",
                      right: 272,
                      top: 148,
                      borderRadius: "24px 24px 8px 24px",
                      background: LIGHT.surface,
                      padding: "10px 16px",
                      fontSize: 15,
                      lineHeight: "22px",
                      whiteSpace: "nowrap",
                      opacity: p(frame, CHAT + 8, 5),
                      transform: `translateY(${(1 - p(frame, CHAT + 8, 18, outExpo)) * 12}px)`,
                    }}
                  >
                    What are your projects? What have you built recently?
                  </div>
                )}
                {busy && (
                  <div
                    style={{
                      ...glass(LIGHT),
                      position: "absolute",
                      left: 272,
                      top: 214,
                      borderRadius: 999,
                      padding: "10px 16px",
                      fontSize: 15,
                      lineHeight: "22px",
                      transform: `translateY(${(1 - p(frame, CHAT + 28, 18, outExpo)) * 12}px)`,
                    }}
                  >
                    <Thinking />
                  </div>
                )}

                {/* The projects card: the rail of photo cards, each window the
                    screenshot's own 16:10 shape (ProjectsCard.tsx since
                    c1c45dd), so a site shows edge to edge. */}
                {frame >= ANSWER && (
                  <div
                    style={{
                      position: "absolute",
                      left: 256,
                      top: 214,
                      width: 1024,
                      height: 326,
                      overflow: "hidden",
                      WebkitMaskImage: "linear-gradient(to right, transparent, black 16px)",
                      maskImage: "linear-gradient(to right, transparent, black 16px)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 16, transform: `translateX(${16 - scroll}px)` }}>
                      {PROJECTS.map((project, i) => {
                        const arrive = p(frame, ANSWER + i * 5, 54, outExpo);
                        const hit = frame >= CARD_CLICK && frame < CARD_CLICK + 8 && i === 4;
                        return (
                          <div
                            key={project.title}
                            style={{
                              width: 384,
                              flexShrink: 0,
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                              borderRadius: 24,
                              background: LIGHT.plate,
                              transform: `translateX(${(1 - arrive) * 1000}px) scale(${hit ? 0.97 : 1})`,
                            }}
                          >
                            <div style={{ padding: "20px 20px 16px" }}>
                              <div style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500 }}>
                                {project.context}
                              </div>
                              <div style={{ marginTop: 4, fontSize: 24, lineHeight: "32px", fontWeight: 700 }}>
                                {project.title}
                              </div>
                            </div>
                            <div
                              style={{
                                position: "relative",
                                height: 225,
                                margin: "0 12px 12px",
                                overflow: "hidden",
                                borderRadius: 16,
                              }}
                            >
                              <Img
                                src={staticFile(`images/projects/${project.shot}.webp`)}
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  objectPosition: "top",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* The text of the answer, in its glass bubble, as it streams. */}
                {frame >= TEXT && (
                  <div
                    style={{
                      ...glass(LIGHT),
                      position: "absolute",
                      left: 272,
                      top: 562,
                      borderRadius: "8px 24px 24px 24px",
                      padding: "16px 24px",
                      fontSize: 16,
                      lineHeight: "26px",
                      whiteSpace: "nowrap",
                      transform: `translateY(${(1 - p(frame, TEXT, 18, outExpo)) * 12}px)`,
                    }}
                  >
                    {REPLY.slice(0, words).join(" ")}
                  </div>
                )}
                <div style={{ position: "absolute", left: 272, top: 640, display: "flex", gap: 8 }}>
                  {FOLLOW_UPS.map((prompt, i) => {
                    const from = TEXT + REPLY.length * WORD + 10 + i * 5;
                    if (frame < from) return null;
                    return (
                      <div
                        key={prompt}
                        style={{
                          ...pill(LIGHT),
                          background: LIGHT.bg,
                          padding: "6px 14px",
                          fontWeight: 400,
                          transform: `translateY(${(1 - p(frame, from, 18, outExpo)) * 12}px)`,
                        }}
                      >
                        {prompt}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* The chat's footer: its question box and the line under it. */}
            <div
              style={{
                position: "absolute",
                left: 272,
                top: 628,
                width: 736,
                transform: `translateY(${(1 - footIn) * 200}px)`,
              }}
            >
              <AskBar chat width={736} text="" />
              <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, lineHeight: "16px" }}>
                An AI answers for me, from what I wrote down. It can get things wrong:{" "}
                <span style={{ textDecoration: "underline", textDecorationColor: LIGHT.lineStrong, textUnderlineOffset: 3 }}>
                  how this works
                </span>
                .
              </div>
            </div>

            {/* The face: the landing's Memoji becomes the chat's avatar, and
                peeks over its laptop while the answer is on its way. */}
            <Memoji {...face} cursor={pointer} style={{ opacity: 1 - laptop }} />
            {laptop > 0 && (
              <Img
                src={staticFile("images/memoji-laptop.webp")}
                style={{
                  position: "absolute",
                  left: face.x,
                  top: face.y,
                  width: face.size,
                  height: face.size,
                  objectFit: "contain",
                  opacity: laptop,
                  transform: `scale(${0.9 + 0.1 * laptop})`,
                }}
              />
            )}

            <Pointer cursor={pointer} clicks={[SITE_CLICK, CARD_CLICK]} />
          </Stage>
        </AbsoluteFill>
      </CircleReveal>
    </ThemeProvider>
  );
};
