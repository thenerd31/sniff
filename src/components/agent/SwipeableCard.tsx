"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import type { ShoppingResult } from "@/types";
import ResultCard from "./ResultCard";

interface SwipeableCardProps {
  result: ShoppingResult;
  onDismiss: (id: string) => void;
}

export default function SwipeableCard({ result, onDismiss }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
  const opacity = useTransform(x, [0, 100, 200], [1, 0.8, 0.4]);

  return (
    <motion.div
      layout
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragDirectionLock
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        if (info.offset.x > 150) {
          onDismiss(result.id);
        }
      }}
      exit={{ x: 500, opacity: 0, rotate: 15 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      className="cursor-grab relative touch-pan-y"
    >
      <ResultCard result={result} variant="bad" />
      {/* Swipe hint */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 text-xs pointer-events-none select-none">
        swipe →
      </div>
    </motion.div>
  );
}
