/**
 * Publish the client-approved standard configuration for every Solution.
 *
 * Every Solution keeps the client-confirmed Recommended tier. Boutique Studio
 * also carries Compact / Recommended / Expanded sample schedules so operators
 * can learn the three-tier workflow from a complete, internally documented
 * example. The public page still describes every package as plan-dependent;
 * final placement and quotation are never automatic.
 *
 * Run from the repository root:
 *   node --env-file=studio/.env studio/scripts/publish-solution-packages.mjs
 */
import { createClient } from '@sanity/client'
import source from '../content/solution-packages.seed.json' with { type: 'json' }

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'p3d22f8w',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-10-01',
  useCdn: false,
})

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Missing SANITY_WRITE_TOKEN in studio/.env.')
  process.exit(1)
}

const copyBySlug = {
  'boutique-studio': {
    configurationIntro:
      'Choose the schedule that matches the available floor area. Every item links to its product page; Coral confirms final clearance, placement and freight after reviewing the room plan.',
    assistedHeading: 'Send your floor plan. We will do the rest.',
    assistedBody:
      'Not sure which tier fits? Upload the room and Coral will return a circulation-aware equipment schedule with linked product specifications.',
  },
  franchise: {
    title: 'Franchise studio — standard fit-out',
    summary:
      'A durable aluminium package for repeatable, high-frequency group teaching across multiple locations.',
    configurationIntro:
      'Use the approved standard package as the rollout baseline. Site-specific quantities are confirmed against each location plan.',
    assistedHeading: 'Standardise the room before you scale.',
    assistedBody:
      'Upload a site plan and opening schedule. Coral will adapt the baseline package while preserving your chain-wide equipment standard.',
  },
  'rehab-clinic': {
    title: 'Rehabilitation clinic — standard fit-out',
    summary:
      'A focused classical equipment mix for one-to-one rehabilitation, post-operative work and posture correction.',
    configurationIntro:
      'The approved clinical package keeps circulation and transfer space generous. Final placement is reviewed against treatment rooms and patient flow.',
    assistedHeading: 'Let us review the clinical workflow.',
    assistedBody:
      'Upload the plan and describe your treatment mix. Coral will return an equipment schedule that protects access, privacy and safe circulation.',
  },
  'hotel-spa': {
    title: 'Hotel, resort or spa — standard fit-out',
    summary:
      'A refined maple package that balances premium presentation, guest use and a compact public-space footprint.',
    configurationIntro:
      'The approved package is the visual and operational baseline. We adapt quantities and finish selections to the property plan.',
    assistedHeading: 'Match the equipment to the property.',
    assistedBody:
      'Share the wellness-space plan and interior direction. Coral will propose placement, quantities and coordinated finishes.',
  },
  'home-pt': {
    title: 'Home or private training — standard fit-out',
    summary:
      'A space-saving three-in-one maple setup for serious home practice and private one-to-one instruction.',
    configurationIntro:
      'This approved compact package covers full-body training without crowding a small room. We verify clearances from your plan.',
    assistedHeading: 'Make every square metre work.',
    assistedBody:
      'Upload a room plan or dimensions and Coral will check operating clearance, storage and the best equipment orientation.',
  },
  'training-academy': {
    title: 'Training academy — standard fit-out',
    summary:
      'A complete classical teaching set for instructor education, practical comparison and assessment.',
    configurationIntro:
      'The approved academy package covers the core classical curriculum. Final quantities scale with cohort size and teaching format.',
    assistedHeading: 'Plan a teaching floor, not just a product list.',
    assistedBody:
      'Share the floor plan and cohort size. Coral will map teaching zones, circulation and the right mix for simultaneous practice.',
  },
}

const productIdByCustomName = {
  'Classical Reformer': 'product-eleven-ac-re001-stl',
  'Classical Reformer Tower': 'product-eleven-ac-re002',
  'Classical Three-in-one Reformer': 'product-eleven-ac-re004',
  'Classical Cadillac': 'product-eleven-ac-re003',
  'Classical Wunda Chair': 'product-eleven-ac-re008',
  'Pedi Pole': 'product-eleven-ac-re005',
  'Spine Corrector + Arc + Small Barrel': 'product-eleven-ac-re007',
}

/**
 * Boutique Studio's three complete, catalog-backed series schedules.
 *
 * Aluminium is intentionally absent: the current published Aluminium range
 * does not contain the Cadillac, Ladder Barrel and Chair needed for this
 * example. Never surface a series selector merely to make the UI look fuller.
 */
const boutiqueSeriesProducts = [
  {
    seriesSlug: 'wood-maple',
    isRecommended: true,
    productIds: [
      'product-eleven-m-re001',
      'product-eleven-m-re002',
      'product-eleven-m-re005',
      'product-eleven-m-re010',
      'product-eleven-m-re008',
    ],
  },
  {
    seriesSlug: 'wood-oak',
    productIds: [
      'product-eleven-o-re001',
      'product-eleven-o-re002',
      'product-eleven-o-re005',
      'product-eleven-o-re008',
      'product-eleven-o-re009',
    ],
  },
  {
    seriesSlug: 'professional',
    productIds: [
      'product-eleven-ab-re001',
      'product-eleven-ab-re014',
      'product-eleven-ab-re005',
      'product-eleven-ab-re015',
      'product-eleven-ab-re018',
    ],
  },
]

