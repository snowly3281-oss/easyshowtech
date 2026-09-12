import { PUBLIC_SITE_INDEXING_ENABLED } from 'astro:env/client'

export const prerender = true

export function GET() {
  const body = PUBLIC_SITE_INDEXING_ENABLED
    ? [
        'User-agent: *',
        'Allow: /',
        'Disallow: /configurations/',
        'Disallow: /thank-you',
        '',
        'Sitemap: https://coralpilates.com/sitemap-index.xml',
        '',
      ].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
