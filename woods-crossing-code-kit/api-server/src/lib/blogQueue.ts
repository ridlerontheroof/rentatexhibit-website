export interface BlogReminder { title: string; slug: string }
export function buildBlogReminder(_input?: unknown): BlogReminder {
  return { title: "No verified guide queued", slug: "" };
}