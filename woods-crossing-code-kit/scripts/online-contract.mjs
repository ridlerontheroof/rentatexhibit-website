const id = process.argv[2];
const base = process.env.SITE_URL?.replace(/\/$/, "");
if (!base) throw new Error("SITE_URL is required");
if (id === "index.real-404") {
  const url = `${base}/__kit-unknown-${Date.now()}-never-exists`;
  const response = await fetch(url, { redirect: "manual" });
  const body = await response.text();
  if (![404, 410].includes(response.status)) throw new Error(`unknown path returned ${response.status}`);
  if (!/noindex/i.test(body) && !/noindex/i.test(response.headers.get("x-robots-tag") || "")) throw new Error("404/410 lacks noindex");
} else if (id === "leads.bot-guard") {
  const api = (process.env.API_SERVER_URL || base).replace(/\/$/, "");
  const response = await fetch(`${api}/api/leads`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ xh_note: "kit-deterministic-bot", elapsedMs: 1 }) });
  const data = await response.json();
  if (response.status !== 201 || data.id !== 0 || data.email !== "") throw new Error("bot fake-201 contract failed");
} else if (id === "ops.postpublish-watch") {
  const response = await fetch(`${base}/build-id.txt`, { signal: AbortSignal.timeout(10000) });
  const buildId = (await response.text()).trim();
  if (!response.ok || !buildId) throw new Error("finite build-id check failed");
  const sitemap = await fetch(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(10000) });
  if (!sitemap.ok || !(await sitemap.text()).includes("<urlset")) throw new Error("finite sitemap/IndexNow input check failed");
} else {
  throw new Error(`No dedicated online contract: ${id}`);
}
process.stdout.write(`finite online contract passed: ${id}\n`);