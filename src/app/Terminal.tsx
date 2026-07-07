"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* Interactive command line docked at the bottom of the page. Collapsed it's a
   slim prompt; focus it (or press ⌘K / Ctrl+K, or "/") and it expands into a
   real terminal with scrollback. Commands navigate the site, open live demos,
   print info, and a couple of easter eggs. Purely event-driven — no rAF / no
   continuous cost. SSR-safe (renders the same collapsed bar on the server). */

type Project = {
  title: string;
  domain: string;
  live: string;
  code: string;
  stack: string[];
};

type TerminalProps = {
  name: string;
  role: string;
  location: string;
  social: { email: string; github: string; linkedin: string };
  resume: string;
  projects: Project[];
};

type Line = { id: number; node: ReactNode };

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const G = "text-accent"; // green
const GI = "text-accent-ink"; // bright green (links / emphasis)
const C = "text-accent-2"; // dim green
const M = "text-muted";

function Prompt() {
  return (
    <span className="select-none">
      <span className={G}>visitor@pavletosic</span>
      <span className={M}>:</span>
      <span className={C}>~</span>
      <span className={M}>$ </span>
    </span>
  );
}

function Terminal({
  name,
  role,
  location,
  social,
  resume,
  projects,
}: TerminalProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  // Seed the welcome line so it's already in the scrollback when first opened
  // (deterministic → SSR-safe, and no setState-in-effect needed to greet).
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: -1,
      node: (
        <div className={M}>
          <span className="text-ink">{name}</span> - interactive shell. type{" "}
          <span className={GI}>help</span> to explore.
        </div>
      ),
    },
  ]);
  const cmdHist = useRef<string[]>([]);
  const histPos = useRef<number>(-1);
  const idRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const print = useCallback((node: ReactNode) => {
    setLines((prev) => [...prev, { id: idRef.current++, node }]);
  }, []);

  const go = useCallback((id: string) => {
    // Deck mode: switch the active section instead of scrolling to it.
    if (window.__deckGo?.(id)) return true;
    const el = document.getElementById(id);
    if (!el) return false;
    const lenis = window.__lenis;
    if (lenis) {
      // -80 matches SmoothScroll's anchor offset so headings clear the fixed
      // mobile nav (Lenis ignores scroll-margin-top).
      lenis.scrollTo(el, { offset: -80 });
    } else {
      // No Lenis = reduced-motion: honor it, don't force a smooth animation.
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    return true;
  }, []);

  const COMMANDS = useRef<string[]>([
    "help",
    "about",
    "stack",
    "projects",
    "ls",
    "open",
    "work",
    "github",
    "experience",
    "contact",
    "email",
    "resume",
    "cv",
    "socials",
    "whoami",
    "neofetch",
    "crt",
    "theme",
    "clear",
    "exit",
  ]);

  const run = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      // Echo the typed line.
      print(
        <div className="whitespace-pre-wrap break-words">
          <Prompt />
          <span className="text-ink">{trimmed}</span>
        </div>
      );
      if (!trimmed) return;
      cmdHist.current.push(trimmed);
      histPos.current = cmdHist.current.length;

      const [cmd, ...args] = trimmed.split(/\s+/);
      const arg = args.join(" ").toLowerCase();
      const out = (node: ReactNode) =>
        print(<div className="whitespace-pre-wrap break-words">{node}</div>);

      switch (cmd.toLowerCase()) {
        case "help":
          out(
            <div className={`${M} space-y-0.5`}>
              <div className="text-body">available commands</div>
              {[
                ["about", "who I am"],
                ["stack", "languages & tools"],
                ["projects", "what I've built  (alias: ls)"],
                ["open <name>", "launch a project's live demo"],
                ["work", "jump to the work section"],
                ["github", "open my GitHub"],
                ["experience", "my background"],
                ["contact", "how to reach me"],
                ["email", "compose an email"],
                ["resume", "download my CV  (alias: cv)"],
                ["socials", "all my links"],
                ["whoami", "short bio"],
                ["neofetch", "system info"],
                ["crt", "toggle retro CRT mode"],
                ["clear", "clear the screen"],
                ["exit", "close the terminal"],
              ].map(([c, d]) => (
                <div key={c}>
                  <span className={`${GI} inline-block w-[7.5rem]`}>{c}</span>
                  <span className={M}>{d}</span>
                </div>
              ))}
              <div className={`${M} pt-1`}>
                tip: ↑/↓ history · Tab completes · ⌘K toggles
              </div>
            </div>
          );
          break;

        case "about":
          out(
            <span className={M}>
              <span className="text-ink">{name}</span> - {role} · {location}.
              Software developer at Infostream (mostly Oracle APEX & SQL);
              strongest in JavaScript/TypeScript & React. Building web apps front
              to back. <span className={M}>→ scrolling to about</span>
            </span>
          );
          go("about");
          break;

        case "stack":
          out(
            <span className={M}>
              languages: JS, TS, SQL, Python (learning C#)
              <br />
              frontend: React, HTML, CSS
              <br />
              backend: Node, Express
              <br />
              platforms: Oracle APEX, PostgreSQL, Git.{" "}
              <span className={M}>→ scrolling to stack</span>
            </span>
          );
          go("stack");
          break;

        case "projects":
        case "ls": {
          out(
            <div className="space-y-0.5">
              <div className={M}>projects/</div>
              {projects.map((p) => (
                <div key={p.title}>
                  <span className={`${GI} inline-block w-[11rem]`}>
                    {slug(p.title)}
                  </span>
                  <span className={M}>{p.stack.join(" · ")}</span>
                </div>
              ))}
              <div className={`${M} pt-1`}>
                type <span className={GI}>open &lt;name&gt;</span> to launch one
              </div>
            </div>
          );
          break;
        }

        case "open": {
          if (!arg) {
            out(<span className={M}>usage: open &lt;project&gt;</span>);
            break;
          }
          const s = slug(arg);
          // Only treat a *purely* numeric arg as an index (so "1x" / "1.9"
          // don't silently resolve to project 1).
          const n = /^\d+$/.test(arg) ? Number(arg) : NaN;
          const match =
            (n >= 1 && n <= projects.length ? projects[n - 1] : undefined) ??
            // Guard against empty slug ("open ." / "open ###") matching all.
            (s ? projects.find((p) => slug(p.title) === s) : undefined) ??
            (s ? projects.find((p) => slug(p.title).includes(s)) : undefined);
          if (!match) {
            out(
              <span className="text-body">
                no project &quot;{arg}&quot;. try{" "}
                <span className={GI}>projects</span>
              </span>
            );
            break;
          }
          out(
            <span className={M}>
              launching{" "}
              <a
                href={match.live}
                target="_blank"
                rel="noopener noreferrer"
                className={`${GI} link-underline`}
              >
                ↗ {match.domain}
              </a>
            </span>
          );
          window.open(match.live, "_blank", "noopener,noreferrer");
          break;
        }

        case "work":
          out(<span className={M}>→ scrolling to work</span>);
          go("work");
          break;

        case "github":
        case "gh":
          out(
            <span className={M}>
              opening{" "}
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`${GI} link-underline`}
              >
                ↗ github.com/Toshkee
              </a>
            </span>
          );
          window.open(social.github, "_blank", "noopener,noreferrer");
          break;

        case "experience":
        case "exp":
          out(<span className={M}>→ scrolling to experience</span>);
          go("experience");
          break;

        case "contact":
          out(
            <span className={M}>
              email <span className="text-ink">{social.email}</span>.{" "}
              <span className={M}>→ scrolling to contact</span>
            </span>
          );
          go("contact");
          break;

        case "email":
          out(
            <span className={M}>
              composing →{" "}
              <a href={`mailto:${social.email}`} className={`${GI} link-underline`}>
                {social.email}
              </a>
            </span>
          );
          window.location.href = `mailto:${social.email}`;
          break;

        case "resume":
        case "cv": {
          out(<span className={M}>downloading pavle-tosic-cv.pdf …</span>);
          const a = document.createElement("a");
          a.href = resume;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          a.remove();
          break;
        }

        case "socials":
          out(
            <div className="space-y-0.5">
              {[
                ["github", social.github, "github.com/Toshkee"],
                ["linkedin", social.linkedin, "in/tosiicp"],
                ["email", `mailto:${social.email}`, social.email],
              ].map(([k, href, label]) => (
                <div key={k}>
                  <span className={`${C} inline-block w-[6rem]`}>{k}</span>
                  <a
                    href={href}
                    target={href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className={`${GI} link-underline`}
                  >
                    {label}
                  </a>
                </div>
              ))}
            </div>
          );
          break;

        case "whoami":
          out(
            <span className={M}>
              {name.toLowerCase()} · {role.toLowerCase()} · {location.toLowerCase()}
            </span>
          );
          break;

        case "neofetch":
          out(
            <div className="flex gap-4">
              <pre className={`${C} leading-tight`}>{`   ╔═══╗
   ║ ▟▙ ║
   ║ ▜▛ ║
   ╚═══╝`}</pre>
              <div className={`${M} space-y-0.5`}>
                <div>
                  <span className={GI}>visitor</span>@
                  <span className={GI}>pavletosic</span>
                </div>
                <div>─────────────────</div>
                {[
                  ["os", "pavle.os 2026"],
                  ["shell", "zsh"],
                  ["stack", "typescript · react · node · oracle apex"],
                  ["editor", "vscode + claude code"],
                  ["since", "2025 @ infostream"],
                  ["contact", social.email],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className={`${C} inline-block w-[4.5rem]`}>{k}</span>
                    {v}
                  </div>
                ))}
              </div>
            </div>
          );
          break;

        case "crt": {
          const on = document.documentElement.classList.toggle("crt");
          out(
            <span className={M}>
              CRT mode: <span className={GI}>{on ? "on" : "off"}</span>
            </span>
          );
          break;
        }

        case "theme":
          if (arg === "crt") {
            document.documentElement.classList.add("crt");
            out(<span className={M}>theme → <span className={GI}>crt</span></span>);
          } else if (arg === "off" || arg === "terminal") {
            document.documentElement.classList.remove("crt");
            out(<span className={M}>theme → <span className={GI}>terminal</span></span>);
          } else {
            out(<span className={M}>themes: terminal (default), crt. try &quot;theme crt&quot;</span>);
          }
          break;

        case "sudo":
          out(<span className="text-body">nice try. you already have root here 😏</span>);
          break;

        case "clear":
          setLines([]);
          break;

        case "exit":
          setOpen(false);
          break;

        default:
          out(
            <span className="text-body">
              command not found: {cmd}. type{" "}
              <span className={GI}>help</span>
            </span>
          );
      }
    },
    [print, go, name, role, location, social, resume, projects]
  );

  // Focus the input whenever the terminal opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep scrollback pinned to the newest line.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, open]);

  // Global shortcuts: ⌘K / Ctrl+K toggles, "/" opens (when not already typing),
  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't open/focus the terminal (which sits behind it) while the boot
      // overlay is still up, or while the Ask panel is open (it sits above the
      // terminal, so ⌘K/Esc shouldn't leak through and steal focus).
      if (document.querySelector(".boot-overlay")) return;
      if (document.querySelector('[role="dialog"][aria-label="Ask Pavle\'s AI assistant"]'))
        return;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "/" ) {
        const t = document.activeElement;
        const typing =
          t instanceof HTMLElement &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(value);
      setValue("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = cmdHist.current;
      if (!h.length) return;
      histPos.current = Math.max(0, histPos.current - 1);
      setValue(h[histPos.current] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = cmdHist.current;
      if (!h.length) return;
      histPos.current = Math.min(h.length, histPos.current + 1);
      setValue(h[histPos.current] ?? "");
      return;
    }
    if (e.key === "Tab" && !e.shiftKey) {
      // Only complete a bare first token. Crucially, do NOT preventDefault
      // otherwise (empty input, Shift+Tab, or an arg already typed) — that
      // would trap focus in the input and make the printed links unreachable,
      // and would also clobber a half-typed argument like "open crypto".
      if (!value.trim() || value.includes(" ")) return;
      const token = value.trim().toLowerCase();
      const hit = COMMANDS.current.filter((c) => c.startsWith(token));
      if (!hit.length) return;
      e.preventDefault();
      if (hit.length === 1) setValue(hit[0] + " ");
      else print(<span className={M}>{hit.join("  ")}</span>);
    }
  };

  return (
    // data-deck-ignore: the deck's window-level wheel handler leaves this
    // panel's scroll alone (see SectionDeck).
    <div
      data-deck-ignore
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 print:hidden"
    >
      <div className="pointer-events-auto mx-auto max-w-6xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-t-xl border border-b-0 border-line bg-[#0a0e0b] shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.6)]">
          {/* window chrome — only when open */}
          {open && (
            <div className="flex items-center gap-1.5 border-b border-line/70 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-faint/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-2/70" />
              <span className="ml-2 text-[11px] text-muted">
                visitor@pavletosic - zsh
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  // blur so focus doesn't sit on a now-collapsed control (and
                  // re-focusing the input would just re-open it).
                  inputRef.current?.blur();
                }}
                aria-label="Close terminal"
                className="ml-auto text-[11px] text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
          )}

          {/* scrollback */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
            inert={!open || undefined}
            aria-hidden={!open || undefined}
            className={`overflow-y-auto px-4 font-mono text-[12.5px] leading-relaxed transition-[max-height,opacity,padding] duration-300 ease-out ${
              open
                ? "max-h-[40vh] py-3 opacity-100 sm:max-h-[50vh]"
                : "max-h-0 py-0 opacity-0"
            }`}
          >
            <div className="space-y-1">
              {lines.map((l) => (
                <div key={l.id}>{l.node}</div>
              ))}
            </div>
          </div>

          {/* input row — always visible (this is the collapsed bar). Bottom
              padding respects the iOS home-indicator safe area. */}
          <div
            className="flex items-center gap-0 border-t border-line/60 px-4 pt-2.5 font-mono text-[12.5px]"
            style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
          >
            <Prompt />
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onInputKey}
              onFocus={() => setOpen(true)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal command input"
              placeholder={open ? "" : "type a command, try “help”"}
              className="min-w-0 flex-1 bg-transparent text-ink caret-accent outline-none placeholder:text-muted"
            />
            {!open && (
              <kbd className="ml-2 hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:inline">
                ⌘K
              </kbd>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Terminal);
