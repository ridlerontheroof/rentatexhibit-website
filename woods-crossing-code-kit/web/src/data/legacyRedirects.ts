import { verifiedContent } from "./generated";
export const LEGACY_REDIRECTS: Record<string, string> = Object.fromEntries(
  verifiedContent.legacyRedirects.map((redirect: any) => [redirect.from, redirect.to]),
);