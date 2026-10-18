import { createClient } from '@sanity/client'

const c = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
  perspective: 'published',
})

const types = await c.fetch('array::unique(*[defined(_type)]._type)')
console.log('All types in dataset:', types)

const counts = {}
for (const t of types) {
  counts[t] = await c.fetch('count(*[_type == $t])', { t })
}
console.log('Published counts:')
for (const [t, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(28)} ${n}`)
}

console.log('\nDraft counts:')
const draftCounts = {}
for (const t of types) {
  draftCounts[t] = await c.fetch('count(*[_type == $t && (_id in path("drafts.**"))])', { t })
}
for (const [t, n] of Object.entries(draftCounts).sort((a, b) => b[1] - a[1])) {
  if (n > 0) console.log(`  ${t.padEnd(28)} ${n}`)
}

console.log('\nDataset / projectId:',
  process.env.PUBLIC_SANITY_DATASET || 'production',
  '/',
  process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z')
