import { PUBLIC_SITE_INDEXING_ENABLED } from 'astro:env/client'
import { defineMiddleware } from 'astro:middleware'

/**
 * Defense-in-depth for the soft launch. The meta tag and robots.txt already
 * discourage indexing; this response header also covers non-HTML routes.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname === 'www.coralpilates.com') {
    const canonicalUrl = new URL(context.url)
    canonicalUrl.hostname = 'coralpilates.com'
    return context.redirect(canonicalUrl.toString(), 301)
  }

  const response = await next()

  if (!PUBLIC_SITE_INDEXING_ENABLED) {
    const headers = new Headers(response.headers)
    headers.set(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet, noimageindex',
    )

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }

  return response
})
