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
 * Series for the home catalog carousel.
 *
 * After the three-tab refactor only product series are eligible for the
 * home strip; `kind == "service"` series live in the Printing tab and
 * `kind == "part"` series live in the Parts tab.
 *
 * Only series with at least one public product are useful navigation targets.
 * The count is derived from products so an operator never has to maintain a
 * second, stale number on the Series document.
 */
export const homeSeriesQuery = defineQuery(`
  *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
    coalesce(kind, "product") == "product" &&
    count(*[
      _type == "product" &&
      coalesce(language, "en") == $language &&
      status == "published" &&
      references(^._id)
    ]) > 0
  ] | order(order asc, title asc){
    _id,
    title,
    "slug": slug.current,
    kind,
    description,
    "image": coalesce(
      image,
      (
        *[
          _type == "product" &&
          coalesce(language, "en") == $language &&
          status == "published" &&
          references(^._id) &&
          defined(mainImage.asset)
        ] | order(order asc, title asc)
      )[0].mainImage,
      (
        *[
          _type == "product" &&
          coalesce(language, "en") == $language &&
          references(^._id) &&
          defined(mainImage.asset)
        ] | order(order asc, title asc)
      )[0].mainImage
    ){ asset, alt },
    "skuCount": count(*[
      _type == "product" &&
      coalesce(language, "en") == $language &&
      status == "published" &&
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
      status == "published"
    ]),
    "publishedSeries": count(*[
      _type == "series" &&
      coalesce(language, "en") == "en" &&
      count(*[
        _type == "product" &&
        coalesce(language, "en") == "en" &&
        status == "published" &&
        references(^._id)
      ]) > 0
    ])
  }
`)

/**
 * Printing-service cards for the home carousel and the Header "By Service"
 * mega menu. Both consumers share this projection:
 *
 *   - Home: filters `displayInHomeCarousel == true`, sorts by `homeOrder`,
 *     shows up to 7 cards (the operator toggles extras off if needed).
 *   - Header: ignores the flag, sorts by `order`, lists every active service.
 *
 * `coverImage` is projected with width 800 / auto-format so the carousel
 * uses the same optimized variant across reloads.
 */
export const homeServicesQuery = defineQuery(`
  *[
    _type == "service" &&
    coalesce(language, "en") == $language
  ] | order(order asc, title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    order,
    homeOrder,
    displayInHomeCarousel,
    "coverImage": coverImage{ asset, alt }
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
  ] | order(_createdAt asc){
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
