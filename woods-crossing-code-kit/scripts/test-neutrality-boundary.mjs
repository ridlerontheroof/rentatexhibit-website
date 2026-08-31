import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { propertyBearingRoots } from "./validate-neutrality.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const releaseMetadata = await readFile(resolve(root, "release.json"), "utf8");

assert.match(
  releaseMetadata,
  /rentatexhibit-website/i,
  "fixture must retain publication provenance that resembles a source-property literal",
);
assert.ok(
  !propertyBearingRoots.includes("release.json"),
  "publication provenance metadata must remain outside the property-bearing neutrality surface",
);

process.stdout.write("neutrality boundary regression: publication provenance is not scanned as runnable property content\n");