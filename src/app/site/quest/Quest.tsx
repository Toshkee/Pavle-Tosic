"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuVolume2, LuVolumeX } from "react-icons/lu";
import { createQuest, type Action, type Quest as Engine, type QuestUi } from "./engine";
import { FINALE } from "./missions";
import { createSound, type Sound } from "./sound";

/* Toshkee's Quest, after Clawd's Quest on claude.dev: the canvas is the
   engine's (engine.ts); everything on top of it is here. Chips in the
   corners, paper slips for the story, the controls panel, and on a phone
   touch pads (arrows to walk, a double tap held on one to run; in Ultra,
   where he runs on his own, a Sprint pad instead). The engine reports a
   snapshot whenever something a visitor can see changes, so this
   component never renders per frame. */

const KEYS: Record<string, Action> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
  Space: "jump",
  ArrowUp: "jump",
  Enter: "confirm",
  KeyK: "attack",
  KeyR: "roll",
};

const IDLE: QuestUi = {
  phase: "title",
  mode: "title",
  hearts: 3,
  hud: null,
  slip: null,
  toast: null,
  best: 0,
  sound: false,
  touch: false,
};

const GAMES_QUESTION = "Tell me about the games you are making";

export default function Quest() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const soundRef = useRef<Sound | null>(null);
  const uiRef = useRef<QuestUi>(IDLE);
  const [ui, setUi] = useState<QuestUi>(IDLE);
  const [controls, setControls] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = matchMedia("(pointer: coarse)").matches;
    const sound = createSound();
    soundRef.current = sound;
    // Audio may only start inside a gesture; iOS counts the lift of a
    // finger, desktops the press. Capture, so it runs before the game.
    const unlock = () => sound.unlock();
    const gestures = ["pointerdown", "pointerup", "touchend", "keydown"] as const;
    for (const type of gestures) window.addEventListener(type, unlock, true);
    const engine = createQuest(canvas, {
      sound,
      reduced,
      touch,
      onUi: (next) => {
        uiRef.current = next;
        setUi(next);
      },
    });
    engineRef.current = engine;
    const fit = () =>
      engine.resize(root.clientWidth, root.clientHeight, Math.min(2, devicePixelRatio || 1));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    return () => {
      observer.disconnect();
      for (const type of gestures) window.removeEventListener(type, unlock, true);
      engine.destroy();
      sound.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const engine = engineRef.current;
      if (!engine) return;
      if (event.code === "Escape") {
        const { phase } = uiRef.current;
        if (controls) setControls(false);
        else if (phase === "play") engine.pause();
        else if (phase === "title") router.push("/");
        else engine.toTitle();
        return;
      }
      if (event.code === "KeyC") {
        setControls((open) => !open);
        return;
      }
      const action = KEYS[event.code];
      if (!action) return;
      event.preventDefault();
      if (!event.repeat) engine.press(action);
    };
    const up = (event: KeyboardEvent) => {
      const action = KEYS[event.code];
      if (action) engineRef.current?.release(action);
    };
    // A key held while the window loses focus never sends its keyup.
    const blur = () => {
      for (const action of new Set(Object.values(KEYS))) engineRef.current?.release(action);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [controls, router]);

  // A tap on the stage: on a phone it is the jump; while a slip shows, it
  // turns the page.
  const stageTap = () => {
    const { phase, touch } = ui;
    if (ui.slip) engineRef.current?.press("jump");
    else if (touch && phase === "play") engineRef.current?.press("jump");
  };

  // Two taps on the same arrow within 300 ms, the second one held: run.
  const lastStep = useRef<{ action: Action | null; at: number }>({ action: null, at: 0 });
  const walkPress = (action: "left" | "right") => {
    const now = performance.now();
    const again = lastStep.current.action === action && now - lastStep.current.at < 300;
    lastStep.current = { action, at: now };
    engineRef.current?.press(action);
    if (again) engineRef.current?.press("sprint");
  };
  const walkRelease = (action: "left" | "right") => {
    engineRef.current?.release(action);
    engineRef.current?.release("sprint");
  };

  const inGame = ui.mode !== "title";
  const line = ui.slip?.text ?? ui.toast;

  return (
    <div
      ref={rootRef}
      className="quest fixed inset-0 z-0 touch-none overflow-hidden overscroll-none bg-[#171717] text-[#d8d8d8] select-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block size-full"
        onPointerDown={stageTap}
        onPointerUp={() => engineRef.current?.release("jump")}
      />

      {inGame && (
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="quest-chip" aria-label={`${ui.hearts} of 3 lives`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="text-[13px] text-[#d97757]"
                style={{ opacity: i < ui.hearts ? 1 : 0.22 }}
              >
                ♥
              </span>
            ))}
          </div>
          {ui.hud && (
            <div className="quest-chip">
              <span className="text-[#8a8a8a]">{ui.hud.label}</span>
              {ui.hud.value}
            </div>
          )}
        </div>
      )}

      <div className="absolute top-3 right-3 flex items-start gap-2">
        <div className="relative">
          <button
            type="button"
            className="quest-chip"
            aria-expanded={controls}
            onClick={() => setControls((open) => !open)}
          >
            Controls
          </button>
          {controls && <Controls />}
        </div>
        <button
          type="button"
          className="quest-chip"
          aria-pressed={ui.sound}
          aria-label={ui.sound ? "Turn sound off" : "Turn sound on"}
          onClick={() => soundRef.current?.toggle()}
        >
          {ui.sound ? (
            <LuVolume2 aria-hidden className="size-3.5" />
          ) : (
            <LuVolumeX aria-hidden className="size-3.5" />
          )}
        </button>
        <Link href="/" className="quest-chip normal-case">
          <span className="hidden sm:inline">pavletosic.com</span>
          <span className="sm:hidden">Home</span>
        </Link>
      </div>

      {line && (
        <div className="pointer-events-none absolute inset-x-4 top-[18%] flex justify-center">
          <Slip key={line} text={line} sub={ui.slip?.sub} />
        </div>
      )}

      {ui.phase === "title" && (
        <div className="absolute inset-x-0 bottom-[9%] flex flex-col items-center gap-4">
          <button
            type="button"
            className="quest-paper rotate-[-1.5deg] text-[17px] transition-transform hover:rotate-0"
            onClick={() => engineRef.current?.startQuest()}
          >
            Start game
          </button>
          <button
            type="button"
            className="quest-chip"
            onClick={() => engineRef.current?.startUltra()}
          >
            Ultra mode, the endless run
          </button>
          {ui.touch && (
            <p className="px-6 text-center text-[11px] leading-relaxed text-[#8a8a8a]">
              Arrows to walk, double-tap and hold one to run. Tap anywhere to jump, again in
              the air for a second jump.
            </p>
          )}
        </div>
      )}

      {ui.phase === "title" && (
        <div className="quest-chip absolute bottom-3 left-3" aria-label={`Best run ${ui.best} metres`}>
          <span aria-hidden>⚡</span> {String(ui.best).padStart(4, "0")}
        </div>
      )}

      {ui.phase === "end" && (
        <div className="absolute inset-x-4 top-[30%] flex justify-center">
          <div className="quest-paper max-w-[520px] rotate-[-1deg] text-center">
            {FINALE.map((text) => (
              <p key={text} className="text-[17px] leading-snug">
                {text}
              </p>
            ))}
            <div className="mt-4 flex flex-wrap justify-center gap-2 font-mono text-[11px] tracking-[0.06em] uppercase">
              <Link
                href={{ pathname: "/chat", query: { q: GAMES_QUESTION } }}
                className="rounded-md bg-[#1d1b17] px-3 py-2 text-[#f3efe6] transition-colors hover:bg-[#2f7cf6]"
              >
                Ask about the games
              </Link>
              <button
                type="button"
                className="rounded-md border border-[#1d1b17]/30 px-3 py-2 transition-colors hover:bg-[#1d1b17]/10"
                onClick={() => engineRef.current?.startQuest()}
              >
                Play again
              </button>
              <button
                type="button"
                className="rounded-md border border-[#1d1b17]/30 px-3 py-2 transition-colors hover:bg-[#1d1b17]/10"
                onClick={() => engineRef.current?.startUltra()}
              >
                Ultra mode
              </button>
            </div>
          </div>
        </div>
      )}

      {ui.touch && ui.phase === "play" && (
        <div className="absolute inset-x-3 bottom-5 flex justify-between">
          <div className="flex gap-2">
            {ui.mode === "quest" ? (
              <>
                <Pad
                  label="←"
                  name="Walk left"
                  className="quest-pad-arrow"
                  onPress={() => walkPress("left")}
                  onRelease={() => walkRelease("left")}
                />
                <Pad
                  label="→"
                  name="Walk right"
                  className="quest-pad-arrow"
                  onPress={() => walkPress("right")}
                  onRelease={() => walkRelease("right")}
                />
              </>
            ) : (
              <Pad
                label="Sprint"
                onPress={() => engineRef.current?.press("sprint")}
                onRelease={() => engineRef.current?.release("sprint")}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Pad
              label="Roll"
              onPress={() => engineRef.current?.press("roll")}
              onRelease={() => engineRef.current?.release("roll")}
            />
            <Pad
              label="Sword"
              onPress={() => engineRef.current?.press("attack")}
              onRelease={() => engineRef.current?.release("attack")}
            />
            <Pad
              label="Jump"
              onPress={() => engineRef.current?.press("jump")}
              onRelease={() => engineRef.current?.release("jump")}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* The paper slip the story is told on, typed out letter by letter (all at
   once under reduced motion). Keyed on its text by the parent, so each
   line starts from the first letter. */
function Slip({ text, sub }: { text: string; sub?: string }) {
  const [shown, setShown] = useState(() =>
    matchMedia("(prefers-reduced-motion: reduce)").matches ? text.length : 0,
  );
  useEffect(() => {
    if (shown >= text.length) return;
    const id = setInterval(() => setShown((n) => Math.min(text.length, n + 1)), 18);
    return () => clearInterval(id);
  }, [shown, text.length]);
  return (
    <div className="quest-paper quest-slip" role="status">
      {shown < text.length ? text.slice(0, shown) : text}
      {sub && <small>{sub}</small>}
    </div>
  );
}

/* A touch button that is held: pressed on pointer down, released when the
   finger lifts or slides off. */
function Pad({
  label,
  name,
  className = "",
  onPress,
  onRelease,
}: {
  label: string;
  name?: string;
  className?: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      className={`quest-pad ${className}`}
      onPointerDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
    >
      {label}
    </button>
  );
}

function Controls() {
  const rows: [string, string[], string][][] = [
    [
      ["Move", ["A", "D"], "Walk"],
      ["", ["←", "→"], "Walk"],
      ["", ["Shift"], "Run (hold)"],
      ["", ["Space", "↑"], "Jump"],
      ["", ["Space", "Space"], "Double jump"],
    ],
    [
      ["Hero", ["K"], "Swing the sword"],
      ["", ["R"], "Roll (slips through bugs)"],
    ],
    [
      ["Game", ["Enter"], "Pause"],
      ["", ["C"], "Controls"],
      ["", ["Esc"], "Back to the site"],
    ],
  ];
  return (
    <div className="quest-panel absolute top-full right-0 mt-2 normal-case">
      <h3>Controls</h3>
      {rows.map((section) => (
        <dl key={section[0][0]}>
          {section.map(([group, keys, label], i) => (
            <div key={label + i} className="contents">
              <dt className="flex gap-1">
                {i === 0 && <span className="sr-only">{group}</span>}
                {keys.map((key, k) => (
                  <kbd key={k} className="quest-kbd">
                    {key}
                  </kbd>
                ))}
              </dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}
