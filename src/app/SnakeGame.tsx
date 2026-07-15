"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "framer-motion";

/* snake, in the terminal — an easter egg with substance. Renders as a text
   grid inside the scrollback (a <pre>, like real terminal snake), ticks on
   the shared framer rAF loop (so it freezes in hidden tabs like every other
   moving thing on this site), and grabs arrows/WASD in the CAPTURE phase so
   steering never scrolls the page, types into the input, or (Esc) closes the
   terminal while a game is live. `q`/Esc ends it; the final board stays in
   the scrollback as an artifact with the score.

   Live game state mutates in a ref (steering + the tick both write it from
   event/rAF callbacks); every tick snapshots the render-relevant slice into
   React state, so render never touches the ref. */

const W = 26;
const H = 12;
const TICK_MS = 110;

type P = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

type Frame = {
  snake: P[];
  food: P;
  score: number;
  alive: boolean;
  quit: boolean;
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function spawnFood(snake: P[]): P {
  // Deterministic-enough for a game: retry until the food misses the snake.
  let f: P;
  do {
    f = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
  } while (snake.some((s) => s.x === f.x && s.y === f.y));
  return f;
}

const INITIAL: Frame = {
  snake: [
    { x: 8, y: 6 },
    { x: 7, y: 6 },
    { x: 6, y: 6 },
  ],
  food: { x: 16, y: 6 },
  score: 0,
  alive: true,
  quit: false,
};

export default function SnakeGame() {
  const [frame, setFrame] = useState<Frame>(INITIAL);
  const s = useRef({
    ...INITIAL,
    snake: [...INITIAL.snake],
    dir: "right" as Dir,
    nextDir: "right" as Dir,
    acc: 0,
  });

  // Steering — capture phase so nothing else on the page sees these keys
  // while the game is alive.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = s.current;
      if (!st.alive || st.quit) return;
      const map: Record<string, Dir> = {
        arrowup: "up",
        w: "up",
        arrowdown: "down",
        s: "down",
        arrowleft: "left",
        a: "left",
        arrowright: "right",
        d: "right",
      };
      const k = e.key.toLowerCase();
      if (map[k]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (map[k] !== OPPOSITE[st.dir]) st.nextDir = map[k];
        return;
      }
      if (k === "q" || k === "escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        st.quit = true;
        setFrame((f) => ({ ...f, quit: true }));
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  useAnimationFrame((_, delta) => {
    const st = s.current;
    if (!st.alive || st.quit) return;
    st.acc += Math.min(delta, 100);
    if (st.acc < TICK_MS) return;
    st.acc -= TICK_MS;

    st.dir = st.nextDir;
    const head = st.snake[0];
    const nx = head.x + (st.dir === "right" ? 1 : st.dir === "left" ? -1 : 0);
    const ny = head.y + (st.dir === "down" ? 1 : st.dir === "up" ? -1 : 0);

    if (
      nx < 0 ||
      nx >= W ||
      ny < 0 ||
      ny >= H ||
      st.snake.some((p) => p.x === nx && p.y === ny)
    ) {
      st.alive = false;
    } else {
      st.snake.unshift({ x: nx, y: ny });
      if (nx === st.food.x && ny === st.food.y) {
        st.score += 1;
        st.food = spawnFood(st.snake);
      } else {
        st.snake.pop();
      }
    }
    setFrame({
      snake: [...st.snake],
      food: st.food,
      score: st.score,
      alive: st.alive,
      quit: st.quit,
    });
  });

  const over = !frame.alive || frame.quit;

  // Build the board as strings — one <pre>, no per-cell nodes. ASCII only:
  // exotic box/block glyphs fall back out of Mononoki with different advance
  // widths and the whole board shears out of alignment.
  const grid: string[][] = Array.from({ length: H }, () =>
    Array.from({ length: W }, () => " ")
  );
  frame.snake.forEach((p, i) => {
    grid[p.y][p.x] = i === 0 ? "@" : "o";
  });
  if (!over) grid[frame.food.y][frame.food.x] = "*";
  const top = `+${"-".repeat(W)}+`;
  const rows = grid.map((r) => `|${r.join("")}|`);

  return (
    <div className="font-mono text-[12.5px] leading-[1.15]">
      <pre className="text-accent-ink" aria-hidden>
        {top}
        {"\n"}
        {rows.join("\n")}
        {"\n"}
        {top}
      </pre>
      <div className="text-muted">
        {over ? (
          <span>
            {frame.quit ? "quit." : "game over."} score:{" "}
            <span className="text-accent-ink">{frame.score}</span>
            {frame.score >= 10 ? " · respectable." : ""} type{" "}
            <span className="text-accent-ink">snake</span> to go again.
          </span>
        ) : (
          <span>
            score: <span className="text-accent-ink">{frame.score}</span> ·
            arrows or wasd steer · q quits
          </span>
        )}
      </div>
    </div>
  );
}
