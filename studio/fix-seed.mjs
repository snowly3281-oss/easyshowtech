/**
 * One-shot fix: the catalog products/taxonomy were seeded with DOTTED custom
 * ids (e.g. "product.wunda-chair", "series.aluminum"). Sanity's public/anonymous
 * read does NOT grant access to documents whose _id contains a dot, so they were
 * invisible to the public (build) read path even though published on a public
 * dataset. This deletes those dotted docs (+ the throwaway test product) and
 * recreates them as PUBLISHED docs with hyphenated, dotless ids (publicly
 * readable, like UUIDs). Idempotent via createOrReplace.
 *
 * Run (from repo root):  node --env-file=studio/.env studio/fix-seed.mjs
 */
import { createClient } from '@sanity/client'
import { equipmentReferencesForProduct } from './scripts/equipment-taxonomy.mjs'

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
const ref = (id) => ({ _type: 'reference', _ref: id })

// 1. Delete dotted docs — products (referrers) before taxonomy — plus the test doc.
const dottedProducts = [
  'product.studio-reformer-lite',
  'product.wunda-chair',
  'product.cadillac-trapeze',
  'product.alu-studio-reformer',
  '0ca9fd79-edf6-417b-ba84-c9da2b9866b6', // ZZ Propagation Test
]
const dottedTaxonomy = ['series.aluminum', 'equipment.chair', 'equipment.cadillac']

for (const id of [...dottedProducts, ...dottedTaxonomy]) {
  for (const target of [id, `drafts.${id}`]) {
    try {
      await client.delete(target)
      console.log('deleted', target)
    } catch (err) {
      // Missing doc or no-op — fine.
    }
  }
}

// 2. Recreate taxonomy as PUBLISHED, dotless ids.
const taxonomy = [
  {
    _id: 'series-aluminum',
    _type: 'series',
    title: 'Aluminum',
    slug: { _type: 'slug', current: 'aluminum' },
    order: 2,
    description: 'Aircraft-grade aluminium frames — light, stackable and travel-ready.',
  },
  { _id: 'equipment-chair', _type: 'equipment', title: 'Chair', slug: { _type: 'slug', current: 'chair' }, order: 2 },
  { _id: 'equipment-cadillac', _type: 'equipment', title: 'Cadillac', slug: { _type: 'slug', current: 'cadillac' }, order: 3 },
]
for (const doc of taxonomy) {
  await client.createOrReplace(doc)
  console.log('taxonomy', doc._id)
}

// 3. Recreate products as PUBLISHED, dotless ids, referencing the dotless taxonomy.
const products = [
  { id: 'product-studio-reformer-lite', title: 'Studio Reformer Lite', slug: 'studio-reformer-lite', sku: 'CR-RF-080', series: WOOD, price: 2400, summary: 'A lighter studio reformer for boutique rooms and home studios.', ships: '6–8 weeks', lead: '6–8 wks' },
  { id: 'product-wunda-chair', title: 'Wunda Chair', slug: 'wunda-chair', sku: 'CR-CH-100', series: WOOD, price: 1200, summary: 'Compact Wunda chair for strength, balance and rehab work.', ships: '5–7 weeks', lead: '5–7 wks' },
  { id: 'product-cadillac-trapeze', title: 'Cadillac Trapeze', slug: 'cadillac-trapeze', sku: 'CR-CD-100', series: WOOD, price: 4200, summary: 'Full trapeze table for advanced studio programming and rehab.', ships: '7–9 weeks', lead: '7–9 wks' },
  { id: 'product-alu-studio-reformer', title: 'Alu Studio Reformer', slug: 'alu-studio-reformer', sku: 'AL-RF-100', series: 'series-aluminum', price: 2800, summary: 'Aluminium-framed reformer — lightweight, stackable and travel-ready.', ships: '6–8 weeks', lead: '6–8 wks' },
]
for (const p of products) {
  await client.createOrReplace({
    _id: p.id,
    _type: 'product',
    title: p.title,
    slug: { _type: 'slug', current: p.slug },
    sku: p.sku,
    status: 'published',
    series: ref(p.series),
    equipmentTypes: equipmentReferencesForProduct({ sku: p.sku, title: p.title }),
    summary: p.summary,
    productionStatus: 'in_production',
    shipsIn: p.ships,
    priceDisplay: 'show',
    price: p.price,
    currency: 'USD',
    priceUnit: 'ex-works / unit',
    moq: '10 units',
    leadTime: p.lead,
    warranty: '10 years',
    brand: 'Coral Pilates',
  })
  console.log('product', p.id)
}

console.log('done')
