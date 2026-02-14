"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingBag,
  Search,
  ArrowRight,
  Tag,
  Heart,
  Sparkles,
  TrendingDown,
  Gift,
  Zap,
} from "lucide-react";

/* ────────────────── hero decorative background ────────────── */
function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Animated mesh gradient base */}
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
        className="absolute -top-[5%] -left-[8%] h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, rgba(255,237,213,0.08) 40%, transparent 70%)",
          animation: "orb-drift-1 16s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />

      {/* Glassmorphism orb — mid-right */}
      <div
        className="absolute top-[25%] -right-[10%] h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.05) 0%, rgba(255,247,237,0.07) 40%, transparent 70%)",
          animation: "orb-drift-2 22s ease-in-out infinite",
          filter: "blur(80px)",
        }}
      />

      {/* Glassmorphism orb — bottom-left */}
      <div
        className="absolute -bottom-[10%] left-[5%] h-[450px] w-[450px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,0,0.04) 0%, rgba(255,237,213,0.06) 40%, transparent 70%)",
          animation: "orb-drift-3 18s ease-in-out infinite",
          filter: "blur(70px)",
        }}
      />

      {/* Subtle grid texture overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Noise texture overlay */}
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

/* ────────────────────────── Navbar ─────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]" style={{ backdropFilter: "blur(16px)" }}>
      <div className="mx-auto flex items-center justify-between px-6 py-3.5 md:px-16">
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand">
            <ShoppingBag className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Sniff
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-[15px] font-medium text-foreground/70 transition-colors hover:text-foreground">
            How It Works
          </a>
          <a href="#about" className="text-[15px] font-medium text-foreground/70 transition-colors hover:text-foreground">
            About
          </a>
          <a
            href="#search"
            className="flex h-10 items-center rounded-2xl bg-brand px-6 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(255,107,0,0.3)] transition-all hover:shadow-[0_4px_16px_rgba(255,107,0,0.4)] hover:brightness-110"
          >
            Try It Free
          </a>
        </div>

        <button className="text-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="flex flex-col gap-4 border-t border-[#E5E7EB] px-6 pb-6 pt-4 md:hidden">
          <a href="#how-it-works" className="text-[15px] font-medium text-foreground/70">How It Works</a>
          <a href="#about" className="text-[15px] font-medium text-foreground/70">About</a>
          <a href="#search" className="flex w-fit items-center rounded-2xl bg-brand px-6 py-2.5 text-[14px] font-semibold text-white">
            Try It Free
          </a>
        </div>
      )}
    </nav>
  );
}

/* ────────── animated deal board placeholder ─────── */
function DemoBoard() {
  return (
    <div className="relative mx-auto w-full max-w-[900px] overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-[0_8px_60px_rgba(0,0,0,0.08)]" style={{ backdropFilter: "blur(24px)" }}>
      <div className="relative flex h-[340px] items-center justify-center sm:h-[420px]">
        <div
          className="absolute left-[8%] top-[18%] rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
          style={{ animation: "float 6s ease-in-out infinite", backdropFilter: "blur(16px)" }}
        >
          <p className="text-xs font-semibold text-muted">Amazon</p>
          <p className="text-2xl font-bold text-foreground">$39.99</p>
          <p className="text-xs font-medium text-brand">Retail price</p>
        </div>

        <div
          className="absolute right-[10%] top-[12%] rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
          style={{ animation: "float 6s ease-in-out 1s infinite", backdropFilter: "blur(16px)" }}
        >
          <p className="text-xs font-semibold text-muted">Alibaba</p>
          <p className="text-2xl font-bold text-emerald-500">$11.80</p>
          <p className="text-xs font-medium text-emerald-500/70">Best price</p>
        </div>

        <div
          className="absolute bottom-[15%] left-[30%] rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
          style={{ animation: "float 6s ease-in-out 2s infinite", backdropFilter: "blur(16px)" }}
        >
          <p className="text-xs font-semibold text-muted">Walmart</p>
          <p className="text-2xl font-bold text-foreground">$34.50</p>
          <p className="text-xs font-medium text-amber-500">Competitor</p>
        </div>

        <div
          className="absolute bottom-[20%] right-[15%] rounded-2xl border-2 border-brand/20 bg-brand-light/80 px-5 py-4 shadow-[0_4px_24px_rgba(255,107,0,0.12)]"
          style={{ animation: "float 6s ease-in-out 0.5s infinite", backdropFilter: "blur(16px)" }}
        >
          <p className="text-xs font-bold text-brand">You Save</p>
          <p className="text-2xl font-bold text-brand">$28.19</p>
          <p className="text-xs text-muted">70% off</p>
        </div>

        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.12 }}>
          <line x1="22%" y1="30%" x2="72%" y2="25%" stroke="#FF6B00" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="22%" y1="35%" x2="42%" y2="70%" stroke="#FF6B00" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="75%" y1="30%" x2="75%" y2="65%" stroke="#10b981" strokeWidth="2" strokeDasharray="6 4" />
        </svg>

        <div className="absolute bottom-5 left-1/2 flex w-[80%] -translate-x-1/2 flex-col items-center gap-1.5">
          <div className="flex w-full items-center justify-between text-xs text-muted">
            <span>Savings Found</span>
            <span className="font-bold text-brand">70%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-amber-400"
              style={{ width: "70%", animation: "pulse-glow 3s ease-in-out infinite" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── savings example card ────────────────────── */
function SavingsCard({
  product,
  retailer,
  retailPrice,
  sourcePrice,
  percent,
}: {
  product: string;
  retailer: string;
  retailPrice: string;
  sourcePrice: string;
  percent: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
      <p className="text-sm font-semibold text-foreground">{product}</p>
      <div className="flex items-center gap-3">
        <span className="text-lg text-subtle line-through">{retailPrice}</span>
        <ArrowRight className="h-4 w-4 text-brand" />
        <span className="text-lg font-bold text-emerald-500">{sourcePrice}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{retailer} &rarr; Source</span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
          Save {percent}%
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────── Hero Search ───────────────────────── */
function HeroSearch() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleInvestigate() {
    const target = url.trim() || "https://www.amazon.com/dp/B0DEMO12345";
    router.push(`/board_test?url=${encodeURIComponent(target)}`);
  }

  return (
    <>
      <div className="flex w-full max-w-[600px] items-center gap-0 rounded-2xl border border-gray-200 bg-white/80 shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-all focus-within:border-brand/30 focus-within:shadow-[0_4px_24px_rgba(255,107,0,0.15)]" style={{ backdropFilter: "blur(20px)" }}>
        <Search className="ml-4 h-5 w-5 shrink-0 text-subtle" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvestigate()}
          placeholder="Paste any product link to find the best price..."
          className="h-14 flex-1 bg-transparent px-3 text-[15px] text-foreground placeholder:text-subtle focus:outline-none"
        />
        <button
          onClick={handleInvestigate}
          className="m-1.5 flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(255,107,0,0.3)] transition-all hover:shadow-[0_4px_16px_rgba(255,107,0,0.4)] hover:brightness-110"
        >
          Find Deals
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-muted">
        Works with Amazon, Walmart, eBay, AliExpress &amp; more
      </p>
    </>
  );
}

/* ══════════════════════════ Main page ═══════════════════════════ */
export default function Home() {
  return (
    <div className="relative min-h-screen bg-white">
      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        id="search"
        className="relative overflow-hidden"
      >
        <HeroBackground />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
          <div className="mx-auto flex w-full max-w-[800px] flex-col items-center gap-8">
            {/* Announcement badge */}
            <a
              href="#"
              className="group flex items-center gap-2 rounded-full border border-brand/15 bg-brand-light px-1.5 py-1.5 pr-5 transition-colors hover:border-brand/30"
            >
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
                New
              </span>
              <span className="text-sm text-foreground/60 group-hover:text-foreground">
                AI-powered price discovery for smart shoppers
              </span>
              <span className="text-subtle transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </a>

            {/* Main headline */}
            <h1
              className="text-[clamp(2.5rem,8vw,4.5rem)] leading-[1.1] tracking-tight text-foreground"
              style={{ textShadow: "0 0 40px rgba(255,255,255,0.8)" }}
            >
              <span className="font-light">Your </span>
              <span className="font-display italic font-semibold text-brand/80">Personal </span>
              <span className="font-light">Shopping </span>
              <span className="font-display italic font-semibold text-brand">Assistant</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-[560px] text-lg leading-relaxed text-muted md:text-xl" style={{ color: '#4B5563' }}>
              Paste any product link and Sniff instantly finds the best
              price across every store — so you never overpay again.
            </p>

            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ═══════════════ LIVE DEMO ═══════════════ */}
      <section className="relative z-10 -mt-24 px-6 pb-0">
        <div className="pb-24">
          <DemoBoard />
        </div>
      </section>

      {/* ═══════════════ PERSONALIZED DEALS & DISCOVERY ═══════════════ */}
      <section id="how-it-works" className="relative z-10 bg-surface px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          {/* Section header */}
          <div className="mb-16 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-[2px] text-brand">
                Personalized Deals &amp; Discovery
              </span>
            </div>
            <h2 className="mb-5 text-[clamp(2rem,5vw,3.2rem)] leading-[1.15] tracking-tight text-foreground">
              <span className="font-display italic font-semibold text-brand/80">Discover, </span>
              <span className="font-bold">Compare and </span>
              <span className="font-display italic font-semibold text-brand">Save</span>
            </h2>
            <p className="max-w-[640px] text-base leading-relaxed md:text-lg" style={{ color: '#4B5563' }}>
              From price tracking to deal alerts, Sniff is your AI shopping
              companion that finds the best prices across the entire internet.
            </p>
          </div>

          {/* 2x2 feature grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1 — Smart Price Scanning */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <Tag className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Smart price scanning
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Automatically scan prices across Amazon, Walmart, AliExpress,
                  and 50+ stores to find the absolute lowest price instantly.
                </p>
              </div>
              {/* Visual: product card mock */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-surface">
                <div className="flex items-center gap-1.5 border-b border-[#E5E7EB] px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <div className="ml-3 h-4 flex-1 rounded-lg bg-surface-2" />
                </div>
                <div className="relative flex gap-3 p-4">
                  <div className="relative h-20 w-20 shrink-0 rounded-xl bg-surface-2">
                    <div className="absolute inset-0 rounded-xl border-2 border-dashed border-brand/40" />
                    <span className="absolute -top-2 -left-1 rounded-md bg-brand px-1.5 text-[9px] font-bold text-white">IMG</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3 w-3/4 rounded-lg bg-surface-2" />
                    <div className="relative h-5 w-1/3 rounded-lg bg-surface-2">
                      <div className="absolute inset-0 rounded-lg border-2 border-dashed border-brand/40" />
                      <span className="absolute -top-2 left-0 rounded-md bg-brand px-1.5 text-[9px] font-bold text-white">PRICE</span>
                    </div>
                    <div className="h-3 w-1/2 rounded-lg bg-surface-2" />
                    <div className="relative mt-auto h-7 w-20 rounded-xl bg-brand/10">
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-brand/30 text-[11px] font-bold text-brand">
                        Best Deal
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Deal Discovery Flow */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Deal discovery flow
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Watch as Sniff traces your product from retail to source,
                  uncovering every deal along the way in real time.
                </p>
              </div>
              {/* Visual: flow pills */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {[
                  { label: "scan", color: "border-brand text-brand bg-brand/5" },
                  { label: "match", color: "border-blue-400 text-blue-500 bg-blue-50" },
                  { label: "compare", color: "border-emerald-400 text-emerald-500 bg-emerald-50" },
                  { label: "alert", color: "border-amber-400 text-amber-500 bg-amber-50" },
                  { label: "save!", color: "border-brand text-white bg-brand" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${step.color}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <svg width="24" height="8" className="shrink-0 text-[#D1D5DB]">
                        <line x1="0" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                        <path d="M16 1 L20 4 L16 7" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Category Savings */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <TrendingDown className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Average savings by category
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  Our users save big across every product category — from
                  electronics to beauty, the deals are always there.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3.5">
                {[
                  { label: "Electronics", pct: 74, color: "bg-brand" },
                  { label: "Home & Kitchen", pct: 82, color: "bg-emerald-500" },
                  { label: "Fashion", pct: 68, color: "bg-amber-500" },
                  { label: "Health & Beauty", pct: 77, color: "bg-blue-500" },
                ].map((bar) => (
                  <div key={bar.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted">{bar.label}</span>
                      <span className="font-bold text-foreground">{bar.pct}% avg savings</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                      <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4 — Trusted Sellers */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-3xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                  <Heart className="h-5 w-5 text-rose-500" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Trusted seller ratings
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  We check reviews, shipping times, and return policies so you
                  only buy from sellers you can trust.
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { name: "Alibaba Direct", score: 92, trend: "+3" },
                  { name: "DHgate Store", score: 78, trend: "-1" },
                  { name: "1688 Supplier", score: 95, trend: "+5" },
                  { name: "AliExpress Top", score: 88, trend: "+2" },
                ].map((v) => (
                  <div key={v.name} className="flex flex-col gap-1 rounded-2xl bg-surface p-3">
                    <span className="truncate text-[11px] font-medium text-muted">{v.name}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-foreground">{v.score}</span>
                      <span className="text-[10px] text-subtle">/100</span>
                      <span className={`ml-auto text-[11px] font-bold ${v.trend.startsWith("+") ? "text-emerald-500" : "text-red-400"}`}>
                        {v.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SOCIAL PROOF / SAVINGS ═══════════════ */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-16 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-[2px] text-brand">
                Real Savings
              </span>
            </div>
            <h2 className="mb-5 text-[clamp(2rem,5vw,3.2rem)] leading-[1.15] tracking-tight text-foreground">
              <span className="font-bold">Real </span>
              <span className="font-display italic font-semibold text-brand">Savings, </span>
              <span className="font-bold">Real </span>
              <span className="font-display italic font-semibold text-brand">Products</span>
            </h2>
            <p className="max-w-[500px] text-base leading-relaxed" style={{ color: '#4B5563' }}>
              Deals our shoppers have found using Sniff.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SavingsCard product="LED Desk Lamp" retailer="Amazon" retailPrice="$39.99" sourcePrice="$11.80" percent={70} />
            <SavingsCard product="Wireless Earbuds" retailer="Best Buy" retailPrice="$79.00" sourcePrice="$18.50" percent={77} />
            <SavingsCard product="Yoga Mat (6mm)" retailer="Target" retailPrice="$34.99" sourcePrice="$6.20" percent={82} />
            <SavingsCard product="Phone Case (MagSafe)" retailer="Amazon" retailPrice="$29.99" sourcePrice="$3.40" percent={89} />
            <SavingsCard product="USB-C Hub 7-in-1" retailer="Walmart" retailPrice="$49.99" sourcePrice="$12.90" percent={74} />
            <SavingsCard product="Silicone Kitchen Tongs" retailer="Amazon" retailPrice="$14.99" sourcePrice="$2.10" percent={86} />
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST / POWERED BY ═══════════════ */}
      <section className="relative z-10 bg-surface px-6 py-20">
        <div className="mx-auto max-w-[800px] text-center">
          <p className="mb-10 text-xs font-bold uppercase tracking-widest text-subtle">
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="flex items-center gap-2.5 text-subtle transition-colors hover:text-foreground">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M12 1L3 7v10l9 6 9-6V7l-9-6zm0 2.18L18.36 7.5 12 11.82 5.64 7.5 12 3.18zM5 9.06l6 4v7.76l-6-4V9.06zm8 11.76v-7.76l6-4v7.76l-6 4z" />
              </svg>
              <span className="text-base font-bold tracking-tight">Perplexity</span>
            </div>
            <div className="flex items-center gap-2.5 text-subtle transition-colors hover:text-foreground">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16z" />
                <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 2a4 4 0 110 8 4 4 0 010-8z" />
              </svg>
              <span className="text-base font-bold tracking-tight">Bright Data</span>
            </div>
            <div className="flex items-center gap-2.5 text-subtle transition-colors hover:text-foreground">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M20.74 7.6a5.14 5.14 0 00-.44-4.24A5.2 5.2 0 0014.68.85a5.14 5.14 0 00-3.89 1.78 5.14 5.14 0 00-3.43-1.3A5.2 5.2 0 002.2 4.47a5.14 5.14 0 00.63 6.05 5.14 5.14 0 00.44 4.24 5.2 5.2 0 005.62 2.51 5.14 5.14 0 003.89-1.78 5.14 5.14 0 003.43 1.3 5.2 5.2 0 005.16-3.14 5.14 5.14 0 00-.63-6.05z" />
              </svg>
              <span className="text-base font-bold tracking-tight">OpenAI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section id="about" className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Built at TreeHacks 2026
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#4B5563' }}>
            Sniff started as a question: why do we pay 5&ndash;10x markup
            on everyday products when the same item exists at a fraction of the
            price? We built an AI shopping assistant that finds the best deals
            across the entire internet — so you always get the best price.
          </p>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 border-t border-[#E5E7EB] bg-surface px-6 py-8">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-muted">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand">
              <ShoppingBag className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium">
              Sniff &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-subtle">
            <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="transition-colors hover:text-foreground">Terms</a>
            <a href="#" className="transition-colors hover:text-foreground">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
