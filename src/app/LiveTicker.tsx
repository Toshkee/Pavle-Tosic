"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { pageCtx } from "./characterBus";

/* Live crypto market data streamed straight from Binance's public WebSocket —
   the SAME feed CryptoFlow runs. There's no backend of ours in the loop: no
   auth, no cold start, no proxy. It's genuinely live in the visitor's browser,
   which is the whole point — a case file you can watch move.

   Direction is encoded by BRIGHTNESS, not colour: a tick up flashes bright
   phosphor, a tick down flashes dim. That keeps the ticker inside the site's
   monochrome-green palette (no red), while still reading as a real market. */

type Row = {
  sym: string; // BTCUSDT
  label: string; // BTC
  price: number; // last price (0 until first fill)
  pct: number; // 24h change %
  dir: 0 | 1 | -1; // last tick direction → drives the flash
  tick: number; // bumps each update → re-keys the flash element to replay it
};

const SYMBOLS: { sym: string; label: string }[] = [
  { sym: "BTCUSDT", label: "BTC" },
  { sym: "ETHUSDT", label: "ETH" },
  { sym: "SOLUSDT", label: "SOL" },
  { sym: "BNBUSDT", label: "BNB" },
  { sym: "XRPUSDT", label: "XRP" },
  { sym: "DOGEUSDT", label: "DOGE" },
];

// One multiplexed socket, one stream per symbol (miniTicker — light, ~1/s).
const STREAM =
  "wss://stream.binance.com:9443/stream?streams=" +
  SYMBOLS.map((s) => `${s.sym.toLowerCase()}@miniTicker`).join("/");

// Prices span five orders of magnitude (BTC ~100k, DOGE ~0.1), so scale the
// decimals to the value instead of clipping the small ones to "0.00".
function fmtPrice(n: number): string {
  if (n === 0) return "—";
  if (n >= 1000)
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(5);
}

type Status = "connecting" | "live" | "reconnecting" | "offline";

