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

const MAX_MESSAGES = 16; // cap history sent upstream (cost / abuse guard)
const MAX_CHARS = 2000; // cap per-message length
const MAX_BODY_BYTES = 64_000; // reject oversized payloads before parsing

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

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 600,
      // Disable Gemini 2.5 "thinking": faster, cheaper, and avoids empty
      // responses where thinking consumes the whole output budget.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let data: GeminiResponse;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Gemini API error", res.status, detail.slice(0, 300));
      return Response.json({ error: "upstream" }, { status: 502 });
    }
    data = (await res.json()) as GeminiResponse;
  } catch (err) {
    console.error("Ask route fetch failed", err);
    return Response.json({ error: "upstream" }, { status: 502 });
  }

  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .map((p) => p?.text ?? "")
    .join("")
    .trim();
  const blocked =
    !!data.promptFeedback?.blockReason || candidate?.finishReason === "SAFETY";

  if (!text) {
    return Response.json({
      reply: blocked
        ? "I can't help with that one — try asking about Pavle's work, stack, or projects."
        : "Sorry, I didn't catch that — could you rephrase?",
    });
  }

  return Response.json({ reply: text });
}
