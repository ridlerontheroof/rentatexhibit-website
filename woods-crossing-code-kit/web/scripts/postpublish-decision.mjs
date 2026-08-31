export function shouldRunPostpublish(previousBuildId, currentBuildId) {
  const current = String(currentBuildId ?? "").trim();
  if (!current) return { run: false, reason: "missing-build-id" };
  if (String(previousBuildId ?? "").trim() === current) return { run: false, reason: "unchanged" };
  return { run: true, reason: "new-build", buildId: current };
}

export function changedSitemapUrls(previous, current) {
  return Object.entries(current).filter(([url, lastmod]) => previous[url] !== lastmod).map(([url]) => url).sort();
}