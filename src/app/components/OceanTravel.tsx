"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function OceanTravel() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // 🌊 Wave parallax layers
  const waveBack = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);
  const waveMid = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const waveFront = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);

  // 🚢 Ship motion
  const shipY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const shipRotate = useTransform(scrollYProgress, [0, 1], [-2, 6]);

  return (
    <section
      ref={ref}
      className="relative h-[220vh] overflow-hidden bg-zinc-950"
    >
      {/* ===== OCEAN BASE ===== */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" />

      {/* ===== WAVES (PARALLAX) ===== */}
      <motion.div
        style={{ y: waveBack }}
        className="absolute bottom-0 left-0 right-0 h-[420px]
        bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_70%)]"
      />

      <motion.div
        style={{ y: waveMid }}
        className="absolute bottom-0 left-0 right-0 h-[520px]
        bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.10),transparent_70%)]"
      />

      <motion.div
        style={{ y: waveFront }}
        className="absolute bottom-0 left-0 right-0 h-[620px]
        bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.14),transparent_70%)]"
      />

      {/* ===== SHIP ===== */}
      <motion.div
        style={{ y: shipY, rotate: shipRotate }}
        className="absolute left-1/2 top-[40%] -translate-x-1/2 z-20"
      >
        <motion.img
          src="/ship.svg"
          alt="Ship"
          className="w-40 opacity-90"
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* ===== TEXT ===== */}
      <div className="relative z-30 flex h-full items-center justify-center">
        <div className="text-center max-w-xl px-6">
          <div className="text-xs uppercase tracking-[0.4em] text-zinc-400">
            The Grand Line
          </div>
          <h2 className="mt-4 font-serif text-4xl md:text-5xl text-zinc-100">
            Sailing the Unknown
          </h2>
          <p className="mt-6 text-zinc-400">
            Unpredictable seas. No fixed path.
            <br />
            Every scroll moves the world forward — just like learning.
          </p>
        </div>
      </div>

      {/* ===== CINEMATIC VIGNETTE ===== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.75))]" />
    </section>
  );
}