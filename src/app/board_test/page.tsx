"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  Shield,
  Skull,
  Heart,
} from "lucide-react";
import type { EvidenceCard, CardSeverity, CardType, ProductResult, FraudCheck, ProductVerdict } from "@/types";
import { useResultsStore } from "@/stores/resultsStore";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import "@/styles/results.css";

/* ═══════════════════════════════════════════════════════════════
   MOCK PRODUCT DATA (for results store seeding)
   ═══════════════════════════════════════════════════════════════ */

const mockProducts: ProductResult[] = [
  { id: "p1", title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones", price: 278.0, currency: "USD", retailer: "Amazon", domain: "amazon.com", url: "https://amazon.com/dp/B09XS7JWHH", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 4.7, reviewCount: 12453, snippet: "Industry-leading noise cancellation with Auto NC Optimizer" },
  { id: "p2", title: "Sony WH-1000XM5 Headphones - Silver", price: 295.0, currency: "USD", retailer: "Best Buy", domain: "bestbuy.com", url: "https://bestbuy.com/site/sony-wh1000xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 4.6, reviewCount: 8723, snippet: "Premium wireless over-ear headphones with 30hr battery" },
  { id: "p3", title: "Sony WH-1000XM5 Noise Cancelling", price: 248.0, currency: "USD", retailer: "Walmart", domain: "walmart.com", url: "https://walmart.com/ip/sony-wh1000xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 4.5, reviewCount: 3421, snippet: "Exceptional noise cancellation for an immersive experience" },
  { id: "p4", title: "Sony XM5 Headphones", price: 189.0, currency: "USD", retailer: "AliExpress", domain: "aliexpress.com", url: "https://aliexpress.com/item/sony-xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 4.1, reviewCount: 567, snippet: "Fast shipping from verified seller" },
  { id: "p5", title: "WH-1000XM5 Sony Headphone", price: 99.99, currency: "USD", retailer: "Unknown Store", domain: "cheapdeals.shop", url: "https://cheapdeals.shop/sony-xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 5.0, reviewCount: 12, snippet: "BEST DEAL - 70% OFF LIMITED TIME" },
  { id: "p6", title: "Sony WH1000XM5 Premium Headphones", price: 269.0, currency: "USD", retailer: "Target", domain: "target.com", url: "https://target.com/p/sony-wh1000xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 4.6, reviewCount: 2134, snippet: "Free shipping on orders over $35" },
  { id: "p7", title: "Sony WH-1000XM5", price: 259.0, currency: "USD", retailer: "B&H Photo", domain: "bhphotovideo.com", url: "https://bhphotovideo.com/c/product/sony-xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 4.7, reviewCount: 1876, snippet: "Professional audio quality headphones" },
  { id: "p8", title: "Sony XM5 Wireless Headphone Set", price: 145.0, currency: "USD", retailer: "DHGate", domain: "dhgate.com", url: "https://dhgate.com/product/sony-xm5", imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg", rating: 3.8, reviewCount: 89, snippet: "Wholesale price direct from manufacturer" },
];

const mockChecks: Record<string, FraudCheck[]> = {
  p1: [
    { name: "Retailer Reputation", status: "passed", severity: 0, detail: "Amazon is a verified major retailer" },
    { name: "Safety Database", status: "passed", severity: 0, detail: "No fraud reports found" },
    { name: "Community Sentiment", status: "passed", severity: 0.1, detail: "Generally positive reviews across platforms" },
    { name: "Seller Verification", status: "passed", severity: 0, detail: "Verified Amazon seller" },
  ],
  p4: [
    { name: "Retailer Reputation", status: "warning", severity: 0.4, detail: "AliExpress has mixed reliability" },
    { name: "Safety Database", status: "passed", severity: 0.1, detail: "No direct fraud reports" },
    { name: "Community Sentiment", status: "warning", severity: 0.35, detail: "Some reports of counterfeit products" },
    { name: "Seller Verification", status: "warning", severity: 0.3, detail: "Seller account is 6 months old" },
  ],
  p5: [
    { name: "Retailer Reputation", status: "failed", severity: 0.95, detail: "Unknown store with no track record" },
    { name: "Safety Database", status: "failed", severity: 0.9, detail: "Domain flagged in 3 scam databases" },
    { name: "Community Sentiment", status: "failed", severity: 0.85, detail: "Multiple Reddit reports of non-delivery" },
    { name: "Seller Verification", status: "failed", severity: 0.95, detail: "No business registration found" },
  ],
  p8: [
    { name: "Retailer Reputation", status: "warning", severity: 0.5, detail: "DHGate has counterfeit concerns" },
    { name: "Safety Database", status: "warning", severity: 0.4, detail: "Some reports of IP violations" },
    { name: "Community Sentiment", status: "warning", severity: 0.45, detail: "Mixed reviews, some quality issues" },
    { name: "Seller Verification", status: "warning", severity: 0.35, detail: "Seller partially verified" },
  ],
};

const mockVerdicts: Record<string, { verdict: ProductVerdict; trustScore: number }> = {
  p1: { verdict: "trusted", trustScore: 96 },
  p2: { verdict: "trusted", trustScore: 92 },
  p3: { verdict: "trusted", trustScore: 90 },
  p4: { verdict: "caution", trustScore: 58 },
  p5: { verdict: "danger", trustScore: 5 },
  p6: { verdict: "trusted", trustScore: 88 },
  p7: { verdict: "trusted", trustScore: 91 },
  p8: { verdict: "caution", trustScore: 42 },
};

async function seedResultsStore() {
  const store = useResultsStore.getState();
  store.setPhase("hidden");

  for (const p of mockProducts) {
    await new Promise((r) => setTimeout(r, 80));
    store.addProduct(p);

    const checks = mockChecks[p.id];
    if (checks) {
      for (const check of checks) {
        await new Promise((r) => setTimeout(r, 40));
        store.addFraudCheck(p.id, check);
      }
    }

    const v = mockVerdicts[p.id];
    if (v) {
      await new Promise((r) => setTimeout(r, 60));
      store.setVerdict(p.id, v.verdict, v.trustScore);
    }
  }

  await new Promise((r) => setTimeout(r, 200));
  store.setBestPick("p1");
  store.setPhase("two-columns");
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL FONT HELPER
   ═══════════════════════════════════════════════════════════════ */

const PIXEL_FONT = "'Press Start 2P', monospace";

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
  { delay: 400, event: "log", data: { text: "!! CRITICAL — threat score 94/100" } },
  {
    delay: 600,
    event: "done",
    data: {
      summary: "High risk of fraud. Domain 6 days old, SSL mismatch, 12 Reddit reports, no business registration. Threat score: 94/100. DO NOT proceed.",
    },
  },
];

/* ═══════════════════════════════════════════════════════════════
   PIXEL SEVERITY COLORS
   ═══════════════════════════════════════════════════════════════ */

const SEVERITY_COLORS: Record<CardSeverity, { border: string; bg: string; accent: string; text: string; barColor: string; label: string }> = {
  critical: { border: "#8B0000", bg: "#FFF0F0", accent: "#FF0000", text: "#8B0000", barColor: "#FF0000", label: "CRITICAL" },
  warning:  { border: "#8B6914", bg: "#FFFDE0", accent: "#FFD700", text: "#8B6914", barColor: "#FFD700", label: "WARNING" },
  info:     { border: "#00008B", bg: "#F0F0FF", accent: "#4444FF", text: "#00008B", barColor: "#4444FF", label: "INFO" },
  safe:     { border: "#006400", bg: "#F0FFF0", accent: "#00CC00", text: "#006400", barColor: "#00CC00", label: "SAFE" },
};

const TYPE_ICONS: Record<CardType, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
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

/* ═══════════════════════════════════════════════════════════════
   CLOUD DATA TYPE
   ═══════════════════════════════════════════════════════════════ */

interface CloudData {
  id: string;
  type: "hero" | "evidence";
  url?: string;
  threatScore?: number;
  status?: "investigating" | "complete";
  summary?: string;
  card?: EvidenceCard & { isNew: boolean };
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL ART DOG SPRITES (inline SVG — 32x24 pixel art)
   ═══════════════════════════════════════════════════════════════ */

function PixelDog({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg
      width="64"
      height="48"
      viewBox="0 0 32 24"
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
    >
      {/* Body */}
      <rect x="8" y="10" width="14" height="8" fill="#D4A574" />
      <rect x="7" y="11" width="1" height="6" fill="#C49464" />
      <rect x="22" y="11" width="1" height="5" fill="#C49464" />
      {/* Head */}
      <rect x="20" y="5" width="8" height="7" fill="#D4A574" />
      <rect x="19" y="6" width="1" height="5" fill="#C49464" />
      <rect x="28" y="6" width="1" height="4" fill="#C49464" />
      {/* Ears */}
      <rect x="21" y="3" width="3" height="3" fill="#8B6914" />
      <rect x="25" y="3" width="3" height="3" fill="#8B6914" />
      {/* Eyes */}
      <rect x="24" y="7" width="2" height="2" fill="#1A1A1A" />
      <rect x="25" y="7" width="1" height="1" fill="#FFFFFF" />
      {/* Nose */}
      <rect x="27" y="9" width="2" height="2" fill="#1A1A1A" />
      {/* Tail */}
      <rect x="5" y="8" width="3" height="2" fill="#8B6914" />
      <rect x="4" y="6" width="2" height="3" fill="#8B6914" />
      {/* Front legs */}
      <rect x="18" y="18" width="3" height="5" fill="#C49464" />
      <rect x="18" y="23" width="3" height="1" fill="#8B6914" />
      {/* Back legs */}
      <rect x="9" y="18" width="3" height="5" fill="#C49464" />
      <rect x="9" y="23" width="3" height="1" fill="#8B6914" />
      {/* Belly spot */}
      <rect x="12" y="14" width="4" height="3" fill="#E8C49C" />
      {/* Collar */}
      <rect x="19" y="11" width="4" height="2" fill="#FF0000" />
      <rect x="20" y="12" width="1" height="1" fill="#FFD700" />
    </svg>
  );
}

function PixelDogIdle({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg
      width="64"
      height="48"
      viewBox="0 0 32 24"
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
    >
      {/* Body */}
      <rect x="8" y="10" width="14" height="8" fill="#D4A574" />
      <rect x="7" y="11" width="1" height="6" fill="#C49464" />
      <rect x="22" y="11" width="1" height="5" fill="#C49464" />
      {/* Head — tilted down for sniffing */}
      <rect x="20" y="7" width="8" height="7" fill="#D4A574" />
      <rect x="19" y="8" width="1" height="5" fill="#C49464" />
      <rect x="28" y="8" width="1" height="4" fill="#C49464" />
      {/* Ear */}
      <rect x="21" y="5" width="3" height="3" fill="#8B6914" />
      <rect x="25" y="5" width="3" height="3" fill="#8B6914" />
      {/* Eye — squinting */}
      <rect x="24" y="9" width="2" height="1" fill="#1A1A1A" />
      {/* Nose */}
      <rect x="27" y="12" width="2" height="2" fill="#1A1A1A" />
      {/* Sniff lines */}
      <rect x="29" y="11" width="1" height="1" fill="#8B691480" />
      <rect x="30" y="10" width="1" height="1" fill="#8B691440" />
      {/* Tail — up/wagging */}
      <rect x="5" y="6" width="3" height="2" fill="#8B6914" />
      <rect x="4" y="4" width="2" height="3" fill="#8B6914" />
      <rect x="3" y="3" width="2" height="2" fill="#8B6914" />
      {/* Front legs */}
      <rect x="18" y="18" width="3" height="5" fill="#C49464" />
      <rect x="18" y="23" width="3" height="1" fill="#8B6914" />
      {/* Back legs */}
      <rect x="9" y="18" width="3" height="5" fill="#C49464" />
      <rect x="9" y="23" width="3" height="1" fill="#8B6914" />
      {/* Belly spot */}
      <rect x="12" y="14" width="4" height="3" fill="#E8C49C" />
      {/* Collar */}
      <rect x="19" y="13" width="4" height="2" fill="#FF0000" />
      <rect x="20" y="14" width="1" height="1" fill="#FFD700" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SEGMENTED PIXEL BAR (HP / Power bar)
   ═══════════════════════════════════════════════════════════════ */

function PixelBar({ value, maxValue = 100, color, height = 12 }: { value: number; maxValue?: number; color: string; height?: number }) {
  const segments = 10;
  const filledSegments = Math.round((value / maxValue) * segments);

  return (
    <div
      className="flex gap-[2px]"
      style={{ height, border: "2px solid #1A1A1A", padding: 2, background: "#2A2A2A" }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i < filledSegments ? color : "#444",
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL DIALOGUE BOX (shared frame for all cards)
   ═══════════════════════════════════════════════════════════════ */

function PixelFrame({ children, className, borderColor = "#1A1A1A" }: { children: React.ReactNode; className?: string; borderColor?: string }) {
  return (
    <div
      className={className}
      style={{
        border: `4px solid ${borderColor}`,
        borderRadius: 0,
        background: "#FFF8E8",
        boxShadow: `4px 4px 0 ${borderColor}`,
        imageRendering: "pixelated",
        position: "relative",
      }}
    >
      {/* Inner border for dialogue-box feel */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          border: `2px solid ${borderColor}40`,
          pointerEvents: "none",
        }}
      />
      <div className="flex flex-col" style={{ position: "relative", zIndex: 1, minHeight: 0, flex: "1 1 0%" }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKY + GRASS BACKGROUND (top half)
   ═══════════════════════════════════════════════════════════════ */

function PixelTree({ x, scale = 1 }: { x: string; scale?: number }) {
  const w = 48 * scale;
  const h = 72 * scale;
  return (
    <div className="absolute" style={{ left: x, bottom: "4%", transform: `translateX(-50%)` }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 16 24"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Trunk */}
        <rect x="6" y="16" width="4" height="8" fill="#8B5E3C" />
        <rect x="7" y="16" width="2" height="8" fill="#6B4226" />
        {/* Foliage — bottom layer */}
        <rect x="2" y="10" width="12" height="6" fill="#3D7A2E" />
        {/* Foliage — middle layer */}
        <rect x="3" y="6" width="10" height="5" fill="#4A8C34" />
        {/* Foliage — top layer */}
        <rect x="5" y="2" width="6" height="5" fill="#5EAA42" />
        {/* Foliage — tip */}
        <rect x="6" y="0" width="4" height="3" fill="#6BC850" />
        {/* Highlight pixels */}
        <rect x="4" y="8" width="2" height="2" fill="#5EAA42" />
        <rect x="9" y="11" width="2" height="2" fill="#4A8C34" />
        <rect x="6" y="4" width="2" height="2" fill="#6BC850" />
      </svg>
    </div>
  );
}

function GameBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sky gradient — grass starts at ~85% */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #87CEEB 0%, #B0E0FF 60%, #C8E6B0 82%, #98D982 86%, #5EAA42 92%, #4A8C34 100%)",
        }}
      />
      {/* Pixel clouds */}
      <div className="absolute left-[10%] top-[8%]" style={{ opacity: 0.7 }}>
        <svg width="80" height="32" viewBox="0 0 20 8" style={{ imageRendering: "pixelated" }}>
          <rect x="4" y="4" width="12" height="4" fill="white" />
          <rect x="2" y="4" width="2" height="2" fill="white" />
          <rect x="16" y="4" width="2" height="2" fill="white" />
          <rect x="6" y="2" width="4" height="2" fill="white" />
          <rect x="12" y="2" width="3" height="2" fill="white" />
          <rect x="8" y="0" width="3" height="2" fill="white" />
        </svg>
      </div>
      <div className="absolute right-[20%] top-[14%]" style={{ opacity: 0.5 }}>
        <svg width="60" height="24" viewBox="0 0 15 6" style={{ imageRendering: "pixelated" }}>
          <rect x="2" y="3" width="11" height="3" fill="white" />
          <rect x="4" y="1" width="3" height="2" fill="white" />
          <rect x="9" y="1" width="2" height="2" fill="white" />
        </svg>
      </div>
      <div className="absolute left-[55%] top-[5%]" style={{ opacity: 0.6 }}>
        <svg width="48" height="20" viewBox="0 0 12 5" style={{ imageRendering: "pixelated" }}>
          <rect x="1" y="2" width="10" height="3" fill="white" />
          <rect x="3" y="0" width="4" height="2" fill="white" />
        </svg>
      </div>

      {/* Pixel trees */}
      <PixelTree x="5%" scale={1.2} />
      <PixelTree x="15%" scale={0.9} />
      <PixelTree x="30%" scale={1.4} />
      <PixelTree x="70%" scale={1.1} />
      <PixelTree x="85%" scale={1.3} />
      <PixelTree x="95%" scale={0.8} />

      {/* Grass line detail — only bottom 14% */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: "14%",
          backgroundImage: "repeating-linear-gradient(90deg, #4A8C34 0px, #4A8C34 8px, #5EAA42 8px, #5EAA42 16px)",
          imageRendering: "pixelated",
        }}
      />
      {/* Ground pixel pattern */}
      <svg className="absolute bottom-0 left-0 w-full" height="40" style={{ imageRendering: "pixelated" }}>
        <pattern id="grass-tufts" x="0" y="0" width="16" height="8" patternUnits="userSpaceOnUse">
          <rect x="2" y="0" width="2" height="4" fill="#3D7A2E" />
          <rect x="10" y="2" width="2" height="3" fill="#3D7A2E" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grass-tufts)" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO CARD CONTENT — "Quest Card" style (no React Flow Handle)
   ═══════════════════════════════════════════════════════════════ */

function HeroCardContent({ url, threatScore, status, summary }: { url: string; threatScore: number; status: string; summary: string }) {
  const barColor = threatScore < 25
    ? "#00CC00"
    : threatScore < 50
    ? "#FFD700"
    : threatScore < 75
    ? "#FF8800"
    : "#FF0000";

  return (
    <>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-5 w-5" style={{ color: "#8B6914" }} />
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#1A1A1A", letterSpacing: 1 }}>
          QUEST TARGET
        </span>
      </div>

      {/* URL in pixel box */}
      <div
        className="mb-3 flex items-center gap-2 px-3 py-2"
        style={{ border: "2px solid #1A1A1A", background: "#FFF0D4" }}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: "#8B6914" }} />
        <span
          className="truncate"
          style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#4A3A2A" }}
        >
          {url}
        </span>
      </div>

      {/* Threat score — HP bar style */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>
            THREAT LV
          </span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: barColor, fontWeight: "bold" }}>
            {threatScore > 0 ? `${threatScore}/100` : "---"}
          </span>
        </div>
        <PixelBar value={threatScore} color={barColor} />
      </div>

      {/* Verdict */}
      <AnimatePresence>
        {summary ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <div style={{ border: "3px solid #8B0000", background: "#FFF0F0", padding: 10 }}>
              <div className="mb-1 flex items-center gap-1.5">
                <Skull className="h-3.5 w-3.5" style={{ color: "#8B0000" }} />
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B0000" }}>VERDICT</span>
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, lineHeight: 1.8, color: "#4A3A2A" }}>
                {summary}
              </p>
            </div>
          </motion.div>
        ) : status === "investigating" ? (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ border: "2px solid #8B6914", background: "#FFF8E0" }}
          >
            <div
              className="h-2 w-2"
              style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite" }}
            />
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>
              SNIFFING...
            </span>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVIDENCE CARD CONTENT — game dialogue box (no React Flow Handle)
   ═══════════════════════════════════════════════════════════════ */

function EvidenceCardContent({ card }: { card: EvidenceCard & { isNew: boolean } }) {
  const colors = SEVERITY_COLORS[card.severity];
  const TypeIcon = TYPE_ICONS[card.type] || AlertTriangle;

  return (
    <>
      {/* Flash on arrival */}
      {card.isNew && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="pointer-events-none absolute inset-0"
          style={{ background: colors.accent + "30", zIndex: 50 }}
        />
      )}

      {/* Product image + header row */}
      <div className="mb-2 flex gap-2">
        {card.metadata?.imageUrl && (
          <div
            className="shrink-0 overflow-hidden"
            style={{
              width: 52,
              height: 52,
              border: "2px solid #D4C4A0",
              imageRendering: "auto",
              background: "#FFFFFF",
            }}
          >
            <img
              src={card.metadata.imageUrl}
              alt=""
              className="h-full w-full object-contain"
              style={{ imageRendering: "auto" }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-1 flex items-center gap-2">
            <TypeIcon className="h-3 w-3" style={{ color: colors.text }} />
            <span className="flex-1 truncate" style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>
              {card.source}
            </span>
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 5,
                color: colors.text,
                border: `2px solid ${colors.border}`,
                background: colors.bg,
                padding: "1px 4px",
              }}
            >
              {colors.label}
            </span>
          </div>

          {/* Title */}
          <h3
            className="mb-0.5"
            style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 1.5, color: "#1A1A1A" }}
          >
            {card.title}
          </h3>
        </div>
      </div>

      {/* Detail */}
      <p
        className="mb-2 line-clamp-2"
        style={{ fontFamily: PIXEL_FONT, fontSize: 6, lineHeight: 1.8, color: "#4A3A2A" }}
      >
        {card.detail}
      </p>

      {/* Confidence — power bar */}
      <div className="flex items-center gap-2">
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>PWR</span>
        <div className="flex-1">
          <PixelBar value={card.confidence * 100} color={colors.barColor} height={8} />
        </div>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: colors.text }}>
          {Math.round(card.confidence * 100)}%
        </span>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLOUD NODE — pixel-art cloud wrapper for card content
   ═══════════════════════════════════════════════════════════════ */

function CloudNode({ cloud, index }: { cloud: CloudData; index: number }) {
  const isHero = cloud.type === "hero";
  const borderColor = isHero
    ? "#1A1A1A"
    : cloud.card
    ? SEVERITY_COLORS[cloud.card.severity].border
    : "#1A1A1A";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="shrink-0"
    >
      {/* Cloud shape — main body + bumps on top */}
      <div className="relative" style={{ width: isHero ? 320 : 280 }}>
        {/* Top bump — left */}
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "16%",
            width: "32%",
            height: 18,
            background: "#FFF8E8",
            borderTop: `4px solid ${borderColor}`,
            borderLeft: `4px solid ${borderColor}`,
            borderRight: `4px solid ${borderColor}`,
            borderBottom: `4px solid #FFF8E8`,
            imageRendering: "pixelated",
            zIndex: 1,
          }}
        />
        {/* Top bump — right */}
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "54%",
            width: "24%",
            height: 14,
            background: "#FFF8E8",
            borderTop: `4px solid ${borderColor}`,
            borderLeft: `4px solid ${borderColor}`,
            borderRight: `4px solid ${borderColor}`,
            borderBottom: `4px solid #FFF8E8`,
            imageRendering: "pixelated",
            zIndex: 1,
          }}
        />

        {/* Main cloud body */}
        <div
          className="relative p-3"
          style={{
            background: "#FFF8E8",
            border: `4px solid ${borderColor}`,
            boxShadow: `4px 4px 0 ${borderColor}`,
            imageRendering: "pixelated",
            zIndex: 2,
          }}
        >
          {/* Inner border for dialogue-box feel */}
          <div
            style={{
              position: "absolute",
              inset: 3,
              border: `2px solid ${borderColor}40`,
              pointerEvents: "none",
            }}
          />
          <div className="relative" style={{ zIndex: 1 }}>
            {isHero ? (
              <HeroCardContent
                url={cloud.url!}
                threatScore={cloud.threatScore!}
                status={cloud.status!}
                summary={cloud.summary!}
              />
            ) : (
              <EvidenceCardContent card={cloud.card!} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHED CONNECTOR between clouds
   ═══════════════════════════════════════════════════════════════ */

function CloudConnector() {
  return (
    <div
      className="shrink-0"
      style={{
        width: 48,
        height: 4,
        background: "repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 6px, transparent 6px, transparent 10px)",
        imageRendering: "pixelated",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUEST LOG (sidebar)
   ═══════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: number;
  text: string;
  timestamp: string;
}

function QuestLog({ logs }: { logs: LogEntry[] }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <PixelFrame className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "3px solid #1A1A1A", background: "#8B6914" }}
      >
        <Sparkles className="h-4 w-4" style={{ color: "#FFD700" }} />
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#FFF8E8", letterSpacing: 1 }}>
          QUEST LOG
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Heart className="h-3 w-3" style={{ color: "#FF0000" }} />
          <Heart className="h-3 w-3" style={{ color: "#FF0000" }} />
          <Heart className="h-3 w-3" style={{ color: "#FF000040" }} />
        </div>
      </div>

      {/* Log entries */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-3">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2 flex gap-2"
            >
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914", flexShrink: 0 }}>
                {log.timestamp}
              </span>
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#FFD700" }} />
              <span
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 6,
                  lineHeight: 1.8,
                  color: log.text.startsWith("!!") ? "#FF0000" : "#4A3A2A",
                }}
              >
                {log.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PixelFrame>
  );
}


/* ═══════════════════════════════════════════════════════════════
   DIGGING PLACEHOLDER — shown while agent is still investigating
   ═══════════════════════════════════════════════════════════════ */

function PixelShovel() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 16 16"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Handle */}
      <rect x="7" y="0" width="2" height="2" fill="#8B6914" />
      <rect x="7" y="2" width="2" height="6" fill="#A07828" />
      <rect x="6" y="2" width="1" height="1" fill="#C49464" />
      {/* Shaft-to-blade joint */}
      <rect x="6" y="8" width="4" height="1" fill="#6B5210" />
      {/* Blade */}
      <rect x="5" y="9" width="6" height="2" fill="#A0A0A0" />
      <rect x="4" y="11" width="8" height="2" fill="#C0C0C0" />
      <rect x="5" y="13" width="6" height="2" fill="#A0A0A0" />
      <rect x="6" y="15" width="4" height="1" fill="#808080" />
      {/* Blade highlight */}
      <rect x="5" y="9" width="1" height="4" fill="#D0D0D0" />
      {/* Dirt on blade */}
      <rect x="9" y="12" width="2" height="1" fill="#5C4033" />
      <rect x="7" y="14" width="2" height="1" fill="#5C4033" />
    </svg>
  );
}

const DIGGING_MESSAGES = [
  "DIGGING UP DATA",
  "SNIFFING FOR DEALS",
  "HUNTING SCAMS",
  "CHECKING SOURCES",
];

function DiggingPlaceholder() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % DIGGING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className="flex flex-col items-center gap-6 px-10 py-8"
        style={{
          border: "4px solid #1A1A1A",
          background: "rgba(42, 32, 20, 0.75)",
          boxShadow: "4px 4px 0 #1A1A1A",
        }}
      >
        {/* Animated shovel */}
        <div style={{ animation: "shovel-dig 1.2s ease-in-out infinite" }}>
          <PixelShovel />
        </div>

        {/* Dirt particles flying out */}
        <div className="relative -mt-4 flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2"
              style={{
                background: "#8B7355",
                animation: `dirt-particles 0.8s ease-out infinite`,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>

        {/* Main message — cycles through phrases */}
        <div className="text-center">
          <p
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 11,
              color: "#FFD700",
              textShadow: "2px 2px 0 #1A1A1A",
              letterSpacing: 2,
            }}
          >
            {DIGGING_MESSAGES[msgIndex]}...
          </p>
        </div>

        {/* Flickering subtext */}
        <p
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 7,
            color: "#D4C4A0",
            animation: "retro-blink 1s steps(1) infinite",
          }}
        >
          Quest in progress
        </p>

        {/* Pixel progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 w-2"
              style={{
                background: "#FFD700",
                animation: "retro-blink 1.5s steps(1) infinite",
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function BoardPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const targetUrl = searchParams.get("url") || "";
  const displayLabel = query || targetUrl || "https://www.example.com";

  const [clouds, setClouds] = useState<CloudData[]>([]);
  const [dogIndex, setDogIndex] = useState(0);
  const [dogMoving, setDogMoving] = useState(false);
  const [, setThreatScore] = useState(0);
  const [status, setStatus] = useState<"investigating" | "complete">("investigating");
  const [, setSummary] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const cardCountRef = useRef(0);
  const logIdRef = useRef(0);
  const hasStarted = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cloudScrollRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const cloudElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function addLog(text: string) {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev, { id: logIdRef.current++, text, timestamp: ts }]);
  }

  const scrollToLatestCloud = useCallback(() => {
    requestAnimationFrame(() => {
      if (!cloudScrollRef.current) return;
      cloudScrollRef.current.scrollTo({
        left: cloudScrollRef.current.scrollWidth,
        behavior: "smooth",
      });
    });
  }, []);

  // Compute the dog's X position based on cloud DOM elements
  const getDogX = useCallback((targetIndex: number): number => {
    const cloudIds = Array.from(cloudElRefs.current.keys());
    const targetId = cloudIds[targetIndex];
    if (targetId) {
      const el = cloudElRefs.current.get(targetId);
      if (el) {
        return el.offsetLeft + el.offsetWidth / 2 - 32; // center dog (64px wide / 2)
      }
    }
    // Fallback: estimate position
    const CLOUD_WIDTH = 280;
    const CLOUD_GAP = 48; // gap-12 ~ 48px
    const PADDING = 40;
    return PADDING + targetIndex * (CLOUD_WIDTH + CLOUD_GAP) + CLOUD_WIDTH / 2 - 32;
  }, []);

  // Auto-scroll to results when investigation completes
  useEffect(() => {
    if (status === "complete" && resultsRef.current && scrollContainerRef.current) {
      // Wait for ResultsContainer to mount and animate in before scrolling
      const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        const target = resultsRef.current;
        if (!container || !target) return;

        const start = container.scrollTop;
        const skySection = skyRef.current;
        const end = skySection
          ? skySection.offsetTop + skySection.offsetHeight
          : target.offsetTop;
        const distance = end - start;
        const duration = 1400;
        let startTime: number | null = null;

        function ease(t: number) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function step(timestamp: number) {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          container!.scrollTop = start + distance * ease(progress);
          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const t = setTimeout(() => setSidebarVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Initialize hero cloud
  useEffect(() => {
    const heroCloud: CloudData = {
      id: "hero",
      type: "hero",
      url: displayLabel,
      threatScore: 0,
      status: "investigating",
      summary: "",
    };
    setClouds([heroCloud]);
    setDogIndex(0);
  }, [displayLabel]);

  // Run real API search
  useEffect(() => {
    if (!query && !targetUrl) return;
    if (hasStarted.current) return;
    hasStarted.current = true;

    const store = useResultsStore.getState();
    store.reset();

    const abortController = new AbortController();

    function handleSSEEvent(event: string, data: Record<string, unknown>) {
      switch (event) {
        case "narration":
          addLog(data.text as string);
          break;

        case "product": {
          const product = data as unknown as ProductResult;
          store.addProduct(product);

          const currentIndex = cardCountRef.current;
          cardCountRef.current++;
          addLog(`Found: $${product.price} at ${product.retailer}`);

          const card: EvidenceCard = {
            id: product.id,
            type: "price",
            severity: "info",
            title: `$${product.price.toFixed(2)} — ${product.retailer}`,
            detail: product.title.slice(0, 100),
            source: product.domain,
            confidence: 0.5,
            connections: [],
            metadata: { imageUrl: product.imageUrl },
          };

          const newCloud: CloudData = {
            id: product.id,
            type: "evidence",
            card: { ...card, isNew: true },
          };
          setClouds((prev) => [...prev, newCloud]);

          const newDogIdx = currentIndex + 1;
          setDogMoving(true);
          setDogIndex(newDogIdx);
          setTimeout(() => setDogMoving(false), 800);
          setTimeout(() => scrollToLatestCloud(), 100);
          setTimeout(() => {
            setClouds((prev) =>
              prev.map((c) =>
                c.id === product.id && c.card
                  ? { ...c, card: { ...c.card, isNew: false } }
                  : c
              )
            );
          }, 2500);
          break;
        }

        case "card": {
          const card = data as unknown as EvidenceCard;
          const currentIndex = cardCountRef.current;
          cardCountRef.current++;
          addLog(`Evidence found: ${card.title}`);

          const newCloud: CloudData = {
            id: card.id,
            type: "evidence",
            card: { ...card, isNew: true },
          };
          setClouds((prev) => [...prev, newCloud]);

          const newDogIdx = currentIndex + 1;
          setDogMoving(true);
          setDogIndex(newDogIdx);
          setTimeout(() => setDogMoving(false), 800);
          setTimeout(() => scrollToLatestCloud(), 100);
          setTimeout(() => {
            setClouds((prev) =>
              prev.map((c) =>
                c.id === card.id && c.card
                  ? { ...c, card: { ...c.card, isNew: false } }
                  : c
              )
            );
          }, 2500);
          break;
        }

        case "fraud_check": {
          const { productId, check } = data as { productId: string; check: FraudCheck };
          store.addFraudCheck(productId, check);
          addLog(`${check.name}: ${check.status} — ${(productId as string).slice(0, 8)}`);

          if (check.status === "failed") {
            setClouds((prev) =>
              prev.map((c) =>
                c.id === productId && c.card
                  ? { ...c, card: { ...c.card, severity: "critical" as CardSeverity } }
                  : c
              )
            );
          }
          break;
        }

        case "verdict": {
          const { productId, verdict, trustScore: ts } = data as { productId: string; verdict: string; trustScore: number };
          store.setVerdict(productId, verdict as ProductVerdict, ts);
          addLog(`Verdict: ${verdict.toUpperCase()} (${ts}/100)`);

          const sev: CardSeverity = verdict === "trusted" ? "safe" : verdict === "danger" ? "critical" : "warning";
          setClouds((prev) =>
            prev.map((c) =>
              c.id === productId && c.card
                ? { ...c, card: { ...c.card, severity: sev, confidence: ts / 100 } }
                : c
            )
          );
          break;
        }

        case "all_products":
          addLog(`${data.count} products found. Running security checks...`);
          break;

        case "best_pick":
          store.setBestPick(data.productId as string);
          addLog("Best deal identified!");
          break;

        case "threat_score": {
          const score = data.score as number;
          setThreatScore(score);
          setClouds((prev) =>
            prev.map((c) =>
              c.id === "hero" ? { ...c, threatScore: score } : c
            )
          );
          break;
        }

        case "connection":
          break;

        case "done": {
          store.setDoneSummary(data.summary as string);
          store.setPhase("two-columns");
          setStatus("complete");
          setSummary(data.summary as string);
          addLog("Quest complete!");
          setClouds((prev) =>
            prev.map((c) =>
              c.id === "hero"
                ? { ...c, status: "complete" as const, summary: data.summary as string }
                : c
            )
          );
          break;
        }

        case "error":
          addLog(`!! ERROR: ${data.message}`);
          setStatus("complete");
          break;
      }
    }

    async function runRealSearch() {
      try {
        const body: Record<string, string> = {};
        if (query) body.query = query;
        else if (targetUrl) body.url = targetUrl;

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          addLog("Error: Search failed");
          setStatus("complete");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              handleSSEEvent(parsed.event, parsed.data);
            } catch { /* skip unparseable */ }
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          addLog("Connection lost");
          setStatus("complete");
        }
      }
    }

    runRealSearch();
    return () => { abortController.abort(); };
  }, [query, targetUrl, scrollToLatestCloud]);

  // Compute dog X from DOM after renders
  const [dogX, setDogX] = useState(0);
  useEffect(() => {
    // Small delay to let DOM settle
    const t = setTimeout(() => {
      setDogX(getDogX(dogIndex));
    }, 50);
    return () => clearTimeout(t);
  }, [dogIndex, clouds.length, getDogX]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* ── Fixed Top bar — pixel style ── */}
      <header
        className="relative z-30 flex shrink-0 items-center gap-4 px-5 py-2.5"
        style={{
          borderBottom: "4px solid #1A1A1A",
          background: "#8B6914",
          boxShadow: "0 4px 0 #6B5210",
        }}
      >
        <a href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" style={{ color: "#FFF8E8" }} />
          <div
            className="flex h-7 w-7 items-center justify-center"
            style={{ border: "2px solid #1A1A1A", background: "#FFD700" }}
          >
            <ShoppingBag className="h-3.5 w-3.5" style={{ color: "#1A1A1A" }} />
          </div>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#FFF8E8" }}>Sniff</span>
        </a>

        <div className="mx-3 h-5 w-[3px]" style={{ background: "#6B5210" }} />

        <div
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5"
          style={{ border: "2px solid #1A1A1A", background: "#FFF8E8" }}
        >
          <Search className="h-3 w-3 shrink-0" style={{ color: "#8B6914" }} />
          <span className="truncate" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#4A3A2A" }}>
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === "investigating" ? (
            <>
              <div
                className="h-3 w-3"
                style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite" }}
              />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFD700" }}>SNIFFING</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3" style={{ background: "#00CC00" }} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#00CC00" }}>COMPLETE</span>
            </>
          )}
        </div>
      </header>

      {/* ── Body: Sticky sidebar + Scrollable right content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Quest Log style */}
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="relative z-20 flex h-full w-[320px] shrink-0 flex-col gap-3 p-3"
              style={{
                borderRight: "4px solid #1A1A1A",
                background: "#D4C4A0",
                boxShadow: "inset -4px 0 0 #B8A888",
              }}
            >
              <QuestLog logs={logs} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Right content — single scrollable column */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* ── Cloud Path — sky + grass ── */}
          <div ref={skyRef} className="relative h-[50vh] shrink-0 overflow-hidden">
            <GameBackground />

            {/* Horizontally scrolling cloud track */}
            <div
              ref={cloudScrollRef}
              className="cloud-track absolute inset-0 z-10 overflow-x-auto"
            >
              <div
                className="relative flex h-full items-start px-10"
                style={{ minWidth: "fit-content", paddingTop: "5%" }}
              >
                {/* Clouds with connectors */}
                {clouds.map((cloud, i) => (
                  <div key={cloud.id} className="flex items-center">
                    {i > 0 && <CloudConnector />}
                    <div
                      ref={(el) => {
                        if (el) cloudElRefs.current.set(cloud.id, el);
                      }}
                    >
                      <CloudNode cloud={cloud} index={i} />
                    </div>
                  </div>
                ))}

                {/* Dog on grass — absolutely positioned within track */}
                <div
                  className="pointer-events-none absolute z-20"
                  style={{
                    bottom: "8%",
                    left: dogX,
                    transition: dogMoving
                      ? "left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      : "none",
                  }}
                >
                  {dogMoving ? (
                    <div style={{ animation: "dog-run 0.4s steps(1) infinite" }}>
                      <PixelDog />
                    </div>
                  ) : (
                    <div style={{ animation: "dog-bob 1.2s ease-in-out infinite" }}>
                      <PixelDogIdle />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Separator: grass → dirt ── */}
          <div className="relative z-20">
            <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
            <div
              className="h-3 w-full"
              style={{
                background: "linear-gradient(to bottom, #4A8C34, #8B7355)",
                imageRendering: "pixelated",
              }}
            />
          </div>

          {/* ── Results section — underground dirt zone ── */}
          <div ref={resultsRef} className="dirt-underground min-h-[50vh]">
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {status === "investigating" ? (
                  <motion.div
                    key="digging"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                  >
                    <DiggingPlaceholder />
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ResultsContainer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
