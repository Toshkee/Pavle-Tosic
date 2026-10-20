"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { LuArrowUp, LuSquare } from "react-icons/lu";
import { LIMITS } from "../chat-protocol";

/* The chat's input. While an answer streams, the send button becomes stop.
   A textarea, not an input, so a pasted job ad keeps its lines: it grows
   with what is in it up to 12rem, then scrolls. Enter sends, Shift+Enter
   is a new line. `focus` turning true puts the cursor in it (Job fit). */
export default function AskBar({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder = "Ask me anything…",
  focus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  placeholder?: string;
  focus?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focus) inputRef.current?.focus();
  }, [focus]);

  // Height follows the content: reset, then take the scroll height. Before
  // paint, so a paste never shows one frame at the old size.
  useLayoutEffect(() => {
    const field = inputRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSubmit();
      }}
      className="flex items-end rounded-[28px] border border-line bg-surface py-2 pr-2 pl-5 transition-colors focus-within:border-line-strong"
    >
      <label className="sr-only" htmlFor="ask">
        Your question
      </label>
      <textarea
        id="ask"
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        autoComplete="off"
        enterKeyHint="send"
        maxLength={LIMITS.messageChars}
        placeholder={placeholder}
        className="max-h-48 w-full resize-none self-center bg-transparent py-2 text-base leading-6 text-ink placeholder:text-faint focus-visible:outline-none"
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
