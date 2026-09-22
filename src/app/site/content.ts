import { EMAIL } from "../contact";

/* Site copy and facts that are not project data (that lives in
   ../projects.ts). Plain data, no "use client". Honesty rules apply: PEL was
   a contribution, the tender portal was a proof of concept, the NGO portal
   tutorials were produced, not the portal. */

export const NAME = "Pavle Tošić";
export const ROLE = "Software developer";
export const LOCATION = "Montenegro";
// The one-page CV as a PDF in public/, opened in a new tab by the nav "CV"
// button and the contact list.
export const RESUME = "/pavle-tosic-cv.pdf";

export const SOCIAL = {
  email: EMAIL,
  github: "https://github.com/Toshkee",
  linkedin: "https://www.linkedin.com/in/tosiicp/",
};

/* About copy, verbatim from pavletosic.com. */
export const ABOUT_HEADING = "I turn ideas into shipped, working software.";
export const ABOUT = [
  "Software developer at Infostream, working on public portals and registers for Montenegrin institutions in Angular, .NET and Oracle APEX. On my own time I ship client sites and my own products in Next.js, React and Astro.",
  "I build front to back, database and API through to the UI, with Claude Code and MCPs in the loop every day, so a new framework is a week, not a quarter. Open to full-time or part-time, remote.",
];
export const STACK_LINE =
  "What I actually build with: a JavaScript/TypeScript core, the frontend I design and animate in, and the backend that ships and stores it.";

/* The spec sheet: checkable facts only. Role, dates and training live in
   LOG below, not here, so each fact is stated once. */
export const SPEC: { label: string; value: string }[] = [
  { label: "Based", value: "Montenegro, remote" },
  { label: "By choice", value: "Next.js, React, Astro" },
  { label: "On the job", value: "Angular, .NET, Oracle APEX" },
  { label: "Languages", value: "English (professional), Montenegrin (native)" },
  { label: "Availability", value: "Full-time or part-time, remote" },
];

/* Brand marks, grouped the way the Spec sheet groups them: tools picked
   freely, and tools the day job runs on. `icon` is an Iconify id from the
   coloured "logos" set, rendered by StackOrbit / StackMarquee. */
export type Mark = { name: string; icon: string };
export type MarkGroup = { heading: string; marks: Mark[] };

export const MARKS: MarkGroup[] = [
  {
    heading: "By choice",
    marks: [
      { name: "Next.js", icon: "logos:nextjs-icon" },
      { name: "React", icon: "logos:react" },
      { name: "Astro", icon: "logos:astro-icon" },
      { name: "TypeScript", icon: "logos:typescript-icon" },
      { name: "Tailwind CSS", icon: "logos:tailwindcss-icon" },
      { name: "Node.js", icon: "logos:nodejs-icon" },
      { name: "PostgreSQL", icon: "logos:postgresql" },
      { name: "Cloudflare", icon: "logos:cloudflare-icon" },
      { name: "Django", icon: "logos:django-icon" },
      { name: "GitHub", icon: "logos:github-icon" },
    ],
  },
  {
    heading: "On the job",
    marks: [
      { name: "Angular", icon: "logos:angular-icon" },
      { name: ".NET", icon: "logos:dotnet" },
      { name: "Oracle", icon: "logos:oracle" },
    ],
  },
];

/* Game engines from personal projects: one small line, not a third group. */
export const MARKS_SIDE: Mark[] = [
  { name: "Godot", icon: "logos:godot-icon" },
  { name: "Unity", icon: "logos:unity" },
];

export type LogEntry = {
  period: string;
  org: string;
  role: string;
  scope: string;
  points: string[];
  link?: { href: string; label: string };
};

export const LOG: LogEntry[] = [
  {
    period: "2025 to present",
    org: "Infostream",
    role: "Software Developer",
    scope:
      "Public portals and internal registers for Montenegrin institutions: Angular and .NET on the newer systems, Oracle APEX and SQL on the established ones.",
    points: [
      "PEL register (Agency for Prevention of Corruption), .NET 10 / Angular 20: built the public wizard's live PDF panel, a QuestPDF document that re-renders as the applicant types and is downloadable once submitted, and added AI-assisted search to the internal app with local multilingual embeddings (ONNX), a query interpreter, and word-order and diacritic-insensitive name search.",
      "Built a working proof-of-concept public portal and CMS for a tender at the company's request: Next.js, RBAC, append-only audit log, scheduled publishing and full-text search.",
      "NGO Register Portal (Government of Montenegro): produced the official user-guide video tutorials for e-signature, document signing, online registration and registry search.",
    ],
    link: {
      href: "https://ngo.gov.me/Uputstva/PreuzmiteSoftwareIUputstva",
      label: "ngo.gov.me",
    },
  },
  {
    period: "Sep 2025 to Dec 2025",
    org: "General Assembly",
    role: "Fullstack Software Engineering",
    scope:
      "420+ hours of full-time training across the stack, assessed on shipped projects rather than exams.",
    points: [
      "Frontend: JavaScript, React, HTML & CSS. Backend fundamentals, APIs, databases and security basics.",
      "Three of the projects are in the Work section: all solo builds, each rebuilt in 2026 and live.",
    ],
  },
  {
    period: "2023",
    org: "Z-Security, Udemy",
    role: "Ethical Hacking",
    scope: "Six-month hands-on course.",
    points: [],
  },
];
