import {PUBLIC_TURNSTILE_SITE_KEY} from 'astro:env/client'

/**
 * Turnstile site keys are public browser configuration, not secrets.
 *
 * Local development deliberately uses Cloudflare's always-pass test key so
 * localhost never needs to be added to the production widget's hostname
 * allowlist. The production fallback keeps Git-connected Cloudflare builds
 * protected even when their build environment does not define the public key.
 */
const DEVELOPMENT_SITE_KEY = '1x00000000000000000000AA'
const PRODUCTION_SITE_KEY = '0x4AAAAAAD-H9x5oqkeq-q47'

export const TURNSTILE_SITE_KEY = import.meta.env.DEV
  ? DEVELOPMENT_SITE_KEY
  : PUBLIC_TURNSTILE_SITE_KEY || PRODUCTION_SITE_KEY

export const TURNSTILE_ACTION = 'turnstile-spin-v1'
