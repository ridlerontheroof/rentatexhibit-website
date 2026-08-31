import assert from "node:assert/strict";
import test from "node:test";
import { validateLauncher } from "./validate-launcher.mjs";

test("launcher stays neutral and pinned to the reviewed factory release", async () => {
  const result = await validateLauncher();
  assert.deepEqual(result.errors, []);
});