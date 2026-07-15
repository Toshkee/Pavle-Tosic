"use client";

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SUGGESTIONS } from "./suggestions";

/* "Ask AI" — a dedicated, grounded chat panel docked bottom-right (above the
   Terminal bar). Talks to POST /api/ask, which proxies Gemini server-side. The
   assistant only answers questions about Pavle (system prompt in profile.ts).
   Self-contained client component; mounted once in page.tsx. */

type Msg = { role: "user" | "assistant"; content: string };

const EMAIL = "tosiicsftw@gmail.com";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
      <path d="M19 14l.8 2.4L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.6L19 14z" opacity="0.7" />
    </svg>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

// Blinking block caret shown at the end of the reply while it streams in.
function Caret({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.span
      aria-hidden
      className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-px rounded-[1px] bg-accent align-text-bottom"
      animate={reduce ? undefined : { opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.5, 1] }}
    />
  );
}

function AskPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false); // waiting for the first byte
  const [streaming, setStreaming] = useState(false); // reply is arriving
  const [error, setError] = useState<string | null>(null);
  // Soft-keyboard inset (mobile): how far the visual viewport is shrunk, and its
  // current height, so the panel can sit above the keyboard instead of behind it.
  const [kb, setKb] = useState<{ inset: number; height: number }>({ inset: 0, height: 0 });
  const reduce = useReducedMotion();

  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Return focus to the launcher when the panel closes. Runs in an effect (not
  // in the close handlers) so it fires AFTER the FAB has remounted on re-render
  // — a synchronous focus() in the handler would hit the still-unmounted ref.
  useEffect(() => {
    if (wasOpen.current && !open) fabRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Track the soft keyboard via the visual viewport so the panel lifts above it
  // on mobile (iOS Safari / Android don't shrink the layout viewport, so a
  // bottom-anchored fixed element would otherwise sit behind the keyboard).
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKb({ inset, height: vv.height });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setKb({ inset: 0, height: 0 });
    };
  }, [open]);

  // Keep the transcript pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  // Esc closes the panel (only while open, so it doesn't hijack Esc globally).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false); // focus returns to the FAB via the effect above
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false); // focus returns to the FAB via the effect above

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading || streaming) return;
    setError(null);
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        // Read the route's error code to pick an accurate message. `overloaded`
        // and `rate_limited` are temporary — invite a retry rather than a
        // dead-end "offline".
        let code = "";
        try {
          code = ((await res.json()) as { error?: string })?.error ?? "";
        } catch {
          /* no/!JSON body — fall through to the generic message */
        }
        if (code === "overloaded") {
          setError("The assistant is busy right now. Give it a few seconds and ask again.");
        } else if (code === "rate_limited") {
          setError("Whoa, one at a time. Wait a moment and try again.");
        } else if (code === "not_configured") {
          setError("The assistant isn't switched on yet.");
        } else {
          setError(`The assistant is offline right now. Email Pavle at ${EMAIL}.`);
        }
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let target = ""; // full text received from the network so far
      let netDone = false; // network stream finished
      let started = false;
      const setLast = (content: string) =>
        setMessages((m) => {
          const copy = m.slice();
          copy[copy.length - 1] = { role: "assistant", content };
          return copy;
        });

      // Drain the network into `target` in the background. The first byte swaps
      // the "thinking" dots for the (initially empty) assistant bubble.
      const drain = (async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            target += chunk;
            if (!started) {
              started = true;
              setLoading(false);
              setStreaming(true);
              setMessages((m) => [...m, { role: "assistant", content: reduce ? target : "" }]);
            } else if (reduce) {
              setLast(target); // reduced motion: show text as it lands, no typing
            }
          }
        } finally {
          netDone = true;
        }
      })();

      if (reduce) {
        await drain;
        if (started) setLast(target);
        else setError("Hmm, no answer came back. Try rephrasing.");
      } else {
        // Type the reply out at a steady, visible cadence regardless of how the
        // network chunked it (flash-lite often sends it in 2–3 big bursts).
        while (!started && !netDone) await sleep(16);
        if (!started) {
          setError("Hmm, no answer came back. Try rephrasing.");
        } else {
          let shown = 0;
          while (!netDone || shown < target.length) {
            if (shown < target.length) {
              // ~2 chars/tick normally; speed up if the network ran ahead so the
              // caret never lags far behind what's already been received.
              shown = Math.min(target.length, shown + Math.max(2, Math.ceil((target.length - shown) / 50)));
              setLast(target.slice(0, shown));
            }
            await sleep(16);
          }
        }
        await drain;
      }
    } catch {
      setError("Couldn't reach the assistant. Check your connection.");
    } finally {
      setLoading(false);
      setStreaming(false);
    }
  };

  const empty = messages.length === 0;

  return (
    <>
      {/* launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={fabRef}
            type="button"
            onClick={() => setOpen(true)}
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            aria-label="Ask Pavle's AI assistant"
            className="tonal-hover fixed bottom-20 right-4 z-[60] flex items-center gap-2 rounded-full border border-accent/40 bg-[#0a0e0b] px-4 py-2.5 font-mono text-sm text-accent-ink shadow-2xl transition-colors hover:border-accent/70 sm:right-6"
          >
            <Sparkle className="h-4 w-4 text-accent" />
            Ask&nbsp;AI
          </motion.button>
        )}
      </AnimatePresence>

      {/* panel — data-deck-ignore: the deck's window-level wheel handler
          leaves this panel's scroll alone (see SectionDeck). */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Ask Pavle's AI assistant"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={
              // Only override the static position once a keyboard is actually up
              // (>120px inset rules out browser-chrome jitter). Lift the panel
              // above the keyboard and clamp its height to the visible viewport.
              kb.inset > 120
                ? { bottom: kb.inset + 12, maxHeight: kb.height - 24 }
                : undefined
            }
            data-deck-ignore
            className="fixed bottom-20 right-4 z-[60] flex h-[min(70vh,560px)] w-[min(94vw,400px)] flex-col overflow-hidden rounded-xl border border-accent/30 bg-[#0a0e0b] shadow-2xl sm:right-6"
          >
            {/* header (window chrome) */}
            <div className="flex shrink-0 items-center gap-1.5 border-b border-line/70 bg-bg/50 px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-faint/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-2/70" />
              <span className="ml-2 flex items-center gap-1.5 font-mono text-[12px] text-muted">
                <Sparkle className="h-3.5 w-3.5 text-accent" />
                ask · pavle.ai
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close assistant"
                className="ml-auto rounded-md px-1.5 py-0.5 font-mono text-[12px] text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                esc ✕
              </button>
            </div>

            {/* transcript */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3.5 py-3.5 font-mono text-[13px] leading-relaxed"
            >
              {empty && (
                <div className="space-y-3">
                  <p className="text-muted">
                    <span className="text-accent-2">{"//"}</span> Ask me anything
                    about Pavle: his stack, projects, or experience.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="tonal-hover w-full rounded-lg border border-line bg-bg/40 px-3 py-2 text-left text-body transition-colors hover:border-accent/50 hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-br-sm bg-accent-soft px-3 py-2 text-accent-ink">
                      {m.content}
                    </p>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2">
                    <Sparkle className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" />
                    <p className="max-w-[88%] whitespace-pre-wrap break-words text-body">
                      {m.content}
                      {streaming && i === messages.length - 1 && <Caret reduce={reduce} />}
                    </p>
                  </div>
                )
              )}

              {loading && (
                <div className="flex items-center gap-2">
                  <Sparkle className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <Dots />
                </div>
              )}

              {error && (
                <p role="alert" className="text-[12px] text-accent-2">
                  {error}
                </p>
              )}

              {/* polite live region for screen readers — announces the full
                  reply once (not every streaming delta) */}
              <p className="sr-only" aria-live="polite">
                {loading
                  ? "Thinking"
                  : !streaming && messages[messages.length - 1]?.role === "assistant"
                    ? messages[messages.length - 1].content
                    : ""}
              </p>
            </div>

            {/* composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="shrink-0 border-t border-line/70 bg-bg/50 px-3 py-2.5"
              style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
            >
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Ask about Pavle…"
                  aria-label="Ask the assistant a question"
                  className="max-h-28 min-h-[2.25rem] flex-1 resize-none rounded-lg border border-line bg-bg/60 px-3 py-2 font-mono text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={loading || streaming || !input.trim()}
                  aria-label="Send"
                  className="tonal-hover flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-bg transition-opacity hover:bg-accent-2 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 font-mono text-[10px] text-faint">
                AI-generated, may be imprecise. Confirm important details with Pavle.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* memo: AskPanel takes no props and is mounted in Home, which re-renders on
   every active-section change — without this the whole panel subtree reconciled
   on each scroll-driven section crossing. */
export default memo(AskPanel);
