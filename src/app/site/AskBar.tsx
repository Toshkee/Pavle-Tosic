"use client";

import { LuArrowUp, LuSquare } from "react-icons/lu";
import { LIMITS } from "../chat-protocol";

/* The chat's input. While an answer streams, the send button becomes stop. */
export default function AskBar({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSubmit();
      }}
      className="flex items-center rounded-full border border-line bg-surface py-2 pr-2 pl-5 transition-colors focus-within:border-line-strong"
    >
      <label className="sr-only" htmlFor="ask">
        Your question
      </label>
      <input
        id="ask"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        maxLength={LIMITS.messageChars}
        placeholder="Ask me anything…"
        className="w-full bg-transparent text-base text-ink placeholder:text-faint focus-visible:outline-none"
      />
      {busy ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop the answer"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg transition-opacity hover:opacity-85"
        >
          <LuSquare aria-hidden className="size-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-send text-white transition-colors hover:bg-send-hover disabled:opacity-50"
        >
          <LuArrowUp aria-hidden className="size-5" />
        </button>
      )}
    </form>
  );
}
