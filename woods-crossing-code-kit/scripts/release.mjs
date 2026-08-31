import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const status = execFileSync("git", ["status", "--porcelain", "--", root], { cwd: root, encoding: "utf8" });
if (status.trim()) throw new Error("Release preparation requires a clean kit tree. Commit reviewed changes before creating a release.");
execFileSync("pnpm", ["check:kit-release"], { cwd: root, stdio: "inherit" });
execFileSync("pnpm", ["build"], { cwd: root, stdio: "inherit" });
const tag = "kit-v2.0.0";
const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
process.stdout.write(`Candidate verified at HEAD ${head}. Release owner may now run: git tag -a ${tag} HEAD\n`);