import {
  SYSTEM_PROMPT,
  FALLBACKS,
  FALLBACK_NOTE,
  FALLBACK_DEFAULT,
} from "../../profile";

/* POST /api/ask — proxies a grounded chat turn to the Gemini API. Runs
   server-side (on the Cloudflare Worker in production) so GEMINI_API_KEY never
   reaches the browser. The key comes from process.env: `.env.local` for
   `next dev`, `.dev.vars` for `wrangler dev`, and a `wrangler secret` in prod
   (@opennextjs/cloudflare maps the Worker env onto process.env, read here at
   request time so secrets/vars resolve in production). */

export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
};

const BLOCKED_REPLY =
  "I can't help with that one — try asking about Pavle's work, stack, or projects.";
const EMPTY_REPLY = "Sorry, I didn't catch that — could you rephrase?";

const MAX_MESSAGES = 16; // cap history sent upstream (cost / abuse guard)
const MAX_CHARS = 2000; // cap per-message length
const MAX_BODY_BYTES = 64_000; // reject oversized payloads before parsing
const MAX_RATE_LIMIT_KEYS = 5000;
const SITE_ORIGIN = "https://pavletosic.com";
const UPSTREAM_TIMEOUT_MS = 30_000;
const MAX_SSE_BUFFER_CHARS = 128_000;
const MAX_OUTPUT_CHARS = 16_000;
const MAX_UPSTREAM_ATTEMPTS = 3;
const MODEL_NAME = /^[a-z0-9._-]+$/i;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// Transient upstream failures worth retrying (overload / gateway / server).
// 503 is Gemini's "high demand"; 429 its quota throttle.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

