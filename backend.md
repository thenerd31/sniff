# Backend Reference

Quick reference for Davyn (frontend), Aswin (agent), and Manraj (reports) to integrate with the backend.

## API Endpoints

All endpoints return **Server-Sent Events (SSE)** streams. Use `EventSource` or `fetch` with stream reading on the frontend.

### `POST /api/investigate`

Starts a new investigation. This is Turn 1.

```json
{ "url": "https://suspicious-site.com" }
```

### `POST /api/deepen`

Continues an existing investigation (Turn 2+). The agent receives all prior evidence as context and focuses on a specific area.

```json
{
  "investigationId": "uuid-from-done-event",
  "focus": "seller" | "reviews" | "business" | "alternatives" | "price_history"
}
```

### `POST /api/compare`

Price comparison across retailers.

```json
{ "productUrl": "https://store.com/product" }
```

## SSE Event Types

Every endpoint streams these events:

| Event | Data | When |
|-------|------|------|
| `card` | `EvidenceCard` object | Each piece of evidence found |
| `connection` | `{ from, to, label? }` | Link between two cards |
| `threat_score` | `{ score: number }` | Updated score (0-100) after each card |
| `narration` | `{ text: string }` | Status updates + final analysis summary |
| `done` | `{ summary: string }` | Investigation complete. **Summary includes the `Investigation ID`** — parse it for deepen calls |
| `error` | `{ message: string }` | Something went wrong |

### Frontend SSE consumption example

```ts
const res = await fetch("/api/investigate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url }),
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const lines = buffer.split("\n\n");
  buffer = lines.pop()!; // keep incomplete chunk

  for (const block of lines) {
    const eventMatch = block.match(/^event: (.+)$/m);
    const dataMatch = block.match(/^data: (.+)$/m);
    if (!eventMatch || !dataMatch) continue;

    const event = eventMatch[1];
    const data = JSON.parse(dataMatch[1]);

    switch (event) {
      case "card":     // data is EvidenceCard — add node to React Flow
      case "threat_score": // data.score — update ThreatMeter
      case "narration":    // data.text — show in status bar
      case "done":         // data.summary — investigation finished
      case "error":        // data.message — show error
    }
  }
}
```

## Multi-Turn Flow

```
Turn 1: POST /api/investigate { url }
  ↓ streams cards, threat_score, narration
  ↓ "done" event includes Investigation ID

Turn 2: POST /api/deepen { investigationId, focus: "seller" }
  ↓ agent has ALL Turn 1 cards as context
  ↓ streams NEW cards only (no repeats)

Turn 3: POST /api/deepen { investigationId, focus: "reviews" }
  ↓ agent has Turn 1 + Turn 2 cards as context
  ...and so on
```

Investigation state is held in-memory on the server (expires after 1 hour).

## EvidenceCard Shape

This is the core data type that flows from backend → frontend:

```ts
interface EvidenceCard {
  id: string;                      // UUID
  type: CardType;                  // "domain" | "ssl" | "scam_report" | "review_analysis" | "price" | "seller" | "business" | "alert" | "email" | "alternative" | "coupon"
  severity: CardSeverity;          // "critical" | "warning" | "info" | "safe"
  title: string;                   // Short: "Domain registered 6 days ago"
  detail: string;                  // Longer: "Registered Feb 7, 2026 via NameCheap in Lagos, Nigeria"
  source: string;                  // "WHOIS Lookup" | "Google Safe Browsing" | "Reddit" | etc.
  confidence: number;              // 0.0 - 1.0
  connections: string[];           // IDs of related cards
  metadata: Record<string, any>;   // Tool-specific extra data
}
```

**Severity → color mapping for frontend:**
- `critical` → red border
- `warning` → yellow border
- `info` → blue/gray border
- `safe` → green border

## Tools Available

| Tool | Source | What it returns |
|------|--------|-----------------|
| `whois_lookup` | API Ninjas | Domain age, registrar, country, org |
| `ssl_analysis` | Node.js TLS | Issuer, validity, self-signed check |
| `safe_browsing_check` | Google Safe Browsing | Malware/phishing flags |
| `scrape_red_flags` | Fetch + regex | Urgency tactics, missing policies, suspicious payments |
| `reddit_search` | Reddit API | Scam reports, user complaints |
| `scamadviser_check` | ScamAdviser API | Trust score and risk assessment |
| `price_search` | Perplexity Sonar | Cross-retailer price comparison |

## Env Vars Required

```
OPENAI_API_KEY=          # Agent orchestration (gpt-4o)
GOOGLE_SAFE_BROWSING_KEY=  # Google Safe Browsing v4
API_NINJAS_KEY=            # WHOIS lookups
PERPLEXITY_API_KEY=        # Price search via Sonar
SCAMADVISER_API_KEY=       # Trust score (optional)
```

## File Map

```
src/
├── types/index.ts              ← Shared types (everyone imports from here)
├── lib/
│   ├── agent.ts                ← Agent orchestration + OpenAI Responses API
│   ├── investigationStore.ts   ← In-memory multi-turn state
│   ├── stream.ts               ← SSE helper (createSSEStream, SSE_HEADERS)
│   └── tools/
│       ├── index.ts            ← Tool registry + executor
│       ├── whois.ts            ← API Ninjas WHOIS
│       ├── ssl.ts              ← TLS certificate check
│       ├── safe-browsing.ts    ← Google Safe Browsing
│       ├── scraper.ts          ← Red flag content scanner
│       ├── reddit.ts           ← Reddit search
│       ├── scamadviser.ts      ← ScamAdviser API
│       └── priceSearch.ts      ← Perplexity price comparison
└── app/api/
    ├── investigate/route.ts    ← POST /api/investigate
    ├── deepen/route.ts         ← POST /api/deepen
    └── compare/route.ts        ← POST /api/compare
```

What was already implemented (your partial work)
All four new modules were already written correctly and just needed to be wired in:

scoring.ts — Critical Veto tiered scorer
known-domains.ts — High-authority allowlist
brand-impersonation.ts — LLM Judge
error-classify.ts — Smart error handler
What was wired up in this session
tools/index.ts

Imported brandImpersonationCheck
Added brand_impersonation_check to toolDefinitions (so the LLM knows to call it)
Added the case to executeTool
agent.ts

Imported calcIncrementalScore + computeFinalThreatScore from scoring.ts
Added url?: string param to runAgent; all three callers now pass the URL
Added a roundCards accumulator inside the tool loop
After Promise.all resolves, runs the Critical Veto pass — if the veto score differs from the incremental estimate, streams one final corrective threat_score event
Removed the now-redundant local calcThreatScore function
Added brand_impersonation_check to the system prompt's tool list
Flow now

tools run in parallel (incremental score streams live)
          ↓
all tools done → computeFinalThreatScore(allCards, url)
  ├── Tier 4: known domain?          → 0  (immediate SAFE)
  ├── Tier 1: brand impersonation / Safe Browsing? → 100 (RED)
  ├── Tier 2: young domain + free SSL?             → 75
  ├── Tier 3: scraper red flags?                   → 45
  └── fallback: additive
          ↓
final threat_score event streamed → narration