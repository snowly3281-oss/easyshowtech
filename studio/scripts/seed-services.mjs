// Seed the canonical `service` taxonomy for the Printing Service tab.
//
// Run: `node studio/scripts/seed-services.mjs`
// Requires SANITY_API_WRITE_TOKEN (Studio Editor token) in env.

import { createClient } from '@sanity/client'

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID ?? 'w8rk6k6z'
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = process.env.SANITY_API_VERSION ?? '2024-10-01'
const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN. Set a Studio editor token in .env.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token })

const SERVICES = [
  {
    slug: 'fabric-printing',
    order: 10,
    translations: {
      en: 'Fabric Printing',
      es: 'Impresión en tela',
      fr: 'Impression sur tissu',
      de: 'Stoffdruck',
      it: 'Stampa su tessuto',
    },
  },
  {
    slug: 'vinyl-wrap',
    order: 20,
    translations: {
      en: 'Vinyl Wraps & Decals',
      es: 'Vinilos y pegatinas',
      fr: 'Habillage vinyle et autocollants',
      de: 'Vinyl-Folierung und Aufkleber',
      it: 'Wrapping in vinile e adesivi',
    },
  },
  {
    slug: 'seg-frame-print',
    order: 30,
    translations: {
      en: 'SEG Frame Printing',
      es: 'Impresión SEG',
      fr: 'Impression cadre SEG',
      de: 'SEG-Rahmendruck',
      it: 'Stampa su telaio SEG',
    },
  },
  {
    slug: 'backdrop-banner',
    order: 40,
    translations: {
      en: 'Backdrop & Banner',
      es: 'Backdrop y banner',
      fr: 'Backdrop et bannière',
      de: 'Hintergrund und Banner',
      it: 'Backdrop e banner',
    },
  },
  {
    slug: 'table-cover',
    order: 50,
    translations: {
      en: 'Table Covers & Runners',
      es: 'Manteles y caminos',
      fr: 'Nappes et chemins de table',
      de: 'Tischdecken und Läufer',
      it: 'Tovaglie e runner',
    },
  },
]

async function ensureService(slug, language, service) {
  const id = `service.${slug}.${language}`
  const doc = {
    _id: id,
    _type: 'service',
    language,
    title: service.translations[language],
    order: service.order,
    slug: { _type: 'slug', current: slug },
  }
  await client.createOrReplace(doc)
  return id
}

async function main() {
  const languages = Object.keys(SERVICES[0].translations)
  let total = 0
  for (const service of SERVICES) {
    for (const language of languages) {
      const id = await ensureService(service.slug, language, service)
      console.log(`✓ ${id}  (${language})`)
      total++
    }
  }
  console.log(`\nSeeded ${total} service documents (${SERVICES.length} × ${languages.length} locales).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
