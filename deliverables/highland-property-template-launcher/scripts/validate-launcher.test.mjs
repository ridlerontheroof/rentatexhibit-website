import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { validateLauncher } from "./validate-launcher.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);

test("launcher stays neutral and pinned to the reviewed factory release", async () => {
  const result = await validateLauncher();
  assert.deepEqual(result.errors, []);
});

test("standalone validation does not require the factory repository as a sibling", async () => {
  const source = await readFile(new URL("./validate-launcher.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.\.\/woods-crossing-code-kit/);
  assert.match(source, /raw\.githubusercontent\.com/);
});

test("Replit-generated Node tooling directories do not break validation", async () => {
  const generatedDirectory = resolve(root, ".config", "replit-node-tools");
  await mkdir(generatedDirectory, { recursive: true });
  await writeFile(resolve(generatedDirectory, "state"), "generated runtime state");
  try {
    const result = await validateLauncher();
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(resolve(root, ".config"), { recursive: true, force: true });
  }
});