function LiveTicker() {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Row[]>(() =>
    SYMBOLS.map((s) => ({
      sym: s.sym,
      label: s.label,
      price: 0,
      pct: 0,
      dir: 0,
      tick: 0,
    }))
  );
  const [status, setStatus] = useState<Status>("connecting");

  // Authoritative per-symbol state lives in a ref; the socket mutates it and
  // then commits a snapshot to React state to repaint.
  const dataRef = useRef<Map<string, Row>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const data = dataRef.current;
    for (const s of SYMBOLS)
      data.set(s.sym, {
        sym: s.sym,
        label: s.label,
        price: 0,
        pct: 0,
        dir: 0,
        tick: 0,
      });

    let stopped = false;
    let ws: WebSocket | null = null;
    let retry = 0;
    let everLive = false; // the socket opened at least once this mount
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    // Push the ref's latest state into React. A fresh object per row so React
    // sees new snapshots (and the flash element re-keys off `tick`). Committed
    // directly, not rAF-coalesced: six symbols ticking ~1×/s each is trivial to
    // render, and requestAnimationFrame is paused in background tabs — which
    // would strand the table on dashes for anyone who loads it unfocused.
    const commit = () => {
      setRows(SYMBOLS.map((s) => ({ ...data.get(s.sym)! })));
      // Publish the overall market mood (mean direction of the 24h moves) so the
      // ambient droid can react — cheer on green, sag on red.
      let sum = 0;
      let n = 0;
      for (const s of SYMBOLS) {
        const r = data.get(s.sym)!;
        if (r.price === 0) continue;
        sum += r.pct >= 0 ? 1 : -1;
        n += 1;
      }
      pageCtx.marketMood = n > 0 ? sum / n : 0;
    };

    // Instant fill from a REST snapshot so the table isn't a column of dashes
    // during the socket handshake. Best-effort: if it fails, the WS fills it.
    const ctrl = new AbortController();
    const restTimer = setTimeout(() => ctrl.abort(), 5000);
    fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbols=" +
        encodeURIComponent(JSON.stringify(SYMBOLS.map((s) => s.sym))),
      { signal: ctrl.signal }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((arr: { symbol: string; lastPrice: string; priceChangePercent: string }[]) => {
        for (const d of arr) {
          const row = data.get(d.symbol);
          if (!row) continue;
          row.price = parseFloat(d.lastPrice);
          row.pct = parseFloat(d.priceChangePercent);
        }
        commit();
      })
      .catch(() => {
        /* offline / geo-blocked — the socket is still the source of truth */
      })
      .finally(() => clearTimeout(restTimer));

    const connect = () => {
      if (stopped) return;
      ws = new WebSocket(STREAM);

      ws.onopen = () => {
        retry = 0;
        everLive = true;
        if (!stopped) setStatus("live");
      };

      ws.onmessage = (ev) => {
        let msg: { data?: { s?: string; c?: string; o?: string } };
        try {
          msg = JSON.parse(ev.data as string);
        } catch {
          return;
        }
        const d = msg.data;
        if (!d || !d.s) return;
        const row = data.get(d.s);
        if (!row) return;
        const price = parseFloat(d.c ?? "0");
        const open = parseFloat(d.o ?? "0");
        if (!Number.isFinite(price)) return;
        row.dir = price > row.price ? 1 : price < row.price ? -1 : 0;
        row.price = price;
        if (open > 0) row.pct = ((price - open) / open) * 100;
        row.tick++;
        commit();
      };

      ws.onerror = () => {
        try {
          ws?.close();
        } catch {
          /* already closing */
        }
      };

      ws.onclose = () => {
        if (stopped) return;
        retry += 1;
        // A socket that has NEVER opened after several tries means this
        // network blocks WebSockets (corporate proxy, strict firewall) —
        // stop hammering and say so honestly instead of spinning on
        // "reconnecting" forever. A feed that was live and dropped keeps
        // retrying: that's a transient, not a wall.
        if (!everLive && retry >= 4) {
          setStatus("offline");
          return;
        }
        setStatus("reconnecting");
        // Exponential backoff, capped — the feed is decorative, don't hammer it.
        reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** retry, 10000));
      };
    };

    connect();

    return () => {
      stopped = true;
      pageCtx.marketMood = 0; // ticker left the screen — mood is neutral again
      ctrl.abort();
      clearTimeout(restTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        try {
          ws.close();
        } catch {
          /* not open yet */
        }
      }
    };
  }, []);

  const hasData = rows.some((r) => r.price > 0);

  return (
    <div className="absolute inset-0 flex flex-col bg-bg font-mono">
      {/* Header — exchange + a pulsing status lamp */}
      <div className="flex items-center justify-between border-b border-line/60 px-3 py-1.5 text-[10px]">
        <span className="text-faint">binance · spot · usdt</span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                status === "live"
                  ? `bg-accent ${reduce ? "" : "animate-pulse"}`
                  : "bg-faint"
              }`}
            />
          </span>
          <span className={status === "live" ? "text-accent-ink" : "text-muted"}>
            {status === "live" ? "live" : status}
          </span>
        </span>
      </div>

      {/* Market rows — or an honest offline note when this network blocks the
          socket AND the REST snapshot, so the tab never sits on dead dashes. */}
      {status === "offline" && !hasData ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-1.5 px-4 text-[11px] leading-relaxed">
          <p className="text-muted">
            <span className="text-accent">$</span> connect
            stream.binance.com… <span className="text-faint">blocked</span>
          </p>
          <p className="text-faint">
            this network won&apos;t let the live feed through. the real thing
            runs in the demo · cryptofloww.netlify.app
          </p>
        </div>
      ) : (
      <ul
        className="flex-1 divide-y divide-line/40 overflow-y-auto"
        aria-label="Live cryptocurrency prices from Binance"
      >
        {rows.map((r) => {
          const up = r.pct >= 0;
          return (
            <li
              key={r.sym}
              className="relative grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 sm:py-2.5"
            >
              {/* Tick flash — brightness encodes direction, keyed on tick to
                  replay the fade each update. Silent under reduced motion. */}
              {!reduce && r.dir !== 0 && (
                <span
                  key={r.tick}
                  aria-hidden
                  className={`market-flash ${
                    r.dir === 1 ? "market-flash-up" : "market-flash-down"
                  }`}
                />
              )}
              <span className="relative flex items-baseline gap-1.5">
                <span className="text-[13px] font-semibold text-ink">
                  {r.label}
                </span>
                <span className="text-[10px] text-faint">/USDT</span>
              </span>
              <span className="relative flex items-baseline gap-3">
                <span className="tabular-nums text-[13px] text-ink">
                  {fmtPrice(r.price)}
                </span>
                <span
                  className={`w-[4.6rem] text-right tabular-nums text-[12px] ${
                    r.price === 0
                      ? "text-faint"
                      : up
                        ? "text-accent-ink"
                        : "text-muted"
                  }`}
                >
                  {r.price === 0
                    ? "—"
                    : `${up ? "▲" : "▼"} ${up ? "+" : ""}${r.pct.toFixed(2)}%`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      )}

      {/* The honesty line — this is the real feed, not a screenshot */}
      <div className="border-t border-line/60 px-3 py-1.5 text-[9px] leading-tight text-faint">
        {status === "offline"
          ? hasData
            ? "live socket unreachable on this network · showing the 24h REST snapshot"
            : "live socket unreachable on this network"
          : "streamed live over one websocket, the same public Binance feed CryptoFlow runs"}
      </div>
    </div>
  );
}

export default memo(LiveTicker);
