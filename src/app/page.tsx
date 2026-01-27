"use client";

import React from "react";
import Image from "next/image";
import OceanTravel from "./components/OceanTravel";
import { motion } from "framer-motion";
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

/* ================= DATA ================= */

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
    title: "Full-Stack Dashboard",
    description:
      "Authentication, CRUD flows, role-based access, and clean UI architecture.",
    stack: ["React", "Node.js", "PostgreSQL"],
  },
  {
    title: "REST API Service",
    description:
      "Validation, pagination, error handling, and clean controllers.",
    stack: ["Node.js", "TypeScript"],
  },
  {
    title: "Django Backend",
    description: "Models, admin tooling, and REST endpoints.",
    stack: ["Django", "PostgreSQL"],
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

/* ================= HERO ================= */

function WantedPoster() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease }}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-black/30 bg-[#c9ad7a] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div className="p-8 md:p-10 grid gap-10 md:grid-cols-[1fr_auto]">
          {/* LEFT */}
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-black/60">
              AVAILABLE • JUNIOR
            </div>

            <h1 className="mt-7 font-serif text-4xl md:text-6xl font-extrabold tracking-wide text-black">
              PAVLE TOŠIĆ
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-relaxed text-black/70">
              Full-stack developer building end-to-end products (UI + APIs + DB).
              React, Node.js, TypeScript, Django, PostgreSQL.
            </p>

            <div className="mt-8 flex gap-3">
              <a
                href="#journey"
                className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-[#f2e3c3]"
              >
                Begin the Journey ↓
              </a>
              <a
                href="https://github.com/"
                className="rounded-2xl border border-black/20 bg-black/5 px-5 py-3 text-sm text-black/80"
              >
                GitHub
              </a>
            </div>

            <div className="mt-10 border-t border-black/20 pt-6 text-xs text-black/50">
              Scroll to sail the Grand Line
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-full md:w-[420px]">
            <div className="rounded-3xl border border-black/20 bg-black/5 p-4">
              <div className="relative h-[460px] overflow-hidden rounded-2xl border border-black/20 bg-black/10">
                <span className="absolute left-3 top-3 z-10 rounded-full border border-black/30 bg-[#d8c28d] px-4 py-1 text-[11px] font-semibold tracking-[0.32em] text-black/80">
                  WANTED
                </span>

                <Image
                  src="/images/me.jpg"
                  alt="Pavle Tošić"
                  fill
                  priority
                  className="object-cover object-center"
                />
              </div>

              <div className="mt-3 text-center text-[11px] tracking-[0.22em] text-black/60">
                GRAND LINE • FULL-STACK • WEB3
              </div>
            </div>

            {/* MARQUEE */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-black/20 bg-black/5 py-3">
              <motion.div
                className="flex gap-2"
                animate={{ x: [0, -1600] }}
                transition={{
                  repeat: Infinity,
                  duration: 26,
                  ease: "linear",
                }}
              >
                {[...TECH, ...TECH, ...TECH].map(({ Icon, label }, i) => (
                  <div
                    key={i}
                    className="shrink-0 inline-flex items-center gap-2 rounded-full border border-black/20 bg-black/5 px-3 py-2 text-xs text-black/80"
                  >
                    <Icon className="text-sm" />
                    {label}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================= QUEST BOARD ================= */

function QuestBoardIsland() {
  return (
    <section
      id="journey"
      className="relative min-h-[200vh] flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 120 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.1, ease }}
        className="relative w-[min(1100px,92vw)] rounded-[40px] border border-black/30 bg-[#d6bf8a] p-12 shadow-[inset_0_0_120px_rgba(0,0,0,0.35),0_40px_120px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-black/60">
            Island 01
          </div>
          <h2 className="mt-4 font-serif text-4xl font-extrabold text-black">
            Quest Board
          </h2>
          <p className="mt-3 text-black/70">
            Projects completed across the Grand Line.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {PROJECTS.map((project) => (
            <motion.div
              key={project.title}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="rounded-2xl border border-black/30 bg-[#e7d3a3] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <h3 className="font-serif text-xl font-bold text-black">
                {project.title}
              </h3>

              <p className="mt-3 text-sm text-black/70">
                {project.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-black/20 bg-black/10 px-3 py-1 text-xs text-black"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ================= PAGE ================= */

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <section className="mx-auto w-[min(1180px,92vw)] pt-16">
        <WantedPoster />
      </section>

      {/* 🌊 CINEMATIC TRANSITION */}
      <OceanTravel />

      {/* 🏝️ ISLAND */}
      <QuestBoardIsland />
    </main>
  );
}