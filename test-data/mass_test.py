#!/usr/bin/env python3
"""
mass_test.py — Mass Accuracy Test for the SENTINEL backend.

Loads the test URL dataset, replaces phishing placeholders with live URLs from
OpenPhish, hits the /api/investigate SSE endpoint for each URL, and grades the
results against expected categories.

Usage:
    pip install requests pandas
    python test-data/mass_test.py                       # default
    python test-data/mass_test.py --timeout 10          # custom timeout
    python test-data/mass_test.py --dataset urls.json   # custom dataset path

Requires the Next.js dev server running at localhost:3000.
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path

import pandas as pd
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

API_URL = "http://localhost:3000/api/investigate"
OPENPHISH_FEED = "https://openphish.com/feed.txt"

# Threat score boundaries (0-100 scale from InvestigationState.threatScore)
#   GREEN: 0–39   → safe
#   YELLOW: 40–69 → suspicious
#   RED: 70–100   → dangerous
GREEN_UPPER = 39
RED_LOWER = 70

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def fetch_phishing_urls(count: int) -> list[str]:
    """Fetch fresh phishing URLs from the OpenPhish community feed."""
    print(f"Fetching {count} live phishing URLs from OpenPhish...")
    try:
        resp = requests.get(OPENPHISH_FEED, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  WARNING: Could not fetch OpenPhish feed: {e}")
        print("  Phishing slots will be marked FEED_ERROR.")
        return []

    urls = [line.strip() for line in resp.text.splitlines() if line.strip().startswith("http")]
    print(f"  Feed contains {len(urls)} URLs, selecting {count}")

    # Deterministic-ish shuffle: pick evenly spaced URLs from the feed
    import random
    random.shuffle(urls)
    return urls[:count]


def load_dataset(path: str) -> list[dict]:
    """Load the static JSON dataset and replace phishing placeholders."""
    raw: list[dict] = json.loads(Path(path).read_text())

    placeholder_indices = [i for i, entry in enumerate(raw) if entry["url"].startswith("PLACEHOLDER")]
    phishing_urls = fetch_phishing_urls(len(placeholder_indices))

    for idx, slot in enumerate(placeholder_indices):
        if idx < len(phishing_urls):
            raw[slot]["url"] = phishing_urls[idx]
            raw[slot]["reason"] = f"Live phishing URL from OpenPhish (fetched at test time)"
        else:
            raw[slot]["url"] = "FEED_ERROR"
            raw[slot]["reason"] = "Could not fetch from OpenPhish"

    # Drop any entries that failed to resolve
    return [entry for entry in raw if entry["url"] != "FEED_ERROR"]


def parse_sse_threat_score(response: requests.Response) -> dict:
    """
    Parse the SSE stream and extract the final threat_score + any error.

    SSE format:
        event: threat_score
        data: {"score": 72}
    """
    threat_score: float | None = None
    error: str | None = None
    got_done = False

    for line in response.iter_lines(decode_unicode=True):
        if line is None:
            continue
        line = line.strip()

        if line.startswith("event: "):
            current_event = line[7:]
        elif line.startswith("data: "):
            data_str = line[6:]
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            if current_event == "threat_score":
                threat_score = data.get("score", threat_score)
            elif current_event == "error":
                error = data.get("message", "unknown error")
            elif current_event == "done":
                got_done = True

    return {
        "threat_score": threat_score,
        "error": error,
        "completed": got_done,
    }


def classify_score(score: float | None) -> str:
    """Map a numeric threat score to a color label."""
    if score is None:
        return "NO_SCORE"
    if score <= GREEN_UPPER:
        return "GREEN"
    if score >= RED_LOWER:
        return "RED"
    return "YELLOW"


def grade(category: str, color: str) -> str:
    """
    Grade a result as PASS, FAIL, or WARN.

    Rules:
      high_authority / hard_negative → expect GREEN (FAIL if RED)
      real_phishing                  → expect RED   (FAIL if GREEN)
      YELLOW is a soft warning for any category.
    """
    if color in ("TIMEOUT", "ERROR", "NO_SCORE"):
        return "ERROR"

    if category in ("high_authority", "hard_negative"):
        if color == "GREEN":
            return "PASS"
        if color == "RED":
            return "FAIL"  # false positive
        return "WARN"
    else:  # real_phishing
        if color == "RED":
            return "PASS"
        if color == "GREEN":
            return "FAIL"  # false negative
        return "WARN"


# ---------------------------------------------------------------------------
# Main test loop
# ---------------------------------------------------------------------------


def run_tests(dataset: list[dict], timeout: int) -> pd.DataFrame:
    total = len(dataset)
    results = []

    for i, entry in enumerate(dataset):
        url = entry["url"]
        category = entry["category"]
        reason = entry["reason"]

        progress = f"[{i + 1:3d}/{total}]"
        short_url = url[:60] + ("..." if len(url) > 60 else "")
        print(f"  {progress} {category:16s} | {short_url}", end="", flush=True)

        t0 = time.time()
        threat_score = None
        color = "ERROR"
        error_msg = None

        try:
            resp = requests.post(
                API_URL,
                json={"url": url},
                headers={"Accept": "text/event-stream"},
                stream=True,
                timeout=timeout,
            )
            if resp.status_code != 200:
                error_msg = f"HTTP {resp.status_code}"
                color = "ERROR"
            else:
                parsed = parse_sse_threat_score(resp)
                threat_score = parsed["threat_score"]
                error_msg = parsed["error"]
                color = classify_score(threat_score)

        except requests.exceptions.Timeout:
            color = "TIMEOUT"
            error_msg = f"Exceeded {timeout}s timeout"
        except requests.exceptions.ConnectionError:
            color = "ERROR"
            error_msg = "Connection refused — is the dev server running?"
        except Exception as e:
            color = "ERROR"
            error_msg = str(e)

        elapsed = time.time() - t0
        result_grade = grade(category, color)

        status_icon = {"PASS": "+", "FAIL": "X", "WARN": "~", "ERROR": "!"}[result_grade]
        print(f"  -> {color:8s} ({threat_score or '-':>5}) [{status_icon}] {elapsed:.1f}s")

        results.append({
            "url": url,
            "category": category,
            "reason": reason,
            "threat_score": threat_score,
            "color": color,
            "grade": result_grade,
            "error": error_msg,
            "time_s": round(elapsed, 2),
        })

    return pd.DataFrame(results)


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def print_summary(df: pd.DataFrame) -> None:
    total = len(df)
    testable = df[df["grade"] != "ERROR"]
    testable_count = len(testable)

    passes = len(df[df["grade"] == "PASS"])
    fails = len(df[df["grade"] == "FAIL"])
    warns = len(df[df["grade"] == "WARN"])
    errors = len(df[df["grade"] == "ERROR"])

    safe_cats = df[df["category"].isin(["high_authority", "hard_negative"])]
    phish_cats = df[df["category"] == "real_phishing"]

    false_positives = safe_cats[safe_cats["grade"] == "FAIL"]
    false_negatives = phish_cats[phish_cats["grade"] == "FAIL"]

    fp_rate = len(false_positives) / len(safe_cats) * 100 if len(safe_cats) > 0 else 0
    fn_rate = len(false_negatives) / len(phish_cats) * 100 if len(phish_cats) > 0 else 0
    accuracy = passes / testable_count * 100 if testable_count > 0 else 0

    print("\n" + "=" * 72)
    print("  SENTINEL MASS ACCURACY TEST — RESULTS")
    print("=" * 72)

    print(f"\n  Total URLs tested:    {total}")
    print(f"  Testable (non-error): {testable_count}")
    print(f"  Errors/Timeouts:      {errors}")

    print(f"\n  {'Metric':<28} {'Value':>10}")
    print(f"  {'-' * 28} {'-' * 10}")
    print(f"  {'Accuracy':<28} {accuracy:>9.1f}%")
    print(f"  {'False Positive Rate':<28} {fp_rate:>9.1f}%")
    print(f"  {'False Negative Rate':<28} {fn_rate:>9.1f}%")
    print(f"  {'PASS':<28} {passes:>10}")
    print(f"  {'WARN (yellow zone)':<28} {warns:>10}")
    print(f"  {'FAIL':<28} {fails:>10}")

    # Breakdown by category
    print(f"\n  {'Category':<20} {'Count':>6} {'Pass':>6} {'Fail':>6} {'Warn':>6} {'Err':>6}")
    print(f"  {'-' * 20} {'-' * 6} {'-' * 6} {'-' * 6} {'-' * 6} {'-' * 6}")
    for cat in ["high_authority", "hard_negative", "real_phishing"]:
        subset = df[df["category"] == cat]
        print(
            f"  {cat:<20} {len(subset):>6} "
            f"{len(subset[subset['grade'] == 'PASS']):>6} "
            f"{len(subset[subset['grade'] == 'FAIL']):>6} "
            f"{len(subset[subset['grade'] == 'WARN']):>6} "
            f"{len(subset[subset['grade'] == 'ERROR']):>6}"
        )

    # Top false positives
    if len(false_positives) > 0:
        print(f"\n  FALSE POSITIVES — Legitimate sites flagged as dangerous:")
        for _, row in false_positives.head(5).iterrows():
            print(f"    - {row['url']}")
            print(f"      Score: {row['threat_score']}  |  {row['reason']}")

    # Top false negatives
    if len(false_negatives) > 0:
        print(f"\n  FALSE NEGATIVES — Phishing sites marked as safe:")
        for _, row in false_negatives.head(5).iterrows():
            print(f"    - {row['url']}")
            print(f"      Score: {row['threat_score']}")

    print("\n" + "=" * 72)


# ---------------------------------------------------------------------------
# Entry
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="SENTINEL Mass Accuracy Test")
    parser.add_argument(
        "--dataset",
        default=str(Path(__file__).parent / "urls.json"),
        help="Path to the URL dataset JSON (default: test-data/urls.json)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=5,
        help="Per-request timeout in seconds (default: 5)",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).parent / "test_results.csv"),
        help="Output CSV path (default: test-data/test_results.csv)",
    )
    args = parser.parse_args()

    print("=" * 72)
    print("  SENTINEL MASS ACCURACY TEST")
    print("=" * 72)
    print(f"  Dataset:  {args.dataset}")
    print(f"  API:      {API_URL}")
    print(f"  Timeout:  {args.timeout}s per request")
    print(f"  Output:   {args.output}")
    print()

    # Quick connectivity check
    print("  Checking API connectivity...", end=" ", flush=True)
    try:
        requests.post(API_URL, json={"url": "https://google.com"}, timeout=3, stream=True).close()
        print("OK")
    except requests.exceptions.ConnectionError:
        print("FAILED")
        print("\n  ERROR: Cannot connect to localhost:3000.")
        print("  Start the dev server first:  npm run dev")
        sys.exit(1)
    except Exception:
        print("OK (non-connection error, server is reachable)")

    dataset = load_dataset(args.dataset)
    print(f"\n  Loaded {len(dataset)} URLs "
          f"({sum(1 for d in dataset if d['category'] == 'high_authority')} authority, "
          f"{sum(1 for d in dataset if d['category'] == 'hard_negative')} hard-neg, "
          f"{sum(1 for d in dataset if d['category'] == 'real_phishing')} phishing)\n")

    df = run_tests(dataset, args.timeout)

    # Save CSV
    df.to_csv(args.output, index=False)
    print(f"\n  Full results saved to: {args.output}")

    print_summary(df)


if __name__ == "__main__":
    main()
