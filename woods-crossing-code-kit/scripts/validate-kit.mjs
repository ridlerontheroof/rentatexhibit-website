import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
for (const script of ["validate-config.mjs", "validate-guards.mjs", "validate-neutrality.mjs"]) {
  const result = spawnSync(process.execPath, [resolve(root, "scripts", script)], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
process.stdout.write("kit validation passed\n");