"use client";

import { useEffect } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import type { ProductResult, FraudCheck, ProductVerdict } from "@/types";
import "./results.css";

// ── Mock Data ────────────────────────────────────────────────────────────

const mockProducts: ProductResult[] = [
  {
    id: "p1",
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    price: 278.0,
    currency: "USD",
    retailer: "Amazon",
    domain: "amazon.com",
    url: "https://amazon.com/dp/B09XS7JWHH",
    imageUrl: "",
    rating: 4.7,
    reviewCount: 12453,
    snippet: "Industry-leading noise cancellation with Auto NC Optimizer",
  },
  {
    id: "p2",
    title: "Sony WH-1000XM5 Headphones - Brand New Sealed",
    price: 189.99,
    currency: "USD",
    retailer: "BestAudioDeals",
    domain: "bestaudiodeals.shop",
    url: "https://bestaudiodeals.shop/sony-xm5",
    rating: 4.9,
    reviewCount: 23,
    snippet: "Unbeatable price! Limited stock available",
  },
  {
    id: "p3",
    title: "Sony WH-1000XM5 Wireless Headphones Black",
    price: 295.0,
    currency: "USD",
    retailer: "Best Buy",
    domain: "bestbuy.com",
    url: "https://bestbuy.com/sony-wh1000xm5",
    rating: 4.6,
    reviewCount: 8921,
    snippet: "Free shipping, 15-day return policy",
  },
  {
    id: "p4",
    title: "XM5 Sony Headphones CHEAP!! Free AirPods included",
    price: 129.99,
    currency: "USD",
    retailer: "DealzKing",
    domain: "dealzking.xyz",
    url: "https://dealzking.xyz/sony-xm5-bundle",
    rating: 5.0,
    reviewCount: 3,
    snippet: "Best deal online! Buy now before it's gone!",
  },
  {
    id: "p5",
    title: "Sony WH-1000XM5/S Headphones Silver",
    price: 289.99,
    currency: "USD",
    retailer: "B&H Photo",
    domain: "bhphotovideo.com",
    url: "https://bhphotovideo.com/sony-xm5",
    rating: 4.7,
    reviewCount: 3412,
    snippet: "Authorized Sony dealer, full warranty",
  },
  {
    id: "p6",
    title: "Sony WH1000XM5 - Refurbished Like New",
    price: 159.0,
    currency: "USD",
    retailer: "QuickFlipElectronics",
    domain: "quickflipelectronics.co",
    url: "https://quickflipelectronics.co/xm5",
    rating: 4.2,
    reviewCount: 8,
    snippet: "Refurbished with 30-day guarantee",
  },
];

const mockChecks: Record<string, FraudCheck[]> = {
  p1: [
    { name: "Retailer Reputation", status: "passed", detail: "Amazon is a globally trusted marketplace with buyer protection.", severity: 0.05 },
    { name: "Safety Database", status: "passed", detail: "No flags in Google Safe Browsing or PhishTank databases.", severity: 0.02 },
    { name: "Community Sentiment", status: "passed", detail: "Overwhelmingly positive sentiment across Reddit and forums.", severity: 0.08 },
    { name: "Brand Impersonation", status: "passed", detail: "Sold and shipped by Amazon.com. Verified business entity.", severity: 0.03 },
  ],
  p2: [
    { name: "Retailer Reputation", status: "warning", detail: "Domain registered 12 days ago. No established reputation.", severity: 0.72 },
    { name: "Safety Database", status: "failed", detail: "Domain flagged by 2 community scam databases.", severity: 0.85 },
    { name: "Community Sentiment", status: "failed", detail: "Multiple Reddit posts warning about this domain.", severity: 0.9 },
    { name: "Brand Impersonation", status: "failed", detail: "No business registration found. WHOIS privacy enabled.", severity: 0.88 },
  ],
  p3: [
    { name: "Retailer Reputation", status: "passed", detail: "Best Buy is a Fortune 100 company with 1000+ stores.", severity: 0.03 },
    { name: "Safety Database", status: "passed", detail: "Clean across all safety databases.", severity: 0.01 },
    { name: "Community Sentiment", status: "passed", detail: "Strong positive reputation in consumer electronics.", severity: 0.05 },
    { name: "Brand Impersonation", status: "passed", detail: "Publicly traded company (NYSE: BBY). Verified entity.", severity: 0.02 },
  ],
  p4: [
    { name: "Retailer Reputation", status: "failed", detail: "Domain registered 3 days ago via anonymous registrar.", severity: 0.95 },
    { name: "Safety Database", status: "failed", detail: "Flagged by Google Safe Browsing as deceptive.", severity: 0.98 },
    { name: "Community Sentiment", status: "failed", detail: "Zero legitimate mentions. Suspicious social media ads only.", severity: 0.92 },
    { name: "Brand Impersonation", status: "failed", detail: "No business entity. Uses .xyz TLD common in scam sites.", severity: 0.96 },
  ],
  p5: [
    { name: "Retailer Reputation", status: "passed", detail: "B&H Photo is a trusted NYC-based electronics retailer since 1973.", severity: 0.04 },
    { name: "Safety Database", status: "passed", detail: "No flags in any safety databases.", severity: 0.01 },
    { name: "Community Sentiment", status: "passed", detail: "Highly recommended by photography and audio communities.", severity: 0.06 },
    { name: "Brand Impersonation", status: "passed", detail: "Authorized Sony dealer. Verified business with physical store.", severity: 0.03 },
  ],
  p6: [
    { name: "Retailer Reputation", status: "warning", detail: "Domain registered 45 days ago. Limited track record.", severity: 0.55 },
    { name: "Safety Database", status: "warning", detail: "Not flagged, but not enough data for confidence.", severity: 0.4 },
    { name: "Community Sentiment", status: "warning", detail: "One neutral Reddit mention. No established presence.", severity: 0.5 },
    { name: "Brand Impersonation", status: "warning", detail: "Small business registration found, but no physical address.", severity: 0.48 },
  ],
};

