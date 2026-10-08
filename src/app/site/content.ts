import { EMAIL } from "../contact";

/* Site copy and facts that are not project data (that lives in
   ../projects.ts). Plain data, no "use client". Every card renders from here
   and the chat model gets it as its only facts, so nothing goes in that
   Pavle has not said.

   The source of truth is his CV (public/pavle-tosic-cv.pdf, October 2026):
   ABOUT, SPEC, MARKS, EXPERIENCE, EDUCATION and IN_PROGRESS follow it, in
   its wording where it has one (the one rephrase, his: "at work we use
   Oracle APEX, Oracle Database and .NET"). Honesty rules from it: the ASK
   tender portal is a test/prototype project, not a production deployment;
   on the NGO Register Portal he contributed and made the official video
   tutorials. */

export const NAME = "Pavle Tošić";
export const ROLE = "Software developer";
export const LOCATION = "Montenegro";
// The one-page CV as a PDF in public/, linked from the chat's contact card.
export const RESUME = "/pavle-tosic-cv.pdf";
// My Memoji: three poses (320px transparent stickers from Apple Notes),
// the face on the chat header, the one peeking over a laptop while an
// answer is on its way, and the "call me" one on the contact card; and on
// the landing page the one whose eyes follow the cursor (MemojiGaze.tsx):
// a 448px frame of my Messages recording (October 2026) with the irises
// cut out as layers by scripts/memoji-gaze.py. Each eye is a window in
// base-image px, with its opening mask and its iris cutout.
export const MEMOJI = {
  face: "/images/memoji.webp",
  busy: "/images/memoji-laptop.webp",
  call: "/images/memoji-call.webp",
  gaze: {
    still: "/images/memoji-still.webp",
    size: 448,
    eyes: [
      {
        x: 124,
        y: 242,
        w: 76,
        h: 44,
        mask: "/images/memoji-eye-left-mask.webp",
        iris: "/images/memoji-iris-left.webp",
      },
      {
        x: 244,
        y: 240,
        w: 76,
        h: 44,
        mask: "/images/memoji-eye-right-mask.webp",
        iris: "/images/memoji-iris-right.webp",
      },
    ],
  },
};
// The real me on the "Who are you?" card: face and shoulders as the
// thumbnail, the whole photo when it is clicked.
export const PHOTO = {
  src: "/images/me.webp",
  full: "/images/me-full.webp",
  alt: "Pavle Tošić on a wooden bench, black and white",
};
// The giant faded word behind the landing page.
export const HANDLE = "Toshkee";

export const SOCIAL = {
  email: EMAIL,
  github: "https://github.com/Toshkee",
  linkedin: "https://www.linkedin.com/in/tosiicp/",
};

export const ABOUT_HEADING = "I turn ideas into shipped, working software.";
// The CV's "About me", split in two.
export const ABOUT = [
  "Software developer based in Montenegro, building web applications front to back, from database and APIs through the UI and deployment. TypeScript and React are where I'm strongest; at work we use Oracle APEX, Oracle Database and .NET with C#.",
  "I work across enterprise and government-facing software, independent web products, real-time applications and game development. I use AI-assisted tooling such as Claude Code and MCPs in my workflow while keeping architecture, testing and maintainability as engineering decisions.",
];
export const STACK_LINE =
  "My core stack, as it stands on my CV, plus what my projects run on.";
// His answer (October 2026) to "which project are you proudest of", in his
// order. The chat may say so; no other favourite exists.
export const PROUDEST =
  "the Infostream company site first, then Reform Fitness, the members' app I built through Vaky, and vaky.me itself, my own business site.";

/* The spec sheet: checkable facts only. Roles and dates live in
   EXPERIENCE below, so each fact is stated once. Availability is his
   (October 2026): open to remote work, mostly part-time, full-time only
   on US hours. He works at Infostream in Montenegro, not remotely: "remote"
   belongs to availability only. */
export const SPEC: { label: string; value: string }[] = [
  { label: "Based", value: "Montenegro" },
  { label: "Strongest in", value: "TypeScript and React" },
  { label: "At work", value: "Oracle APEX, Oracle Database and .NET with C#" },
  { label: "Languages", value: "Montenegrin (native), English (professional)" },
  {
    label: "Availability",
    value: "Open to remote roles, mostly part-time. Full-time only in a US time zone.",
  },
];

