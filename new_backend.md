How Sentinel's Backend Works                                                                                                                                              
                                                                                                                                                                          
  One endpoint: POST /api/investigate                                                                                                                                       
                                                                                                                                                                          
  User pastes any URL. The agent decides what to do.                                                                                                                        
                                                                                                                                                                            
  ---                                                                                                                                                                       
  Decision Tree

  User pastes URL
        │
        ├─ Known retailer? (Amazon, Walmart, Best Buy, etc.)
        │   └─ PATH A: Skip investigation → price comparison
        │
        └─ Unknown site?
            └─ PATH B: Full investigation → then decide
                │
                ├─ Dangerous + selling a product?
                │   └─ "THE TURN" — warn about scam + find legit alternatives
                │
                ├─ Dangerous + not a product?
                │   └─ Warn: "Do not enter payment info"
                │
                ├─ Safe + product page?
                │   └─ Compare prices across retailers
                │
                └─ Safe + not a product?
                    └─ Done — just show investigation results

  ---
  PATH A: Known Retailer (e.g. amazon.com/airpods)

  1. Detect — URL matches retailer domain list → threat score 0, skip fraud tools
  2. Price comparison — runPriceComparison():
    - Scrape original URL price (Bright Data → Browserbase fallback)
    - Perplexity finds same product on other retailers (URLs only)
    - Scrape each retailer URL in parallel (Bright Data → Browserbase)
    - Fallback: Perplexity price search if scraping fails
  3. Savings card — cheapest price, spread, connections to all price cards
  4. Done — "Compared 5 prices (5 verified via live scraping)"

  Typical result: 5 price cards + savings card + connections. ~60s.

  ---
  PATH B: Unknown Site (e.g. luxurydesigneroutlet.shop)

  Phase 1 — Parallel Tool Scan (~10s)

  8 tools run simultaneously, cards stream in real-time:

  ┌─────────────────────────┬───────────────────────────────────────────────────┬─────────────────────────────────────┐
  │          Tool           │                  What it checks                   │           Example output            │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ WHOIS Lookup            │ Domain age, registrar, country                    │ "Registered 6 days ago in Nigeria"  │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ SSL Analysis            │ Certificate validity, issuer, mismatch            │ "Self-signed cert / Let's Encrypt"  │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ Google Safe Browsing    │ Known malware/phishing database                   │ "Not flagged" or "MALWARE detected" │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ Brand Impersonation     │ Typosquatting, lookalike domains (gpt-5-mini)    │ "Likely impersonating Nike"         │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ Reddit Search           │ Scam reports in r/Scams, r/IsItAScam              │ "12 scam reports, 847 upvotes"      │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ Page Scanner            │ Urgency tactics, missing policies, fake discounts │ "No return policy, countdown timer" │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ ScamAdviser             │ Trust score, risk category                        │ "Trust score: 12/100"               │
  ├─────────────────────────┼───────────────────────────────────────────────────┼─────────────────────────────────────┤
  │ Web Search (Perplexity) │ General reputation research                       │ "Zero legitimate presence online"   │
  └─────────────────────────┴───────────────────────────────────────────────────┴─────────────────────────────────────┘

  Each card streams immediately with severity + confidence. Incremental threat score updates live.

  Phase 2 — Veto Scoring

  After all tools finish, computeFinalThreatScore() applies a tiered hierarchy:

  ┌──────────┬───────────────────────────────────────────────────────────┬──────────────┐
  │   Tier   │                         Condition                         │    Score     │
  ├──────────┼───────────────────────────────────────────────────────────┼──────────────┤
  │ Tier 4   │ Known-safe domain (Tranco ~150 allowlist)                 │ → 0          │
  ├──────────┼───────────────────────────────────────────────────────────┼──────────────┤
  │ Tier 1   │ Brand impersonation (conf ≥ 0.8) OR Safe Browsing flagged │ → 100        │
  ├──────────┼───────────────────────────────────────────────────────────┼──────────────┤
  │ Tier 2   │ Young domain (<30d) AND free SSL cert                     │ → 75         │
  ├──────────┼───────────────────────────────────────────────────────────┼──────────────┤
  │ Tier 3   │ Scraper red flags (urgency, missing policies)             │ → 45         │
  ├──────────┼───────────────────────────────────────────────────────────┼──────────────┤
  │ Fallback │ Additive score from card severities                       │ → calculated │
  └──────────┴───────────────────────────────────────────────────────────┴──────────────┘

  First matching tier wins. Higher tiers override everything.

  Phase 3 — Agent Synthesis (gpt-5)

  Feeds all evidence cards to gpt-5, which returns:
  - Connections — "WHOIS → Reddit reports: corroborating fraud evidence"
  - Insight cards — "This matches a known dropshipping scam pattern"
  - Product name — if the site is selling something identifiable
  - Narration — plain English summary for non-technical users

  Phase 4 — The Turn

  Based on threat score + whether a product was detected:

  - Score ≥ 50 + product detected → "This is a scam. Finding legitimate alternatives..." → runs full price comparison → green price cards fly in after red investigation
  cards
  - Score ≥ 50 + no product → "Do not enter payment info"
  - Score < 50 + product → "Looks legit. Checking for better deals..." → price comparison
  - Score < 50 + no product → investigation complete

  ---
  Supporting Routes

  ┌────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │           Route            │                                                              Purpose                                                               │
  ├────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ POST /api/deepen           │ Multi-turn: user clicks "Dig Deeper" on seller/reviews/business → runs focused tool subset → synthesizes against existing evidence │
  ├────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ POST /api/compare          │ Standalone price comparison (still works independently)                                                                            │
  ├────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ POST /api/investigate-demo │ Pre-cached demo replay — 8 cards, threat score 94, never fails                                                                     │
  └────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  Streaming Protocol (SSE)

  All routes stream events in real-time:

  data: {"event":"card",         "data": EvidenceCard}
  data: {"event":"connection",   "data": {from, to, label}}
  data: {"event":"threat_score", "data": {score: 0-100}}
  data: {"event":"narration",    "data": {text: "..."}}
  data: {"event":"done",         "data": {summary, investigationId}}
  data: {"event":"error",        "data": {message}}

  Frontend consumes via useInvestigation() hook → state.cards, state.connections, state.threatScore, state.narration.

  ---
  Tool Stack

  ┌───────────────────────────┬───────────────────────────────────────────────────────────┐
  │           Layer           │                        Technology                         │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Web scraping (structured) │ Bright Data dataset API (Amazon, Walmart, Best Buy, eBay) │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Web scraping (any site)   │ Browserbase + Stagehand AI browser (gpt-5-mini)          │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Web search                │ Perplexity Sonar Pro                                      │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Agent synthesis           │ OpenAI gpt-5 (Responses API)                             │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Brand detection           │ OpenAI gpt-5-mini                                        │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Threat database           │ Google Safe Browsing API                                  │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Reputation                │ ScamAdviser API, Reddit API                               │
  ├───────────────────────────┼───────────────────────────────────────────────────────────┤
  │ Domain intel              │ WHOIS (API Ninjas)                                        │
  └───────────────────────────┴───────────────────────────────────────────────────────────┘