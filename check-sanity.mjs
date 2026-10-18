// Try the exact GROQ with projection
const base = 'https://w8rk6k6z.api.sanity.io/v2026-10-17/data/query/production'
const q = '*[_type == "solution"]{ _id, title, language, "slug": slug.current, _updatedAt }'
const url = base + '?query=' + encodeURIComponent(q) + '&returnQuery=false'

console.log('=== Replay with Vision-style GROQ ===')
const r = await fetch(url)
console.log('status', r.status)
console.log(await r.text())
