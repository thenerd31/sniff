"use client";

import { motion } from "framer-motion";

export default function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-orange-100 rounded-full">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-orange-400"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
