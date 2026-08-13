/**
 * Manual runner for the weekly SEO digest: pulls Search Console + GA4 data
 * for the trailing two 7-day windows and sends the digest email immediately,
 * bypassing the once-per-week claim (useful for a first-time verification or
 * an out-of-band re-send).
 *
 * Usage (from artifacts/api-server):
 *   pnpm run send:seo-digest              # sends to LEASING_INBOX_EMAIL / SEO_DIGEST_EMAIL
 *   SEO_DIGEST_EMAIL=me@x.com pnpm run send:seo-digest
 *
 * Exits non-zero on any failure (unauthorized Search Console access prints
 * the exact grant instructions).
 */
import {
  readSeoDigestConfig,
  fetchSeoDigestData,
  GscUnauthorizedError,
} from "../src/lib/seoWeeklyDigest";
import { sendSeoWeeklyDigest } from "../src/lib/email";

async function main(): Promise<void> {
  const config = readSeoDigestConfig();
  if (!config) {
    console.error(
      "send-seo-digest: GA4_SERVICE_ACCOUNT_JSON is not set — the digest needs the Google service account key.",
    );
    process.exit(2);
  }
  try {
    const data = await fetchSeoDigestData(config);
    await sendSeoWeeklyDigest(data);
    console.log(
      `Digest sent (window ${data.windows.current.start}..${data.windows.current.end}; ` +
        `${data.risingQueries.length} rising / ${data.fallingQueries.length} falling queries, ` +
        `${data.nearWinners.length} near-winners, ${data.blogPages.length} blog pages).`,
    );
  } catch (err) {
    if (err instanceof GscUnauthorizedError) {
      if (err.reason === "SERVICE_DISABLED") {
        console.error(
          `send-seo-digest: The Google Search Console API is not enabled in the GCP project (HTTP ${err.httpStatus}).\n` +
            `Fix it: open Google Cloud Console → APIs & Services → Enable APIs and search for\n` +
            `  "Google Search Console API"\n` +
            `or go directly to:\n` +
            `  https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview\n` +
            `The service account is: ${config.clientEmail}`,
        );
      } else {
        console.error(
          `send-seo-digest: Search Console refused access (HTTP ${err.httpStatus}).\n` +
            `Grant it: open Search Console for ${config.gscSiteUrl} → Settings → Users and permissions → ` +
            `add ${config.clientEmail} with "Restricted" (read) access. ` +
            `If the property type differs, set GSC_SITE_URL to the exact property.`,
        );
      }
    } else {
      console.error("send-seo-digest: failed:", err instanceof Error ? err.message : err);
    }
    process.exit(1);
  }
}

void main();
