/**
 * Build DRAFT (status:"draft") product documents for a no-image series, from
 * the catalog CSV. These are real published Sanity docs carrying the "Draft"
 * editorial status — the query layer filters status=="published", so they stay
 * OFF the live site until photos exist and someone flips them to Published.
 *
 * Staged by series on purpose. Run one series at a time (from repo root):
 *   SERIES=AB node --env-file=studio/.env studio/scripts/build-draft-products.mjs
 *   SERIES=AB DRYRUN=1 node --env-file=studio/.env studio/scripts/build-draft-products.mjs
 *
 * Refuses to run if the target series has duplicate sku_full values (the
 * Classical/Folding material-variant problem) — those need suffixed SKUs first.
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { equipmentReferencesForProduct } from './equipment-taxonomy.mjs'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) throw new Error('SANITY_WRITE_TOKEN missing (studio/.env)')
const client = createClient({
  projectId: 'p3d22f8w',
  dataset: 'production',
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
})

const CSV =
  process.env.CSV ||
  fileURLToPath(new URL('../../catalog-reconciliation.csv', import.meta.url))
const SERIES = process.env.SERIES
if (!SERIES) throw new Error('SERIES env var required (e.g. AB, CM, GY)')
const DRYRUN = !!process.env.DRYRUN

const SERIES_REF = {
  O: 'series-wood-oak',
  M: 'ab5ad458-802f-4a72-8f5a-86fde0d9fe99',
  A: 'series-aluminum',
  AB: 'series-professional',
  CM: 'series-modular',
  AC: 'series-classical',
  F: 'series-folding',
  GY: 'series-spiral-pulley', // client decision: dedicated series, NOT Apparatus
}
const ref = SERIES_REF[SERIES]
if (!ref) throw new Error(`Unknown SERIES "${SERIES}" (expected one of ${Object.keys(SERIES_REF).join(', ')})`)

// ---- CSV parse (same as build-products) --------------------------------
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false } else field += c
    } else if (c === '"') inQ = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}
const raw = parseCSV(readFileSync(CSV, 'utf8')).filter((r) => r.length > 1)
const header = raw[0]
const records = raw.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))

// ---- helpers (same shaping as published build) -------------------------
const slugify = (s) =>
  s.toLowerCase().replace(/\([^)]*\)/g, (m) => ' ' + m.replace(/[()]/g, '') + ' ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const dims = (s) => (s || '').trim().replace(/\s*[x*×]\s*/gi, ' × ').replace(/\s*cm\s*$/i, '').trim() + ' cm'
function weightRows(gwnw) {
  const m = (gwnw || '').match(/([\d.]+)\s*\/\s*([\d.]+)\s*kg/i)
  if (!m) return [{ _key: 'w0', label: 'Weight', value: (gwnw || '').trim() }]
  return [
    { _key: 'w0', label: 'Gross weight', value: `${m[1]} kg` },
    { _key: 'w1', label: 'Net weight', value: `${m[2]} kg` },
  ]
}
function springValue(s) { const t = (s || '').trim(); return /^no$/i.test(t) ? 'No springs' : t }
function keySpecsFrom(r) {
  const out = []
  const nums = (r.product_size || '').split(/[x*×]/i).map((p) => parseFloat(p)).filter((n) => !isNaN(n))
  if (nums[0]) out.push({ _key: 'k0', value: String(Math.round(nums[0])), unit: 'cm', label: 'Length' })
  const w = (r.gw_nw || '').match(/([\d.]+)\s*\/\s*([\d.]+)\s*kg/i)
  if (w) {
    out.push({ _key: 'k1', value: w[2], unit: 'kg', label: 'Net weight' })
    out.push({ _key: 'k2', value: w[1], unit: 'kg', label: 'Gross weight' })
  }
  return out
}

// ---- select target series ----------------------------------------------
const targets = records.filter((r) => (r.code || '').split('-')[0] === SERIES)
if (!targets.length) throw new Error(`No CSV rows for series "${SERIES}"`)

// duplicate-SKU guard (Classical/Folding material variants)
const seen = new Map()
const dups = []
for (const r of targets) {
  if (seen.has(r.sku_full)) dups.push(r.sku_full)
  else seen.set(r.sku_full, true)
}
if (dups.length) {
  console.error(`REFUSING: series ${SERIES} has duplicate sku_full values: ${[...new Set(dups)].join(', ')}`)
  console.error('These need distinct (suffixed) SKUs before import — fix the CSV first.')
  process.exit(1)
}

const docs = targets.map((r) => {
  const title = r.name.trim()
  return {
    _id: `product-${r.sku_full.toLowerCase()}`,
    _type: 'product',
    title,
    slug: { _type: 'slug', current: slugify(title) },
    sku: r.sku_full,
    status: 'draft', // editorial gate → stays off the live site
    series: { _type: 'reference', _ref: ref },
    equipmentTypes: equipmentReferencesForProduct({ sku: r.sku_full, title }),
    productionStatus: 'in_production',
    priceDisplay: 'show',
    price: Number(r.price_usd),
    currency: 'USD',
    specDimensions: [
      { _key: 'd0', label: 'Product size', value: dims(r.product_size) },
      { _key: 'd1', label: 'Packaging size', value: dims(r.packaging_size) },
    ],
    specWeight: weightRows(r.gw_nw),
    specMechanism: [{ _key: 'm0', label: 'Springs', value: springValue(r.spring) }],
    specMaterials: [{ _key: 's0', label: 'In the box', value: (r.accessories || '').replace(/^with\s+/i, '').trim() }],
    keySpecs: keySpecsFrom(r),
    // no mainImage / gallery — photography pending
  }
})

// slug-collision guard
const slugs = docs.map((d) => d.slug.current)
const slugDups = slugs.filter((s, i) => slugs.indexOf(s) !== i)
if (slugDups.length) {
  console.error(`REFUSING: slug collisions: ${[...new Set(slugDups)].join(', ')}`)
  process.exit(1)
}

console.log(`Series ${SERIES} → ${docs.length} DRAFT docs (ref ${ref})`)
for (const d of docs) console.log(`  ${d.sku} -> ${d._id} | "${d.title}" | $${d.price} | status:${d.status} | slug:${d.slug.current}`)

if (DRYRUN) { console.log('\nDRYRUN — nothing written.'); process.exit(0) }

let ok = 0
for (const d of docs) { await client.createOrReplace(d); ok++ }
console.log(`\nWrote ${ok} DRAFT product document(s).`)
