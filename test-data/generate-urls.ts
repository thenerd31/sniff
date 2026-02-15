/**
 * generate-urls.ts
 *
 * Generates a complete test dataset for Sentinel by:
 *  1. Loading the static high_authority + hard_negative URLs from urls.json
 *  2. Fetching fresh phishing URLs from OpenPhish (free community feed)
 *  3. Replacing the PLACEHOLDER entries with real, live phishing URLs
 *  4. Writing the final dataset to urls-live.json
 *
 * Usage:
 *   npx tsx test-data/generate-urls.ts                  # default 100 URLs (20 phishing)
 *   npx tsx test-data/generate-urls.ts --phishing 50    # scale up phishing count
 *   npx tsx test-data/generate-urls.ts --phishing 100 --authority 200 --hard-negatives 80
 *
 * The script is idempotent — re-run it anytime to refresh phishing URLs.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestUrl {
  url: string;
  category: "high_authority" | "hard_negative" | "real_phishing";
  reason: string;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: number) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : fallback;
  };
  return {
    phishingCount: get("--phishing", 20),
    authorityCount: get("--authority", 50),
    hardNegativeCount: get("--hard-negatives", 30),
  };
}

// ---------------------------------------------------------------------------
// Fetch phishing URLs from OpenPhish
// ---------------------------------------------------------------------------

async function fetchPhishingUrls(count: number): Promise<string[]> {
  const OPENPHISH_FEED = "https://openphish.com/feed.txt";

  console.log(`Fetching phishing feed from ${OPENPHISH_FEED} ...`);

  const res = await fetch(OPENPHISH_FEED);
  if (!res.ok) {
    throw new Error(`OpenPhish returned ${res.status}: ${res.statusText}`);
  }

  const text = await res.text();
  const urls = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.startsWith("http"));

  console.log(`  Feed contains ${urls.length} URLs, picking ${count}`);

  // Shuffle and take `count` — ensures variety across runs
  const shuffled = urls.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ---------------------------------------------------------------------------
// Scale-up helpers: duplicate-safe expansion of static categories
// ---------------------------------------------------------------------------

/**
 * If the user requests MORE URLs than the static file provides for a category,
 * we keep what we have and log a warning. The static lists are curated —
 * auto-generating "fake" authority domains would defeat the purpose.
 */
function pickFromCategory(
  all: TestUrl[],
  category: TestUrl["category"],
  desired: number
): TestUrl[] {
  const pool = all.filter((u) => u.category === category);
  if (pool.length < desired) {
    console.warn(
      `Warning: requested ${desired} ${category} URLs but only ${pool.length} are defined in urls.json. ` +
        `Add more entries to urls.json to scale up.`
    );
  }
  return pool.slice(0, desired);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { phishingCount, authorityCount, hardNegativeCount } = parseArgs();

  // 1. Load static dataset
  const staticPath = resolve(__dirname, "urls.json");
  const staticData: TestUrl[] = JSON.parse(readFileSync(staticPath, "utf-8"));

  // 2. Pick static categories
  const authority = pickFromCategory(staticData, "high_authority", authorityCount);
  const hardNegatives = pickFromCategory(staticData, "hard_negative", hardNegativeCount);

  // 3. Fetch live phishing URLs
  const phishingUrls = await fetchPhishingUrls(phishingCount);
  const phishing: TestUrl[] = phishingUrls.map((url, i) => ({
    url,
    category: "real_phishing" as const,
    reason: `Live phishing URL #${i + 1} from OpenPhish feed (fetched ${new Date().toISOString()})`,
  }));

  // 4. Combine
  const dataset = [...authority, ...hardNegatives, ...phishing];

  // 5. Write output
  const outPath = resolve(__dirname, "urls-live.json");
  writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n");

  console.log(`\nDataset written to ${outPath}`);
  console.log(
    `  ${authority.length} high_authority + ${hardNegatives.length} hard_negative + ${phishing.length} real_phishing = ${dataset.length} total`
  );
}

main().catch((err) => {
  console.error("Failed to generate dataset:", err);
  process.exit(1);
});
