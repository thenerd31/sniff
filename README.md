<p align="center">
  <img src="https://img.shields.io/badge/TreeHacks-2026-orange?style=for-the-badge" alt="TreeHacks 2026" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/OpenAI-gpt--5--mini-412991?style=for-the-badge&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

<h1 align="center">Sniff</h1>
<h3 align="center">Your loyal AI shopping guard dog.<br/>It fetches the deals. It sniffs out the scams.</h3>

<p align="center">
  <a href="https://github.com/thenerd31/sniff"><strong>GitHub</strong></a> &middot;
  <a href="#demo"><strong>Live Demo</strong></a> &middot;
  <a href="#how-it-works"><strong>How It Works</strong></a>
</p>

---

## The Problem

Online shopping is a trust decision made in seconds with almost no usable information.

- **$12.5B** lost to online fraud in 2024 — up 25% year-over-year (FTC)
- **859,000** complaints with $16B in losses (Internet Crime Complaint Center)
- **1 in 5** US adults have lost money to an online scam
- **75%** of victims never report it

Scam sites don't look like scams anymore. They have polished storefronts, real-looking checkout flows, and fake social proof indistinguishable from the real thing. "Safe shopping" today requires cross-referencing domain age, SSL validity, safety databases, community sentiment, and seller verification — work nobody has time to do while a countdown timer pressures them to buy.

**Sniff closes that gap.** Safety becomes an automatic layer of commerce, not a burden.

---

## What It Does

Tell Sniff what you want. It goes to work.

### Guided Discovery
Sniff starts a conversation, not a search. It asks the right clarifying questions — gender, style, budget, brand — to understand exactly what you need before searching. Each answer feeds back into the agent's understanding.

### Multi-Retailer Search
Searches across Google Shopping, pulling real listings from Amazon, Best Buy, Walmart, Nordstrom, and dozens more. Dead links get filtered before you ever see them.

### 5 Parallel Fraud Checks Per Listing

| Check | What It Does |
|---|---|
| **Retailer Reputation** | WHOIS domain age, registrar signals, suspicious TLDs |
| **Safety Database** | Google Safe Browsing + ScamAdviser threat intelligence |
| **Community Sentiment** | Reddit mentions, scam reports, real user experiences |
| **Brand Impersonation** | Detects typosquatting and lookalike domains |
| **Page Red Flags** | Urgency tactics, missing policies, suspicious payment methods |

### Real-Time Streaming
Products appear, fraud checks fill in, verdicts land — all live via Server-Sent Events. You watch the investigation happen, not a loading spinner.

### Trust Verdict
Every listing gets a verdict (**trusted** / **caution** / **danger**) and a trust score (0–100). Sniff recommends the **best pick** — the cheapest option among the safest options.

### Purge & Sort
Tap **PURGE CURSED** and flagged listings spiral into a black hole. Safe results shuffle into price order. The best deal gets crowned.

---

## How It Works

```
User Query
    │
    ▼
┌─────────────────────┐
│   Guided Discovery   │  gpt-4o-mini decides: specific enough to search,
│   (Multi-Turn Agent) │  or ask the highest-info-gain clarifying question?
└─────────┬───────────┘
          │  query refined
          ▼
┌─────────────────────┐
│   Product Search     │  Bright Data SERP → Google Shopping
│                      │  Perplexity Sonar fallback
└─────────┬───────────┘
          │  N products
          ▼
┌─────────────────────────────────────────────┐
│         Parallel Fraud Validation (×N)       │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  WHOIS   │ │  Safe    │ │  Reddit      │ │
│  │  Lookup  │ │  Browsing│ │  Sentiment   │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────────┐ ┌────────────────────────┐ │
│  │  Brand       │ │  Page Red Flags        │ │
│  │  Impersonation│ │  (Scraping)           │ │
│  └──────────────┘ └────────────────────────┘ │
└─────────────────────┬───────────────────────┘
                      │  scored & verdicted
                      ▼
              ┌───────────────┐
              │  Best Pick     │  cheapest × safest
              │  Recommendation│
              └───────────────┘
```

All steps stream to the frontend as they happen via SSE.

---

## The Agent Loop

Sniff isn't a single API call — it's a **multi-turn agent** that accumulates context and adapts across steps.

**Turn 1 — Understand intent:** The query refiner decides if the request is specific enough to search, or asks the highest-information-gain clarifying question. It tracks which dimensions it's covered (budget, brand, style) and picks the most useful unanswered one.

**Turn 2 — Search & validate:** Searches across retailers, validates every URL for reachability, streams results. Holds all products in working memory while fraud checks run in parallel.

