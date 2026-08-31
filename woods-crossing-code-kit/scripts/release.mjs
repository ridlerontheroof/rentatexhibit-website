import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const status = execFileSync("git", ["status", "--porcelain", "--", root], { cwd: root, encoding: "utf8" });
if (status.trim()) throw new Error("Release preparation requires a clean kit tree. Commit reviewed changes before creating a release.");
const env = {
  ...process.env,
  PROPERTY_CONFIG_PATH: resolve(root, "config/example-property-config.json"),
};
execFileSync("pnpm", ["check:kit-release"], { cwd: root, env, stdio: "inherit" });
execFileSync("pnpm", ["build"], { cwd: root, env, stdio: "inherit" });
const release = JSON.parse(readFileSync(resolve(root, "release.json"), "utf8"));
const tag =
  release.publication?.status === "withdrawn"
    ? release.publication?.replacement?.tag
    : release.tag;
if (!tag) throw new Error("Release metadata must identify the annotated tag for this candidate.");
const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const recordedCandidate =
  release.publication?.replacement?.status === "candidate-validated"
    ? release.publication.replacement.candidateCommit
    : null;
if (recordedCandidate) {
  execFileSync("git", ["cat-file", "-e", `${recordedCandidate}^{commit}`], { cwd: root });
  execFileSync(
    "git",
    ["diff", "--quiet", recordedCandidate, head, "--", ".", ":(exclude)release.json"],
    { cwd: root },
  );
}
const finalStatus = execFileSync("git", ["status", "--porcelain", "--", root], {
  cwd: root,
  encoding: "utf8",
});
if (finalStatus.trim()) throw new Error("Release gates modified the kit tree; the final checkout is not clean.");
const tagTarget = recordedCandidate || head;
process.stdout.write(
  `Candidate verified at ${tagTarget}. Release owner may now run: git tag -a ${tag} ${tagTarget}\n`,
);