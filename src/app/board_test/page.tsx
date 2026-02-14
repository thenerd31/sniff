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
  ChevronRight,
  ShoppingBag,
  Sparkles,
  FileSearch,
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
  { delay: 400, event: "connection", data: { from: "hero", to: "card-2" } },
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
  { delay: 400, event: "connection", data: { from: "card-2", to: "card-3" } },
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
  { delay: 400, event: "connection", data: { from: "card-3", to: "card-4" } },
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
  { delay: 400, event: "connection", data: { from: "card-4", to: "card-5" } },
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
  { delay: 400, event: "connection", data: { from: "card-5", to: "card-6" } },
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
  { delay: 400, event: "connection", data: { from: "card-6", to: "card-7" } },
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
  { delay: 400, event: "connection", data: { from: "card-7", to: "card-8" } },
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

const SEVERITY_COLORS: Record<CardSeverity, { border: string; bg: string; accent: string; text: string; badge: string; glow: string }> = {
  critical: { border: "border-red-200", bg: "bg-red-50", accent: "bg-red-500", text: "text-red-600", badge: "bg-red-50 text-red-600 border-red-200", glow: "rgba(239,68,68,0.1)" },
  warning:  { border: "border-amber-200", bg: "bg-amber-50", accent: "bg-amber-500", text: "text-amber-600", badge: "bg-amber-50 text-amber-600 border-amber-200", glow: "rgba(245,158,11,0.1)" },
  info:     { border: "border-blue-200", bg: "bg-blue-50", accent: "bg-blue-500", text: "text-blue-600", badge: "bg-blue-50 text-blue-600 border-blue-200", glow: "rgba(59,130,246,0.1)" },
  safe:     { border: "border-emerald-200", bg: "bg-emerald-50", accent: "bg-emerald-500", text: "text-emerald-600", badge: "bg-emerald-50 text-emerald-600 border-emerald-200", glow: "rgba(16,185,129,0.1)" },
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

/* Horizontal linear positioning — all nodes on the same Y */
const NODE_SPACING_X = 380;
const NODE_Y = 0;

function getLinearPosition(index: number): { x: number; y: number } {
  return {
    x: (index + 1) * NODE_SPACING_X,
    y: NODE_Y,
  };
}

/* ═══════════════════════════════════════════════════════════════
   IMMERSIVE BACKGROUND — top half only
   ═══════════════════════════════════════════════════════════════ */

function BoardBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Animated mesh gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 25%, #FFEDD5 45%, #FFFFFF 65%, #FFF7ED 85%, #FFFFFF 100%)",
          backgroundSize: "400% 400%",
          animation: "mesh-shift 20s ease-in-out infinite",
        }}
      />

      {/* Glassmorphism orb — top-left */}
      <div
        className="absolute -top-[10%] -left-[8%] h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, rgba(255,237,213,0.08) 40%, transparent 70%)",
          animation: "orb-drift-1 16s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />

      {/* Glassmorphism orb — mid-right */}
      <div
        className="absolute top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.05) 0%, rgba(255,247,237,0.07) 40%, transparent 70%)",
          animation: "orb-drift-2 22s ease-in-out infinite",
          filter: "blur(80px)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO PRODUCT CARD NODE — first node in the chain
   ═══════════════════════════════════════════════════════════════ */

