import { readFile } from "node:fs/promises";

const release = JSON.parse(
  await readFile(new URL("../launcher-release.json", import.meta.url), "utf8"),
);

console.log(`Highland property-site launcher — pinned to ${release.tag}`);
console.log("");
console.log("Upload both required inputs in chat:");
console.log("  1. Claude-generated website ZIP");
console.log("  2. Property offering memorandum (OM)");
console.log("");
console.log("Then ask Agent to run the property-site-onboarding skill for inventory only.");
console.log("Do not add facts, credentials, or Account Secret links to this launcher.");