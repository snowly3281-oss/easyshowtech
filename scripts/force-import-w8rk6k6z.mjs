// scripts/force-import-w8rk6k6z.mjs
//
// Force-import the 6 solutions directly into w8rk6k6z (easyshowtech) using
// a write token — does NOT depend on `npx sanity` CLI active project.
//
// - Reads scripts/solutions-seed.ndjson
// - Re-keys each doc to plain "solution.<slug>" (no "drafts." prefix) so it
//   lands as PUBLISHED, not draft (matches what the user did in Studio for
//   p3d22f8w).
// - Re-keys product references in packages[] to the real published product
//   _id that exists in w8rk6k6z.

import { readFileSync } from 'node:fs'
import { createClient } from '@sanity/client'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const NDJSON = resolve(__dirname, 'solutions-seed.ndjson')
const ENV_PATH = resolve(__dirname, '..', 'studio', '.env')
const env = readFileSync(ENV_PATH, 'utf8')
const m = env.match(/SANITY_API_WRITE_TOKEN=([^\r\n]+)/)
if (!m) { console.error('No SANITY_API_WRITE_TOKEN in studio/.env'); process.exit(1) }
const token = m[1].trim()

const projectId = 'w8rk6k6z'
const dataset = 'production'

const client = createClient({
  projectId, dataset, apiVersion: '2024-10-01', useCdn: false, token,
})

// Verify token can read the dataset
const ping = await client.fetch(`count(*)`)
console.log(`✓ token ok — ${projectId}/${dataset} has ${ping} docs`)

// Verify the published product referenced by all 6 solutions exists here
const products = await client.fetch(`*[_type == "product"]{ _id, "slug": slug.current }`)
console.log(`✓ ${products.length} product(s) in this dataset:`)
for (const p of products) console.log(`    ${p._id}  slug=${p.slug}`)

// Read ndjson
const raw = readFileSync(NDJSON, 'utf8')
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
console.log(`\n→ ${lines.length} docs in ${NDJSON}`)

const docs = lines.map((l, i) => {
  try { return JSON.parse(l) } catch (e) { console.error(`line ${i + 1} parse: ${e.message}`); process.exit(1) }
})

// Re-key to plain solution.* (not drafts.) and remap product refs
const productByOldRef = new Map()
for (const d of docs) {
  for (const p of d.products ?? []) productByOldRef.set(p._ref, true)
  for (const pkg of d.packages ?? []) {
    for (const item of pkg.items ?? []) {
      if (item.product?._ref) productByOldRef.set(item.product._ref, true)
    }
  }
}
console.log(`\nproduct _refs referenced by solutions: ${[...productByOldRef.keys()].join(', ')}`)

// remap: every ref in our docs must point to a real _id in this dataset
// currently there is 1 product. Many solutions ref the SAME product.
const realProductId = products[0]?._id
if (!realProductId) { console.error('No product in w8rk6k6z — cannot remap refs'); process.exit(1) }

for (const d of docs) {
  // strip "drafts." prefix → publish directly
  d._id = 'solution.' + (d.slug.current || d._id.replace(/^drafts\./, ''))
  for (const p of d.products ?? []) p._ref = realProductId
  for (const pkg of d.packages ?? []) {
    for (const item of pkg.items ?? []) {
      if (item.product?._ref) item.product._ref = realProductId
    }
  }
}

// Import
const tx = client.transaction()
for (const d of docs) tx.createOrReplace(d)
const result = await tx.commit({ visibility: 'async' })
console.log(`\n✓ committed — ${result.documentIds?.length ?? '?'} docs:`)
for (const id of result.documentIds ?? []) console.log(`    ${id}`)
console.log(`result keys: ${Object.keys(result).join(', ')}`)
console.log(`full result: ${JSON.stringify(result).slice(0, 2000)}`)

// Re-verify
const after = await client.fetch(`*[_type == "solution"]{ _id, title, "slug": slug.current } | order(_id asc)`)
console.log(`\n✓ w8rk6k6z/production now has ${after.length} solution(s):`)
for (const s of after) console.log(`    ${s._id}  |  ${s.title}  |  ${s.slug}`)
