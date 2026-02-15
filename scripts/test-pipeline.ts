#!/usr/bin/env node
// scripts/test-pipeline.ts
// End-to-end pipeline test:
//   text query → product search → per-product fraud validation → seller check
//
// Usage:
//   npm run test:pipeline
//   npm run test:pipeline "Apple AirPods Pro 2"
//   npm run test:pipeline "Nike Air Max 270" 5
//
// Args:
//   argv[2]  — product search query  (default: "Sony WH-1000XM5 wireless headphones")
//   argv[3]  — how many results to deep-check  (default: 3)

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
import {
  validateProduct,
  computeVerdict,
  computeMedianPrice,
} from "../src/lib/tools/validate-product";
import { sellerCheck } from "../src/lib/tools/seller-check";
import type { EvidenceCard, FraudCheck, ProductResult } from "../src/types";

// ── ANSI colours ─────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

function verdictColor(v: string): string {
  switch (v) {
    case "danger":  return C.red;
    case "caution": return C.yellow;
    case "trusted": return C.green;
    default:        return C.gray;
  }
}

function checkBadge(c: FraudCheck): string {
  switch (c.status) {
    case "failed":  return `${C.red}✗ FAIL${C.reset}`;
    case "warning": return `${C.yellow}⚠ WARN${C.reset}`;
    case "passed":  return `${C.green}✓ PASS${C.reset}`;
    default:        return `${C.gray}… SKIP${C.reset}`;
  }
}

function severityBadge(s: string): string {
  switch (s) {
    case "critical": return `${C.bold}${C.red}[CRITICAL]${C.reset}`;
    case "warning":  return `${C.bold}${C.yellow}[WARNING] ${C.reset}`;
    case "safe":     return `${C.bold}${C.green}[SAFE]    ${C.reset}`;
    default:         return `${C.bold}${C.gray}[INFO]    ${C.reset}`;
  }
}

function hr(label?: string): void {
  if (label) {
    const pad = Math.max(0, 68 - label.length - 2);
    const half = Math.floor(pad / 2);
    console.log(
      C.gray + "─".repeat(half) + C.reset +
      C.bold + ` ${label} ` + C.reset +
      C.gray + "─".repeat(pad - half) + C.reset
    );
  } else {
    console.log(C.gray + "─".repeat(68) + C.reset);
  }
}

function printCard(card: EvidenceCard, indent = "  "): void {
  console.log(`${indent}${severityBadge(card.severity)} ${C.bold}${card.title}${C.reset}`);
  if (card.detail) console.log(`${indent}          ${C.gray}${card.detail}${C.reset}`);
  console.log(`${indent}          ${C.dim}Source: ${card.source}  conf: ${(card.confidence * 100).toFixed(0)}%${C.reset}`);
}

function printProduct(p: ProductResult, idx: number, referencePrice: number): void {
  const priceDiff = referencePrice > 0
    ? Math.round((1 - p.price / referencePrice) * 100)
    : 0;
  const priceNote = priceDiff > 0
    ? ` ${C.yellow}(${priceDiff}% below median)${C.reset}`
    : "";
  console.log(
    `  ${C.bold}${String(idx + 1).padStart(2)}.${C.reset} ` +
    `${C.cyan}${p.retailer.padEnd(14)}${C.reset} ` +
    `${C.bold}$${p.price.toFixed(2).padStart(8)}${C.reset}${priceNote}  ` +
    `${p.title.slice(0, 48)}`
  );
  console.log(`       ${C.gray}${p.url}${C.reset}`);
}

// ── CLI args ─────────────────────────────────────────────────────────────────
const QUERY     = process.argv[2] ?? "Sony WH-1000XM5 wireless headphones";
const CHECK_TOP = Math.max(1, Math.min(10, parseInt(process.argv[3] ?? "3", 10)));

