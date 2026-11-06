/**
 * Resolve an internal reference target to a site path.
 *
 * Internal links in the content model are references; queries project them to
 * `{ _type, slug }`. This maps that to a route (content-model principle 6 —
 * links are references, not id strings). Falls back to an external URL.
 */
export interface InternalTarget {
  _type?: string | null
  slug?: string | null
  productType?: string | null
  categorySlug?: string | null
}

export function resolveHref(
  internal?: InternalTarget | null,
  external?: string | null
): string | null {
  if (internal?._type) {
    const slug = internal.slug ?? ''
    switch (internal._type) {
      case 'solution':
        return slug ? `/solutions/${slug}` : null
      case 'product':
        if (!slug) return null
        if (internal.productType === 'customDisplay' && internal.categorySlug) return `/products/${internal.categorySlug}/${slug}`
        if (internal.productType === 'hardware' && internal.categorySlug) return `/products/hardware/${internal.categorySlug}/${slug}`
        if (internal.productType === 'partAccessory' && internal.categorySlug) return `/products/parts-accessories/${internal.categorySlug}/${slug}`
        return `/products/${slug}`
      case 'post':
        return slug ? `/resources/${slug}` : null
      case 'oem':
        return '/oem-services'
      default:
        return null
    }
  }
  return external ?? null
}
