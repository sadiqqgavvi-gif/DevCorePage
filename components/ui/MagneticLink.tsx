"use client";

import type { ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

const SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

export function MagneticLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const x = useSpring(pullX, SPRING);
  const y = useSpring(pullY, SPRING);

  return (
    <motion.a
      href={href}
      className={`pill pill-${variant} ${className}`}
      style={{ x, y }}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap={{ scale: 0.97 }}
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse") return;
        const box = event.currentTarget.getBoundingClientRect();
        pullX.set((event.clientX - box.left - box.width / 2) * 0.22);
        pullY.set((event.clientY - box.top - box.height / 2) * 0.32);
      }}
      onPointerLeave={() => {
        pullX.set(0);
        pullY.set(0);
      }}
    >
      {children}
      <motion.span
        aria-hidden
        variants={{ rest: { x: 0 }, hover: { x: 4 } }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
      >
        →
      </motion.span>
    </motion.a>
  );
}