// ── Env var check ─────────────────────────────────────────────────────────────
function checkEnv(): void {
  const vars = [
    ["BRIGHT_DATA_API_KEY",      "Product search (primary)"],
    ["BRIGHT_DATA_SERP_ZONE",    "Product search (Bright Data SERP zone)"],
    ["PERPLEXITY_API_KEY",       "Product search (fallback)"],
    ["OPENAI_API_KEY",           "Semantic domain check (LLM)"],
    ["GOOGLE_SAFE_BROWSING_KEY", "Safety database check"],
    ["SCAMADVISER_API_KEY",      "Safety database check (ScamAdviser)"],
    ["BRIGHT_DATA_UNLOCKER_ZONE","Seller page fetching"],
  ] as const;

  const present: string[] = [];
  const missing: string[] = [];
  for (const [key, label] of vars) {
    if (process.env[key])
      present.push(`  ${C.green}✓${C.reset} ${key.padEnd(30)} ${C.dim}${label}${C.reset}`);
    else
      missing.push(`  ${C.yellow}○${C.reset} ${key.padEnd(30)} ${C.dim}${label} — will skip${C.reset}`);
  }
  console.log([...present, ...missing].join("\n"));
  console.log();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`\n${C.bold}${C.cyan}  Sentinel — Pipeline Test${C.reset}`);
  console.log(`${C.gray}  Query: "${QUERY}"  |  Deep-check: top ${CHECK_TOP}${C.reset}\n`);

  hr("Environment");
  checkEnv();

  // ── Step 1: Product Search ────────────────────────────────────────────────
  hr("Step 1 — Product Search");
  console.log(`${C.dim}  Querying Google Shopping (Bright Data → Perplexity fallback)...${C.reset}`);

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
    console.log(`${C.yellow}  No products found. Check BRIGHT_DATA_API_KEY / PERPLEXITY_API_KEY.${C.reset}`);
    process.exit(0);
  }

  const referencePrice = computeMedianPrice(products);
  console.log(
    `\n  Found ${C.bold}${products.length}${C.reset} products in ${searchMs}ms.` +
    `  Median price: ${C.cyan}$${referencePrice.toFixed(2)}${C.reset}` +
    `  Deep-checking top ${CHECK_TOP}:\n`
  );

  for (let i = 0; i < products.length; i++) {
    printProduct(products[i], i, referencePrice);
    if (i === CHECK_TOP - 1 && products.length > CHECK_TOP) {
      console.log(`  ${C.gray}  … (${products.length - CHECK_TOP} more not deep-checked)${C.reset}`);
    }
  }

  const toCheck = products.slice(0, CHECK_TOP);

  // ── Step 2: Fraud Validation (all 4 checks per product) ──────────────────
  hr("Step 2 — Fraud Validation");
  console.log(`${C.dim}  Checks: Price Anomaly · Semantic Domain · Community Sentiment · Safety DB${C.reset}\n`);

  const t1 = Date.now();

  type ValidationResult = {
    product: ProductResult;
    checks: FraudCheck[];
    verdict: "trusted" | "caution" | "danger";
    trustScore: number;
    fatalFlag?: string;
  };

  const validations: ValidationResult[] = await Promise.all(
    toCheck.map(async (product) => {
      const checks = await validateProduct(product, referencePrice);
      const { verdict, trustScore, fatalFlag } = computeVerdict(checks);
      return { product, checks, verdict, trustScore, fatalFlag };
    })
  );

  const fraudMs = Date.now() - t1;

  for (const { product, checks, verdict, trustScore, fatalFlag } of validations) {
    const vc = verdictColor(verdict);
    console.log(
      `  ${C.bold}${product.retailer}${C.reset}  ` +
      `${C.gray}$${product.price.toFixed(2)}${C.reset}  ` +
      `${vc}${C.bold}${verdict.toUpperCase()}${C.reset}  ` +
      `trust: ${C.bold}${trustScore}${C.reset}/100`
    );
    if (fatalFlag) {
      console.log(`    ${C.bold}${C.red}⚡ FATAL FLAG:${C.reset} ${C.red}${fatalFlag}${C.reset}`);
    }
    for (const check of checks) {
      console.log(`    ${checkBadge(check)}  ${check.name.padEnd(22)}  ${C.gray}${check.detail}${C.reset}`);
    }
    console.log();
  }
  console.log(`  ${C.dim}Fraud validation completed in ${fraudMs}ms${C.reset}`);

  // ── Step 3: Seller Verification (sequential — each hits Bright Data Unlocker)
  hr("Step 3 — Seller Verification");
  console.log(`${C.dim}  Fetching seller pages via Bright Data Web Unlocker + LLM analysis...${C.reset}\n`);

  type SellerResult = { product: ProductResult; card: EvidenceCard };
  const sellerResults: SellerResult[] = [];
  const t2 = Date.now();

  for (const product of toCheck) {
    process.stdout.write(`  ${C.dim}Checking ${product.retailer.padEnd(16)}${C.reset}`);
    const tS = Date.now();
    const card = await sellerCheck(product.url);
    process.stdout.write(`  ${C.dim}${Date.now() - tS}ms${C.reset}\n`);
    sellerResults.push({ product, card });
  }

  console.log();
  for (const { product, card } of sellerResults) {
    console.log(`  ${C.bold}${product.retailer}${C.reset}  ${C.gray}${product.url}${C.reset}`);
    printCard(card);
    console.log();
  }
  console.log(`  ${C.dim}Seller checks completed in ${Date.now() - t2}ms${C.reset}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  hr("Summary");
  console.log(
    `  ${"Retailer".padEnd(16)} ${"Price".padStart(9)}  ` +
    `${"Fraud Verdict".padEnd(16)} ${"Trust".padStart(5)}  ${"Seller".padEnd(10)}`
  );
  console.log(`  ${"─".repeat(63)}`);

  for (let i = 0; i < toCheck.length; i++) {
    const p  = toCheck[i];
    const v  = validations[i];
    const s  = sellerResults[i];
    const vc = verdictColor(v.verdict);

    function sellerBadge(sev: string): string {
      switch (sev) {
        case "critical": return `${C.red}FAIL${C.reset}`;
        case "warning":  return `${C.yellow}WARN${C.reset}`;
        case "safe":     return `${C.green}PASS${C.reset}`;
        default:         return `${C.gray}INFO${C.reset}`;
      }
    }

    console.log(
      `  ${p.retailer.padEnd(16)} ` +
      `${C.cyan}$${p.price.toFixed(2).padStart(8)}${C.reset}  ` +
      `${vc}${v.verdict.padEnd(15)}${C.reset} ` +
      `${String(v.trustScore).padStart(5)}  ` +
      `${sellerBadge(s.card.severity)}`
    );
  }

  const trusted = validations.filter((v) => v.verdict === "trusted").length;
  const danger  = validations.filter((v) => v.verdict === "danger").length;
  const totalMs = Date.now() - t0;

  console.log(
    `\n  ${C.green}${trusted} trusted${C.reset}  ` +
    (danger > 0 ? `${C.red}${danger} dangerous${C.reset}  ` : "") +
    `${products.length} total  ${C.dim}${totalMs}ms elapsed${C.reset}\n`
  );
}

main().catch((err) => {
  console.error(`\n${C.red}${C.bold}Fatal error:${C.reset} ${err}`);
  process.exit(1);
});
