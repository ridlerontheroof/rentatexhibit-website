import assert from "node:assert/strict";
import test from "node:test";
import { validateLauncher } from "./validate-launcher.mjs";

test("launcher stays neutral and pinned to the reviewed factory release", async () => {
  const result = await validateLauncher();
  assert.deepEqual(result.errors, []);
});

test("standalone validation does not require the factory repository as a sibling", async () => {
  const source = await import("node:fs/promises")
    .then(({ readFile }) => readFile(new URL("./validate-launcher.mjs", import.meta.url), "utf8"));
  assert.doesNotMatch(source, /\.\.\/woods-crossing-code-kit/);
  assert.match(source, /raw\.githubusercontent\.com/);
});