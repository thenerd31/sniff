"use client";

import { useState, useEffect } from "react";
import { SavedDashboard } from "@/components/dashboard/SavedDashboard";
import { useSavedDashboardStore } from "@/stores/savedDashboardStore";
import type { ProductWithVerdict, FraudCheck } from "@/types";
import type { SavedProductSnapshot } from "@/types/dashboard";
import "./dashboard.css";

// ── Mock Data — 5 saved products with mixed verdicts ─────────────────────

const MOCK_SAVED_PRODUCTS: ProductWithVerdict[] = [
  {
    id: "p1",
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    price: 278.0,
    currency: "USD",
    retailer: "Amazon",
    domain: "amazon.com",
    url: "https://amazon.com/dp/B09XS7JWHH",
    imageUrl:
      "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg",
    rating: 4.7,
    reviewCount: 12453,
    snippet:
      "Industry-leading noise cancellation with Auto NC Optimizer",
    checks: [
      {
        name: "Retailer Reputation",
        status: "passed",
        detail:
          "Amazon is a globally trusted marketplace with buyer protection.",
        severity: 0.05,
      },
      {
        name: "Safety Database",
        status: "passed",
        detail:
          "No flags in Google Safe Browsing or PhishTank databases.",
        severity: 0.02,
      },
      {
        name: "Community Sentiment",
        status: "passed",
        detail:
          "Overwhelmingly positive sentiment across Reddit and forums.",
        severity: 0.08,
      },
      {
        name: "Seller Verification",
        status: "passed",
        detail:
          "Sold and shipped by Amazon.com. Verified business entity.",
        severity: 0.03,
      },
    ] as FraudCheck[],
    verdict: "trusted",
    trustScore: 96,
  },
  {
    id: "p3",
    title: "Sony WH-1000XM5 Wireless Headphones Black",
    price: 295.0,
    currency: "USD",
    retailer: "Best Buy",
    domain: "bestbuy.com",
    url: "https://bestbuy.com/sony-wh1000xm5",
    imageUrl:
      "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6505/6505727_sd.jpg",
    rating: 4.6,
    reviewCount: 8921,
    snippet: "Free shipping, 15-day return policy",
    checks: [
      {
        name: "Retailer Reputation",
        status: "passed",
        detail:
          "Best Buy is a Fortune 100 company with 1,000+ stores.",
        severity: 0.03,
      },
      {
        name: "Safety Database",
        status: "passed",
        detail: "Clean across all safety databases.",
        severity: 0.01,
      },
      {
        name: "Community Sentiment",
        status: "passed",
        detail:
          "Strong positive reputation in consumer electronics.",
        severity: 0.05,
      },
      {
        name: "Seller Verification",
        status: "passed",
        detail:
          "Publicly traded company (NYSE: BBY). Verified entity.",
        severity: 0.02,
      },
    ] as FraudCheck[],
    verdict: "trusted",
    trustScore: 94,
  },
  {
    id: "p7",
    title: "Sony WH-1000XM5 Noise Cancelling Wireless",
    price: 269.0,
    currency: "USD",
    retailer: "Walmart",
    domain: "walmart.com",
    url: "https://walmart.com/ip/sony-wh1000xm5",
    imageUrl:
      "https://m.media-amazon.com/images/I/51aYfwjGRZL._AC_SL1500_.jpg",
    rating: 4.5,
    reviewCount: 6234,
    snippet: "Free next-day delivery on orders over $35",
    checks: [
      {
        name: "Retailer Reputation",
        status: "passed",
        detail:
          "Walmart is the world's largest retailer with comprehensive buyer protection.",
        severity: 0.04,
      },
      {
        name: "Safety Database",
        status: "passed",
        detail: "No flags across any safety databases.",
        severity: 0.01,
      },
      {
        name: "Community Sentiment",
        status: "passed",
        detail:
          "Well-known retailer with strong consumer trust.",
        severity: 0.06,
      },
      {
        name: "Seller Verification",
        status: "passed",
        detail:
          "Fortune 1 company (NYSE: WMT). Verified entity.",
        severity: 0.02,
      },
    ] as FraudCheck[],
    verdict: "trusted",
    trustScore: 92,
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
    checks: [
      {
        name: "Retailer Reputation",
        status: "warning",
        detail:
          "Domain registered 45 days ago. Limited track record.",
        severity: 0.55,
      },
      {
        name: "Safety Database",
        status: "warning",
        detail:
          "Not flagged, but not enough data for confidence.",
        severity: 0.4,
      },
      {
        name: "Community Sentiment",
        status: "warning",
        detail:
          "One neutral Reddit mention. No established presence.",
        severity: 0.5,
      },
      {
        name: "Seller Verification",
        status: "warning",
        detail:
          "Small business registration found, but no physical address.",
        severity: 0.48,
      },
    ] as FraudCheck[],
    verdict: "caution",
    trustScore: 52,
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
    checks: [
      {
        name: "Retailer Reputation",
        status: "failed",
        detail:
          "Domain registered 3 days ago via anonymous registrar.",
        severity: 0.95,
      },
      {
        name: "Safety Database",
        status: "failed",
        detail:
          "Flagged by Google Safe Browsing as deceptive.",
        severity: 0.98,
      },
      {
        name: "Community Sentiment",
        status: "failed",
        detail:
          "Zero legitimate mentions. Suspicious social media ads only.",
        severity: 0.92,
      },
      {
        name: "Seller Verification",
        status: "failed",
        detail:
          "No business entity. Uses .xyz TLD common in scam sites.",
        severity: 0.96,
      },
    ] as FraudCheck[],
    verdict: "danger",
    trustScore: 5,
  },
];

