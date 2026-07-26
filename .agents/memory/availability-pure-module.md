---
name: Pure availability data module
description: Keep availability types + normalizeAvailability out of the React hook file so data-layer imports don't break hook mocks.
---
Rule: availability data shapes and `normalizeAvailability`/`fixAmenitySpelling` live in `src/lib/availabilityData.ts` (pure, no React); `use-availability` re-exports them for compatibility.

**Why:** Many component tests `vi.mock` the use-availability hook module with only the hook export. When a pure data module (seo → startingRent → availabilitySnapshot) transitively imported `normalizeAvailability` from the hook file, every one of those mocks failed with "No normalizeAvailability export".

**How to apply:** Any new build-time/data-layer code needing availability shapes or normalization must import from `lib/availabilityData.ts`, never from `hooks/use-availability`. Also: the homepage FAQ starting price and the how-much-is-rent knowledge article share `startingRentSentence()` so the FAQ↔knowledge fact-drift guard sees the identical dollar token on both surfaces — keep them sharing that helper.
