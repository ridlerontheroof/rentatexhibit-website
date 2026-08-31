import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateKitV2EnvironmentManifest } from "../packages/config/src/index.ts";

const source = JSON.parse(await readFile(resolve("config/release-environment-manifest.json"), "utf8"));
const reject = (mutate, label) => {
  const copy = structuredClone(source); mutate(copy);
  try { validateKitV2EnvironmentManifest(copy); } catch { return; }
  throw new Error(`G5 validator accepted ${label}`);
};
validateKitV2EnvironmentManifest(source);
reject((m) => m.entries.pop(), "missing roster row");
reject((m) => m.entries.push(structuredClone(m.entries[0])), "duplicate roster row");
reject((m) => { m.entries[0].artifact = "web"; }, "wrong artifact");
reject((m) => { m.entries[0].environment = "development"; }, "wrong environment");
reject((m) => { m.entries[0].scopeVerified = false; }, "unverified account scope");
reject((m) => { m.entries[0].accountSecretName = "WRONG"; }, "wrong account secret name");
reject((m) => { delete m.entries[0].approvedAt; }, "missing row approval metadata");
process.stdout.write("kit-v2 exact G5 roster validation passed\n");