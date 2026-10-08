/* The wire format between /api/chat and the Chat component, shared so both
   ends agree at compile time. The response is NDJSON: one ChatEvent per line,
   text deltas interleaved with the cards the model chose to show. */

export type Card =
  | { kind: "me" }
  | { kind: "projects" }
  | { kind: "project"; slug: string }
  | { kind: "skills" }
  | { kind: "experience" }
  | { kind: "contact" }
  | { kind: "fun" };

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "card"; card: Card }
  | { type: "error"; message: string };

/* What the client sends: the conversation as plain text. Cards are not sent
   back; the model sees what it said, and the facts are in its prompt. */
export type Turn = { role: "user" | "assistant"; text: string };

export const LIMITS = {
  // One visitor message. Long enough for a real question, short enough that
  // nobody pastes a document in to get it summarised on my key.
  messageChars: 500,
  // Assistant turns are capped too: they come back from the browser, so a
  // tampered client could otherwise send any amount of "history".
  replyChars: 4000,
  // Turns of history forwarded upstream; older ones are dropped.
  turns: 12,
};

/* Shown when a request fails for any reason other than the rate limit. The
   chat appends the email address, hence the colon. */
export const FAILED_MESSAGE =
  "Something went wrong on my side. Try again, or email me instead:";
