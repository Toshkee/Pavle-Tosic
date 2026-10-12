/* Records the project demo clips (public/video/projects) and their posters.

   Sharp and smooth: the page runs on a slowed clock (JS timers, Date,
   requestAnimationFrame at 60 a second of page time, CSS and Web Animations
   through CDP, media) while Chromium screencasts it at 2x in real time, so
   every 1/60 s of page time has a captured frame, even where the browser
   could only paint 34 a second at that size. The frames are laid on a 60 fps
   timeline, a spring camera eases toward each click (1.32x, still sharp:
   the frames are 2x), and x264 encodes with BT.709 colour, no audio and no
   metadata. The old clips were a 30 fps screencast at 1x: soft text, and
   frames held up to 1.4 s whenever the page was busy.

   Needs ffmpeg (with libx264), cwebp and Playwright with Chromium.
   Playwright is not a dependency of this site: point PLAYWRIGHT at a
   project folder that has it (default: the current folder).
   Reform's clip films its demo build: `npx vite --port 5199` in its repo
   (made-up members, no Firebase). CryptoFlow logs in as the demo user but
   never places an order: that account is shared with every visitor.

     PLAYWRIGHT=~/some-project node scripts/record-demos.mjs [slug ...]
     INSTALL=1 ...      copy clips and posters into public/, sizes into projects.ts
     RENDER_ONLY=1 ...  re-render the saved frames (another CRF or camera)
     NOZOOM=1, CRF=n, OUT=dir (default: the OS temp folder)
*/

import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { chromium } = createRequire(join(process.env.PLAYWRIGHT ?? process.cwd(), "package.json"))("playwright");
const sharp = createRequire(import.meta.url)("sharp");

const SITE = new URL("..", import.meta.url).pathname;
const OUT = process.env.OUT ?? join(tmpdir(), "demos");
mkdirSync(OUT, { recursive: true });
// How much slower than real time the page runs while it is filmed; set
// per demo in capture(): 4 by default, 2 where live data ticks in.
let SLOW = 4;
const FPS = 60;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- in the page ---- */

// The slowed clock. Runs before any page script, in every document.
const CLOCK = (slow) => {
  const realNow = performance.now.bind(performance);
  const origin = realNow();
  const now = () => origin + (realNow() - origin) / slow;
  performance.now = now;
  const RealDate = Date;
  const d0 = RealDate.now();
  const dateNow = () => d0 + (realNow() - origin) / slow;
  function VDate(...args) {
    if (!new.target) return new RealDate(dateNow()).toString();
    return args.length ? new RealDate(...args) : new RealDate(dateNow());
  }
  VDate.prototype = RealDate.prototype;
  VDate.now = dateNow;
  VDate.parse = RealDate.parse;
  VDate.UTC = RealDate.UTC;
  window.Date = VDate;
  // Frames come at 60 a second of page time, as on a 60 Hz screen: the
  // real display's frames are shared out, one in every `slow`. Games and
  // smooth scrolling that count frames keep their speed.
  const raf = window.requestAnimationFrame.bind(window);
  const pending = new Map();
  let nextId = 0, frame = 0, looping = false;
  // The timestamp is the slowed clock's own: Chrome's is already scaled by
  // Animation.setPlaybackRate, and dividing it again ran games at 1/16.
  const loop = () => {
    if (++frame % slow === 0) {
      const due = [...pending.values()];
      pending.clear();
      const vt = now();
      for (const cb of due) cb(vt);
    }
    if (pending.size) raf(loop);
    else looping = false;
  };
  window.requestAnimationFrame = (cb) => {
    pending.set(++nextId, cb);
    if (!looping) { looping = true; raf(loop); }
    return nextId;
  };
  window.cancelAnimationFrame = (id) => { pending.delete(id); };
  const st = window.setTimeout.bind(window);
  const si = window.setInterval.bind(window);
  window.setTimeout = (fn, ms, ...a) => st(fn, (Number(ms) || 0) * slow, ...a);
  window.setInterval = (fn, ms, ...a) => si(fn, (Number(ms) || 0) * slow, ...a);
  document.addEventListener("play", (e) => { e.target.playbackRate = 1 / slow; }, true);
};

