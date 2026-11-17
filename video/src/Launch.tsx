import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence } from "remotion";
import { BAR, DURATION, SCENES } from "./lib/theme";
import score from "./score.wav";
import sfx from "./sfx.wav";
import { End } from "./scenes/End";
import { Fit } from "./scenes/Fit";
import { Numbers } from "./scenes/Numbers";
import { Open } from "./scenes/Open";
import { Quest } from "./scenes/Quest";
import { Site } from "./scenes/Site";
import { Title } from "./scenes/Title";
import { Work } from "./scenes/Work";

/* The launch film: a model announcement, for a developer. Eight scenes on
   a 120 bpm clock (lib/theme.ts); a scene that opens over the one before
   it (the circle from a click, the wipe into the work) starts a few frames
   early. The score is "Shadowfall Rise" from ElevenLabs Music (Pavle's
   Starter plan, so it is licensed for this; 67 s at 120 bpm, src/score.wav),
   started one bar late so its four-bar hits land on the cut into the work
   (frame 1560) and its last one on the end card's click (3840). Under it,
   src/sfx.wav: the clicks, the typing and the game, synthesised to the
   frame by scripts/music.mjs (npm run sfx). `npm run music` still writes
   the old all-synth track to src/music.wav, which nothing imports now. */
const SCORE_FROM = BAR;
// The score's own tail is cut by the film's end: fade it with the picture.
const scoreVolume = (f: number) =>
  interpolate(f, [DURATION - SCORE_FROM - 90, DURATION - SCORE_FROM], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const scene = (key: keyof typeof SCENES, node: React.ReactNode) => (
  <Sequence
    key={key}
    name={key}
    from={SCENES[key].from}
    durationInFrames={SCENES[key].to - SCENES[key].from}
  >
    {node}
  </Sequence>
);

export const Launch: React.FC = () => (
  <AbsoluteFill style={{ background: "#0a0a0a" }}>
    <Sequence from={SCORE_FROM} layout="none">
      <Audio src={score} volume={scoreVolume} />
    </Sequence>
    {/* Normalised to a 0.89 peak by the script: at half, a click sits just
        over the score without jumping out of it. */}
    <Audio src={sfx} volume={0.5} />
    {scene("open", <Open />)}
    {scene("title", <Title />)}
    {scene("site", <Site />)}
    {scene("work", <Work />)}
    {scene("numbers", <Numbers />)}
    {scene("fit", <Fit />)}
    {scene("quest", <Quest />)}
    {scene("end", <End />)}
  </AbsoluteFill>
);
