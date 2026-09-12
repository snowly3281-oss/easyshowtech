/**
 * Shared buyer-tier taxonomy for Coral.
 *
 * Three target buyers drive the marketing site:
 *  - budget_b2b      — price-led B2B buyers
 *  - oem_distributor — traders / OEM distributors
 *  - brand_owner     — social-led influencer brand owners
 *
 * Reused anywhere content is tier-targeted (solution, post, FAQ, page-builder
 * blocks) so the option list lives in ONE place. Values are lang-agnostic
 * (no language suffixes) per the content-model principles.
 */
export const AUDIENCE_VALUES = [
  'budget_b2b',
  'oem_distributor',
  'brand_owner',
] as const

export type AudienceValue = (typeof AUDIENCE_VALUES)[number]

export const AUDIENCE_OPTIONS: { title: string; value: AudienceValue }[] = [
  { title: 'Budget B2B', value: 'budget_b2b' },
  { title: 'OEM / Distributor', value: 'oem_distributor' },
  { title: 'Brand owner', value: 'brand_owner' },
]
