"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import {
  FAILED_MESSAGE,
  LIMITS,
  type Card,
  type ChatEvent,
  type Turn,
} from "../chat-protocol";
import { EMAIL } from "../contact";
import AskBar from "./AskBar";
import Avatar from "./Avatar";
import CardView from "./cards/CardView";
import { MEMOJI } from "./content";
import Markdown from "./Markdown";
import { QuickPills } from "./QuickQuestions";
import ThemeToggle from "./ThemeToggle";

/* The conversation, after aaabadcode.com: the face on top, the latest
   question and its answer in the middle (text and cards in the order they
   streamed), quick questions and the input at the bottom. Earlier turns are
   not shown but are sent along, so follow-ups keep their context. */

type Part = { type: "text"; text: string } | { type: "card"; card: Card };
type Exchange = { question: string; parts: Part[]; error?: string };
type Pending = { question: string; history: Turn[] };

/* An exchange as history for the next request: only what was said. One
   that ended in an error or said nothing is dropped whole, so the
   conversation still alternates user / assistant. */
function toTurns({ question, parts, error }: Exchange): Turn[] {
  const text = parts
    .flatMap((part) => (part.type === "text" ? [part.text.trim()] : []))
    .join("\n\n")
    .trim();
  if (error || !text) return [];
  return [
    { role: "user", text: question },
    { role: "assistant", text: text.slice(0, LIMITS.replyChars) },
  ];
}

function applyEvent(exchange: Exchange, event: ChatEvent): Exchange {
  if (event.type === "error") return { ...exchange, error: event.message };
  if (event.type === "card") {
    return { ...exchange, parts: [...exchange.parts, event] };
  }
  const last = exchange.parts.at(-1);
  if (last?.type === "text") {
    return {
      ...exchange,
      parts: [
        ...exchange.parts.slice(0, -1),
        { type: "text", text: last.text + event.text },
      ],
    };
  }
  return { ...exchange, parts: [...exchange.parts, event] };
}

async function streamAnswer(
  { question, history }: Pending,
  signal: AbortSignal,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [...history, { role: "user", text: question }],
    }),
    signal,
  });
  if (!response.ok || !response.body) {
    // Only the rate limiter's message is worth showing as-is.
    const data: unknown = await response.json().catch(() => null);
    const message =
      response.status === 429 &&
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : FAILED_MESSAGE;
    onEvent({ type: "error", message });
    return;
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) onEvent(JSON.parse(line) as ChatEvent);
    }
  }
}

export default function Chat({
  initialQuestion,
}: {
  initialQuestion: string | null;
}) {
  const [exchanges, setExchanges] = useState<Exchange[]>(() =>
    initialQuestion ? [{ question: initialQuestion, parts: [] }] : [],
  );
  // The question being answered, with the history it was asked against.
  // Setting it starts the request (the effect below); null means idle.
  const [pending, setPending] = useState<Pending | null>(() =>
    initialQuestion ? { question: initialQuestion, history: [] } : null,
  );
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(true);
  // The laptop pose appears the moment a question is sent; fetch it now so
  // the swap never shows an empty frame.
  preload(MEMOJI.busy, { as: "image" });
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const update = (event: ChatEvent) =>
      setExchanges((previous) =>
        previous.length === 0
          ? previous
          : [...previous.slice(0, -1), applyEvent(previous.at(-1)!, event)],
      );
    streamAnswer(pending, controller.signal, update)
      .catch(() => {
        if (!controller.signal.aborted) update({ type: "error", message: FAILED_MESSAGE });
      })
      .finally(() => {
        // An aborted run (stop, or StrictMode's dev re-run) must not clear
        // the state a newer run now owns.
        if (!controller.signal.aborted) setPending(null);
      });
    return () => controller.abort();
  }, [pending]);

  // Each new question starts at the top of the answer area.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [exchanges.length]);

  const busy = pending !== null;

  const ask = (raw: string) => {
    const question = raw.trim().slice(0, LIMITS.messageChars);
    if (!question || busy) return;
    setPending({
      question,
      history: exchanges.flatMap(toTurns).slice(-(LIMITS.turns - 1)),
    });
    setExchanges((previous) => [...previous, { question, parts: [] }]);
    setInput("");
  };

  const stop = () => {
    abortRef.current?.abort();
    setPending(null);
  };

  const latest = exchanges.at(-1);
  const showsCard = latest?.parts.some((part) => part.type === "card") ?? false;

  return (
    <div className="flex h-dvh flex-col">
      <header className="relative flex shrink-0 justify-center px-4 pt-5 pb-3">
        <Link href="/" aria-label="Back to the start" className="rounded-full">
          <Avatar
            priority
            busy={busy}
            className={`transition-[width,height] duration-300 ${showsCard ? "size-16" : "size-24"}`}
          />
        </Link>
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-8">
          {latest ? (
            <ExchangeView key={exchanges.length} exchange={latest} busy={busy} />
          ) : (
            <p className="mt-16 text-center text-lg text-body">
              Ask me anything about my work,
              <br className="sm:hidden" /> or pick a question below.
            </p>
          )}
        </div>
      </main>

      {/* No background: the cursor smoke runs under the whole page, and an
          opaque footer drew a hard line across it. */}
      <footer className="shrink-0 px-4 pt-2 pb-4">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <button
            type="button"
            onClick={() => setShowQuick((shown) => !shown)}
            aria-expanded={showQuick}
            className="mx-auto flex items-center gap-1 text-xs text-faint transition-colors hover:text-ink"
          >
            {showQuick ? (
              <LuChevronDown aria-hidden className="size-3.5" />
            ) : (
              <LuChevronUp aria-hidden className="size-3.5" />
            )}
            {showQuick ? "Hide quick questions" : "Show quick questions"}
          </button>
          {showQuick && <QuickPills onAsk={ask} disabled={busy} />}
          <AskBar
            value={input}
            onChange={setInput}
            onSubmit={() => ask(input)}
            onStop={stop}
            busy={busy}
          />
          <p className="text-center text-xs text-faint">
            An AI answers for me, from what I wrote down. It can get things
            wrong:{" "}
            <Link href="/privacy" className="link-underline">
              how this works
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

function ExchangeView({ exchange, busy }: { exchange: Exchange; busy: boolean }) {
  const { question, parts, error } = exchange;
  const silent = parts.length === 0 && !error;

  return (
    <div>
      <p className="settle ml-auto w-fit max-w-[85%] rounded-3xl rounded-br-lg bg-surface px-4 py-2.5 text-[15px] text-ink">
        {question}
      </p>

      <div className="mt-6 space-y-5" aria-live="polite" aria-busy={busy}>
        {busy && silent && (
          <div className="dots flex gap-1.5 py-2" role="status" aria-label="Thinking">
            <span className="size-2 rounded-full bg-faint" />
            <span className="size-2 rounded-full bg-faint" />
            <span className="size-2 rounded-full bg-faint" />
          </div>
        )}
        {parts.map((part, index) => (
          <div key={index} className="settle">
            {part.type === "text" ? (
              <Markdown text={part.text} />
            ) : (
              <CardView card={part.card} />
            )}
          </div>
        ))}
        {error && (
          <p className="text-[15px] text-body">
            {error}{" "}
            {error === FAILED_MESSAGE && (
              <a href={`mailto:${EMAIL}`} className="link-underline text-ink">
                {EMAIL}
              </a>
            )}
          </p>
        )}
        {!busy && silent && (
          <p className="text-[15px] text-faint">
            No answer this time. Try asking another way.
          </p>
        )}
      </div>
    </div>
  );
}