**Turn 3 — Investigate & score:** Orchestrates 5 independent tools concurrently per listing, computes weighted trust verdicts. Price anomaly detection compares each listing against the trusted-retailer median — a $49 pair of headphones only gets flagged if trusted retailers sell it for $250+.

**Turn 4 — Recommend:** Synthesizes trust scores, prices, and fraud signals to recommend the best deal. The entire chain streams live.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript (strict) |
| **Styling** | Tailwind CSS 4, Framer Motion, pixel-art game aesthetic |
| **State** | Zustand |
| **AI** | OpenAI gpt-5-mini (fraud analysis, tool orchestration), gpt-4o-mini (query refinement) |
| **Search** | Bright Data SERP API (Google Shopping), Perplexity Sonar (price research fallback) |
| **Scraping** | Bright Data Web Unlocker, Browserbase + Stagehand (AI browser automation) |
| **Safety APIs** | Google Safe Browsing, ScamAdviser |
| **Deployment** | Vercel (SSE streaming, edge-optimized) |

**React Compiler** enabled for production performance. **150+ verified retailer allowlist** for instant trust decisions on major domains.

---

## Architecture

```
src/
├── app/
│   └── api/
│       ├── shop/           POST — SSE stream: product search + fraud checks
│       │   └── refine/     POST — JSON: guided discovery query refinement
│       ├── investigate/    POST — SSE stream: full URL investigation
│       ├── compare/        POST — SSE stream: agentic price comparison
│       └── deepen/         POST — SSE stream: drill deeper on a finding
├── lib/
│   ├── shopping-agent.ts          Multi-step shopping pipeline orchestrator
│   ├── agent.ts                   OpenAI Responses API agent loop
│   ├── query-refiner.ts           Guided Discovery engine
│   ├── scoring.ts                 Threat score calculation
│   ├── known-domains.ts           150+ trusted retailer allowlist
│   ├── stream.ts                  SSE streaming utilities
│   └── tools/
│       ├── validate-product.ts    5-check fraud validation per product
│       ├── fraudCheck.ts          Fraud check orchestrator
│       ├── serpSearch.ts          Bright Data SERP → Google Shopping
│       ├── seller-check.ts        Two-step seller page extraction
│       ├── whois.ts               Domain registration analysis
│       ├── ssl.ts                 Certificate validation
│       ├── safe-browsing.ts       Google Safe Browsing API
│       ├── scamadviser.ts         ScamAdviser trust score
│       ├── reddit.ts              Reddit sentiment search
│       ├── brand-impersonation.ts Typosquatting / lookalike detection
│       ├── scraper.ts             Page red flag scanning
│       ├── priceSearch.ts         Perplexity price comparison
│       ├── browserbase.ts         Stagehand AI browser automation
│       └── brightdata.ts          Bright Data structured scraper
├── components/                    Pixel-art UI components, React Flow board
└── types/                         Shared TypeScript interfaces
```

---

## Getting Started

```bash
git clone https://github.com/thenerd31/sniff.git
cd sniff
npm install
```

Set up environment variables:

```env
OPENAI_API_KEY=
BRIGHT_DATA_API_KEY=
BRIGHT_DATA_SERP_ZONE=
BRIGHT_DATA_UNLOCKER_ZONE=
PERPLEXITY_API_KEY=
GOOGLE_SAFE_BROWSING_KEY=
SCAMADVISER_API_KEY=
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
```

```bash
npm run dev        # → localhost:3000
```

### Testing

```bash
# Library-level E2E (no server required)
npm run test:pipeline

# HTTP-level (requires dev server running)
npm run test:api shop "Sony WH-1000XM5 headphones"
npm run test:api investigate "https://example.com"
npm run test:api refine "I want a jacket"
```

---

## What's Next

- **Chrome extension** — investigate any link in-browser before you buy
- **Image search** — snap a photo, Sniff finds it and validates sellers
- **Deeper seller verification** — Stagehand-powered crawling of seller profiles, business registration, physical address verification
- **Price tracking** — monitor prices over time, alert when trusted deals drop

---

## Team

Built at **TreeHacks 2026** by Aswin, Davyn, Manraj, and Yifan.

---

<p align="center">
  <sub>Built with Next.js &middot; React &middot; TypeScript &middot; Tailwind CSS &middot; Framer Motion &middot; Zustand &middot; OpenAI &middot; Bright Data &middot; Perplexity Sonar &middot; Browserbase &middot; Stagehand &middot; Google Safe Browsing &middot; ScamAdviser &middot; Vercel</sub>
</p>