// A macOS-style arrow that follows the mouse, a soft ring on each click; on
// a phone, a fingertip circle on each tap. Drawn in the page, so it is as
// sharp as the page.
const POINTER = (touch) => {
  const ARROW =
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
    '<path d="M6 3.5v18.2l4.6-4.4 3 6.9 3.3-1.4-2.9-6.8h6.4z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const ring = (x, y, size, style) => {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "fixed", left: `${x - size / 2}px`, top: `${y - size / 2}px`,
      width: `${size}px`, height: `${size}px`, borderRadius: "50%",
      pointerEvents: "none", zIndex: "2147483646", ...style,
    });
    document.documentElement.appendChild(el);
    return el;
  };
  const start = () => {
    if (touch) {
      addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        const el = ring(t.clientX, t.clientY, 46, {
          background: "rgba(20,20,20,.22)", border: "2px solid rgba(255,255,255,.85)",
          boxShadow: "0 2px 10px rgba(0,0,0,.25)",
        });
        el.animate(
          [{ transform: "scale(.6)", opacity: 1 }, { transform: "scale(1)", opacity: 1, offset: 0.35 }, { transform: "scale(1.15)", opacity: 0 }],
          { duration: 650, easing: "ease-out" },
        ).finished.then(() => el.remove());
      }, true);
      return;
    }
    const arrow = document.createElement("div");
    arrow.innerHTML = ARROW;
    Object.assign(arrow.style, {
      position: "fixed", left: "0", top: "0", width: "28px", height: "28px",
      margin: "-3.5px 0 0 -6px", pointerEvents: "none", zIndex: "2147483647",
      filter: "drop-shadow(0 2px 3px rgba(0,0,0,.28))", transformOrigin: "6px 3.5px",
      transform: `translate(${window.__px ?? -100}px,${window.__py ?? -100}px)`,
    });
    document.documentElement.appendChild(arrow);
    let x = -100, y = -100, s = 1;
    const draw = () => (arrow.style.transform = `translate(${x}px,${y}px) scale(${s})`);
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; draw(); }, true);
    addEventListener("mousedown", (e) => {
      s = 0.86; draw();
      const el = ring(e.clientX, e.clientY, 40, { background: "rgba(17,17,17,.16)", border: "1.5px solid rgba(17,17,17,.35)" });
      el.animate([{ transform: "scale(.3)", opacity: 1 }, { transform: "scale(1.25)", opacity: 0 }], { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)" })
        .finished.then(() => el.remove());
    }, true);
    addEventListener("mouseup", () => { s = 1; draw(); }, true);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", start);
  else start();
};

/* ---- capture ---- */

async function capture(slug, opts, script) {
  const {
    url, viewport = { width: 1440, height: 900 }, mobile = false,
    dpr = mobile ? 3 : 2, settle = 2500, wait,
  } = opts;
  SLOW = opts.slow ?? 4;
  const browser = await chromium.launch({ args: ["--disable-smooth-scrolling", "--hide-scrollbars"] });
  const ctx = await browser.newContext({
    viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile,
    reducedMotion: "no-preference", colorScheme: "light", locale: "en-GB",
  });
  await ctx.addInitScript(CLOCK, SLOW);
  await ctx.addInitScript(POINTER, mobile);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Animation.enable");
  const slowAnimations = () => cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / SLOW }).catch(() => {});
  page.on("load", slowAnimations);
  page.on("framenavigated", slowAnimations);
  await page.goto(url, { waitUntil: "load", timeout: 90000 });
  await slowAnimations();
  if (wait) await page.waitForSelector(wait, { timeout: 30000 });
  await sleep(settle * SLOW);

  const dir = `${OUT}/${slug}-frames`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
  const frames = [];
  let start = 0;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const file = `${dir}/${String(frames.length).padStart(5, "0")}.jpg`;
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, real: metadata.timestamp });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  start = Date.now() / 1000;
  await cdp.send("Page.startScreencast", {
    format: "jpeg", quality: 95,
    maxWidth: viewport.width * dpr, maxHeight: viewport.height * dpr,
  });

  const events = [];
  const vt = () => (Date.now() / 1000 - start) / SLOW;
  const h = helpers(page, { mobile, viewport, events, vt });
  await script(page, h);
  await sleep(150 * SLOW);
  const duration = vt();
  await cdp.send("Page.stopScreencast");
  await sleep(300);
  await browser.close();

  for (const f of frames) f.t = Math.max(0, (f.real - start) / SLOW);
  frames.sort((a, b) => a.t - b.t);
  return { frames, events, duration, viewport, dpr, mobile };
}

