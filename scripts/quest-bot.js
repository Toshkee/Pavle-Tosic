/* Plays Toshkee's Quest (/play) on its own, to check that every mission can
   still be finished after a change. Needs `npm run dev`: the engine then
   exposes window.__quest.state() (the hero, hearts, pits, ledges, bugs and
   the things still to pick up; see QuestDebug in site/quest/engine.ts).
   Paste this file into the browser console on http://localhost:3000/play,
   then `__bot.start(240000)` (ms to run) and watch `__bot.log`; `__bot.stop()`
   lets go of every key. It presses the real keys through synthetic
   KeyboardEvents, so it tests the same path a visitor uses. */
(() => {
  const held = new Map();
  let lastAssert = 0;
  const send = (code, down) =>
    window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code, bubbles: true }));
  const key = (code, down) => {
    if (held.get(code) === down) return;
    held.set(code, down);
    send(code, down);
  };
  const tap = (code, ms = 60) => {
    key(code, true);
    setTimeout(() => key(code, false), ms);
  };
  const hud = () => document.body.innerText.replace(/\s+/g, " ");
  const log = [];
  let timer = null;
  let lastX = 0;
  let stuckT = 0;
  let lastSlipTap = 0;
  let jumpAt = 0;
  let secondAt = 0;
  let lastSwing = 0;
  let lastRoll = 0;
  const note = (m) => {
    const s = window.__quest.state();
    log.push(`${(performance.now() / 1000).toFixed(1)} ${m} @${Math.round(s.x)} h${s.hearts} ${hud().slice(6, 26)}`);
  };

  const step = () => {
    const q = window.__quest;
    if (!q) return;
    const s = q.state();
    const now = performance.now();
    const text = hud();
    // A slip: turn the page.
    if (text.includes("PRESS SPACE") || text.includes("PRESS ENTER")) {
      for (const c of [...held.keys()]) key(c, false);
      if (now - lastSlipTap > 300) {
        lastSlipTap = now;
        tap(text.includes("PRESS ENTER") ? "Enter" : "Space");
      }
      return;
    }
    if (s.phase !== "play") return;
    // The page may blur under a test harness, which releases every key in
    // the game: re-assert the held ones now and then.
    if (now - lastAssert > 400) {
      lastAssert = now;
      for (const c of ["ArrowRight", "ArrowLeft", "ShiftLeft"]) if (held.get(c)) send(c, true);
    }
    // Head for the nearest thing to collect, else the flag, the bell, or the end.
    const items = s.pickups.slice().sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x));
    const target = items[0]
      ? items[0]
      : s.flag !== null
        ? { x: s.flag, y: s.groundY }
        : s.goal !== null
          ? { x: s.goal, y: s.groundY }
          : { x: s.length - 40, y: s.groundY };
    const dir = target.x > s.x + 12 ? 1 : target.x < s.x - 12 ? -1 : 0;
    const onGround = s.grounded;
    const ahead = (o, lo, hi) => {
      const d = (o - s.x) * (dir || 1);
      return d >= lo && d <= hi;
    };
    const low = Math.abs(s.y - s.groundY) < 40;
    if (now - lastSwing < 520 || now - lastRoll < 480) return;
    // Bugs: roll through one that is already close, swing at one in reach.
    const near = s.bugs.find((b) => ahead(b.x, -30, 70));
    if (near && low && onGround) {
      lastRoll = now;
      tap("KeyR");
      note("roll through bug");
      return;
    }
    const bug = s.bugs.find((b) => ahead(b.x, 70, 130));
    if (bug && low && onGround) {
      lastSwing = now;
      key("ArrowLeft", false);
      key("ArrowRight", false);
      tap("KeyK");
      note(`swing at bug ${bug.big ? "big" : ""}`);
      return;
    }
    // Pits: sprint up to them and across, the wide ones with a second jump
    // at the top of the first. Ledge items: jump when near, high ones twice.
    const edge = (p) => (dir >= 0 ? p.x : p.x + p.w);
    const pitNear = s.pits.find((p) => ahead(edge(p), -20, 260) || ahead(p.x + p.w, 0, 300));
    const pit = s.pits.find((p) => ahead(edge(p), 0, 110));
    const high = target.y < s.groundY - 90 && Math.abs(target.x - s.x) < 150 && Math.abs(target.x - s.x) > 50;
    const wantJump = onGround && (pit || high);
    key("ShiftLeft", (!!pitNear || !onGround) && !high);
    key("ArrowRight", dir > 0);
    key("ArrowLeft", dir < 0);
    if (wantJump && now - jumpAt > 400) {
      jumpAt = now;
      tap("Space", 320);
      const twice = (pit && pit.w > 170) || (target.y < s.groundY - 180 && high);
      if (twice) secondAt = now + 390;
      note(pit ? `jump pit w${pit.w}${twice ? " x2" : ""}` : `jump for item h${Math.round(s.groundY - target.y)}${twice ? " x2" : ""}`);
    }
    if (secondAt && now >= secondAt) {
      secondAt = 0;
      tap("Space", 320);
    }
    // Stuck: hop and swing.
    if (Math.abs(s.x - lastX) < 1) stuckT += 40;
    else stuckT = 0;
    lastX = s.x;
    if (stuckT > 1500) {
      stuckT = 0;
      tap("Space", 320);
      setTimeout(() => tap("KeyK"), 300);
      note("stuck: hop + swing");
    }
  };

  window.__bot = {
    start(ms = 60000) {
      this.stop();
      timer = setInterval(step, 40);
      setTimeout(() => this.stop(), ms);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      for (const c of [...held.keys()]) key(c, false);
    },
    log,
  };
})();
