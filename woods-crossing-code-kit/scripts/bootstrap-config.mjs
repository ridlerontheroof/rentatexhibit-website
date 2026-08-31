import { copyFile, mkdir, stat, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const destination = resolve(process.argv[2] || "property-config.json");
if (await stat(destination).then(() => true).catch(() => false)) {
  throw new Error(`Refusing to overwrite existing configuration: ${destination}`);
}
await mkdir(dirname(destination), { recursive: true });
const starter = JSON.parse(await readFile(resolve(root, "config/example-property-config.json"), "utf8"));
starter.environmentManifestPath = "environment-manifest.json";
starter.contentManifestPath = "content-manifest.json";
await writeFile(destination, JSON.stringify(starter, null, 2) + "\n");
const manifestDestination = resolve(dirname(destination), "environment-manifest.json");
const contentDestination = resolve(dirname(destination), "content-manifest.json");
if (!await stat(manifestDestination).then(() => true).catch(() => false)) {
  await copyFile(resolve(root, "config/environment-manifest.json"), manifestDestination);
}
if (!await stat(contentDestination).then(() => true).catch(() => false)) {
  const content = JSON.parse(await readFile(resolve(root, "config/content-manifest.json"), "utf8"));
  content.propertySlug = starter.property.slug;
  await writeFile(contentDestination, JSON.stringify(content, null, 2) + "\n");
}
process.stdout.write(`created ${destination}, ${manifestDestination}, and ${contentDestination}\nEdit and approve manifests, then validate the selected property.\n`);