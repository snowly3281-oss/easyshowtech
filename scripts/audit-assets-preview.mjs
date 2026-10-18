import { createClient } from '@sanity/client'

const c = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
  perspective: 'published',
})

// Show lqip/base64-preview and palette so we can eyeball each new image
// without having to load 9MB JPEGs. We can't reliably detect "is this a
// wedding venue" from a hash, but a small inline preview makes the call
// much easier than staring at a 39-row list of filenames.
const assets = await c.fetch(`
  *[_type == "sanity.imageAsset"] | order(_createdAt asc){
    _id, originalFilename, "mime": mimeType, "size": size,
    "width": metadata.dimensions.width, "height": metadata.dimensions.height,
    title, alt, description, "uploadedAt": _createdAt,
    "lqip": metadata.lqip,
    "palette": metadata.palette
  }
`)

console.log(`count: ${assets.length}\n`)

// Mark which were "new" (i.e. created after the prior 13-asset baseline).
// We don't know the exact upload times, but anything after the first 13
// sorted by _createdAt is the recent upload.
const newOnes = assets.slice(13)
console.log(`NEW (uploaded since previous run): ${newOnes.length}\n`)

for (const a of assets) {
  const isNew = newOnes.includes(a)
  const tag = isNew ? '🆕' : '  '
  const dims = `${a.width}×${a.height}`
  const sizeKb = (a.size / 1024).toFixed(0)
  console.log(`${tag} ${a._id.slice(0, 20)}…${a._id.slice(-6)}  ${dims.padEnd(11)} ${sizeKb.padStart(6)}KB  ${a.originalFilename ?? '—'}`)
  if (a.palette?.dominant) {
    const [r, g, b] = a.palette.dominant.background ?? []
    console.log(`     palette dominant rgb: ${r},${g},${b}`)
  }
  if (a.lqip) console.log(`     lqip: ${a.lqip.slice(0, 40)}…`)
}
