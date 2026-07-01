import { SYSTEM_PROMPT } from "../../profile";

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
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic prune so the map can't grow unbounded across many IPs.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > RATE_LIMIT;
}

export async function POST(req: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    // Feature isn't wired up (no key) — the panel shows a "not configured" note.
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  // Same-origin guard: browsers send Origin on cross-site POSTs, so this blocks
  // the easy "embed/script it from another site" abuse at near-zero cost. A
  // missing Origin (e.g. server-side curl) still passes — the rate limit and a
  // Cloudflare WAF rule cover that gap.
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("host");
    try {
      if (!host || new URL(origin).host !== host) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const declaredLength = Number(req.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
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
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  // flash-lite: fastest/cheapest Gemini, with the most generous free-tier
  // request quota — ideal for a short grounded chat widget. Override with the
  // GEMINI_MODEL env var (e.g. "gemini-2.5-flash" on a paid plan).
  const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  // Sibling models to fall back to when the primary is overloaded. Gemini's 503
  // "high demand" is per-model — each has its own capacity pool — so switching
  // recovers where retrying the same model wouldn't. Override with
  // GEMINI_FALLBACK_MODELS (CSV); set it to "" to disable fallback.
  const fallbackModels = (
    process.env.GEMINI_FALLBACK_MODELS ?? "gemini-2.5-flash,gemini-2.0-flash-lite"
  )
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m && m !== primaryModel);

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
      }
    );

  // Retry plan: try the primary twice (rides out brief transient blips), then
  // walk the fallback models. Every retry happens BEFORE any bytes reach the
  // client, so a recovered attempt still streams one clean, complete reply.
  const plan = [primaryModel, primaryModel, ...fallbackModels];
  let upstreamBody: ReadableStream<Uint8Array> | null = null;
  let lastStatus = 0;
  for (let i = 0; i < plan.length; i++) {
    if (i > 0) await sleep(250 * i); // backoff: 250ms, 500ms, 750ms…
    const model = plan[i];
    try {
      const res = await callGemini(model);
      if (res.ok && res.body) {
        upstreamBody = res.body;
        break;
      }
      lastStatus = res.status;
      const detail = await res.text().catch(() => "");
      console.error(
        `Gemini API error (${model}, attempt ${i + 1}/${plan.length})`,
        res.status,
        detail.slice(0, 200)
      );
      // 400/401/403 won't fix themselves on retry — fail fast.
      if (!RETRYABLE_STATUS.has(res.status)) break;
    } catch (err) {
      lastStatus = 0;
      console.error(
        `Ask route fetch failed (${model}, attempt ${i + 1}/${plan.length})`,
        err
      );
    }
  }

  if (!upstreamBody) {
    // Distinguish a temporary overload (503/429) so the client invites a retry
    // instead of showing a dead-end "offline" error.
    const overloaded = lastStatus === 503 || lastStatus === 429;
    return Response.json(
      { error: overloaded ? "overloaded" : "upstream" },
      overloaded ? { status: 503, headers: { "Retry-After": "4" } } : { status: 502 }
    );
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
          return push(text);
        }
        return true;
      };
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
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
