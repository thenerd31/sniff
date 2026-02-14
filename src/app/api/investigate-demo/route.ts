import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";

// ── Pre-Cached Demo Events ────────────────────────────────────────────
// Run a real investigation and paste the events here.
// This replays them with realistic timing so the demo NEVER fails.

const DEMO_EVENTS = [
  {
    delay: 800,
    event: "card",
    data: {
      id: "demo-1",
      type: "domain",
      severity: "critical",
      title: "Domain registered 6 days ago",
      detail:
        "Registered Feb 7, 2026 via NameCheap. Registrant country: Nigeria. Domain age of less than 30 days is a strong fraud indicator.",
      source: "WHOIS Lookup",
      confidence: 0.92,
      connections: [],
      metadata: {},
    },
  },
  {
    delay: 1200,
    event: "card",
    data: {
      id: "demo-2",
      type: "ssl",
      severity: "critical",
      title: "SSL certificate mismatch",
      detail:
        "Certificate issued to a different domain (*.cheaphost.xyz). This strongly suggests a phishing or impersonation site.",
      source: "SSL Analysis",
      confidence: 0.95,
      connections: ["demo-1"],
      metadata: {},
    },
  },
  {
    delay: 600,
    event: "connection",
    data: { from: "demo-2", to: "demo-1", label: "same suspicious infrastructure" },
  },
  {
    delay: 1000,
    event: "card",
    data: {
      id: "demo-3",
      type: "scam_report",
      severity: "critical",
      title: "12 scam reports found on Reddit",
      detail:
        'Multiple users in r/Scams and r/IsItAScam report this domain. Top post: "Lost $200 ordering from this site, never received product." 847 upvotes.',
      source: "Reddit Search",
      confidence: 0.88,
      connections: ["demo-1"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "demo-3", to: "demo-1", label: "reported domain" },
  },
  {
    delay: 1100,
    event: "card",
    data: {
      id: "demo-4",
      type: "alert",
      severity: "warning",
      title: "No return policy found",
      detail:
        "The website has no visible return or refund policy. Legitimate retailers are legally required to display this in most jurisdictions.",
      source: "Page Analysis",
      confidence: 0.78,
      connections: [],
      metadata: {},
    },
  },
  {
    delay: 900,
    event: "card",
    data: {
      id: "demo-5",
      type: "alert",
      severity: "warning",
      title: "Fake urgency tactics detected",
      detail:
        'Page contains countdown timer ("Only 2 left!") and pressure language ("Sale ends tonight!"). These are common social engineering tactics.',
      source: "Page Analysis",
      confidence: 0.82,
      connections: ["demo-4"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "demo-5", to: "demo-4", label: "deceptive practices" },
  },
  {
    delay: 1000,
    event: "card",
    data: {
      id: "demo-6",
      type: "domain",
      severity: "safe",
      title: "Google Safe Browsing: not flagged",
      detail:
        "This URL is not yet in Google's Safe Browsing database. Note: new scam sites often haven't been reported yet — absence of a flag does not mean safety.",
      source: "Google Safe Browsing",
      confidence: 0.6,
      connections: [],
      metadata: {},
    },
  },
  {
    delay: 1200,
    event: "card",
    data: {
      id: "demo-7",
      type: "business",
      severity: "critical",
      title: "No business registration found",
      detail:
        'Company name "LuxDeals Global Ltd" returns zero results in corporate registries (Delaware, UK Companies House, Hong Kong CR). Likely a fictitious entity.',
      source: "Business Registry Search",
      confidence: 0.85,
      connections: ["demo-1", "demo-3"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "demo-7", to: "demo-1", label: "unregistered entity" },
  },
  {
    delay: 400,
    event: "connection",
    data: { from: "demo-7", to: "demo-3", label: "corroborates reports" },
  },
  {
    delay: 800,
    event: "card",
    data: {
      id: "demo-8",
      type: "seller",
      severity: "warning",
      title: "Stock photos used for 'team' page",
      detail:
        "Reverse image search shows all 4 team member photos are stock images from Shutterstock. No real team members identified.",
      source: "Image Analysis",
      confidence: 0.9,
      connections: ["demo-7"],
      metadata: {},
    },
  },
  {
    delay: 500,
    event: "connection",
    data: { from: "demo-8", to: "demo-7", label: "fake company" },
  },
  {
    delay: 1000,
    event: "threat_score",
    data: { score: 94 },
  },
  {
    delay: 500,
    event: "done",
    data: {
      summary:
        "High risk of fraud detected. Domain is 6 days old, SSL certificate mismatched, 12 Reddit scam reports, no business registration, stock photos for team. Threat score: 94/100. DO NOT proceed with any transactions.",
    },
  },
];

// ── Route Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // We accept the body but ignore it — always replay the demo
  await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    for (const item of DEMO_EVENTS) {
      await new Promise((r) => setTimeout(r, item.delay));
      send(item.event, item.data);
    }
    close();
  })();

  return response;
}
