"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#E48F24", "#DFAF66", "#2F7A4A", "#182E20", "#F8E0B5", "#696C4D"];

interface ConfettiPiece {
  id: number;
  x: number; // start x % (around center)
  angle: number; // launch angle in degrees
  velocity: number; // launch velocity
  color: string;
  size: number;
  rotation: number;
  delay: number;
  shape: "circle" | "square" | "triangle";
}

export function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = -90 + (Math.random() - 0.5) * 120; // spread upward ±60°
      const velocity = 200 + Math.random() * 300;
      return {
        id: i,
        x: 50 + (Math.random() - 0.5) * 20, // start near center
        angle,
        velocity,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.15,
        shape: (["circle", "square", "triangle"] as const)[Math.floor(Math.random() * 3)],
      };
    });
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => {
        // Compute landing position from angle + velocity + gravity
        const rad = (p.angle * Math.PI) / 180;
        const vx = Math.cos(rad) * p.velocity;
        const vy = Math.sin(rad) * p.velocity;
        const flightTime = 1.6;
        const gravity = 600;
        const endX = vx * flightTime;
        const endY = vy * flightTime + 0.5 * gravity * flightTime * flightTime;

        return (
          <motion.div
            key={p.id}
            initial={{
              left: `${p.x}%`,
              top: "45%",
              opacity: 1,
              rotate: p.rotation,
              scale: 1,
            }}
            animate={{
              left: `calc(${p.x}% + ${endX}px)`,
              top: `calc(45% + ${endY}px)`,
              opacity: [1, 1, 0],
              rotate: p.rotation + 720 * (Math.random() > 0.5 ? 1 : -1),
              scale: [1, 1, 0.5],
            }}
            transition={{
              duration: 1.8,
              delay: p.delay,
              ease: "easeOut",
              times: [0, 0.7, 1],
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.shape === "triangle" ? 0 : p.size,
              background: p.shape === "triangle" ? "transparent" : p.color,
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "0",
              borderLeft: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
              borderRight: p.shape === "triangle" ? `${p.size / 2}px solid transparent` : undefined,
              borderBottom: p.shape === "triangle" ? `${p.size}px solid ${p.color}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
