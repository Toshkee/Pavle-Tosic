import Link from "next/link";
import type { IconType } from "react-icons";
import { QUICK_PROMPTS, type Card } from "../chat-protocol";
import {
  LuBriefcaseBusiness,
  LuClipboardCheck,
  LuGamepad2,
  LuLaugh,
  LuLayers,
  LuPartyPopper,
  LuRoute,
  LuUserRoundSearch,
} from "react-icons/lu";
import { FUN } from "./content";

/* The starter questions, as tiles on the landing page and as a row of
   pills above the chat input. Icon colours are the reference's (Experience
   borrows a sixth), except Skills: its purple is out by house rule, so a
   coral instead. "Fun" only appears once FUN in content.ts has entries:
   the model must not invent hobbies. */
const ALL_QUICK: {
  label: string;
  prompt: string;
  color: string;
  Icon: IconType;
}[] = [
  {
    label: "Me",
    prompt: QUICK_PROMPTS.me,
    color: "#329696",
    Icon: LuLaugh,
  },
  {
    label: "Projects",
    prompt: QUICK_PROMPTS.projects,
    color: "#3E9858",
    Icon: LuBriefcaseBusiness,
  },
  {
    label: "Skills",
    prompt: QUICK_PROMPTS.skills,
    color: "#D2694A",
    Icon: LuLayers,
  },
  {
    label: "Experience",
    prompt: QUICK_PROMPTS.experience,
    color: "#4F7FD9",
    Icon: LuRoute,
  },
  {
    label: "Fun",
    prompt: QUICK_PROMPTS.fun,
    color: "#B95F9D",
    Icon: LuPartyPopper,
  },
  {
    label: "Contact",
    prompt: QUICK_PROMPTS.contact,
    color: "#C19433",
    Icon: LuUserRoundSearch,
  },
];

const QUICK = ALL_QUICK.filter(({ label }) => label !== "Fun" || FUN.length > 0);

/* The last two are not questions. Job fit readies the input for a pasted
   job ad (the tile opens /chat?fit, the pill does it in place); Quest opens
   Toshkee's Quest, the game at /play. Job fit's slate is the reference's
   palette pulled toward grey, kept off the blue send button. */
const FIT = { label: "Job fit", title: "Paste a job ad and see how I match it", color: "#5E7A8C", Icon: LuClipboardCheck };
const GAME = { label: "Quest", title: "Toshkee's Quest, a game", color: "#D94848", Icon: LuGamepad2 };

/* After a card, the two or three questions that naturally come next, as
   pills under the answer. Static, written here from the same facts the
   cards show: the model does not make them up, so none can promise a card
   that does not exist. The quick questions stay in the footer for a
   change of subject. */
const FOLLOW_UPS: Record<Card["kind"], string[]> = {
  me: ["What have you built?", "Where do you work?", "Are you open to work?"],
  projects: [
    "Which project are you proudest of?",
    "Tell me about Reform Fitness",
    "What do you build with?",
  ],
  project: ["What else have you built?", "What do you build with?", "Are you open to work?"],
  skills: ["What have you built with it?", "Where do you work?", "Are you active on GitHub?"],
  experience: ["What did you build at Infostream?", "What is Vaky?", "Are you open to work?"],
  contact: ["What have you built?", "Where do you work?"],
  fun: ["What have you built?", "Who are you?"],
  github: ["What are your projects?", "What do you build with?"],
  fit: ["What have you built?", "Are you open to work?", "How can I contact you?"],
};

export function FollowUps({
  kind,
  onAsk,
  disabled,
}: {
  kind: Card["kind"];
  onAsk: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <ul aria-label="Ask next" className="flex flex-wrap gap-2">
      {FOLLOW_UPS[kind].map((prompt) => (
        <li key={prompt}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAsk(prompt)}
            className="rounded-full border border-line bg-bg px-3.5 py-1.5 text-sm text-body transition hover:bg-surface hover:text-ink active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* Landing: plain links to /chat?q=..., so they work before hydration. */
export function QuickTiles() {
  return (
    <ul className="mt-4 flex w-full max-w-4xl flex-wrap justify-center gap-3">
      {QUICK.map(({ label, prompt, color, Icon }) => (
        <li key={label}>
          <Link
            href={{ pathname: "/chat", query: { q: prompt } }}
            className="flex h-[72px] w-[100px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-bg/40 backdrop-blur-lg transition hover:bg-surface active:scale-95 sm:w-[106px]"
          >
            <Icon aria-hidden className="size-[22px]" style={{ color }} />
            <span className="text-sm font-medium text-ink">{label}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={{ pathname: "/chat", query: { fit: "" } }}
          title={FIT.title}
          className="flex h-[72px] w-[100px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-bg/40 backdrop-blur-lg transition hover:bg-surface active:scale-95 sm:w-[106px]"
        >
          <FIT.Icon aria-hidden className="size-[22px]" style={{ color: FIT.color }} />
          <span className="text-sm font-medium text-ink">{FIT.label}</span>
        </Link>
      </li>
      <li>
        <Link
          href="/play"
          title={GAME.title}
          className="flex h-[72px] w-[100px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-bg/40 backdrop-blur-lg transition hover:bg-surface active:scale-95 sm:w-[106px]"
        >
          <GAME.Icon aria-hidden className="size-[22px]" style={{ color: GAME.color }} />
          <span className="text-sm font-medium text-ink">{GAME.label}</span>
        </Link>
      </li>
    </ul>
  );
}

/* Chat: the same questions, sent in place, Job fit readying the input,
   and the game as a link. */
export function QuickPills({
  onAsk,
  onFit,
  disabled,
}: {
  onAsk: (prompt: string) => void;
  onFit: () => void;
  disabled: boolean;
}) {
  // center-safe: a row too wide to centre starts at the left, where plain
  // centring pushed the first pill off screen with no way to scroll to it.
  return (
    <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:justify-center-safe">
      {QUICK.map(({ label, prompt, color, Icon }) => (
        <li key={label} className="shrink-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAsk(prompt)}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon aria-hidden className="size-[18px]" style={{ color }} />
            {label}
          </button>
        </li>
      ))}
      <li className="shrink-0">
        <button
          type="button"
          disabled={disabled}
          onClick={onFit}
          title={FIT.title}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FIT.Icon aria-hidden className="size-[18px]" style={{ color: FIT.color }} />
          {FIT.label}
        </button>
      </li>
      <li className="shrink-0">
        <Link
          href="/play"
          title={GAME.title}
          className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface active:scale-95"
        >
          <GAME.Icon aria-hidden className="size-[18px]" style={{ color: GAME.color }} />
          {GAME.label}
        </Link>
      </li>
    </ul>
  );
}
