"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { LuArrowUp, LuFileText, LuPaperclip, LuSquare, LuX } from "react-icons/lu";
import { LIMITS } from "../chat-protocol";

/* The chat's input. While an answer streams, the send button becomes stop.
   A textarea, not an input, so a pasted job ad keeps its lines: it grows
   with what is in it up to 12rem, then scrolls. Enter sends, Shift+Enter
   is a new line. `focus` turning true puts the cursor in it (Job fit).
   With `canAttach` (Job fit), a paperclip picks a PDF of the ad; a file
   pasted in goes the same way, whatever the mode. The chip above shows the
   attached PDF, and `notice` why a file was turned down. */
export default function AskBar({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder = "Ask me anything…",
  focus = false,
  canAttach = false,
  attachment,
  onAttach,
  onDetach,
  notice,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  placeholder?: string;
  focus?: boolean;
  canAttach?: boolean;
  attachment: string | null;
  onAttach: (file: File) => void;
  onDetach: () => void;
  notice: string | null;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-2">
      {(attachment || notice) && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {attachment && (
            <span className="flex max-w-full items-center gap-2 rounded-full border border-line bg-bg py-1 pr-1 pl-3 text-ink">
              <LuFileText aria-hidden className="size-4 shrink-0 text-faint" />
              <span className="truncate">{attachment}</span>
              <button
                type="button"
                onClick={onDetach}
                aria-label={`Remove ${attachment}`}
                className="grid size-6 shrink-0 place-items-center rounded-full text-faint transition-colors hover:bg-surface hover:text-ink"
              >
                <LuX aria-hidden className="size-3.5" />
              </button>
            </span>
          )}
          {notice && (
            <p role="status" className="text-center text-faint">
              {notice}
            </p>
          )}
        </div>
      )}
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
          onPaste={(event) => {
            const file = event.clipboardData.files[0];
            if (!file) return;
            event.preventDefault();
            onAttach(file);
          }}
          autoComplete="off"
          enterKeyHint="send"
          maxLength={LIMITS.messageChars}
          placeholder={placeholder}
          className="max-h-48 w-full resize-none self-center bg-transparent py-2 text-base leading-6 text-ink placeholder:text-faint focus-visible:outline-none"
        />
        {canAttach && !busy && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach the job ad as a PDF"
              title="Attach the job ad as a PDF"
              className="grid size-10 shrink-0 place-items-center rounded-full text-faint transition-colors hover:text-ink"
            >
              <LuPaperclip aria-hidden className="size-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onAttach(file);
                // The same file picked again still fires a change.
                event.target.value = "";
              }}
            />
          </>
        )}
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
            disabled={!value.trim() && !attachment}
            aria-label="Send"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-send text-white transition-colors hover:bg-send-hover disabled:opacity-50"
          >
            <LuArrowUp aria-hidden className="size-5" />
          </button>
        )}
      </form>
    </div>
  );
}
