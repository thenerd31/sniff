"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Globe,
  Lock,
  AlertTriangle,
  MessageSquare,
  Briefcase,
  User,
  ShoppingCart,
  Ticket,
  Mail,
  Search,
  Star,
  BookOpen,
  Building,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import type { EvidenceCard, CardSeverity, CardType } from "@/types";

/* ═══════════════════════════════════════════════════════════════
   PSEUDO DATA — streamed in with delays to simulate the backend
   ═══════════════════════════════════════════════════════════════ */

interface DemoEvent {
  delay: number;
  event: "card" | "connection" | "threat_score" | "done";
  data: any;
}

const DEMO_EVENTS: DemoEvent[] = [
  {
    delay: 1000,
    event: "card",
    data: {
      id: "card-1",
      type: "domain",
      severity: "critical",
      title: "Domain registered 6 days ago",
      detail:
        "Registered Feb 7, 2026 via NameCheap. Registrant country: Nigeria. Domain age < 30 days is a strong fraud indicator.",
      source: "WHOIS Lookup",
      confidence: 0.92,
      connections: [],
      metadata: {},
    },
  },
  {
    delay: 1400,
    event: "card",
    data: {
      id: "card-2",
      type: "ssl",
      severity: "critical",
      title: "SSL certificate mismatch",
      detail:
        "Certificate issued to *.cheaphost.xyz — a different domain. Strongly suggests phishing or impersonation.",
      source: "SSL Analysis",
      confidence: 0.95,
      connections: ["card-1"],
      metadata: {},
    },
  },
  {
    delay: 600,
    event: "connection",
    data: { from: "card-2", to: "card-1", label: "same infrastructure" },
  },
  {
    delay: 1200,
    event: "card",
    data: {
      id: "card-3",
      type: "scam_report",
      severity: "critical",
      title: "12 scam reports on Reddit",
      detail:
        'Multiple users in r/Scams report this domain. Top post: "Lost $200, never received product." — 847 upvotes.',
      source: "Reddit Search",
      confidence: 0.88,
      connections: ["card-1"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "card-3", to: "card-1", label: "reported domain" },
  },
  {
    delay: 1100,
    event: "card",
    data: {
      id: "card-4",
      type: "alert",
      severity: "warning",
      title: "No return policy found",
      detail:
        "No visible return or refund policy. Legitimate retailers are legally required to display this.",
      source: "Page Analysis",
      confidence: 0.78,
      connections: [],
      metadata: {},
    },
  },
  {
    delay: 1000,
    event: "card",
    data: {
      id: "card-5",
      type: "alert",
      severity: "warning",
      title: 'Fake urgency tactics detected',
      detail:
        'Countdown timer and "Only 2 left!" pressure language. Common social engineering tactics.',
      source: "Page Analysis",
      confidence: 0.82,
      connections: ["card-4"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "card-5", to: "card-4", label: "deceptive practices" },
  },
  {
    delay: 1000,
    event: "card",
    data: {
      id: "card-6",
      type: "domain",
      severity: "safe",
      title: "Google Safe Browsing: not flagged",
      detail:
        "Not yet in Google's database. New scam sites often haven't been reported — absence of flag ≠ safety.",
      source: "Google Safe Browsing",
      confidence: 0.6,
      connections: [],
      metadata: {},
    },
  },
  {
    delay: 1200,
    event: "card",
    data: {
      id: "card-7",
      type: "business",
      severity: "critical",
      title: "No business registration found",
      detail:
        '"LuxDeals Global Ltd" returns zero results in corporate registries. Likely a fictitious entity.',
      source: "Business Registry",
      confidence: 0.85,
      connections: ["card-1", "card-3"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "card-7", to: "card-1", label: "unregistered" },
  },
  {
    delay: 400,
    event: "connection",
    data: { from: "card-7", to: "card-3", label: "corroborates" },
  },
  {
    delay: 900,
    event: "card",
    data: {
      id: "card-8",
      type: "seller",
      severity: "warning",
      title: "Stock photos for team page",
      detail:
        "All 4 'team member' photos are Shutterstock stock images. No real team identified.",
      source: "Image Analysis",
      confidence: 0.9,
      connections: ["card-7"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "card-8", to: "card-7", label: "fake company" },
  },
  {
    delay: 1000,
    event: "threat_score",
    data: { score: 94 },
  },
  {
    delay: 600,
    event: "done",
    data: {
      summary:
        "High risk of fraud. Domain 6 days old, SSL mismatch, 12 Reddit reports, no business registration. Threat score: 94/100. DO NOT proceed.",
    },
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

const SEVERITY_COLORS: Record<CardSeverity, { bg: string; border: string; accent: string; text: string }> = {
  critical: { bg: "bg-red-500/8", border: "border-red-500/30", accent: "bg-red-500", text: "text-red-400" },
  warning:  { bg: "bg-yellow-500/8", border: "border-yellow-500/30", accent: "bg-yellow-500", text: "text-yellow-400" },
  info:     { bg: "bg-blue-500/8", border: "border-blue-500/30", accent: "bg-blue-500", text: "text-blue-400" },
  safe:     { bg: "bg-emerald-500/8", border: "border-emerald-500/30", accent: "bg-emerald-500", text: "text-emerald-400" },
};

const TYPE_ICONS: Record<CardType, React.FC<{ className?: string }>> = {
  domain: Globe,
  ssl: Lock,
  scam_report: MessageSquare,
  review_analysis: Star,
  price: ShoppingCart,
  seller: User,
  business: Building,
  alert: AlertTriangle,
  email: Mail,
  alternative: TrendingUp,
  coupon: Ticket,
};

function getGridPosition(index: number): { x: number; y: number } {
  const cols = 3;
  const spacingX = 380;
  const spacingY = 260;
  const col = index % cols;
  const row = Math.floor(index / cols);
  // Add jitter for organic feel
  const jitterX = (Math.sin(index * 7.3) * 30);
  const jitterY = (Math.cos(index * 5.1) * 20);
  return {
    x: col * spacingX + jitterX + 60,
    y: row * spacingY + jitterY + 60,
  };
}

/* ═══════════════════════════════════════════════════════════════
   EVIDENCE CARD NODE
   ═══════════════════════════════════════════════════════════════ */

function EvidenceCardNode({ data }: { data: EvidenceCard & { isNew: boolean } }) {
  const colors = SEVERITY_COLORS[data.severity];
  const TypeIcon = TYPE_ICONS[data.type] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.6,
      }}
      className={`relative w-[320px] rounded-2xl border ${colors.border} ${colors.bg} p-5 shadow-2xl backdrop-blur-sm`}
      style={{ background: "rgba(15, 20, 25, 0.92)" }}
    >
      {/* Glow effect for new cards */}
      {data.isNew && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className={`absolute inset-0 rounded-2xl ${colors.accent}/20 blur-xl`}
          style={{ zIndex: -1 }}
        />
      )}

      {/* Handles for edges */}
      <Handle type="target" position={Position.Left} className="!bg-white/20 !border-white/30 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-white/20 !border-white/30 !w-2 !h-2" />

      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.accent}/15`}>
          <TypeIcon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <span className="flex-1 truncate text-xs font-medium text-white/40">
          {data.source}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${colors.accent}/15 ${colors.text}`}>
          {data.severity}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-sm font-semibold text-white leading-snug">
        {data.title}
      </h3>

      {/* Detail */}
      <p className="mb-3 text-xs leading-relaxed text-white/50 line-clamp-3">
        {data.detail}
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.confidence * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${colors.accent}`}
          />
        </div>
        <span className="text-[10px] font-semibold text-white/40">
          {Math.round(data.confidence * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THREAT METER
   ═══════════════════════════════════════════════════════════════ */

function ThreatMeter({ score }: { score: number }) {
  const level =
    score < 25 ? "LOW RISK" : score < 50 ? "MODERATE" : score < 75 ? "HIGH RISK" : "CRITICAL";
  const color =
    score < 25 ? "bg-emerald-500" : score < 50 ? "bg-yellow-500" : score < 75 ? "bg-orange-500" : "bg-red-500";
  const textColor =
    score < 25 ? "text-emerald-400" : score < 50 ? "text-yellow-400" : score < 75 ? "text-orange-400" : "text-red-400";

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1419] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          Threat Level
        </span>
        <span className={`text-xs font-bold ${textColor}`}>{level}</span>
      </div>
      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full rounded-full ${color} ${score >= 75 ? "animate-pulse" : ""}`}
        />
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={score}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white"
        >
          {score}
        </motion.span>
        <span className="text-sm text-white/30">/100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTION PANEL
   ═══════════════════════════════════════════════════════════════ */

const ACTIONS = [
  { label: "Investigate Seller", icon: User, focus: "seller" },
  { label: "Analyze Reviews", icon: Star, focus: "reviews" },
  { label: "Check Business", icon: Building, focus: "business" },
  { label: "Find Alternatives", icon: TrendingUp, focus: "alternatives" },
  { label: "Price History", icon: ShoppingCart, focus: "price_history" },
] as const;

function ActionPanel({
  investigating,
  onAction,
}: {
  investigating: boolean;
  onAction: (focus: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="mb-1 text-xs font-medium uppercase tracking-wider text-white/30">
        Deepen Investigation
      </span>
      {ACTIONS.map((a) => (
        <button
          key={a.focus}
          onClick={() => onAction(a.focus)}
          disabled={investigating}
          className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm font-medium text-white/70 transition-all hover:border-coral/30 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <a.icon className="h-4 w-4 shrink-0 text-coral" />
          {a.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

const nodeTypes: NodeTypes = {
  evidenceCard: EvidenceCardNode,
};

export default function BoardPage() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url") || "https://www.example.com";

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [threatScore, setThreatScore] = useState(0);
  const [status, setStatus] = useState<"investigating" | "complete">("investigating");
  const [summary, setSummary] = useState("");
  const cardCountRef = useRef(0);
  const hasStarted = useRef(false);

  // Stream pseudo events with delays
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let cancelled = false;

    async function runDemo() {
      for (const evt of DEMO_EVENTS) {
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, evt.delay));
        if (cancelled) break;

        switch (evt.event) {
          case "card": {
            const card = evt.data as EvidenceCard;
            const pos = getGridPosition(cardCountRef.current);
            cardCountRef.current++;

            const newNode: Node = {
              id: card.id,
              type: "evidenceCard",
              position: pos,
              data: { ...card, isNew: true },
            };

            setNodes((prev) => [...prev, newNode]);

            // Remove "new" glow after 2s
            setTimeout(() => {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === card.id
                    ? { ...n, data: { ...n.data, isNew: false } }
                    : n
                )
              );
            }, 2000);
            break;
          }
          case "connection": {
            const conn = evt.data as { from: string; to: string; label?: string };
            const newEdge: Edge = {
              id: `${conn.from}-${conn.to}`,
              source: conn.from,
              target: conn.to,
              label: conn.label,
              animated: true,
              style: { stroke: "#ff6b4a", strokeWidth: 1.5 },
              labelStyle: { fill: "#ffffff80", fontSize: 10 },
            };
            setEdges((prev) => [...prev, newEdge]);
            break;
          }
          case "threat_score": {
            setThreatScore(evt.data.score);
            break;
          }
          case "done": {
            setStatus("complete");
            setSummary(evt.data.summary);
            break;
          }
        }
      }
    }

    runDemo();
    return () => {
      cancelled = true;
    };
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen flex-col bg-[#0a0e14]">
      {/* Top bar */}
      <header
        className="flex shrink-0 items-center gap-4 border-b border-white/10 px-6 py-3"
        style={{ backdropFilter: "blur(12px)", background: "rgba(10,14,20,0.9)" }}
      >
        <a
          href="/"
          className="flex items-center gap-2 text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <Shield className="h-5 w-5 text-coral" />
          <span className="text-sm font-semibold text-white">Sentinel</span>
        </a>

        <div className="mx-4 h-5 w-px bg-white/10" />

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
          <span className="truncate text-sm text-white/50">{targetUrl}</span>
        </div>

        <div className="flex items-center gap-3">
          {status === "investigating" ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-coral" />
              <span className="text-xs font-medium text-coral">Investigating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Complete</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* React Flow board */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            className="bg-[#0a0e14]"
          >
            <Background color="#ffffff08" gap={32} size={1} />
            <Controls
              className="!bg-[#0f1419] !border-white/10 !rounded-lg !shadow-xl [&>button]:!bg-[#0f1419] [&>button]:!border-white/10 [&>button]:!text-white/50 [&>button:hover]:!bg-white/10"
            />
          </ReactFlow>
        </div>

        {/* Right sidebar */}
        <aside className="flex w-[280px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-white/10 bg-[#0a0e14] p-5">
          <ThreatMeter score={threatScore} />

          <ActionPanel
            investigating={status === "investigating"}
            onAction={(focus) => {
              // Future: trigger deepen investigation
              console.log("Deepen:", focus);
            }}
          />

          {/* Summary */}
          <AnimatePresence>
            {summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-[#0f1419] p-4"
              >
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/30">
                  Verdict
                </span>
                <p className="text-xs leading-relaxed text-white/60">
                  {summary}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
