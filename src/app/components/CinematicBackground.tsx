"use client";

import { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface CinematicBackgroundProps {
  children?: ReactNode;
}

export default function CinematicBackground({
  children,
}: CinematicBackgroundProps) {
  const { scrollYProgress } = useScroll();

  // Gentle cinematic reveal
  const opacity = useTransform(scrollYProgress, [0, 0.15], [0.2, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.25, 1.1]);

  return (
    <section className="relative h-[200vh] w-full">
      {/* VIDEO LAYER */}
      <motion.video
        style={{ opacity, scale }}
        className="fixed inset-0 h-full w-full object-cover"
        src="/video/ocean.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* SOFT CINEMATIC VIGNETTE (NOT BLACK BARS) */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* CONTENT ON TOP OF VIDEO */}
      <div className="relative z-10 flex min-h-screen items-center justify-center text-center">
        {children}
      </div>
    </section>
  );
}