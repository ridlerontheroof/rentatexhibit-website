/**
 * Task-618 investigation harness: what email does AppFolio auto-send when a
 * guest card is created against the hidden "Tour" unit (general-tour path),
 * and can the request carry any property/listing context that switches the
 * auto-responder to the Exhibit property template?
 *
 * Usage (from artifacts/api-server):
 *   npx esbuild scripts/probe-tour-branding.ts --bundle --platform=node --format=esm \
 *     --outfile=/tmp/probe-tour-branding.mjs --log-level=warning && \
 *   NODE_ENV=production node /tmp/probe-tour-branding.mjs <variant>
 *
 * Variants:
 *   baseline  — plain guest card against the tour unit UID (clearly-marked test data)
 *   propctx   — same, plus property/listing context fields to see if AppFolio accepts them
 *
 * All test prospects use the site's own IMAP-readable mailbox (+alias) so the
 * auto-email can be inspected without involving a real prospect.
 */
import { isTourUnitName } from "../src/lib/tourUnit";

const APPFOLIO_DB = process.env.APPFOLIO_DATABASE ?? "highlandrealestatepartners";
const variant = process.argv[2] ?? "baseline";

/** Inline tour-unit UID resolution (unit_directory report, exact-key reads). */
async function resolveTourUnitListableUid(): Promise<string | null> {
  const auth =
    "Basic " +
    Buffer.from(`${process.env.APPFOLIO_CLIENT_ID}:${process.env.APPFOLIO_CLIENT_SECRET}`).toString(
      "base64",
    );
  const res = await fetch(`https://${APPFOLIO_DB}.appfolio.com/api/v2/reports/unit_directory.json`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`unit_directory failed: ${res.status}`);
  const data = (await res.json()) as { results?: Record<string, unknown>[] };
  for (const row of data.results ?? []) {
    const name = typeof row.unit_name === "string" ? row.unit_name.trim() : "";
    if (name && isTourUnitName(name)) {
      const uid = row.rentable_uid;
      if (typeof uid === "string" && uid.trim()) return uid.trim().toLowerCase();
    }
  }
  return null;
}

async function main() {
  const uid = await resolveTourUnitListableUid();
  console.log("tour unit listable uid:", uid);
  if (!uid) throw new Error("could not resolve tour unit uid");

  const stamp = Date.now().toString(36).slice(-5);
  const alias = `leasingexhibit+t618${variant}${stamp}@highlandptrs.com`;
  const body: Record<string, unknown> = {
    first_name: "Websitetest",
    last_name: "Pleasedisregard",
    email_address: alias,
    phone_number: `555010${String(Date.now()).slice(-4)}`,
    listable_uid: uid,
    source: "Website (Exhibit)",
    skip_cta_for_new_inquiries: true,
  };
  console.log("prospect alias:", alias);

  const res = await fetch(`https://${APPFOLIO_DB}.appfolio.com/listings/api/guest_cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  console.log("status:", res.status, "body:", text.slice(0, 500));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
