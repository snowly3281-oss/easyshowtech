import { defineQuery } from 'groq'

/**
 * Global site settings (singleton). Used by the PDP price gate (`showPrices`)
 * and the quote band (`salesEmail`/`phone`). Returns null if the singleton has
 * not been created yet — callers fall back to sensible defaults.
 */
export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    showPrices, salesEmail, phone, whatsapp, responseTime, companyAddress,
    frameFinishes[]{ _key, name, hex },
    upholsteryColors[]{ _key, name, hex },
    socialLinks[]{ _key, platform, label, url }
  }
`)
