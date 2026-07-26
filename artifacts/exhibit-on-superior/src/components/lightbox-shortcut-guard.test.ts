import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Guard: the three photo viewers must share keyboard behavior through
// `useLightboxShortcutKeys` (src/hooks/use-lightbox-shortcut-keys.ts) and must
// NOT hand-roll their own keydown handling for the shared shortcut keys
// (?, +/=, -/_, 0, arrows).
//
// Why a source-level test: the shortcuts were once duplicated per viewer and
// drifted apart; they were unified behind the shared hook. A future edit could
// quietly re-add a local `window.addEventListener('keydown', ...)` (or an
// inline handler comparing `e.key` against the shared keys) in one viewer —
// every behavioral test would still pass while the consistency guarantee
// silently died. Static analysis of the viewer sources is the only check that
// fails at the moment of the drift itself.
// ---------------------------------------------------------------------------

const HOOK_HINT =
  'Shared lightbox shortcuts must go through useLightboxShortcutKeys ' +
  '(src/hooks/use-lightbox-shortcut-keys.ts) — see that hook for the ' +
  'options (onResetZoom, onOtherKey, canArrowNavigate, ...) that cover ' +
  'viewer-specific behavior.';

const VIEWERS = [
  {
    name: 'PlanLightbox',
    file: '../components/floor-plans/PlanLightbox.tsx',
  },
  {
    name: 'UnitGalleryLightbox',
    file: '../components/floor-plans/UnitGalleryLightbox.tsx',
  },
  {
    name: 'PhotoGallery',
    file: '../pages/PhotoGallery.tsx',
  },
] as const;

function readViewerSource(relPath: string): string {
  return readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), 'utf8');
}

/**
 * Strip block comments, line comments, and JSX text so documentation that
 * *mentions* the shortcuts (docblocks, sr-only descriptions) can't trip the
 * hand-rolled-handler checks. Deliberately keeps string literals in code:
 * `addEventListener('keydown')` and `e.key === '?'` live inside strings.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    // Trailing line comments after code (avoid eating `https://` in strings
    // by requiring whitespace before the slashes).
    .replace(/[ \t]\/\/[^\n]*$/gm, '');
}

// The shared shortcut keys owned by the hook. Escape and Tab are deliberately
// NOT listed: PlanLightbox handles Escape via Radix's onEscapeKeyDown, and
// UnitGalleryLightbox's Tab focus trap rides along via onOtherKey.
const SHARED_KEY_PATTERN =
  /\.key\s*===?\s*['"`](\?|\+|=|-|_|0|Arrow(?:Left|Right|Up|Down))['"`]/;

describe('lightbox keyboard-shortcut ownership guard', () => {
  for (const viewer of VIEWERS) {
    describe(viewer.name, () => {
      const raw = readViewerSource(viewer.file);
      const code = stripComments(raw);

      it('imports useLightboxShortcutKeys from the shared hook', () => {
        const importsHook =
          /import\s*\{[^}]*\buseLightboxShortcutKeys\b[^}]*\}\s*from\s*['"][^'"]*use-lightbox-shortcut-keys['"]/.test(
            code,
          );
        expect(
          importsHook,
          `${viewer.name} no longer imports useLightboxShortcutKeys. ${HOOK_HINT}`,
        ).toBe(true);
      });

      it('calls useLightboxShortcutKeys', () => {
        const callsHook = /\buseLightboxShortcutKeys\s*\(\s*\{/.test(code);
        expect(
          callsHook,
          `${viewer.name} imports but never calls useLightboxShortcutKeys, ` +
            `so its keyboard shortcuts are dead. ${HOOK_HINT}`,
        ).toBe(true);
      });

      it('does not register its own keydown listener', () => {
        const ownListener = /addEventListener\s*\(\s*['"`]keydown['"`]/.test(code);
        expect(
          ownListener,
          `${viewer.name} registers its own 'keydown' listener, bypassing the ` +
            `shared shortcut hook — the viewers' shortcuts can now drift apart. ` +
            HOOK_HINT,
        ).toBe(false);
      });

      it('does not hand-roll handling of the shared shortcut keys (?, +/-, 0, arrows)', () => {
        const match = code.match(SHARED_KEY_PATTERN);
        expect(
          match,
          `${viewer.name} compares event.key against the shared shortcut key ` +
            `${match ? `'${match[1]}'` : ''} directly instead of leaving it to ` +
            `the shared hook. ${HOOK_HINT}`,
        ).toBeNull();
      });
    });
  }

  it('the shared hook itself still owns the window keydown listener', () => {
    // Sanity check on the guard: if the hook is ever rewritten to stop
    // attaching a window keydown listener, the viewer checks above would be
    // guarding an empty contract.
    const hook = stripComments(
      readViewerSource('../hooks/use-lightbox-shortcut-keys.ts'),
    );
    expect(
      /window\.addEventListener\s*\(\s*['"`]keydown['"`]/.test(hook),
      'use-lightbox-shortcut-keys.ts no longer attaches the window keydown ' +
        'listener — the shared-shortcut contract this guard protects has changed.',
    ).toBe(true);
  });
});
