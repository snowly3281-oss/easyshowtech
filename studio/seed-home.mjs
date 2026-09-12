/**
 * Seed the home singleton (id "home") + 3 posts for the insights strip.
 * Copy style: Title Case headings, Grade-8 reading level, concise.
 * Editorial text/stats only — the home CTAs point to fixed site routes and are
 * hardcoded in the components. Dotless id; idempotent via createOrReplace.
 *
 * Run (from repo root):  node --env-file=studio/.env studio/seed-home.mjs
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'p3d22f8w',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-10-01',
  useCdn: false,
})
if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN (studio/.env).')
  process.exit(1)
}

const term = (key, label, value) => ({ _key: key, label, value })
const step = (key, label) => ({ _key: key, label })

await client.createOrReplace({
  _id: 'home',
  _type: 'home',
  hero: {
    eyebrow: 'Manufacturer · OEM-ready',
    heading: 'Studio-Grade Pilates Equipment Manufacturer',
    subheading: 'Pilates equipment for studios, clinics and hospitality projects, with OEM options quoted to your brief.',
    stats: [],
  },
  howWeWork: {
    heading: 'Off-the-Shelf Stock & Custom Private-Label',
    intro: 'Two ways to work with our factory. Buy from the catalog, or build your own private-label line.',
    cards: [
      {
        _key: 'c1',
        eyebrow: 'For studios, hotels & clinics',
        title: 'Off-the-Shelf Stock',
        terms: [
          term('t1', 'Order quantity', 'Confirmed with your quote'),
          term('t2', 'Lead time', 'Confirmed with your quote'),
          term('t3', 'Pricing', 'On RFQ'),
        ],
      },
      {
        _key: 'c2',
        eyebrow: 'For distributors & new brands',
        title: 'Custom Private-Label (OEM)',
        terms: [
          term('t1', 'Order quantity', 'Based on specification'),
          term('t2', 'Lead time', 'Confirmed after review'),
          term('t3', 'Tooling', 'On RFQ'),
        ],
      },
    ],
  },
  catalog: {
    eyebrow: 'Explore the catalog',
    heading: 'Equipment Series for Studios, Hotels & Clinics',
    intro: 'From hard maple to 7075 aluminum. A few form factors, one fit for each studio.',
  },
  valueProps: [
    { _key: 'v1', title: 'Our Own Factory', body: 'We design and build in-house. No middlemen, so we control quality and lead time.' },
    { _key: 'v2', title: 'Benchmarked Quality', body: 'We test against the top global brands for durability and feel.' },
    { _key: 'v3', title: 'Wholesale + OEM', body: 'Flexible wholesale prices, plus full OEM for your own brand and finish.' },
  ],
  useCases: { eyebrow: 'Who we work with', heading: 'Solutions for 6 Core Client Scenarios' },
  oemBanner: {
    heading: 'Build Your Own Line With Our OEM Service',
    body: 'From custom finishes and logos to fully custom apparatus. We build to your brand and your volume.',
  },
  factory: {
    eyebrow: 'Our factory',
    heading: 'A Real Factory Behind Every Product',
    body: 'Our team manages the production path from material preparation through assembly, inspection and packing.',
    steps: [
      step('f1', 'Material preparation'),
      step('f2', 'Machining and finishing'),
      step('f3', 'Assembly'),
      step('f4', 'Inspection and packing'),
    ],
  },
  insights: { eyebrow: 'Insights', heading: 'From Our Workshop' },
  finalCta: {
    heading: 'Ready to Equip Your Studio?',
    body: "Tell us your space and volume. We'll send a quote and a lead time.",
  },
  seo: {
    metaTitle: 'Coral Pilates — Studio-Grade Pilates Equipment Manufacturer',
    metaDescription:
      'Factory-direct Pilates equipment and OEM, built in our own factory for studios, clinics and hotels worldwide.',
  },
})
console.log('home seeded')

// Posts for the insights strip.
const span = (t, key) => ({ _type: 'span', _key: key, text: t, marks: [] })
const para = (t, key) => ({ _type: 'block', _key: key, style: 'normal', markDefs: [], children: [span(t, `${key}s`)] })

const posts = [
  { id: 'post-choosing-reformers', title: 'How to Choose Reformers for a New Boutique Studio', slug: 'choosing-reformers-boutique-studio', excerpt: 'What matters most when you pick reformers for a new floor: springs, footprint and finish.', day: '2026-05-12' },
  { id: 'post-wood-vs-aluminum', title: 'Wood vs Aluminum Frames: What Lasts in Daily Use', slug: 'wood-vs-aluminum-frames', excerpt: 'How wood and aluminum frames hold up in busy studios and clinics.', day: '2026-05-28' },
  { id: 'post-oem-process', title: 'Inside Our OEM Process, From Sketch to Shipment', slug: 'oem-process-sketch-to-shipment', excerpt: 'How a private-label line goes from a first sketch to a container at your port.', day: '2026-06-09' },
]
for (const p of posts) {
  await client.createOrReplace({
    _id: p.id,
    _type: 'post',
    title: p.title,
    slug: { _type: 'slug', current: p.slug },
    excerpt: p.excerpt,
    publishedAt: `${p.day}T09:00:00Z`,
    body: [
      para(p.excerpt, 'b1'),
      para(
        'Contact our team for product specifications, project planning and a quotation based on your requirements.',
        'b2',
      ),
    ],
  })
  console.log('post', p.id)
}
console.log('done')
