/**
 * Canonical equipment taxonomy and deterministic catalog classification.
 *
 * The rules come from the client PDF catalog. They intentionally use broad
 * customer-facing facets: towers remain Reformers, while hybrid products can
 * carry multiple tags (for example Cadillac + Reformer).
 */
export const EQUIPMENT_TAXONOMY = [
  { id: '2e4c9bce-1208-4e93-ac36-a2fbc4f778f6', slug: 'reformer', title: 'Reformer', order: 1 },
  { id: 'equipment-chair', slug: 'chair', title: 'Chair', order: 2 },
  { id: 'equipment-cadillac', slug: 'cadillac', title: 'Cadillac', order: 3 },
  { id: 'equipment-barrel', slug: 'barrel', title: 'Barrel', order: 4 },
  {
    id: 'equipment-spine-corrector',
    slug: 'spine-corrector',
    title: 'Spine Corrector',
    order: 5,
  },
  { id: 'equipment-springboard', slug: 'springboard', title: 'Springboard', order: 6 },
  { id: 'equipment-wall-tower', slug: 'wall-tower', title: 'Wall Tower', order: 7 },
  { id: 'equipment-pedi-pole', slug: 'pedi-pole', title: 'Pedi Pole', order: 8 },
  { id: 'equipment-folding-mat', slug: 'folding-mat', title: 'Folding Mat', order: 9 },
  {
    id: 'equipment-spiral-pulley',
    slug: 'spiral-pulley',
    title: 'Spiral Pulley',
    order: 10,
  },
]

const TAXONOMY_BY_SLUG = new Map(EQUIPMENT_TAXONOMY.map((item) => [item.slug, item]))

/**
 * Resolve the PDF catalog's product naming into one or more equipment facets.
 * Throws on unknown names so future imports cannot silently recreate the
 * missing-equipment bug.
 */
export function equipmentSlugsForProduct({ sku, title }) {
  const name = String(title ?? '').trim().toLowerCase()

  if (name.includes('chair barrel combo')) return ['chair', 'barrel']
  if (name.includes('cadillac reformer') || name === 'coral ar-2 pro max') {
    return ['cadillac', 'reformer']
  }
  if (name.includes('spine corrector')) return ['spine-corrector']
  if (name.includes('ladder barrel') || name.includes('barrel metal base')) return ['barrel']
  if (name.includes('springboard')) return ['springboard']
  if (name.includes('wall tower')) return ['wall-tower']
  if (name.includes('pedi pole')) return ['pedi-pole']
  if (name.includes('folding mat')) return ['folding-mat']
  if (name.includes('spiral pulley')) return ['spiral-pulley']
  if (name.includes('cadillac') || name.includes('trapeze table')) return ['cadillac']
  if (name.includes('chair')) return ['chair']
  if (
    name.includes('reformer') ||
    /^coral ar-[123](?: pro)?$/.test(name) ||
    /^coral modular-[123](?: pro)?$/.test(name) ||
    /^coral (?:oak|maple|aluminum) fold-[12]$/.test(name)
  ) {
    return ['reformer']
  }

  throw new Error(`No equipment mapping for ${sku ?? '(no SKU)'} — "${title ?? ''}"`)
}

export function equipmentReferencesForProduct(product) {
  return equipmentSlugsForProduct(product).map((slug) => {
    const item = TAXONOMY_BY_SLUG.get(slug)
    if (!item) throw new Error(`Unknown equipment taxonomy slug "${slug}"`)
    return {
      _key: slug,
      _type: 'reference',
      _ref: item.id,
    }
  })
}

export function equipmentDocument(item) {
  return {
    _id: item.id,
    _type: 'equipment',
    title: item.title,
    slug: { _type: 'slug', current: item.slug },
    order: item.order,
  }
}
