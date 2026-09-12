/**
 * Backfill the PDF catalog's multi-value Equipment taxonomy.
 *
 * Safe by default:
 *   node --env-file=.env scripts/migrate-equipment-types.mjs
 *
 * Commit after reviewing the preview:
 *   node --env-file=.env scripts/migrate-equipment-types.mjs --commit
 *
 * The commit is one optimistic transaction and writes a complete pre-mutation
 * JSON backup under /private/tmp.
 */
import { createClient } from '@sanity/client'
import { writeFileSync } from 'node:fs'
import {
  EQUIPMENT_TAXONOMY,
  equipmentDocument,
  equipmentReferencesForProduct,
} from './equipment-taxonomy.mjs'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) throw new Error('SANITY_WRITE_TOKEN missing (studio/.env)')

const projectId = process.env.SANITY_PROJECT_ID || 'p3d22f8w'
const dataset = process.env.SANITY_DATASET || 'production'
const commit = process.argv.includes('--commit')

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
  perspective: 'raw',
})

const products = await client.fetch(`
  *[_type == "product"] | order(_id asc){
    ...,
    "seriesSlug": series->slug.current
  }
`)

const uniqueSkus = new Set(products.map((product) => product.sku))
if (products.length !== 79 || uniqueSkus.size !== 78) {
  throw new Error(
    `Catalog guard failed: expected 79 documents / 78 unique SKUs, got ${products.length} / ${uniqueSkus.size}`,
  )
}

function sameReferences(current, expected) {
  if (!Array.isArray(current) || current.length !== expected.length) return false
  return expected.every(
    (reference, index) =>
      current[index]?._key === reference._key &&
      current[index]?._type === reference._type &&
      current[index]?._ref === reference._ref,
  )
}

const changes = products.map((product) => {
  const equipmentTypes = equipmentReferencesForProduct(product)
  return {
    product,
    equipmentTypes,
    changed: !sameReferences(product.equipmentTypes, equipmentTypes),
  }
})

for (const { product, equipmentTypes, changed } of changes) {
  const labels = equipmentTypes.map((reference) => reference._key).join(' + ')
  console.log(`${changed ? 'SET ' : 'OK  '} ${product._id} | ${product.sku} | ${labels}`)
}

const pending = changes.filter((change) => change.changed)
console.log(
  `\n${products.length} documents / ${uniqueSkus.size} SKUs checked; ${pending.length} document(s) need changes.`,
)

if (!commit) {
  console.log('DRY RUN — no data written. Re-run with --commit after reviewing this mapping.')
  process.exit(0)
}

if (!pending.length) {
  console.log('Nothing to migrate.')
  process.exit(0)
}

const existingEquipment = await client.fetch(`*[_type == "equipment"]`)
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backupPath = `/private/tmp/coral-equipment-migration-backup-${stamp}.json`
writeFileSync(
  backupPath,
  `${JSON.stringify(
    {
      projectId,
      dataset,
      createdAt: new Date().toISOString(),
      products,
      equipment: existingEquipment,
    },
    null,
    2,
  )}\n`,
)

let transaction = client.transaction()
for (const item of EQUIPMENT_TAXONOMY) {
  transaction = transaction.createIfNotExists(equipmentDocument(item))
}
for (const { product, equipmentTypes } of pending) {
  transaction = transaction.patch(product._id, (patch) =>
    patch.ifRevisionId(product._rev).set({ equipmentTypes }),
  )
}

const result = await transaction.commit({ visibility: 'sync' })
console.log(`Committed transaction ${result.transactionId}`)
console.log(`Pre-mutation backup: ${backupPath}`)

const verification = await client.fetch(`
  *[_type == "product"] | order(_id asc){
    _id,
    _rev,
    sku,
    title,
    "equipmentSlugs": equipmentTypes[]->slug.current
  }
`)
const invalid = verification.filter(
  (product) => !Array.isArray(product.equipmentSlugs) || product.equipmentSlugs.length === 0,
)
if (invalid.length) {
  throw new Error(`Post-migration verification failed for: ${invalid.map((item) => item._id).join(', ')}`)
}
console.log(`Verified ${verification.length} product documents with at least one Equipment type.`)
