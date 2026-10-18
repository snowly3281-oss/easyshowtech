// One-off helper: write a tiny HTML page that lists all current Sanity image
// assets with a click-to-open full-size preview, so you can eyeball them in
// the browser and tell me which one goes to which solution.
//
// Usage:  node scripts/inspect-assets.mjs
//         then open the printed URL in your browser.
import { writeFile } from 'node:fs/promises'
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
    "lqip": metadata.lqip
  }
`)

const cards = assets.map((a) => {
  const img = `https://cdn.sanity.io/images/w8rk6k6z/production/${a._id
    .replace('image-', '')
    .replace(/-(png|jpg|jpeg|webp)$/i, '')}.${
    a.originalFilename?.match(/\.(png|jpg|jpeg|webp)$/i)?.[0].replace('.', '') ?? 'jpg'
  }?w=600&h=400&fit=crop&auto=format`
  return `
    <figure>
      <img src="${img}" loading="lazy" referrerpolicy="no-referrer" />
      <figcaption>
        <code>${a._id}</code>
        <small>${a.width}×${a.height} · ${(a.size / 1024).toFixed(0)} KB · ${a.originalFilename ?? '—'}</small>
      </figcaption>
    </figure>
  `
}).join('\n')

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Sanity image asset inspector (${assets.length} total)</title>
  <style>
    body { font: 14px/1.4 -apple-system, system-ui, sans-serif; margin: 0; background: #1a1a1a; color: #e5e5e5; }
    h1 { padding: 16px 24px; margin: 0; background: #000; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; padding: 16px; }
    figure { margin: 0; background: #2a2a2a; border-radius: 6px; overflow: hidden; }
    figure img { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; background: #444; }
    figcaption { padding: 8px 10px; }
    code { font: 11px/1.4 ui-monospace, Menlo, monospace; word-break: break-all; color: #ffd47a; }
    small { display: block; margin-top: 4px; color: #9aa0a6; font-size: 11px; }
  </style>
</head>
<body>
  <h1>Sanity image asset inspector — ${assets.length} total (13 original + 26 new)</h1>
  <main>${cards}</main>
</body>
</html>`

await writeFile('scripts/_asset-inspector.html', html, 'utf8')
console.log('Wrote scripts/_asset-inspector.html')
console.log('Open it with:  start scripts/_asset-inspector.html   (Windows)')
