import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = mkdtempSync(resolve(tmpdir(), "intake-output-safety-"));
try {
  const input = resolve(root, "input");
  const output = resolve(root, "output");
  const sentinel = resolve(root, "sentinel.txt");
  mkdirSync(input);
  mkdirSync(output);
  writeFileSync(resolve(input, "package.zip"), "not read because output validation runs first");
  writeFileSync(resolve(input, "memorandum.pdf"), "not read because output validation runs first");
  writeFileSync(sentinel, "SENTINEL_UNCHANGED\n");
  symlinkSync(sentinel, resolve(output, "candidate-facts.json"));

  const tool = resolve(dirname(fileURLToPath(import.meta.url)), "import-intake.mjs");
  const result = spawnSync(process.execPath, [
    tool,
    "--zip", resolve(input, "package.zip"),
    "--om", resolve(input, "memorandum.pdf"),
    "--out", output,
    "--force",
  ], { encoding: "utf8" });

  assert.notEqual(result.status, 0, "importer must refuse an expected-name symlink");
  assert.match(result.stderr, /refusing unsafe existing output/);
  assert.equal(readFileSync(sentinel, "utf8"), "SENTINEL_UNCHANGED\n");
  console.log("expected-name symlink refusal: OK");
} finally {
  rmSync(root, { recursive: true, force: true });
}