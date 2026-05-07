"use client";

import Image from "next/image";
import { useState, useRef, useMemo, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiNodedotjs,
  SiPython,
  SiDjango,
  SiOracle,
  SiPostgresql,
  SiEthereum,
  SiWhatsapp,
} from "react-icons/si";

/* ─────────────────────────────────────────────
   Reusable animation helpers
───────────────────────────────────────────── */

// Letter-by-letter reveal heading
function AnimatedHeading({
  text,
  className = "",
  as: Tag = "h2",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
}) {
  const words = useMemo(() => text.split(" "), [text]);
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.04, delayChildren: delay }}
      className={className}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {Array.from(word).map((ch, ci) => (
            <motion.span
              key={ci}
              variants={{
                hidden: { opacity: 0, y: "0.5em", filter: "blur(8px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </MotionTag>
  );
}

// 3D tilt that follows the cursor (used on the wanted poster)
function TiltCard({
  children,
  className = "",
  max = 12,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 16, mass: 0.5 });
  const sry = useSpring(ry, { stiffness: 150, damping: 16, mass: 0.5 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ ...style, rotateX: srx, rotateY: sry, transformPerspective: 1000, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Tiny ship that sails down the right edge as the page scrolls
function ScrollShip() {
  const { scrollYProgress } = useScroll();
  const top = useTransform(scrollYProgress, [0, 1], ["6%", "92%"]);
  const sway = useSpring(top, { stiffness: 80, damping: 18, mass: 0.5 });
  const tilt = useTransform(scrollYProgress, [0, 1], [-4, 4]);
  return (
    <motion.div
      className="pointer-events-none fixed right-3 z-[60] hidden md:block"
      style={{ top: sway }}
    >
      {/* Faint vertical rope/wake guide */}
      <div className="absolute -left-[1px] top-1/2 h-[60vh] w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-amber-200/15 to-transparent" />
      <motion.div style={{ rotate: tilt }} className="relative">
        <svg width="36" height="40" viewBox="0 0 36 40" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          {/* Mast */}
          <line x1="18" y1="4" x2="18" y2="22" stroke="#7a4a1a" strokeWidth="1.5" />
          {/* Sail */}
          <path d="M 18 6 L 30 18 L 18 22 Z" fill="#f3e3b8" stroke="#7a4a1a" strokeWidth="0.8" />
          <path d="M 18 6 L 6 18 L 18 22 Z" fill="#e6c378" stroke="#7a4a1a" strokeWidth="0.8" />
          {/* Hull */}
          <path d="M 4 24 L 32 24 L 28 32 L 8 32 Z" fill="#5a3a1a" stroke="#2a1a0a" strokeWidth="0.8" />
          {/* Wave under hull */}
          <path d="M 2 34 Q 9 31 18 34 T 34 34" stroke="rgba(255,255,255,0.55)" strokeWidth="1" fill="none" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

// Scroll-driven rope: a rope SVG that draws itself as the user scrolls past it
function ScrollRope({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 80%", "end 20%"],
  });
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });

  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-0 h-full w-[18px] -translate-x-1/2 overflow-visible"
      preserveAspectRatio="none"
      viewBox="0 0 18 1000"
      fill="none"
    >
      <defs>
        <linearGradient id="ropeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,120,50,0)" />
          <stop offset="6%" stopColor="rgba(180,120,50,0.85)" />
          <stop offset="94%" stopColor="rgba(180,120,50,0.85)" />
          <stop offset="100%" stopColor="rgba(180,120,50,0)" />
        </linearGradient>
        <pattern id="ropeTwist" width="6" height="14" patternUnits="userSpaceOnUse">
          <path d="M 0 0 Q 3 7 6 14" stroke="rgba(70,40,15,0.55)" strokeWidth="1.2" fill="none" />
        </pattern>
      </defs>
      {/* Faint base rope (always visible, very subtle) */}
      <line x1="9" y1="0" x2="9" y2="1000" stroke="rgba(180,120,50,0.18)" strokeWidth="2" />
      {/* Drawn rope — main thick strand */}
      <motion.line
        x1="9"
        y1="0"
        x2="9"
        y2="1000"
        stroke="url(#ropeGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        style={{ pathLength: drawn, scaleY: drawn, transformOrigin: "top" }}
      />
      {/* Twist overlay for rope texture */}
      <motion.line
        x1="9"
        y1="0"
        x2="9"
        y2="1000"
        stroke="url(#ropeTwist)"
        strokeWidth="6"
        strokeLinecap="round"
        style={{ pathLength: drawn, scaleY: drawn, transformOrigin: "top", opacity: 0.6 }}
      />
    </svg>
  );
}

// Magnetic hover wrapper — element gently follows the cursor
function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const TECH = [
  { Icon: SiJavascript, label: "JavaScript" },
  { Icon: SiTypescript, label: "TypeScript" },
  { Icon: SiReact, label: "React" },
  { Icon: SiNodedotjs, label: "Node.js" },
  { Icon: SiPython, label: "Python" },
  { Icon: SiDjango, label: "Django" },
  { Icon: SiOracle, label: "Oracle APEX" },
  { Icon: SiPostgresql, label: "PostgreSQL" },
  { Icon: SiEthereum, label: "Blockchain (learning)" },
];

const PROJECTS = [
  {
    title: "One Piece Sword Duel",
    description:
      "Interactive browser-based game built with JavaScript, HTML, and CSS.",
    stack: ["JavaScript", "HTML", "CSS"],
    link: "https://toshkee.github.io/One-Piece-Sword-Duel/",
  },
  {
    title: "Anime Watchlist",
    description: "Frontend web app to browse and manage anime watchlists.",
    stack: ["React", "Node.js"],
    link: "https://animee-watchlist-app-724b6a827c81.herokuapp.com/",
  },
  {
    title: "CryptoFlow",
    description:
      "Modern React app displaying live cryptocurrency data and trading.",
    stack: ["Python", "Django"],
    link: "https://cryptofloww.netlify.app/",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

const VOYAGE = [
  {
    arc: "Grand Line Arc",
    port: "Water 7",
    period: "2025 – Present",
    title: "Software Developer",
    org: "Infostream Ltd",
    current: true,
    bullets: [
      "Building production web applications with .NET & C#",
      "Oracle APEX development and internal training",
      "Building the company's own website from scratch",
      "Collaborating within a professional development team",
    ],
  },
  {
    arc: "Training Arc",
    port: "Shells Town",
    period: "Sept 2025 – Dec 2025",
    title: "Fullstack Software Developer",
    org: "General Assembly · Fullstack Software Engineering Bootcamp",
    current: false,
    bullets: [
      "420+ hours of intensive fullstack software engineering bootcamp",
      "JavaScript, React, HTML & CSS frontend development",
      "Node.js, APIs, databases & security basics",
      "Team projects and real-world application development",
    ],
  },
  {
    arc: "Market Arc",
    port: "Mock Town",
    period: "2021 – Present",
    title: "Crypto Trader",
    org: "Independent · Self-Taught",
    current: true,
    bullets: [
      "Trading cryptocurrency markets independently since 2021",
      "Technical analysis & risk management strategies",
      "Deep understanding of blockchain and DeFi concepts",
    ],
  },
  {
    arc: "Special Training",
    port: "Orange Town",
    period: "2022 – 2023",
    title: "Ethical Hacking",
    org: "Z-Security · Udemy",
    current: false,
    bullets: [
      "Network security & penetration testing fundamentals",
      "Vulnerability assessment and exploitation basics",
      "Completed full course in concentrated sessions",
    ],
  },
];

function HangingLantern({ className, period = 4.5 }: { className?: string; period?: number }) {
  return (
    <motion.div
      className={"absolute z-40 origin-top " + (className ?? "")}
      animate={{ rotate: [-4, 4, -4] }}
      transition={{ duration: period, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="mx-auto h-14 w-px bg-black/70" />
      <div className="relative -mt-1 mx-auto h-12 w-9 rounded border border-black/70 bg-gradient-to-b from-[#2e1a08] to-[#0e0804] shadow-xl">
        <motion.div
          className="absolute inset-1 rounded bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-600 blur-[1.5px]"
          animate={{ opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -inset-4 rounded-full bg-yellow-300/35 blur-2xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

function WantedPosterScene() {
  return (
    <section
      id="wanted"
      className="relative isolate min-h-[130vh] overflow-hidden"
    >
      {/* DAWN SKY — deep night → magenta → coral → gold */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #0e0a25 0%, #2a1745 18%, #5a2a5a 35%, #a04864 52%, #e08560 68%, #f4b07a 82%, #3d2814 100%)",
        }}
      />

      {/* Stars (upper sky) */}
      {Array.from({ length: 28 }).map((_, i) => {
        const x = (i * 37 + 7) % 100;
        const y = (i * 23 + 3) % 28;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-px w-px rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%`, boxShadow: "0 0 3px rgba(255,255,255,0.9)" }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 2 + (i % 5), repeat: Infinity, ease: "easeInOut", delay: i * 0.13 }}
          />
        );
      })}

      {/* Light rays radiating from horizon */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[30%] overflow-hidden">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-[100%] h-[120vh] w-3 origin-bottom bg-gradient-to-t from-amber-200/35 via-amber-100/12 to-transparent blur-[2px]"
            style={{ transform: `translateX(-50%) rotate(${(i - 4) * 14}deg)` }}
            animate={{ opacity: [0.18, 0.5, 0.18] }}
            transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Horizon fog band */}
      <div className="pointer-events-none absolute inset-x-0 top-[68%] h-[5%] bg-white/22 blur-md" />

      {/* SEA */}
      <div className="absolute inset-x-0 top-[68%] bottom-0 bg-gradient-to-b from-[#5a3a5a] via-[#2a2a4a] to-[#0a1424]" />

      {/* Distant island silhouettes (3) */}
      <svg className="pointer-events-none absolute left-[8%] top-[64%] z-[3] w-32 opacity-65" viewBox="0 0 200 70" fill="#15102a">
        <path d="M5 60 Q40 25 75 32 Q100 8 130 28 Q160 14 195 60 Z" />
      </svg>
      <svg className="pointer-events-none absolute right-[10%] top-[66%] z-[3] w-44 opacity-55" viewBox="0 0 200 70" fill="#15102a">
        <path d="M5 60 Q35 30 70 35 Q110 10 140 30 Q170 20 195 60 Z" />
      </svg>
      <svg className="pointer-events-none absolute right-[36%] top-[67%] z-[3] w-24 opacity-45" viewBox="0 0 200 70" fill="#0e0a20">
        <path d="M5 60 Q40 35 80 38 Q120 18 195 60 Z" />
      </svg>

      {/* Rising sun on the horizon */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[60%] z-[2] -translate-x-1/2"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-[260px] w-[260px]">
          <div className="absolute -inset-24 rounded-full bg-orange-300/25 blur-3xl" />
          <div className="absolute -inset-12 rounded-full bg-amber-300/40 blur-2xl" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-100 via-amber-300 to-orange-500 shadow-[0_0_120px_60px_rgba(255,180,80,0.55)]" />
          <motion.div
            className="absolute -inset-2 rounded-full bg-amber-200/30 blur-xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.95, 0.55] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Sun reflection on water */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[68%] z-[3] h-[24%] w-36 -translate-x-1/2 bg-gradient-to-b from-amber-200/55 via-amber-300/25 to-transparent blur-[3px]"
        animate={{ opacity: [0.5, 0.9, 0.5], scaleY: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Drifting clouds (lit by dawn) */}
      <Cloud top="6%" width={250} duration={85} delay={0} />
      <Cloud top="14%" width={170} duration={105} delay={-30} />
      <Cloud top="20%" width={140} duration={95} delay={-60} />

      {/* Seagulls */}
      <Seagull top="32%" duration={22} delay={2} scale={0.85} />
      <Seagull top="40%" duration={28} delay={8} reverse scale={0.65} />

      {/* Dust motes drifting up */}
      {Array.from({ length: 14 }).map((_, i) => {
        const left = (i * 13 + 4) % 100;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute z-[5] h-1 w-1 rounded-full bg-amber-200/70 blur-[1px]"
            style={{ left: `${left}%`, top: "100%" }}
            animate={{ y: [-50, -900], x: [0, i % 2 ? 30 : -30], opacity: [0, 0.85, 0] }}
            transition={{ duration: 14 + (i % 5) * 2, repeat: Infinity, ease: "linear", delay: i * 0.9 }}
          />
        );
      })}

      {/* MAIN CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-[130vh] w-full max-w-[1400px] flex-col items-center justify-center px-4 pb-40 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease }}
          className="mb-24 text-center md:mb-28"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-amber-100/80">
            By Order of the World Government
          </p>
          <AnimatedHeading
            as="h1"
            text="WANTED"
            className="mt-3 font-serif text-6xl font-black tracking-[0.18em] text-white drop-shadow-[0_4px_25px_rgba(255,150,80,0.55)] md:text-7xl"
          />
          <p className="mt-4 text-xs uppercase tracking-[0.35em] text-amber-200/75">
            Dead or Alive • Bounty Active
          </p>
        </motion.div>

        {/* BOUNTY BOARD */}
        <div className="relative w-[min(1100px,96%)]">
          {/* Tall posts */}
          <div className="absolute -left-3 -top-10 -bottom-40 z-10 w-8 rounded bg-gradient-to-r from-[#2e1a08] via-[#5a3819] to-[#2e1a08] shadow-[0_15px_40px_rgba(0,0,0,0.7)]" />
          <div className="absolute -right-3 -top-10 -bottom-40 z-10 w-8 rounded bg-gradient-to-r from-[#2e1a08] via-[#5a3819] to-[#2e1a08] shadow-[0_15px_40px_rgba(0,0,0,0.7)]" />

          {/* Top crossbeam */}
          <div className="absolute -left-7 -right-7 -top-11 z-20 h-10 rounded border border-black/60 bg-gradient-to-b from-[#5a3819] via-[#3d2410] to-[#1f1208] shadow-[0_8px_20px_rgba(0,0,0,0.6)]" />

          {/* Top banner */}
          <div className="absolute left-1/2 -top-9 z-30 -translate-x-1/2 whitespace-nowrap">
            <div className="rounded-md border-y-4 border-[#2a1808] bg-gradient-to-b from-[#7a4a22] to-[#4a2a12] px-12 py-2.5 shadow-2xl">
              <p className="font-serif text-sm tracking-[0.45em] text-amber-100">⚓ MOST WANTED ⚓</p>
            </div>
          </div>

          {/* Hanging lanterns from crossbeam */}
          <HangingLantern className="-top-5 left-[26%]" period={4.6} />
          <HangingLantern className="-top-5 right-[10%]" period={5.1} />

          {/* The wooden board */}
          <div
            className="relative rounded-md border-4 border-[#2a1808] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.7)] md:p-10"
            style={{
              backgroundColor: "#6b4423",
              backgroundImage: [
                "repeating-linear-gradient(180deg, transparent 0 46px, rgba(0,0,0,0.28) 46px 48px)",
                "repeating-linear-gradient(90deg, transparent 0 220px, rgba(0,0,0,0.18) 220px 222px)",
                "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0))",
              ].join(", "),
            }}
          >
            {/* Inner shadow vignette */}
            <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]" />

            {/* Decorative corner nails */}
            <div className="pointer-events-none absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />
            <div className="pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />
            <div className="pointer-events-none absolute left-3 bottom-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />
            <div className="pointer-events-none absolute right-3 bottom-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />

            {/* Layout: bio | wanted poster | skills */}
            <div className="relative grid items-start gap-6 lg:grid-cols-[1fr_auto_1fr]">
              {/* LEFT — Captain's Log (bio + links) */}
              <motion.div
                initial={{ opacity: 0, y: 26, rotate: -4 }}
                whileInView={{ opacity: 1, y: 0, rotate: -2.5 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.45, ease }}
                whileHover={{ y: -6, rotate: 0, scale: 1.03, zIndex: 20 }}
                style={{ transformOrigin: "top center" }}
                className="relative rounded-sm border border-[#b08b4f] bg-[#f3e3b8] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.55)]"
              >
                <div className="absolute left-1/2 -top-2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />
                <div
                  className="pointer-events-none absolute inset-0 rounded-sm"
                  style={{ boxShadow: "inset 0 0 35px rgba(120,80,30,0.32)" }}
                />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-black/50">Captain&apos;s Log</div>
                  <h3 className="mt-1 font-serif text-lg font-bold text-black/90">About the Pirate</h3>
                  <p className="mt-3 text-sm leading-relaxed text-black/75">
                    Full-stack developer building end-to-end products — UI, APIs, and databases. Sailing the Grand Line of React, Node.js, Django, and SQL.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    <Magnetic strength={0.4}>
                      <a
                        href="https://github.com/Toshkee"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-black/30 bg-black/10 px-3 py-2 text-xs font-medium text-black/80 transition-colors hover:bg-black/25"
                      >
                        <span>GitHub</span>
                        <span>→</span>
                      </a>
                    </Magnetic>
                    <Magnetic strength={0.4}>
                      <a
                        href="https://www.linkedin.com/in/tosiicp/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded border border-black/30 bg-black/10 px-3 py-2 text-xs font-medium text-black/80 transition-colors hover:bg-black/25"
                      >
                        <span>LinkedIn</span>
                        <span>→</span>
                      </a>
                    </Magnetic>
                  </div>
                </div>
              </motion.div>

              {/* CENTER — WANTED poster (the bounty) */}
              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, delay: 0.2, ease }}
                className="relative w-[min(360px,90vw)]"
              >
                <TiltCard
                  max={10}
                  className="relative rounded-sm border-2 border-[#7a5722] shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 0%, rgba(255,235,180,0.55), rgba(220,180,110,0) 70%), linear-gradient(180deg, #f0d7a0 0%, #e6c378 100%)",
                  }}
                >
                {/* Two pins at top */}
                <div className="absolute left-6 -top-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />
                <div className="absolute right-6 -top-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />

                {/* Aging vignette */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ boxShadow: "inset 0 0 55px rgba(120,80,30,0.5)" }}
                />

                <div className="relative p-5">
                  <h2 className="text-center font-serif text-3xl font-black tracking-[0.18em] text-black">
                    WANTED
                  </h2>
                  <p className="mt-0.5 text-center text-[10px] tracking-[0.4em] text-black/70">
                    DEAD OR ALIVE
                  </p>

                  {/* Photo */}
                  <div className="relative mt-3 h-[290px] overflow-hidden border-4 border-[#5a3a1a] bg-black/20 shadow-inner">
                    <Image
                      src="/images/me.jpg"
                      alt="Pavle Tošić"
                      fill
                      priority
                      sizes="360px"
                      className="object-cover"
                      style={{ objectPosition: "50% 22%" }}
                    />
                    {/* Sepia tone */}
                    <div className="absolute inset-0 bg-amber-900/15 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
                  </div>

                  {/* Name */}
                  <h3 className="mt-3 text-center font-serif text-2xl font-extrabold tracking-wide text-black">
                    PAVLE TOŠIĆ
                  </h3>

                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="h-px w-10 bg-black/50" />
                    <p className="text-[10px] uppercase tracking-[0.35em] text-black/70">
                      Full-Stack Pirate
                    </p>
                    <div className="h-px w-10 bg-black/50" />
                  </div>

                  {/* Bounty */}
                  <div className="mt-3 flex items-baseline justify-center gap-1.5">
                    <span className="font-serif text-base text-black/70">฿</span>
                    <span className="font-serif text-3xl font-black tracking-wider text-black">30,000,000</span>
                    <span className="font-serif text-base text-black/70">-</span>
                  </div>
                  <p className="text-center text-[9px] tracking-[0.3em] text-black/55">— BERRIES —</p>

                  {/* Marine seal footer */}
                  <div className="mt-3 flex items-center justify-center gap-3 border-t border-black/30 pt-3">
                    <span className="text-[9px] tracking-[0.25em] text-black/55">MARINE HQ</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-800/70 bg-red-700/10">
                      <span className="text-[8px] font-black text-red-900/80">M</span>
                    </div>
                    <span className="text-[9px] tracking-[0.25em] text-black/55">GRAND LINE</span>
                  </div>
                </div>
                </TiltCard>
              </motion.div>

              {/* RIGHT — Devil Fruits / Skills */}
              <motion.div
                initial={{ opacity: 0, y: 26, rotate: 4 }}
                whileInView={{ opacity: 1, y: 0, rotate: 2.5 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, delay: 0.6, ease }}
                whileHover={{ y: -6, rotate: 0, scale: 1.03, zIndex: 20 }}
                style={{ transformOrigin: "top center" }}
                className="relative rounded-sm border border-[#b08b4f] bg-[#f3e3b8] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.55)]"
              >
                <div className="absolute left-1/2 -top-2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />
                <div
                  className="pointer-events-none absolute inset-0 rounded-sm"
                  style={{ boxShadow: "inset 0 0 35px rgba(120,80,30,0.32)" }}
                />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-black/50">Devil Fruits</div>
                  <h3 className="mt-1 font-serif text-lg font-bold text-black/90">Powers Wielded</h3>
                  <p className="mt-2 text-xs leading-relaxed text-black/65">
                    The arsenal carried into every battle.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {TECH.map(({ Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 rounded border border-black/20 bg-black/5 px-3 py-1.5 text-xs text-black/80"
                      >
                        <Icon className="text-base" />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="mt-16 text-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-amber-100/65">
            Scroll to set sail ↓
          </p>
        </motion.div>
      </div>

      {/* Wooden dock planks at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 z-[2] h-24"
        style={{
          backgroundColor: "#3d2410",
          backgroundImage: [
            "repeating-linear-gradient(90deg, transparent 0 120px, rgba(0,0,0,0.5) 120px 122px)",
            "linear-gradient(180deg, #5a3819 0%, #2e1a08 100%)",
          ].join(", "),
          boxShadow: "inset 0 8px 12px rgba(0,0,0,0.6), 0 -8px 20px rgba(0,0,0,0.4)",
        }}
      />
    </section>
  );
}

function Compass() {
  return (
    <div className="relative h-36 w-36">
      {/* Outer brass ring */}
      <div className="absolute inset-0 rounded-full border-[6px] border-[#8b6a32] bg-gradient-to-br from-[#5a3819] to-[#1f1208] shadow-[0_15px_40px_rgba(0,0,0,0.7)]" />
      {/* Inner face */}
      <div
        className="absolute inset-3 rounded-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 35% 30%, #fbe8b8, #d6a85a 70%, #b08840 100%)",
          boxShadow: "inset 0 0 25px rgba(80,50,15,0.6)",
        }}
      />

      {/* Cardinal letters */}
      <div className="absolute inset-3 font-serif text-[11px] font-black tracking-wider text-black/80">
        <span className="absolute left-1/2 top-1.5 -translate-x-1/2">N</span>
        <span className="absolute left-1/2 bottom-1.5 -translate-x-1/2">S</span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2">W</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2">E</span>
      </div>

      {/* Tick marks */}
      <svg className="absolute inset-3" viewBox="-50 -50 100 100">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 360) / 24;
          const long = i % 6 === 0;
          return (
            <line
              key={i}
              x1="0" y1={-44}
              x2="0" y2={long ? -38 : -41}
              stroke="rgba(60,40,15,0.65)"
              strokeWidth={long ? 1.5 : 0.8}
              transform={`rotate(${a})`}
            />
          );
        })}
      </svg>

      {/* Spinning needle */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: [0, 8, -5, 12, -3, 6, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-24 w-1.5">
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-red-500 to-red-800 shadow-md" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-gradient-to-t from-zinc-900 to-zinc-600" />
        </div>
      </motion.div>

      {/* Center pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-500 to-amber-800 ring-2 ring-black/70 shadow" />
      </div>

      {/* Glass shine */}
      <div className="pointer-events-none absolute inset-3 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
    </div>
  );
}

function JourneyTransition() {
  return (
    <section
      id="journey-transition"
      className="relative isolate min-h-[80vh] overflow-hidden"
    >
      {/* Bright midday sea — bridges dock planks above (dark) to golden afternoon below */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #1a1a2e 0%, #1a3a6a 12%, #1a5a9a 30%, #2270b0 55%, #1a5078 80%, #1a2e4a 100%)",
        }}
      />

      {/* Drifting clouds */}
      <Cloud top="10%" width={220} duration={70} delay={0} />
      <Cloud top="20%" width={160} duration={92} delay={-28} />
      <Cloud top="7%" width={130} duration={110} delay={-52} />

      {/* Seagulls */}
      <Seagull top="36%" duration={24} delay={2} scale={0.7} />
      <Seagull top="28%" duration={32} delay={10} reverse scale={0.5} />

      {/* Midday sun — high overhead */}
      <motion.div
        className="pointer-events-none absolute left-[18%] top-[8%] z-[4]"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-20 w-20">
          <div className="absolute -inset-10 rounded-full bg-yellow-200/20 blur-3xl" />
          <div className="absolute -inset-4 rounded-full bg-amber-200/25 blur-xl" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-100 via-amber-200 to-amber-400 shadow-[0_0_50px_25px_rgba(255,210,100,0.35)]" />
        </div>
      </motion.div>

      {/* Horizon fog */}
      <div className="pointer-events-none absolute inset-x-0 top-[62%] h-[4%] bg-white/18 blur-md" />

      {/* Sea — fades to QuestBoard's sky top color for a seamless seam */}
      <div className="absolute inset-x-0 top-[64%] bottom-0 bg-gradient-to-b from-[#1a6888] via-[#1a4060] to-[#1a2e4a]" />

      {/* Sun reflection */}
      <motion.div
        className="pointer-events-none absolute left-[13%] top-[64%] h-[22%] w-20 bg-gradient-to-b from-amber-100/40 via-amber-200/15 to-transparent blur-[3px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scaleY: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Ship on the horizon */}
      <motion.div
        className="pointer-events-none absolute top-[61%] z-[3] text-zinc-900/50"
        initial={{ x: "-12vw" }}
        animate={{ x: "112vw" }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      >
        <motion.svg
          width="56" height="44" viewBox="0 0 60 48" fill="currentColor"
          animate={{ y: [0, -2, 0, -1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M8 32 L52 32 L46 40 L14 40 Z" opacity="0.75" />
          <rect x="29" y="6" width="2" height="26" />
          <path d="M30 8 L44 30 L30 30 Z" opacity="0.85" />
          <path d="M30 10 L18 30 L30 30 Z" opacity="0.55" />
          <path d="M30 4 L34 7 L30 7 Z" />
        </motion.svg>
      </motion.div>

      {/* Wave shimmer */}
      {Array.from({ length: 10 }).map((_, i) => {
        const t = 68 + ((i * 7) % 26);
        const l = (i * 19 + 3) % 95;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-[1.5px] rounded-full bg-cyan-100/35"
            style={{ top: `${t}%`, left: `${l}%`, width: 28 + ((i * 13) % 60) }}
            animate={{ x: [0, 12, 0], opacity: [0.12, 0.35, 0.12] }}
            transition={{ duration: 3 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        );
      })}

      {/* Centered content */}
      <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center gap-10 px-6 py-20 md:flex-row md:gap-14">
        {/* Compass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease }}
        >
          <Compass />
        </motion.div>

        {/* Parchment — Shanks / Red Hair Pirates */}
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, delay: 0.25, ease }}
          className="relative w-full max-w-xl rounded-sm border-2 border-[#8b6a32] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(255,235,180,0.4), rgba(220,180,110,0) 70%), linear-gradient(180deg, #f0d7a0 0%, #e6c378 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-sm"
            style={{ boxShadow: "inset 0 0 60px rgba(120,80,30,0.5)" }}
          />
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />

          <div className="relative text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-black/70">Intercepted Message · Red Hair Pirates</p>
            <h2 className="mt-3 font-serif text-3xl font-extrabold text-black md:text-4xl">
              A Pirate Needs No Permission
            </h2>
            <p className="mt-5 font-serif text-base italic leading-relaxed text-black md:text-lg">
              &ldquo;This straw hat is a very important treasure to me. I am entrusting it to you. Promise to return it to me one day — when you have become a great pirate.&rdquo;
            </p>
            <p className="mt-4 text-xs font-bold tracking-[0.3em] text-black/80">
              — &apos;RED-HAIR&apos; SHANKS · CAPTAIN, RED HAIR PIRATES
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-black/50" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-black/70">RAISE YOUR FLAG</span>
              <div className="h-px w-12 bg-black/50" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PalmTree({ className, scale = 1, flip = false }: { className?: string; scale?: number; flip?: boolean }) {
  return (
    <svg
      width={90 * scale}
      height={130 * scale}
      viewBox="0 0 90 130"
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trunk */}
      <path d="M44 130 C42 110 38 90 40 70 C41 55 45 40 44 20" stroke="#7a5230" strokeWidth="6" strokeLinecap="round"/>
      {/* Leaves */}
      <path d="M44 20 C30 10 10 5 2 15 C12 18 28 22 44 28" fill="#2d6a2d"/>
      <path d="M44 20 C55 8 75 2 82 14 C70 16 55 22 44 28" fill="#2d6a2d"/>
      <path d="M44 20 C38 5 32 -5 18 2 C26 10 36 18 44 28" fill="#3a8a3a"/>
      <path d="M44 20 C50 5 58 -4 70 4 C62 12 52 18 44 28" fill="#3a8a3a"/>
      <path d="M44 20 C28 18 12 24 8 36 C20 32 34 28 44 30" fill="#4aa84a"/>
      <path d="M44 20 C60 18 76 24 80 36 C68 32 55 28 44 30" fill="#4aa84a"/>
      {/* Coconuts */}
      <circle cx="40" cy="27" r="4" fill="#8B6914"/>
      <circle cx="47" cy="25" r="3.5" fill="#7a5c10"/>
    </svg>
  );
}

function Rock({ className, scale = 1 }: { className?: string; scale?: number }) {
  return (
    <svg width={60 * scale} height={35 * scale} viewBox="0 0 60 35" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="28" rx="28" ry="8" fill="#5a5a5a" opacity="0.3"/>
      <path d="M5 28 C5 16 12 6 22 4 C28 2 34 2 40 5 C50 9 56 18 55 27 Z" fill="#888"/>
      <path d="M5 28 C5 16 12 6 22 4 C28 2 34 2 40 5 C50 9 56 18 55 27 Z" fill="url(#rockGrad)"/>
      <path d="M15 10 C20 7 30 6 38 10" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <defs>
        <linearGradient id="rockGrad" x1="10" y1="4" x2="50" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#aaa"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function Grass({ className }: { className?: string }) {
  return (
    <svg width="80" height="30" viewBox="0 0 80 30" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30 C10 20 8 10 12 2" stroke="#4a9a4a" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 30 C18 18 20 8 16 0" stroke="#3d8a3d" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 30 C26 22 24 12 28 4" stroke="#56a856" strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 30 C34 20 36 10 32 2" stroke="#4a9a4a" strokeWidth="2" strokeLinecap="round"/>
      <path d="M42 30 C42 18 44 8 40 1" stroke="#3d8a3d" strokeWidth="2" strokeLinecap="round"/>
      <path d="M50 30 C50 22 48 12 52 4" stroke="#56a856" strokeWidth="2" strokeLinecap="round"/>
      <path d="M58 30 C58 20 60 10 56 2" stroke="#4a9a4a" strokeWidth="2" strokeLinecap="round"/>
      <path d="M66 30 C66 18 68 8 64 0" stroke="#3d8a3d" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function Sun() {
  return (
    <motion.div
      className="pointer-events-none absolute right-[18%] top-[10%] z-[5]"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="relative h-28 w-28">
        <div className="absolute -inset-12 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute -inset-6 rounded-full bg-yellow-200/30 blur-2xl" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-100 via-amber-300 to-orange-400 shadow-[0_0_60px_30px_rgba(255,200,100,0.45)]" />
        <motion.div
          className="absolute -inset-3 rounded-full bg-yellow-200/25 blur-xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

function Cloud({ top, width, duration, delay }: { top: string; width: number; duration: number; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute h-10 rounded-full bg-white/35 blur-2xl"
      style={{ top, width }}
      initial={{ x: "120vw" }}
      animate={{ x: "-30vw" }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    />
  );
}

function Seagull({ top, duration, delay, reverse = false, scale = 1 }: { top: string; duration: number; delay: number; reverse?: boolean; scale?: number }) {
  const w = 30 * scale;
  return (
    <motion.svg
      className="pointer-events-none absolute z-[6] text-white/70"
      style={{ top }}
      width={w} height={w * 0.4} viewBox="0 0 30 12"
      initial={{ x: reverse ? "110vw" : "-10vw" }}
      animate={{ x: reverse ? "-10vw" : "110vw", y: [0, -10, 0, -6, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <motion.path
        stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"
        animate={{
          d: [
            "M2 7 C7 2 11 2 15 6 C19 2 23 2 28 7",
            "M2 5 C7 9 11 9 15 4 C19 9 23 9 28 5",
            "M2 7 C7 2 11 2 15 6 C19 2 23 2 28 7",
          ],
        }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

function DistantShip() {
  return (
    <motion.div
      className="pointer-events-none absolute left-[14%] top-[44%] z-[4] text-white/40"
      animate={{ x: [0, 40, 0], y: [0, -2, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="46" height="34" viewBox="0 0 46 34" fill="currentColor">
        <path d="M6 24 L40 24 L34 31 L12 31 Z" opacity="0.7" />
        <rect x="22" y="6" width="1.5" height="18" />
        <path d="M23 8 L33 22 L23 22 Z" opacity="0.85" />
        <path d="M23 10 L15 22 L23 22 Z" opacity="0.55" />
        <path d="M23 4 L26 7 L23 7 Z" />
      </svg>
    </motion.div>
  );
}

function IslandLandmass() {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[78%] w-full">
      <defs>
        <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5d8567"/>
          <stop offset="55%" stopColor="#365940"/>
          <stop offset="100%" stopColor="#1f3a28"/>
        </linearGradient>
        <linearGradient id="mtnShade" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="rgba(255,220,160,0.35)"/>
          <stop offset="60%" stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)"/>
        </linearGradient>
        <linearGradient id="jungleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fa05a"/>
          <stop offset="100%" stopColor="#2f6a36"/>
        </linearGradient>
        <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fc97a"/>
          <stop offset="100%" stopColor="#5e9a4f"/>
        </linearGradient>
        <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3e0b0"/>
          <stop offset="60%" stopColor="#e0c684"/>
          <stop offset="100%" stopColor="#b89856"/>
        </linearGradient>
      </defs>

      {/* Mountain (back) */}
      <path d="M380 470 L460 230 L520 300 L590 150 L660 270 L730 220 L820 470 Z" fill="url(#mtnGrad)" />
      <path d="M380 470 L460 230 L520 300 L590 150 L660 270 L730 220 L820 470 Z" fill="url(#mtnShade)" />
      {/* Snow caps */}
      <path d="M460 230 L482 268 L440 270 Z" fill="rgba(255,255,255,0.92)" />
      <path d="M590 150 L618 200 L562 204 Z" fill="rgba(255,255,255,0.95)" />
      <path d="M660 270 L678 304 L644 306 Z" fill="rgba(255,255,255,0.85)" />

      {/* Jungle canopy mid-hill */}
      <path d="M180 470 C260 410 360 395 460 415 C540 430 640 410 760 420 C880 432 980 420 1040 470 Z" fill="url(#jungleGrad)" />
      <ellipse cx="320" cy="430" rx="70" ry="22" fill="#4a8a4a" opacity="0.85" />
      <ellipse cx="430" cy="420" rx="55" ry="18" fill="#5fa05a" opacity="0.9" />
      <ellipse cx="560" cy="425" rx="60" ry="20" fill="#3a7a40" opacity="0.85" />
      <ellipse cx="700" cy="420" rx="65" ry="20" fill="#4a8a4a" opacity="0.9" />
      <ellipse cx="830" cy="430" rx="70" ry="22" fill="#3f7d44" opacity="0.85" />
      <ellipse cx="940" cy="440" rx="55" ry="18" fill="#5fa05a" opacity="0.85" />

      {/* Grassy plateau */}
      <ellipse cx="600" cy="490" rx="500" ry="55" fill="url(#grassGrad)" />

      {/* Sand beach */}
      <ellipse cx="600" cy="525" rx="560" ry="42" fill="url(#sandGrad)" />

      {/* Wet shore (darker rim) */}
      <ellipse cx="600" cy="555" rx="585" ry="22" fill="#a07f4a" opacity="0.55" />
    </svg>
  );
}

function QuestBoard({ projects }: { projects: typeof PROJECTS }) {
  return (
    <div className="relative w-full max-w-3xl">
      {/* Wooden support posts */}
      <div className="absolute -left-3 -top-6 -bottom-16 z-10 w-7 rounded bg-gradient-to-r from-[#2e1a08] via-[#5a3819] to-[#2e1a08] shadow-[0_10px_30px_rgba(0,0,0,0.6)]" />
      <div className="absolute -right-3 -top-6 -bottom-16 z-10 w-7 rounded bg-gradient-to-r from-[#2e1a08] via-[#5a3819] to-[#2e1a08] shadow-[0_10px_30px_rgba(0,0,0,0.6)]" />

      {/* Top banner: QUEST BOARD */}
      <div className="absolute left-1/2 -top-7 z-30 -translate-x-1/2 whitespace-nowrap">
        <div className="rounded-md border-y-4 border-[#2a1808] bg-gradient-to-b from-[#7a4a22] to-[#4a2a12] px-10 py-2.5 shadow-2xl">
          <p className="font-serif text-sm tracking-[0.45em] text-amber-100">⚓ QUEST BOARD ⚓</p>
        </div>
      </div>

      {/* The wooden board */}
      <div
        className="relative rounded-md border-4 border-[#2a1808] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.65)] md:p-8"
        style={{
          backgroundColor: "#6b4423",
          backgroundImage: [
            "repeating-linear-gradient(180deg, transparent 0 46px, rgba(0,0,0,0.28) 46px 48px)",
            "repeating-linear-gradient(90deg, transparent 0 220px, rgba(0,0,0,0.18) 220px 222px)",
            "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0))",
          ].join(", "),
        }}
      >
        {/* Inner shadow vignette */}
        <div className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" />

        {/* Decorative corner nails */}
        <div className="pointer-events-none absolute left-3 top-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />
        <div className="pointer-events-none absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />
        <div className="pointer-events-none absolute left-3 bottom-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />
        <div className="pointer-events-none absolute right-3 bottom-3 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-zinc-300 to-zinc-600 ring-1 ring-black/60" />

        <div className="relative grid gap-7 md:grid-cols-2">
          {projects.map((p, i) => {
            const baseRot = i % 2 === 0 ? -2.5 : 2;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24, rotate: baseRot - 1 }}
                whileInView={{ opacity: 1, y: 0, rotate: baseRot }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: 0.25 + i * 0.15, duration: 0.7, ease }}
                whileHover={{ y: -8, rotate: 0, scale: 1.04, zIndex: 20 }}
                style={{ transformOrigin: "top center" }}
                className={
                  "relative rounded-sm border border-[#b08b4f] bg-[#f3e3b8] p-5 shadow-[0_14px_30px_rgba(0,0,0,0.55)]" +
                  (i === 2 ? " md:col-span-2 md:mx-auto md:max-w-[62%]" : "")
                }
              >
                {/* Pinned nail at top */}
                <div className="absolute left-1/2 -top-2 -translate-x-1/2">
                  <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />
                </div>

                {/* Parchment aging vignette */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-sm"
                  style={{ boxShadow: "inset 0 0 35px rgba(120,80,30,0.32)" }}
                />

                {/* Content */}
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-black/50">Quest {String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-1 font-serif text-xl font-bold text-black/90">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-black/70">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.stack.map((tech) => (
                      <span key={tech} className="rounded-full border border-black/20 bg-black/10 px-3 py-1 text-[11px] text-black/80">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded border border-black/30 bg-black/10 px-4 py-1.5 text-xs font-medium tracking-wide text-black/80 transition-colors hover:bg-black/25"
                  >
                    View Quest →
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hanging lantern (right side) */}
      <motion.div
        className="absolute -top-3 right-[10%] z-40 origin-top"
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="mx-auto h-12 w-px bg-black/70" />
        <div className="relative -mt-1 mx-auto h-12 w-9 rounded border border-black/70 bg-gradient-to-b from-[#2e1a08] to-[#0e0804] shadow-xl">
          <motion.div
            className="absolute inset-1 rounded bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-600 blur-[1.5px]"
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -inset-4 rounded-full bg-yellow-300/35 blur-2xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.95, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function QuestBoardIsland() {
  return (
    <section
      id="journey"
      className="relative isolate min-h-[120vh] overflow-hidden"
    >
      {/* SKY (top) — golden hour gradient */}
      <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-[#1a2e4a] via-[#3d5a7a] via-50% to-[#e8a06a] to-100%" />
      {/* warm horizon haze */}
      <div className="absolute inset-x-0 top-[40%] h-[18%] bg-gradient-to-b from-transparent via-[#ffb37a]/25 to-[#ff8c5a]/15" />

      {/* horizon fog band */}
      <div className="absolute inset-x-0 top-[55%] h-[3%] bg-white/15 blur-md" />

      {/* OCEAN (bottom) — painted gradient */}
      <div className="absolute inset-x-0 top-[55%] bottom-0 bg-gradient-to-b from-[#3d6d8e] via-[#1e466a] to-[#08182c]" />

      {/* Sun reflection on water */}
      <motion.div
        className="pointer-events-none absolute right-[15%] top-[55%] h-[28%] w-32 -translate-x-0 bg-gradient-to-b from-amber-200/55 via-amber-300/25 to-transparent blur-[3px]"
        animate={{ opacity: [0.5, 0.85, 0.5], scaleY: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle wave shimmer on ocean */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = 60 + (i * 13) % 32;
        const l = (i * 17) % 95;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-[1.5px] rounded-full bg-white"
            style={{ top: `${t}%`, left: `${l}%`, width: 30 + ((i * 11) % 70), opacity: 0.18 + (i % 3) * 0.08 }}
            animate={{ x: [0, 14, 0], opacity: [0.12, 0.32, 0.12] }}
            transition={{ duration: 3 + (i % 5) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          />
        );
      })}

      {/* Sun */}
      <Sun />

      {/* Drifting clouds */}
      <Cloud top="10%" width={220} duration={70} delay={0} />
      <Cloud top="18%" width={150} duration={90} delay={-25} />
      <Cloud top="14%" width={180} duration={110} delay={-50} />
      <Cloud top="24%" width={120} duration={80} delay={-15} />

      {/* Distant ship */}
      <DistantShip />

      {/* Seagulls flying */}
      <Seagull top="22%" duration={20} delay={0} />
      <Seagull top="28%" duration={26} delay={6} reverse scale={0.75} />
      <Seagull top="16%" duration={32} delay={12} scale={0.6} />

      {/* THE ISLAND SCENE */}
      <div className="relative z-10 mx-auto flex min-h-[120vh] w-full max-w-[1400px] flex-col items-center justify-end px-4 pb-24 pt-32">
        {/* Section heading floating above */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
          className="mb-12 text-center"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-amber-100/80">Land Ho! • Loguetown</p>
          <AnimatedHeading
            text="Quest Board"
            className="mt-3 font-serif text-5xl font-extrabold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] md:text-6xl"
          />
          <p className="mt-3 text-sm text-zinc-200/90">
            Pinned to the village board — quests completed across the Grand Line.
          </p>
        </motion.div>

        {/* Island stage: contains landmass + decorations + quest board */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, ease }}
          className="relative aspect-[2/1] w-full"
        >
          {/* Landmass SVG */}
          <IslandLandmass />

          {/* Foam line at shore (front) */}
          <motion.div
            className="pointer-events-none absolute bottom-[2%] left-1/2 h-3 w-[90%] -translate-x-1/2 rounded-full bg-white/70 blur-[3px]"
            animate={{ scaleX: [1, 1.04, 1], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-[5%] left-1/2 h-2 w-[78%] -translate-x-1/2 rounded-full bg-white/45 blur-[2px]"
            animate={{ scaleX: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />

          {/* Background palms (smaller, on the hills) */}
          <motion.div
            className="absolute left-[28%] top-[42%] z-[15] origin-bottom"
            animate={{ rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <PalmTree scale={0.55} />
          </motion.div>
          <motion.div
            className="absolute right-[26%] top-[44%] z-[15] origin-bottom"
            animate={{ rotate: [1.5, -1.5, 1.5] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <PalmTree scale={0.5} flip />
          </motion.div>

          {/* Foreground palms (on the beach) */}
          <motion.div
            className="absolute left-[6%] top-[58%] z-[25] origin-bottom"
            animate={{ rotate: [-2.5, 2.5, -2.5] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <PalmTree scale={1.2} />
          </motion.div>
          <motion.div
            className="absolute right-[5%] top-[55%] z-[25] origin-bottom"
            animate={{ rotate: [2.5, -2.5, 2.5] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <PalmTree scale={1.3} flip />
          </motion.div>
          <motion.div
            className="absolute left-[18%] top-[68%] z-[26] origin-bottom"
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <PalmTree scale={0.9} />
          </motion.div>

          {/* Grass tufts */}
          <div className="absolute left-[12%] top-[78%] z-[24]"><Grass /></div>
          <div className="absolute right-[14%] top-[80%] z-[24]"><Grass /></div>
          <div className="absolute left-[35%] top-[82%] z-[24] opacity-80"><Grass /></div>

          {/* Rocks at shoreline */}
          <div className="absolute left-[8%] top-[86%] z-[27]"><Rock scale={0.95} /></div>
          <div className="absolute right-[9%] top-[88%] z-[27]"><Rock scale={0.7} /></div>
          <div className="absolute left-[40%] top-[90%] z-[27]"><Rock scale={0.55} /></div>
          <div className="absolute right-[36%] top-[91%] z-[27]"><Rock scale={0.5} /></div>

          {/* Campfire glow near the board */}
          <motion.div
            className="pointer-events-none absolute left-[22%] top-[72%] z-[22] h-16 w-16 rounded-full bg-orange-400/40 blur-2xl"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* THE QUEST BOARD — centerpiece, planted on the grass */}
          <div className="absolute left-1/2 top-[18%] z-[30] w-[min(720px,82%)] -translate-x-1/2">
            <QuestBoard projects={PROJECTS} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function GrandLineTransition() {
  return (
    <section className="relative isolate min-h-[70vh] overflow-hidden">
      {/* Daytime sky — bridges QuestBoard's dark ocean up into bright midday blue matching VoyageLog */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #08182c 0%, #1a4e80 20%, #3070b0 45%, #4080c0 70%, #2a6aad 100%)",
        }}
      />

      {/* Drifting clouds */}
      <Cloud top="14%" width={210} duration={75} delay={0} />
      <Cloud top="22%" width={155} duration={95} delay={-30} />
      <Cloud top="9%" width={120} duration={115} delay={-55} />

      {/* Seagulls */}
      <Seagull top="32%" duration={26} delay={3} scale={0.65} />
      <Seagull top="38%" duration={34} delay={11} reverse scale={0.5} />

      {/* Sun — afternoon, slightly past peak */}
      <motion.div
        className="pointer-events-none absolute right-[14%] top-[10%] z-[4]"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative h-20 w-20">
          <div className="absolute -inset-10 rounded-full bg-yellow-200/20 blur-3xl" />
          <div className="absolute -inset-4 rounded-full bg-amber-200/25 blur-xl" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-100 via-amber-200 to-amber-400 shadow-[0_0_50px_25px_rgba(255,210,100,0.35)]" />
        </div>
      </motion.div>

      {/* Sun reflection on water */}
      <motion.div
        className="pointer-events-none absolute right-[16%] top-[72%] z-[3] h-[20%] w-20 bg-gradient-to-b from-amber-100/35 via-amber-200/12 to-transparent blur-[3px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scaleY: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle horizon haze */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[28%] h-[3%] bg-white/10 blur-2xl" />

      {/* Wave shimmer */}
      {Array.from({ length: 8 }).map((_, i) => {
        const t = 76 + ((i * 7) % 18);
        const l = (i * 23 + 9) % 94;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-px rounded-full bg-white/20"
            style={{ top: `${t}%`, left: `${l}%`, width: 24 + ((i * 15) % 55) }}
            animate={{ x: [0, 10, 0], opacity: [0.08, 0.25, 0.08] }}
            transition={{ duration: 3.5 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.45 }}
          />
        );
      })}

      {/* Lone ship on the horizon sailing toward the Grand Line */}
      <motion.div
        className="pointer-events-none absolute top-[68%] z-[3] text-zinc-200/35"
        initial={{ x: "-10vw" }}
        animate={{ x: "108vw" }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear", delay: -20 }}
      >
        <motion.svg
          width="48" height="38" viewBox="0 0 60 48" fill="currentColor"
          animate={{ y: [0, -2, 0, -1, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M8 32 L52 32 L46 40 L14 40 Z" opacity="0.75" />
          <rect x="29" y="6" width="2" height="26" />
          <path d="M30 8 L44 30 L30 30 Z" opacity="0.85" />
          <path d="M30 10 L18 30 L30 30 Z" opacity="0.55" />
          <path d="M30 4 L34 7 L30 7 Z" />
        </motion.svg>
      </motion.div>

      {/* Large faded compass rose watermark */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04]">
        <svg width="420" height="420" viewBox="0 0 90 90" fill="#f0d7a0">
          <polygon points="45,5 50,40 45,35 40,40" />
          <polygon points="45,85 50,50 45,55 40,50" />
          <polygon points="5,45 40,40 35,45 40,50" />
          <polygon points="85,45 50,40 55,45 50,50" />
          <polygon points="45,15 47,38 45,36 43,38" opacity="0.5" />
          <polygon points="45,75 47,52 45,54 43,52" opacity="0.5" />
          <polygon points="15,45 38,43 36,45 38,47" opacity="0.5" />
          <polygon points="75,45 52,43 54,45 52,47" opacity="0.5" />
          <circle cx="45" cy="45" r="8" fill="none" stroke="#f0d7a0" strokeWidth="1.5" />
          <circle cx="45" cy="45" r="14" fill="none" stroke="#f0d7a0" strokeWidth="0.8" opacity="0.5" />
          <circle cx="45" cy="45" r="20" fill="none" stroke="#f0d7a0" strokeWidth="0.5" opacity="0.3" />
        </svg>
      </div>

      {/* Centered content */}
      <div className="relative z-10 flex min-h-[70vh] items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1.1, ease }}
          className="relative w-full max-w-lg rounded-sm border-2 border-[#8b6a32] p-10 text-center shadow-[0_24px_70px_rgba(0,0,0,0.7)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(255,235,180,0.4), rgba(220,180,110,0) 70%), linear-gradient(180deg, #f0d7a0 0%, #e6c378 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-sm"
            style={{ boxShadow: "inset 0 0 60px rgba(120,80,30,0.5)" }}
          />
          {/* Pin */}
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />

          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.45em] text-black/70">Intercepted Den Den Mushi · Heart Pirates</p>
            <h2 className="mt-3 font-serif text-4xl font-extrabold text-black md:text-5xl">
              The Grand Line<br />Awaits
            </h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-10 bg-black/50" />
              <span className="text-[10px] tracking-[0.3em] text-black/60">✦ ✦ ✦</span>
              <div className="h-px w-10 bg-black/50" />
            </div>
            <p className="mt-5 font-serif text-base italic leading-relaxed text-black md:text-lg">
              &ldquo;A man only truly dies when he is forgotten. Carry the will of those who came before — and decide your own death yourself.&rdquo;
            </p>
            <p className="mt-4 text-xs font-bold tracking-[0.28em] text-black/80">
              — TRAFALGAR D. WATER LAW · SURGEON OF DEATH, HEART PIRATES
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-14 bg-black/50" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-black/70">LOG OPEN</span>
              <div className="h-px w-14 bg-black/50" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VoyageLog() {
  const timelineRef = useRef<HTMLDivElement>(null);
  return (
    <section id="voyage" className="relative isolate min-h-[120vh] overflow-hidden">
      {/* Continuous ocean sky → night gradient (no horizon seam) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #2a6aad 0%, #4a90c8 18%, #6aaee0 40%, #4d8fbe 55%, #2c5f8c 68%, #163a62 80%, #0c0e1a 100%)",
        }}
      />

      {/* Old map grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #c8b87a 1px, transparent 1px), linear-gradient(180deg, #c8b87a 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Soft atmospheric haze in the mid-band (purely a glow, no boundary) */}
      <div className="pointer-events-none absolute inset-x-0 top-[48%] h-[14%] bg-gradient-to-b from-white/8 via-white/4 to-transparent blur-2xl" />

      {/* Wave shimmer */}
      {Array.from({ length: 10 }).map((_, i) => {
        const t = 60 + ((i * 7) % 28);
        const l = (i * 21 + 5) % 95;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-[1.5px] rounded-full bg-white/25"
            style={{ top: `${t}%`, left: `${l}%`, width: 28 + ((i * 11) % 60) }}
            animate={{ x: [0, 12, 0], opacity: [0.12, 0.3, 0.12] }}
            transition={{ duration: 3 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
          />
        );
      })}

      {/* Drifting clouds */}
      <Cloud top="10%" width={200} duration={75} delay={0} />
      <Cloud top="18%" width={140} duration={95} delay={-28} />

      {/* Seagulls */}
      <Seagull top="28%" duration={22} delay={1} scale={0.75} />
      <Seagull top="34%" duration={30} delay={9} reverse scale={0.55} />

      {/* Compass rose (decorative, bottom-left corner) */}
      <div className="pointer-events-none absolute bottom-32 left-8 z-[4] opacity-20">
        <svg width="90" height="90" viewBox="0 0 90 90" fill="#f0d7a0">
          <polygon points="45,5 50,40 45,35 40,40" />
          <polygon points="45,85 50,50 45,55 40,50" />
          <polygon points="5,45 40,40 35,45 40,50" />
          <polygon points="85,45 50,40 55,45 50,50" />
          <circle cx="45" cy="45" r="6" />
          <circle cx="45" cy="45" r="3" fill="#c8a85a" />
          <text x="45" y="20" textAnchor="middle" fontSize="8" fontFamily="serif" fill="#f0d7a0">N</text>
        </svg>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-[120vh] w-full max-w-[1200px] flex-col items-center px-4 pb-32 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
          className="mb-20 text-center"
        >
          <p className="text-xs uppercase tracking-[0.4em] text-amber-100/80">
            The Grand Line · Captain&apos;s Log
          </p>
          <AnimatedHeading
            text="Voyage Log"
            className="mt-3 font-serif text-5xl font-extrabold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] md:text-6xl"
          />
          <p className="mt-3 text-sm text-zinc-200/85">
            Every port shaped the journey. Every arc built the crew.
          </p>
        </motion.div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative w-full max-w-3xl">
          {/* Animated rope drawn as you scroll */}
          <ScrollRope targetRef={timelineRef} />

          {VOYAGE.map((entry, i) => (
            <div
              key={i}
              className={`relative mb-16 flex items-start ${
                i % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              {/* Anchor marker on the rope */}
              <div className="absolute left-1/2 top-7 z-20 -translate-x-1/2">
                <motion.div
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#3d2410] bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 shadow-[0_0_14px_rgba(255,180,80,0.5)]"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 1 }}
                >
                  <span className="text-sm">⚓</span>
                </motion.div>
              </div>

              {/* Connector line to card */}
              <div
                className={`absolute top-[2.15rem] h-[2px] w-[calc(50%-1.25rem)] bg-gradient-to-r from-amber-700/80 to-transparent ${
                  i % 2 === 0
                    ? "right-1/2 translate-x-[-1.25rem] bg-gradient-to-l"
                    : "left-1/2 translate-x-[1.25rem]"
                }`}
              />

              {/* Parchment card */}
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -28 : 28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.85, delay: 0.15, ease }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`relative w-[calc(50%-2.5rem)] rounded-sm border border-[#b08b4f] p-6 shadow-[0_14px_35px_rgba(0,0,0,0.55)] ${
                  i % 2 === 0 ? "mr-[calc(50%+1.25rem)]" : "ml-[calc(50%+1.25rem)]"
                }`}
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 0%, rgba(255,235,180,0.4), rgba(220,180,110,0) 70%), linear-gradient(180deg, #f3e3b8 0%, #e8d098 100%)",
                }}
              >
                {/* Pin */}
                <div
                  className={`absolute -top-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60 ${
                    i % 2 === 0 ? "right-6" : "left-6"
                  }`}
                />
                {/* Aging vignette */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-sm"
                  style={{ boxShadow: "inset 0 0 30px rgba(120,80,30,0.3)" }}
                />

                <div className="relative">
                  {entry.current && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-700/80 px-2.5 py-0.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                      <span className="text-[8px] uppercase tracking-[0.3em] text-emerald-100">Currently Sailing</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-black/50">
                      {entry.arc}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.22em] text-black/45">
                      {entry.port}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] tracking-[0.2em] text-black/60">
                    {entry.period}
                  </p>
                  <h3 className="mt-2 font-serif text-xl font-bold text-black/90">
                    {entry.title}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-black/65">
                    {entry.org}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {entry.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5 text-xs leading-relaxed text-black/72">
                        <span className="mt-0.5 shrink-0 text-[#8b5a2b]">▸</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          ))}

          {/* "Now Sailing" end marker */}
          <motion.div
            className="relative flex flex-col items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
          >
            <motion.div
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-300/40 to-amber-600/40 shadow-[0_0_20px_rgba(255,180,80,0.5)]"
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-lg">🧭</span>
            </motion.div>
            <p className="mt-4 text-xs uppercase tracking-[0.4em] text-amber-100/70">
              Where It All Began · East Blue
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CREW QUARTERS — Personal Life Island
───────────────────────────────────────────── */

const HOBBIES = [
  {
    id: "mma",
    label: "Martial Arts",
    tag: "Wrestling · Boxing · MMA",
    icon: "🥊",
    color: "#c0392b",
    glow: "rgba(192,57,43,0.55)",
    accent: "#e74c3c",
    description:
      "Training at MMA Team Zabjelo in Podgorica, Montenegro. Wrestling and boxing are the foundation — MMA sparring sharpens the edges. Discipline forged on the mat carries into every line of code.",
    stat1: { label: "Team", value: "MMA Team Zabjelo" },
    stat2: { label: "Location", value: "Podgorica, Montenegro" },
    image: "/images/mma.jpg",
    details: [
      "Athlete my whole life — bodybuilding and powerlifting background before combat sports.",
      "Wrestling is my favorite of the three. Nothing humbles you like getting controlled on the mat.",
      "Favorite MMA fighter: Ilia Topuria. Favorite boxer: Canelo Álvarez.",
      "Home gym: MMA Team Zabjelo, Podgorica.",
      "Discipline forged in the gym is the same discipline that ships clean code.",
    ],
  },
  {
    id: "gaming",
    label: "Competitive Gaming",
    tag: "Valorant · CS2 · Twitch",
    icon: "🎮",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.55)",
    accent: "#a78bfa",
    description:
      "Peaked Immortal 3 in Valorant. FACEIT Level 10 in CS2. Previously streamed on Twitch — high-level competitive gaming is pure systems thinking, reading opponents and adapting mid-round.",
    stat1: { label: "Valorant", value: "Immortal 3" },
    stat2: { label: "CS2 FACEIT", value: "Level 10" },
    videos: [
      { label: "Valorant", src: "/video/gaming.mp4" },
      { label: "CS2", src: "/video/cs2.mp4" },
    ],
    details: [
      "Gaming my whole life — grew up on Counter-Strike, still in love with the genre.",
      "Streamed on Twitch for a while. Live feedback loops are unbeatable practice.",
      "Favorite Valorant agent: Jett. Movement, dash, knife — pure pressure.",
      "Favorite Valorant team: Sentinels.",
      "Sharp aim matters less than reading the round and adapting mid-fight.",
    ],
  },
  {
    id: "crypto",
    label: "Crypto & Markets",
    tag: "Trading · DeFi · Blockchain",
    icon: <SiEthereum />,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.55)",
    accent: "#fbbf24",
    description:
      "Been around crypto since 2021. Still learning every day — DeFi, web3, how the whole thing actually works. Not claiming to be a pro, just genuinely interested in where it's going. (That's Vitalik Buterin, co-founder of Ethereum, in the picture.)",
    stat1: { label: "Since", value: "2021" },
    stat2: { label: "Focus", value: "DeFi · Web3" },
    image: "/images/crypto.jpg",
    imagePosition: "top" as const,
    details: [
      "Hobby trader, not a guru. Markets are humbling and that's part of the appeal.",
      "Biggest single trade win so far: ~$1.2k. Small numbers, big lessons.",
      "Most of the fun is in reading about projects, watching the tech evolve, and learning how value moves on-chain.",
      "Long-term curious about Ethereum and what programmable money turns into next.",
    ],
  },
];

type Hobby = (typeof HOBBIES)[number];

function HobbyCard({ h, index }: { h: Hobby; index: number }) {
  const isEven = index % 2 === 0;
  const videos = "videos" in h ? h.videos : undefined;
  const image = "image" in h ? h.image : undefined;
  const imagePosition = "imagePosition" in h ? h.imagePosition : "center";
  const details = "details" in h ? h.details : [];
  const [videoIdx, setVideoIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const activeVideo = videos?.[videoIdx];

  // Lightbox sizing — videos fill the screen; small source images scale up by height
  const lightboxMediaClass = activeVideo
    ? "max-h-[90vh] max-w-[92vw] rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.7)]"
    : "h-[85vh] w-auto max-w-[92vw] rounded-xl object-cover shadow-[0_0_80px_rgba(0,0,0,0.7)]";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col gap-8 lg:flex-row ${isEven ? "" : "lg:flex-row-reverse"} items-center`}
    >
      {/* Media panel — flippable */}
      <div className="relative w-full lg:w-1/2" style={{ perspective: "1400px" }}>
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-72 w-full lg:h-80"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT — media */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            style={{ backfaceVisibility: "hidden", boxShadow: `0 0 60px ${h.glow}, 0 20px 60px rgba(0,0,0,0.6)` }}
          >
            {activeVideo ? (
              <video
                key={activeVideo.src}
                className="h-full w-full object-cover"
                src={activeVideo.src}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : image ? (
              <img
                src={image}
                alt={h.label}
                className="h-full w-full object-cover"
                style={{ objectPosition: imagePosition }}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${h.color}22, ${h.color}44)` }}
              >
                <span className="text-7xl opacity-40">{h.icon}</span>
              </div>
            )}
            {/* Overlay gradient */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to top, ${h.color}88 0%, transparent 50%)` }}
            />

            {/* Top-right control cluster */}
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              {videos && videos.length > 1 && (
                <div
                  className="flex gap-1 rounded-full bg-black/55 p-1 backdrop-blur-md"
                  onClick={stop}
                >
                  {videos.map((v, idx) => (
                    <button
                      key={v.label}
                      onClick={() => setVideoIdx(idx)}
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition"
                      style={{
                        background: idx === videoIdx ? h.color : "transparent",
                        color: idx === videoIdx ? "#fff" : "rgba(255,255,255,0.7)",
                        border: `1px solid ${idx === videoIdx ? h.accent : "rgba(255,255,255,0.18)"}`,
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={(e) => { stop(e); setZoomed(true); }}
                title="View full"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/80"
                style={{ border: `1px solid ${h.accent}55` }}
              >
                ⤢
              </button>
              <button
                onClick={(e) => { stop(e); setFlipped(true); }}
                title="More info"
                className="flex h-8 items-center gap-1 rounded-full bg-black/55 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-black/80"
                style={{ border: `1px solid ${h.accent}55` }}
              >
                ↻ Flip
              </button>
            </div>

            {/* Tag pill */}
            <div
              className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white backdrop-blur-md"
              style={{ background: `${h.color}99`, border: `1px solid ${h.accent}66` }}
            >
              {h.tag}
            </div>
          </div>

          {/* BACK — extended info */}
          <div
            className="absolute inset-0 flex flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 p-6 shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: `linear-gradient(145deg, ${h.color}22 0%, rgba(10,15,30,0.92) 60%, rgba(10,15,30,0.96) 100%)`,
              boxShadow: `0 0 60px ${h.glow}, 0 20px 60px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.4em]" style={{ color: h.accent }}>
                Inside the Log
              </p>
              <button
                onClick={(e) => { stop(e); setFlipped(false); }}
                title="Back"
                className="flex h-7 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
              >
                ← Back
              </button>
            </div>
            <h4 className="font-serif text-xl font-bold text-white">{h.label}</h4>
            <p className="text-xs leading-relaxed text-zinc-300">{h.description}</p>
            {details.length > 0 && (
              <ul className="mt-1 space-y-1.5">
                {details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs leading-relaxed text-zinc-200/90">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full" style={{ background: h.accent }} />
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Floating glow orb behind panel */}
        <div
          className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl blur-3xl opacity-30"
          style={{ background: h.color }}
        />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
              onClick={stop}
            >
              {activeVideo ? (
                <>
                  <video
                    key={activeVideo.src}
                    src={activeVideo.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className={lightboxMediaClass}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [-8, 0, 0, -8] }}
                    transition={{ duration: 4, times: [0, 0.1, 0.85, 1], ease: "easeInOut" }}
                    className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md"
                    style={{ border: `1px solid ${h.accent}66` }}
                  >
                    🔊 Sound available — unmute in the player below
                  </motion.div>
                </>
              ) : image ? (
                <img src={image} alt={h.label} className={lightboxMediaClass} />
              ) : null}
              <button
                onClick={() => setZoomed(false)}
                className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black text-lg font-bold shadow-xl hover:scale-110 transition"
                aria-label="Close"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text panel */}
      <div className="flex w-full flex-col gap-5 px-2 lg:w-1/2 lg:px-6">
        {/* Icon + heading */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.8 }}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${h.color}44, ${h.color}88)`,
              border: `1px solid ${h.accent}55`,
              boxShadow: `0 0 24px ${h.glow}`,
            }}
          >
            {h.icon}
          </motion.div>
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.4em] font-medium"
              style={{ color: h.accent }}
            >
              {h.tag}
            </p>
            <h3 className="font-serif text-2xl font-extrabold text-white md:text-3xl">
              {h.label}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-zinc-300">{h.description}</p>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-3">
          {[h.stat1, h.stat2].map((s) => (
            <div
              key={s.label}
              className="rounded-lg px-4 py-2.5 backdrop-blur-sm"
              style={{
                background: `${h.color}22`,
                border: `1px solid ${h.accent}44`,
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400">{s.label}</p>
              <p className="mt-0.5 text-sm font-bold" style={{ color: h.accent }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Animated accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 + index * 0.15 }}
          className="h-[2px] w-24 origin-left rounded-full"
          style={{ background: `linear-gradient(to right, ${h.color}, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

function CrewQuarters() {
  return (
    <section id="crew" className="relative isolate min-h-screen overflow-hidden">
      {/* Deep night sky — new distinct palette: indigo/navy */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #0c0e1a 0%, #111827 30%, #0f1e38 60%, #0c0e1a 100%)",
        }}
      />

      {/* Star field */}
      {Array.from({ length: 60 }).map((_, i) => {
        const x = (i * 41 + 11) % 100;
        const y = (i * 29 + 7) % 70;
        const size = i % 5 === 0 ? 2 : 1;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute rounded-full bg-white"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              opacity: 0.3 + (i % 4) * 0.15,
            }}
            animate={{ opacity: [0.2, 0.9, 0.2] }}
            transition={{
              duration: 2 + (i % 6),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.07,
            }}
          />
        );
      })}

      {/* Subtle aurora bands */}
      {[
        { color: "#8b5cf633", top: "15%", rotate: "-8deg" },
        { color: "#c0392b22", top: "35%", rotate: "5deg" },
        { color: "#f59e0b1a", top: "55%", rotate: "-4deg" },
      ].map((band, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute inset-x-0 h-32 blur-3xl"
          style={{ top: band.top, background: band.color, transform: `rotate(${band.rotate})` }}
          animate={{ opacity: [0.4, 0.8, 0.4], scaleY: [1, 1.3, 1] }}
          transition={{ duration: 7 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}

      {/* Floating particles */}
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-white/40"
          style={{ left: `${(i * 19 + 5) % 98}%`, top: "100%" }}
          animate={{ y: [-20, -600], opacity: [0, 0.6, 0] }}
          transition={{ duration: 12 + (i % 7) * 2, repeat: Infinity, ease: "linear", delay: i * 1.1 }}
        />
      ))}

      {/* Horizontal divider line top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center px-4 pb-32 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 text-center"
        >
          <p className="text-xs uppercase tracking-[0.45em] text-violet-300/80">
            Beyond The Code · The Captain Himself
          </p>
          <AnimatedHeading
            text="Beyond The Bounty"
            className="mt-3 font-serif text-5xl font-extrabold text-white drop-shadow-[0_4px_30px_rgba(139,92,246,0.4)] md:text-6xl"
          />
          <p className="mt-3 text-sm text-zinc-400">
            What sharpens the mind outside the ship.
          </p>
        </motion.div>

        {/* Animated separator */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 h-px w-48 origin-center rounded-full bg-gradient-to-r from-transparent via-violet-400/60 to-transparent"
        />

        {/* Hobby cards */}
        <div className="flex w-full flex-col gap-24">
          {HOBBIES.map((h, i) => (
            <HobbyCard key={h.id} h={h} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   LAUGHTALE — Final island & contact
───────────────────────────────────────────── */

const CREW = [
  { id: "luffy",   name: "Monkey D. Luffy", role: "Captain",         color: "#dc2626", glow: "rgba(220,38,38,0.55)",  initial: "L" },
  { id: "zoro",    name: "Roronoa Zoro",    role: "Swordsman",       color: "#16a34a", glow: "rgba(22,163,74,0.55)",  initial: "Z" },
  { id: "nami",    name: "Nami",            role: "Navigator",       color: "#f59e0b", glow: "rgba(245,158,11,0.55)", initial: "N" },
  { id: "usopp",   name: "Usopp",           role: "Sniper",          color: "#a16207", glow: "rgba(161,98,7,0.55)",   initial: "U" },
  { id: "sanji",   name: "Sanji",           role: "Cook",            color: "#facc15", glow: "rgba(250,204,21,0.55)", initial: "S" },
  { id: "chopper", name: "Tony Tony Chopper", role: "Doctor",        color: "#fb7185", glow: "rgba(251,113,133,0.55)",initial: "C" },
  { id: "robin",   name: "Nico Robin",      role: "Archaeologist",   color: "#7c3aed", glow: "rgba(124,58,237,0.55)", initial: "R" },
  { id: "franky",  name: "Franky",          role: "Shipwright",      color: "#06b6d4", glow: "rgba(6,182,212,0.55)",  initial: "F" },
  { id: "brook",   name: "Brook",           role: "Musician",        color: "#e5e7eb", glow: "rgba(229,231,235,0.55)",initial: "B" },
  { id: "jinbe",   name: "Jinbe",           role: "Helmsman",        color: "#1d4ed8", glow: "rgba(29,78,216,0.55)",  initial: "J" },
];

function LaughtaleTransition() {
  return (
    <section aria-hidden className="relative h-[110vh] overflow-hidden">
      {/* Dawn returns — mirror of the opening dawn, deep night → magenta → coral → peach */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, " +
            "#0c0e1a 0%, " +
            "#0f1028 8%, " +
            "#1a1340 17%, " +
            "#2a1745 26%, " +
            "#43204e 36%, " +
            "#6a2c54 47%, " +
            "#9a4256 58%, " +
            "#c2604c 68%, " +
            "#df8456 78%, " +
            "#efa672 88%, " +
            "#f5c089 100%)",
        }}
      />

      {/* Stars in the upper portion, fading as dawn arrives */}
      {Array.from({ length: 36 }).map((_, i) => {
        const x = (i * 37 + 11) % 100;
        const y = (i * 23 + 7) % 35;
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-px w-px rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%`, boxShadow: "0 0 3px rgba(255,255,255,0.9)" }}
            animate={{ opacity: [0.45, 1, 0.1] }}
            transition={{ duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
          />
        );
      })}

      {/* Distant horizon glow — the sun rising right at the bottom edge so it
         visually continues into the island section across the seam. */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 bottom-[-12vh] h-[60vh] w-[60vh] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,235,170,0.95) 0%, rgba(255,200,120,0.7) 25%, rgba(255,170,80,0.35) 50%, rgba(255,150,80,0.1) 70%, rgba(255,140,60,0) 85%)",
          filter: "blur(8px)",
        }}
      />
      {/* Tail haze pushing the warm peach color into the next section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[10vh]"
        style={{
          background:
            "linear-gradient(180deg, rgba(245,192,137,0) 0%, rgba(245,192,137,1) 100%)",
        }}
      />

      {/* Subtle drifting wisps */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`wisp-${i}`}
          className="pointer-events-none absolute h-12 w-[40vw] rounded-full bg-white/15 blur-3xl"
          style={{ top: `${30 + i * 15}%`, left: i % 2 === 0 ? "-20%" : "60%" }}
          animate={{ x: i % 2 === 0 ? [0, 200, 0] : [0, -200, 0] }}
          transition={{ duration: 30 + i * 6, repeat: Infinity, ease: "easeInOut", delay: i * 3 }}
        />
      ))}

      {/* Foreshadowing text in the upper third */}
      <div className="absolute inset-x-0 top-[18%] flex items-center justify-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.2em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.45em" }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-xs uppercase text-amber-100/85 drop-shadow-md md:text-sm"
        >
          A New Dawn Rises…
        </motion.p>
      </div>

      {/* Second tag lower down once the warm tones hit */}
      <div className="absolute inset-x-0 top-[64%] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-2xl font-extrabold uppercase tracking-[0.35em] text-amber-50 drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] md:text-4xl"
          style={{
            textShadow:
              "0 2px 4px rgba(0,0,0,0.9), 0 4px 22px rgba(255,170,80,0.55), 0 0 1px rgba(0,0,0,0.95)",
          }}
        >
          We Arrive at Laughtale
        </motion.p>
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-px w-48 origin-center bg-amber-50/80 md:w-64"
        />
      </div>
    </section>
  );
}

function CallMeFlipCard() {
  const [flipped, setFlipped] = useState(false);
  const number = "+382 67 474 438";
  const waNumber = "38267474438";

  return (
    <div
      className="relative w-full sm:w-[260px]"
      style={{ perspective: 1200, height: 50 }}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* FRONT — Call Me button */}
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-amber-50 shadow-[0_6px_20px_rgba(0,0,0,0.45)] transition hover:scale-[1.03]"
          style={{
            background:
              "linear-gradient(180deg, #4a2e14 0%, #2e1b08 100%)",
            borderColor: "#7a5210",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          ☎ Call Me
        </button>

        {/* BACK — Number + WhatsApp */}
        <div
          className="absolute inset-0 flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-amber-50 shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
          style={{
            background:
              "linear-gradient(180deg, #1a3a1a 0%, #0a1f0a 100%)",
            borderColor: "#25d366",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <button
            type="button"
            onClick={() => setFlipped(false)}
            aria-label="Flip back"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-50/30 text-amber-50/70 transition hover:scale-110 hover:text-amber-50"
          >
            ↺
          </button>
          <a
            href={`tel:+${waNumber}`}
            className="font-mono text-sm font-bold tracking-wider text-amber-50 transition hover:text-white"
          >
            {number}
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-black shadow-[0_0_12px_rgba(37,211,102,0.7)] transition hover:scale-110"
          >
            <SiWhatsapp className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function TreasureChest() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 12 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[640px]"
      style={{ perspective: 1400 }}
    >
      {/* Soft golden aura behind the chest */}
      <div
        className="pointer-events-none absolute -inset-12 -z-10 rounded-full opacity-80 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 60%, rgba(255,210,120,0.7), rgba(255,160,60,0.25) 50%, transparent 80%)",
        }}
      />

      {/* OPEN LID — tilted back behind the body */}
      <div
        className="relative mx-auto h-20 w-[88%] origin-bottom"
        style={{ transform: "rotateX(-65deg) translateY(8px)", transformStyle: "preserve-3d" }}
      >
        <div
          className="h-full w-full rounded-t-[160px_70px] border-2 border-[#3d2410] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
          style={{
            background:
              "linear-gradient(180deg, #5a3a1a 0%, #74491f 40%, #8b5a2b 100%)",
          }}
        >
          {/* Gold band on the lid */}
          <div
            className="mx-auto mt-3 h-2 w-[92%] rounded-sm"
            style={{
              background:
                "linear-gradient(180deg, #ffe48a 0%, #d4a747 50%, #8a6618 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 -1px 0 rgba(0,0,0,0.3) inset",
            }}
          />
        </div>
      </div>

      {/* CHEST BODY */}
      <div
        className="relative -mt-2 overflow-hidden rounded-b-2xl rounded-t-md border-2 border-[#3d2410] shadow-[0_30px_70px_rgba(60,30,10,0.6)]"
        style={{
          background:
            "repeating-linear-gradient(90deg, #6a4220 0px, #7a4d28 18px, #5e3a1c 19px, #6a4220 36px), linear-gradient(180deg, #5a3a1a, #4a2e14)",
          backgroundBlendMode: "multiply",
        }}
      >
        {/* Wood grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 22px), repeating-linear-gradient(180deg, rgba(255,200,140,0.15) 0 2px, transparent 2px 30px)",
          }}
        />

        {/* Top gold band */}
        <div
          className="absolute inset-x-0 top-0 h-3"
          style={{
            background:
              "linear-gradient(180deg, #ffe48a 0%, #d4a747 50%, #8a6618 100%)",
            boxShadow: "0 2px 0 rgba(255,255,255,0.35) inset, 0 -2px 6px rgba(0,0,0,0.4)",
          }}
        />

        {/* Bottom gold band */}
        <div
          className="absolute inset-x-0 bottom-0 h-4"
          style={{
            background:
              "linear-gradient(180deg, #ffe48a 0%, #d4a747 50%, #8a6618 100%)",
            boxShadow: "0 2px 0 rgba(255,255,255,0.35) inset, 0 -2px 6px rgba(0,0,0,0.4)",
          }}
        />

        {/* Vertical corner straps */}
        {["left-2", "right-2"].map((p) => (
          <div
            key={p}
            className={`pointer-events-none absolute ${p} top-0 bottom-0 w-3`}
            style={{
              background:
                "linear-gradient(90deg, #b07f25 0%, #ffe48a 50%, #b07f25 100%)",
              boxShadow: "0 0 0 1px rgba(60,30,5,0.6)",
            }}
          >
            {/* Rivets */}
            {[8, 28, 48, 68, 88].map((t) => (
              <div
                key={t}
                className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                style={{
                  top: `${t}%`,
                  background: "radial-gradient(circle at 30% 30%, #fff8c4, #b07f25 70%, #5a3a05)",
                  boxShadow: "0 1px 1px rgba(0,0,0,0.6)",
                }}
              />
            ))}
          </div>
        ))}

        {/* Inside warm glow at the top edge */}
        <div
          className="pointer-events-none absolute inset-x-6 top-3 h-12 rounded-full opacity-90 blur-2xl"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,225,140,0.85), rgba(255,180,80,0) 75%)",
          }}
        />

        {/* CONTENT inside the chest */}
        <div className="relative px-7 py-10 md:px-10 md:py-12">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/85">
              Treasure Inside
            </p>
            <h3 className="mt-2 font-serif text-3xl font-extrabold text-amber-50 drop-shadow-[0_2px_10px_rgba(255,180,60,0.6)] md:text-4xl">
              Set Sail Together
            </h3>
            <p className="mt-3 text-sm text-amber-100/85 md:text-base">
              Open to projects, collaborations, or just a chat about code, combat, or crypto.
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Magnetic strength={0.35}>
                <a
                  href="mailto:tosiicp@gmail.com"
                  className="flex items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-amber-950 shadow-[0_6px_20px_rgba(255,200,80,0.45)] transition hover:scale-[1.03]"
                  style={{
                    background:
                      "linear-gradient(180deg, #ffeaa0 0%, #f4c75a 55%, #c08820 100%)",
                    borderColor: "#7a5210",
                  }}
                >
                  ✉ tosiicp@gmail.com
                </a>
              </Magnetic>
              <CallMeFlipCard />
            </div>
          </div>
        </div>

        {/* LOCK PLATE — center front */}
        <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2">
          <div
            className="relative h-8 w-12 rounded-b-md border-2 border-[#5a3a05]"
            style={{
              background:
                "linear-gradient(180deg, #ffe48a 0%, #d4a747 60%, #8a6618 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.4) inset",
            }}
          >
            {/* Keyhole */}
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[#1a0c02]" />
              <div className="absolute left-1/2 bottom-0 h-2 w-1 -translate-x-1/2 bg-[#1a0c02]" />
            </div>
          </div>
        </div>

        {/* Floating sparkles inside the chest */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute h-1 w-1 rounded-full bg-amber-100"
            style={{
              left: `${15 + (i * 11) % 70}%`,
              top: `${20 + (i * 13) % 60}%`,
              boxShadow: "0 0 6px rgba(255,220,140,0.95)",
            }}
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.3, 0.6] }}
            transition={{ duration: 2 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function LaughtaleIsland() {
  return (
    <section id="contact" className="relative isolate -mt-px overflow-hidden">
      {/* Dawn sky → green island gradient */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, " +
            "#f5c089 0%, " +
            "#f0b478 10%, " +
            "#e8a468 22%, " +
            "#dd9258 34%, " +
            "#cc7e48 44%, " +
            "#b8703e 52%, " +
            "#946a3a 60%, " +
            "#6e8a44 66%, " +
            "#4a7a36 74%, " +
            "#3a6a2c 84%, " +
            "#2c5824 100%)",
        }}
      />

      {/* Rising sun continuation — same sun that started in the transition,
         now cresting into the island sky. Centered above the section so the
         glow visually continues across the seam. */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-28vh] h-[60vh] w-[120vw] max-w-[1600px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,235,170,0.8) 0%, rgba(255,200,120,0.55) 22%, rgba(255,170,90,0.3) 42%, rgba(255,170,90,0) 70%)",
          filter: "blur(8px)",
        }}
      />
      {/* Soft top haze that blends into the transition — eliminates any seam */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[8vh]"
        style={{
          background:
            "linear-gradient(180deg, rgba(245,192,137,0.95) 0%, rgba(245,192,137,0) 100%)",
        }}
      />

      {/* Distant island silhouettes on the horizon */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-[42%] mx-auto opacity-50"
        viewBox="0 0 1200 60"
        width="100%"
        preserveAspectRatio="none"
        style={{ height: 60 }}
      >
        <path
          d="M 0 60 L 0 38 Q 100 22 200 30 Q 300 12 400 24 Q 500 30 600 18 Q 700 24 820 28 Q 920 14 1040 26 Q 1140 30 1200 22 L 1200 60 Z"
          fill="rgba(70,40,20,0.45)"
        />
      </svg>

      {/* Floating golden particles */}
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-amber-200"
          style={{ left: `${(i * 17 + 5) % 98}%`, top: "100%" }}
          animate={{ y: [-50, -1100], opacity: [0, 0.85, 0] }}
          transition={{ duration: 16 + (i % 6) * 2, repeat: Infinity, ease: "linear", delay: i * 0.7 }}
        />
      ))}

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-4 pb-16 pt-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 text-center"
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.45em] text-white"
            style={{ textShadow: "0 2px 10px rgba(70,30,5,0.85), 0 0 14px rgba(70,30,5,0.5)" }}
          >
            The Final Island · Where The One Piece Awaits
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-6 max-w-2xl text-center text-base font-medium text-white md:text-lg"
          style={{ textShadow: "0 2px 8px rgba(70,30,5,0.85), 0 0 14px rgba(70,30,5,0.4)" }}
        >
          The journey&apos;s end. The Strawhats are docked, and the captain wants a word with you.
          Drop your message — every great adventure starts with a hello.
        </motion.p>

        {/* Crew showcase — single group image framed as a wanted poster */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-16 w-full max-w-[420px]"
        >
          {/* Soft warm aura */}
          <div
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px] blur-2xl"
            style={{ background: "radial-gradient(ellipse, rgba(255,200,120,0.55), transparent 70%)" }}
          />
          {/* Wanted-poster frame */}
          <div
            className="relative overflow-hidden rounded-md border-4 border-[#5a3a1a] shadow-[0_24px_60px_rgba(60,30,5,0.55)]"
            style={{
              background: "linear-gradient(180deg, #f0d7a0 0%, #e6c378 100%)",
            }}
          >
            {/* Pins */}
            <div className="absolute left-6 -top-2 z-10 h-4 w-4 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />
            <div className="absolute right-6 -top-2 z-10 h-4 w-4 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-md ring-2 ring-red-950/60" />

            <div className="relative p-3">
              <p className="text-center font-serif text-[10px] uppercase tracking-[0.4em] text-amber-950/70">
                Wanted · Together
              </p>
              <h3 className="mt-1 text-center font-serif text-2xl font-black tracking-[0.18em] text-amber-950 md:text-3xl">
                THE STRAWHAT PIRATES
              </h3>
              <div className="relative mt-3 overflow-hidden rounded-sm border-2 border-[#5a3a1a] bg-black/15 shadow-inner">
                <img
                  src="/images/crew.jpg"
                  alt="The Strawhat Pirates"
                  className="block h-auto w-full"
                />
                {/* Sepia tone */}
                <div className="pointer-events-none absolute inset-0 bg-amber-900/15 mix-blend-multiply" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/15" />
              </div>
              <p className="mt-3 text-center text-[11px] uppercase tracking-[0.35em] text-amber-950/75">
                Captain Monkey D. Luffy & Crew
              </p>
            </div>
          </div>
        </motion.div>

        {/* Crew name chips — Captain centered on top, crew below */}
        <div className="mt-10 flex w-full max-w-[900px] flex-col items-center gap-3">
          {/* Captain row */}
          {CREW.slice(0, 1).map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, scale: 1.05 }}
              className="flex items-center gap-2 rounded-full border-[3px] px-5 py-2 backdrop-blur-sm shadow-lg"
              style={{
                background: "rgba(255,245,220,0.95)",
                borderColor: m.color,
                boxShadow: `0 0 24px ${m.glow}`,
              }}
            >
              <span
                className="h-3 w-3 rounded-full shadow"
                style={{ background: m.color, boxShadow: `0 0 10px ${m.glow}` }}
              />
              <span className="font-serif text-base font-black text-amber-950">{m.name}</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-amber-900/80">
                · {m.role}
              </span>
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-amber-950">
                ★
              </span>
            </motion.div>
          ))}

          {/* Crew rows */}
          <div className="flex w-full flex-wrap items-center justify-center gap-2.5">
            {CREW.slice(1).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, scale: 1.05 }}
                className="flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5 backdrop-blur-sm shadow-md"
                style={{
                  background: "rgba(255,245,220,0.92)",
                  borderColor: m.color,
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shadow"
                  style={{ background: m.color, boxShadow: `0 0 8px ${m.glow}` }}
                />
                <span className="font-serif text-sm font-bold text-amber-950">{m.name}</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-amber-900/70">
                  · {m.role}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* GREEN ISLAND with chest */}
      <div className="relative z-10 mt-8">
        {/* Island grass mound (SVG) */}
        <svg
          className="pointer-events-none absolute inset-x-0 -top-6 mx-auto"
          viewBox="0 0 1200 240"
          preserveAspectRatio="none"
          width="100%"
          style={{ height: 240 }}
        >
          <defs>
            <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#76a64a" />
              <stop offset="50%" stopColor="#4a8a3e" />
              <stop offset="100%" stopColor="#2c5824" />
            </linearGradient>
            <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6c98a" />
              <stop offset="100%" stopColor="#b0925a" />
            </linearGradient>
          </defs>
          {/* Sand strip under the grass */}
          <path
            d="M 0 240 L 0 170 Q 200 140 350 152 Q 500 130 600 138 Q 700 130 850 150 Q 1000 140 1200 168 L 1200 240 Z"
            fill="url(#sandGrad)"
            opacity="0.6"
          />
          {/* Grass island */}
          <path
            d="M 80 240 L 80 130 Q 220 78 380 92 Q 500 64 600 76 Q 700 64 820 92 Q 980 78 1120 130 L 1120 240 Z"
            fill="url(#grassGrad)"
          />
          {/* Grass tufts highlight */}
          {Array.from({ length: 18 }).map((_, i) => {
            const x = 100 + i * 60 + (i % 3) * 8;
            return (
              <path
                key={i}
                d={`M ${x} 130 q 4 -10 8 0`}
                stroke="#a8d272"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
            );
          })}
        </svg>

        {/* Palm trees flanking the chest */}
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto flex max-w-[1200px] items-end justify-between px-4">
          <div className="hidden md:block">
            <PalmTree scale={0.85} />
          </div>
          <div className="hidden md:block">
            <PalmTree scale={0.85} flip />
          </div>
        </div>

        {/* Chest container */}
        <div className="relative flex flex-col items-center px-4 pt-32 pb-20">
          <TreasureChest />

          {/* Closing line */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-16 max-w-2xl text-center font-serif text-lg italic text-amber-50/95 drop-shadow md:text-xl"
          >
            &ldquo;You want the One Piece? Then take it. It&apos;s yours.&rdquo;
          </motion.p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.4em] text-amber-50/85 drop-shadow">
            — Gol D. Roger, Pirate King
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="bg-black text-zinc-50 overflow-x-hidden">
      <ScrollShip />
      <WantedPosterScene />
      <JourneyTransition />
      <QuestBoardIsland />
      <GrandLineTransition />
      <VoyageLog />
      <CrewQuarters />
      <LaughtaleTransition />
      <LaughtaleIsland />
    </main>
  );
}

