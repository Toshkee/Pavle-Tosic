"use client";

import { type MotionValue } from "framer-motion";
import RappelDroid from "./RappelDroid";
import WalkingBug from "./WalkingBug";
import Roamer from "./Roamer";
import {
  CritterKeyframes,
  TerminalCat,
  Daemon,
  Ghost,
  Blob,
} from "./critterSprites";

/* The whole ambient cast — but each character SPAWNS only on the section it
   hosts and is gone everywhere else, so there's exactly one critter on stage
   at a time:

     about → droid (greets) · stack → slime (bounces) · work → bug (inspects) ·
     github → daemon (spins) · experience → ghost (haunts) · contact → cat (sits)

   Mount is instant (the section's own entrance cinematic covers the change) —
   no fade, so it never depends on an animation frame to unmount. Desktop-only,
   non-reduced-motion; the page gates the whole thing. */
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
      {/* The droid swings from screen-centre, BEHIND the text (negative z). */}
      {activeId === "about" && <RappelDroid progress={deckProgress} zIndex={-5} />}
      {activeId === "stack" && (
        <Roamer
          w={64} h={58} speed={90} start={{ x: 1080, y: 440 }}
          homeSection="stack" task="bounce"
        >
          {(look) => <Blob look={look} />}
        </Roamer>
      )}
      {activeId === "work" && <WalkingBug overZ={30} underZ={-6} />}
      {activeId === "github" && (
        <Roamer
          w={72} h={82} speed={80} start={{ x: 880, y: 180 }}
          homeSection="github" task="spin"
        >
          {(look) => <Daemon look={look} />}
        </Roamer>
      )}
      {activeId === "experience" && (
        <Roamer
          w={64} h={68} speed={60} start={{ x: 560, y: 520 }}
          homeSection="experience" task="haunt"
        >
          {(look) => <Ghost look={look} />}
        </Roamer>
      )}
      {activeId === "contact" && (
        <Roamer
          w={72} h={78} speed={70} start={{ x: 140, y: 360 }}
          homeSection="contact" task="bounce"
        >
          {(look) => <TerminalCat look={look} />}
        </Roamer>
      )}
    </>
  );
}
