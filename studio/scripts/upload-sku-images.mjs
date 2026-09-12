/**
 * Upload SKU-named product images (webp) from a local dir into Sanity as image
 * assets, using the filename as `originalFilename` so build-products.mjs can
 * link them (`eleven-{letter}-re{NNN}-{featured|NN}.webp`). Idempotent: skips a
 * file whose originalFilename already exists as an asset.
 *
 * Run (from repo root):
 *   DIR=/path/to/webps node --env-file=studio/.env studio/scripts/upload-sku-images.mjs
 */
import { createClient } from '@sanity/client'
import { readdirSync, createReadStream } from 'node:fs'
import { join } from 'node:path'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) throw new Error('SANITY_WRITE_TOKEN missing (studio/.env)')

const client = createClient({
  projectId: 'p3d22f8w',
  dataset: 'production',
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
})

const DIR = process.env.DIR
if (!DIR) throw new Error('DIR env var required (folder of .webp files)')
const DRYRUN = !!process.env.DRYRUN

async function main() {
  const files = readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.webp')).sort()
  console.log(`Found ${files.length} webp files in ${DIR}`)

  // existing asset filenames, to skip re-uploads
  const existing = new Set(
    await client.fetch(`*[_type=="sanity.imageAsset" && string::startsWith(originalFilename,"eleven-")].originalFilename`)
  )

  let uploaded = 0
  let skipped = 0
  for (const f of files) {
    if (existing.has(f)) {
      skipped++
      continue
    }
    if (DRYRUN) {
      console.log('DRYRUN would upload', f)
      continue
    }
    const asset = await client.assets.upload('image', createReadStream(join(DIR, f)), {
      filename: f,
      contentType: 'image/webp',
    })
    console.log('uploaded', f, '->', asset._id)
    uploaded++
  }
  console.log(`Done. uploaded=${uploaded} skipped(existing)=${skipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
