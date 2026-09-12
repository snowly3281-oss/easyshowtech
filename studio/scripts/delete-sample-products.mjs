/**
 * Delete the 5 scaffold/sample products (design-mockup SKUs like CR-RF-100)
 * that were confirmed unrelated to the real client catalog. None are referenced
 * by any other document (verified). Idempotent — delete() on a missing id is a
 * no-op.
 *
 * Run (from repo root): node --env-file=studio/.env studio/scripts/delete-sample-products.mjs
 */
import { createClient } from '@sanity/client'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) throw new Error('SANITY_WRITE_TOKEN missing (studio/.env)')

const client = createClient({
  projectId: 'p3d22f8w',
  dataset: 'production',
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
})

// The 5 image-less sample products (SKU shown for the log).
const SAMPLES = [
  { _id: 'product-alu-studio-reformer', sku: 'AL-RF-100' },
  { _id: 'product-cadillac-trapeze', sku: 'CR-CD-100' },
  { _id: 'product-wunda-chair', sku: 'CR-CH-100' },
  { _id: 'product-studio-reformer-lite', sku: 'CR-RF-080' },
  { _id: 'cfca59aa-3662-46b9-afd9-c856a9b04412', sku: 'CR-RF-100' },
]

const DRYRUN = !!process.env.DRYRUN

async function main() {
  for (const s of SAMPLES) {
    if (DRYRUN) {
      console.log('DRYRUN would delete', s._id, `(${s.sku})`)
      continue
    }
    await client.delete(s._id)
    console.log('deleted', s._id, `(${s.sku})`)
  }
  const remaining = await client.fetch('count(*[_type=="product"])')
  console.log(`done. products remaining: ${remaining}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
