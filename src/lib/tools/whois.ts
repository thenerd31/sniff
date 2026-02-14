import * as whois from "whois";
import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

interface WhoisResult {
  domainName?: string;
  registrar?: string;
  creationDate?: string;
  expirationDate?: string;
  country?: string;
  registrantOrganization?: string;
  nameServers?: string[];
}

function parseWhoisData(raw: string): WhoisResult {
  const result: WhoisResult = {};
  const lines = raw.split("\n");

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (!key || valueParts.length === 0) continue;
    const value = valueParts.join(":").trim();
    const keyLower = key.trim().toLowerCase();

    if (keyLower.includes("domain name") && !result.domainName) {
      result.domainName = value;
    } else if (keyLower.includes("registrar") && !keyLower.includes("abuse") && !result.registrar) {
      result.registrar = value;
    } else if (keyLower.includes("creation date") && !result.creationDate) {
      result.creationDate = value;
    } else if (keyLower.includes("expir") && keyLower.includes("date") && !result.expirationDate) {
      result.expirationDate = value;
    } else if (keyLower.includes("registrant country") && !result.country) {
      result.country = value;
    } else if (keyLower.includes("registrant organization") && !result.registrantOrganization) {
      result.registrantOrganization = value;
    } else if (keyLower.includes("name server") && !result.nameServers) {
      result.nameServers = result.nameServers || [];
      result.nameServers.push(value.toLowerCase());
    }
  }

  return result;
}

function lookupWhois(domain: string): Promise<string> {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err: Error | null, data: unknown) => {
      if (err) reject(err);
      else if (typeof data === "string") resolve(data);
      else if (Array.isArray(data)) resolve(data.map((d) => d.data || "").join("\n"));
      else resolve(String(data));
    });
  });
}

export async function whoisLookup(url: string): Promise<EvidenceCard> {
  const domain = new URL(url).hostname.replace(/^www\./, "");

  try {
    const raw = await lookupWhois(domain);
    const parsed = parseWhoisData(raw);

    let severity: CardSeverity = "safe";
    let title = `Domain: ${domain}`;
    const details: string[] = [];

    if (parsed.creationDate) {
      const created = new Date(parsed.creationDate);
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

    if (parsed.registrar) details.push(`Registrar: ${parsed.registrar}`);
    if (parsed.country) details.push(`Country: ${parsed.country}`);
    if (parsed.registrantOrganization) details.push(`Organization: ${parsed.registrantOrganization}`);
    if (parsed.expirationDate) details.push(`Expires: ${new Date(parsed.expirationDate).toLocaleDateString()}`);

    return {
      id: uuidv4(),
      type: "domain",
      severity,
      title,
      detail: details.join(" | "),
      source: "WHOIS Lookup",
      confidence: 0.9,
      connections: [],
      metadata: {
        domain,
        raw: parsed,
      },
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