function helpers(page, { mobile, viewport, events, vt }) {
  const frame = 1000 / FPS;
  const pointer = { x: viewport.width * 0.62, y: viewport.height * 0.58 };
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
  // Calls step(k) once per page-time frame, k from 0 to 1, without drift.
  const animate = async (ms, step) => {
    const n = Math.max(1, Math.round(ms / frame));
    const t0 = Date.now();
    for (let i = 1; i <= n; i++) {
      await step(i / n);
      const due = t0 + i * frame * SLOW;
      const left = due - Date.now();
      if (left > 0) await sleep(left);
    }
  };
  const h = {
    wait: (ms) => sleep(ms * SLOW),
    async moveTo(x, y, ms) {
      const from = { ...pointer };
      const dist = Math.hypot(x - from.x, y - from.y);
      ms ??= Math.min(900, Math.max(380, 260 + dist * 0.75));
      // A slight arc, as a hand moves.
      const nx = -(y - from.y) / (dist || 1), ny = (x - from.x) / (dist || 1);
      const bow = Math.min(60, dist * 0.08);
      await animate(ms, async (k) => {
        const e = ease(k), b = Math.sin(Math.PI * e) * bow;
        pointer.x = from.x + (x - from.x) * e + nx * b;
        pointer.y = from.y + (y - from.y) * e + ny * b;
        await page.mouse.move(pointer.x, pointer.y);
      });
    },
    async scroll(px, ms) {
      ms ??= Math.min(2200, Math.max(700, Math.abs(px) * 0.9));
      let done = 0;
      await animate(ms, async (k) => {
        const want = Math.round(px * ease(k));
        if (want !== done) await page.mouse.wheel(0, want - done);
        done = want;
      });
    },
    // Waits until the page stops scrolling: smooth-scroll libraries
    // (Lenis) keep easing after the wheel stops.
    async settle() {
      let last = await page.evaluate(() => scrollY), still = 0;
      while (still < 3) {
        await sleep(40 * SLOW);
        const y = await page.evaluate(() => scrollY);
        still = Math.abs(y - last) < 1 ? still + 1 : 0;
        last = y;
      }
    },
    // Scrolls until the element's top sits `at` px from the top.
    async scrollTo(locator, { at = 120, ms } = {}) {
      await h.settle();
      const box = await locator.boundingBox();
      if (!box) throw new Error(`nothing to scroll to: ${locator}`);
      if (process.env.DEBUG) console.log(`scrollTo ${locator}: at ${Math.round(box.y)}, by ${Math.round(box.y - at)}`);
      await h.scroll(Math.round(box.y - at), ms);
    },
    async touchScroll(px, ms) {
      ms ??= Math.min(1600, Math.max(600, Math.abs(px) * 1.4));
      const from = await page.evaluate(() => scrollY);
      await animate(ms, (k) => page.evaluate((y) => scrollTo(0, y), from + px * ease(k)));
    },
    async target(locator) {
      const box = await locator.boundingBox();
      if (!box) throw new Error(`nothing to click: ${locator}`);
      const top = Math.max(box.y, 0), bottom = Math.min(box.y + box.height, viewport.height);
      if (bottom <= top) throw new Error(`off screen: ${locator}`);
      return { x: box.x + box.width / 2, y: (top + bottom) / 2 };
    },
    async click(locator, { pause = 140, zoom = true } = {}) {
      const { x, y } = await h.target(locator);
      if (mobile) {
        await h.wait(pause);
        events.push({ t: vt(), type: "tap", x, y, zoom });
        await locator.tap();
        return;
      }
      await h.moveTo(x, y);
      await h.wait(pause);
      events.push({ t: vt(), type: "click", x, y, zoom });
      await page.mouse.down();
      await h.wait(90);
      await page.mouse.up();
    },
    async clickAt(x, y, opts = {}) {
      await h.moveTo(x, y);
      await h.wait(opts.pause ?? 140);
      events.push({ t: vt(), type: "click", x, y, zoom: opts.zoom ?? true });
      await page.mouse.down();
      await h.wait(90);
      await page.mouse.up();
    },
    async type(locator, text, perChar = 65) {
      await h.click(locator, { zoom: false });
      await locator.pressSequentially(text, { delay: perChar * SLOW });
    },
    async hold(key, ms) {
      await page.keyboard.down(key);
      await h.wait(ms);
      await page.keyboard.up(key);
    },
    // Marks a stretch the camera should frame, without a click.
    focus(x, y, ms) {
      events.push({ t: vt(), type: "focus", x, y, ms, zoom: true });
    },
    pointer,
  };
  return h;
}

