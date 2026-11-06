import type { APIRoute } from 'astro'
import { getBackdropDesignPage } from '../../sanity/backdropDesigns'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const offset = Number(url.searchParams.get('offset') ?? 0)
  const limit = Number(url.searchParams.get('limit') ?? 24)
  const result = await getBackdropDesignPage({ search: url.searchParams.get('search') ?? '', category: url.searchParams.get('category') ?? 'All', offset, limit })
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=120' } })
}
