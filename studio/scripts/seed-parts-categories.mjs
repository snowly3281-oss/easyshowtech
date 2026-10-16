// Seed the 5 canonical partsCategory documents in EN + 4 locales, plus
// migrate any products that still have a string `partsCategory` to a
// reference pointing at the new document.
//
// Run: `node studio/scripts/seed-parts-categories.mjs`
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

const CATEGORIES = [
  {
    key: 'springs',
    order: 10,
    translations: {
      en: 'Springs & resistance',
      es: 'Muelles y resistencia',
      fr: 'Ressorts et résistance',
      de: 'Federn und Widerstand',
      it: 'Molle e resistenza',
    },
  },
  {
    key: 'upholstery',
    order: 20,
    translations: {
      en: 'Upholstery & padding',
      es: 'Tapicería y acolchado',
      fr: 'Revêtement et rembourrage',
      de: 'Polsterung und Polster',
      it: 'Rivestimenti e imbottiture',
    },
  },
  {
    key: 'cables_ropes',
    order: 30,
    translations: {
      en: 'Cables, ropes & pulleys',
      es: 'Cables, cuerdas y poleas',
      fr: 'Câbles, cordes et poulies',
      de: 'Kabel, Seile und Rollen',
      it: 'Cavi, corde e pulegge',
    },
  },
  {
    key: 'footbars_hardware',
    order: 40,
    translations: {
      en: 'Footbars & hardware',
      es: 'Barras de pies y herrajes',
      fr: 'Barres de pied et quincaillerie',
      de: 'Fußstangen und Beschläge',
      it: 'Barre poggiapiedi e ferramenta',
    },
  },
  {
    key: 'training_accessories',
    order: 50,
    translations: {
      en: 'Training accessories (boxes, mats, boards)',
      es: 'Accesorios de entrenamiento (cajas, colchonetas, tablas)',
      fr: 'Accessoires d’entraînement (boîtes, tapis, planches)',
      de: 'Trainingszubehör (Boxen, Matten, Bretter)',
      it: 'Accessori per l’allenamento (box, tappetini, tavole)',
    },
  },
]

async function ensureCategory(category, language) {
  const id = `partsCategory.${category.key}.${language}`
  const doc = {
    _id: id,
    _type: 'partsCategory',
    language,
    key: category.key,
    order: category.order,
    title: category.translations[language],
  }
  await client.createOrReplace(doc)
  return id
}

async function main() {
  const languages = Object.keys(CATEGORIES[0].translations)
  const enIdByKey = new Map()
  for (const category of CATEGORIES) {
    for (const language of languages) {
      const id = await ensureCategory(category, language)
      if (language === 'en') enIdByKey.set(category.key, id)
      console.log(`✓ ${id}  (${language})`)
    }
  }

  // Migration: any product whose partsCategory is a raw string ("springs"
  // etc.) → convert to a reference to the EN document of the matching key.
  const legacy = await client.fetch(
    `*[_type == "product" && defined(partsCategory) && string::startsWith(string(partsCategory), "") && !(defined(partsCategory->key))]{
      _id, language, partsCategory
    }`,
  )
  let migrated = 0
  for (const product of legacy) {
    const key = typeof product.partsCategory === 'string' ? product.partsCategory : null
    if (!key) continue
    const ref = enIdByKey.get(key)
    if (!ref) continue
    await client.patch(product._id).set({ partsCategory: { _type: 'reference', _ref: ref } }).commit()
    migrated++
    console.log(`→ ${product._id} (${product.language}) partsCategory: "${key}" → ref ${ref}`)
  }
  console.log(`\nSeeded ${CATEGORIES.length * languages.length} partsCategory documents.`)
  console.log(`Migrated ${migrated} product(s) from string to reference.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
