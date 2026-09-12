/**
 * Seed ONE solution document ("Boutique studio") so the Astro vertical slice
 * has real content to render at /solutions/boutique-studio.
 *
 * WHY you run it (not the assistant): the assistant's sandbox can't reach
 * api.sanity.io and has no write token — only @sanity/client with the Studio
 * write token can create documents. (Same reason as import-images.mjs.)
 *
 * It uses createOrReplace with a fixed _id, so it's idempotent — re-run freely.
 * The copy here is realistic placeholder content; the client replaces it later
 * in Studio.
 *
 * ── Run (from studio/) ──────────────────────────────────────────────────────
 *   DRY=1 node --env-file=.env seed-boutique.mjs   # print the doc, write nothing
 *   node --env-file=.env seed-boutique.mjs         # create/replace the document
 *
 * Requires SANITY_WRITE_TOKEN in studio/.env (already used by import-images.mjs).
 * After seeding, run `npm run typegen` + `npm run build` at the repo root (or
 * visit the page with the dev server running).
 */
import { createClient } from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID || 'p3d22f8w'
const dataset = process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN
const DRY = process.env.DRY === '1' || process.env.DRY === 'true'

if (!token) {
  console.error('Missing SANITY_WRITE_TOKEN. Run from studio/: node --env-file=.env seed-boutique.mjs')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-10-01', token, useCdn: false })

// Portable Text helpers.
const span = (text, key) => ({ _type: 'span', _key: key, text, marks: [] })
const para = (text, key) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [span(text, `${key}s`)],
})

const quote = (label) => ({ _type: 'ctaLink', label, external: 'mailto:chris@coralpilates.com' })

const doc = {
  _id: 'solution.boutique-studio',
  _type: 'solution',
  title: 'Boutique studio',
  slug: { _type: 'slug', current: 'boutique-studio' },
  audience: ['budget_b2b', 'brand_owner'],
  summary:
    'Factory-direct Pilates equipment for independent boutique studios — spec a balanced floor of reformers, towers and accessories, matched in finish and priced studio by studio.',
  pageBuilder: [
    {
      _type: 'heroBlock',
      _key: 'hero1',
      eyebrow: 'Solutions',
      heading: 'Equip a boutique studio that fills its schedule',
      subheading:
        'Factory-direct reformers, towers and accessories with the finish your members notice — sized and priced for an independent studio.',
      cta: quote('Get a quote'),
    },
    {
      _type: 'textBlock',
      _key: 'text1',
      heading: 'A room that sells the experience',
      body: [
        para(
          'A boutique studio lives or dies on how the room feels. Coral builds studio-grade equipment in our own Suzhou factory, so the wood, upholstery and hardware match across every piece — no mismatched second-hand kit.',
          'p1'
        ),
        para(
          'Start with a balanced floor of reformers, add a tower or two for small-group classes, and round it out with springboards and accessories. We help you spec the mix to your room and your class formats.',
          'p2'
        ),
      ],
    },
    {
      _type: 'ctaBlock',
      _key: 'cta1',
      heading: 'Ready to plan your studio floor?',
      body:
        'Send us your room size and class formats and we will put together a recommended package and a factory-direct quote.',
      cta: quote('Start an inquiry'),
    },
    {
      _type: 'faqsBlock',
      _key: 'faqs1',
      heading: 'Frequently asked',
      items: [
        {
          _type: 'faqItem',
          _key: 'q1',
          question: 'What is the minimum order for a studio fit-out?',
          answer:
            'There is no studio minimum — order a single reformer or a full floor. Volume and OEM pricing applies on larger orders; ask for a quote on your list.',
        },
        {
          _type: 'faqItem',
          _key: 'q2',
          question: 'How long does delivery take?',
          answer:
            'Most studio equipment ships in six to eight weeks after your deposit clears, with global freight forwarding to your door or port.',
        },
        {
          _type: 'faqItem',
          _key: 'q3',
          question: 'Can we match the equipment to our brand?',
          answer:
            'Yes — upholstery colours, wood finish and logo placement can be customised. For private-label or full OEM, see our OEM services.',
        },
      ],
    },
  ],
}

async function main() {
  if (DRY) {
    console.log(JSON.stringify(doc, null, 2))
    console.log('\nDRY run — nothing written.')
    return
  }
  const res = await client.createOrReplace(doc)
  console.log('Seeded solution:', res._id, '→ /solutions/boutique-studio')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
