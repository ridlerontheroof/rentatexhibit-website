import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const factoryReleasePath = resolve(root, "../woods-crossing-code-kit/release.json");
const execFileAsync = promisify(execFile);
const allowedFiles = new Set([
  ".replit",
  "README.md",
  "custom_instruction/instructions.md",
  "launcher-release.json",
  "package.json",
  "scripts/first-run.mjs",
  "scripts/validate-launcher.mjs",
  "scripts/validate-launcher.test.mjs",
]);
const forbiddenNames = /(^|\/)(\.env($|\.)|property-config\.json$|environment-manifest\.json$|secrets?($|\.))/i;
const credentialAssignment = /\b(?:API_KEY|SECRET|TOKEN|PASSWORD|DATABASE_URL)\s*=\s*\S+/i;
const accountSecretLink = /\baccount-secret-link\b/i;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
}

export async function validateLauncher() {
  const errors = [];
  const files = await listFiles(root);
  for (const path of files) {
    const rel = relative(root, path).replaceAll("\\", "/");
    if (!allowedFiles.has(rel)) errors.push(`unexpected launcher file: ${rel}`);
    if (forbiddenNames.test(rel)) errors.push(`forbidden fact/secret file: ${rel}`);
    const text = await readFile(path, "utf8");
    if (credentialAssignment.test(text)) errors.push(`possible credential assignment in ${rel}`);
    if (rel !== "custom_instruction/instructions.md" && rel !== "README.md" &&
        rel !== "scripts/validate-launcher.mjs" && accountSecretLink.test(text)) {
      errors.push(`Account Secret link declaration outside instructions in ${rel}`);
    }
  }

  const lock = JSON.parse(await readFile(join(root, "launcher-release.json"), "utf8"));
  const factory = JSON.parse(await readFile(factoryReleasePath, "utf8"));
  for (const field of ["kit", "tag", "version", "implementationDigest"]) {
    if (lock[field] !== factory[field]) {
      errors.push(`launcher ${field} does not match factory release`);
    }
  }
  if (!/^kit-v\d+\.\d+\.\d+$/.test(lock.tag)) errors.push("launcher tag is not immutable semantic form");
  if (!/^[a-f0-9]{64}$/.test(lock.implementationDigest)) errors.push("launcher digest is not SHA-256");
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+\.git$/.test(lock.repository)) {
    errors.push("launcher repository must be an explicit HTTPS Git repository");
  }
  if (lock.subdirectory !== "woods-crossing-code-kit") {
    errors.push("launcher kit subdirectory is unexpected");
  }
  if (!/^[a-f0-9]{40}$/.test(lock.tagCommit)) errors.push("launcher tag commit is not a Git SHA");

  try {
    const { stdout } = await execFileAsync(
      "git",
      ["ls-remote", "--tags", lock.repository, `refs/tags/${lock.tag}`, `refs/tags/${lock.tag}^{}`],
      { timeout: 30_000 },
    );
    const refs = new Map(stdout.trim().split("\n").filter(Boolean).map((line) => {
      const [sha, ref] = line.split(/\s+/, 2);
      return [ref, sha];
    }));
    const tagObject = refs.get(`refs/tags/${lock.tag}`);
    const peeledCommit = refs.get(`refs/tags/${lock.tag}^{}`);
    if (!tagObject || !peeledCommit) errors.push("remote release must be an annotated tag");
    if (peeledCommit && peeledCommit !== lock.tagCommit) {
      errors.push("remote release tag no longer resolves to the pinned commit");
    }
  } catch (error) {
    errors.push(`could not verify remote release tag: ${error.message}`);
  }

  return {
    errors,
    fingerprint: createHash("sha256")
      .update(`${lock.tag}:${lock.implementationDigest}`)
      .digest("hex"),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateLauncher();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`launcher valid (${result.fingerprint.slice(0, 12)})`);
  }
}