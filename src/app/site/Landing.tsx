import Form from "next/form";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LuArrowRight } from "react-icons/lu";
import { LIMITS } from "../chat-protocol";
import { HANDLE, NAME, ROLE, SOCIAL } from "./content";
import MemojiGaze from "./MemojiGaze";
import { QuickTiles } from "./QuickQuestions";
import ThemeToggle from "./ThemeToggle";

/* The front page, after aaabadcode.com: greeting, title, the Memoji whose
   eyes follow the cursor, one question box and the starter questions over
   a giant faded handle;
   the coloured smoke under it all comes from the layout. Everything is a
   link or a GET form to /chat, so it works before (and without)
   hydration. */
export default function Landing() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden"
      >
        <span className="watermark -mb-10 hidden text-[10rem] leading-none font-black tracking-tight select-none sm:block lg:text-[15rem]">
          {HANDLE}
        </span>
      </div>

      <div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
        <Link
          href={{
            pathname: "/chat",
            query: { q: "Are you open to work? How can I reach you?" },
          }}
          className="flex items-center gap-2 rounded-full border border-line bg-bg/70 px-3.5 py-2 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-surface"
        >
          <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
          Open to work
        </Link>
        <ThemeToggle />
      </div>

      <header
        className="rise relative z-10 mb-8 flex flex-col items-center text-center md:mb-10"
        style={{ "--rise-from": "-60px" } as CSSProperties}
      >
        <p className="text-xl font-semibold text-body md:text-2xl">
          Hey, I&apos;m {NAME.split(" ")[0]} <span aria-hidden>👋</span>
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-7xl">
          {ROLE}
        </h1>
      </header>

      <MemojiGaze className="relative z-10 size-44 sm:size-56" />

      <div
        className="rise relative z-10 mt-8 flex w-full flex-col items-center"
        style={{ animationDelay: "0.2s" } as CSSProperties}
      >
        <Form action="/chat" className="w-full max-w-lg">
          <label className="flex items-center rounded-full border border-line bg-bg/40 py-2 pr-2 pl-6 backdrop-blur-lg transition-colors focus-within:border-line-strong hover:border-line-strong">
            <span className="sr-only">Ask me anything</span>
            <input
              name="q"
              required
              autoComplete="off"
              maxLength={LIMITS.messageChars}
              placeholder="Ask me anything…"
              className="peer w-full bg-transparent text-base text-ink placeholder:text-faint focus-visible:outline-none"
            />
            <button
              type="submit"
              aria-label="Ask"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-send text-white transition-colors peer-placeholder-shown:opacity-60 hover:bg-send-hover"
            >
              <LuArrowRight aria-hidden className="size-5" />
            </button>
          </label>
        </Form>

        <QuickTiles />
      </div>

      <nav
        aria-label="More"
        className="absolute bottom-4 z-10 flex gap-4 text-[13px] text-faint"
      >
        <Link href="/work" className="transition-colors hover:text-ink">
          Case studies
        </Link>
        <a href={SOCIAL.github} className="transition-colors hover:text-ink">
          GitHub
        </a>
        <a href={SOCIAL.linkedin} className="transition-colors hover:text-ink">
          LinkedIn
        </a>
        <Link href="/privacy" className="transition-colors hover:text-ink">
          Privacy
        </Link>
      </nav>
    </main>
  );
}
