import { createClient, type SanityClient } from '@sanity/client'

/**
 * Read-only Sanity client for build-time (SSG) data fetching.
 *
 * `projectId`/`dataset` are public/safe (the projectId already appears in the
 * Studio config and in asset URLs).
 *
 * Build-time SSG client: it fetches at build, so it uses the LIVE API
 * (`useCdn: false`) to guarantee fresh content. The CDN (apicdn) caches query
 * results PER QUERY STRING and invalidates unevenly after a publish, which
 * produces stale builds right after content changes — wrong for SSG. The live
 * API has no such cache. (A read token stays optional, only for a later private
 * dataset; it is passed through when set.)
 *
 * Env (see .env.example):
 *   PUBLIC_SANITY_PROJECT_ID   default "p3d22f8w"
 *   PUBLIC_SANITY_DATASET      default "production"
 *   SANITY_API_VERSION         default "2024-10-01"
 *   SANITY_READ_TOKEN          optional, SERVER-ONLY (no PUBLIC_ prefix, so it
 *                              never reaches the client bundle). Only once the
 *                              dataset is made private; use a read-only (Viewer)
 *                              token — never the Studio write token.
 */
const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? 'p3d22f8w'
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = import.meta.env.SANITY_API_VERSION ?? '2024-10-01'
// Server-only (no PUBLIC_ prefix). Undefined while the dataset is public.
const token = import.meta.env.SANITY_READ_TOKEN as string | undefined
const visualEditingEnabled = import.meta.env.DEV
const studioUrl =
  import.meta.env.PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333'

export const sanityClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  ...(visualEditingEnabled
    ? {
        stega: {
          enabled: true,
          studioUrl,
        },
      }
    : {}),
  ...(token ? { token } : {}),
})

/**
 * Abort Content Lake reads that exceed the build's useful waiting window.
 * The Sanity client otherwise allows a socket to wait for several minutes,
 * which can make one transient network issue stall every prerendered route.
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await sanityClient.fetch<T>(query, params, {
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}
