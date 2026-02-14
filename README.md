### One-liner: A visual investigation board that exposes online scams and finds the best legitimate deals — like a detective's cork board powered by AI agents.
NOT a chatbot. NOT a dashboard. A living investigation board where evidence cards fly in, red strings connect findings, and a threat meter fills as the agent uncovers fraud.

Feature Set (Priority Order)
P0 — DEMO OR DIE (Hours 0-14)
These must work perfectly for the golden path demo.
URL Investigation — Paste any URL → agent pins evidence cards to the board
Domain WHOIS lookup (registration date, country, registrar)
SSL certificate analysis
Web scraping the page for red flags (no return policy, fake urgency timers, stock photos)
Cross-reference against known scam databases (ScamAdviser API, Google Safe Browsing)
Reddit/forum search for reports about this seller/domain
Visual Investigation Board — React Flow canvas with custom nodes
Evidence cards with color-coded borders (🔴 red flag, 🟡 warning, 🟢 clean)
Animated red string connections between related findings
Cards fly in one-by-one with Framer Motion (the "jaw-drop" moment)
Zoom, pan, drag nodes to reorganize
Threat Meter — fills from green → yellow → red as evidence accumulates
Pulsing red glow when threat is HIGH
Multi-Turn Investigation — Each click deepens the investigation
Turn 1: Paste URL → initial scan (6-8 evidence cards)
Turn 2: "Dig deeper on seller" → business registration, shell company trace
Turn 3: "Check reviews" → review authenticity analysis, fake review detection
Turn 4: "Find legitimate alternatives" → green-bordered cards for real options
Turn 5: "Generate fraud report" → downloadable PDF for bank/FTC

**I am in charge of backend for this project.**

Tech Stack
┌─────────────────────────────────────────────┐
│                  FRONTEND                     │
│  Next.js 15 + TypeScript + Tailwind + ShadCN │
│  React Flow (investigation board)             │
│  Framer Motion (card animations)              │
│  Vercel (deploy)                              │
└──────────────────┬──────────────────────────┘
                   │ REST / WebSocket
┌──────────────────▼──────────────────────────┐
│                  BACKEND                      │
│  FastAPI (Python) + WebSocket streaming       │
│  OR Next.js API routes (simpler, one deploy)  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              AGENT PIPELINE                   │
│  OpenAI Responses API (orchestrator)          │
│  ├─ Web Search tool (built-in)                │
│  ├─ Function calling (custom tools below)     │
│  └─ Structured output (evidence cards)        │
│                                               │
│  Custom Tools:                                │
│  ├─ WHOIS lookup (python-whois)               │
│  ├─ SSL cert check (ssl module)               │
│  ├─ Safe Browsing API (Google)                │
│  ├─ ScamAdviser API                           │
│  ├─ Bright Data scraping (sponsor)            │
│  ├─ Browserbase/Stagehand (sponsor, safe URL) │
│  ├─ Perplexity Sonar (sponsor, research)      │
│  └─ Reddit search (Bright Data or API)        │
│                                               │
│  Modal (sponsor, inference pipeline)          │
└─────────────────────────────────────────────┘
Key Technical Decisions
Decision
Choice
Why
Frontend framework
Next.js 15
Vercel deploy (sponsor), SSR, API routes
Board visualization
React Flow
Production-grade node graph, custom nodes, built-in zoom/pan
Animations
Framer Motion
Card fly-in, string drawing, threat meter pulse
Agent orchestration
OpenAI Responses API
Built-in web search + function calling, streaming
Backend
Next.js API routes
One deploy, simpler architecture, WebSocket via Vercel
Data pipeline
Python scripts on Modal
Heavy scraping/analysis runs on Modal (sponsor prize)
Deploy
Vercel
Sponsor prize + instant deploys
Styling
Tailwind + ShadCN
Fast iteration, consistent UI



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

