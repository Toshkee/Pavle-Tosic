import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuBriefcaseBusiness,
  LuLaugh,
  LuLayers,
  LuPartyPopper,
  LuRoute,
  LuUserRoundSearch,
} from "react-icons/lu";
import { FUN } from "./content";

/* The starter questions, as tiles on the landing page and as a row of
   pills above the chat input. Icon colours are the reference's (Experience
   borrows a sixth). "Fun" only appears once FUN in content.ts has entries:
   the model must not invent hobbies. */
const ALL_QUICK: {
  label: string;
  prompt: string;
  color: string;
  Icon: IconType;
}[] = [
  {
    label: "Me",
    prompt: "Who are you? I want to know more about you.",
    color: "#329696",
    Icon: LuLaugh,
  },
  {
    label: "Projects",
    prompt: "What are your projects? What have you built recently?",
    color: "#3E9858",
    Icon: LuBriefcaseBusiness,
  },
  {
    label: "Skills",
    prompt: "What are your skills? What do you build with?",
    color: "#856ED9",
    Icon: LuLayers,
  },
  {
    label: "Experience",
    prompt: "Where do you work, and what have you done there?",
    color: "#4F7FD9",
    Icon: LuRoute,
  },
  {
    label: "Fun",
    prompt: "What do you do for fun? What are your hobbies?",
    color: "#B95F9D",
    Icon: LuPartyPopper,
  },
  {
    label: "Contact",
    prompt: "How can I contact you? Are you open to work?",
    color: "#C19433",
    Icon: LuUserRoundSearch,
  },
];

const QUICK = ALL_QUICK.filter(({ label }) => label !== "Fun" || FUN.length > 0);

/* Landing: plain links to /chat?q=..., so they work before hydration. */
export function QuickTiles() {
  return (
    <ul className="mt-4 flex w-full max-w-3xl flex-wrap justify-center gap-3">
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
    </ul>
  );
}

/* Chat: the same questions, sent in place. */
export function QuickPills({
  onAsk,
  disabled,
}: {
  onAsk: (prompt: string) => void;
  disabled: boolean;
}) {
  return (
    <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:justify-center">
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
    </ul>
  );
}
