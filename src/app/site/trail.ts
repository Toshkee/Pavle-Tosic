/* The trail the mouse leaves in the dot grid under every page, after two
   21st.dev components: Dotted Trail Cursor
   (https://21st.dev/@hyperiux/components/dotted-trail-cursor) and
   Background ASCII Wake
   (https://21st.dev/@nikolas-sapa/components/background-ascii-wake).
   The resting grid is CSS (.dot-grid in globals.css, on the canvas itself),
   so it is there before hydration and on touch screens; this draws only
   what the mouse stirs up. Where it passes, the grid's dots grow, turn into
   characters in the middle of the wake, and settle back into dots. In ink:
   black on the light theme, white on the dark one. */

// The grid pitch: must match the background-size of .dot-grid.
const CELL = 14;
// The wake's radius at full speed, in px (Pavle picked 70 in the cursor
// lab). A slow mouse draws it at 55% of that.
const RADIUS = 70;
// Mouse speed, in px per ms, that counts as full speed: a brisk flick.
const FULL_SPEED = 2.2;
// Characters from light to dense, for the middle of the wake.
const RAMP = ":-=+*#%@";
// Below DOT a stirred cell is still a dot (an ink one, a little bigger
// than the grey dot under it); below SHOW it is left to the CSS grid.
const DOT = 0.2;
const SHOW = 0.04;
// A cell fades as e^(-t / 0.8 s): a full one drops below SHOW in 2.6 s and
// below FLOOR in 4.4 s, and once every cell is there the loop sleeps.
const FADE_S = 0.8;
const FLOOR = 0.004;
const FONT = "600 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function startTrail(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const ctx = context;

  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let originX = 0;
  let originY = 0;
  // How stirred each grid point is, 0 to 1.
  let level = new Float32Array(0);
  // 0 to 2 per point, shuffled a little every frame: nudges the character
  // one step along the ramp so the wake shimmers instead of sitting still.
  let jitter = new Uint8Array(0);
  let frame = 0;
  let lastFrame = 0;
  let pointer: { x: number; y: number; t: number; speed: number } | null = null;

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // background-position: center puts a CSS dot on the box's centre.
    originX = (width / 2) % CELL;
    originY = (height / 2) % CELL;
    cols = Math.ceil((width - originX) / CELL) + 1;
    rows = Math.ceil((height - originY) / CELL) + 1;
    level = new Float32Array(cols * rows);
    jitter = new Uint8Array(cols * rows).map(() => (Math.random() * 3) | 0);
  };

  const stamp = (x: number, y: number, radius: number, strength: number) => {
    const c0 = Math.max(0, Math.floor((x - radius - originX) / CELL));
    const c1 = Math.min(cols - 1, Math.ceil((x + radius - originX) / CELL));
    const r0 = Math.max(0, Math.floor((y - radius - originY) / CELL));
    const r1 = Math.min(rows - 1, Math.ceil((y + radius - originY) / CELL));
    for (let r = r0; r <= r1; r++) {
      const dy = originY + r * CELL - y;
      for (let c = c0; c <= c1; c++) {
        const dx = originX + c * CELL - x;
        const distance = Math.hypot(dx, dy);
        if (distance >= radius) continue;
        const k = 1 - distance / radius;
        const value = strength * k * k * (3 - 2 * k);
        const i = r * cols + c;
        if (value > level[i]) level[i] = value;
      }
    }
  };

  // Stamps every half cell along the move, so a fast flick leaves a
  // continuous wake rather than a row of blots.
  const stroke = (x0: number, y0: number, x1: number, y1: number, speed: number) => {
    const s = Math.min(1, speed / FULL_SPEED);
    const radius = RADIUS * (0.55 + 0.45 * s);
    const strength = Math.min(1, 0.45 + 0.7 * s);
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (CELL / 2)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius, strength);
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Read every frame, so the theme toggle recolours a wake mid-fade.
    ctx.fillStyle =
      getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#0a0a0a";
    ctx.font = FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const top = RAMP.length - 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const e = level[i];
        if (e < SHOW) continue;
        const x = originX + c * CELL;
        const y = originY + r * CELL;
        ctx.globalAlpha = 0.35 + 0.65 * e;
        if (e < DOT) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8 + 5 * e, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const step = Math.round(((e - DOT) / (1 - DOT)) * top) + jitter[i] - 1;
          ctx.fillText(RAMP[Math.max(0, Math.min(top, step))], x, y);
        }
      }
    }
    ctx.globalAlpha = 1;
  };

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const fade = Math.exp(-dt / FADE_S);
    let live = false;
    for (let i = 0; i < level.length; i++) {
      if (level[i] === 0) continue;
      level[i] *= fade;
      if (level[i] < FLOOR) level[i] = 0;
      else live = true;
    }
    for (let k = 0; k < 80; k++) {
      jitter[(Math.random() * jitter.length) | 0] = (Math.random() * 3) | 0;
    }
    draw();
    frame = live ? requestAnimationFrame(tick) : 0;
  };

  const wake = () => {
    if (frame) return;
    lastFrame = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const { clientX: x, clientY: y, timeStamp: t } = event;
    if (!pointer) {
      // The first move only places the pointer, so the wake does not
      // streak in from wherever the mouse left the window.
      pointer = { x, y, t, speed: 0 };
      return;
    }
    const dt = Math.max(1, t - pointer.t);
    pointer.speed = pointer.speed * 0.6 + (Math.hypot(x - pointer.x, y - pointer.y) / dt) * 0.4;
    stroke(pointer.x, pointer.y, x, y, pointer.speed);
    pointer.x = x;
    pointer.y = y;
    pointer.t = t;
    wake();
  };

  const onLeave = (event: MouseEvent) => {
    if (!event.relatedTarget) pointer = null;
  };

  const onResize = () => {
    resize();
    draw();
  };

  resize();
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseout", onLeave);
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("mouseout", onLeave);
    window.removeEventListener("resize", onResize);
    if (frame) cancelAnimationFrame(frame);
  };
}
