# Fact Conflicts

## 2026-07-30 — Task 01 baseline audit

### Fee schedule: property_context historical values vs live /fees page
- **Source A (rank 1, config):** `highland-seo-aeo-installer-package/payload/config/property_context.yaml` lists fees under `status: time_sensitive` with instruction "Do not hardcode fees from this file until management verifies": Utility & Service Amenity fee **$95/month (flat, historical)**, admin $500, application $60.
- **Source B (rank 2, live site):** `https://www.rentatexhibit.com/fees` publishes Utility & Service Amenity fee as **$95–$195/month tiered by floor plan**, plus $60 application, $500 admin, $0 deposit, $335 parking, $25 storage, pet fees ($650/$750 dogs, $325 cats).
- **Conflict:** the config's historical flat $95 does not match the live tiered $95–$195 schedule; the config itself flags its values as unverified.
- **Action taken:** none (read-only task). Per conflict policy, the existing public claim is preserved.
- **Resolution needed:** management to confirm the current fee schedule and update `property_context.yaml` to `authority: canonical_after_human_review` values. Until then, treat the live /fees page as the public claim of record and do not propagate config fee values into content.
