/**
 * White Exhibit on Superior wordmark (PNG, 440x111, rendered from the
 * site's exhibit-logo-white.svg), embedded so branded emails can attach it
 * inline via CID and the header logo displays with no external hosting or
 * image-blocking dependency.
 *
 * The bytes live in emailLogo.json so the web artifact's sync guard
 * (artifacts/exhibit-on-superior/src/data/emailImages.test.ts) can compare
 * them against the canonical PNG without parsing TypeScript source.
 */
import logo from "./emailLogo.json";

export const EMAIL_LOGO_CONTENT_ID = logo.contentId;
export const EMAIL_LOGO_MIME = logo.mime;
export const EMAIL_LOGO_BASE64 = logo.base64;
