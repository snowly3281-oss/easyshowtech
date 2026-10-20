import { defineQuery } from 'groq'

/**
 * Published product slugs — drives getStaticPaths for /products/[slug].
 * Only `isActive == true` products are built.
 */
export const productPathsQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    isActive == true &&
    defined(slug.current)
  ]{ "slug": slug.current }
`)

/**
 * All active products for the Products grid.
 *
 * New display-equipment schema uses:
 *   - series reference → series->title, series->slug.current
 *   - printingServices[] → service slugs for the printing-tab facet
 *   - isActive flag (not status == "published")
 *
 * catalogType is always "equipment" for display products.
 */
export const productListQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    sku,
    summary,
    "seriesTitle": series->title,
    "seriesSlug": series->slug.current,
    "serviceSlugs": printingServices[]->slug.current,
    mainImage{ asset, alt },
    priceDisplay,
    price,
    priceMin,
    priceMax,
    currency,
    isFeatured,
    sortOrder,
  }
`)

/**
 * One active product by slug, fully projected for the PDP.
 *
 * printingServices is the primary many-to-many relationship with printing services.
 * relatedProducts is the curated list (when present); fallback to same-series products.
 */
export const productBySlugQuery = defineQuery(`
  *[
    _type == "product" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    isActive == true
  ][0]{
    _id,
    title,
    "slug": slug.current,
    sku,
    summary,
    "seriesTitle": series->title,
    "seriesSlug": series->slug.current,
    "seriesDescription": series->description,
    "serviceTitles": printingServices[]->title,
    "serviceSlugs": printingServices[]->slug.current,
    productionLeadTime,
    priceDisplay,
    price,
    priceMin,
    priceMax,
    currency,
    priceUnit,
    moq,
    warranty,
    mainImage{ asset, alt },
    galleryImages[]{ _key, image, alt, label },
    keyFeatures[]{ _key, title, description },
    keySpecs[]{ _key, label, value, note },
    variants[]{ _key, variantName, sku, attributes, isDefault, image{ asset, alt } },
    materials,
    customizationOptions,
    "printingServices": printingServices[]->{
      _id,
      title,
      "slug": slug.current,
      shortDescription,
    },
    description,
    metaTitle,
    metaDescription,
    ogImage{ asset, alt },
    brand,
    mpn,
    gtin13,
    "related": select(
      count(relatedProducts) > 0 => relatedProducts[]->{
        _id, title, "slug": slug.current, sku,
        "seriesTitle": series->title,
        "seriesSlug": series->slug.current,
        mainImage{ asset, alt },
        priceDisplay, price, priceMin, priceMax, currency
      },
      *[
        _type == "product" &&
        coalesce(language, "en") == $language &&
        isActive == true &&
        series._ref == ^.series._ref &&
        _id != ^._id
      ] | order(sortOrder asc, title asc)[0...3]{
        _id, title, "slug": slug.current, sku,
        "seriesTitle": series->title,
        "seriesSlug": series->slug.current,
        mainImage{ asset, alt },
        priceDisplay, price, priceMin, priceMax, currency
      }
    )
  }
`)
