/**
 * Build real product documents from the client catalog CSV and link the
 * already-uploaded image assets (named by SKU, e.g. eleven-o-re001-featured.webp).
 *
 * Scope: the 29 SKUs in the Wood Oak / Wood Maple / Aluminum series that have
 * images uploaded. Documents are created PUBLISHED (bare _id, idempotent via
 * createOrReplace).
 *
 * Run (from studio/, token read from studio/.env):
 *   node --env-file=.env scripts/build-products.mjs            # all 29
 *   ONLY=O-RE001 node --env-file=.env scripts/build-products.mjs    # one
 *   DRYRUN=1 node --env-file=.env scripts/build-products.mjs        # preview, no writes
 */
import {createClient} from '@sanity/client'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {equipmentReferencesForProduct} from './equipment-taxonomy.mjs'

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
const ONLY = process.env.ONLY || null
const DRYRUN = !!process.env.DRYRUN

const SERIES_REF = {
  O: 'series-wood-oak',
  M: 'ab5ad458-802f-4a72-8f5a-86fde0d9fe99', // Wood Maple
  A: 'series-aluminum',
}

// ---- tiny CSV parser (handles quoted fields with commas) ---------------
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQ = false
      } else field += c
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

// ---- helpers -----------------------------------------------------------
const slugify = (s) =>
  s.toLowerCase().replace(/\([^)]*\)/g, (m) => ' ' + m.replace(/[()]/g, '') + ' ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const dims = (s) => (s || '').trim().replace(/\s*[x*×]\s*/gi, ' × ').replace(/\s*cm\s*$/i, '').trim() + ' cm'

function weightRows(gwnw) {
  // "130/90kg" -> gross 130 kg, net 90 kg
  const m = (gwnw || '').match(/([\d.]+)\s*\/\s*([\d.]+)\s*kg/i)
  if (!m) return [{_key: 'w0', label: 'Weight', value: (gwnw || '').trim()}]
  return [
    {_key: 'w0', label: 'Gross weight', value: `${m[1]} kg`},
    {_key: 'w1', label: 'Net weight', value: `${m[2]} kg`},
  ]
}

function springValue(s) {
  const t = (s || '').trim()
  if (/^no$/i.test(t)) return 'No springs'
  return t
}

// "At a glance" big-number band — honest, catalog-derived numerics only.
// (Length from the footprint, net + gross weight.) No invented specs.
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

function imgRef(id, key, alt) {
  return {_key: key, _type: 'galleryImage', image: {_type: 'image', asset: {_type: 'reference', _ref: id}}, alt}
}

// ---- fetch all SKU-named image assets, group by sku --------------------
const assets = await client.fetch(
  `*[_type=="sanity.imageAsset" && string::startsWith(originalFilename,"eleven-")]{_id, originalFilename}`
)
const bySku = {} // "O-RE001" -> {featured, numbered:[{n,id}]}
for (const a of assets) {
  const m = a.originalFilename.match(/^eleven-([a-z]{1,2})-re(\d{3})-(featured|\d+)\.webp$/i)
  if (!m) continue
  const code = `${m[1].toUpperCase()}-RE${m[2]}`
  const g = (bySku[code] ||= {featured: null, numbered: []})
  if (m[3].toLowerCase() === 'featured') g.featured = a._id
  else g.numbered.push({n: parseInt(m[3], 10), id: a._id})
}
for (const k in bySku) bySku[k].numbered.sort((x, y) => x.n - y.n)

// ---- build docs --------------------------------------------------------
const targets = records.filter((r) => {
  const letter = r.code.split('-')[0]
  return ['O', 'M', 'A'].includes(letter) && Number(r.img_total) > 0 && (!ONLY || r.code === ONLY)
})

const docs = targets.map((r) => {
  const letter = r.code.split('-')[0]
  const imgs = bySku[r.code] || {featured: null, numbered: []}
  const title = r.name.trim()
  const alt = title

  // main image: featured if present, else first numbered shot
  let mainAssetId = imgs.featured
  let galleryShots = imgs.numbered
  if (!mainAssetId && galleryShots.length) {
    mainAssetId = galleryShots[0].id
    galleryShots = galleryShots.slice(1)
  }

  const doc = {
    _id: `product-${r.sku_full.toLowerCase()}`, // product-eleven-o-re001
    _type: 'product',
    title,
    slug: {_type: 'slug', current: slugify(title)},
    sku: r.sku_full,
    status: 'published',
    series: {_type: 'reference', _ref: SERIES_REF[letter]},
    equipmentTypes: equipmentReferencesForProduct({sku: r.sku_full, title}),
    productionStatus: 'in_production',
    priceDisplay: 'show',
    price: Number(r.price_usd),
    currency: 'USD',
    specDimensions: [
      {_key: 'd0', label: 'Product size', value: dims(r.product_size)},
      {_key: 'd1', label: 'Packaging size', value: dims(r.packaging_size)},
    ],
    specWeight: weightRows(r.gw_nw),
    specMechanism: [{_key: 'm0', label: 'Springs', value: springValue(r.spring)}],
    specMaterials: [{_key: 's0', label: 'In the box', value: (r.accessories || '').replace(/^with\s+/i, '').trim()}],
    keySpecs: keySpecsFrom(r),
  }
  if (mainAssetId) {
    doc.mainImage = {_type: 'image', asset: {_type: 'reference', _ref: mainAssetId}, alt}
  }
  if (galleryShots.length) {
    doc.gallery = galleryShots.map((g, i) => imgRef(g.id, `g${i}`, alt))
  }
  return doc
})

console.log(`Target SKUs: ${docs.length}${ONLY ? ` (ONLY=${ONLY})` : ''}`)
for (const d of docs) {
  console.log(`  ${d.sku} -> ${d._id} | "${d.title}" | $${d.price} | main:${d.mainImage ? 'Y' : 'N'} gallery:${d.gallery?.length || 0}`)
}

if (DRYRUN) {
  console.log('\nDRYRUN — nothing written. Sample doc:')
  console.log(JSON.stringify(docs[0], null, 2))
  process.exit(0)
}

let ok = 0
for (const d of docs) {
  await client.createOrReplace(d)
  ok++
}
console.log(`\nWrote ${ok} published product document(s).`)
