import type { PickupKind } from "./sprites";

/* The five missions, each a small story from Pavle's own work (the
   wrangler deploy that lost the prerendered pages, a tender demo whose
   deadline keeps moving, kickboxing, an in-range update that is never one
   crate, a full class at Reform Fitness). Four mechanics carry them:
   collect everything, chase a goal that hops away, get past what comes
   at you, and crates that open into more crates. `bugs` counts the bugs
   on the way; from the second mission on, every third is a big one that
   takes two swings. Nothing here claims more than the site does: the
   tender portal is a proof of concept and the finale sends a visitor to
   the chat for the Godot games. */

export type MissionKind = "collect" | "flee" | "dodge" | "spawn";

export type Mission = {
  id: string;
  kind: MissionKind;
  hud: string;
  item: PickupKind;
  total: number;
  length: number;
  pits: number;
  bugs: number;
  night: boolean;
  intro: string[];
  lines: string[];
  outro: string[];
};

export const MISSIONS: Mission[] = [
  {
    id: "cache",
    kind: "collect",
    hud: "PAGES",
    item: "page",
    total: 5,
    length: 4200,
    pits: 3,
    bugs: 2,
    night: true,
    intro: [
      "Two in the morning. Someone ran plain wrangler deploy.",
      "The prerendered pages never shipped. Every case study is a 404.",
      "Five pages are scattered east. Bring them back, Toshkee.",
    ],
    lines: [
      "Page 1 of 5. /work/reform-fitness is back.",
      "Page 2 of 5. /work/infostream renders again.",
      "Page 3 of 5. /work/vaky. The cache warms up.",
      "Page 4 of 5. /work/cryptoflow. One more.",
      "Page 5 of 5. x-nextjs-cache: HIT.",
    ],
    outro: [
      "All five pages ship. Every case study answers 200.",
      "The lesson went into CLAUDE.md, in capital letters.",
    ],
  },
  {
    id: "tender",
    kind: "flee",
    hud: "CHANGES",
    item: "flag",
    total: 3,
    length: 4800,
    pits: 4,
    bugs: 3,
    night: false,
    intro: [
      "The tender portal demo is due at noon. It is nearly done.",
      "The deadline is right there, east of here. You can see it.",
      "Go get it, Toshkee. What could possibly go wrong.",
    ],
    lines: [
      "New requirement: a second login. The deadline moves east.",
      "New requirement: the PDF needs a stamp. It moves again.",
      "Final change: a bigger logo. One last move. Promise.",
    ],
    outro: [
      "Demo delivered. A proof of concept, and the slide says so.",
      "The logo is, in fact, bigger.",
    ],
  },
  {
    id: "sparring",
    kind: "dodge",
    hud: "ROUND",
    item: "bell",
    total: 1,
    length: 4400,
    pits: 3,
    bugs: 9,
    night: false,
    intro: [
      "Thursday evening. Kickboxing.",
      "Monday's bugs come at you in waves. Slip past them, or cut them down.",
      "Get to the end of the round and ring the bell, Toshkee.",
    ],
    lines: [],
    outro: [
      "Round over. Nobody got hit. Well, almost nobody.",
      "The bugs are still open. Friday's problem.",
    ],
  },
  {
    id: "crates",
    kind: "spawn",
    hud: "CRATES",
    item: "crate",
    total: 7,
    length: 4600,
    pits: 3,
    bugs: 3,
    night: false,
    intro: [
      "One in-range update. A single crate. Five minutes, tops.",
      "But a crate can open into two more crates.",
      "Collect every crate until npm audit goes quiet, Toshkee.",
    ],
    lines: [
      "The adapter pulls a glob with a high advisory. Two more crates.",
      "wrangler refuses to run on Node 20. Two more crates.",
      "A types package for a package that ships its own types. Two more.",
      "left-pad is in here somewhere. It always is.",
      "sharp downloads a binary during install. Sure.",
      "The lock file is 11,000 lines. Nobody reads it.",
      "found 0 vulnerabilities. Somehow.",
    ],
    outro: [
      "Dependency tree resolved. The update was one line.",
      "The lock pins the adapter at 1.20.9. For now.",
    ],
  },
  {
    id: "reform",
    kind: "collect",
    hud: "CHECK-INS",
    item: "checkin",
    total: 6,
    length: 4600,
    pits: 4,
    bugs: 4,
    night: false,
    intro: [
      "Reform Fitness, Thursday, 18:00. The class is full and the app has the list.",
      "Six members booked. Six check-ins waiting east of here.",
      "Check everyone in before the class starts, Toshkee.",
    ],
    lines: [
      "1 of 6. First one in. The app remembered her name.",
      "2 of 6. Someone booked twice. The app noticed first.",
      "3 of 6. Halfway. The coach has not looked at the app once.",
      "4 of 6. A cancellation on the stairs. Spot freed, spot taken.",
      "5 of 6. One more. The clock says 17:58.",
      "6 of 6. Full house. 18:00 exactly.",
    ],
    outro: [
      "Class started on time. Nobody mentioned the app.",
      "That is the best review an app can get.",
    ],
  },
];

export const FINALE = [
  "That's the quest. Five missions, and no real bugs were harmed.",
  "The real games are in Godot. Ask me about them in the chat.",
];

/* Ultra mode: the endless run, pits and bugs for as long as he lasts,
   faster the further he gets. */
export const ULTRA = {
  intro: "Ultra mode. The endless run. It only gets faster.",
  over: (metres: number) => `Run over at ${metres} m.`,
};
