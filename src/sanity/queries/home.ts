import { defineQuery } from 'groq'

const cta = `{ label, external, internal->{ _type, "slug": slug.current } }`

/**
 * The home singleton — bespoke editorial sections (explicit projection,
 * principle 5). The catalog/use-cases/insights strips are separate queries
 * (live series / solutions / posts); only their headings live here.
 */
export const homeQuery = defineQuery(`
  *[
    _type == "home" &&
    coalesce(language, "en") == $language
  ][0]{
    hero{
      eyebrow, heading, subheading,
      image{ asset, alt },
      "videoUrl": video.asset->url,
      "videoType": video.asset->mimeType,
      ctaPrimary${cta},
      ctaSecondary${cta},
      stats[]{ _key, value, label }
    },
    howWeWork{
      heading, intro,
      cards[]{ _key, eyebrow, title, image{ asset, alt }, body, terms[]{ _key, label, value }, cta${cta} }
    },
    catalog{ eyebrow, heading, intro },
    useCases{ eyebrow, heading },
    oemBanner{ heading, body, cta${cta} },
    factory{ eyebrow, heading, body, image{ asset, alt }, steps[]{ _key, label }, cta${cta} },
    ipProtection{
      eyebrow, heading, intro,
      items[]{ _key, title, lead, body, featured },
      cta${cta}
    },
    insights{ eyebrow, heading },
    finalCta{ heading, body, cta${cta} },
    seo{ metaTitle, metaDescription, ogImage{ asset, alt } }
  }
`)

/**
 * Display-series for the home catalog carousel.
 *
 * After the display-equipment refactor:
 *   - kind filter is removed (all series are display-series)
 *   - uses isActive == true instead of status == "published"
 *   - uses sortOrder instead of order
 */
export const homeSeriesQuery = defineQuery(`
  *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    "cardImage": cardImage{
      asset,
      alt,
      "aspect": asset->metadata.dimensions.aspectRatio
    },
    "skuCount": count(*[
      _type == "product" &&
      coalesce(language, "en") == $language &&
      isActive == true &&
      references(^._id)
    ])
  }
`)

/** Live public catalog totals for the home hero. */
export const homeCatalogStatsQuery = defineQuery(`
  {
    "publishedProducts": count(*[
      _type == "product" &&
      coalesce(language, "en") == "en" &&
      isActive == true
    ]),
    "publishedSeries": count(*[
      _type == "series" &&
      coalesce(language, "en") == "en" &&
      isActive == true &&
      count(*[
        _type == "product" &&
        coalesce(language, "en") == "en" &&
        isActive == true &&
        references(^._id)
      ]) > 0
    ])
  }
`)

/**
 * Printing-service cards for the home carousel and the Header "By Service"
 * mega menu. Both consumers share this projection:
 *
 *   - Home: filters isActive == true, sorts by sortOrder.
 *   - Header: same query, sorts by sortOrder.
 *
 * After the display-equipment refactor the `service` type represents
 * printing services (Custom Fabric Printing, Dye Sublimation, etc.).
 */
export const homeServicesQuery = defineQuery(`
  *[
    _type == "service" &&
    coalesce(language, "en") == $language &&
    isActive == true
  ] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    sortOrder,
    "cardImage": cardImage{ asset, alt }
  }
`)

/**
 * Solutions for the "Built for your setting" tabs. Ordered by creation (which
 * matches the nav order); a settings-driven order is the later, proper fix.
 *
 * `coverImage` resolution order:
 *   1. `coverImage` field on the solution (the operator-controlled 16:9 card
 *      image — preferred, lives next to the slug so the home card is
 *      independent of any pageBuilder layout change)
 *   2. First heroBlock's backgroundImage (legacy fallback — keeps existing
 *      solutions looking right until the operator uploads a coverImage)
 * The front end renders the first non-null value as the home card.
 */
export const homeSolutionsQuery = defineQuery(`
  *[
    _type == "solution" &&
    coalesce(language, "en") == $language &&
    defined(slug.current)
  ] | order(coalesce(sortOrder, 9999) asc, _createdAt asc){
    _id,
    title,
    "slug": slug.current,
    summary,
    audience,
    "coverImage": coalesce(
      coverImage{ asset, alt },
      pageBuilder[_type == "heroBlock"][0].backgroundImage{ asset, alt }
    )
  }
`)

/** Latest 3 posts for the "From our workshop" insights strip. */
export const homePostsQuery = defineQuery(`
  *[
    _type == "post" &&
    coalesce(language, "en") == $language &&
    defined(slug.current)
  ] | order(publishedAt desc)[0...3]{
    _id, title, "slug": slug.current, excerpt, publishedAt, _updatedAt,
    "readingTime": round(length(pt::text(body)) / 1200),
    "cover": coverImage{ asset, alt }
  }
`)
