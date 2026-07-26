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

  // -------------------------------------------------------------------------
  // Visible side of the same contract: the zoom / "?" button cluster and the
  // shortcut legend must come from the shared LightboxShortcutControls
  // component (src/components/LightboxShortcutControls.tsx). A viewer that
  // re-implements its own legend markup would keep passing every behavioral
  // test while its on-screen legend silently drifts from what the keys do.
  // -------------------------------------------------------------------------

  const CONTROLS_HINT =
    'The zoom / "?" buttons and the shortcut legend must be rendered via the ' +
    'shared LightboxShortcutControls component ' +
    '(src/components/LightboxShortcutControls.tsx) — pass viewer-specific ' +
    'wording through its navDescription / escDescription props instead of ' +
    'duplicating the markup.';

  // Markup that only the shared component should contain: its accessible
  // names and legend row labels. Any of these appearing in a viewer source
  // means the viewer hand-rolled (part of) the legend / button cluster.
  const LEGEND_MARKUP_PATTERNS: Array<[string, RegExp]> = [
    ['the "?" toggle\'s accessible name', /['"`](?:Show|Hide) keyboard shortcuts['"`]/],
    ['the legend dismiss button\'s accessible name', /['"`]Dismiss keyboard shortcuts['"`]/],
    ['the zoom button\'s accessible name', /['"`]Zoom (?:in|out)['"`]/],
    ['the legend region\'s accessible name', /aria-label\s*=\s*['"`]Keyboard shortcuts['"`]/],
    ['a legend row label', /['"`](?:Toggle this panel|Reset zoom|Pan while zoomed|Zoom in \/ out)['"`]/],
  ];

  for (const viewer of VIEWERS) {
    describe(`${viewer.name} — shared legend markup`, () => {
      const raw = readViewerSource(viewer.file);
      const code = stripComments(raw);

      it('imports LightboxShortcutControls from the shared component', () => {
        const importsControls =
          /import\s*\{[^}]*\bLightboxShortcutControls\b[^}]*\}\s*from\s*['"][^'"]*LightboxShortcutControls['"]/.test(
            code,
          );
        expect(
          importsControls,
          `${viewer.name} no longer imports LightboxShortcutControls. ${CONTROLS_HINT}`,
        ).toBe(true);
      });

      it('renders <LightboxShortcutControls> in its JSX', () => {
        const rendersControls = /<LightboxShortcutControls\b/.test(code);
        expect(
          rendersControls,
          `${viewer.name} imports LightboxShortcutControls but never renders ` +
            `it, so the viewer has no zoom / "?" cluster or shortcut legend. ` +
            CONTROLS_HINT,
        ).toBe(true);
      });

      it('does not hand-roll its own legend / zoom-button markup', () => {
        for (const [what, pattern] of LEGEND_MARKUP_PATTERNS) {
          const match = code.match(pattern);
          expect(
            match,
            `${viewer.name} contains ${what} (${match ? `matched ${JSON.stringify(match[0])}` : ''}) ` +
              `in its own markup instead of leaving it to the shared ` +
              `component — the legend can now drift from what the keys do. ` +
              CONTROLS_HINT,
          ).toBeNull();
        }
      });
    });
  }

  it('the shared component itself still renders the legend and zoom button', () => {
    // Sanity check on the guard: if LightboxShortcutControls is gutted, the
    // viewer checks above would be guarding an empty contract.
    const controls = stripComments(
      readViewerSource('../components/LightboxShortcutControls.tsx'),
    );
    for (const [what, pattern] of LEGEND_MARKUP_PATTERNS) {
      expect(
        pattern.test(controls),
        `LightboxShortcutControls.tsx no longer contains ${what} — the shared ` +
          'legend contract this guard protects has changed; update the guard ' +
          'patterns alongside the component.',
      ).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // Click-away side of the same contract: the legend's outside-click dismiss
  // must come from the shared useDismissLegendOnOutsideClick hook
  // (src/hooks/use-dismiss-legend-on-outside-click.ts). It was once
  // copy-pasted per viewer and could silently drift apart.
  // -------------------------------------------------------------------------

  const DISMISS_HINT =
    'The legend outside-click dismiss must go through ' +
    'useDismissLegendOnOutsideClick ' +
    '(src/hooks/use-dismiss-legend-on-outside-click.ts) — pass the viewer\'s ' +
    'legend id instead of duplicating the handler.';

  for (const viewer of VIEWERS) {
    describe(`${viewer.name} — shared legend dismiss`, () => {
      const raw = readViewerSource(viewer.file);
      const code = stripComments(raw);

      it('imports useDismissLegendOnOutsideClick from the shared hook', () => {
        const importsHook =
          /import\s*\{[^}]*\buseDismissLegendOnOutsideClick\b[^}]*\}\s*from\s*['"][^'"]*use-dismiss-legend-on-outside-click['"]/.test(
            code,
          );
        expect(
          importsHook,
          `${viewer.name} no longer imports useDismissLegendOnOutsideClick. ${DISMISS_HINT}`,
        ).toBe(true);
      });

      it('calls useDismissLegendOnOutsideClick', () => {
        const callsHook = /\buseDismissLegendOnOutsideClick\s*\(/.test(code);
        expect(
          callsHook,
          `${viewer.name} imports but never calls useDismissLegendOnOutsideClick, ` +
            `so the legend's click-away dismiss is dead. ${DISMISS_HINT}`,
        ).toBe(true);
      });

      it('attaches the dismiss handler via onClickCapture', () => {
        const attaches = /onClickCapture\s*=\s*\{dismissLegendOnOutsideClick\}/.test(code);
        expect(
          attaches,
          `${viewer.name} never attaches dismissLegendOnOutsideClick via ` +
            `onClickCapture — the capture phase is what keeps the dismissing ` +
            `click from reaching inner handlers. ${DISMISS_HINT}`,
        ).toBe(true);
      });

      it('does not hand-roll the interactive-target dismiss rule', () => {
        // The `button, a, [role="button"]` selector is the hook's signature
        // rule; appearing in a viewer means the handler was re-inlined.
        const handRolled = /closest\s*\(\s*['"`]button,\s*a,\s*\[role="button"\]['"`]/.test(code);
        expect(
          handRolled,
          `${viewer.name} hand-rolls the legend dismiss's interactive-target ` +
            `rule instead of leaving it to the shared hook. ${DISMISS_HINT}`,
        ).toBe(false);
      });
    });
  }

  it('the shared dismiss hook itself still implements the dismiss rules', () => {
    // Sanity check on the guard: if the hook is gutted, the viewer checks
    // above would be guarding an empty contract.
    const hook = stripComments(
      readViewerSource('../hooks/use-dismiss-legend-on-outside-click.ts'),
    );
    expect(
      /closest\s*\(\s*['"`]button,\s*a,\s*\[role="button"\]['"`]/.test(hook),
      'use-dismiss-legend-on-outside-click.ts no longer contains the ' +
        'interactive-target rule — the shared dismiss contract this guard ' +
        'protects has changed; update the guard alongside the hook.',
    ).toBe(true);
    for (const [what, pattern] of [
      ['the legend/toggle exclusion', /aria-controls="\$\{legendId\}"/],
      ['the swallow of non-interactive clicks', /preventDefault\(\)/],
    ] as const) {
      expect(
        pattern.test(hook),
        `use-dismiss-legend-on-outside-click.ts no longer contains ${what} — ` +
          'the shared dismiss contract this guard protects has changed.',
      ).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // Touch-gesture side of the same contract: touch gestures never end in a
  // click, so the click-capture dismiss can't clear the legend — the
  // gesture-start / swipe clearing must come from the shared
  // clearLegendOnTouchGestures wrapper (src/hooks/clear-legend-on-touch-
  // gestures.ts). It was once hand-written per viewer (an onGestureStart plus
  // a setShowShortcuts(false) inside each onSwipe) and a dropped call would
  // leave the legend stranded on top while photos change underneath.
  // -------------------------------------------------------------------------

  const GESTURE_HINT =
    'The gesture-start / swipe legend clearing must go through ' +
    'clearLegendOnTouchGestures (src/hooks/clear-legend-on-touch-gestures.ts) ' +
    '— wrap the options passed to usePinchZoom: ' +
    'usePinchZoom(clearLegendOnTouchGestures(setShowShortcuts, { ...options })).';

  for (const viewer of VIEWERS) {
    describe(`${viewer.name} — shared touch-gesture legend clearing`, () => {
      const raw = readViewerSource(viewer.file);
      const code = stripComments(raw);

      it('imports clearLegendOnTouchGestures from the shared wrapper', () => {
        const importsWrapper =
          /import\s*\{[^}]*\bclearLegendOnTouchGestures\b[^}]*\}\s*from\s*['"][^'"]*clear-legend-on-touch-gestures['"]/.test(
            code,
          );
        expect(
          importsWrapper,
          `${viewer.name} no longer imports clearLegendOnTouchGestures. ${GESTURE_HINT}`,
        ).toBe(true);
      });

      it('wraps its usePinchZoom options with clearLegendOnTouchGestures', () => {
        const wraps =
          /\busePinchZoom\s*\(\s*clearLegendOnTouchGestures\s*\(\s*setShowShortcuts\s*,/.test(
            code,
          );
        expect(
          wraps,
          `${viewer.name} calls usePinchZoom without routing its options ` +
            `through clearLegendOnTouchGestures(setShowShortcuts, ...), so a ` +
            `touch gesture can strand the shortcut legend on top while the ` +
            `photo changes underneath. ${GESTURE_HINT}`,
        ).toBe(true);
      });

      it('does not hand-roll a gesture-start legend clear', () => {
        // A viewer-local onGestureStart means the clearing rule was
        // re-inlined (or the option is being used for something else and can
        // silently shadow the wrapper's clear).
        const handRolled = /\bonGestureStart\s*:/.test(code);
        expect(
          handRolled,
          `${viewer.name} passes its own onGestureStart instead of leaving ` +
            `gesture-start handling to the shared wrapper. ${GESTURE_HINT}`,
        ).toBe(false);
      });

      it('does not clear the legend inside its own onSwipe', () => {
        // The wrapper already clears on swipe; a hand-written clear inside a
        // viewer's onSwipe means the rule is drifting back into the viewers.
        const swipeBlock = code.match(/onSwipe\s*:\s*\([\s\S]*?\)\s*=>\s*(\{[\s\S]*?\}|[^,]*)/);
        const handRolled = swipeBlock ? /setShowShortcuts/.test(swipeBlock[0]) : false;
        expect(
          handRolled,
          `${viewer.name} calls setShowShortcuts inside its onSwipe — the ` +
            `shared wrapper already clears the legend on swipe. ${GESTURE_HINT}`,
        ).toBe(false);
      });
    });
  }

  it('the shared wrapper itself still clears the legend at gesture start and on swipe', () => {
    // Sanity check on the guard: if clearLegendOnTouchGestures is gutted, the
    // viewer checks above would be guarding an empty contract.
    const wrapper = stripComments(
      readViewerSource('../hooks/clear-legend-on-touch-gestures.ts'),
    );
    expect(
      /onGestureStart\s*:\s*\(\s*\)\s*=>\s*\{\s*setShowShortcuts\(false\)/.test(wrapper),
      'clear-legend-on-touch-gestures.ts no longer clears the legend at ' +
        'gesture start — the shared touch-gesture contract this guard ' +
        'protects has changed; update the guard alongside the wrapper.',
    ).toBe(true);
    expect(
      /onSwipe\s*:\s*\(dir\)\s*=>\s*\{\s*setShowShortcuts\(false\)/.test(wrapper),
      'clear-legend-on-touch-gestures.ts no longer clears the legend on ' +
        'swipe — the shared touch-gesture contract this guard protects has ' +
        'changed; update the guard alongside the wrapper.',
    ).toBe(true);
  });

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
