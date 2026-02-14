#!/usr/bin/env node
// scripts/test-pipeline.ts
// End-to-end pipeline test: text query → product search → fraud check → seller check
//
// Usage:
//   npm run test:pipeline
//   npm run test:pipeline "Apple AirPods Pro 2"
//   npm run test:pipeline "Nike Air Max 270" 5
//
// Args:
//   argv[2]  — product search query  (default: "Sony WH-1000XM5 wireless headphones")
//   argv[3]  — how many results to check in depth  (default: 3)

import { readFileSync } from "fs";
import { join } from "path";

// ── Load .env.local without requiring dotenv ──────────────────────────────────
function loadEnvFile(filename: string): void {
  try {
    const content = readFileSync(join(process.cwd(), filename), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const raw = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      const val = raw.replace(/^(['"`])([\s\S]*)\1$/, "$2");
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // File not found — rely on existing environment variables
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

// ── Imports (after env is loaded) ────────────────────────────────────────────
import { searchProducts } from "../src/lib/tools/serpSearch";
import { safeBrowsingCheck } from "../src/lib/tools/safe-browsing";
import { scamadviserCheck } from "../src/lib/tools/scamadviser";
import { sellerCheck } from "../src/lib/tools/seller-check";
import type { EvidenceCard, ProductResult } from "../src/types";

// ── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  white:  "\x1b[37m",
  gray:   "\x1b[90m",
};

function severityBadge(s: string): string {
  switch (s) {
    case "critical": return `${C.bold}${C.red}[CRITICAL]${C.reset}`;
    case "warning":  return `${C.bold}${C.yellow}[WARNING] ${C.reset}`;
    case "safe":     return `${C.bold}${C.green}[SAFE]    ${C.reset}`;
    default:         return `${C.bold}${C.gray}[INFO]    ${C.reset}`;
  }
}

function hr(label?: string): void {
  const line = "─".repeat(68);
  if (label) {
    const pad = Math.max(0, 68 - label.length - 2);
    const half = Math.floor(pad / 2);
    console.log(
      C.gray +
      "─".repeat(half) +
      C.reset + C.bold + ` ${label} ` + C.reset +
      C.gray + "─".repeat(pad - half) + C.reset
    );
  } else {
    console.log(C.gray + line + C.reset);
  }
}

function printCard(card: EvidenceCard, indent = "  "): void {
  const badge = severityBadge(card.severity);
  console.log(`${indent}${badge} ${C.bold}${card.title}${C.reset}`);
  if (card.detail) {
    console.log(`${indent}          ${C.gray}${card.detail}${C.reset}`);
  }
  console.log(
    `${indent}          ${C.dim}Source: ${card.source}  confidence: ${(card.confidence * 100).toFixed(0)}%${C.reset}`
  );
}

function printProduct(p: ProductResult, idx: number): void {
  console.log(
    `  ${C.bold}${String(idx + 1).padStart(2)}.${C.reset} ` +
    `${C.cyan}${p.retailer.padEnd(14)}${C.reset} ` +
    `${C.bold}$${p.price.toFixed(2).padStart(8)}${C.reset}  ` +
    `${p.title.slice(0, 50)}`
  );
  console.log(`       ${C.gray}${p.url}${C.reset}`);
  if (p.rating) {
    console.log(
      `       ${C.dim}${p.rating}★  ${(p.reviewCount ?? 0).toLocaleString()} reviews${C.reset}`
    );
  }
}

function aggregateSeverity(cards: EvidenceCard[]): "critical" | "warning" | "safe" | "info" {
  if (cards.some((c) => c.severity === "critical")) return "critical";
  if (cards.some((c) => c.severity === "warning"))  return "warning";
  if (cards.every((c) => c.severity === "safe"))    return "safe";
  return "info";
}

// ── CLI args ─────────────────────────────────────────────────────────────────
const QUERY     = process.argv[2] ?? "Sony WH-1000XM5 wireless headphones";
const CHECK_TOP = Math.max(1, Math.min(10, parseInt(process.argv[3] ?? "3", 10)));

// ── Env var check ─────────────────────────────────────────────────────────────
function checkEnv(): void {
  const vars = [
    ["BRIGHT_DATA_API_KEY",   "Product search (primary)"],
    ["BRIGHT_DATA_SERP_ZONE", "Product search (Bright Data SERP zone)"],
    ["PERPLEXITY_API_KEY",    "Product search (fallback)"],
    ["GOOGLE_SAFE_BROWSING_KEY", "Safe Browsing fraud check"],
    ["SCAMADVISER_API_KEY",   "ScamAdviser fraud check"],
  ] as const;

  const missing: string[] = [];
  const present: string[] = [];
  for (const [key, label] of vars) {
    if (process.env[key]) present.push(`  ${C.green}✓${C.reset} ${key.padEnd(30)} ${C.dim}${label}${C.reset}`);
    else                  missing.push(`  ${C.yellow}○${C.reset} ${key.padEnd(30)} ${C.dim}${label} — will skip${C.reset}`);
  }
  console.log([...present, ...missing].join("\n"));
  console.log();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`\n${C.bold}${C.cyan}  Sentinel — Pipeline Test${C.reset}`);
  console.log(`${C.gray}  Query: "${QUERY}"  |  Depth check: top ${CHECK_TOP}${C.reset}\n`);

  hr("Environment");
  checkEnv();

  // ── Step 1: Product search ────────────────────────────────────────────────
  hr("Step 1 — Product Search");
  console.log(`${C.dim}  Querying Google Shopping via Bright Data (Perplexity fallback)...${C.reset}`);

  const t0 = Date.now();
  let products: ProductResult[];
  try {
    products = await searchProducts([QUERY]);
  } catch (err) {
    console.error(`${C.red}  Search failed: ${err}${C.reset}`);
    process.exit(1);
  }
  const searchMs = Date.now() - t0;

  if (products.length === 0) {
    console.log(
      `${C.yellow}  No products found. Check BRIGHT_DATA_API_KEY / PERPLEXITY_API_KEY.${C.reset}`
    );
    process.exit(0);
  }

  console.log(
    `\n  Found ${C.bold}${products.length}${C.reset} products in ${searchMs}ms. ` +
    `Showing all, deep-checking top ${CHECK_TOP}:\n`
  );

  for (let i = 0; i < products.length; i++) {
    printProduct(products[i], i);
    if (i === CHECK_TOP - 1 && products.length > CHECK_TOP) {
      console.log(`  ${C.gray}  … (${products.length - CHECK_TOP} more not deep-checked)${C.reset}`);
    }
  }

  const toCheck = products.slice(0, CHECK_TOP);

  // ── Step 2: Fraud checks (parallel per product) ───────────────────────────
  hr("Step 2 — Fraud Check");
  console.log(
    `${C.dim}  Running Google Safe Browsing + ScamAdviser on each URL in parallel...${C.reset}\n`
  );

  type FraudResult = { product: ProductResult; safeCard: EvidenceCard; scamCard: EvidenceCard };
  const t1 = Date.now();

  const fraudResults: FraudResult[] = await Promise.all(
    toCheck.map(async (p) => {
      const [safeCard, scamCard] = await Promise.all([
        safeBrowsingCheck(p.url),
        scamadviserCheck(p.url),
      ]);
      return { product: p, safeCard, scamCard };
    })
  );
  const fraudMs = Date.now() - t1;

  for (const { product, safeCard, scamCard } of fraudResults) {
    console.log(`  ${C.bold}${product.retailer}${C.reset}  ${C.gray}${product.url}${C.reset}`);
    printCard(safeCard);
    printCard(scamCard);
    console.log();
  }
  console.log(`  ${C.dim}Fraud checks completed in ${fraudMs}ms${C.reset}`);

  // ── Step 3: Seller checks (sequential — each hits Bright Data Unlocker) ───
  hr("Step 3 — Seller Verification");
  console.log(
    `${C.dim}  Fetching seller pages via Bright Data Web Unlocker, then LLM analysis...${C.reset}\n`
  );

  type SellerResult = { product: ProductResult; card: EvidenceCard };
  const sellerResults: SellerResult[] = [];
  const t2 = Date.now();

  for (const product of toCheck) {
    process.stdout.write(`  ${C.dim}Checking ${product.retailer}...${C.reset}`);
    const tS = Date.now();
    const card = await sellerCheck(product.url);
    process.stdout.write(`  ${C.dim}${Date.now() - tS}ms${C.reset}\n`);
    sellerResults.push({ product, card });
  }
  const sellerMs = Date.now() - t2;

  console.log();
  for (const { product, card } of sellerResults) {
    console.log(`  ${C.bold}${product.retailer}${C.reset}  ${C.gray}${product.url}${C.reset}`);
    printCard(card);
    console.log();
  }
  console.log(`  ${C.dim}Seller checks completed in ${sellerMs}ms${C.reset}`);

  // ── Summary table ─────────────────────────────────────────────────────────
  hr("Summary");
  console.log(
    `  ${"Retailer".padEnd(16)} ${"Price".padStart(8)}  ${"Fraud".padEnd(10)} ${"Seller".padEnd(10)}`
  );
  console.log(`  ${"─".repeat(50)}`);

  for (let i = 0; i < toCheck.length; i++) {
    const p = toCheck[i];
    const f = fraudResults[i];
    const s = sellerResults[i];

    const fraudSev  = aggregateSeverity([f.safeCard, f.scamCard]);
    const sellerSev = s.card.severity;

    function sevEmoji(sev: string): string {
      switch (sev) {
        case "critical": return `${C.red}FAIL${C.reset}`;
        case "warning":  return `${C.yellow}WARN${C.reset}`;
        case "safe":     return `${C.green}PASS${C.reset}`;
        default:         return `${C.gray}INFO${C.reset}`;
      }
    }

    console.log(
      `  ${p.retailer.padEnd(16)} ` +
      `${C.cyan}$${p.price.toFixed(2).padStart(7)}${C.reset}  ` +
      `${sevEmoji(fraudSev).padEnd(10 + 9)}  ` +
      `${sevEmoji(sellerSev)}`
    );
  }

  const totalMs = Date.now() - t0;
  console.log(
    `\n  ${C.dim}Total: ${products.length} found, ${CHECK_TOP} checked, ${totalMs}ms elapsed${C.reset}\n`
  );
}

main().catch((err) => {
  console.error(`\n${C.red}${C.bold}Fatal error:${C.reset} ${err}`);
  process.exit(1);
});
