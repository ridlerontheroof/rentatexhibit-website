/**
 * CLI wrapper used by the website's `generate:article` pipeline: sends the
 * "new blog draft awaiting review" note to the leasing inbox after a draft
 * lands in src/data/blogArticles.ts.
 *
 * Usage (from artifacts/api-server, via package script):
 *   pnpm run send:blog-draft-review -- /path/to/draft-note.json
 *
 * The JSON file must contain:
 *   { slug, title, targetQuery, authorName, summary, wordCount }
 *
 * This email is informational only — it is never publish authority.
 * Exits non-zero when the mailer is unconfigured or the send fails so the
 * caller can surface the failure (the draft itself has already landed).
 */
import { readFileSync } from "node:fs";
import { sendBlogDraftReviewNote } from "../src/lib/email";

const file = process.argv[2];
if (!file) {
  console.error("Usage: send-blog-draft-review <draft-note.json>");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
const required = ["slug", "title", "targetQuery", "authorName", "summary", "wordCount"];
for (const key of required) {
  if (raw[key] === undefined || raw[key] === null || raw[key] === "") {
    console.error(`send-blog-draft-review: missing field "${key}" in ${file}`);
    process.exit(2);
  }
}

sendBlogDraftReviewNote({
  slug: String(raw.slug),
  title: String(raw.title),
  targetQuery: String(raw.targetQuery),
  authorName: String(raw.authorName),
  summary: String(raw.summary),
  wordCount: Number(raw.wordCount),
  inboundHostSlug: raw.inboundHostSlug ? String(raw.inboundHostSlug) : undefined,
  draftText: raw.draftText ? String(raw.draftText) : undefined,
})
  .then(() => {
    console.log(`Review note sent for /blog/${String(raw.slug)}`);
  })
  .catch((err) => {
    console.error("send-blog-draft-review: send failed:", err?.message ?? err);
    process.exit(1);
  });
