import assert from "node:assert/strict";
import { propertyBearingRoots } from "./validate-neutrality.mjs";

const publicationProvenanceFixture = JSON.stringify({
  repository: "https://example.invalid/rentatexhibit-website",
});

assert.match(
  publicationProvenanceFixture,
  /rentatexhibit-website/i,
  "fixture must retain publication provenance that resembles a source-property literal",
);
assert.ok(
  !propertyBearingRoots.includes("release.json"),
  "publication provenance metadata must remain outside the property-bearing neutrality surface",
);

process.stdout.write("neutrality boundary regression: publication provenance is not scanned as runnable property content\n");