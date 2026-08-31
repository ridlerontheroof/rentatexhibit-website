import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const propertyConfigPath = new URL("../config/example-property-config.json", import.meta.url).pathname;
const api = spawn("pnpm", ["--filter", "@highland/property-api", "start"], { cwd: root, env: { ...process.env, NODE_ENV: "development", PROPERTY_CONFIG_PATH: propertyConfigPath, PORT: "4311" }, stdio: "pipe", detached: true });
const web = spawn("pnpm", ["--filter", "@highland/property-web", "dev"], { cwd: root, env: { ...process.env, PORT: "4310", DEV_API_ORIGIN: "http://127.0.0.1:4311" }, stdio: "pipe", detached: true });
const stop = () => {
  for (const child of [api, web]) {
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
  }
};
const waitFor = async (url) => {
  for (let i = 0; i < 80; i++) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
};
try {
  const home = await waitFor("http://127.0.0.1:4310/");
  if (!(await home.text()).includes('id="root"')) throw new Error("web root missing React mount");
  const health = await (await waitFor("http://127.0.0.1:4310/api/healthz")).json();
  if (health.status !== "ok") throw new Error("health route failed");
  const config = await (await waitFor("http://127.0.0.1:4310/api/config/public")).json();
  if (config.property?.slug !== "example-property") throw new Error("public config route failed");
  const content = await (await waitFor("http://127.0.0.1:4310/api/content/faqs")).json();
  if (!Array.isArray(content.items)) throw new Error("content route failed");
  const lead = await fetch("http://127.0.0.1:4310/api/leads", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ xh_note: "bot-filled", elapsedMs: 1 })
  });
  if (lead.status !== 201 || (await lead.json()).id !== 0) throw new Error("retained leads route did not execute bot guard");
  process.stdout.write("smoke passed: web root + proxied health/config/content + retained leads bot route\n");
} finally { stop(); }