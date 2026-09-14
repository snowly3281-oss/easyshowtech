import { PUBLIC_SITE_INDEXING_ENABLED } from 'astro:env/client'
import { defineMiddleware } from 'astro:middleware'

/**
 * Defense-in-depth for the soft launch. The meta tag and robots.txt already
 * discourage indexing; this response header also covers non-HTML routes.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname === 'www.easyshowtech.pages.dev') {
    const canonicalUrl = new URL(context.url)
    canonicalUrl.hostname = 'easyshowtech.pages.dev'
    return context.redirect(canonicalUrl.toString(), 301)
  }

  const response = await next()
  const headers = new Headers(response.headers)

  // CORS headers for Sanity Studio Presentation
  const origin = context.request.headers.get('origin')
  if (origin && (
    origin.includes('sanity.io') ||
    origin.includes('localhost') ||
    origin.includes('easyshowtech.pages.dev')
  )) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  if (!PUBLIC_SITE_INDEXING_ENABLED) {
    headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex',
    )
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
})