// Packages are authored from the English source solution. Do not let the
// locale copies of the same series overwrite this map — references are stored
// by document ID, and choosing an arbitrary localized copy makes the English
// package selector display another language.
const seriesDocuments = await client.fetch(
  '*[_type == "series" && coalesce(language, "en") == "en" && defined(slug.current) && !(_id in path("drafts.**"))]{_id, "slug": slug.current}',
)
const seriesIdBySlug = new Map(
  seriesDocuments.map((series) => [series.slug, series._id]),
)

function packageItem(item, index) {
  const base = {
    _type: 'solutionPackageItem',
    _key: `item-${index + 1}`,
    quantity: item.quantity,
    unit: item.unit || 'unit',
  }
  const productId = item.productId || productIdByCustomName[item.customName]
  if (productId) {
    return {
      ...base,
      product: {
        _type: 'reference',
        _ref: productId,
      },
      ...(item.customName === 'Spine Corrector + Arc + Small Barrel'
        ? { variantNote: 'Package includes Arc + Small Barrel teaching set' }
        : {}),
    }
  }
  return {
    ...base,
    customName: item.customName,
  }
}

function packageSeriesVariant(entry) {
  const seriesId = seriesIdBySlug.get(entry.seriesSlug)
  if (!seriesId) {
    throw new Error(`Missing published series: ${entry.seriesSlug}`)
  }

  return {
    _type: 'solutionPackageSeriesVariant',
    _key: `series-${entry.seriesSlug}`,
    series: {
      _type: 'reference',
      _ref: seriesId,
    },
    isRecommended: entry.isRecommended === true,
    items: entry.items.map(packageItem),
    internalNote:
      entry.internalNote ||
      `Boutique Studio ${entry.seriesSlug} sample schedule. Confirm final clearance, orientation and freight from each buyer floor plan.`,
  }
}

function boutiqueVariants(entry) {
  return boutiqueSeriesProducts.map((series) => ({
    ...series,
    items: entry.items.map((item, index) => ({
      ...item,
      productId: series.productIds[index],
      customName: undefined,
    })),
  }))
}

function packageDocument(entry, copy, solutionSlug) {
  const isRecommended = entry.tier === 'recommended'
  const seriesVariants =
    entry.seriesVariants ??
    (solutionSlug === 'boutique-studio' ? boutiqueVariants(entry) : [])

  return {
    _type: 'solutionPackage',
    _key: `tier-${entry.tier}`,
    title: entry.title || copy?.title || 'Configuration package',
    tier: entry.tier || 'recommended',
    isRecommended,
    summary: entry.summary || (isRecommended ? copy?.summary : undefined),
    areaMinSqm: entry.areaMinSqm,
    areaMaxSqm: entry.areaMaxSqm,
    areaMinSqFt: entry.areaMinSqFt,
    areaMaxSqFt: entry.areaMaxSqFt,
    equipmentTotalMin: entry.equipmentTotalMin,
    equipmentTotalMax: entry.equipmentTotalMax,
    leadTime: entry.leadTime || '4–6 weeks',
    priceDisplay: entry.priceDisplay || 'quote',
    showItemQuantities: entry.showItemQuantities ?? false,
    items: entry.items.map(packageItem),
    ...(seriesVariants.length
      ? { seriesVariants: seriesVariants.map(packageSeriesVariant) }
      : {}),
    internalNote:
      entry.internalNote || entry._review || entry.sourceDescriptionZh,
  }
}

function sourcePackages(entry) {
  return Array.isArray(entry.tiers) && entry.tiers.length > 0
    ? entry.tiers.map((tier) => ({
        ...tier,
        sourceDescriptionZh: entry.sourceDescriptionZh,
      }))
    : [entry]
}

for (const entry of source.packages) {
  const documentId = await client.fetch(
    '*[_type == "solution" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id',
    { slug: entry.solutionSlug },
  )
  if (!documentId) {
    console.warn(`Skipped ${entry.solutionSlug}: no published Solution document.`)
    continue
  }

  const copy = copyBySlug[entry.solutionSlug]
  const packageDocuments = sourcePackages(entry).map((packageEntry) =>
    packageDocument(packageEntry, copy, entry.solutionSlug),
  )

  await client
    .patch(documentId)
    .set({
      packages: packageDocuments,
      configurationIntro: copy?.configurationIntro,
      assistedConfiguration: {
        heading: copy?.assistedHeading,
        body: copy?.assistedBody,
      },
    })
    .commit({ autoGenerateArrayKeys: false })

  console.log(
    `Published ${packageDocuments.length} package(s): ${entry.solutionSlug}`,
  )
}
