// scripts/seed-solutions.mjs
//
// Two things, in order:
//   1. (Re)build the NDJSON from the source-of-truth script.
//   2. Validate every line (shape + Sanity-side reachability + reference checks).
//
// To actually write drafts to Sanity, use the `sanity datasets import` CLI
// from inside the `studio/` directory, using your already-logged-in Sanity
// CLI session (no token needs to leave your machine):
//
//     cd studio
//     npx sanity datasets import ../scripts/solutions-seed.ndjson production --missing
//
// The --missing flag means re-running the import will skip documents that
// already exist by _id, so it's safe to re-run after partial import.

import { readFile } from 'node:fs/promises'
import { createClient } from '@sanity/client'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const NDJSON_PATH = resolve(__dirname, 'solutions-seed.ndjson')
const BUILD_SCRIPT = resolve(__dirname, 'build-solutions-ndjson.mjs')

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z'
const dataset = process.env.PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2024-10-01'

const readClient = createClient({
  projectId, dataset, apiVersion, useCdn: true, perspective: 'published',
})

// ── schema-derivable validation ───────────────────────────────────────────
const REQUIRED_TOP = ['_id', '_type', 'language', 'title', 'slug']
const KNOWN_BLOCK_TYPES = new Set(['heroBlock', 'ctaBlock', 'textBlock', 'faqsBlock'])
const KNOWN_TIERS = new Set(['compact', 'recommended', 'expanded'])
const KNOWN_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CNY'])
const KNOWN_PRICE_DISPLAY = new Set(['show', 'range', 'quote'])

function fail(msg) { console.error(`✗ ${msg}`); return 1 }
function ok(msg) { console.log(`✓ ${msg}`) }

function validateBlock(block, i) {
  if (!block._key) return fail(`pageBuilder[${i}] missing _key`)
  if (!KNOWN_BLOCK_TYPES.has(block._type)) return fail(`pageBuilder[${i}] unknown _type "${block._type}"`)
  if (block._type === 'textBlock') {
    if (!Array.isArray(block.body) || block.body.length === 0) return fail(`textBlock[${i}] body must be non-empty array`)
    for (const [bi, b] of block.body.entries()) {
      if (b._type !== 'block') return fail(`textBlock.body[${bi}] _type must be "block"`)
      if (!b._key) return fail(`textBlock.body[${bi}] missing _key`)
      if (!Array.isArray(b.children) || b.children.length === 0) return fail(`textBlock.body[${bi}].children empty`)
    }
  }
  if (block._type === 'faqsBlock' && block.items) {
    for (const [fi, item] of block.items.entries()) {
      if (item._type !== 'faqItem') return fail(`faqsBlock.items[${fi}] _type must be "faqItem"`)
      if (!item._key) return fail(`faqsBlock.items[${fi}] missing _key`)
    }
  }
  return 0
}

function validatePackage(pkg, slug) {
  if (!pkg._key) return fail(`package missing _key`)
  if (!pkg.title) return fail(`package[${pkg._key}] missing title`)
  if (pkg.tier && !KNOWN_TIERS.has(pkg.tier)) return fail(`package[${pkg._key}] tier "${pkg.tier}" invalid`)
  if (pkg.priceDisplay && !KNOWN_PRICE_DISPLAY.has(pkg.priceDisplay)) return fail(`package[${pkg._key}] priceDisplay invalid`)
  if (pkg.currency && !KNOWN_CURRENCIES.has(pkg.currency)) return fail(`package[${pkg._key}] currency invalid`)
  if (!Array.isArray(pkg.items)) return fail(`package[${pkg._key}] items must be array`)
  for (const [ii, item] of pkg.items.entries()) {
    if (!item._key) return fail(`package[${slug}/${pkg._key}].items[${ii}] missing _key`)
    if (item._type !== 'solutionPackageItem') return fail(`package[${slug}/${pkg._key}].items[${ii}] _type must be "solutionPackageItem"`)
  }
  return 0
}

