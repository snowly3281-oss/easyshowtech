import { createClient } from '@sanity/client'

const c = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
  perspective: 'published',
})

const assets = await c.fetch(`
  *[_type == "sanity.imageAsset"] | order(_createdAt asc){
    _id, originalFilename, "mime": mimeType, "size": size,
    "width": metadata.dimensions.width, "height": metadata.dimensions.height,
    "title": title, "alt": alt, "description": description,
    "uploadedAt": _createdAt
  }
`)

console.log('=== IMAGE ASSETS ===')
console.log('count:', assets.length)
for (const a of assets) {
  console.log(
    `- ${a._id} | ${a.originalFilename ?? '—'} | ${a.width}×${a.height} | ${(a.size / 1024).toFixed(0)}KB | title=${a.title ?? '—'} | alt=${a.alt ?? '—'}`
  )
}