function HeroCardNode({ data }: { data: { url: string; threatScore: number; status: string; summary: string } }) {
  const isCritical = data.threatScore >= 75;
  const scoreColor = data.threatScore < 25
    ? "text-emerald-600"
    : data.threatScore < 50
    ? "text-amber-600"
    : data.threatScore < 75
    ? "text-orange-600"
    : "text-red-600";
  const barColor = data.threatScore < 25
    ? "bg-emerald-500"
    : data.threatScore < 50
    ? "bg-amber-500"
    : data.threatScore < 75
    ? "bg-brand"
    : "bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="w-[320px] rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
      style={{ backdropFilter: "blur(20px)" }}
    >
      <Handle type="source" position={Position.Right} className="!bg-brand/60 !border-brand/40 !w-3 !h-3" />

      {/* Header badge */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand">
          <ShoppingBag className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-foreground">
          Investigation
        </span>
      </div>

      {/* URL */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-surface px-3 py-2">
        <Globe className="h-3.5 w-3.5 shrink-0 text-subtle" />
        <span className="truncate text-xs text-muted">{data.url}</span>
      </div>

      {/* Threat score */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Threat Level</span>
          <span className={`text-xs font-bold ${scoreColor}`}>
            {data.threatScore > 0 ? `${data.threatScore}/100` : "—"}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
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
            className="rounded-xl border border-red-200 bg-red-50 p-3"
          >
            <span className="mb-1 block text-[10px] font-bold uppercase text-red-600">Verdict</span>
            <p className="text-[11px] leading-relaxed text-muted">{data.summary}</p>
          </motion.div>
        ) : data.status === "investigating" ? (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-surface p-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-brand" />
            <span className="text-xs text-subtle">Investigating...</span>
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
      initial={{ opacity: 0, scale: 0.3, x: 60 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`relative w-[280px] rounded-2xl border ${colors.border} bg-white/80 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)]`}
      style={{ backdropFilter: "blur(16px)" }}
    >
      {/* Glow on arrival */}
      {data.isNew && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.5 }}
          className="pointer-events-none absolute -inset-1 rounded-2xl blur-lg"
          style={{ background: colors.glow }}
        />
      )}

      <Handle type="target" position={Position.Left} className="!bg-brand/40 !border-brand/30 !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-brand/40 !border-brand/30 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}>
          <TypeIcon className={`h-3.5 w-3.5 ${colors.text}`} />
        </div>
        <span className="flex-1 truncate text-[10px] font-medium text-subtle">
          {data.source}
        </span>
        <span className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-bold uppercase ${colors.badge}`}>
          {data.severity}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-[13px] font-bold leading-snug text-foreground">
        {data.title}
      </h3>

      {/* Detail */}
      <p className="mb-2.5 text-[11px] leading-relaxed text-muted line-clamp-2">
        {data.detail}
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.confidence * 100}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${colors.accent}`}
          />
        </div>
        <span className="text-[10px] font-semibold text-subtle">
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
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white/70 shadow-[0_2px_20px_rgba(0,0,0,0.05)]" style={{ backdropFilter: "blur(20px)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/10">
          <Sparkles className="h-3 w-3 text-brand" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-foreground">
          Agent Thinking
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-amber-400" />
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2 flex gap-2"
            >
              <span className="shrink-0 font-mono text-[10px] text-subtle">
                {log.timestamp}
              </span>
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-brand/50" />
              <span
                className={`text-[11px] leading-relaxed ${
                  log.text.startsWith("✗") ? "font-bold text-red-600" : "text-muted"
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
    <div className="shrink-0 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-[0_2px_20px_rgba(0,0,0,0.05)]" style={{ backdropFilter: "blur(20px)" }}>
      <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-subtle">
        Dig Deeper
      </span>
      <div className="grid grid-cols-2 gap-2">
        {DIG_ACTIONS.map((a) => (
          <button
            key={a.focus}
            onClick={() => onAction(a.focus)}
            disabled={disabled}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/60 px-3 py-2.5 text-left text-[11px] font-semibold text-foreground transition-all hover:border-brand/40 hover:bg-brand/5 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
          >
            <a.icon className="h-3.5 w-3.5 shrink-0 text-brand" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS PLACEHOLDER (bottom half)
   ═══════════════════════════════════════════════════════════════ */

function ResultsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Warm gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #FFF7ED 30%, #FFFFFF 55%, #FFEDD5 80%, #FFFFFF 100%)",
          backgroundSize: "400% 400%",
          animation: "mesh-shift 24s ease-in-out infinite",
        }}
      />

      {/* Glassmorphism orb — bottom-right */}
      <div
        className="absolute -bottom-[15%] -right-[10%] h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.04) 0%, rgba(255,237,213,0.06) 40%, transparent 70%)",
          animation: "orb-drift-3 18s ease-in-out infinite",
          filter: "blur(70px)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />
    </div>
  );
}

function ResultsPanel({ status, summary }: { status: string; summary: string }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-8">
      <ResultsBackground />

      {status === "complete" && summary ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[720px]"
        >
          <div
            className="rounded-2xl border border-gray-200 bg-white/80 p-8 shadow-[0_8px_40px_rgba(0,0,0,0.07)]"
            style={{ backdropFilter: "blur(20px)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Investigation Complete</h3>
                <p className="text-xs" style={{ color: "#6B7280" }}>Final analysis and recommendations</p>
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
              <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{summary}</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            style={{ backdropFilter: "blur(16px)" }}
          >
            <FileSearch className="h-6 w-6 text-subtle" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>Agent Results</p>
            <p className="mt-1 text-xs" style={{ color: "#6B7280" }}>Results will appear here after the investigation is complete.</p>
          </div>
          {status === "investigating" && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" style={{ animationDelay: "0.2s" }} />
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" style={{ animationDelay: "0.4s" }} />
            </div>
          )}
        </div>
      )}
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
  const prevCardIdRef = useRef("hero");

  function addLog(text: string) {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev, { id: logIdRef.current++, text, timestamp: ts }]);
  }

  useEffect(() => {
    const t = setTimeout(() => setSidebarVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const heroNode: Node = {
      id: "hero",
      type: "heroCard",
      position: { x: 0, y: NODE_Y },
      data: { url: targetUrl, threatScore: 0, status: "investigating", summary: "" },
      draggable: true,
    };
    setNodes([heroNode]);
  }, [targetUrl, setNodes]);

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
            const pos = getLinearPosition(cardCountRef.current);
            cardCountRef.current++;
            addLog(`Evidence found: ${card.title}`);

            const newNode: Node = {
              id: card.id,
              type: "evidenceCard",
              position: pos,
              data: { ...card, isNew: true },
            };
            setNodes((prev) => [...prev, newNode]);

            // Chain edge: connect from previous card to this one
            const sourceId = prevCardIdRef.current;
            setEdges((prev) => [
              ...prev,
              {
                id: `${sourceId}-${card.id}`,
                source: sourceId,
                target: card.id,
                type: "smoothstep",
                animated: true,
                style: { stroke: "#FF6B00", strokeWidth: 1.5, strokeDasharray: "8 4" },
                labelStyle: { fill: "#4B5563", fontSize: 9 },
              },
            ]);
            prevCardIdRef.current = card.id;

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
            // Skip — we handle chaining in the card event
            break;
          }
          case "threat_score": {
            const score = evt.data.score;
            setThreatScore(score);
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
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* ── Fixed Top bar ── */}
      <header
        className="relative z-30 flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white/70 px-5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        style={{ backdropFilter: "blur(20px)" }}
      >
        <a href="/" className="flex items-center gap-2 text-muted transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand">
            <ShoppingBag className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground">Sentinel</span>
        </a>

        <div className="mx-3 h-5 w-px bg-gray-200" />

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white/60 px-3 py-1.5">
          <Search className="h-3 w-3 shrink-0 text-subtle" />
          <span className="truncate text-xs text-muted">{targetUrl}</span>
        </div>

        <div className="flex items-center gap-2">
          {status === "investigating" ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-brand" />
              <span className="text-[11px] font-semibold text-brand">INVESTIGATING</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold text-emerald-600">COMPLETE</span>
            </>
          )}
        </div>
      </header>

      {/* ── Body: Sidebar (full-height) + Right content (split) ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — full height, continuous column */}
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="relative z-20 flex w-[320px] shrink-0 flex-col gap-3 border-r border-gray-200 p-3"
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

        {/* Right content — vertically split 50/50 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* ── Top: React Flow canvas ── */}
          <div className="relative flex-1 overflow-hidden">
            <BoardBackground />

            <div className="relative z-10 h-full w-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 0.75 }}
                minZoom={0.1}
                maxZoom={1.2}
                proOptions={{ hideAttribution: true }}
                style={{ background: "transparent" }}
                panOnDrag
                zoomOnScroll
              >
                <Background color="#E5E7EB" gap={40} size={1} />
                <Controls
                  className="!bg-white/80 !border-gray-200 !rounded-2xl !shadow-[0_4px_24px_rgba(0,0,0,0.06)] [&>button]:!bg-white/80 [&>button]:!border-gray-200 [&>button]:!text-muted [&>button:hover]:!bg-surface [&>button:hover]:!text-foreground"
                />
              </ReactFlow>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="relative z-20 h-px w-full shrink-0 bg-gray-200" />

          {/* ── Bottom: Results ── */}
          <div className="relative flex-1 overflow-hidden">
            <ResultsPanel status={status} summary={summary} />
          </div>
        </div>
      </div>
    </div>
  );
}
