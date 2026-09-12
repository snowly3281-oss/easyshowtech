import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { sha256Hex } from '../../../lib/server/inquiries'

export const prerender = false

interface ConfigurationFileRow {
  package_snapshot_json: string | null
  access_expires_at: string | null
}

function privateResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Type': 'text/plain; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}

function readPdfUrl(raw: string | null): URL | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const candidate = value as { configurationPdfUrl?: unknown }
    if (typeof candidate.configurationPdfUrl !== 'string') return null
    const url = new URL(candidate.configurationPdfUrl)
    return url.protocol === 'https:' && url.hostname === 'cdn.sanity.io'
      ? url
      : null
  } catch {
    return null
  }
}

export const GET: APIRoute = async ({ params, url }) => {
  const inquiryId = params.id ?? ''
  const token = url.searchParams.get('token') ?? ''
  if (
    !/^[0-9a-f-]{36}$/i.test(inquiryId) ||
    !/^[0-9a-f]{64}$/i.test(token)
  ) {
    return privateResponse('Configuration file not found.', 404)
  }

  const tokenHash = await sha256Hex(token)
  const row = await env.INQUIRIES_DB.prepare(`
    SELECT package_snapshot_json, access_expires_at
    FROM inquiries
    WHERE id = ?1
      AND access_token_hash = ?2
      AND kind = 'configuration'
    LIMIT 1
  `)
    .bind(inquiryId, tokenHash)
    .first<ConfigurationFileRow>()

  if (!row?.access_expires_at) {
    return privateResponse('Configuration file not found.', 404)
  }
  if (Date.parse(row.access_expires_at) <= Date.now()) {
    return privateResponse('This configuration link has expired.', 410)
  }

  const pdfUrl = readPdfUrl(row.package_snapshot_json)
  if (!pdfUrl) {
    return privateResponse('No PDF is attached to this configuration.', 404)
  }

  const upstream = await fetch(pdfUrl)
  if (!upstream.ok || !upstream.body) {
    return privateResponse('The configuration file is temporarily unavailable.', 502)
  }

  return new Response(upstream.body, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Disposition': `attachment; filename="coral-configuration-${inquiryId}.pdf"`,
      'Content-Type':
        upstream.headers.get('Content-Type') ?? 'application/pdf',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}
