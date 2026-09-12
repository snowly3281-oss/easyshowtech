/**
 * Bulk image importer for Coral Pilates products (pipeline A — Sanity).
 *
 * Hybrid behaviour (per your call):
 *   • product EXISTS for a SKU  -> attach (featured -> mainImage, angles -> gallery)
 *   • product does NOT exist yet -> upload images to the Sanity MEDIA LIBRARY
 *     (unattached, labelled with the SKU) so they're in the cloud now; re-run
 *     after the product is built and they get attached automatically.
 *
 * Matches a folder to a product by SKU: product.sku == <folder> OR
 * slug.current == slugify(<folder>). So when you later create a product, put the
 * SKU code (e.g. "Eleven-O-RE001") in its `sku` field to auto-attach on re-run.
 *
 * WHY you run it (not the assistant): the assistant's sandbox can't reach
 * api.sanity.io and the MCP connector can't upload binaries — only
 * @sanity/client can. So this runs on your machine with a write token.
 *
 * ── Expected folder layout (nested) ────────────────────────────────────────
 *   <IMAGES_DIR>/.../Eleven-O-RE001/
 *     featured/eleven-o-re001-featured.webp   -> mainImage (1 image)
 *     angles/eleven-o-re001-01.webp           -> gallery[0]
 *     angles/eleven-o-re001-02.webp           -> gallery[1]   (sorted by name)
 *   Any folder containing a `featured/` or `angles/` subfolder is treated as a
 *   SKU folder. The importer recurses, so you can point IMAGES_DIR at the top
 *   (folders without featured/angles — e.g. "01 Real Factory" — are ignored).
 *   A " (...)" suffix on a folder name (e.g. "(missing ...)") is stripped from
 *   the SKU key; folders with no images are skipped.
 *
 * ── Setup ──────────────────────────────────────────────────────────────────
 *   Editor token in studio/.env (gitignored):  SANITY_WRITE_TOKEN=sk...
 *
 * ── Run (from studio/) ─────────────────────────────────────────────────────
 *   IMAGES_DIR="/absolute/path/to/webp-for-cms" \
 *     DRY=1 node --env-file=.env import-images.mjs      # preview, uploads nothing
 *   IMAGES_DIR="/absolute/path/to/webp-for-cms" \
 *     node --env-file=.env import-images.mjs            # do it
 */

import { createClient } from '@sanity/client'
import { readdirSync, createReadStream, existsSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const projectId = process.env.SANITY_PROJECT_ID || 'p3d22f8w'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const IMAGES_DIR = process.env.IMAGES_DIR || './product-images'
const GALLERY_MODE = (process.env.GALLERY_MODE || 'replace').toLowerCase() // replace | append
const DRY = process.env.DRY === '1' || process.env.DRY === 'true'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])
const CONTENT_TYPE = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
}

if (!token && !DRY) {
  console.error('✗ Missing SANITY_WRITE_TOKEN. Put an Editor token in studio/.env, then:\n  node --env-file=.env import-images.mjs')
  process.exit(1)
}
if (!existsSync(IMAGES_DIR)) {
  console.error(`✗ IMAGES_DIR not found: "${IMAGES_DIR}". Set IMAGES_DIR to your image folder.`)
  process.exit(1)
}

const client = createClient({ projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false })

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const skuKeyFromFolder = (name) => name.split(' (')[0].trim() // drop "(missing ...)" notes
const keyFrom = (f) => basename(f, extname(f)).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
const listImages = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase())).sort() : []

/** Recurse to find SKU folders (dirs that contain a `featured/` or `angles/` subfolder). */
function findSkuFolders(root) {
  const out = []
  const walk = (dir) => {
    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
    if (entries.some((e) => e.isDirectory() && (e.name === 'featured' || e.name === 'angles'))) {
      out.push(dir)
      return // a SKU folder — don't descend further
    }
    for (const e of entries) if (e.isDirectory()) walk(join(dir, e.name))
  }
  walk(root)
  return out.sort()
}

