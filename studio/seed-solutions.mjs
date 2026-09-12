/**
 * Seed the five remaining solution pages (boutique-studio already exists) so the
 * hardcoded nav links in src/config/site.ts resolve through /solutions/[slug].
 * Dotless hyphenated ids (publicly readable). Idempotent via createOrReplace.
 *
 * Run (from repo root):  node --env-file=studio/.env studio/seed-solutions.mjs
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

const span = (t, k) => ({ _type: 'span', _key: k, text: t, marks: [] })
const para = (t, k) => ({ _type: 'block', _key: k, style: 'normal', markDefs: [], children: [span(t, `${k}s`)] })
const quote = (label) => ({ _type: 'ctaLink', label, external: 'mailto:chris@coralpilates.com' })

const solutions = [
  {
    id: 'solution-franchise',
    title: 'Franchise',
    slug: 'franchise',
    audience: ['budget_b2b', 'oem_distributor'],
    summary: 'Roll out a consistent studio experience across every franchise location.',
    heroHeading: 'One studio standard, every location',
    heroSub: 'Equip new franchise sites with identical, studio-grade equipment — matched finishes, bulk pricing and one point of contact.',
    textHeading: 'Consistency that scales',
    p1: 'Franchisees expect the same room and the same reformer in every city. Coral builds to a fixed spec, so unit 1 and unit 50 are identical.',
    p2: 'We keep your spec on file and ship to each opening on schedule, with volume pricing that improves as you grow.',
    ctaHeading: 'Opening new locations?',
    ctaBody: 'Send us your rollout schedule and we will plan equipment, pricing and freight per site.',
  },
  {
    id: 'solution-rehab-clinic',
    title: 'Rehab clinic',
    slug: 'rehab-clinic',
    audience: ['budget_b2b', 'brand_owner'],
    summary: 'Clinical-grade Pilates equipment for physiotherapy and rehabilitation.',
    heroHeading: 'Built for clinical work',
    heroSub: 'Durable, easy-to-clean reformers and towers for physio, rehab and post-operative programming.',
    textHeading: 'Clinical durability',
    p1: 'Rehab settings are hard on equipment. Coral frames are built to take daily clinical use, with wipe-clean upholstery and serviceable hardware.',
    p2: 'Adjustable resistance and accessible transfers suit a wide range of patients and protocols.',
    ctaHeading: 'Fitting out a clinic?',
    ctaBody: 'Tell us your treatment mix and space, and we will recommend a clinical equipment package.',
  },
  {
    id: 'solution-hotel-spa',
    title: 'Hotel spa',
    slug: 'hotel-spa',
    audience: ['brand_owner', 'oem_distributor'],
    summary: 'Signature Pilates amenities for hotels, spas and wellness resorts.',
    heroHeading: 'A wellness amenity that signals quality',
    heroSub: 'Beautiful, durable equipment for hotel gyms and spa studios — finished to match your property and your brand.',
    textHeading: 'On-brand, guest-ready',
    p1: 'Guests judge a wellness offer in seconds. Coral equipment looks the part and holds up to high-turnover use.',
    p2: 'Custom wood finishes and upholstery let the studio match your interior and brand palette.',
    ctaHeading: 'Designing a spa studio?',
    ctaBody: 'Share your space and aesthetic, and we will spec a studio that fits the property.',
  },
  {
    id: 'solution-home-pt',
    title: 'Home / PT',
    slug: 'home-pt',
    audience: ['budget_b2b', 'brand_owner'],
    summary: 'Compact, premium equipment for home studios and private trainers.',
    heroHeading: 'Studio quality at home',
    heroSub: 'Compact, foldable and travel-ready equipment for private trainers and serious home practitioners.',
    textHeading: 'Premium, in a small footprint',
    p1: 'Private trainers need studio-grade equipment that fits a spare room or travels between clients.',
    p2: 'Foldable frames and lighter aluminium options make setup, storage and transport easy.',
    ctaHeading: 'Setting up at home?',
    ctaBody: 'Tell us your space and we will recommend the right compact reformer or tower.',
  },
  {
    id: 'solution-training-academy',
    title: 'Training academy',
    slug: 'training-academy',
    audience: ['oem_distributor', 'budget_b2b'],
    summary: 'Equip a teacher-training academy at scale.',
    heroHeading: 'Equip the next generation of teachers',
    heroSub: 'A full floor of consistent, durable equipment for teacher-training academies and large group programs.',
    textHeading: 'Built for the floor',
    p1: 'Training academies run long days with many students on every machine. Coral equipment is built for that volume.',
    p2: 'A consistent floor means trainees learn on the same equipment they will teach on in studios worldwide.',
    ctaHeading: 'Building an academy floor?',
    ctaBody: 'Send us your class sizes and we will plan a full-floor package and pricing.',
  },
]

for (const s of solutions) {
  await client.createOrReplace({
    _id: s.id,
    _type: 'solution',
    title: s.title,
    slug: { _type: 'slug', current: s.slug },
    audience: s.audience,
    summary: s.summary,
    pageBuilder: [
      { _type: 'heroBlock', _key: 'hero', eyebrow: 'Solutions', heading: s.heroHeading, subheading: s.heroSub, cta: quote('Get a quote') },
      { _type: 'textBlock', _key: 'text', heading: s.textHeading, body: [para(s.p1, 'p1'), para(s.p2, 'p2')] },
      { _type: 'ctaBlock', _key: 'cta', heading: s.ctaHeading, body: s.ctaBody, cta: quote('Start an inquiry') },
    ],
  })
  console.log('solution', s.id)
}
console.log('done')
