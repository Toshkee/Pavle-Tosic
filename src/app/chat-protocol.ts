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
  | { kind: "fun" }
  | { kind: "github" };

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "card"; card: Card }
  | { type: "error"; message: string };

/* What the client sends: the conversation as text, and the card an answer
   showed. Without the card, the model read its own "here's the full set"
   with nothing shown, and apologised for it on the next turn. */
export type Turn = { role: "user" | "assistant"; text: string; card?: Card };

/* The starter questions (the landing tiles and the pills over the input),
   by the card each one asks for. Asked word for word, the route makes the
   model show that card: left to choose, it now and then answered "here's
   the full set" in text and showed nothing. */
export const QUICK_PROMPTS = {
  me: "Who are you? I want to know more about you.",
  projects: "What are your projects? What have you built recently?",
  skills: "What are your skills? What do you build with?",
  experience: "Where do you work, and what have you done there?",
  fun: "What do you do for fun? What are your hobbies?",
  contact: "How can I contact you? Are you open to work?",
} satisfies Partial<Record<Card["kind"], string>>;

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
