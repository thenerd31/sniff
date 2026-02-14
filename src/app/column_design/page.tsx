"use client";

import { useEffect, useState } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import type { ProductResult, FraudCheck, ProductVerdict } from "@/types";
import "./results.css";

// ── Mock Data — Simulates what the agent SSE would stream ────────────────

const mockProducts: ProductResult[] = [
  {
    id: "p1",
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    price: 278.0,
    currency: "USD",
    retailer: "Amazon",
    domain: "amazon.com",
    url: "https://amazon.com/dp/B09XS7JWHH",
    imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg",
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
    imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg",
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
    imageUrl: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6505/6505727_sd.jpg",
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
    imageUrl: "",
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
    imageUrl: "https://m.media-amazon.com/images/I/41K5m5LHXAL._AC_SL1500_.jpg",
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
    imageUrl: "",
    rating: 4.2,
    reviewCount: 8,
    snippet: "Refurbished with 30-day guarantee",
  },
  {
    id: "p7",
    title: "Sony WH-1000XM5 Noise Cancelling Wireless",
    price: 269.0,
    currency: "USD",
    retailer: "Walmart",
    domain: "walmart.com",
    url: "https://walmart.com/ip/sony-wh1000xm5",
    imageUrl: "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg",
    rating: 4.5,
    reviewCount: 6234,
    snippet: "Free next-day delivery on orders over $35",
  },
  {
    id: "p8",
    title: "SONY XM5 Premium Headphones - LOWEST PRICE GUARANTEED",
    price: 99.99,
    currency: "USD",
    retailer: "ElectroSavvyDeals",
    domain: "electrosavvydeals.net",
    url: "https://electrosavvydeals.net/xm5-deal",
    imageUrl: "",
    rating: 4.8,
    reviewCount: 7,
    snippet: "We beat any price! 100% satisfaction guaranteed!",
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
    { name: "Retailer Reputation", status: "passed", detail: "Best Buy is a Fortune 100 company with 1,000+ stores.", severity: 0.03 },
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
  p7: [
    { name: "Retailer Reputation", status: "passed", detail: "Walmart is the world's largest retailer with comprehensive buyer protection.", severity: 0.04 },
    { name: "Safety Database", status: "passed", detail: "No flags across any safety databases.", severity: 0.01 },
    { name: "Community Sentiment", status: "passed", detail: "Well-known retailer with strong consumer trust.", severity: 0.06 },
    { name: "Brand Impersonation", status: "passed", detail: "Fortune 1 company (NYSE: WMT). Verified entity.", severity: 0.02 },
  ],
  p8: [
    { name: "Retailer Reputation", status: "failed", detail: "Domain registered 8 days ago. No online presence before this week.", severity: 0.88 },
    { name: "Safety Database", status: "failed", detail: "Flagged by PhishTank and community scam reports.", severity: 0.91 },
    { name: "Community Sentiment", status: "failed", detail: "Reddit scam alert thread with 200+ upvotes.", severity: 0.87 },
    { name: "Brand Impersonation", status: "failed", detail: "Fake address listed. No business registration found.", severity: 0.93 },
  ],
};

const mockVerdicts: Record<string, { verdict: ProductVerdict; trustScore: number }> = {
  p1: { verdict: "trusted", trustScore: 96 },
  p2: { verdict: "danger", trustScore: 15 },
  p3: { verdict: "trusted", trustScore: 94 },
  p4: { verdict: "danger", trustScore: 5 },
  p5: { verdict: "trusted", trustScore: 93 },
  p6: { verdict: "caution", trustScore: 52 },
  p7: { verdict: "trusted", trustScore: 92 },
  p8: { verdict: "danger", trustScore: 8 },
};

// ── Seeding function (pure, no hooks) ────────────────────────────────────
function seedStore(store: ReturnType<typeof useResultsStore.getState>) {
  store.reset();

  let delay = 0;
  mockProducts.forEach((product) => {
    delay += 80;
    setTimeout(() => useResultsStore.getState().addProduct(product), delay);

    const checks = mockChecks[product.id] || [];
    checks.forEach((check) => {
      delay += 40;
      setTimeout(() => useResultsStore.getState().addFraudCheck(product.id, check), delay);
    });

    const verdict = mockVerdicts[product.id];
    if (verdict) {
      delay += 60;
      setTimeout(
        () => useResultsStore.getState().setVerdict(product.id, verdict.verdict, verdict.trustScore),
        delay
      );
    }
  });

  setTimeout(() => {
    useResultsStore.getState().setBestPick("p1");
    useResultsStore.getState().setPhase("two-columns");
  }, delay + 200);
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function ColumnDesignPage() {
  // Use useState initializer to seed exactly once (immune to React Compiler + Strict Mode)
  const [seeded] = useState(() => {
    // This initializer runs exactly once per component instance, even in Strict Mode
    // Schedule seeding for next tick so it doesn't happen during render
    if (typeof window !== "undefined") {
      setTimeout(() => seedStore(useResultsStore.getState()), 0);
    }
    return true;
  });

  // Suppress unused variable warning
  void seeded;

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Simulated top-half placeholder (Davyn's research UI would be here) */}
      <div
        className="flex items-center justify-center border-b"
        style={{
          background: "linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)",
          borderColor: "var(--border)",
          height: "40vh",
        }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            Sentinel
          </h1>
          <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
            Research complete — scroll down to see your results
          </p>
        </div>
      </div>

      {/* Bottom half — the seamless results flow */}
      <ResultsContainer />
    </div>
  );
}
