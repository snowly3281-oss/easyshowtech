import { createClient } from '@sanity/client'

const c = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID || 'w8rk6k6z',
  dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-10-01',
  useCdn: true,
  perspective: 'published',
})

const [home, product] = await Promise.all([
  c.fetch(`*[_type == "home"][0]{ _id, useCases, _updatedAt }`),
  c.fetch(`*[_type == "product" && coalesce(language,"en") == "en" && status == "published"][0]{
    _id, title, "slug": slug.current, sku
  }`),
])

console.log('home._id:', home?._id)
console.log('home.useCases:', JSON.stringify(home?.useCases, null, 2))
console.log('product:', JSON.stringify(product, null, 2))
