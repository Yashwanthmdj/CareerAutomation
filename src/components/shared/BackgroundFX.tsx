import { useEffect } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";

export default function BackgroundFX() {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);
  const tx = useTransform(x, (v) => v - 300);
  const ty = useTransform(y, (v) => v - 300);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#050816]" />
      <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-indigo-600/25 blur-[140px] animate-pulse-glow" />
      <div
        className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[160px] animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[150px] animate-pulse-glow"
        style={{ animationDelay: "3s" }}
      />
      <div className="absolute inset-0 grid-bg opacity-70" />
      <div className="absolute inset-0 noise" />
      <motion.div
        style={{ x: tx, y: ty }}
        className="absolute h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_60%)]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_50%,#050816_100%)]" />
    </div>
  );
}