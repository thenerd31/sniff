"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Shield,
  Search,
  ArrowRight,
  Tag,
} from "lucide-react";

/* ───────────────────── decorative stars ───────────────────── */
function Stars() {
  const stars = [
    { top: "8%", left: "12%", size: 2, delay: "0s" },
    { top: "15%", left: "25%", size: 1.5, delay: "0.5s" },
    { top: "5%", left: "45%", size: 2.5, delay: "1s" },
    { top: "20%", left: "60%", size: 1.5, delay: "1.5s" },
    { top: "10%", left: "75%", size: 2, delay: "0.3s" },
    { top: "25%", left: "88%", size: 1, delay: "0.8s" },
    { top: "35%", left: "5%", size: 1.5, delay: "1.2s" },
    { top: "30%", left: "35%", size: 1, delay: "0.7s" },
    { top: "40%", left: "92%", size: 2, delay: "1.8s" },
    { top: "12%", left: "55%", size: 1, delay: "2s" },
    { top: "45%", left: "15%", size: 1.5, delay: "0.4s" },
    { top: "50%", left: "80%", size: 2, delay: "1.1s" },
  ];

  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animation: `twinkle 3s ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </>
  );
}

/* ────────────────── hero decorative background ────────────── */
function SceneBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Stars />

      {/* Moon */}
      <div
        className="absolute hidden md:block"
        style={{
          top: "10%",
          right: "12%",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 40%, #f0e6d3, #d4c5a9)",
          boxShadow: "0 0 40px 10px rgba(240,230,211,0.15)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />

      {/* Tree silhouette (left side) */}
      <svg
        className="absolute bottom-[16vh] left-[9%] hidden md:block"
        width="80"
        height="160"
        viewBox="0 0 80 160"
        fill="none"
      >
        <path
          d="M40 0 L15 60 L25 55 L5 110 L20 105 L10 150 L35 150 L35 160 L45 160 L45 150 L70 150 L60 105 L75 110 L55 55 L65 60 Z"
          fill="#071018"
          opacity="0.7"
        />
      </svg>
    


      {/* Tree silhouette (right side) */}
      <svg
        className="absolute bottom-[12vh] right-[8%] hidden md:block"
        width="80"
        height="160"
        viewBox="0 0 80 160"
        fill="none"
      >
        <path
          d="M40 0 L15 60 L25 55 L5 110 L20 105 L10 150 L35 150 L35 160 L45 160 L45 150 L70 150 L60 105 L75 110 L55 55 L65 60 Z"
          fill="#071018"
          opacity="0.7"
        />
      </svg>

      {/* Detective bear peeking from right */}
      <div
        className="absolute bottom-[18vh] right-0 hidden lg:block"
        style={{ width: 120, height: 120 }}
      >
        <svg viewBox="0 0 120 120" fill="none" width="120" height="120">
          <ellipse cx="90" cy="90" rx="40" ry="35" fill="#3d2c1e" />
          <circle cx="85" cy="55" r="28" fill="#4a3728" />
          <circle cx="65" cy="35" r="10" fill="#4a3728" />
          <circle cx="65" cy="35" r="6" fill="#6b5040" />
          <circle cx="105" cy="35" r="10" fill="#4a3728" />
          <circle cx="105" cy="35" r="6" fill="#6b5040" />
          <ellipse cx="82" cy="60" rx="12" ry="8" fill="#6b5040" />
          <circle cx="76" cy="50" r="3" fill="white" />
          <circle cx="76" cy="50" r="1.5" fill="#1a1a1a" />
          <circle cx="94" cy="50" r="3" fill="white" />
          <circle cx="94" cy="50" r="1.5" fill="#1a1a1a" />
          <ellipse cx="85" cy="58" rx="3" ry="2" fill="#1a1a1a" />
          <path
            d="M58 42 L112 42 L108 30 L95 25 L75 25 L62 30 Z"
            fill="#2d2d2d"
          />
          <rect x="55" y="40" width="60" height="5" rx="2" fill="#2d2d2d" />
          <circle
            cx="55"
            cy="75"
            r="10"
            stroke="#c0a060"
            strokeWidth="3"
            fill="rgba(135,206,250,0.1)"
          />
          <line
            x1="62"
            y1="82"
            x2="72"
            y2="95"
            stroke="#c0a060"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

/* ────────────────────────── Navbar ─────────────────────────── */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 z-50 w-full"
      style={{
        backdropFilter: "blur(12px)",
        background: "rgba(10,22,40,0.75)",
      }}
    >
      <div className="mx-auto flex items-center justify-between px-6 py-4 md:px-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-coral" />
          <span className="text-lg font-semibold tracking-tight text-white">
            Sentinel
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="text-[15px] font-medium text-white/80 transition-colors hover:text-white"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="text-[15px] font-medium text-white/80 transition-colors hover:text-white"
          >
            About
          </a>
          <a
            href="#search"
            className="flex h-9 items-center rounded-lg bg-coral px-5 text-[14px] font-semibold text-white transition-all hover:bg-[#e5593a]"
          >
            Try It Now
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="flex flex-col gap-4 border-t border-white/10 px-6 pb-6 pt-4 md:hidden">
          <a href="#how-it-works" className="text-[15px] font-medium text-white/80">
            How It Works
          </a>
          <a href="#about" className="text-[15px] font-medium text-white/80">
            About
          </a>
          <a
            href="#search"
            className="flex w-fit items-center rounded-lg bg-coral px-5 py-2 text-[14px] font-semibold text-white"
          >
            Try It Now
          </a>
        </div>
      )}
    </nav>
  );
}

/* ────────── animated investigation board placeholder ─────── */
function DemoBoard() {
  return (
    <div className="relative mx-auto w-full max-w-[900px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="relative flex h-[340px] items-center justify-center sm:h-[420px]">
        {/* Fake nodes */}
        <div
          className="absolute left-[8%] top-[18%] rounded-xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg"
          style={{ animation: "float 6s ease-in-out infinite" }}
        >
          <p className="text-xs font-semibold text-white/50">Amazon</p>
          <p className="text-2xl font-bold text-white">$39.99</p>
          <p className="text-xs text-coral">Retail price</p>
        </div>

        <div
          className="absolute right-[10%] top-[12%] rounded-xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg"
          style={{ animation: "float 6s ease-in-out 1s infinite" }}
        >
          <p className="text-xs font-semibold text-white/50">Alibaba</p>
          <p className="text-2xl font-bold text-emerald-400">$11.80</p>
          <p className="text-xs text-emerald-400/70">Source price</p>
        </div>

        <div
          className="absolute bottom-[15%] left-[30%] rounded-xl border border-white/10 bg-white/5 px-5 py-4 shadow-lg"
          style={{ animation: "float 6s ease-in-out 2s infinite" }}
        >
          <p className="text-xs font-semibold text-white/50">Walmart</p>
          <p className="text-2xl font-bold text-white">$34.50</p>
          <p className="text-xs text-yellow-400/70">Competitor</p>
        </div>

        <div
          className="absolute bottom-[20%] right-[15%] rounded-xl border border-coral/30 bg-coral/10 px-5 py-4 shadow-lg"
          style={{ animation: "float 6s ease-in-out 0.5s infinite" }}
        >
          <p className="text-xs font-semibold text-coral">Savings</p>
          <p className="text-2xl font-bold text-coral">$28.19</p>
          <p className="text-xs text-white/40">70% saved</p>
        </div>

        {/* Connection lines (SVG) */}
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.2 }}>
          <line
            x1="22%"
            y1="30%"
            x2="72%"
            y2="25%"
            stroke="#ff6b4a"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="22%"
            y1="35%"
            x2="42%"
            y2="70%"
            stroke="#ff6b4a"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <line
            x1="75%"
            y1="30%"
            x2="75%"
            y2="65%"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        </svg>

        {/* Savings meter bar */}
        <div className="absolute bottom-4 left-1/2 flex w-[80%] -translate-x-1/2 flex-col items-center gap-1.5">
          <div className="flex w-full items-center justify-between text-xs text-white/40">
            <span>Savings Meter</span>
            <span className="text-coral font-semibold">70%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-coral to-emerald-400"
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
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
      <p className="text-sm font-medium text-white/60">{product}</p>
      <div className="flex items-center gap-3">
        <span className="text-lg text-white/40 line-through">{retailPrice}</span>
        <ArrowRight className="h-4 w-4 text-coral" />
        <span className="text-lg font-bold text-emerald-400">{sourcePrice}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{retailer} &rarr; Source</span>
        <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
          Save {percent}%
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────── Main page ───────────────────────── */
function HeroSearch() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleInvestigate() {
    const target = url.trim() || "https://www.amazon.com/dp/B0DEMO12345";
    router.push(`/board?url=${encodeURIComponent(target)}`);
  }

  return (
    <>
      <div className="flex w-full max-w-[600px] items-center gap-0 rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-coral/50 focus-within:bg-white/[0.08]">
        <Search className="ml-4 h-5 w-5 shrink-0 text-white/30" />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvestigate()}
          placeholder="Paste an Amazon link to investigate..."
          className="h-14 flex-1 bg-transparent px-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          onClick={handleInvestigate}
          className="m-1.5 flex h-11 items-center gap-2 rounded-lg bg-coral px-6 text-[14px] font-semibold text-white transition-all hover:bg-[#e5593a]"
        >
          Investigate
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-white/30">
        Works with Amazon, Walmart, eBay, AliExpress &amp; more
      </p>
    </>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0a1628]">
      <Navbar />

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        id="search"
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)",
        }}
      >
        <SceneBackground />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-20 text-center">
          <div className="mx-auto flex w-full max-w-[800px] flex-col items-center gap-8">
            {/* Announcement badge */}
            <a
              href="#"
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-1.5 py-1.5 pr-5 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              <span className="rounded-full bg-coral px-2.5 py-0.5 text-xs font-semibold text-white">
                New
              </span>
              <span className="text-sm text-white/70 group-hover:text-white/90">
                Introducing AI-powered price investigation for everyone
              </span>
              <span className="text-white/40 transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </a>

            {/* Main headline */}
            <h1 className="text-[clamp(2.5rem,8vw,5rem)] leading-[1.1] tracking-tight">
              <span className="font-light text-white">A </span>
              <span className="font-display italic text-white">Detective </span>
              <span className="font-light text-white">for </span>
              <span className="font-display italic text-coral">Prices</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-[600px] text-lg leading-relaxed text-muted md:text-xl">
              Paste any product link and let Sentinel trace it to the source,
              expose the markup, and find you the best deal.
            </p>

            {/* Search bar */}
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ═══════════════ LIVE DEMO + FADE ═══════════════ */}
      <section
        className="relative z-10 -mt-24 px-6 pb-0"
        style={{
          background: "linear-gradient(180deg, transparent 0%, #000000 100%)",
        }}
      >
        <div className="pb-24">
          <DemoBoard />
        </div>
      </section>

      {/* ═══════════════ INVESTIGATE & COMPARE ═══════════════ */}
      <section id="how-it-works" className="relative z-10 bg-black px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          {/* Section header */}
          <div className="mb-16 flex flex-col items-center text-center">
            <div className="mb-5 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#00d4aa]" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              <span className="text-xs font-medium uppercase tracking-[2px] text-[#00d4aa]">
                Investigate &amp; Compare
              </span>
            </div>
            <h2 className="mb-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight">
              <span className="text-white">Scrape, </span>
              <span className="text-white">Trace and </span>
              <span className="font-display italic text-[#00d4aa]">Save</span>
            </h2>
            <p className="max-w-[700px] text-base leading-relaxed text-[#9ca3af] md:text-lg">
              Extract live prices from any retailer, trace products back to
              original manufacturers, and run side-by-side comparisons.
              Everything you need to never overpay again.
            </p>
          </div>

          {/* 2x2 feature grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card 1 — Price Scraping */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-[#1f2937] bg-[#0f1419] p-7">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Live price scraping
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca3af]">
                  Extract real-time prices, images, and vendor details from
                  Amazon, Walmart, AliExpress, and dozens more — automatically.
                </p>
              </div>
              {/* Visual: mock browser with bounding boxes */}
              <div className="mt-6 overflow-hidden rounded-lg border border-[#1f2937] bg-[#0a0f14]">
                <div className="flex items-center gap-1.5 border-b border-[#1f2937] px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  <div className="ml-3 h-4 flex-1 rounded bg-white/5" />
                </div>
                <div className="relative flex gap-3 p-4">
                  {/* Product image placeholder */}
                  <div className="relative h-20 w-20 shrink-0 rounded bg-white/5">
                    <div className="absolute inset-0 rounded border-2 border-dashed border-[#00d4aa]" />
                    <span className="absolute -top-2 -left-1 rounded bg-[#00d4aa] px-1 text-[9px] font-bold text-black">IMG</span>
                  </div>
                  {/* Text placeholders */}
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                    <div className="relative h-5 w-1/3 rounded bg-white/10">
                      <div className="absolute inset-0 rounded border-2 border-dashed border-[#00d4aa]" />
                      <span className="absolute -top-2 left-0 rounded bg-[#00d4aa] px-1 text-[9px] font-bold text-black">PRICE</span>
                    </div>
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                    <div className="relative mt-auto h-6 w-16 rounded bg-[#00d4aa]/10">
                      <div className="absolute inset-0 flex items-center justify-center rounded border border-[#28c840] text-[10px] font-bold text-[#28c840]">
                        Buy Now
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Source Tracing */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-[#1f2937] bg-[#0f1419] p-7">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 3H5a2 2 0 00-2 2v4" />
                    <path d="M15 3h4a2 2 0 012 2v4" />
                    <path d="M9 21H5a2 2 0 01-2-2v-4" />
                    <path d="M15 21h4a2 2 0 002-2v-4" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Source tracing
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca3af]">
                  Follow the supply chain from retail listing to original
                  manufacturer. See every middleman and markup along the way.
                </p>
              </div>
              {/* Visual: flow of action pills */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {[
                  { label: "scrape", color: "border-[#00d4aa] text-[#00d4aa]" },
                  { label: "match", color: "border-blue-400 text-blue-400" },
                  { label: "trace", color: "border-green-400 text-green-400" },
                  { label: "compare", color: "border-yellow-400 text-yellow-400" },
                  { label: "verdict", color: "border-[#00d4aa] bg-[#00d4aa]/15 text-[#00d4aa]" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${step.color}`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[9px] text-white/20">step {i + 1}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <svg width="24" height="8" className="text-white/15 shrink-0">
                        <line x1="0" y1="4" x2="18" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                        <path d="M16 1 L20 4 L16 7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 — Savings Benchmarks */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-[#1f2937] bg-[#0f1419] p-7">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#00d4aa]/15">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#00d4aa]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Savings benchmarks
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca3af]">
                  See how Sentinel performs across product categories. From
                  electronics to household goods, the markups are real.
                </p>
              </div>
              {/* Visual: progress bars */}
              <div className="mt-6 flex flex-col gap-3.5">
                {[
                  { label: "Electronics", pct: 74, color: "bg-green-400" },
                  { label: "Home & Kitchen", pct: 82, color: "bg-green-400" },
                  { label: "Fashion", pct: 68, color: "bg-[#00d4aa]" },
                  { label: "Health & Beauty", pct: 77, color: "bg-blue-400" },
                ].map((bar) => (
                  <div key={bar.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#9ca3af]">{bar.label}</span>
                      <span className="font-semibold text-white">{bar.pct}% avg savings</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${bar.color}`}
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 4 — Vendor Reliability */}
            <div className="flex min-h-[320px] flex-col justify-between rounded-2xl border border-[#1f2937] bg-[#0f1419] p-7">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Vendor reliability scores
                </h3>
                <p className="text-sm leading-relaxed text-[#9ca3af]">
                  Cross-reference reviews, shipping history, and return rates to
                  surface only trustworthy sources — not just the cheapest.
                </p>
              </div>
              {/* Visual: vendor score cards */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { name: "Alibaba Direct", score: 92, trend: "+3" },
                  { name: "DHgate Store", score: 78, trend: "-1" },
                  { name: "1688 Supplier", score: 95, trend: "+5" },
                  { name: "AliExpress Top", score: 88, trend: "+2" },
                ].map((v) => (
                  <div
                    key={v.name}
                    className="flex flex-col gap-1 rounded-lg border border-[#1f2937] bg-black/40 px-3 py-2.5"
                  >
                    <span className="text-[11px] text-[#9ca3af] truncate">{v.name}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-white">{v.score}</span>
                      <span className="text-[10px] text-[#9ca3af]">/100</span>
                      <span
                        className={`ml-auto text-[10px] font-semibold ${
                          v.trend.startsWith("+")
                            ? "text-[#00d4aa]"
                            : "text-coral"
                        }`}
                      >
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

      {/* ── fade from black → page background ── */}
      <div
        className="relative z-10 h-64"
        style={{
          background: "linear-gradient(180deg, #000000 0%, #000000 20%, #0a1628 100%)",
        }}
      />

      {/* ═══════════════ SOCIAL PROOF / SAVINGS ═══════════════ */}
      <section className="relative z-10 -mt-45 px-6 py-24">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-16 flex flex-col items-center text-center">
            <div className="mb-5 flex items-center gap-2">
              <Tag className="h-4 w-4 text-coral" />
              <span className="text-xs font-medium uppercase tracking-[2px] text-coral">
                Real Savings
              </span>
            </div>
            <h2 className="mb-5 text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight">
              <span className="text-white">Real </span>
              <span className="font-display italic text-coral">Savings, </span>
              <span className="text-white">Real </span>
              <span className="font-display italic text-coral">Products</span>
            </h2>
            <p className="max-w-[500px] text-base leading-relaxed text-[#9ca3af]">
              Examples of markups Sentinel has uncovered.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SavingsCard
              product="LED Desk Lamp"
              retailer="Amazon"
              retailPrice="$39.99"
              sourcePrice="$11.80"
              percent={70}
            />
            <SavingsCard
              product="Wireless Earbuds"
              retailer="Best Buy"
              retailPrice="$79.00"
              sourcePrice="$18.50"
              percent={77}
            />
            <SavingsCard
              product="Yoga Mat (6mm)"
              retailer="Target"
              retailPrice="$34.99"
              sourcePrice="$6.20"
              percent={82}
            />
            <SavingsCard
              product="Phone Case (MagSafe)"
              retailer="Amazon"
              retailPrice="$29.99"
              sourcePrice="$3.40"
              percent={89}
            />
            <SavingsCard
              product="USB-C Hub 7-in-1"
              retailer="Walmart"
              retailPrice="$49.99"
              sourcePrice="$12.90"
              percent={74}
            />
            <SavingsCard
              product="Silicone Kitchen Tongs"
              retailer="Amazon"
              retailPrice="$14.99"
              sourcePrice="$2.10"
              percent={86}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST / POWERED BY ═══════════════ */}
      <section className="relative z-10 border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-[800px] text-center">
          <p className="mb-10 text-sm font-medium uppercase tracking-widest text-white/30">
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {/* Perplexity */}
            <div className="flex items-center gap-2.5 text-white/40 transition-colors hover:text-white/70">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="currentColor"
              >
                <path d="M12 1L3 7v10l9 6 9-6V7l-9-6zm0 2.18L18.36 7.5 12 11.82 5.64 7.5 12 3.18zM5 9.06l6 4v7.76l-6-4V9.06zm8 11.76v-7.76l6-4v7.76l-6 4z" />
              </svg>
              <span className="text-lg font-semibold tracking-tight">
                Perplexity
              </span>
            </div>
            {/* Bright Data */}
            <div className="flex items-center gap-2.5 text-white/40 transition-colors hover:text-white/70">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16z" />
                <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 2a4 4 0 110 8 4 4 0 010-8z" />
              </svg>
              <span className="text-lg font-semibold tracking-tight">
                Bright Data
              </span>
            </div>
            {/* OpenAI */}
            <div className="flex items-center gap-2.5 text-white/40 transition-colors hover:text-white/70">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="currentColor"
              >
                <path d="M20.74 7.6a5.14 5.14 0 00-.44-4.24A5.2 5.2 0 0014.68.85a5.14 5.14 0 00-3.89 1.78 5.14 5.14 0 00-3.43-1.3A5.2 5.2 0 002.2 4.47a5.14 5.14 0 00.63 6.05 5.14 5.14 0 00.44 4.24 5.2 5.2 0 005.62 2.51 5.14 5.14 0 003.89-1.78 5.14 5.14 0 003.43 1.3 5.2 5.2 0 005.16-3.14 5.14 5.14 0 00-.63-6.05z" />
              </svg>
              <span className="text-lg font-semibold tracking-tight">
                OpenAI
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section
        id="about"
        className="relative z-10 border-t border-white/5 px-6 py-24"
      >
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Built at TreeHacks 2026
          </h2>
          <p className="text-base leading-relaxed text-white/50">
            Sentinel started as a question: why do we pay 5&ndash;10x markup
            on everyday products when the same item exists at a fraction of the
            price? We built an AI-powered investigation board that traces
            products back to their original manufacturers and exposes the real
            cost — so you never overpay again.
          </p>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-white/40">
            <Shield className="h-4 w-4" />
            <span className="text-sm">
              Sentinel &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#" className="transition-colors hover:text-white/60">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-white/60">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-white/60">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