/* ---- camera and encode ---- */

// Zoom windows around clicks: the camera starts moving `lead` before a click
// and lets go `hold` after; clicks closer than `join` share one window.
function cameraTargets(events, duration, { zoom = 1.32, lead = 0.55, hold = 0.95, join = 1.1 } = {}) {
  const wins = [];
  for (const e of events) {
    if (!e.zoom || (e.type !== "click" && e.type !== "focus")) continue;
    const from = e.t - lead, to = e.t + (e.ms ? e.ms / 1000 : hold);
    const last = wins.at(-1);
    if (last && from - last.to < join) {
      last.to = Math.max(last.to, to);
      last.points.push(e);
    } else wins.push({ from, to, points: [e] });
  }
  return (t) => {
    const w = wins.find((w) => t >= w.from && t <= w.to);
    if (!w) return null;
    const p = [...w.points].reverse().find((p) => t >= p.t - lead) ?? w.points[0];
    return { z: zoom, x: p.x, y: p.y };
  };
}

async function render(slug, cap, opts) {
  const { frames, events, duration, viewport, dpr, mobile } = cap;
  const vw = viewport.width, vh = viewport.height;
  const OW = opts.outWidth ?? (mobile ? 720 : 1920);
  const OH = Math.round((OW * vh) / vw / 2) * 2;
  const n = Math.round(duration * FPS);
  const useZoom = !mobile && opts.zoom !== false && !process.env.NOZOOM;
  const target = cameraTargets(events, duration, opts.camera);

  // A critically damped spring follows the target: no overshoot, no snap.
  const w = 2 * Math.PI * 1.25, dt = 1 / FPS;
  let z = 1, cx = vw / 2, cy = vh / 2, vz = 0, vx = 0, vy = 0;
  const spring = (x, v, goal) => {
    const a = w * w * (goal - x) - 2 * w * v;
    v += a * dt;
    return [x + v * dt, v];
  };

  const mp4 = `${OUT}/${slug}.mp4`;
  const ff = spawn("ffmpeg", [
    "-v", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${OW}x${OH}`, "-r", String(FPS), "-i", "-",
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(process.env.CRF ?? opts.crf ?? 23),
    "-profile:v", "high", "-g", String(FPS * 2),
    "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709", "-color_range", "tv",
    "-movflags", "+faststart", "-an", "-map_metadata", "-1", "-map_chapters", "-1",
    "-fflags", "+bitexact", "-flags:v", "+bitexact", "-bsf:v", "filter_units=remove_types=6",
    mp4,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const write = (buf) => new Promise((ok) => (ff.stdin.write(buf) ? ok() : ff.stdin.once("drain", ok)));

  let src = 0, lastKey = "", lastBuf = null;
  for (let k = 0; k < n; k++) {
    const T = k / FPS;
    while (src + 1 < frames.length && frames[src + 1].t <= T) src++;
    const goal = (useZoom && target(T)) || { z: 1, x: vw / 2, y: vh / 2 };
    [z, vz] = spring(z, vz, goal.z);
    [cx, vx] = spring(cx, vx, goal.x);
    [cy, vy] = spring(cy, vy, goal.y);
    const cw = vw / z, ch = vh / z;
    const x0 = Math.min(Math.max(cx - cw / 2, 0), vw - cw);
    const y0 = Math.min(Math.max(cy - ch / 2, 0), vh - ch);
    // Scale the whole frame so the crop lands exactly on the output size,
    // then cut it out: libvips only computes the part that is cut.
    const s = OW / (cw * dpr);
    const RW = Math.round(vw * dpr * s), RH = Math.round(vh * dpr * s);
    const left = Math.min(Math.max(Math.round(x0 * dpr * s), 0), RW - OW);
    const top = Math.min(Math.max(Math.round(y0 * dpr * s), 0), RH - OH);
    const key = `${src}:${RW}:${left}:${top}`;
    if (key !== lastKey) {
      lastBuf = await sharp(frames[src].file)
        .resize(RW, RH, { kernel: "lanczos3" })
        .extract({ left, top, width: OW, height: OH })
        .removeAlpha()
        .raw()
        .toBuffer();
      lastKey = key;
    }
    await write(lastBuf);
  }
  ff.stdin.end();
  await new Promise((ok, fail) => ff.on("close", (c) => (c ? fail(new Error(`ffmpeg ${c}`)) : ok())));

  const posterAt = opts.posterAt ?? 0.3;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(posterAt), "-i", mp4, "-frames:v", "1", `${OUT}/${slug}-demo.png`]);
  execFileSync("cwebp", ["-quiet", "-q", "80", "-metadata", "none", `${OUT}/${slug}-demo.png`, "-o", `${OUT}/${slug}-demo.webp`]);
  execFileSync("cwebp", ["-quiet", "-q", "80", "-metadata", "none", "-resize", "640", "0", `${OUT}/${slug}-demo.png`, "-o", `${OUT}/${slug}-demo-thumb.webp`]);
  if (process.env.INSTALL) install(slug, OW, OH);
  const size = readFileSync(mp4).length;
  console.log(`${slug}: ${frames.length} frames for ${duration.toFixed(1)} s of page time (${(frames.length / duration).toFixed(0)}/s) -> ${OW}x${OH} ${FPS} fps, ${(size / 1e6).toFixed(1)} MB`);
}

// The clip and its posters into public/, and its size into projects.ts.
function install(slug, width, height) {
  copyFileSync(`${OUT}/${slug}.mp4`, `${SITE}public/video/projects/${slug}.mp4`);
  for (const name of [`${slug}-demo.webp`, `${slug}-demo-thumb.webp`]) {
    copyFileSync(`${OUT}/${name}`, `${SITE}public/images/projects/${name}`);
  }
  const file = `${SITE}src/app/projects.ts`;
  const src = readFileSync(file, "utf8");
  const entry = new RegExp(
    `(src: "/video/projects/${slug}\\.mp4",\\n\\s+poster: "[^"]+",\\n\\s+width: )\\d+(,\\n\\s+height: )\\d+`,
  );
  if (!entry.test(src)) throw new Error(`${slug}: no video entry in projects.ts`);
  writeFileSync(file, src.replace(entry, `$1${width}$2${height}`));
}

// RENDER_ONLY=1 re-renders from the frames already captured (another
// camera, another CRF) without filming again.
async function record(slug, opts, script) {
  const saved = `${OUT}/${slug}-cap.json`;
  let cap;
  if (process.env.RENDER_ONLY) cap = JSON.parse(readFileSync(saved, "utf8"));
  else {
    if (opts.before) await opts.before();
    cap = await capture(slug, opts, script);
    writeFileSync(saved, JSON.stringify(cap));
  }
  await render(slug, cap, opts);
}

/* ---- the demos ---- */

const DEMOS = {
  vaky: () =>
    record("vaky", { url: "https://vaky.me/en/", posterAt: 0.5 }, async (page, h) => {
      await h.wait(400);
      const cta = await h.target(page.getByRole("link", { name: /free concept/i }).first());
      await h.moveTo(cta.x + 10, cta.y + 4, 900);
      await h.wait(1400);
      await h.scrollTo(page.getByRole("heading", { name: /Concepts for your trade/i }), { at: 150 });
      await h.wait(350);
      for (const trade of ["Restaurant", "Gym", "Dentist"]) {
        await h.click(page.locator("button").filter({ hasText: trade }).first());
        await h.wait(950);
      }
      await h.scrollTo(page.getByRole("heading", { name: /^Pricing/i }), { at: 130 });
      await h.moveTo(980, 640, 800);
      await h.wait(1300);
    }),

  infostream: () =>
    record("infostream", { url: "https://infostream.co.me/eng", posterAt: 0.5 }, async (page, h) => {
      await h.moveTo(980, 560, 700);
      await h.wait(1300);
      await h.scroll(1000);
      await h.wait(300);
      // The pinned Expertise section plays as it scrolls.
      await h.scroll(3300, 3400);
      await h.wait(400);
      await h.scrollTo(page.getByRole("heading", { name: /Four stages/i }), { at: 120 });
      await h.wait(1000);
      await h.scrollTo(page.getByRole("heading", { name: /Our clients/i }), { at: 120 });
      await h.wait(1100);
      await h.settle();
      await h.click(page.locator('a[href="/mne"]').first(), { zoom: false });
      await page.waitForLoadState("load");
      await h.moveTo(1080, 420, 700);
      await h.wait(1400);
    }),

  "villa-vucje": () =>
    record("villa-vucje", { url: "https://villavucje.me/en/", slow: 6, crf: 25, posterAt: 0.5 }, async (page, h) => {
      await h.moveTo(900, 560, 700);
      await h.wait(1200);
      await h.scrollTo(page.getByRole("heading", { name: /Downstairs for being together/i }), { at: 140 });
      await h.wait(900);
      await h.scrollTo(page.getByRole("heading", { name: /The house in pictures/i }), { at: 110 });
      await h.wait(400);
      await h.click(page.getByRole("button", { name: /Open enlarged photo/ }).first());
      await h.wait(1000);
      for (let i = 0; i < 3; i++) {
        await h.click(page.getByRole("button", { name: "Next photo" }), { zoom: false });
        await h.wait(900);
      }
      await page.keyboard.press("Escape");
      await h.wait(500);
      await h.scrollTo(page.getByRole("heading", { name: /When are you coming/i }), { at: 140 });
      await h.wait(1300);
    }),

  "mandarina-petrovac": () =>
    record("mandarina-petrovac", { url: "https://mandarinapt.me/en/", settle: 3500, slow: 6, crf: 25, posterAt: 0.5 }, async (page, h) => {
      await h.moveTo(900, 560, 700);
      await h.wait(1300);
      await h.scrollTo(page.getByRole("heading", { name: /About the apartment/i }), { at: 140 });
      await h.wait(900);
      await h.scrollTo(page.getByRole("heading", { name: /^Pool/i }), { at: 140 });
      await h.wait(900);
      await h.scrollTo(page.getByRole("heading", { name: /^Photographs/i }), { at: 110 });
      await h.wait(400);
      await h.click(page.getByRole("link", { name: /^Open photograph/ }).first());
      await h.wait(1000);
      for (let i = 0; i < 3; i++) {
        await h.click(page.getByRole("button", { name: "Next photograph" }), { zoom: false });
        await h.wait(900);
      }
      await page.keyboard.press("Escape");
      await h.wait(500);
      await h.scrollTo(page.getByRole("heading", { name: /^Location/i }), { at: 140 });
      await h.wait(1300);
    }),

  meet2explore: () =>
    record("meet2explore", { url: "https://meet2explore.netlify.app/", zoom: false, crf: 25, posterAt: 0.5 }, async (page, h) => {
      await h.moveTo(900, 640, 700);
      await h.wait(1300);
      for (let i = 0; i < 4; i++) {
        await h.click(page.locator(".swiper-button-next").first());
        await h.wait(2000);
      }
    }),

  cryptoflow: () =>
    record(
      "cryptoflow",
      {
        url: "https://cryptofloww.netlify.app/",
        slow: 2,
        posterAt: 0.5,
        // The API sleeps when idle: wake it, so the demo log-in is quick.
        before: async () => {
          const browser = await chromium.launch();
          const page = await browser.newPage();
          await page.goto("https://cryptofloww.netlify.app/", { waitUntil: "load" });
          await page.getByRole("button", { name: /Log in as demo/ }).click();
          await page.waitForURL(/\/trade/, { timeout: 120000 });
          await browser.close();
        },
      },
      async (page, h) => {
        await h.moveTo(700, 520, 700);
        await h.wait(1300);
        await h.click(page.getByRole("button", { name: /Log in as demo/ }));
        await page.waitForURL(/\/trade/, { timeout: 60000 });
        await page.getByRole("button", { name: /^Open long/ }).waitFor();
        await h.wait(1300);
        await h.click(page.getByRole("button", { name: /^ETH/ }).first());
        await h.wait(1100);
        await h.click(page.getByRole("button", { name: "1h", exact: true }));
        await h.wait(1200);
        await h.click(page.getByRole("button", { name: "50%", exact: true }));
        await h.wait(500);
        await h.click(page.getByRole("button", { name: "10×", exact: true }));
        await h.wait(500);
        // Up to the button and no further: the demo account is shared.
        const open = await h.target(page.getByRole("button", { name: /^Open long/ }));
        await h.moveTo(open.x, open.y);
        h.focus(open.x, open.y, 1200);
        await h.wait(1500);
      },
    ),

  "anime-watchlist": () =>
    record("anime-watchlist", { url: "https://arc-anime.vercel.app", slow: 6, posterAt: 0.5 }, async (page, h) => {
      await h.moveTo(900, 560, 700);
      await h.wait(900);
      await h.scrollTo(page.getByRole("heading", { name: /Trending now/i }), { at: 110 });
      await h.moveTo(520, 420, 800);
      await h.wait(900);
      await h.settle();
      await h.scroll(-(await page.evaluate(() => scrollY)), 1000);
      await h.wait(300);
      await h.type(page.getByPlaceholder(/Search/), "Frieren", 85);
      await page.keyboard.press("Enter");
      await page.waitForURL(/q=Frieren/);
      await page.locator('a[href^="/anime/"]').first().waitFor();
      await h.wait(1100);
      await h.click(page.locator('a[href^="/anime/"]').first());
      await page.getByRole("heading", { level: 1 }).waitFor();
      await h.wait(1300);
      const add = await h.target(page.getByRole("button", { name: /Add to Watchlist/ }));
      await h.moveTo(add.x, add.y);
      h.focus(add.x, add.y, 900);
      await h.wait(1100);
      await h.scroll(420);
      await h.wait(1200);
    }),

  "reform-fitness": () =>
    record(
      "reform-fitness",
      { url: "http://localhost:5199/", viewport: { width: 390, height: 844 }, mobile: true, posterAt: 6 },
      async (page, h) => {
        await h.wait(900);
        await h.click(page.getByRole("button", { name: /Pilates Studio/ }));
        await h.wait(800);
        await h.type(page.locator("input[type=email]"), "ana@reform.test", 60);
        await h.type(page.locator("input[type=password]"), "lozinka123", 45);
        await h.click(page.getByRole("button", { name: "Prijavi se" }));
        await h.wait(1400);
        const close = page.getByRole("button", { name: "Zatvori", exact: true });
        if (await close.isVisible().catch(() => false)) {
          await h.click(close);
          await h.wait(800);
        }
        await h.touchScroll(420, 1100);
        await h.wait(800);
        await h.touchScroll(-420, 800);
        await h.click(page.locator('a[href="/raspored"]').last());
        await h.wait(1100);
        await h.click(page.getByRole("button", { name: /utorak/ }));
        await h.wait(800);
        await h.click(page.getByRole("button", { name: /mjest/ }).first());
        await h.wait(1200);
        await h.click(page.getByRole("button", { name: /Rezerviši/ }).first());
        await h.wait(1600);
        const done = page.getByRole("button", { name: "Gotovo" });
        if (await done.isVisible().catch(() => false)) {
          await h.click(done);
          await h.wait(600);
        }
        await h.click(page.locator('a[href="/termini"]').last());
        await h.wait(2000);
      },
    ),

  "ronin-duel": () =>
    record(
      "ronin-duel",
      { url: "https://toshkee.github.io/Ronin-Duel/", viewport: { width: 1280, height: 720 }, settle: 3500, zoom: false, posterAt: 9 },
      async (page, h) => {
        await h.wait(1200);
        await page.keyboard.press("Digit1");
        await h.wait(1800);
        const tap = (key) => h.hold(key, 70);
        await h.hold("KeyD", 900);
        for (let round = 0; round < 6; round++) {
          await tap("Space");
          await h.wait(280);
          await tap("Space");
          await h.wait(350);
          await h.hold("ShiftLeft", 500);
          await page.keyboard.down("KeyD");
          await tap("KeyW");
          await h.wait(250);
          await tap("Space");
          await page.keyboard.up("KeyD");
          await h.wait(400);
          await h.hold(round % 2 ? "KeyA" : "KeyD", 300);
        }
        await h.wait(800);
      },
    ),
};

const wanted = process.argv.slice(2);
for (const slug of wanted.length ? wanted : Object.keys(DEMOS)) {
  try {
    await DEMOS[slug]();
  } catch (err) {
    console.error(`${slug} FAILED: ${err.stack}`);
  }
}
