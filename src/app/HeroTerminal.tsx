"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* Contained hero panel — a small code editor that types out real TypeScript,
   syntax-highlighted in the brand palette, then cycles to the next snippet.
   Bounded to its own rounded box (window chrome + clipped body) so the motion
   lives here and never crosses page content.

   Typing runs only on the client (in an effect), starting from an empty body,
   so SSR and first paint match → no hydration mismatch (no Math.random / Date
   in render). Under prefers-reduced-motion the full code is shown at once with
   no typing. */

const KEYWORDS = new Set([
  "const", "let", "var", "async", "await", "function", "return", "type",
  "interface", "import", "export", "from", "new", "class", "extends", "if",
  "else", "for", "of", "in", "as", "true", "false", "null", "void",
]);

const TOKEN_RE =
  /(\/\/[^\n]*)|(`[^`]*`|"[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z0-9_$])/g;

type Token = { text: string; cls: keyof typeof STYLE };

const STYLE = {
  com: { color: "#4b5d4f", fontStyle: "italic" },
  str: { color: "#7ee8a0" },
  num: { color: "#7ee8a0" },
  kw: { color: "#5cf08a", fontWeight: 600 },
  type: { color: "#a7f3c4", fontWeight: 600 },
  punct: { color: "#8aa08c" },
  plain: { color: "#bfd0bf" },
} satisfies Record<string, CSSProperties>;

function tokenize(code: string): Token[] {
  const out: Token[] = [];
  for (const m of code.matchAll(TOKEN_RE)) {
    let cls: keyof typeof STYLE = "plain";
    if (m[1]) cls = "com";
    else if (m[2]) cls = "str";
    else if (m[3]) cls = "num";
    else if (m[4]) cls = KEYWORDS.has(m[4]) ? "kw" : /^[A-Z]/.test(m[4]) ? "type" : "plain";
    else if (m[5]) cls = "plain";
    else cls = "punct";
    out.push({ text: m[0], cls });
  }
  return out;
}

const SNIPPETS = [
  `// turn ideas into shipped software
async function ship(idea: Idea) {
  const app = await build(idea);
  const url = await deploy(app);
  return { ok: true, url };
}`,
  `const stack = ["TypeScript", "React", "C#"];

// front to back — design to deploy
stack.forEach((tech) => run(tech));`,
].map((s) => s.trim());

// Filename shown in the window chrome for each snippet.
const FILES = ["ship.ts", "stack.ts"];

const TOKENS = SNIPPETS.map(tokenize);

/* delay before revealing the char at index `i` of `code` */
function charDelay(code: string, i: number): number {
  const c = code[i];
  const jitter = Math.random() * 34;
  if (c === "\n") return 150 + jitter;
  if (c === " ") return 12 + jitter;
  return 24 + jitter;
}

export default function HeroTerminal() {
  const [snip, setSnip] = useState(0);
  const [shown, setShown] = useState(0); // chars revealed; Infinity = all (reduced motion)
  const [onScreen, setOnScreen] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  // Pause the per-character typing loop while the panel is scrolled out of view
  // — otherwise it re-renders on every character for the whole session even
  // when nobody can see it. Re-entry restarts the current snippet (offscreen
  // only, so it's never visible).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(Number.POSITIVE_INFINITY);
      return;
    }
    if (!onScreen) return;
    const code = SNIPPETS[snip];
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    setShown(0);
    const step = () => {
      i += 1;
      setShown(i);
      if (i < code.length) {
        timer = setTimeout(step, charDelay(code, i));
      } else {
        timer = setTimeout(() => setSnip((s) => (s + 1) % SNIPPETS.length), 2400);
      }
    };
    timer = setTimeout(step, 450);
    return () => clearTimeout(timer);
  }, [snip, onScreen]);

  const tokens = TOKENS[snip];
  const spans: React.ReactNode[] = [];
  let count = 0;
  for (let k = 0; k < tokens.length && count < shown; k++) {
    const tk = tokens[k];
    const remain = shown - count;
    const text = tk.text.length <= remain ? tk.text : tk.text.slice(0, remain);
    spans.push(
      <span key={k} style={STYLE[tk.cls]}>
        {text}
      </span>
    );
    count += tk.text.length;
  }

  // Live line:col derived from the typed-so-far text — makes the chrome read
  // like a real editor responding to its own content (no new typing effect).
  const code = SNIPPETS[snip];
  const visibleLen = Number.isFinite(shown)
    ? Math.min(shown, code.length)
    : code.length;
  const seen = code.slice(0, visibleLen);
  const line = (seen.match(/\n/g)?.length ?? 0) + 1;
  const col = visibleLen - (seen.lastIndexOf("\n") + 1) + 1;

  return (
    <div
      ref={rootRef}
      className="hero-terminal mt-8 overflow-hidden rounded-xl border border-line bg-[#0a0e0b] shadow-sm"
    >
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-line/70 px-3.5 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-faint/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-2/70" />
        <span className="ml-2 text-[11px] text-muted">{FILES[snip]}</span>
        <span className="ml-auto text-[11px] tabular-nums text-muted/80">
          TypeScript · {line}:{col}
        </span>
      </div>
      {/* code body — fixed height so cycling snippets don't shift layout */}
      <pre className="h-[168px] overflow-hidden px-4 py-3 font-mono text-[12.5px] leading-relaxed sm:text-[13px]">
        <code>
          {spans}
          <span className="hero-caret" />
        </code>
      </pre>
    </div>
  );
}