// Stagger savedAt timestamps so sorting by date is meaningful
const SAVED_TIMESTAMPS = [
  "2026-02-14T10:30:00Z",
  "2026-02-13T16:45:00Z",
  "2026-02-13T09:15:00Z",
  "2026-02-12T21:00:00Z",
  "2026-02-12T14:30:00Z",
];

function seedDashboard() {
  // For demo: always re-seed with fresh mock data
  try {
    localStorage.removeItem("sniff-saved-dashboard");
  } catch {}

  // Build the seeded record immutably
  const seeded: Record<string, SavedProductSnapshot> = {};
  MOCK_SAVED_PRODUCTS.forEach((product, i) => {
    seeded[product.id] = {
      id: product.id,
      savedAt: SAVED_TIMESTAMPS[i],
      product,
    };
  });

  // Persist to localStorage
  try {
    localStorage.setItem("sniff-saved-dashboard", JSON.stringify(seeded));
  } catch {}

  // Update store (immutable — triggers re-render)
  useSavedDashboardStore.setState({ savedProducts: seeded });
}

const PIXEL_FONT = "'Press Start 2P', monospace";

// ── Page ─────────────────────────────────────────────────────────────────

export default function DashboardTestPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDashboard();
    setReady(true);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #C8E6B0 65%, #98D982 70%, #5EAA42 85%, #4A8C34 100%)",
      }}
    >
      {/* ── Pixel header bar ──────────────────────────────────────── */}
      <header
        className="relative z-30 flex shrink-0 items-center gap-5 px-6 py-3.5"
        style={{
          borderBottom: "4px solid #1A1A1A",
          background: "#8B6914",
          boxShadow: "0 4px 0 #6B5210",
        }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center"
          style={{ border: "3px solid #1A1A1A", background: "#FFD700" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 13,
            color: "#FFF8E8",
          }}
        >
          Sniff
        </span>

        <div
          className="mx-4 h-6 w-[3px]"
          style={{ background: "#6B5210" }}
        />

        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 11,
            color: "#FFD700",
          }}
        >
          SAVED ITEMS DASHBOARD
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4"
            style={{
              background: "#00CC00",
            }}
          />
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#00CC00",
            }}
          >
            DASHBOARD
          </span>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 py-8">
        {ready ? (
          <SavedDashboard />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 12,
                color: "#8B6914",
                animation: "pixel-blink 1s steps(1) infinite",
              }}
            >
              LOADING...
            </span>
          </div>
        )}
      </div>

      {/* ── Grass / dirt divider ──────────────────────────────────── */}
      <div className="shrink-0">
        <div
          className="h-[4px] w-full"
          style={{ background: "#1A1A1A" }}
        />
        <div
          className="h-6 w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, #4A8C34 0px, #4A8C34 8px, #5EAA42 8px, #5EAA42 16px)",
            imageRendering: "pixelated",
          }}
        />
        <div
          className="h-8 w-full"
          style={{
            background: "linear-gradient(to bottom, #8B7355, #C4A46C)",
          }}
        />
      </div>
    </div>
  );
}
