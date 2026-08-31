import { readFile, rename, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const map = resolve(root, "web/dist/legacy-redirects.json");
const saved = resolve(root, "web/dist/legacy-redirects.acceptance-save.json");
const expectFailure = async (label) => {
  const child = spawn(process.execPath, ["web/server/index.mjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: "4539" }, stdio: "ignore" });
  const result = await Promise.race([new Promise((done) => child.once("exit", done)), new Promise((done) => setTimeout(() => done("running"), 2500))]);
  if (result === "running") { child.kill("SIGKILL"); throw new Error(`static server accepted ${label} redirect map`); }
  if (result === 0) throw new Error(`static server exited successfully with ${label} redirect map`);
};
const original = await readFile(map);
try {
  await rename(map, saved);
  await expectFailure("missing");
  await rename(saved, map);
  await writeFile(map, "[]");
  await expectFailure("malformed");
} finally {
  await writeFile(map, original);
  try { await rename(saved, map); } catch {}
}
process.stdout.write("production redirect-map startup rejection passed\n");