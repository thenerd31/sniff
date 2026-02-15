#!/usr/bin/env node
import { readFileSync } from "fs";
import { join } from "path";

function loadEnv(f: string) {
  try {
    for (const line of readFileSync(join(process.cwd(), f), "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim().replace(/^(['"`])([\s\S]*)\1$/, "$2");
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {}
}
loadEnv(".env.local");
loadEnv(".env");

import { sellerCheck } from "../src/lib/tools/seller-check";

const url = process.argv[2] ?? "https://www.amazon.com/Electric-Non-Stick-Adjustment-Essential-Included/dp/B0B998V65Y/";

async function main() {
  console.log(`\nChecking seller: ${url}\n`);
  try {
    const card = await sellerCheck(url);
    console.log(JSON.stringify(card, null, 2));
  } catch (err) {
    console.error("Uncaught error:");
    console.error(err);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
