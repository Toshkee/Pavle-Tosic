import Anthropic from "@anthropic-ai/sdk";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  FAILED_MESSAGE,
  LIMITS,
  type ChatEvent,
  type Turn,
} from "../../chat-protocol";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOLS, toCard } from "./tools";

/* POST /api/chat: the conversation in, an NDJSON stream of ChatEvents out
   (text deltas and the cards the model chose to show). Runs on the Worker so
   ANTHROPIC_API_KEY never reaches the browser. The key comes from
   process.env: .env.local for `next dev`, .dev.vars for `npm run preview`,
   and a Worker secret in production
   (`npx wrangler secret put ANTHROPIC_API_KEY`). */

// $0.10 in / $0.50 out per million tokens (October 2026, prompts under
// 100K). The prompt is ~6K tokens and cached after the first request, so an
// answer costs well under a tenth of a cent.
const MODEL = "claude-haiku-5-5";
const MAX_BODY_CHARS = 64_000;
// Room for a little adaptive thinking plus a short answer.
const MAX_OUTPUT_TOKENS = 2048;
const UPSTREAM_TIMEOUT_MS = 30_000;
// Round one may call a tool; round two has tool_choice "none", so it must
// answer in text. One card per answer is all the prompt asks for.
const MAX_ROUNDS = 2;

const RATE_LIMITED =
  "That's a lot of questions in a minute. Give me a moment, then ask again.";
const UPSTREAM_BUSY =
  "I'm getting a lot of questions right now. Try again in a minute.";
// A safety classifier declined the request (stop_reason "refusal"). Haiku
// has no server-side fallback model, so the visitor gets a nudge instead.
const DECLINED =
  "That's not something I can answer here. Ask me about my work instead!";

function errorResponse(message: string, status: number): Response {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/* Only this site's own pages may call the endpoint. Browsers always send
   Origin on a cross-site POST and cannot forge it, so this stops other sites
   from spending the key through their visitors. Scripts can forge anything,
   which is what the per-IP rate limit is for. */
function isSameOrigin(req: Request): boolean {
  return req.headers.get("origin") === new URL(req.url).origin;
}

function parseTurns(body: unknown): Turn[] | null {
  if (typeof body !== "object" || body === null || !("messages" in body)) {
    return null;
  }
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const turns: Turn[] = [];
  for (const message of messages.slice(-LIMITS.turns)) {
    if (typeof message !== "object" || message === null) return null;
    const { role, text } = message as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof text !== "string") {
      return null;
    }
    const trimmed = text.trim();
    const max = role === "user" ? LIMITS.messageChars : LIMITS.replyChars;
    if (!trimmed || trimmed.length > max) return null;
    turns.push({ role, text: trimmed });
  }
  // The conversation must open and close on a user turn.
  while (turns[0]?.role === "assistant") turns.shift();
  return turns.at(-1)?.role === "user" ? turns : null;
}

async function converse(
  client: Anthropic,
  messages: Anthropic.MessageParam[],
  signal: AbortSignal,
  send: (event: ChatEvent) => void,
): Promise<void> {
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const stream = client.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        // The tools and this prompt are the same on every request, so they
        // are cached: round two and the next visitor within five minutes
        // read them at a tenth of the price.
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: TOOLS,
        tool_choice: { type: round < MAX_ROUNDS ? "auto" : "none" },
        // "low" answered well in English but skipped the card on questions
        // in Montenegrin while still saying "see the card below"; "medium"
        // (Haiku 5.5's default) calls the tool.
        output_config: { effort: "medium" },
        messages,
      },
      { signal },
    );
    let spoke = false;
    stream.on("text", (text) => {
      spoke ||= text.trim().length > 0;
      send({ type: "text", text });
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      send({ type: "text", text: DECLINED });
      return;
    }
    const calls = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    // Only a turn that ended to call tools runs them: one cut off at
    // max_tokens may carry a truncated input.
    if (message.stop_reason !== "tool_use" || calls.length === 0) return;

    // The whole turn goes back, thinking blocks included, unchanged.
    messages.push({ role: "assistant", content: message.content });
    messages.push({
      role: "user",
      content: calls.map((call): Anthropic.ToolResultBlockParam => {
        const card = toCard(call);
        if (card) send({ type: "card", card });
        return {
          type: "tool_result",
          tool_use_id: call.id,
          content: card ? "The card is on screen now." : "There is no such card.",
          is_error: !card,
        };
      }),
    });
    // A turn that already answered in text before calling the tool is
    // complete: given a second round the model repeats itself.
    if (spoke) return;
  }
}

export async function POST(req: Request): Promise<Response> {
  if (!isSameOrigin(req)) return errorResponse("forbidden", 403);

  const contentType = req.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") {
    return errorResponse("unsupported_media_type", 415);
  }

  const { env } = getCloudflareContext();
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  const { success } = await env.CHAT_LIMITER.limit({ key: ip });
  if (!success) return errorResponse(RATE_LIMITED, 429);

  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) return errorResponse("too_large", 413);
  let turns: Turn[] | null;
  try {
    turns = parseTurns(JSON.parse(raw));
  } catch {
    turns = null;
  }
  if (!turns) return errorResponse("bad_request", 400);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[chat] ANTHROPIC_API_KEY is not set");
    return errorResponse(FAILED_MESSAGE, 500);
  }

  // One retry at most: a visitor is watching the dots.
  const client = new Anthropic({ apiKey, maxRetries: 1 });
  const messages: Anthropic.MessageParam[] = turns.map((turn) => ({
    role: turn.role,
    content: turn.text,
  }));

  // Aborts the upstream call when the visitor presses stop or leaves, or
  // when the model takes longer than the timeout.
  const cancel = new AbortController();
  const signal = AbortSignal.any([
    cancel.signal,
    AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  ]);
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        if (!cancel.signal.aborted) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      };
      try {
        await converse(client, messages, signal, send);
      } catch (error) {
        if (!cancel.signal.aborted) {
          // 429 is the account's rate limit, 529 an overloaded API: both
          // pass. Anything else is logged by status, never by content.
          const status =
            error instanceof Anthropic.APIError ? error.status : undefined;
          console.error("[chat] upstream failed", status ?? error);
          send({
            type: "error",
            message:
              status === 429 || status === 529 ? UPSTREAM_BUSY : FAILED_MESSAGE,
          });
        }
      } finally {
        if (!cancel.signal.aborted) controller.close();
      }
    },
    cancel() {
      cancel.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
