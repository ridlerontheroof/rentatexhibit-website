# Off-Site Authority Checklist (Owner Actions)

These are the playbook's off-site authority items that **code cannot do** — they
require a human with account access. Work top to bottom; the top items move the
needle most for a single-location leasing site.

## 1. Google Business Profile (highest priority)
The GBP is the biggest off-site ranking and conversion lever for a local
property.

- [ ] Claim/verify the profile for **Exhibit On Superior, 165 W Superior St,
      Chicago, IL 60654**.
- [ ] Confirm NAP exactly matches the site: name **Exhibit On Superior**, phone
      **312-450-0635**, address as above. (These are the canonical values in
      `src/data/propertyFacts.ts` / `seo.ts`.)
- [ ] Category: "Apartment building" (primary) + "Apartment rental agency".
- [ ] Hours: Mon–Fri 9:00 AM–6:00 PM, Sat 10:00 AM–5:00 PM, Sun closed.
- [ ] Add 15+ photos: exterior, lobby, pool, sauna, model units, amenity
      spaces, neighborhood. Refresh quarterly.
- [ ] Write the "from the business" description (reuse the `/about` copy; do not
      invent new facts).
- [ ] **Reply to every review** (positive and negative) within a week. This is
      an ongoing weekly task, not one-time.
- [ ] Resolve the duplicate profile showing the stale 4.2/136 rating — request a
      Google merge (see `.agents/memory/google-reviews-listing.md`).
- [ ] Post a GBP update monthly (availability, amenity highlight, neighborhood
      note).

## 2. Consistent NAP across apartment directories
Inconsistent name/address/phone across the web dilutes local authority. Use the
committed `docs/directory-listings/fact-sheet.txt` as the single source when
filling these out.

- [ ] Apartments.com
- [ ] Zillow Rentals
- [ ] Apartment List
- [ ] Rent.com
- [ ] Trulia / HotPads
- [ ] Yelp (business listing)
- [ ] Apple Maps / Bing Places
For each: confirm name, address, phone, website URL (`https://www.rentatexhibit.com`)
match exactly. Fix any that show an old phone, old management name, or a
non-www URL.

## 3. Unlinked-mention reclamation (quarterly)
- [ ] Search `"Exhibit On Superior" -site:rentatexhibit.com` on Google.
- [ ] For press, blog, or directory mentions that name the building but don't
      link to it, email the site owner and ask them to link to
      `https://www.rentatexhibit.com`.
- [ ] Track outreach in a simple spreadsheet (date, site, outcome).

## 4. One local digital-PR idea per quarter
Pick one per quarter — real, local, and honest (no fabricated stats):
- [ ] Neighborhood guide contribution to a River North community site.
- [ ] Local-business cross-promotion (a nearby cafe, gym, or gallery).
- [ ] Sponsor/participate in a River North community event and earn a mention.
- [ ] Resident-story feature (with permission) pitched to a local outlet.

## Notes
- Do not create fake reviews or buy links — both violate Google policy and risk
  the profile.
- Keep every off-site fact identical to the on-site canonical values; drift is
  the most common cause of local-SEO trust loss.
