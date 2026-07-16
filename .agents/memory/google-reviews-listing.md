---
name: Google reviews listing discrepancy
description: Why the live Google reviews feed shows far fewer reviews than the old hand-copied 4.2/136 figures.
---

The Places API (New) resolves "Exhibit on Superior" to the same listing the site's Maps CTA links to (verified via CID), and Google reports it has only ~2 reviews. The historical 4.2 / 136 aggregate came from an older/duplicate Google Business Profile.

**Why:** Reviews cannot be imported via API; only Google Business Profile support can merge the old profile's reviews into the current listing. User chose (July 2026) to pursue the merge with Google and keep the live feed pointed at the current listing.

User then chose a hybrid display: the three original curated quotes are always shown, live Google quotes are appended after them, and the curated 4.2/136 aggregate is kept until the live listing's review count reaches it (then live figures take over).

**How to apply:** Don't treat the low review count as a bug in the proxy/feed. Once Google merges the profiles, the site updates automatically. If the user later supplies a Maps link to the old profile, point the server's place resolution at that Place ID instead.