function validateDoc(doc, i) {
  for (const f of REQUIRED_TOP) if (!doc[f]) return fail(`doc #${i + 1} missing "${f}"`)
  if (doc._type !== 'solution') return fail(`doc #${i + 1} _type must be "solution"`)
  if (!doc.slug?.current) return fail(`doc #${i + 1} slug.current required`)
  if (!doc._id.startsWith('drafts.')) return fail(`doc #${i + 1} _id must start with "drafts." to import as draft (got "${doc._id}")`)
  if (!Array.isArray(doc.pageBuilder) || doc.pageBuilder.length === 0) return fail(`doc #${i + 1} pageBuilder must be non-empty`)
  let code = 0
  for (const [bi, b] of doc.pageBuilder.entries()) code |= validateBlock(b, bi)
  if (!Array.isArray(doc.packages) || doc.packages.length === 0) {
    code |= fail(`doc #${i + 1} packages must be non-empty`)
  } else {
    for (const p of doc.packages) code |= validatePackage(p, doc.slug.current)
    const recommended = doc.packages.filter((p) => p.isRecommended === true || p.tier === 'recommended')
    if (recommended.length !== 1) code |= fail(`doc #${i + 1} expected exactly 1 recommended, got ${recommended.length}`)
  }
  if (!Array.isArray(doc.products) || doc.products.length === 0) {
    code |= fail(`doc #${i + 1} products[] must be non-empty`)
  }
  return code
}

// ── main ──────────────────────────────────────────────────────────────────
console.log('─ Step 1: rebuild NDJSON ─')
execSync(`node "${BUILD_SCRIPT}"`, { stdio: 'inherit' })

const raw = await readFile(NDJSON_PATH, 'utf8')
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
console.log(`\n─ Step 2: validate ${lines.length} docs ─`)

const docs = []
for (let i = 0; i < lines.length; i++) {
  try { docs.push(JSON.parse(lines[i])) } catch (e) { fail(`line ${i + 1} parse error: ${e.message}`); process.exit(1) }
}

let exit = 0
for (let i = 0; i < docs.length; i++) exit |= validateDoc(docs[i], i)
if (exit) { console.error('\n✗ Local validation failed.'); process.exit(exit) }
ok('Local shape OK.')

console.log('\n─ Step 3: Sanity reachability ─')
const [existingSolutions, existingProductRefs] = await Promise.all([
  readClient.fetch(`*[_type == "solution"]{ _id, "slug": slug.current }`),
  readClient.fetch(`*[_type == "product" && status == "published"]{ _id }`),
])
const existingSlugs = new Set(existingSolutions.map((s) => s.slug).filter(Boolean))
const productIds = new Set(existingProductRefs.map((p) => p._id))
for (const d of docs) {
  if (existingSlugs.has(d.slug.current)) {
    // drafts are fine to overwrite; just make sure slug is still unique
    const dup = docs.filter((x) => x.slug.current === d.slug.current)
    if (dup.length > 1) exit |= fail(`slug "${d.slug.current}" appears ${dup.length} times in NDJSON`)
  }
  for (const p of d.products ?? []) {
    if (!productIds.has(p._ref)) exit |= fail(`doc "${d.slug.current}" refs missing product _ref "${p._ref}"`)
  }
  for (const pkg of d.packages ?? []) {
    for (const item of pkg.items ?? []) {
      if (item.product?._ref && !productIds.has(item.product._ref)) {
        exit |= fail(`doc "${d.slug.current}" pkg "${pkg._key}" refs missing product "${item.product._ref}"`)
      }
    }
  }
}
if (exit) { console.error('\n✗ Sanity reference check failed.'); process.exit(exit) }
ok('No slug conflicts and all product refs resolve.')

console.log('\n─ SUMMARY ─')
for (const d of docs) {
  const tiers = d.packages.map((p) => p.tier).join(',')
  console.log(`  • ${d._id.padEnd(38)} | ${d.title.padEnd(28)} | pkgs=${d.packages.length} [${tiers}]`)
}

console.log(`\n✓ ${docs.length} drafts ready in ${NDJSON_PATH}`)
console.log('\nNext: from the studio/ directory, run (uses your local `sanity` login):')
console.log('    cd studio')
console.log(`    npx sanity datasets import ../scripts/solutions-seed.ndjson production --missing`)
console.log('Then open Studio → Drafts → publish the 6 by hand.')
