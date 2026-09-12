// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Production origin — makes <link rel="canonical"> / og:url absolute
  // (BaseLayout uses Astro.site). Filtered catalog URLs canonicalize to
  // https://coralpilates.com/products.
  site: 'https://coralpilates.com',

  // English remains at the root; the four approved additional languages use
  // path prefixes. Missing translated routes temporarily rewrite to English,
  // keeping /es, /fr, /de and /it valid while the client adds translations.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'de', 'it'],
    // Manual routing lets middleware reuse the English static output for
    // untranslated locale URLs. This avoids generating every product five
    // times during the content-fill stage.
    routing: 'manual',
  },

  // Cloudflare Pages adapter. Content pages stay prerendered (SSG); only the
  // quote/contact Action endpoint renders on-demand as a Worker. Required
  // because Astro Actions need a server runtime.
  adapter: cloudflare(),
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';
        return (
          !new Set(['/warranty', '/returns', '/shipping', '/thank-you']).has(
            pathname,
          ) && !pathname.startsWith('/configurations/')
        );
      },
    }),
  ],

  // Inline page styles to avoid the render-blocking CSS round-trips previously
  // reported by PageSpeed. The current pages carry roughly 9–10 KiB of
  // Brotli-compressed CSS in their HTML. This favors a cold first paint at the
  // cost of resending shared CSS during full-page navigation; keep the choice
  // backed by cold- and warm-navigation measurements.
  build: { inlineStylesheets: 'always' },

  // Type-safe env (astro:env). Secrets are server-only and read from the
  // runtime (never inlined into the client bundle); the Turnstile SITE key is
  // the only value that ships to the browser. All optional so the site still
  // builds/deploys before the keys are added — the Action degrades to a clear
  // "email us directly" message until they are set.
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      QUOTE_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      QUOTE_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true, default: '' }),
      // Soft-launch safety switch. Keep false until the client approves the
      // public content and explicitly asks search engines to index the site.
      PUBLIC_SITE_INDEXING_ENABLED: envField.boolean({
        context: 'client',
        access: 'public',
        optional: true,
        default: false,
      }),
    },
  },

  // Pin the dev server to a fixed port so it never drifts to 4322/4323/…
  // strictPort makes `astro dev` fail loudly if 4321 is already taken (a stale
  // server is still running) instead of silently grabbing the next port.
  server: { port: 4321 },
  vite: {
    plugins: [
      tailwindcss(),
      {
        // Cloudflare's Vite plugin sets the Workerd SSR environment back to
        // discovery mode late in config resolution. Run last so the explicit
        // pre-bundle graph below remains immutable across warm starts.
        name: 'coral:stable-workerd-deps',
        enforce: 'post',
        configEnvironment(name) {
          if (name === 'ssr') {
            return { optimizeDeps: { noDiscovery: true } };
          }
        },
      },
    ],
    server: { strictPort: true, 
	      watch: {
        ignored: [
          '**/.wrangler/**',
          '**/.astro/**',
          '**/dist/**',
          '**/node_modules/**',
        ],
      },
	},
    optimizeDeps: {
      // Re-running the adapter's large `astro/runtime/**` bundle can produce a
      // different chunk graph on this Astro/Vite combination and delete files
      // still referenced by workerd. Build the graph once from the list below,
      // then reuse it unchanged on warm starts.
      noDiscovery: true,
      // Backport of the @astrojs/cloudflare 14.1.4 fix for Astro Actions
      // (withastro/astro#17456 / #17457). Adapter 13.7 otherwise discovers
      // these entrypoints after workerd has started, regenerates deps_ssr with
      // new chunk hashes, and leaves the runner holding paths that no longer
      // exist. Eager pre-bundling makes the dependency graph stable before the
      // first request. Remove this list when upgrading to Astro 7 + adapter 14.
      include: [
        // Adapter 13.7's own Workerd pre-bundle list. `noDiscovery` prevents
        // the adapter from injecting it, so keep the list explicit and stable.
        '@astrojs/cloudflare/image-service-workerd',
        'astro',
        'astro/runtime/**',
        'astro > html-escaper',
        'astro > mrmime',
        'astro > zod/v4',
        'astro > zod/v4/core',
        'astro > clsx',
        'astro > cookie',
        'astro > devalue',
        'astro > @oslojs/encoding',
        'astro > es-module-lexer',
        'astro > unstorage',
        'astro > neotraverse/modern',
        'astro > piccolore',
        'astro > picomatch',
        'astro/app',
        'astro/app/fetch/default-handler',
        'astro/fetch',
        'astro/hono',
        'astro/assets',
        'astro/assets/runtime',
        'astro/assets/utils/inferRemoteSize.js',
        'astro/assets/fonts/runtime.js',
        'astro/compiler-runtime',
        'astro/jsx-runtime',
        'astro/app/entrypoint/dev',
        'astro/virtual-modules/middleware.js',
        '@astrojs/prism > prismjs',
        '@astrojs/prism > prismjs/components.js',
        '@astrojs/prism > prismjs/dependencies.js',
        'astro/env/runtime',
        'astro/zod',
        'astro/actions/runtime/entrypoints/server.js',
        'astro/actions/runtime/entrypoints/route.js',
        'astro/middleware',
        'astro/virtual-modules/live-config',
      ],
      // Keep Node-oriented SDKs out of workerd's SSR pre-bundle. `resend` is
      // also imported lazily inside the Action handler. Adapter 13.7 discovers
      // its server entry late, but it imports Cloudflare virtual modules that
      // esbuild cannot pre-bundle; explicitly excluding it prevents the late
      // discovery from replacing the active deps_ssr metadata.
      exclude: [
        '@astrojs/cloudflare/entrypoints/server',
        'resend',
        '@sanity/client',
        '@sanity/image-url',
        'groq',
        '@portabletext/to-html',
      ],
    },
  }
});
