"use client";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ShipSilhouette() {
  const { scrollYProgress } = useScroll();
  const x = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      style={{ x }}
      className="ship absolute bottom-[20%] left-1/2 -translate-x-1/2 opacity-60"
    >
      <svg width="220" height="90" viewBox="0 0 220 90" fill="none">
        <path
          d="M10 60 L210 60 L180 80 L40 80 Z"
          fill="rgba(255,255,255,0.35)"
        />
        <rect x="100" y="10" width="6" height="50" fill="rgba(255,255,255,0.35)" />
        <path
          d="M106 12 L160 45 L106 45 Z"
          fill="rgba(255,255,255,0.25)"
        />
      </svg>
    </motion.div>
  );
}