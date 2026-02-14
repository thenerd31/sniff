"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Check, X as XIcon } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import ThinkingDots from "./ThinkingDots";
import ResultCard from "./ResultCard";

export default function AgentThinking() {
  const results = useAgentStore((s) => s.results);
  const narration = useAgentStore((s) => s.narration);

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-4xl mx-auto">
      {/* Narration Banner */}
      <motion.div
        className="flex items-center gap-3 mb-8 px-5 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-orange-500"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        <AnimatePresence mode="popLayout">
          <motion.p
            key={narration}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-gray-600 font-medium"
          >
            {narration || "Starting investigation..."}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Results Grid */}
      <motion.div
        className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        layout
      >
        <AnimatePresence>
          {results.map((result, i) => (
            <motion.div
              key={result.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: i * 0.15,
              }}
              className="relative"
            >
              <ResultCard
                result={result}
                variant={result.fraud.isSafe ? "good" : "bad"}
              />
              {/* Verdict indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 + 0.4, type: "spring", stiffness: 400 }}
                className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
                  result.fraud.isSafe
                    ? "bg-emerald text-white"
                    : "bg-red text-white"
                }`}
              >
                {result.fraud.isSafe ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <XIcon className="w-4 h-4" />
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator for next card */}
        {results.length > 0 && (
          <motion.div
            layout
            className="flex items-center justify-center p-8 border-2 border-dashed border-orange-200 rounded-2xl"
          >
            <div className="flex flex-col items-center gap-2">
              <SearchIcon className="w-5 h-5 text-orange-300" />
              <ThinkingDots />
              <p className="text-xs text-orange-300">Analyzing...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
