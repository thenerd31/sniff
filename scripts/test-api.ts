#!/usr/bin/env node
// scripts/test-api.ts
// Hit the live Next.js API routes and pretty-print results.
// Requires `npm run dev` to be running on PORT (default 3000).
//
// Usage:
//   npm run test:api refine "I want a jacket"
//   npm run test:api shop "Sony WH-1000XM5 headphones"
//   npm run test:api investigate "https://www.amazon.com/dp/B0863TXGM3"
//   npm run test:api compare "https://www.amazon.com/dp/B0863TXGM3"
//
// Subcommands:
//   refine <query>          — POST /api/shop/refine (multi-turn, loops until ready)
//   shop <query>            — POST /api/shop (SSE stream)
//   investigate <url>       — POST /api/investigate (SSE stream)
//   compare <url>           — POST /api/compare (SSE stream)

const BASE = `http://localhost:${process.env.PORT ?? 3000}`;

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  magenta:"\x1b[35m",
  gray:   "\x1b[90m",
};

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

// ── SSE stream reader ─────────────────────────────────────────────────────────
// Reads a text/event-stream response line by line and fires onEvent for each
// complete "event: X\ndata: {...}" pair.

async function readSSE(
  res: Response,
  onEvent: (event: string, data: unknown) => void
): Promise<void> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep incomplete last line

    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        const raw = line.slice(5).trim();
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          // Sentinel SSE format: { event, data } are wrapped inside the data payload
          // e.g.  data: {"event":"narration","data":{"text":"..."}}
          if (typeof parsed.event === "string" && "data" in parsed) {
            onEvent(parsed.event, parsed.data);
          } else {
            onEvent(currentEvent, parsed);
          }
        } catch {
          onEvent(currentEvent, raw);
        }
        currentEvent = "message";
      }
    }
  }
}

// ── Event printer for shop/investigate/compare streams ───────────────────────

function printSSEEvent(event: string, data: unknown): boolean {
  const d = data as Record<string, unknown>;

  switch (event) {
    case "narration":
      console.log(`  ${C.cyan}[narration]${C.reset} ${d.text}`);
      break;

    case "product":
      console.log(
        `  ${C.green}[product]${C.reset}   ${C.bold}${String(d.retailer).padEnd(16)}${C.reset}` +
        ` $${Number(d.price).toFixed(2).padStart(8)}  ${String(d.title).slice(0, 50)}`
      );
      console.log(`             ${C.gray}${d.url}${C.reset}`);
      break;

    case "fraud_check": {
      const check = d.check as Record<string, unknown>;
      const badge =
        check.status === "failed"  ? `${C.red}✗ FAIL${C.reset}` :
        check.status === "warning" ? `${C.yellow}⚠ WARN${C.reset}` :
        check.status === "passed"  ? `${C.green}✓ PASS${C.reset}` :
                                     `${C.gray}… SKIP${C.reset}`;
      console.log(
        `  ${C.dim}[check]${C.reset}     ${badge}  ${String(check.name).padEnd(22)} ` +
        `${C.gray}${check.detail}${C.reset}`
      );
      break;
    }

    case "verdict": {
      const vc =
        d.verdict === "danger"  ? C.red :
        d.verdict === "caution" ? C.yellow :
        d.verdict === "trusted" ? C.green : C.gray;
      console.log(
        `  ${C.magenta}[verdict]${C.reset}   ${vc}${C.bold}${String(d.verdict).toUpperCase()}${C.reset}` +
        `  trust: ${d.trustScore}/100`
      );
      break;
    }

    case "best_pick":
      console.log(
        `  ${C.green}[best_pick]${C.reset} productId=${d.productId}` +
        (d.savings ? `  savings=$${Number(d.savings).toFixed(2)}` : "")
      );
      break;

    case "all_products":
      console.log(`  ${C.dim}[all_products]${C.reset} found ${d.count} listings`);
      break;

    case "card":
      console.log(
        `  ${C.cyan}[card]${C.reset}      ${C.bold}${d.title}${C.reset}` +
        (d.severity ? `  [${d.severity}]` : "")
      );
      if (d.detail) console.log(`             ${C.gray}${String(d.detail).slice(0, 100)}${C.reset}`);
      break;

    case "connection":
      console.log(`  ${C.dim}[connection]${C.reset} ${d.from} → ${d.to}  ${d.label ?? ""}`);
      break;

    case "threat_score":
      console.log(`  ${C.red}[threat]${C.reset}    score=${d.score}  label=${d.label}`);
      break;

    case "done":
      console.log(`  ${C.green}[done]${C.reset}      ${d.summary ?? JSON.stringify(d)}`);
      return true; // signal stream end

    case "error":
      console.log(`  ${C.red}[error]${C.reset}     ${d.message}`);
      return true;

    default:
      console.log(`  ${C.gray}[${event}]${C.reset} ${JSON.stringify(data)}`);
  }
  return false;
}

