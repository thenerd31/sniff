import type { EvidenceCard } from "@/types";

interface StoredInvestigation {
  id: string;
  url: string;
  cards: EvidenceCard[];
  threatScore: number;
  turn: number;
  createdAt: number;
}

// In-memory store — resets on server restart.
// Fine for hackathon demo; replace with Redis/DB for production.
const investigations = new Map<string, StoredInvestigation>();

// Auto-cleanup investigations older than 1 hour
const MAX_AGE_MS = 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, inv] of investigations) {
    if (now - inv.createdAt > MAX_AGE_MS) {
      investigations.delete(id);
    }
  }
}

export function createInvestigation(id: string, url: string): StoredInvestigation {
  cleanup();
  const inv: StoredInvestigation = {
    id,
    url,
    cards: [],
    threatScore: 0,
    turn: 1,
    createdAt: Date.now(),
  };
  investigations.set(id, inv);
  return inv;
}

export function getInvestigation(id: string): StoredInvestigation | undefined {
  return investigations.get(id);
}

export function addCards(id: string, cards: EvidenceCard[]): void {
  const inv = investigations.get(id);
  if (inv) {
    inv.cards.push(...cards);
  }
}

export function updateThreatScore(id: string, score: number): void {
  const inv = investigations.get(id);
  if (inv) {
    inv.threatScore = score;
  }
}

export function incrementTurn(id: string): void {
  const inv = investigations.get(id);
  if (inv) {
    inv.turn++;
  }
}