/* Brand marks, in the CV's "Core stack" groups, plus the tools the projects
   in ../projects.ts are built on (what a project used once, Prisma and
   Phaser, is in its own stack list, not here). `icon` is an Iconify id,
   rendered by the chat's SkillsCard and bundled in icons.ts (regenerate it
   with scripts/icons.mjs): the coloured "logos" set, or a one-colour
   "simple-icons" mark (drawn in the text colour, or in `color`) where the
   coloured one is black or a wordmark and vanishes on dark. Every mark has
   one; a skill with no brand (SQL, GDScript, UI/UX) borrows a generic
   glyph. */
export type Mark = { name: string; icon: string; color?: string };
export type MarkGroup = { heading: string; marks: Mark[] };

export const MARKS: MarkGroup[] = [
  {
    heading: "Frontend",
    marks: [
      { name: "TypeScript", icon: "logos:typescript-icon" },
      { name: "JavaScript", icon: "logos:javascript" },
      { name: "React", icon: "logos:react" },
      { name: "Next.js", icon: "logos:nextjs-icon" },
      { name: "HTML5", icon: "logos:html-5" },
      { name: "CSS3", icon: "logos:css-3" },
    ],
  },
  {
    heading: "Backend & data",
    marks: [
      { name: "Node.js", icon: "logos:nodejs-icon" },
      { name: "Express", icon: "simple-icons:express" },
      { name: "Oracle APEX", icon: "simple-icons:oracle", color: "#f80000" },
      { name: "Oracle Database", icon: "simple-icons:oracle", color: "#f80000" },
      { name: "C#", icon: "logos:c-sharp" },
      { name: ".NET", icon: "logos:dotnet" },
      { name: "SQL", icon: "vscode-icons:file-type-sql" },
      { name: "WebSockets", icon: "logos:websocket" },
    ],
  },
  {
    heading: "Tools",
    marks: [
      { name: "GitHub", icon: "simple-icons:github" },
      { name: "Vite", icon: "logos:vitejs" },
      { name: "Vitest", icon: "logos:vitest" },
      { name: "Playwright", icon: "logos:playwright" },
      { name: "Claude Code", icon: "logos:claude-icon" },
      { name: "MCPs", icon: "simple-icons:modelcontextprotocol" },
      { name: "UI/UX", icon: "lucide:pen-tool" },
    ],
  },
  {
    heading: "Creative",
    marks: [
      { name: "Three.js / React Three Fiber", icon: "simple-icons:threedotjs" },
      { name: "Godot 4", icon: "logos:godot-icon" },
      { name: "GDScript", icon: "vscode-icons:file-type-gdscript" },
    ],
  },
  {
    heading: "Also in my projects",
    marks: [
      { name: "Astro", icon: "simple-icons:astro" },
      { name: "Tailwind CSS", icon: "logos:tailwindcss-icon" },
      { name: "PostgreSQL", icon: "logos:postgresql" },
      { name: "Django", icon: "logos:django-icon" },
      { name: "Cloudflare", icon: "logos:cloudflare-icon" },
      { name: "Firebase", icon: "logos:firebase" },
    ],
  },
];

/* A bullet is a sentence, optionally with a link shown right after it. */
export type Point = string | { text: string; href: string; label: string };
export type LogEntry = {
  period: string;
  org: string;
  role: string;
  scope: string;
  points: Point[];
  link?: { href: string; label: string };
};
export const pointText = (point: Point) =>
  typeof point === "string" ? point : point.text;

/* Work, as on the CV, plus two specifics he asked back in (October 2026):
   the QuestPDF panel and the ONNX-embedding search. Vaky's start is the
   studio repo's first month (confirmed). The company site he built is
   linked on its own bullet, not the NGO portal. */
export const EXPERIENCE: LogEntry[] = [
  {
    period: "December 2025 to present · Montenegro",
    org: "Infostream",
    role: "Software Developer",
    scope: "",
    points: [
      "Build and maintain enterprise and web applications using Oracle APEX and SQL, with .NET/C# and JavaScript/TypeScript/React where required.",
      {
        text: "Designed and built Infostream's new company website end to end.",
        href: "https://infostream.co.me/",
        label: "infostream.co.me",
      },
      "Built a live PDF workflow that updates documents dynamically from client form input: a QuestPDF panel that re-renders the document as the applicant types, downloadable once submitted.",
      "Built an AI-assisted smart search feature for Infostream, including staff lookup by JMBG and other identifying fields: local multilingual embeddings (ONNX), a query interpreter, and word-order and diacritic-insensitive name search.",
      "Built the ASK tender portal as an Infostream test/prototype project; it is not a production deployment.",
      "Contributed to the Government of Montenegro's NGO Register Portal (ngo.gov.me) and created official video tutorials for e-signature, document signing, registration and registry search.",
    ],
  },
  {
    period: "August 2026 to present",
    org: "Vaky.me",
    role: "Founder & Developer",
    scope: "Independent web studio.",
    points: [
      "Design and build custom business websites covering UI/UX, frontend engineering, deployment, hosting and maintenance.",
      "Built the bilingual Vaky platform and local-business web projects focused on responsive design, mobile performance and practical business needs.",
    ],
    link: { href: "https://vaky.me/en/", label: "vaky.me" },
  },
];

