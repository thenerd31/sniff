"use client";

import { useEffect, useRef, useState } from "react";
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
  User,
  ShoppingCart,
  Ticket,
  Mail,
  Search,
  Star,
  Building,
  TrendingUp,
  ArrowLeft,
  Terminal,
  ChevronRight,
} from "lucide-react";
import type { EvidenceCard, CardSeverity, CardType } from "@/types";

/* ═══════════════════════════════════════════════════════════════
   PSEUDO DATA
   ═══════════════════════════════════════════════════════════════ */

interface DemoEvent {
  delay: number;
  event: "card" | "connection" | "threat_score" | "log" | "done";
  data: any;
}

const DEMO_EVENTS: DemoEvent[] = [
  { delay: 400, event: "log", data: { text: "Starting investigation..." } },
  { delay: 600, event: "log", data: { text: "Resolving domain WHOIS records..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-1",
      type: "domain",
      severity: "critical",
      title: "Domain registered 6 days ago",
      detail: "Registered Feb 7, 2026 via NameCheap. Registrant country: Nigeria. Domain age < 30 days is a strong fraud indicator.",
      source: "WHOIS Lookup",
      confidence: 0.92,
      connections: [],
      metadata: {},
    },
  },
  { delay: 500, event: "log", data: { text: "Analyzing SSL certificate chain..." } },
  {
    delay: 1000,
    event: "card",
    data: {
      id: "card-2",
      type: "ssl",
      severity: "critical",
      title: "SSL certificate mismatch",
      detail: "Certificate issued to *.cheaphost.xyz — a different domain. Strongly suggests phishing or impersonation.",
      source: "SSL Analysis",
      confidence: 0.95,
      connections: ["card-1"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-2", to: "card-1", label: "same infrastructure" } },
  { delay: 300, event: "log", data: { text: "Searching Reddit for scam reports..." } },
  { delay: 600, event: "log", data: { text: "Found 12 matching threads in r/Scams..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-3",
      type: "scam_report",
      severity: "critical",
      title: "12 scam reports on Reddit",
      detail: 'Multiple users in r/Scams report this domain. Top post: "Lost $200, never received product." — 847 upvotes.',
      source: "Reddit Search",
      confidence: 0.88,
      connections: ["card-1"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-3", to: "card-1", label: "reported domain" } },
  { delay: 300, event: "log", data: { text: "Scanning page for deceptive patterns..." } },
  {
    delay: 900,
    event: "card",
    data: {
      id: "card-4",
      type: "alert",
      severity: "warning",
      title: "No return policy found",
      detail: "No visible return or refund policy. Legitimate retailers are legally required to display this.",
      source: "Page Analysis",
      confidence: 0.78,
      connections: [],
      metadata: {},
    },
  },
  { delay: 400, event: "log", data: { text: "Detecting urgency manipulation tactics..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-5",
      type: "alert",
      severity: "warning",
      title: "Fake urgency tactics detected",
      detail: 'Countdown timer and "Only 2 left!" pressure language. Common social engineering tactics.',
      source: "Page Analysis",
      confidence: 0.82,
      connections: ["card-4"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-5", to: "card-4", label: "deceptive practices" } },
  { delay: 300, event: "log", data: { text: "Querying Google Safe Browsing API..." } },
  {
    delay: 700,
    event: "card",
    data: {
      id: "card-6",
      type: "domain",
      severity: "safe",
      title: "Google Safe Browsing: not flagged",
      detail: "Not yet in Google's database. New scam sites often haven't been reported — absence of flag ≠ safety.",
      source: "Google Safe Browsing",
      confidence: 0.6,
      connections: [],
      metadata: {},
    },
  },
  { delay: 300, event: "log", data: { text: "Searching corporate registries..." } },
  { delay: 500, event: "log", data: { text: 'Looking up "LuxDeals Global Ltd"...' } },
  {
    delay: 900,
    event: "card",
    data: {
      id: "card-7",
      type: "business",
      severity: "critical",
      title: "No business registration found",
      detail: '"LuxDeals Global Ltd" returns zero results in corporate registries. Likely a fictitious entity.',
      source: "Business Registry",
      confidence: 0.85,
      connections: ["card-1", "card-3"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-7", to: "card-1", label: "unregistered" } },
  { delay: 300, event: "connection", data: { from: "card-7", to: "card-3", label: "corroborates" } },
  { delay: 300, event: "log", data: { text: "Running reverse image search on team photos..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-8",
      type: "seller",
      severity: "warning",
      title: "Stock photos for team page",
      detail: "All 4 'team member' photos are Shutterstock stock images. No real team identified.",
      source: "Image Analysis",
      confidence: 0.9,
      connections: ["card-7"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-8", to: "card-7", label: "fake company" } },
  { delay: 300, event: "log", data: { text: "Calculating final threat score..." } },
  { delay: 800, event: "threat_score", data: { score: 94 } },
  { delay: 400, event: "log", data: { text: "✗ CRITICAL — threat score 94/100" } },
  {
    delay: 600,
    event: "done",
    data: {
      summary: "High risk of fraud. Domain 6 days old, SSL mismatch, 12 Reddit reports, no business registration. Threat score: 94/100. DO NOT proceed.",
    },
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

const SEVERITY_COLORS: Record<CardSeverity, { border: string; accent: string; text: string }> = {
  critical: { border: "border-red-500/40", accent: "bg-red-500", text: "text-red-400" },
  warning:  { border: "border-yellow-500/40", accent: "bg-yellow-500", text: "text-yellow-400" },
  info:     { border: "border-blue-500/40", accent: "bg-blue-500", text: "text-blue-400" },
  safe:     { border: "border-emerald-500/40", accent: "bg-emerald-500", text: "text-emerald-400" },
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
  // Hero card occupies top-left, so evidence cards start offset
  const cols = 3;
  const spacingX = 400;
  const spacingY = 280;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const jitterX = Math.sin(index * 7.3) * 25;
  const jitterY = Math.cos(index * 5.1) * 15;
  return {
    x: col * spacingX + jitterX + 420, // offset right from hero card
    y: row * spacingY + jitterY + 40,
  };
}

/* ═══════════════════════════════════════════════════════════════
   HERO PRODUCT CARD NODE — top-left summary
   ═══════════════════════════════════════════════════════════════ */

function HeroCardNode({ data }: { data: { url: string; threatScore: number; status: string; summary: string } }) {
  const isCritical = data.threatScore >= 75;
  const scoreColor = data.threatScore < 25
    ? "text-emerald-400"
    : data.threatScore < 50
    ? "text-yellow-400"
    : data.threatScore < 75
    ? "text-orange-400"
    : "text-red-400";
  const barColor = data.threatScore < 25
    ? "bg-emerald-500"
    : data.threatScore < 50
    ? "bg-yellow-500"
    : data.threatScore < 75
    ? "bg-orange-500"
    : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="w-[360px] rounded-2xl border border-zinc-700/60 bg-zinc-900/95 p-6 shadow-2xl"
    >
      <Handle type="source" position={Position.Right} className="!bg-red-500/60 !border-red-500/40 !w-3 !h-3" />

      {/* Header badge */}
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-red-400" />
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-red-400">
          Investigation Report
        </span>
      </div>

      {/* URL */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/60 px-3 py-2">
        <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <span className="truncate font-mono text-xs text-zinc-400">{data.url}</span>
      </div>

      {/* Threat score */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Threat Level</span>
          <span className={`font-mono text-xs font-bold ${scoreColor}`}>
            {data.threatScore > 0 ? `${data.threatScore}/100` : "—"}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.threatScore}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor} ${isCritical ? "animate-pulse" : ""}`}
          />
        </div>
      </div>

      {/* Verdict */}
      <AnimatePresence>
        {data.summary ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
          >
            <span className="mb-1 block font-mono text-[10px] font-bold uppercase text-red-400">Verdict</span>
            <p className="font-mono text-[11px] leading-relaxed text-zinc-400">{data.summary}</p>
          </motion.div>
        ) : data.status === "investigating" ? (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/40 p-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-xs text-zinc-500">Investigation in progress...</span>
          </div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVIDENCE CARD NODE
   ═══════════════════════════════════════════════════════════════ */

function EvidenceCardNode({ data }: { data: EvidenceCard & { isNew: boolean } }) {
  const colors = SEVERITY_COLORS[data.severity];
  const TypeIcon = TYPE_ICONS[data.type] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`relative w-[300px] rounded-xl border ${colors.border} bg-zinc-900/90 p-4 shadow-2xl`}
    >
      {/* Glow on arrival */}
      {data.isNew && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.5 }}
          className="pointer-events-none absolute -inset-1 rounded-xl blur-lg"
          style={{
            background:
              data.severity === "critical"
                ? "rgba(239,68,68,0.15)"
                : data.severity === "warning"
                ? "rgba(234,179,8,0.12)"
                : data.severity === "safe"
                ? "rgba(16,185,129,0.12)"
                : "rgba(59,130,246,0.12)",
          }}
        />
      )}

      <Handle type="target" position={Position.Left} className="!bg-red-500/40 !border-red-500/30 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-red-500/40 !border-red-500/30 !w-2 !h-2" />

      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded ${colors.accent}/10`}>
          <TypeIcon className={`h-3.5 w-3.5 ${colors.text}`} />
        </div>
        <span className="flex-1 truncate font-mono text-[10px] text-zinc-500">
          {data.source}
        </span>
        <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${colors.border} ${colors.text}`}>
          {data.severity}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-[13px] font-semibold leading-snug text-zinc-100">
        {data.title}
      </h3>

      {/* Detail */}
      <p className="mb-3 font-mono text-[11px] leading-relaxed text-zinc-500 line-clamp-3">
        {data.detail}
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.confidence * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${colors.accent}`}
          />
        </div>
        <span className="font-mono text-[9px] font-semibold text-zinc-600">
          {Math.round(data.confidence * 100)}%
        </span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AGENT THINKING LOG
   ═══════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: number;
  text: string;
  timestamp: string;
}

function AgentLog({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-black/40">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <Terminal className="h-3.5 w-3.5 text-red-500" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Agent Thinking
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500/60" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
          <div className="h-2 w-2 rounded-full bg-emerald-500/60" />
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-1.5 flex gap-2"
            >
              <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                {log.timestamp}
              </span>
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-red-500/60" />
              <span
                className={`font-mono text-[11px] leading-relaxed ${
                  log.text.startsWith("✗") ? "text-red-400 font-bold" : "text-zinc-400"
                }`}
              >
                {log.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIG DEEPER PANEL
   ═══════════════════════════════════════════════════════════════ */

const DIG_ACTIONS = [
  { label: "Check Reviews", icon: Star, focus: "reviews" },
  { label: "Seller History", icon: User, focus: "seller" },
  { label: "Price History", icon: ShoppingCart, focus: "price_history" },
  { label: "Find Alternatives", icon: TrendingUp, focus: "alternatives" },
  { label: "Business Records", icon: Building, focus: "business" },
] as const;

function DigDeeperPanel({
  disabled,
  onAction,
}: {
  disabled: boolean;
  onAction: (focus: string) => void;
}) {
  return (
    <div className="shrink-0 border-t border-zinc-800 p-4">
      <span className="mb-3 block font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        Dig Deeper
      </span>
      <div className="grid grid-cols-2 gap-2">
        {DIG_ACTIONS.map((a) => (
          <button
            key={a.focus}
            onClick={() => onAction(a.focus)}
            disabled={disabled}
            className="flex items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-2.5 text-left font-mono text-[11px] font-medium text-zinc-300 transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <a.icon className="h-3.5 w-3.5 shrink-0 text-red-400" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

const nodeTypes: NodeTypes = {
  evidenceCard: EvidenceCardNode,
  heroCard: HeroCardNode,
};

export default function BoardPage() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url") || "https://www.example.com";

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [threatScore, setThreatScore] = useState(0);
  const [status, setStatus] = useState<"investigating" | "complete">("investigating");
  const [summary, setSummary] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const cardCountRef = useRef(0);
  const logIdRef = useRef(0);
  const hasStarted = useRef(false);

  function addLog(text: string) {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev, { id: logIdRef.current++, text, timestamp: ts }]);
  }

  // Slide sidebar in on mount
  useEffect(() => {
    const t = setTimeout(() => setSidebarVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Place hero card immediately
  useEffect(() => {
    const heroNode: Node = {
      id: "hero",
      type: "heroCard",
      position: { x: 0, y: 60 },
      data: { url: targetUrl, threatScore: 0, status: "investigating", summary: "" },
      draggable: true,
    };
    setNodes([heroNode]);
  }, [targetUrl, setNodes]);

  // Stream pseudo events
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
          case "log": {
            addLog(evt.data.text);
            break;
          }
          case "card": {
            const card = evt.data as EvidenceCard;
            const pos = getGridPosition(cardCountRef.current);
            cardCountRef.current++;
            addLog(`Evidence found: ${card.title}`);

            const newNode: Node = {
              id: card.id,
              type: "evidenceCard",
              position: pos,
              data: { ...card, isNew: true },
            };
            setNodes((prev) => [...prev, newNode]);

            // Also connect to hero card if it's the first few
            if (cardCountRef.current <= 3) {
              setEdges((prev) => [
                ...prev,
                {
                  id: `hero-${card.id}`,
                  source: "hero",
                  target: card.id,
                  animated: true,
                  style: { stroke: "#dc2626", strokeWidth: 1.5, strokeDasharray: "8 4" },
                  labelStyle: { fill: "#ffffff50", fontSize: 9, fontFamily: "monospace" },
                  label: "traced",
                },
              ]);
            }

            setTimeout(() => {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === card.id ? { ...n, data: { ...n.data, isNew: false } } : n
                )
              );
            }, 2500);
            break;
          }
          case "connection": {
            const conn = evt.data as { from: string; to: string; label?: string };
            setEdges((prev) => [
              ...prev,
              {
                id: `${conn.from}-${conn.to}`,
                source: conn.from,
                target: conn.to,
                label: conn.label,
                animated: true,
                style: { stroke: "#dc2626", strokeWidth: 1.5 },
                labelStyle: { fill: "#ffffff50", fontSize: 9, fontFamily: "monospace" },
              },
            ]);
            break;
          }
          case "threat_score": {
            const score = evt.data.score;
            setThreatScore(score);
            // Update hero card
            setNodes((prev) =>
              prev.map((n) =>
                n.id === "hero" ? { ...n, data: { ...n.data, threatScore: score } } : n
              )
            );
            break;
          }
          case "done": {
            setStatus("complete");
            setSummary(evt.data.summary);
            addLog("Investigation complete.");
            setNodes((prev) =>
              prev.map((n) =>
                n.id === "hero"
                  ? { ...n, data: { ...n.data, status: "complete", summary: evt.data.summary } }
                  : n
              )
            );
            break;
          }
        }
      }
    }

    runDemo();
    return () => { cancelled = true; };
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen flex-col bg-zinc-950">
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-5 py-2.5">
        <a href="/" className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          <Shield className="h-5 w-5 text-red-500" />
          <span className="font-mono text-sm font-bold text-zinc-100">SENTINEL</span>
        </a>

        <div className="mx-3 h-5 w-px bg-zinc-800" />

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-3 py-1.5">
          <Search className="h-3 w-3 shrink-0 text-zinc-600" />
          <span className="truncate font-mono text-xs text-zinc-500">{targetUrl}</span>
        </div>

        <div className="flex items-center gap-2">
          {status === "investigating" ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="font-mono text-[11px] font-medium text-red-400">INVESTIGATING</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px] font-medium text-emerald-400">COMPLETE</span>
            </>
          )}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Agent panel */}
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="flex w-[320px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950"
            >
              <AgentLog logs={logs} />
              <DigDeeperPanel
                disabled={status === "investigating"}
                onAction={(focus) => {
                  addLog(`Deepening investigation: ${focus}...`);
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.4, maxZoom: 0.9 }}
            minZoom={0.15}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
            className="bg-zinc-950"
          >
            <Background color="#27272a" gap={40} size={1} />
            <Controls
              className="!bg-zinc-900 !border-zinc-800 !rounded-lg !shadow-xl [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-500 [&>button:hover]:!bg-zinc-800 [&>button:hover]:!text-zinc-300"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
