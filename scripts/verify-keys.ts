/**
 * API Key Verification Script
 * Run with: npx tsx scripts/verify-keys.ts
 *
 * Checks that each required API key is configured and makes a minimal
 * test call to verify connectivity.
 */

import "dotenv/config";

const results: { name: string; status: "OK" | "MISSING" | "FAILED"; detail?: string }[] = [];

async function check(name: string, envVar: string, testFn?: () => Promise<void>) {
  const value = process.env[envVar];
  if (!value) {
    results.push({ name, status: "MISSING", detail: `${envVar} not set` });
    return;
  }
  if (testFn) {
    try {
      await testFn();
      results.push({ name, status: "OK" });
    } catch (e: any) {
      results.push({ name, status: "FAILED", detail: e.message?.slice(0, 100) });
    }
  } else {
    results.push({ name, status: "OK", detail: "Key present (no test call)" });
  }
}

async function main() {
  console.log("Verifying API keys...\n");

  await check("OpenAI", "OPENAI_API_KEY", async () => {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await check("Google Safe Browsing", "GOOGLE_SAFE_BROWSING_KEY", async () => {
    const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threatInfo: {
            threatTypes: ["MALWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: "https://example.com" }],
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await check("Perplexity Sonar", "PERPLEXITY_API_KEY", async () => {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await check("API Ninjas", "API_NINJAS_KEY");
  await check("Browserbase", "BROWSERBASE_API_KEY");
  await check("Bright Data", "BRIGHT_DATA_API_KEY");

  // Print results
  console.log("Results:\n");
  for (const r of results) {
    const icon = r.status === "OK" ? "+" : r.status === "MISSING" ? "-" : "x";
    const detail = r.detail ? ` (${r.detail})` : "";
    console.log(`  [${icon}] ${r.name}: ${r.status}${detail}`);
  }

  const failed = results.filter((r) => r.status !== "OK").length;
  console.log(`\n${results.length - failed}/${results.length} keys verified.`);
  if (failed > 0) process.exit(1);
}

main();
