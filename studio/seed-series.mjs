/**
 * Series for the home catalog carousel — matched to the approved WordPress
 * reference: Wood Maple, Wood Oak, Aluminum, Professional, Modular, Classical,
 * Folding, Apparatus, with manual SKU labels. Dotless ids; idempotent.
 *
 * Run (from repo root):  node --env-file=studio/.env studio/seed-series.mjs
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'p3d22f8w',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-10-01',
  useCdn: false,
})
if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN (studio/.env).')
  process.exit(1)
}

const WOOD = 'ab5ad458-802f-4a72-8f5a-86fde0d9fe99'

// The original "Wood" series (referenced by products) becomes "Wood Maple".
// Patch in place so product references stay valid.
await client
  .patch(WOOD)
  .set({
    title: 'Wood Maple',
    slug: { _type: 'slug', current: 'wood-maple' },
    description: 'American Hard Maple frame. The flagship wood line.',
    skuLabel: '16 SKUs',
    order: 1,
  })
  .commit()
console.log('Wood -> Wood Maple')

// Retire the old Spiral Pulley series (recreated as Apparatus below).
for (const id of ['series-spiral-pulley', 'drafts.series-spiral-pulley']) {
  try {
    await client.delete(id)
  } catch (err) {
    /* missing — fine */
  }
}

const series = [
  { id: 'series-wood-oak', title: 'Wood Oak', slug: 'wood-oak', order: 2, description: 'Oak hardwood frame. A warmer tone for hotel and lifestyle interiors.', skuLabel: '12 SKUs' },
  { id: 'series-aluminum', title: 'Aluminum', slug: 'aluminum', order: 3, description: '7075 aluminum frame. Light, durable, easy to clean.', skuLabel: '12 SKUs' },
  { id: 'series-professional', title: 'Professional', slug: 'professional', order: 4, description: 'Three tiers, plus Pro and Pro Max upgrades. Built for high-volume studios.', skuLabel: '17 SKUs' },
  { id: 'series-modular', title: 'Modular', slug: 'modular', order: 5, description: 'Add-ons that grow with your studio. Start with a reformer; add a tower or jump board later.', skuLabel: '8 SKUs' },
  { id: 'series-classical', title: 'Classical', slug: 'classical', order: 6, description: 'Walnut frame. For classical studios and traditional method teachers.', skuLabel: '10 SKUs' },
  { id: 'series-folding', title: 'Folding', slug: 'folding', order: 7, description: 'Folds away when not in use. For home studios and tight spaces.', skuLabel: '6 SKUs' },
  { id: 'series-apparatus', title: 'Apparatus', slug: 'apparatus', order: 8, description: 'Cadillacs, Wunda Chairs, Ladder Barrels and Spine Correctors.', skuLabel: 'MULTI-LINE' },
]
for (const s of series) {
  await client.createOrReplace({
    _id: s.id,
    _type: 'series',
    title: s.title,
    slug: { _type: 'slug', current: s.slug },
    order: s.order,
    description: s.description,
    skuLabel: s.skuLabel,
  })
  console.log('series', s.id)
}
console.log('done')
