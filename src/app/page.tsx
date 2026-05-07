"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "react-icons/si";

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
    org: "General Assembly",
    current: false,
    bullets: [
      "420+ hours of intensive bootcamp training",
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
          <h1 className="mt-3 font-serif text-6xl font-black tracking-[0.18em] text-white drop-shadow-[0_4px_25px_rgba(255,150,80,0.55)] md:text-7xl">
            WANTED
          </h1>
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
                    <a
                      href="https://github.com/Toshkee"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between rounded border border-black/30 bg-black/10 px-3 py-2 text-xs font-medium text-black/80 transition-colors hover:bg-black/25"
                    >
                      <span>GitHub</span>
                      <span>→</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/tosiicp/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between rounded border border-black/30 bg-black/10 px-3 py-2 text-xs font-medium text-black/80 transition-colors hover:bg-black/25"
                    >
                      <span>LinkedIn</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* CENTER — WANTED poster (the bounty) */}
              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1, delay: 0.2, ease }}
                whileHover={{ y: -6, scale: 1.025 }}
                className="relative w-[min(360px,90vw)] rounded-sm border-2 border-[#7a5722] shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
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
            <p className="text-[9px] uppercase tracking-[0.4em] text-black/50">Intercepted Message · Red Hair Pirates</p>
            <h2 className="mt-3 font-serif text-3xl font-extrabold text-black md:text-4xl">
              A Pirate Needs No Permission
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-black/70">
              &ldquo;I don&apos;t care what the world thinks about where you&apos;re headed. If you&apos;ve decided to set sail — that&apos;s enough. Raise your flag and let the sea decide the rest.&rdquo;
            </p>
            <p className="mt-4 text-[10px] tracking-[0.3em] text-black/50">
              — &apos;Red-Hair&apos; Shanks · Captain, Red Hair Pirates
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-black/40" />
              <span className="text-[10px] tracking-[0.4em] text-black/55">RAISE YOUR FLAG</span>
              <div className="h-px w-12 bg-black/40" />
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
          <h2 className="mt-3 font-serif text-5xl font-extrabold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] md:text-6xl">
            Quest Board
          </h2>
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
            <p className="text-[9px] uppercase tracking-[0.45em] text-black/50">Intercepted Den Den Mushi · Heart Pirates</p>
            <h2 className="mt-3 font-serif text-4xl font-extrabold text-black md:text-5xl">
              The Grand Line<br />Awaits
            </h2>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-10 bg-black/35" />
              <span className="text-[10px] tracking-[0.3em] text-black/45">✦ ✦ ✦</span>
              <div className="h-px w-10 bg-black/35" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-black/65">
              &ldquo;The New World has no patience for those who improvise. Map every obstacle. Sharpen every skill. When you enter your Room — execute without hesitation.&rdquo;
            </p>
            <p className="mt-4 text-[10px] tracking-[0.28em] text-black/50">
              — Trafalgar D. Water Law · Surgeon of Death, Heart Pirates
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="h-px w-14 bg-black/35" />
              <span className="text-[9px] tracking-[0.4em] text-black/50">LOG OPEN</span>
              <div className="h-px w-14 bg-black/35" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function VoyageLog() {
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
          <h2 className="mt-3 font-serif text-5xl font-extrabold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] md:text-6xl">
            Voyage Log
          </h2>
          <p className="mt-3 text-sm text-zinc-200/85">
            Every port shaped the journey. Every arc built the crew.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative w-full max-w-3xl">
          {/* Central rope */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-700/80 to-transparent" />

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
    label: "Combat Arts",
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
      "Self-taught crypto trader since 2021. Deep dives into DeFi protocols, web3 ecosystems, and risk management. Markets are the ultimate adversarial environment. (That's Vitalik Buterin, co-founder of Ethereum, in the picture.)",
    stat1: { label: "Since", value: "2021" },
    stat2: { label: "Focus", value: "DeFi · Web3" },
    image: "/images/crypto.jpg",
    imageFit: "contain" as const,
    zoomSize: "sm" as const,
  },
];

