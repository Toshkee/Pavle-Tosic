"use client";

export default function LogPose() {
  return (
    <div className="absolute top-16 right-16 w-20 h-20 rounded-full border border-white/30 bg-black/40 backdrop-blur">
      <div className="absolute inset-2 rounded-full border border-white/20" />
      <div className="log-needle absolute left-1/2 top-1/2 w-[2px] h-6 bg-white" />
    </div>
  );
}