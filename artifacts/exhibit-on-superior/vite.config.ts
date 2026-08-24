import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

/**
 * Search-engine verification: injects <meta name="google-site-verification">
 * and/or <meta name="msvalidate.01"> (Bing) into <head> when the matching env
 * vars are set. Runs via transformIndexHtml, so the tags land in the built
 * index.html *before* the prerender step copies it as the per-route template —
 * no hand-editing of built output, and every prerendered page carries them.
 */
function siteVerificationTags(): Plugin {
  return {
    name: 'site-verification-tags',
    transformIndexHtml() {
      const tags = [];
      if (process.env.VITE_GOOGLE_SITE_VERIFICATION) {
        tags.push({
          tag: 'meta',
          attrs: {
            name: 'google-site-verification',
            content: process.env.VITE_GOOGLE_SITE_VERIFICATION,
          },
          injectTo: 'head' as const,
        });
      }
      if (process.env.VITE_BING_SITE_VERIFICATION) {
        tags.push({
          tag: 'meta',
          attrs: {
            name: 'msvalidate.01',
            content: process.env.VITE_BING_SITE_VERIFICATION,
          },
          injectTo: 'head' as const,
        });
      }
      return tags;
    },
  };
}

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

/**
 * Strips `maximum-scale=1` injected by @replit/vite-plugin-runtime-error-modal.
 * That attribute prevents pinch-to-zoom and violates WCAG 2.2 SC 1.4.4 (Resize Text, AA).
 * This plugin runs after runtimeErrorOverlay() and removes the restriction from
 * every HTML page produced by the build.
 */
function removeMaximumScale(): Plugin {
  return {
    name: 'remove-maximum-scale',
    transformIndexHtml(html) {
      return html.replace(
        /(<meta\s[^>]*name=["']viewport["'][^>]*content=["'][^"']*),?\s*maximum-scale=\d[^"']*(["'][^>]*>)/gi,
        '$1$2',
      );
    },
  };
}

/**
 * Build-time environment validation for the web artifact.
 *
 * These VITE_* vars are baked into the client bundle by Vite's define step.
 * A missing var at build time means `undefined` ships to every browser —
 * analytics stop recording, API calls fail silently, and UTM attribution
 * breaks. Catching the misconfiguration here stops a bad deploy before any
 * user traffic arrives.
 *
 * Source of truth: config/env-vars.md — Required=Yes rows for the web artifact.
 *   - PORT is excluded — Replit injects it automatically.
 *   - Optional vars (VITE_SIGHTMAP_ID, VITE_GA_MEASUREMENT_ID, …) are excluded.
 *
 * Behaviour:
 *   - Deployment build (REPLIT_DEPLOYMENT=1): throws with ALL missing var
 *     names listed in a single error. Never silently builds with broken config.
 *   - Workspace / local builds: logs a console.warn and continues so
 *     check:prepublish and local dev can run without every var wired up.
 *     These vars MUST be set on the deployed artifact before going live.
 */
export function validateWebEnv(
  env: Record<string, string | undefined> = process.env,
): void {
  const REQUIRED_VARS = [
    'VITE_GA4_MEASUREMENT_ID',
    'VITE_UTM_STORAGE_KEY',
    'VITE_API_URL',
  ] as const;

  const missing = REQUIRED_VARS.filter(
    (key) => !env[key] || env[key]!.trim() === '',
  );

  if (missing.length === 0) return;

  // REPLIT_DEPLOYMENT=1 is injected by the platform only in real deployment
  // builds (same signal used by scripts/generate-fact-sheet.ts). Workspace
  // builds (including check:prepublish) do not have it set, so they warn
  // instead of failing — preserving the pre-deploy check workflow.
  const isDeployedBuild = env.REPLIT_DEPLOYMENT === '1';

  if (isDeployedBuild) {
    throw new Error(
      'Web artifact cannot build: missing required environment variable(s):\n' +
        missing.map((k) => `  • ${k}`).join('\n') +
        '\n\nSee config/env-vars.md for the full setup checklist.',
    );
  }

  // Non-deployment: warn loudly but allow the build/serve to continue so
  // local dev and workspace prepublish checks still work.
  // All vars MUST be set on the deployed artifact before going live.
  console.warn(
    `[validateWebEnv] WARNING — missing required env var(s): ${missing.join(', ')}. ` +
      'All must be set in the deployed artifact. See config/env-vars.md.',
  );
}

export default defineConfig(async ({ command, isSsrBuild }) => {
  // Validate required VITE_* vars before any other config is resolved.
  // Runs on both `vite build` and `vite dev` so misconfiguration is
  // caught as early as possible regardless of the invocation path.
  validateWebEnv();

  // PORT is required only when serving (dev/preview); builds don't bind a port.
  // BASE_PATH defaults to '/' for production builds — the deploy pipeline can
  // override it if the site ever moves off the root URL.
  const rawPort = process.env.PORT;

  if (command === 'serve' && !rawPort) {
    throw new Error(
      'PORT environment variable is required but was not provided.',
    );
  }

  const port = Number(rawPort ?? 5000);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = process.env.BASE_PATH ?? '/';

  return {
  base: basePath,
  define: {
    // Browser Maps JS key for the styled map (Map ID). The user opted to
    // reuse GOOGLE_PLACES_API_KEY client-side with referrer restrictions;
    // baking it in via define keeps the secret name out of client code.
    __GOOGLE_MAPS_BROWSER_KEY__: JSON.stringify(
      process.env.GOOGLE_MAPS_BROWSER_API_KEY ?? '',
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    siteVerificationTags(),
    runtimeErrorOverlay(),
    removeMaximumScale(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: isSsrBuild
      ? undefined
      : {
          output: {
            /**
             * Split heavyweight vendor code out of the main entry so no
             * emitted JS file exceeds ~250 KB (SEO perf budget). Only stable,
             * eagerly-needed vendors are split — per-route page chunks stay
             * lazy exactly as before, and the boot route-preload guard in
             * main.tsx still preloads the current route chunk before first
             * render (no Suspense-fallback CLS). SSR build is excluded: it
             * emits a single server bundle.
             */
            manualChunks(id: string) {
              // Baked availability snapshot (~53 KB JSON): keep it in exactly
              // ONE chunk. Without this, Rollup inlined a full copy into every
              // lazy chunk that touches it (AvailableUnits, UnitDetail,
              // gallery lightbox, unitJsonLd) — pages that never render
              // availability were shipping the whole snapshot (SEO Phase 4
              // token-weight trim).
              if (id.includes('src/data/availabilitySnapshot')) {
                return 'availability-snapshot';
              }
              if (!id.includes('node_modules')) return undefined;
              if (
                /node_modules\/(react|react-dom|scheduler)\//.test(id)
              ) {
                return 'vendor-react';
              }
              if (id.includes('node_modules/@radix-ui/')) {
                return 'vendor-radix';
              }
              return undefined;
            },
          },
        },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  };
});
