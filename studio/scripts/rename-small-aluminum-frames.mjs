/** Rename the two small frame-only products. Dry-run unless --apply. */
import {createClient} from '@sanity/client'

const apply = process.argv.includes('--apply')
const client = createClient({
  projectId: 'w8rk6k6z', dataset: 'production', apiVersion: '2024-10-01',
  useCdn: false, perspective: 'raw', token: process.env.SANITY_API_WRITE_TOKEN,
})
const models = [
  {
    id: 'product.es-atf-004', sku: 'ES-ATF-004',
    oldSlug: '3ft3in-x-3ft3in-commercial-grade-aluminum-canopy-frame',
    title: '1 × 1 m Mini Aluminum Pop Up Canopy Frame',
    slug: '1x1m-mini-aluminum-pop-up-canopy-frame',
    description: 'Mini aluminum pop up canopy frame only in actual 1 × 1 m size (approx. 3.3 × 3.3 ft). 40 mm legs, 1.0 mm tube walls and MOQ 50. Request a quote.',
  },
  {
    id: 'product.es-atf-005', sku: 'ES-ATF-005',
    oldSlug: '6ft7in-x-6ft7in-commercial-grade-aluminum-canopy-frame',
    title: '6.5 × 6.5 ft Small Aluminum Pop Up Canopy Frame',
    slug: '6-5x6-5ft-small-aluminum-pop-up-canopy-frame',
    description: 'Small aluminum pop up canopy frame only in nominal 6.5 × 6.5 ft size (actual 2 × 2 m). 40 mm legs, 1.0 mm tube walls and MOQ 50. Request a quote.',
  },
]

async function main() {
  if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error('SANITY_API_WRITE_TOKEN is missing')
  const related = await client.fetch(
    '*[_type == "product" && sku in $skus]{_id,sku,language,"slug":slug.current}',
    {skus: models.map((model) => model.sku)},
  )
  if (related.some((entry) => !models.some((model) => [model.id, `drafts.${model.id}`].includes(entry._id)))) {
    throw new Error(`Additional localized or draft products share these SKUs: ${JSON.stringify(related)}`)
  }
  const updates = []
  for (const model of models) {
    const doc = await client.getDocument(model.id)
    if (!doc || doc.sku !== model.sku || doc.slug?.current !== model.oldSlug ||
        doc.productType !== 'hardware' || doc.productCategory?._ref !== 'productCategory.aluminum-tent-frames' ||
        doc.priceDisplay !== 'quote' || doc.moq !== 50 || doc.isActive !== true) {
      throw new Error(`${model.sku} differs from the expected published product; inspect before changing`)
    }
    const conflicts = await client.fetch(
      '*[_type == "product" && slug.current == $slug && !(_id in [$id, $draftId])][0]{_id}',
      {slug: model.slug, id: model.id, draftId: `drafts.${model.id}`},
    )
    if (conflicts) throw new Error(`${model.slug} already belongs to another product`)
    const metaTitle = `${model.title} | EASY SHOW`
    const makeChanges = (source) => ({
      title: model.title,
      slug: {_type: 'slug', current: model.slug},
      metaTitle,
      metaDescription: model.description,
      seo: {
        ...source.seo,
        metaTitle,
        metaDescription: model.description,
        ...(source.seo?.ogTitle ? {ogTitle: model.title} : {}),
      },
    })
    const changes = makeChanges(doc)
    updates.push({model, revision: doc._rev, oldTitle: doc.title,
      currentCanonical: doc.seo?.canonicalUrl ?? null, changes, id: model.id})
    const draft = await client.getDocument(`drafts.${model.id}`)
    if (draft) {
      if (draft.sku !== model.sku || draft.slug?.current !== model.oldSlug ||
          draft.seo?.canonicalUrl !== doc.seo?.canonicalUrl) {
        throw new Error(`${model.sku} draft differs: ${JSON.stringify({title: draft.title, slug: draft.slug?.current, canonical: draft.seo?.canonicalUrl ?? null})}`)
      }
      updates.push({model, revision: draft._rev, changes: makeChanges(draft), id: draft._id, draft: true})
    }
  }
  console.log(JSON.stringify({mode: apply ? 'apply' : 'dry-run', products: updates.filter((update) => !update.draft).map(({model, oldTitle, currentCanonical, changes}) => ({
    sku: model.sku, oldTitle, newTitle: changes.title, oldSlug: model.oldSlug,
    newSlug: changes.slug.current, metaTitle: changes.metaTitle, currentCanonical,
    draftAlsoUpdated: updates.some((update) => update.model.id === model.id && update.draft),
  }))}, null, 2))
  if (!apply) return
  let transaction = client.transaction()
  for (const {id, revision, changes} of updates) {
    transaction = transaction.patch(id, (patch) => patch.ifRevisionId(revision).set(changes))
  }
  await transaction.commit({visibility: 'sync'})
  console.log('Updated both published products; SKU, images, dimensions, specifications, MOQ and price mode are unchanged.')
}

main().catch((error) => {
  console.error(`Small-frame rename failed: ${error.message}`)
  process.exitCode = 1
})
