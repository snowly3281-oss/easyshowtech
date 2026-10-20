import { defineQuery } from 'groq'

/**
 * All active printing services for the /printing-services list page.
 */
export const printingServiceListQuery = defineQuery(`
  *[
    _type == "service" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "cardImage": cardImage{ asset, alt },
  }
`)

/**
 * One active printing service by slug for /printing-services/[slug].
 */
export const printingServiceBySlugQuery = defineQuery(`
  *[
    _type == "service" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    isActive == true
  ][0]{
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    description,
    "heroImage": heroImage{ asset, alt },
    "cardImage": cardImage{ asset, alt },
    benefits[]{ _key, title, description },
    supportedMaterials,
    suitableApplications,
    artworkRequirements,
    processSteps[]{ _key, stepNumber, title, description },
    "relatedProducts": relatedProducts[]->{
      _id,
      title,
      "slug": slug.current,
      sku,
      summary,
      "seriesTitle": series->title,
      mainImage{ asset, alt },
      priceDisplay,
      price,
    },
    metaTitle,
    metaDescription,
    "ogImage": ogImage{ asset, alt },
  }
`)

/**
 * All active series for the /series list page.
 */
export const seriesListQuery = defineQuery(`
  *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "cardImage": cardImage{ asset, alt },
    "skuCount": count(*[
      _type == "product" &&
      coalesce(language, "en") == $language &&
      isActive == true &&
      references(^._id)
    ])
  }
`)

/**
 * One active series by slug for /series/[slug].
 */
export const seriesBySlugQuery = defineQuery(`
  *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    slug.current == $slug &&
    isActive == true
  ][0]{
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    description,
    "heroImage": heroImage{ asset, alt },
    "cardImage": cardImage{ asset, alt },
    metaTitle,
    metaDescription,
    "ogImage": ogImage{ asset, alt },
    "products": *[
      _type == "product" &&
      coalesce(language, "en") == $language &&
      isActive == true &&
      references(^._id)
    ] | order(sortOrder asc, title asc){
      _id,
      title,
      "slug": slug.current,
      sku,
      summary,
      mainImage{ asset, alt },
      priceDisplay,
      price,
      priceMin,
      priceMax,
      currency,
    }
  }
`)
