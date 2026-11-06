export type ProductRouteFields = {
  slug?: string | null
  productType?: string | null
  categorySlug?: string | null
  productCategorySlug?: string | null
}

export function productDetailPath(product: ProductRouteFields): string {
  const slug = product.slug
  const categorySlug = product.categorySlug ?? product.productCategorySlug
  if (!slug) return '/products'
  if (product.productType === 'customDisplay' && categorySlug && isReservedCustomCategorySlug(categorySlug)) {
    return `/products/custom-displays/${categorySlug}/${slug}`
  }
  if (product.productType === 'customDisplay' && categorySlug) {
    return `/products/${categorySlug}/${slug}`
  }
  if (product.productType === 'hardware' && categorySlug) {
    return `/products/hardware/${categorySlug}/${slug}`
  }
  if (product.productType === 'partAccessory' && categorySlug) {
    return `/products/parts-accessories/${categorySlug}/${slug}`
  }
  return `/products/${slug}`
}

export function productCategoryPath(category: {
  slug?: string | null
  productType?: string | null
  rootSlugAvailable?: boolean | null
}): string {
  if (!category.slug) return '/products'
  if (category.productType === 'hardware') return `/products/hardware/${category.slug}`
  if (category.productType === 'partAccessory') return `/products/parts-accessories/${category.slug}`
  return category.rootSlugAvailable === false || isReservedCustomCategorySlug(category.slug)
    ? `/products/custom-displays/${category.slug}`
    : `/products/${category.slug}`
}

function isReservedCustomCategorySlug(slug: string): boolean {
  return ['hardware', 'parts-accessories', 'parts', 'custom-displays'].includes(slug)
}
