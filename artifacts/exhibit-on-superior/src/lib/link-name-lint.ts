// Shared normalization helpers for WCAG 2.5.3 label-in-name guards.
//
// Used by two complementary tests:
//   - prerender-link-names.test.ts scans the prerendered HTML in dist/public
//     (everything that ships in the initial page);
//   - interactive-link-names.test.tsx mounts the surfaces that only render
//     after hydration/interaction (lightboxes, menus, sheets) in jsdom.
//
// Contract per <a>/<button> with an aria-label: normalize both the label and
// the visible text to "spoken words" (decoded, lowercased, symbols dropped,
// whitespace collapsed) and require the label to START with the visible text —
// 2.5.3 is about a speech-input user saying the visible words.

/** Decode the handful of HTML entities React escapes in attributes/text. */
export function decode(s: string): string {
  return s
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
    .replaceAll('<!-- -->', '');
}

/**
 * Reduce a string to the words a speech-input user would say: decoded,
 * lowercased, symbols (arrows, bullets, punctuation) dropped, whitespace
 * collapsed. Keeps letters, digits and spaces only.
 */
export function spokenWords(s: string): string {
  return decode(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Visible text of an element's inner HTML: strip sr-only spans, then tags. */
export function visibleTextFromHtml(inner: string): string {
  return spokenWords(
    inner
      .replace(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>.*?<\/span>/gs, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

export interface LabelOffender {
  /** Page path or mounted-surface name where the element was found. */
  where: string;
  tag: string;
  label: string;
  visible: string;
}

/**
 * DOM flavour of the check for jsdom tests: every <a>/<button> under `root`
 * with an aria-label whose spoken form does not begin with the element's
 * visible text (sr-only content excluded). Returns [offenders, labelledCount]
 * so callers can also assert the scan was not vacuous.
 */
export function domLabelOffenders(
  root: ParentNode,
  where: string,
): { offenders: LabelOffender[]; labelledCount: number } {
  const offenders: LabelOffender[] = [];
  let labelledCount = 0;
  for (const el of Array.from(root.querySelectorAll('a[aria-label], button[aria-label]'))) {
    labelledCount += 1;
    const rawLabel = el.getAttribute('aria-label') ?? '';
    const label = spokenWords(rawLabel);
    const clone = el.cloneNode(true) as Element;
    for (const sr of Array.from(clone.querySelectorAll('.sr-only'))) sr.remove();
    const visible = spokenWords(clone.textContent ?? '');
    if (!visible) continue; // icon-only — nothing visible to mismatch
    if (label.startsWith(visible)) continue;
    const outer = (el as HTMLElement).outerHTML;
    offenders.push({
      where,
      tag: outer.length > 200 ? `${outer.slice(0, 200)}…` : outer,
      label: rawLabel,
      visible,
    });
  }
  return { offenders, labelledCount };
}
