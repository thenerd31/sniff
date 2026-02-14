"use client";

import { useState, useEffect, useCallback } from "react";
import UnlockAnimation from "@/components/UnlockAnimation";

export default function AnimationTestingPage() {
  const [unlock, setUnlock] = useState(false);
  const [finished, setFinished] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  // Auto-trigger after a short pause so you see the locked state first
  useEffect(() => {
    const timer = setTimeout(() => setUnlock(true), 600);
    return () => clearTimeout(timer);
  }, [instanceKey]);

  const handleReset = useCallback(() => {
    setUnlock(false);
    setFinished(false);
    // Increment key → full remount → all internal state resets
    setInstanceKey((k) => k + 1);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0a1628]">
      {/* Phase label */}
      <p className="text-sm font-medium tracking-widest uppercase text-white/40">
        {!unlock ? "Locked" : finished ? "Unlocked" : "Unlocking\u2026"}
      </p>

      {/* Animation */}
      <UnlockAnimation
        key={instanceKey}
        unlock={unlock}
        onComplete={() => setFinished(true)}
      />

      {/* Status text */}
      <p className="text-base text-white/30">
        {finished
          ? "Investigation complete."
          : "Investigating best prices\u2026"}
      </p>

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/80"
      >
        Reset
      </button>
    </div>
  );
}
