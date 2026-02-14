import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

interface ApiNinjasWhois {
  domain_name?: string | string[];
  registrar?: string;
  creation_date?: string | string[];
  expiration_date?: string | string[];
  name_servers?: string[];
  dnssec?: string;
  org?: string;
  state?: string;
  country?: string;
}

export async function whoisLookup(url: string): Promise<EvidenceCard> {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const apiKey = process.env.API_NINJAS_KEY;

  if (!apiKey) {
    return {
      id: uuidv4(),
      type: "domain",
      severity: "info",
      title: "WHOIS lookup skipped",
      detail: "API Ninjas key not configured",
      source: "WHOIS Lookup",
      confidence: 0,
      connections: [],
      metadata: { domain, skipped: true },
    };
  }

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/whois?domain=${encodeURIComponent(domain)}`,
      {
        headers: { "X-Api-Key": apiKey },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`API Ninjas returned ${response.status}`);
    }

    const data: ApiNinjasWhois = await response.json();

    let severity: CardSeverity = "safe";
    let title = `Domain: ${domain}`;
    const details: string[] = [];

    // creation_date can be a string or array — normalize
    const creationRaw = Array.isArray(data.creation_date)
      ? data.creation_date[0]
      : data.creation_date;

    if (creationRaw) {
      // API Ninjas returns Unix timestamp (seconds) as a number in string form,
      // or an ISO date string — handle both
      const created = /^\d+$/.test(creationRaw)
        ? new Date(parseInt(creationRaw) * 1000)
        : new Date(creationRaw);

      if (!isNaN(created.getTime())) {
        const ageMs = Date.now() - created.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

        if (ageDays < 30) {
          severity = "critical";
          title = `Domain registered ${ageDays} days ago`;
        } else if (ageDays < 365) {
          severity = "warning";
          title = `Domain is ${ageDays} days old`;
        } else {
          title = `Domain is ${Math.floor(ageDays / 365)} years old`;
        }

        details.push(`Registered: ${created.toLocaleDateString()}`);
      }
    }

    if (data.registrar) details.push(`Registrar: ${data.registrar}`);
    if (data.country) details.push(`Country: ${data.country}`);
    if (data.org) details.push(`Organization: ${data.org}`);

    const expirationRaw = Array.isArray(data.expiration_date)
      ? data.expiration_date[0]
      : data.expiration_date;
    if (expirationRaw) {
      const expires = /^\d+$/.test(expirationRaw)
        ? new Date(parseInt(expirationRaw) * 1000)
        : new Date(expirationRaw);
      if (!isNaN(expires.getTime())) {
        details.push(`Expires: ${expires.toLocaleDateString()}`);
      }
    }

    return {
      id: uuidv4(),
      type: "domain",
      severity,
      title,
      detail: details.join(" | ") || "No WHOIS details available",
      source: "WHOIS Lookup",
      confidence: 0.9,
      connections: [],
      metadata: { domain, raw: data },
    };
  } catch (error) {
    return {
      id: uuidv4(),
      type: "domain",
      severity: "warning",
      title: `WHOIS lookup failed for ${domain}`,
      detail: `Could not retrieve WHOIS data: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "WHOIS Lookup",
      confidence: 0.3,
      connections: [],
      metadata: { domain, error: true },
    };
  }
}