// ── Subcommand: refine ────────────────────────────────────────────────────────
// Loops POST /api/shop/refine until type="ready", simulating a user who picks
// the first option each time.

async function cmdRefine(query: string): Promise<void> {
  hr("POST /api/shop/refine  (Guided Discovery loop)");
  console.log(`  Query: ${C.cyan}"${query}"${C.reset}\n`);

  type ConvMsg = { role: "user" | "assistant"; content: string };
  const history: ConvMsg[] = [];
  let round = 0;

  while (true) {
    round++;
    const body: Record<string, unknown> = { query, history };

    const res = await fetch(`${BASE}/api/shop/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`${C.red}HTTP ${res.status}:${C.reset} ${text}`);
      process.exit(1);
    }

    const result = await res.json() as Record<string, unknown>;
    console.log(`  ${C.dim}[round ${round}]${C.reset} reasoning: ${C.gray}${result.internalReasoning}${C.reset}`);

    if (result.type === "ready") {
      hr("Result: ready to search");
      console.log(`  ${C.green}refinedQuery:${C.reset}  ${result.refinedQuery}`);
      console.log(`  ${C.green}searchQueries:${C.reset}`);
      for (const q of result.searchQueries as string[]) {
        console.log(`    • ${q}`);
      }
      break;
    }

    if (result.type === "question") {
      const opts = result.options as Array<{ label: string; description: string; value: string }>;
      console.log(`\n  ${C.yellow}Question:${C.reset} ${result.question}`);
      for (let i = 0; i < opts.length; i++) {
        const marker = i === 0 ? `${C.green}→${C.reset}` : " ";
        console.log(`  ${marker} ${C.bold}${opts[i].label}${C.reset}  ${C.gray}${opts[i].description}${C.reset}`);
      }

      // Auto-pick the first option
      const chosen = opts[0];
      console.log(`\n  ${C.dim}[auto-selecting first option: "${chosen.label}"]${C.reset}\n`);
      history.push({ role: "assistant", content: result.question as string });
      history.push({ role: "user",      content: chosen.value });
    }
  }
}

// ── Subcommand: shop ──────────────────────────────────────────────────────────

async function cmdShop(query: string): Promise<void> {
  hr("POST /api/shop  (SSE stream)");
  console.log(`  Query: ${C.cyan}"${query}"${C.reset}\n`);

  const res = await fetch(`${BASE}/api/shop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: query }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`${C.red}HTTP ${res.status}:${C.reset} ${text}`);
    process.exit(1);
  }

  await readSSE(res, (event, data) => {
    printSSEEvent(event, data);
  });
}

// ── Subcommand: investigate ───────────────────────────────────────────────────

async function cmdInvestigate(url: string): Promise<void> {
  hr("POST /api/investigate  (SSE stream)");
  console.log(`  URL: ${C.cyan}${url}${C.reset}\n`);

  const res = await fetch(`${BASE}/api/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`${C.red}HTTP ${res.status}:${C.reset} ${text}`);
    process.exit(1);
  }

  await readSSE(res, (event, data) => {
    printSSEEvent(event, data);
  });
}

// ── Subcommand: compare ───────────────────────────────────────────────────────

async function cmdCompare(url: string): Promise<void> {
  hr("POST /api/compare  (SSE stream)");
  console.log(`  URL: ${C.cyan}${url}${C.reset}\n`);

  const res = await fetch(`${BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`${C.red}HTTP ${res.status}:${C.reset} ${text}`);
    process.exit(1);
  }

  await readSSE(res, (event, data) => {
    printSSEEvent(event, data);
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

const [,, cmd, arg] = process.argv;

console.log(`\n${C.bold}${C.cyan}  Sentinel — API Test${C.reset}  ${C.gray}${BASE}${C.reset}\n`);

if (!cmd || !arg) {
  console.log(`Usage:
  npm run test:api refine      "<query>"     — query refinement loop
  npm run test:api shop        "<query>"     — product search + fraud checks
  npm run test:api investigate "<url>"       — URL investigation
  npm run test:api compare     "<url>"       — price comparison
`);
  process.exit(0);
}

(async () => {
  try {
    switch (cmd) {
      case "refine":      await cmdRefine(arg);      break;
      case "shop":        await cmdShop(arg);        break;
      case "investigate": await cmdInvestigate(arg); break;
      case "compare":     await cmdCompare(arg);     break;
      default:
        console.error(`${C.red}Unknown command: ${cmd}${C.reset}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n${C.red}${C.bold}Fatal:${C.reset}`, err);
    process.exit(1);
  }
  console.log();
})();
