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
 * Only series with at least one public product are useful navigation targets.
 * The count is derived from products so an operator never has to maintain a
 * second, stale number on the Series document.
 */
export const homeSeriesQuery = defineQuery(`
  *[
    _type == "series" &&
    coalesce(language, "en") == $language &&
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
 * Solutions for the "Built for your setting" tabs. Ordered by creation (which
 * matches the nav order); a settings-driven order is the later, proper fix.
 */
export const homeSolutionsQuery = defineQuery(`
  *[
    _type == "solution" &&
    coalesce(language, "en") == $language &&
    defined(slug.current)
  ] | order(_createdAt asc){
    _id, title, "slug": slug.current, summary, audience
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
