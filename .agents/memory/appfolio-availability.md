---
name: AppFolio availability integration
description: How live unit availability is fed from AppFolio and why it cannot be verified from the dev workspace
---

- Live units come from the AppFolio Reports API `unit_vacancy.json` (POST, HTTP Basic with APPFOLIO_CLIENT_ID/SECRET secrets), proxied by the api-server `/availability` route with a 5-min cache.
- **The AppFolio database is `highlandrealestatepartners`.appfolio.com** (from the Duda CMS "AppFolio Database" field), NOT `highlandptrs`. Overridable via APPFOLIO_DATABASE env var.
- The Duda `appfolio-listings` collection field list (marketing_title/description, market_rent, rent_or_starting_at, available_date, bedrooms, bathrooms, square_feet, cats/dogs, fees, youtube_video_id, posted_to_website…) is data-only — listing photos are not in the field set.
- AppFolio's edge blocking is **intermittent/host-dependent**: probes against the wrong db host (`highlandptrs`) all failed with 302/503, but the correct db (`highlandrealestatepartners`) works fine from the workspace. Don't conclude "blocked" without the right host.
- Real unit_vacancy detail columns: `unit`, `sqft` (number), `advertised_rent` ("4222.00"), `bed_and_bath` ("2/2.00" combined), `available_on` (often null), `unit_turn_target_date`, `unit_status` ("Notice-Unrented"/"Notice-Rented"/"Vacant-…"). Normalizer parses bed_and_bath, falls back to turn-target date, and drops re-rented statuses (report includes ~2/3 already-rented rows).
- The highlandptrs.com Duda site syncs the same data via Duda "External Collections" polling an endpoint with an auth header — Duda-only plumbing, not reusable.
- **Listing photos come from the PUBLIC listings page** `https://<db>.appfolio.com/listings?filters[property_list]=Exhibit` (what AppFolio's listing.js embed widget iframes; no auth, not egress-blocked). Cards carry cover photo (images.cdn.appfolio.com) + /listings/detail/<uuid> gallery links; api-server parses this HTML best-effort into photoUrl/listingUrl. Only units the leasing team posts to website have listings/photos. No photo fields exist anywhere in the Data API reports; YouTube URL comes from the unit_directory report.
- Frontend maps AppFolio apartment numbers (FFUU) to floor-plan groups via the last-2-digit unit line (see floor-plan-unit-numbers.md); the Available Residences strip on /floor-plans hides itself on error/empty.
