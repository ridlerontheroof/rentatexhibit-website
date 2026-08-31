import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
if (!process.env.SITE_URL) throw new Error("SITE_URL is required for prepublish:online");
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
for (const id of ["head.per-url","index.real-404","jsonld.valid","a11y.axe","redirects.one-hop","leads.bot-guard","appfolio.feed-health","ops.postpublish-watch","content.systems-live"]) {
  execFileSync(process.execPath, [resolve(root, "scripts/run-baseline-guard.mjs"), id], { cwd: root, env: { ...process.env, KIT_GUARD_MODE: "online" }, stdio: "inherit" });
}