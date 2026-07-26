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

export default defineConfig(async ({ command, isSsrBuild }) => {
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
