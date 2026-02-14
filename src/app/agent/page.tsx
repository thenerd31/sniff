"use client";

import Navbar from "@/components/agent/Navbar";
import FloatingBubbles from "@/components/agent/FloatingBubbles";
import PhaseOrchestrator from "@/components/agent/PhaseOrchestrator";

export default function AgentPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-orange-300 via-orange-100 to-cream">
      <FloatingBubbles />
      <Navbar />
      <PhaseOrchestrator />
    </div>
  );
}