export const EDUCATION: LogEntry[] = [
  {
    period: "Sep to Dec 2025",
    org: "General Assembly",
    role: "Fullstack Software Developer",
    scope:
      "420+ hours covering frontend, backend fundamentals, APIs, databases, security and team projects.",
    points: [],
  },
  {
    period: "2023 to 2025",
    org: "Z-Security, Udemy",
    role: "Ethical Hacking",
    scope: "",
    points: [],
  },
  {
    period: "Secondary education",
    org: "Kosta Cukić Private High School, Belgrade",
    role: "Final two years",
    scope:
      "First two years at Mirko Vešović Economics High School, Podgorica.",
    points: [],
  },
];

/* Games in progress, from the CV's "Selected projects". No links or
   screenshots yet, so they are a line under the project rail, not cards,
   and the chat only brings them up when asked about games (prompt.ts):
   they are parked, and he does not want them in every answer. */
export const IN_PROGRESS: {
  title: string;
  genre: string;
  text: string;
  stack: string[];
}[] = [
  {
    title: "Ashen Reaper",
    genre: "2D action RPG",
    text: "2D action RPG with an interconnected world, four-act story, multiple zones, bosses and dialogue-driven NPCs.",
    stack: ["Godot 4", "GDScript"],
  },
  {
    title: "KAISETSU",
    genre: "2D soulslike",
    text: "Atmospheric 2D soulslike built around island exploration, distinct biome zones, bosses, NPCs and branching endings.",
    stack: ["Godot 4", "GDScript", "PixelLab"],
  },
];

/* Off the clock: hobbies and stories for the "Fun" question, in Pavle's
   own words (October 2026: "im into martial arts and crypto, gaming
   aswell"). Only what he has said goes here; the chat must not invent any
   of it, and with an empty list the Fun tile and the show_fun tool hide.
   Photos and video posters live in public/images/fun/ with no EXIF
   (`npm run check:metadata`), his gameplay clips in public/video/fun/
   (H.264, 540px wide, metadata stripped). */
export type Media =
  | { kind: "image"; src: string; full: string; alt: string }
  | { kind: "video"; src: string; poster: string; preview: string; alt: string };

export type FunItem = { title: string; text: string; media: Media[] };

export const FUN: FunItem[] = [
  {
    title: "Martial arts",
    text: "I train kickboxing and wrestling.",
    media: [
      {
        kind: "image",
        src: "/images/fun/martial-arts.webp",
        full: "/images/fun/martial-arts-full.webp",
        alt: "Pavle kneeling on the gym mats, hands wrapped, flexing",
      },
    ],
  },
  {
    title: "Crypto",
    text: "I'm into crypto. That's me on the left, on a sofa with Vitalik 😂 We mostly talked gaming and anime, we have a lot in common. Crypto and blockchain came up the least, though of course they came up.",
    media: [
      {
        kind: "image",
        src: "/images/fun/crypto.webp",
        full: "/images/fun/crypto.webp",
        alt: "Pavle and Vitalik sitting on a grey sofa",
      },
    ],
  },
  {
    title: "Gaming",
    text: "Gaming since I was a kid, mostly FPS. Two of my clips are here.",
    media: [
      {
        kind: "video",
        src: "/video/fun/valorant.mp4",
        poster: "/images/fun/valorant-poster.webp",
        preview: "/images/fun/valorant.webp",
        alt: "Valorant clip ending in an ace",
      },
      {
        kind: "video",
        src: "/video/fun/counter-strike.mp4",
        poster: "/images/fun/counter-strike-poster.webp",
        preview: "/images/fun/counter-strike.webp",
        alt: "Counter-Strike gameplay clip",
      },
    ],
  },
];