const mockVerdicts: Record<string, { verdict: ProductVerdict; trustScore: number }> = {
  p1: { verdict: "trusted", trustScore: 96 },
  p2: { verdict: "danger", trustScore: 15 },
  p3: { verdict: "trusted", trustScore: 94 },
  p4: { verdict: "danger", trustScore: 5 },
  p5: { verdict: "trusted", trustScore: 93 },
  p6: { verdict: "caution", trustScore: 52 },
};

// ── Test Page Component ──────────────────────────────────────────────────

export default function ColumnDesignPage() {
  const store = useResultsStore();

  // Seed mock data on mount
  useEffect(() => {
    store.reset();

    // Add products
    mockProducts.forEach((p) => store.addProduct(p));

    // Add fraud checks
    Object.entries(mockChecks).forEach(([productId, checks]) => {
      checks.forEach((check) => store.addFraudCheck(productId, check));
    });

    // Add verdicts
    Object.entries(mockVerdicts).forEach(([productId, v]) => {
      store.setVerdict(productId, v.verdict, v.trustScore);
    });

    // Set best pick
    store.setBestPick("p1");

    // Transition to two-columns after a brief delay
    setTimeout(() => {
      store.setPhase("two-columns");
    }, 300);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Header bar for test page */}
      <div
        className="sticky top-0 z-50 backdrop-blur-md border-b px-6 py-3 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.8)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: "var(--brand)" }}>
            Sentinel
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{
              background: "var(--brand-light)",
              color: "var(--brand)",
            }}
          >
            column_design test
          </span>
        </div>

        {/* Phase controls */}
        <div className="flex items-center gap-2">
          {(["two-columns", "wiping", "shuffling", "final-list"] as const).map((p) => (
            <button
              key={p}
              onClick={() => store.setPhase(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl transition-all"
              style={{
                background: store.phase === p ? "var(--brand)" : "var(--surface)",
                color: store.phase === p ? "white" : "var(--text-muted)",
                border: `1px solid ${store.phase === p ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => {
              store.reset();
              mockProducts.forEach((p) => store.addProduct(p));
              Object.entries(mockChecks).forEach(([id, checks]) => {
                checks.forEach((c) => store.addFraudCheck(id, c));
              });
              Object.entries(mockVerdicts).forEach(([id, v]) => {
                store.setVerdict(id, v.verdict, v.trustScore);
              });
              store.setBestPick("p1");
              setTimeout(() => store.setPhase("two-columns"), 100);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              borderColor: "var(--border)",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Simulated top-half placeholder */}
      <div
        className="flex items-center justify-center py-16 border-b"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: "var(--text-subtle)" }}>
            ↑ Davyn&apos;s Top Half (Research/Thinking UI) ↑
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>
            The bottom half slides in below after research completes
          </p>
        </div>
      </div>

      {/* Bottom half — Results UI */}
      <ResultsContainer />
    </div>
  );
}
