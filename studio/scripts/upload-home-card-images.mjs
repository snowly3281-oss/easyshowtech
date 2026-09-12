/**
 * Migrate the local HowWeWork card placeholder photos (public/factory/*.webp)
 * into Sanity so the CMS becomes the source of truth for the home page
 * "Off-the-Shelf Stock & Custom Private-Label" cards.
 *
 * Before: cards[c1|c2].image is empty -> the front-end MediaBox renders the
 * local `fallback` file. After: the image lives in Sanity and the field wins
 * over the fallback (no code change needed).
 *
 * Idempotent: an asset is reused if a matching originalFilename already exists;
 * the patch only sets the card `.image` field (key-based path), nothing else.
 *
 * Run (from repo root):
 *   node --env-file=studio/.env studio/scripts/upload-home-card-images.mjs
 */
import { createClient } from '@sanity/client'
import { createReadStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) throw new Error('SANITY_WRITE_TOKEN missing (studio/.env)')

const client = createClient({
  projectId: 'p3d22f8w',
  dataset: 'production',
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
})

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const publicDir = join(repoRoot, 'public')

// The two home cards and the local placeholder each should adopt in Sanity.
const CARDS = [
  {
    key: 'c1',
    file: 'factory/home-realfactory-01.webp',
    alt: 'Ready-to-ship Pilates equipment stacked in the Coral factory warehouse',
  },
  {
    key: 'c2',
    file: 'factory/home-realfactory-02.webp',
    alt: 'Custom Pilates apparatus on the Coral factory production line',
  },
]

async function ensureAsset(relPath) {
  const filename = relPath.split('/').pop()
  const existing = await client.fetch(
    `*[_type=="sanity.imageAsset" && originalFilename==$f][0]{_id}`,
    { f: filename },
  )
  if (existing?._id) {
    console.log(`reuse existing asset ${filename} -> ${existing._id}`)
    return existing._id
  }
  const asset = await client.assets.upload('image', createReadStream(join(publicDir, relPath)), {
    filename,
    contentType: 'image/webp',
  })
  console.log(`uploaded ${filename} -> ${asset._id}`)
  return asset._id
}

async function main() {
  const patch = client.patch('home')
  for (const card of CARDS) {
    const assetId = await ensureAsset(card.file)
    patch.set({
      [`howWeWork.cards[_key=="${card.key}"].image`]: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
        alt: card.alt,
      },
    })
  }
  const res = await patch.commit()
  console.log('patched home ->', res._id, 'rev', res._rev)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
