"use client";

import { useEffect, useRef, useState } from "react";

/* A single live data strip for the CryptoFlow block: three Binance spot
   pairs over the same public WebSocket the project itself uses, so the claim
   "live Binance data" is demonstrated rather than described. Connects only
   while on screen and while the tab is visible, and says so plainly when the
   network blocks the stream (US regions do). Direct DOM-free state updates,
   no rAF: rAF pauses in hidden tabs and would leave stale prices. */

const PAIRS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
const WS =
  "wss://stream.binance.com:9443/stream?streams=" +
  PAIRS.map((p) => `${p.toLowerCase()}@miniTicker`).join("/");

type Row = { symbol: string; price: number; open: number };
type Status = "idle" | "live" | "offline";

const fmt = (n: number) =>
  n >= 1000
    ? n.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MarketStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ws: WebSocket | null = null;
    let visible = false;
    let failTimer = 0;

    const close = () => {
      window.clearTimeout(failTimer);
      ws?.close();
      ws = null;
    };
    const open = () => {
      if (ws || !visible || document.hidden) return;
      ws = new WebSocket(WS);
      // if no frame arrives in 6s the stream is blocked here
      failTimer = window.setTimeout(() => setStatus("offline"), 6000);
      ws.onmessage = (ev) => {
        window.clearTimeout(failTimer);
        const { data } = JSON.parse(ev.data) as {
          data: { s: string; c: string; o: string };
        };
        setRows((r) => ({
          ...r,
          [data.s]: { symbol: data.s, price: +data.c, open: +data.o },
        }));
        setStatus("live");
      };
      ws.onerror = () => setStatus("offline");
      ws.onclose = () => {
        ws = null;
      };
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) open();
      else close();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? close() : open());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      close();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="plate mt-6 grid grid-cols-3 divide-x divide-line rounded-[8px] text-[13px]"
      aria-live="off"
    >
      {PAIRS.map((p) => {
        const r = rows[p];
        const pct = r ? ((r.price - r.open) / r.open) * 100 : null;
        return (
          <div key={p} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-faint">{p.replace("USDT", "")}</span>
              <span className="tabular-nums text-faint">
                {pct === null ? "" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
              </span>
            </div>
            <div className="mt-1 font-display text-[18px] font-medium tabular-nums text-ink">
              {r ? fmt(r.price) : status === "offline" ? "blocked" : "–"}
            </div>
          </div>
        );
      })}
      <p className="col-span-3 border-t border-line px-4 py-2 text-[12px] text-faint">
        {status === "live"
          ? "Binance spot, live over WebSocket, the same stream CryptoFlow charts."
          : status === "offline"
            ? "stream.binance.com is blocked on this network, so no live prices here."
            : "Connecting to Binance…"}
      </p>
    </div>
  );
}
