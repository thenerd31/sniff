/**
 * High-authority domain allowlist (Tranco top ~150).
 * Used by the veto scoring system to short-circuit known-safe domains to score 0.
 */

const HIGH_AUTHORITY_DOMAINS = new Set([
  // Search / Tech giants
  "google.com", "youtube.com", "facebook.com", "amazon.com", "apple.com",
  "microsoft.com", "netflix.com", "linkedin.com", "twitter.com", "x.com",
  "instagram.com", "reddit.com", "wikipedia.org", "github.com",
  "stackoverflow.com", "whatsapp.com", "tiktok.com", "bing.com",
  "yahoo.com", "baidu.com", "yandex.ru",

  // Cloud / Dev
  "cloudflare.com", "aws.amazon.com", "azure.microsoft.com",
  "googleapis.com", "gstatic.com", "akamaized.net", "fastly.net",
  "vercel.app", "netlify.app", "heroku.com", "digitalocean.com",

  // E-commerce
  "ebay.com", "walmart.com", "target.com", "bestbuy.com", "etsy.com",
  "shopify.com", "aliexpress.com", "rakuten.com", "wayfair.com",
  "costco.com", "homedepot.com", "lowes.com", "macys.com",
  "nordstrom.com", "zappos.com", "chewy.com", "kohls.com",
  "jcpenney.com", "samsclub.com", "overstock.com", "newegg.com",
  "bhphotovideo.com", "adorama.com", "gamestop.com",
  "dickssportinggoods.com", "academy.com", "rei.com",
  "sephora.com", "ulta.com", "bathandbodyworks.com",

  // Fashion / Apparel
  "hm.com", "zara.com", "uniqlo.com", "asos.com", "gap.com",
  "oldnavy.com", "nike.com", "adidas.com", "underarmour.com",
  "newbalance.com", "puma.com", "lululemon.com", "patagonia.com",
  "brooksbrothers.com", "jcrew.com", "anthropologie.com",
  "urbanoutfitters.com", "freepeople.com", "forever21.com",
  "shein.com", "ssense.com", "farfetch.com", "mrporter.com",

  // Electronics / Tech brands
  "samsung.com", "sony.com", "dell.com", "hp.com", "lenovo.com",
  "asus.com", "bose.com", "lg.com", "canon.com", "nikon.com",

  // Finance
  "paypal.com", "stripe.com", "chase.com", "bankofamerica.com",
  "wellsfargo.com", "citi.com", "capitalone.com", "americanexpress.com",
  "venmo.com", "wise.com", "robinhood.com", "coinbase.com",
  "fidelity.com", "schwab.com", "vanguard.com",

  // Media / Entertainment
  "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "washingtonpost.com",
  "theguardian.com", "reuters.com", "bloomberg.com", "forbes.com",
  "espn.com", "spotify.com", "hulu.com", "disneyplus.com",
  "twitch.tv", "imdb.com", "rottentomatoes.com",

  // Social / Communication
  "pinterest.com", "tumblr.com", "quora.com", "medium.com",
  "discord.com", "telegram.org", "signal.org", "snapchat.com",

  // Productivity
  "slack.com", "notion.so", "zoom.us", "dropbox.com", "box.com",
  "trello.com", "atlassian.com", "figma.com", "canva.com",
  "adobe.com", "salesforce.com", "hubspot.com",

  // Travel
  "airbnb.com", "booking.com", "expedia.com", "tripadvisor.com",
  "uber.com", "lyft.com", "united.com", "delta.com",
  "southwest.com", "aa.com",

  // Government / Education
  "gov.uk", "usa.gov", "irs.gov", "cdc.gov", "nih.gov",
  "nasa.gov", "ed.gov", "state.gov",
  "harvard.edu", "mit.edu", "stanford.edu", "berkeley.edu",

  // Other well-known
  "wordpress.com", "wordpress.org", "blogger.com",
  "archive.org", "craigslist.org", "yelp.com",
  "zillow.com", "realtor.com", "indeed.com",
  "glassdoor.com", "grammarly.com",

  // Food / Delivery
  "doordash.com", "ubereats.com", "grubhub.com",
  "instacart.com", "dominos.com", "starbucks.com",
  "mcdonalds.com", "chipotle.com",

  // Security / Anti-virus
  "virustotal.com", "malwarebytes.com", "norton.com",
  "kaspersky.com", "avast.com",
]);

export function isHighAuthorityDomain(hostname: string): boolean {
  const domain = hostname.replace(/^www\./, "").toLowerCase();
  if (HIGH_AUTHORITY_DOMAINS.has(domain)) return true;

  // Check root domain: mail.google.com → google.com
  const parts = domain.split(".");
  if (parts.length > 2) {
    const root = parts.slice(-2).join(".");
    if (HIGH_AUTHORITY_DOMAINS.has(root)) return true;

    // Handle co.uk, com.au style TLDs
    const rootThree = parts.slice(-3).join(".");
    if (HIGH_AUTHORITY_DOMAINS.has(rootThree)) return true;
  }

  return false;
}
