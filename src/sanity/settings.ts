import { sanityFetch } from './client'
import { siteSettingsQuery } from './queries/settings'
import type { SiteSettingsQueryResult } from './sanity.types'
import { siteSettings as fallback } from '../config/site'

/**
 * Resolved site-wide contact details: the Sanity `siteSettings` singleton
 * merged over the config defaults (config/site.ts). Sanity is the source of
 * truth for the editable contact fields; `brand`/`location` stay in config
 * (the singleton has no such fields). Drop-in replacement for the old hardcoded
 * config `siteSettings` — same field names — so consumers only swap the import.
 */
export interface SiteContact {
  brand: string
  location: string
  showPrices: boolean
  salesEmail: string
  phone: string
  whatsapp: string
  responseTime: string
  companyAddress: string | null
  socialLinks: Array<{
    _key?: string
    platform: string
    label?: string | null
    url: string
  }>
}

const rawFallback: NonNullable<SiteSettingsQueryResult> = {
  // Fail closed: a temporary CMS outage must never expose prices that the
  // client intentionally hid with the global switch.
  showPrices: false,
  salesEmail: fallback.salesEmail,
  phone: fallback.phone,
  whatsapp: fallback.whatsapp,
  responseTime: fallback.responseTime,
  companyAddress: null,
  frameFinishes: [],
  upholsteryColors: [],
  socialLinks: [],
}

let rawSettingsPromise: Promise<NonNullable<SiteSettingsQueryResult>> | null =
  null

/**
 * Resolve the singleton once per server/build process. Every layout and PDP
 * consumes the same promise, so a catalog build does not issue the identical
 * settings query dozens of times.
 */
export function getRawSiteSettings(): Promise<
  NonNullable<SiteSettingsQueryResult>
> {
  if (!rawSettingsPromise) {
    rawSettingsPromise = sanityFetch<SiteSettingsQueryResult>(
      siteSettingsQuery,
    )
      .then((settings) => settings ?? rawFallback)
      .catch(() => rawFallback)
  }
  return rawSettingsPromise
}

export async function getSiteSettings(): Promise<SiteContact> {
  const s = await getRawSiteSettings()
  return {
    brand: fallback.brand,
    location: fallback.location,
    showPrices: s?.showPrices ?? false,
    salesEmail: s?.salesEmail ?? fallback.salesEmail,
    phone: s?.phone ?? fallback.phone,
    whatsapp: s?.whatsapp ?? fallback.whatsapp,
    responseTime: s?.responseTime ?? fallback.responseTime,
    companyAddress: s?.companyAddress ?? null,
    socialLinks: (s?.socialLinks ?? []).flatMap((link) =>
      typeof link?.platform === 'string' && typeof link?.url === 'string'
        ? [{
            _key: link._key,
            platform: link.platform,
            label: link.label ?? null,
            url: link.url,
          }]
        : [],
    ),
  }
}