type Hobby = (typeof HOBBIES)[number];

function HobbyCard({ h, index }: { h: Hobby; index: number }) {
  const isEven = index % 2 === 0;
  const videos = "videos" in h ? h.videos : undefined;
  const image = "image" in h ? h.image : undefined;
  const imageFit = "imageFit" in h ? h.imageFit : "cover";
  const zoomSize = (("zoomSize" in h && h.zoomSize) || "lg") as "sm" | "md" | "lg";
  const zoomClass =
    zoomSize === "sm"
      ? "max-h-[62vh] max-w-[58vw]"
      : zoomSize === "md"
      ? "max-h-[75vh] max-w-[75vw]"
      : "max-h-[90vh] max-w-[92vw]";
  const [videoIdx, setVideoIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const activeVideo = videos?.[videoIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col gap-8 lg:flex-row ${isEven ? "" : "lg:flex-row-reverse"} items-center`}
    >
      {/* Media panel */}
      <div className="relative w-full lg:w-1/2">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.4 }}
          className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
          style={{ boxShadow: `0 0 60px ${h.glow}, 0 20px 60px rgba(0,0,0,0.6)` }}
          onClick={() => setZoomed(true)}
        >
          {activeVideo ? (
            <video
              key={activeVideo.src}
              className="h-72 w-full object-cover lg:h-80"
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
              className={`h-72 w-full lg:h-80 ${imageFit === "contain" ? "object-contain bg-black/40" : "object-cover"}`}
            />
          ) : (
            <div
              className="flex h-72 w-full items-center justify-center lg:h-80"
              style={{ background: `linear-gradient(135deg, ${h.color}22, ${h.color}44)` }}
            >
              <span className="text-7xl opacity-40">{h.icon}</span>
            </div>
          )}
          {/* Overlay gradient */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${h.color}88 0%, transparent 50%)`,
            }}
          />
          {/* Video switcher (when multiple videos) */}
          {videos && videos.length > 1 && (
            <div
              className="absolute right-3 top-3 flex gap-1.5 rounded-full bg-black/55 p-1 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {videos.map((v, idx) => (
                <button
                  key={v.label}
                  onClick={() => setVideoIdx(idx)}
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] transition"
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
          {/* Zoom hint */}
          <div className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80 opacity-0 backdrop-blur-md transition group-hover:opacity-100">
            ⤢ Click to expand
          </div>
          {/* Tag pill on image */}
          <div
            className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white backdrop-blur-md"
            style={{ background: `${h.color}99`, border: `1px solid ${h.accent}66` }}
          >
            {h.tag}
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
              onClick={(e) => e.stopPropagation()}
            >
              {activeVideo ? (
                <video
                  key={activeVideo.src}
                  src={activeVideo.src}
                  autoPlay
                  loop
                  playsInline
                  controls
                  className={`${zoomClass} rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.7)]`}
                />
              ) : image ? (
                <img
                  src={image}
                  alt={h.label}
                  className={`${zoomClass} rounded-xl object-contain shadow-[0_0_80px_rgba(0,0,0,0.7)]`}
                />
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
            "linear-gradient(180deg, #0c0e1a 0%, #111827 30%, #0f1e38 60%, #0a1628 100%)",
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
          <h2 className="mt-3 font-serif text-5xl font-extrabold text-white drop-shadow-[0_4px_30px_rgba(139,92,246,0.4)] md:text-6xl">
            Beyond The Bounty
          </h2>
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

export default function Page() {
  return (
    <main className="bg-black text-zinc-50 overflow-x-hidden">
      <WantedPosterScene />
      <JourneyTransition />
      <QuestBoardIsland />
      <GrandLineTransition />
      <VoyageLog />
      <CrewQuarters />
    </main>
  );
}