// Best-effort per-IP rate limit. It's an in-memory sliding window, so it only
// holds within a single warm Worker isolate — a determined attacker spraying
// cold isolates can slip past. It's a cheap first line of defense; the
// authoritative control is a Cloudflare rate-limiting rule on /api/ask (see
// .dev.vars.example / deploy notes). Keeps the public, key-spending endpoint
// from being trivially looped by one client.
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_MS = 60_000; // per IP per minute
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  // Prune before admitting a new key. If an isolate already has thousands of
  // active clients, fail closed instead of growing attacker-controlled state.
  if (!hits.has(ip) && hits.size >= MAX_RATE_LIMIT_KEYS) {
    for (const [key, timestamps] of hits) {
      if (timestamps.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
    if (hits.size >= MAX_RATE_LIMIT_KEYS) return true;
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function errorResponse(
  error: string,
  status: number,
  headers: Record<string, string> = {}
): Response {
  return Response.json(
    { error },
    {
      status,
      headers: { "Cache-Control": "no-store", ...headers },
    }
  );
}

function isAllowedOrigin(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const origin = new URL(raw).origin;
    if (origin !== raw) return false;
    const configured = (process.env.SITE_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return origin === SITE_ORIGIN || configured.includes(origin);
  } catch {
    return false;
  }
}

async function readBoundedJson(req: Request): Promise<unknown> {
  if (!req.body) throw new SyntaxError("missing body");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel("request body too large");
        throw new RangeError("request body too large");
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released/cancelled */
    }
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export async function POST(req: Request): Promise<Response> {
  // This endpoint only serves the site's browser widget. Requiring an explicit,
  // fixed Origin rejects scripts that omit it and avoids trusting Host headers.
  const requestOrigin = req.headers.get("origin");
  if (!isAllowedOrigin(requestOrigin)) {
    return errorResponse("forbidden", 403);
  }

  const contentType = req.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return errorResponse("unsupported_media_type", 415);
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Feature isn't wired up (no key) — the panel shows a "not configured" note.
    return errorResponse("not_configured", 503);
  }

  // Cloudflare sets and sanitizes cf-connecting-ip. x-forwarded-for is not a
  // safe fallback because a direct client can spoof it to evade the limit.
  const ip = (req.headers.get("cf-connecting-ip") || "unknown").slice(0, 64);
  if (rateLimited(ip)) {
    return errorResponse("rate_limited", 429, { "Retry-After": "60" });
  }

  const declared = req.headers.get("content-length");
  const declaredLength = declared === null ? null : Number(declared);
  if (
    declaredLength !== null &&
    (!Number.isSafeInteger(declaredLength) || declaredLength < 0)
  ) {
    return errorResponse("bad_request", 400);
  }
  if (declaredLength !== null && declaredLength > MAX_BODY_BYTES) {
    return errorResponse("too_large", 413);
  }

  let body: { messages?: unknown };
  try {
    const parsed = await readBoundedJson(req);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return errorResponse("bad_request", 400);
    }
    body = parsed as { messages?: unknown };
  } catch (error) {
    const tooLarge = error instanceof RangeError;
    return errorResponse(
      tooLarge ? "too_large" : "bad_request",
      tooLarge ? 413 : 400
    );
  }

  // Trim to the last MAX_MESSAGES BEFORE filtering so the type guard/map run on
  // a bounded array, never the full attacker-supplied payload.
  const raw = (Array.isArray(body?.messages) ? (body.messages as unknown[]) : []).slice(-MAX_MESSAGES);
  const messages: ChatMessage[] = raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (("role" in m && ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant")) as boolean) &&
        "content" in m &&
        typeof (m as ChatMessage).content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS).trim() }))
    .filter((m) => m.content.length > 0);

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return errorResponse("bad_request", 400);
  }

  // flash-lite: fastest/cheapest Gemini, with the most generous free-tier
  // request quota — ideal for a short grounded chat widget. Override with the
  // GEMINI_MODEL env var (e.g. "gemini-2.5-flash" on a paid plan).
  const configuredPrimary = process.env.GEMINI_MODEL?.trim() ?? "";
  const primaryModel = MODEL_NAME.test(configuredPrimary)
    ? configuredPrimary
    : "gemini-2.5-flash-lite";
  // Sibling models to fall back to when the primary is overloaded. Gemini's 503
  // "high demand" is per-model — each has its own capacity pool — so switching
  // recovers where retrying the same model wouldn't. Override with
  // GEMINI_FALLBACK_MODELS (CSV); set it to "" to disable fallback.
  const fallbackModels = (
    process.env.GEMINI_FALLBACK_MODELS ?? "gemini-2.5-flash,gemini-2.0-flash-lite"
  )
    .split(",")
    .map((m) => m.trim())
    .filter((m) => MODEL_NAME.test(m) && m !== primaryModel)
    .slice(0, 1);

  const buildPayload = (model: string) => {
    const generationConfig: Record<string, unknown> = {
      temperature: 0.4,
      maxOutputTokens: 1000, // headroom so replies never truncate mid-sentence
    };
    // Disable Gemini 2.5 "thinking": faster, cheaper, and avoids empty replies
    // where thinking eats the whole output budget. Only 2.5 models accept this
    // field — sending it to a 2.0 model is rejected as an invalid argument.
    if (model.includes("2.5")) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    return {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig,
    };
  };

  const callGemini = (model: string) =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(buildPayload(model)),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      }
    );

  // Retry plan: try the primary twice (rides out brief transient blips), then
  // one fallback model. Every retry happens BEFORE any bytes reach the
  // client, so a recovered attempt still streams one clean, complete reply.
  const plan = [primaryModel, primaryModel, ...fallbackModels].slice(
    0,
    MAX_UPSTREAM_ATTEMPTS
  );
  let upstreamBody: ReadableStream<Uint8Array> | null = null;
  for (let i = 0; i < plan.length; i++) {
    if (i > 0) await sleep(250 * i); // backoff: 250ms, 500ms, 750ms…
    const model = plan[i];
    try {
      const res = await callGemini(model);
      if (res.ok && res.body) {
        upstreamBody = res.body;
        break;
      }
      await res.body?.cancel().catch(() => {});
      console.error(
        `Gemini API error (${model}, attempt ${i + 1}/${plan.length})`,
        res.status
      );
      // 400/401/403 won't fix themselves on retry — fail fast.
      if (!RETRYABLE_STATUS.has(res.status)) break;
    } catch (err) {
      console.error(
        `Ask route fetch failed (${model}, attempt ${i + 1}/${plan.length})`,
        err
      );
    }
  }

  if (!upstreamBody) {
    // Gemini is unreachable (quota exhausted, outage) — degrade to a static
    // grounded reply instead of an error, so the widget never looks dead to a
    // visitor. The note is honest that the live model is down; the reply comes
    // from the same facts the model would have used. Upstream statuses were
    // already logged per attempt above.
    const lastUser = messages[messages.length - 1].content;
    const reply =
      FALLBACKS.find((f) => f.match.test(lastUser))?.reply ?? FALLBACK_DEFAULT;
    return new Response(FALLBACK_NOTE + reply, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // Re-stream Gemini's SSE to the client as plain text: parse each `data:`
  // event, extract the incremental text delta, and forward just the text so the
  // browser can render the reply as it arrives.
  const reader = upstreamBody.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let emitted = false;
      let emittedChars = 0;
      let blocked = false;
      // Enqueue defensively: if the client has disconnected the controller is
      // closed and enqueue throws — treat that as "stop", not an error.
      const push = (s: string): boolean => {
        try {
          controller.enqueue(encoder.encode(s));
          return true;
        } catch {
          return false;
        }
      };
      // Parse one SSE line and forward its text delta. Returns false only if the
      // client has gone (caller should stop).
      const handleLine = (line: string): boolean => {
        if (!line.startsWith("data:")) return true;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") return true;
        let obj: GeminiResponse;
        try {
          obj = JSON.parse(json) as GeminiResponse;
        } catch {
          return true; // ignore non-JSON keep-alive lines
        }
        const candidate = obj.candidates?.[0];
        if (obj.promptFeedback?.blockReason || candidate?.finishReason === "SAFETY") {
          blocked = true;
        }
        const text = (candidate?.content?.parts ?? []).map((p) => p?.text ?? "").join("");
        if (text) {
          emitted = true;
          const remaining = MAX_OUTPUT_CHARS - emittedChars;
          if (remaining <= 0) {
            reader.cancel("output limit reached").catch(() => {});
            return false;
          }
          const safeText = text.slice(0, remaining);
          emittedChars += safeText.length;
          const accepted = push(safeText);
          if (text.length > remaining) {
            reader.cancel("output limit reached").catch(() => {});
            return false;
          }
          return accepted;
        }
        return true;
      };
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          if (buffer.length > MAX_SSE_BUFFER_CHARS) {
            throw new Error("Gemini SSE event exceeded the buffer limit");
          }
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!handleLine(line)) return; // client gone — stop reading upstream
          }
        }
        // Flush any trailing event the stream left without a final newline —
        // otherwise the last delta (the end of the sentence) would be dropped.
        buffer += decoder.decode();
        const tail = buffer.trim();
        if (tail) handleLine(tail);
        if (!emitted) push(blocked ? BLOCKED_REPLY : EMPTY_REPLY);
      } catch (err) {
        console.error("Ask route stream failed", err);
        if (!emitted) push(EMPTY_REPLY);
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed (client disconnected) */
        }
        try {
          reader.releaseLock();
        } catch {
          /* reader already released/cancelled */
        }
      }
    },
    cancel() {
      // Client disconnected — stop pulling from Gemini.
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
