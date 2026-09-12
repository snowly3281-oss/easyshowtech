/**
 * Upload the home hero background video as a Sanity file asset and point the
 * home singleton's `hero.video` at it. The Sanity MCP cannot upload binaries,
 * so this runs locally with the write token (studio/.env), mirroring
 * build-products.mjs.
 *
 * Run (from studio/):
 *   node --env-file=.env scripts/upload-hero-video.mjs
 *   DRYRUN=1 node --env-file=.env scripts/upload-hero-video.mjs        # no writes
 *   VIDEO=/path/to.webm node --env-file=.env scripts/upload-hero-video.mjs
 *
 * Patches BOTH published `home` (the site reads perspective:published) and
 * `drafts.home` when it exists, so the ref survives the next Studio publish.
 */
import { createClient } from '@sanity/client'
import { createReadStream, statSync } from 'node:fs'
import { basename, extname } from 'node:path'

const token = process.env.SANITY_WRITE_TOKEN
if (!token) throw new Error('SANITY_WRITE_TOKEN missing (studio/.env)')
const VIDEO = process.env.VIDEO
if (!VIDEO) {
  throw new Error(
    'VIDEO missing. Pass an absolute video path, for example VIDEO=/path/to/hero.webm',
  )
}

const client = createClient({
  projectId: 'p3d22f8w',
  dataset: 'production',
  apiVersion: '2024-06-01',
  token,
  useCdn: false,
})

const DRYRUN = !!process.env.DRYRUN
const CONTENT_TYPE = extname(VIDEO).toLowerCase() === '.mp4' ? 'video/mp4' : 'video/webm'

async function main() {
  const sizeMb = (statSync(VIDEO).size / 1e6).toFixed(2)
  console.log(`Video: ${VIDEO} (${sizeMb} MB, ${CONTENT_TYPE})`)

  const ids = await client.fetch('*[_id in ["home","drafts.home"]]._id')
  if (!ids.includes('home')) throw new Error('published "home" document not found — nothing to patch')
  console.log('Home docs found:', ids.join(', '))

  if (DRYRUN) {
    console.log('DRYRUN — would upload the asset and set hero.video on:', ids.join(', '))
    return
  }

  console.log('Uploading file asset…')
  const asset = await client.assets.upload('file', createReadStream(VIDEO), {
    filename: basename(VIDEO),
    contentType: CONTENT_TYPE,
  })
  console.log('Uploaded:', asset._id)
  console.log('URL:', asset.url)

  const videoField = { _type: 'file', asset: { _type: 'reference', _ref: asset._id } }
  for (const id of ids) {
    await client.patch(id).set({ 'hero.video': videoField }).commit()
    console.log('Patched', id, '→ hero.video')
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
