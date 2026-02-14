"use client";

import { motion } from "framer-motion";
import type { ProductVerdict } from "@/types";

interface TrustBadgeProps {
  verdict: ProductVerdict;
  score: number;
  size?: "sm" | "md";
}

const verdictConfig = {
  trusted: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    label: "Trusted",
  },
  caution: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    label: "Caution",
  },
  danger: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
    label: "Danger",
  },
};

export function TrustBadge({ verdict, score, size = "sm" }: TrustBadgeProps) {
  const config = verdictConfig[verdict];
  const isSmall = size === "sm";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`
        inline-flex items-center gap-1.5 border
        ${config.bg} ${config.text} ${config.border}
        ${isSmall ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}
        rounded-full font-semibold
      `}
    >
      <span className={`${config.dot} rounded-full ${isSmall ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
      <span>{config.label}</span>
      <span className="opacity-60">{score}</span>
    </motion.div>
  );
}
