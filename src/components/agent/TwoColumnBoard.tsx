"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import ResultCard from "./ResultCard";
import SwipeableCard from "./SwipeableCard";

interface TwoColumnBoardProps {
  onContinue: () => void;
}

export default function TwoColumnBoard({ onContinue }: TwoColumnBoardProps) {
  const goodResults = useAgentStore((s) => s.goodResults());
  const badResults = useAgentStore((s) => s.badResults());
  const dismissResult = useAgentStore((s) => s.dismissResult);
  const dismissAllBad = useAgentStore((s) => s.dismissAllBad);

  const allBadDismissed = badResults.length === 0;

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-5xl mx-auto">
      <motion.div
        layout
        className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Good Column */}
        <motion.div layout className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center gap-2 px-4 py-2 bg-emerald-light rounded-full">
              <ShieldCheck className="w-4 h-4 text-emerald" />
              <span className="text-sm font-semibold text-emerald-700">
                Verified Safe
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                ({goodResults.length})
              </span>
            </span>
          </div>
          <AnimatePresence>
            {goodResults.map((result) => (
              <motion.div
                key={result.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <ResultCard result={result} variant="good" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bad Column */}
        <AnimatePresence>
          {!allBadDismissed && (
            <motion.div
              layout
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-2 px-4 py-2 bg-red-light rounded-full">
                  <ShieldAlert className="w-4 h-4 text-red" />
                  <span className="text-sm font-semibold text-red-700">
                    Flagged
                  </span>
                  <span className="text-xs text-red-600 font-medium">
                    ({badResults.length})
                  </span>
                </span>
                <button
                  onClick={dismissAllBad}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Dismiss All
                </button>
              </div>
              <AnimatePresence>
                {badResults.map((result) => (
                  <SwipeableCard
                    key={result.id}
                    result={result}
                    onDismiss={dismissResult}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Continue Button */}
      <AnimatePresence>
        {allBadDismissed && goodResults.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            onClick={onContinue}
            className="mt-8 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg shadow-orange-500/25 transition-colors text-sm"
          >
            Find the Best Deal →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
