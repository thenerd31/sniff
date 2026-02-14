import { whoisLookup } from "./whois";
import { sslAnalysis } from "./ssl";
import { safeBrowsingCheck } from "./safe-browsing";
import { scrapeForRedFlags } from "./scraper";
import { redditSearch } from "./reddit";
import { scamadviserCheck } from "./scamadviser";
import { priceSearch } from "./priceSearch";
import type { EvidenceCard } from "@/types";

function defineTool(name: string, description: string) {
  return {
    type: "function" as const,
    name,
    description,
    strict: false as const,
    parameters: {
      type: "object" as const,
      properties: {
        url: { type: "string" as const, description: "The URL to investigate" },
      },
      required: ["url"] as const,
      additionalProperties: false as const,
    },
  };
}

// OpenAI function definitions for the agent
export const toolDefinitions = [
  defineTool(
    "whois_lookup",
    "Performs a WHOIS lookup on the target URL's domain. Returns domain registration date, registrar, country, and organization. Young domains are a major scam indicator."
  ),
  defineTool(
    "ssl_analysis",
    "Analyzes the SSL/TLS certificate of the target URL. Checks issuer, validity, expiration, and whether the certificate is self-signed. Missing or invalid SSL is a red flag."
  ),
  defineTool(
    "safe_browsing_check",
    "Checks the URL against Google Safe Browsing database for known malware, phishing, and social engineering threats."
  ),
  defineTool(
    "scrape_red_flags",
    "Scrapes the webpage and analyzes content for scam red flags: fake urgency timers, missing return/refund policies, suspicious payment methods, extreme discount claims."
  ),
  defineTool(
    "reddit_search",
    "Searches Reddit for discussions about the domain, including scam reports, reviews, and user experiences."
  ),
  defineTool(
    "scamadviser_check",
    "Queries ScamAdviser for the domain's trust score and risk assessment based on their database of known scam sites."
  ),
  defineTool(
    "price_search",
    "Searches for the same product across legitimate retailers to compare prices. Use this for price comparison investigations and to find better deals."
  ),
];

// Tool executor map
export async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<EvidenceCard | EvidenceCard[]> {
  switch (name) {
    case "whois_lookup":
      return whoisLookup(args.url);
    case "ssl_analysis":
      return sslAnalysis(args.url);
    case "safe_browsing_check":
      return safeBrowsingCheck(args.url);
    case "scrape_red_flags":
      return scrapeForRedFlags(args.url);
    case "reddit_search":
      return redditSearch(args.url);
    case "scamadviser_check":
      return scamadviserCheck(args.url);
    case "price_search":
      return priceSearch(args.url);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