/** Resolve a product (prefer draft) by SKU or slug. Returns id or null. */
async function findProductId(skuKey) {
  const docs = await client.fetch(
    `*[_type=="product" && (sku==$sku || slug.current==$slug)]{_id}`,
    { sku: skuKey, slug: slugify(skuKey) }
  )
  if (!docs.length) return null
  return (docs.find((d) => d._id.startsWith('drafts.')) || docs[0])._id
}

async function upload(filePath, label) {
  if (DRY) return `image-DRYRUN-${keyFrom(filePath)}`
  const asset = await client.assets.upload('image', createReadStream(filePath), {
    filename: basename(filePath),
    contentType: CONTENT_TYPE[extname(filePath).toLowerCase()],
    label,
    title: label,
  })
  return asset._id
}

async function main() {
  console.log(`${DRY ? '[DRY RUN] ' : ''}project=${projectId} dataset=${dataset}\n  IMAGES_DIR=${IMAGES_DIR}\n`)

  const folders = findSkuFolders(IMAGES_DIR)
  if (!folders.length) {
    console.log('No SKU folders found (looking for dirs containing featured/ or angles/).')
    return
  }

  const attached = []
  const library = []
  const skipped = []

  for (const dir of folders) {
    const skuKey = skuKeyFromFolder(basename(dir))
    const featured = listImages(join(dir, 'featured'))
    const angles = listImages(join(dir, 'angles'))
    if (!featured.length && !angles.length) { skipped.push(skuKey); continue }

    const docId = await findProductId(skuKey)

    if (docId) {
      // ── product exists → attach ──────────────────────────────────────────
      const title = (await client.fetch(`*[_id==$id][0].title`, { id: docId })) || skuKey
      const patch = client.patch(docId)

      if (featured.length) {
        if (featured.length > 1) console.warn(`  ${skuKey}: ${featured.length} featured images, using ${featured[0]}`)
        const ref = await upload(join(dir, 'featured', featured[0]), skuKey)
        patch.set({ mainImage: { _type: 'image', alt: title, asset: { _type: 'reference', _ref: ref } } })
      }
      if (angles.length) {
        const items = []
        for (const [i, f] of angles.entries()) {
          const ref = await upload(join(dir, 'angles', f), skuKey)
          items.push({
            _type: 'galleryImage',
            _key: keyFrom(f),
            image: { _type: 'image', asset: { _type: 'reference', _ref: ref } },
            alt: `${title} — view ${i + 1}`,
          })
        }
        if (GALLERY_MODE === 'append') patch.setIfMissing({ gallery: [] }).insert('after', 'gallery[-1]', items)
        else patch.set({ gallery: items })
      }
      if (!DRY) await patch.commit({ visibility: 'async' })
      attached.push(`${skuKey} → ${docId}  (main ${featured.length ? 1 : 0}, gallery ${angles.length})`)
      console.log(`✔ attach  ${skuKey}  main:${featured.length ? 1 : 0} gallery:${angles.length}`)
    } else {
      // ── no product yet → upload to media library (unattached) ────────────
      for (const f of featured) await upload(join(dir, 'featured', f), skuKey)
      for (const f of angles) await upload(join(dir, 'angles', f), skuKey)
      library.push(`${skuKey}  (${featured.length + angles.length} imgs, label="${skuKey}")`)
      console.log(`→ library ${skuKey}  ${featured.length + angles.length} imgs (no product yet)`)
    }
  }

  console.log(`\n────────── summary ${DRY ? '(DRY RUN) ' : ''}──────────`)
  console.log(`attached to a product : ${attached.length}`)
  attached.forEach((s) => console.log(`   ✔ ${s}`))
  console.log(`uploaded to library   : ${library.length}  (build the product, set its sku, then re-run to attach)`)
  library.forEach((s) => console.log(`   → ${s}`))
  if (skipped.length) console.log(`skipped (no images)   : ${skipped.length}  [${skipped.join(', ')}]`)
}

main().catch((err) => {
  console.error('\n✗ Import failed:', err.message || err)
  process.exit(1)
})
